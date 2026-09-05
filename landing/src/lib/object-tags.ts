import "server-only";

import { asReader, backend } from "@/lib/backend/client";

import { randomBytes } from "node:crypto";
import { after } from "next/server";

import { getClientIp } from "@/lib/client-ip";
import {
  isMessageKind,
  isTagKind,
  needsReply,
  noticeTitle,
  type MessageKind,
  type TagKind,
} from "@/lib/tags";

export type { TagKind, MessageKind } from "@/lib/tags";

// Tags on things, and the messages strangers leave against them.
//
// The sender has no account and no session, so everything here is written under
// the service role and everything they send is treated as hostile: trimmed
// hard, length-capped, and rate limited by address. What the owner is shown is
// the message and the sender's own contact if they chose to leave one — never
// anything the sender did not knowingly type.

/** Long enough that nobody finds a tag by trying, short enough to print. */
const TOKEN_BYTES = 16;

/**
 * The same person pressing the same button twice.
 *
 * Somebody standing at a car presses once, then presses again because nothing
 * visibly happened. That is one message. Two minutes is longer than the second
 * press and shorter than a genuine second errand.
 */
const REPEAT_WINDOW_MS = 2 * 60 * 1000;

/** A ceiling per address per hour, so one bored person is not a broadcast. */
const PER_IP_PER_HOUR = 8;

export type TagOwner = {
  tagId: string;
  kind: TagKind;
  label: string | null;
  handle: string;
};

/**
 * Resolve a tag from the address printed on it.
 *
 * A retired tag resolves to nothing, which is the point of retiring rather than
 * deleting: a sticker outlives the car it was stuck to, and a message from a
 * sold vehicle should stop here rather than reach somebody who no longer owns
 * it.
 */
/**
 * The tag behind a sticker's address.
 *
 * The token is the whole credential, the way the counter link is. It has to
 * be: the person tapping it has no account and never will, and asking them to
 * sign in to say the wifi is down is asking them not to bother. A switched-off
 * tag is not found — somebody who peels a sticker off a table expects it to
 * stop working.
 */
export async function getTagByToken(token: string): Promise<TagOwner | null> {
  const { data, error } = await backend.GET("/teg/{kalit}", {
    params: { path: { kalit: token } },
  });
  if (error || !data?.teg) return null;

  const t = data.teg;
  if (!isTagKind(t.turi)) return null;

  return {
    tagId: t.id,
    kind: t.turi,
    label: t.nom || null,
    handle: t.raqam ?? "",
  };
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendTagMessage(
  token: string,
  kind: MessageKind,
  body: string,
  replyTo?: string,
  place?: string,
): Promise<SendResult> {
  const { error } = await backend.POST("/teg/{kalit}/xabar", {
    params: { path: { kalit: token } },
    body: {
      turi: kind,
      matn: body,
      javob_uchun: replyTo || undefined,
      joy: place || undefined,
    },
  });
  return error ? { ok: false, error: "Yuborib bo'lmadi." } : { ok: true };
}

export type Tag = {
  id: string;
  token: string;
  kind: TagKind;
  label: string | null;
  active: boolean;
  createdAt: string;
  unread: number;
};

export type TagMessage = {
  id: string;
  tagId: string;
  tagLabel: string | null;
  kind: MessageKind;
  body: string | null;
  replyTo: string | null;
  place: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export async function listTags(handle: string): Promise<{ tags: Tag[]; unread: number }> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/teglar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return { tags: [], unread: 0 };

  return {
    tags: (data.teglar ?? []).map((t) => ({
      id: t.id,
      token: t.kalit ?? "",
      kind: t.turi as TagKind,
      label: t.nom || null,
      active: t.faol,
      createdAt: t.yaratilgan,
      unread: t.oqilmagan ?? 0,
    })),
    unread: data.oqilmagan,
  };
}

export async function listTagMessages(handle: string): Promise<TagMessage[]> {
  const client = await asReader();
  const { data, error } = await client.GET("/raqamlar/{raqam}/xabarlar", {
    params: { path: { raqam: handle } },
  });
  if (error || !data) return [];

  return (data.xabarlar ?? []).map((m) => ({
    id: m.id,
    tagId: m.teg_id ?? "",
    tagLabel: m.teg || null,
    kind: m.turi as MessageKind,
    body: m.matn || null,
    replyTo: m.javob_uchun || null,
    place: m.joy || null,
    read: m.oqilgan,
    // The moment, for a page that shows it; the flag, for one that only asks.
    readAt: m.oqilgan ? m.vaqt : null,
    createdAt: m.vaqt,
  }));
}

export async function createTag(handle: string, kind: TagKind, label: string): Promise<Tag | null> {
  const client = await asReader();
  const { data, error } = await client.POST("/raqamlar/{raqam}/teglar", {
    params: { path: { raqam: handle } },
    body: { turi: kind, nom: label },
  });
  if (error || !data?.teg) return null;

  const t = data.teg;
  return {
    id: t.id,
    token: t.kalit ?? "",
    kind: t.turi as TagKind,
    label: t.nom || null,
    active: t.faol,
    createdAt: t.yaratilgan,
    unread: 0,
  };
}

export async function setTagActive(id: string, active: boolean): Promise<boolean> {
  const client = await asReader();
  const { error } = await client.PUT("/teglar/{id}/faol", {
    params: { path: { id } },
    body: { faol: active },
  });
  return !error;
}

export async function markMessagesRead(handle: string): Promise<void> {
  const client = await asReader();
  await client.POST("/raqamlar/{raqam}/xabarlar/oqildi", {
    params: { path: { raqam: handle } },
  });
}
