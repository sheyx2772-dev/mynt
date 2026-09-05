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
