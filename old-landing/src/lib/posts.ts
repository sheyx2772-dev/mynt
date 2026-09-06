import "server-only";

import { asReader, backend } from "@/lib/backend/client";

export { MAX_POST_LENGTH } from "@/lib/post-limits";

export type Post = {
  id: string;
  handle: string;
  body: string;
  createdAt: string;
  author: { name: string; avatarUrl: string | null } | null;
};

type BackendPost = {
  id: string;
  raqam: string;
  matn: string;
  vaqt: string;
  ism?: string;
  rasm?: string;
};

// The author travels with the post rather than being fetched afterwards: the
// join is one statement in SQL, where it used to be a second round trip that
// collected every handle on the page and looked them up together.
function toPost(p: BackendPost): Post {
  return {
    id: p.id,
    handle: p.raqam,
    body: p.matn,
    createdAt: p.vaqt,
    author: p.ism ? { name: p.ism, avatarUrl: p.rasm ?? null } : null,
  };
}

export async function listPostsForHandle(handle: string): Promise<Post[]> {
  const { data, error } = await backend.GET("/profil/{raqam}/postlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.postlar ?? []).map(toPost);
}

/** What the numbers somebody follows have posted. */
export async function listFeed(limit = 50): Promise<Post[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/lenta", {
    params: { query: { soni: limit } },
  });
  if (error || !data) return [];

  return (data.postlar ?? []).map(toPost);
}

export type WriteResult =
  | { ok: true; handle: string }
  | { ok: false; error: "empty" | "tooMany" | "notOwned" | "failed" };

/**
 * Writing a post on a number the writer owns.
 *
 * Ownership, the hourly ceiling and the length are all checked in the backend.
 * The form checks the same things so somebody is told before they type a
 * thousand characters — but a form is not a limit.
 */
export async function writePost(handle: string, body: string): Promise<WriteResult> {
  const client = await asReader();
  const { error, response } = await client.POST("/profil/{raqam}/postlar", {
    params: { path: { raqam: handle } },
    body: { matn: body },
  });

  if (!error) return { ok: true, handle };

  switch (response?.status) {
    case 422:
      return { ok: false, error: "empty" };
    case 429:
      return { ok: false, error: "tooMany" };
    case 404:
      return { ok: false, error: "notOwned" };
    default:
      return { ok: false, error: "failed" };
  }
}

/** Taking one down. Answers with the number it was on, so the pages refresh. */
export async function removePost(postId: string): Promise<string | null> {
  const client = await asReader();
  const { data, error } = await client.DELETE("/postlar/{id}", {
    params: { path: { id: postId } },
  });
  return error || !data ? null : data.raqam;
}
