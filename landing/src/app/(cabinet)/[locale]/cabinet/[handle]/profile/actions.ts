"use server";

import { revalidatePath } from "next/cache";

import { readLinkInput } from "@/lib/cabinet/links";
import { saveProfile, type SaveResult } from "@/lib/cabinet/profile";

// Saving the profile form.
//
// Every field below arrives from a browser and is cut to what the backend
// accepts here, before it is sent — `maxlength` on an input is a courtesy to
// the person typing, not a control, and a poster who skips the page skips it.
// The backend validates again and refuses what it will not render; this is
// the first cut, not the last.
//
// The number comes from the bound argument, which the page took from its own
// address, and is checked by the backend against the session on the PUT. An
// id in the form would be a claim; there is none.
export type ProfileState = { result?: SaveResult };

const MAX_SERVICES = 8;

export async function updateProfile(
  raqam: string,
  _previous: ProfileState,
  form: FormData,
): Promise<ProfileState> {
  const get = (name: string) => String(form.get(name) ?? "");
  const text = (name: string, max: number) => get(name).trim().slice(0, max);

  // Rows come as parallel arrays; empty names are dropped, and the plan's
  // own limit is applied by the backend from the stored row, not from here.
  const names = form.getAll("service_name").map(String);
  const prices = form.getAll("service_price").map(String);
  const services = names
    .map((name, i) => ({
      name: name.trim().slice(0, 60),
      price: (prices[i] ?? "").trim().slice(0, 40),
    }))
    .filter((s) => s.name)
    .slice(0, MAX_SERVICES);

  const result = await saveProfile(raqam, (current) => ({
    ...current,
    name: text("name", 80),
    position: text("position", 80),
    company: text("company", 80),
    city: text("city", 60),
    bio: text("bio", 280),
    tags: text("tags", 200),
    phone: text("phone", 30),
    contactEmail: text("contactEmail", 120),
    avatarUrl: text("avatarUrl", 500),
    bannerUrl: text("bannerUrl", 500),
    links: readLinkInput(get),
    services,
  }));

  if (result === "ok") revalidatePath("/[locale]/cabinet", "layout");
  return { result };
}
