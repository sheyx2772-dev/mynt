import "server-only";

import { cookies } from "next/headers";

import { backend } from "./client";
import { SESSION_COOKIE } from "./session";

export type Post = {
  id: string;
  /** The number that wrote it, and so the profile it links to. */
  handle: string;
  body: string;
  at: string;
  authorName?: string;
  authorPhoto?: string;
};

/**
 * Three answers, because the page has three things to say.
 *
 * "Nobody is signed in" is not an error and not an empty feed — it is a reader
 * who has not told us who they are, and the page owes them an explanation and a
 * way in. "The backend did not answer" is not an empty feed either: an empty
 * column would say the numbers they follow have written nothing, which is a
 * claim about other people made on the strength of a timeout. Collapsing the
 * three into `Post[]` is what makes both of those lies cheap to tell.
 */
export type Feed =
  | { state: "anonymous" }
  | { state: "down" }
  | { state: "ready"; posts: Post[] };

/** A screenful. More than anybody scrolls in one visit, and one round trip. */
const LIMIT = 50;

/**
 * What the numbers this reader follows have posted.
 *
 * SECURITY — the identity is the session, and only the session. There is no
 * handle or user id in this call: the backend reads the token, decides whose
 * feed this is, and filters the query by it. A caller cannot ask for somebody
 * else's feed because there is nowhere in the request to say whose.
 *
 * SECURITY — the session cookie is forwarded by name, not by copying the
 * reader's `Cookie` header. The jar for this site also holds the language
 * choice and whatever lands there later, and forwarding the lot hands the
 * backend data it did not ask for and gives a cookie added next year a path
 * into an API request nobody reviewed. The token itself stays on the server:
 * `server-only` keeps this module out of the browser bundle, and the value is
 * never rendered, never logged and never put in a URL.
 *
 * SECURITY — `no-store`, and this is the reason rather than a habit. Next's
 * fetch cache is keyed by URL and request options, not by who asked: a `/lenta`
 * response held for even a minute would be handed to the next signed-in reader
 * as their own feed. `profile.ts` next door caches happily for the opposite
 * reason — a public profile is the same page for everybody.
 *
 * An absent cookie is answered without asking. The backend would say 401, and
 * a round trip to Frankfurt to be told what the empty cookie jar already said
 * is a round trip on every signed-out visit to this page.
 */
export async function feed(): Promise<Feed> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { state: "anonymous" };

  try {
    const { data, error, response } = await backend.GET("/lenta", {
      params: { query: { soni: LIMIT } },
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      cache: "no-store",
    });

    // An expired session is somebody signed out, not something broken. They
    // get the page that explains the feed, which is also the page with the
    // sign-in link on it.
    if (response.status === 401 || response.status === 403) {
      return { state: "anonymous" };
    }
    if (error || !data) return { state: "down" };

    return {
      state: "ready",
      // `postlar` is null when empty. A caller that has to remember which of
      // its fields lie about emptiness is a caller that will forget.
      posts: (data.postlar ?? []).map((p) => ({
        id: p.id,
        handle: p.raqam,
        body: p.matn,
        at: p.vaqt,
        // The author travels with the post rather than being looked up after,
        // because the join is one statement in SQL and fifty round trips here.
        authorName: p.ism || undefined,
        authorPhoto: p.rasm || undefined,
      })),
    };
  } catch {
    // A refused connection or a timeout throws out of `fetch` rather than
    // arriving as a status. Same answer: we do not know.
    return { state: "down" };
  }
}
