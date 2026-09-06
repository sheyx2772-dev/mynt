"use server";

import { revalidatePath } from "next/cache";

import { saveProfile, type SaveResult } from "@/lib/cabinet/profile";
import { decideRequest } from "@/lib/cabinet/requests";

// The two switches and the door.
//
// A switch is one boolean, but the backend takes the whole profile; each of
// these reads the stored row and sends it back with one field changed, so a
// call from the browser cannot rewrite anything but the field it names. The
// number is a bound argument from the page's own address and is checked
// against the session on the backend; nothing in the call identifies the
// caller except the cookie.

export async function setClosed(
  raqam: string,
  closed: boolean,
): Promise<SaveResult> {
  const result = await saveProfile(raqam, (p) => ({ ...p, yopiq: closed }));
  if (result === "ok") revalidatePath("/[locale]/cabinet", "layout");
  return result;
}

export async function setCommentsOpen(
  raqam: string,
  open: boolean,
): Promise<SaveResult> {
  const result = await saveProfile(raqam, (p) => ({
    ...p,
    commentsOpen: open,
  }));
  if (result === "ok") revalidatePath("/[locale]/cabinet", "layout");
  return result;
}

/** Let one person in, or not. The user id is theirs, sent back as it arrived. */
export async function decide(
  raqam: string,
  user: string,
  accept: boolean,
): Promise<boolean> {
  const done = await decideRequest(raqam, user, accept);
  if (done) revalidatePath("/[locale]/cabinet", "layout");
  return done;
}
