import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { normalize } from "./handles";

// What the owner has written, and writing more.
//
// Reading goes through the public route — a profile's posts are public — but
// with the session attached, so a closed profile answers its own owner.
// Writing and deleting are the owner's alone, and the backend decides that
// from the stored row: `AddPost` answers 404 for a number the account does
// not hold, and `DELETE /postlar/{id}` for a post it did not write.

export type Post = components["schemas"]["Post"];

export async function ownPosts(raw: string): Promise<Post[]> {
  const raqam = normalize(raw);
  if (!raqam) return [];
  const { api } = await asReader();
  const { data, error } = await api.GET("/profil/{raqam}/postlar", {
    params: { path: { raqam } },
  });
  if (error || !data) return [];
  return data.postlar ?? [];
}

export type PostResult = "ok" | "empty" | "tooMany" | "notFound" | "server";

export async function writePost(
  raw: string,
  text: string,
): Promise<PostResult> {
  const raqam = normalize(raw);
  if (!raqam) return "notFound";
  const matn = text.trim().slice(0, 1000);
  if (!matn) return "empty";

  const { api } = await asReader();
  try {
    const { error, response } = await api.POST("/profil/{raqam}/postlar", {
      params: { path: { raqam } },
      body: { matn },
    });
    if (!error) return "ok";
    if (response.status === 404) return "notFound";
    if (response.status === 422) return "empty";
    if (response.status === 429) return "tooMany";
    console.error("cabinet: post not written", response.status);
    return "server";
  } catch (cause) {
    console.error("cabinet: post not written", cause);
    return "server";
  }
}

export async function deletePost(id: string): Promise<boolean> {
  // A uuid, or nothing is sent: the id becomes a path segment.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const { api } = await asReader();
  const { error } = await api.DELETE("/postlar/{id}", {
    params: { path: { id } },
  });
  return !error;
}
