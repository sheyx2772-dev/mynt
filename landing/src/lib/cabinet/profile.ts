import "server-only";

import { asReader } from "@/lib/backend/reader";
import type { components } from "@/lib/backend/schema";
import { toLinkInput } from "./links";
import { ownedHandle, type OwnedHandle } from "./handles";

// Saving a profile, one field at a time, against a backend that takes all of it.
//
// `PUT /raqamlar/{raqam}/profil` replaces the whole profile: the name is
// required, and the two switches are sent every time because an absent
// boolean is indistinguishable from off. So the privacy page, the theme
// picker and the edit form all go through here — each hands over the one
// thing it changed, and the rest is read fresh from the stored row and sent
// back unchanged. A form that carried the whole profile in hidden fields
// would be a form that let the browser rewrite the parts it was not shown.
//
// The read is the ownership check. `ownedHandle` is a filtered query: a
// number this account does not hold is null here, and the PUT is never made.

export type ProfileInput = components["schemas"]["ProfileInput"];

/** What the edit form opens on: the stored row, as the backend wants it back. */
export function toProfileInput(h: OwnedHandle): ProfileInput {
  return {
    name: h.ism,
    bio: h.bio,
    position: h.lavozim,
    company: h.kompaniya,
    city: h.shahar,
    phone: h.telefon,
    contactEmail: h.email,
    tags: (h.teglar ?? []).join(", "),
    links: toLinkInput(h.havolalar),
    services: h.xizmatlar ?? [],
    avatarUrl: h.rasm,
    bannerUrl: h.banner,
    cardDesign: h.dizayn,
    deviceType: h.qurilma,
    commentsOpen: h.izohlar_ochiq,
    yopiq: h.yopiq,
  };
}

export type SaveResult = "ok" | "notFound" | "invalid" | "server";

/**
 * Apply a change to one of this account's numbers.
 *
 * Returns a word, not a sentence: the caller translates it. The backend's
 * status and problem document go to the log, because a form that prints them
 * is a form that maps our network for whoever asked it to.
 */
export async function saveProfile(
  raw: string,
  change: (current: ProfileInput) => ProfileInput,
): Promise<SaveResult> {
  const handle = await ownedHandle(raw);
  if (!handle) return "notFound";

  const { api } = await asReader();
  try {
    const { error, response } = await api.PUT("/raqamlar/{raqam}/profil", {
      params: { path: { raqam: handle.raqam } },
      body: change(toProfileInput(handle)),
    });
    if (!error) return "ok";
    if (response.status === 404) return "notFound";
    if (response.status === 422) return "invalid";
    console.error("cabinet: profile not saved", response.status, error);
    return "server";
  } catch (cause) {
    console.error("cabinet: profile not saved", cause);
    return "server";
  }
}
