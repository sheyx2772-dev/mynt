"use server";

import { revalidatePath } from "next/cache";

import { requireOwnHandle } from "@/lib/kabinet";
import {
  addContact,
  deleteBrief,
  listContacts,
  saveBrief,
  updateContact,
} from "@/lib/contacts";
import { briefFor } from "@/lib/ai/network-brief";
import { isStage } from "@/lib/crm";

const PATH = "/kabinet/[handle]/tarmoq";

export type NetworkState = { error?: string; done?: true };

/**
 * Ask the assistant to read the list.
 *
 * Only ever runs because somebody pressed the button — that press is the
 * consent to send anything at all, and there is no setting that makes it
 * happen quietly in the background.
 */
export async function buildBrief(
  _previous: NetworkState,
  form: FormData,
): Promise<NetworkState> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  const contacts = await listContacts(normalized, userId);
  if (contacts.length < 4) {
    return { error: "Tahlil uchun kamida to'rtta kontakt kerak." };
  }

  const brief = await briefFor(contacts);
  if (!brief) {
    // Every failure looks the same from here: no key, a busy vendor, a refusal.
    // None of them is the owner's problem to diagnose.
    return { error: "Hozir tahlil qilib bo'lmadi. Birozdan keyin urinib ko'ring." };
  }

  await saveBrief(normalized, userId, brief, contacts.length);
  revalidatePath(`/kabinet/${normalized}/tarmoq`);
  return { done: true };
}

/** Withdraw it. The only thing that was ever stored, removed. */
export async function dropBrief(form: FormData): Promise<void> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  await deleteBrief(normalized, userId);
  revalidatePath(`/kabinet/${normalized}/tarmoq`);
}

export async function moveStage(form: FormData): Promise<void> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  const id = Number(form.get("contactId"));
  const stage = String(form.get("stage") ?? "");
  if (!Number.isInteger(id) || !isStage(stage)) return;

  await updateContact(normalized, userId, id, { stage });
  revalidatePath(`/kabinet/${normalized}/tarmoq`);
}

export async function saveContactNote(form: FormData): Promise<void> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  const id = Number(form.get("contactId"));
  if (!Number.isInteger(id)) return;

  const note = String(form.get("ownerNote") ?? "").trim();
  const followUp = String(form.get("followUpOn") ?? "").trim();

  await updateContact(normalized, userId, id, {
    ownerNote: note ? note.slice(0, 2000) : null,
    // An empty date box is the owner taking them out of the diary, which is a
    // decision and not a no-op.
    followUpOn: /^\d{4}-\d{2}-\d{2}$/.test(followUp) ? followUp : null,
  });
  revalidatePath(`/kabinet/${normalized}/tarmoq`);
}

export async function addManualContact(
  _previous: NetworkState,
  form: FormData,
): Promise<NetworkState> {
  const { normalized, userId } = await requireOwnHandle(
    String(form.get("handle") ?? ""),
    PATH,
  );

  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const company = String(form.get("company") ?? "").trim();

  if (name.length < 2) return { error: "Ismni yozing." };
  // The same rule the table has held since 0021: a contact with no way to
  // answer it is not a contact.
  if (!phone && !email) return { error: "Telefon yoki email kerak." };

  const ok = await addContact(normalized, userId, {
    name: name.slice(0, 80),
    phone: phone || null,
    email: email || null,
    company: company ? company.slice(0, 80) : null,
  });

  if (!ok) return { error: "Saqlanmadi. Yana urinib ko'ring." };

  revalidatePath(`/kabinet/${normalized}/tarmoq`);
  return { done: true };
}
