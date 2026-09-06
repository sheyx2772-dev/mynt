"use server";

import { revalidatePath } from "next/cache";

import { deletePost, writePost, type PostResult } from "@/lib/cabinet/posts";

// Writing and removing posts.
//
// The number is bound from the page's address; whether this account may post
// to it is decided by the backend from the stored row (`AddPost` answers 404
// for anybody else). A delete carries only the post id, and the backend
// deletes it only if this session wrote it. Neither call names a user.

export type ComposeState = { result?: PostResult; key: number };

export async function compose(
  raqam: string,
  previous: ComposeState,
  form: FormData,
): Promise<ComposeState> {
  const result = await writePost(raqam, String(form.get("text") ?? ""));
  if (result === "ok")
    revalidatePath("/[locale]/cabinet/[handle]/posts", "page");
  // The key changes on success so the composer can reset its textarea.
  return { result, key: result === "ok" ? previous.key + 1 : previous.key };
}

export async function remove(id: string): Promise<boolean> {
  const done = await deletePost(id);
  if (done) revalidatePath("/[locale]/cabinet/[handle]/posts", "page");
  return done;
}
