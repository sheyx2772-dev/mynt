"use server";

import { revalidatePath } from "next/cache";

import { askForDesign, type AskResult } from "@/lib/cabinet/design";
import { saveProfile, type SaveResult } from "@/lib/cabinet/profile";
import { themeEntry } from "@/lib/cabinet/themes";

// Choosing the look.
//
// The id is matched against the catalogue before it is sent, so what reaches
// the backend is one of the ten it stores — and the backend checks again
// against its own list and falls back to "genesis" for anything else. Two
// lists, same ten, on purpose (see `lib/cabinet/themes.ts`).
export async function chooseTheme(
  raqam: string,
  id: string,
): Promise<SaveResult> {
  const chosen = themeEntry(id).id;
  const result = await saveProfile(raqam, (p) => ({
    ...p,
    cardDesign: chosen,
  }));
  if (result === "ok") revalidatePath("/[locale]/cabinet", "layout");
  return result;
}

// Asking for a design of one's own.
//
// The wish is text and only text; it is cut to the column's limit here and
// checked again on the backend. Which number it is for is the bound argument
// from the page's own address, and whether this account holds it is decided
// by the backend's insert, which selects the row by owner.
export type AskState = { result?: AskResult; key: number };

export async function askDesign(
  raqam: string,
  previous: AskState,
  form: FormData,
): Promise<AskState> {
  const result = await askForDesign(raqam, String(form.get("wish") ?? ""));
  if (result === "ok")
    revalidatePath("/[locale]/cabinet/[handle]/theme", "page");
  return { result, key: result === "ok" ? previous.key + 1 : previous.key };
}
