import "server-only";

import { randomBytes } from "node:crypto";
import { after } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";
import {
  isMessageKind,
  isTagKind,
  needsReply,
  noticeTitle,
  type MessageKind,
  type TagKind,
} from "@/lib/tags";

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
  userId: string;
};

/**
 * Resolve a tag from the address printed on it.
 *
 * A retired tag resolves to nothing, which is the point of retiring rather than
 * deleting: a sticker outlives the car it was stuck to, and a message from a
 * sold vehicle should stop here rather than reach somebody who no longer owns
 * it.
 */
export async function getTagByToken(token: string): Promise<TagOwner | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("object_tags")
    .select("id, kind, label, active, handles!inner(normalized, user_id)")
    .eq("token", token)
    .eq("active", true)
    .maybeSingle();

  if (!data) return null;

  const handle = data.handles as unknown as { normalized: string; user_id: string };
  if (!handle?.user_id) return null;
  if (!isTagKind(data.kind)) return null;

  return {
    tagId: data.id as string,
    kind: data.kind,
    label: (data.label as string | null) ?? null,
    handle: handle.normalized,
    userId: handle.user_id,
  };
}

export type SendResult =
  | { ok: true }
  | { ok: false; error: "gone" | "tooSoon" | "needsReply" | "failed" };

export type MessageInput = {
  kind: string;
  body: string;
  replyTo: string;
  place: string;
};

/**
 * Leave a message against somebody's thing.
 *
 * The owner is notified in `after()`: the sender is standing in a street
 * waiting for the page to say something, and a Telegram round trip must not be
 * what keeps them there.
 */
export async function sendTagMessage(
  token: string,
  input: MessageInput,
): Promise<SendResult> {
  if (!supabaseAdmin) return { ok: false, error: "failed" };
  if (!isMessageKind(input.kind)) return { ok: false, error: "failed" };

  const found = await getTagByToken(token);
  if (!found) return { ok: false, error: "gone" };

  const replyTo = input.replyTo.trim().slice(0, 60) || null;

  // Refused rather than accepted-and-dropped: a found dog reported with no way
  // back is a message that helps nobody, and the sender is the only person who
  // can still fix that — while they are still on the page.
  if (needsReply(input.kind) && !replyTo) return { ok: false, error: "needsReply" };

  const ip = await getClientIp();

  if (ip) {
    const since = new Date(Date.now() - REPEAT_WINDOW_MS).toISOString();
    const { count: repeats } = await supabaseAdmin
      .from("tag_messages")
      .select("id", { count: "exact", head: true })
      .eq("tag_id", found.tagId)
      .eq("ip", ip)
      .gte("created_at", since);

    if ((repeats ?? 0) > 0) return { ok: false, error: "tooSoon" };

    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count: recent } = await supabaseAdmin
      .from("tag_messages")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", hourAgo);

    if ((recent ?? 0) >= PER_IP_PER_HOUR) return { ok: false, error: "tooSoon" };
  }

  const body = input.body.trim().slice(0, 500) || null;
  const place = input.place.trim().slice(0, 200) || null;

  const { error } = await supabaseAdmin.from("tag_messages").insert({
    tag_id: found.tagId,
    kind: input.kind,
    body,
    reply_to: replyTo,
    place,
    ip,
  });

  if (error) return { ok: false, error: "failed" };

  after(async () => {
    await notify({
      userId: found.userId,
      kind: "tag_message",
      handle: found.handle,
      title: noticeTitle(found.kind, input.kind as MessageKind, found.label, "uz"),
      // Everything actionable on one line, because this is read on a lock
      // screen by somebody who may be about to go downstairs.
      body: [place, body, replyTo].filter(Boolean).join(" · ") || null,
      href: `/kabinet/${found.handle}/buyumlar`,
    });
  });

  return { ok: true };
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
  id: number;
  tagId: string;
  kind: MessageKind;
  body: string | null;
  replyTo: string | null;
  place: string | null;
  readAt: string | null;
  createdAt: string;
};

async function ownedHandleId(handle: string, userId: string): Promise<string | null> {
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("handles")
    .select("id")
    .eq("normalized", handle)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.id ?? null;
}

export async function listTags(handle: string, userId: string): Promise<Tag[]> {
  if (!supabaseAdmin) return [];

  const handleId = await ownedHandleId(handle, userId);
  if (!handleId) return [];

  const { data } = await supabaseAdmin
    .from("object_tags")
    .select("id, token, kind, label, active, created_at")
    .eq("handle_id", handleId)
    .order("created_at", { ascending: false });

  const tags = (data ?? []).filter((row) => isTagKind(row.kind));
  if (tags.length === 0) return [];

  // One query for the unread counts rather than one per tag: a page that runs
  // a query per row is a page that gets slower as somebody buys more tags.
  const { data: unread } = await supabaseAdmin
    .from("tag_messages")
    .select("tag_id")
    .in("tag_id", tags.map((t) => t.id as string))
    .is("read_at", null);

  const counts = new Map<string, number>();
  for (const row of unread ?? []) {
    const id = row.tag_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return tags.map((row) => ({
    id: row.id as string,
    token: row.token as string,
    kind: row.kind as TagKind,
    label: (row.label as string | null) ?? null,
    active: Boolean(row.active),
    createdAt: row.created_at as string,
    unread: counts.get(row.id as string) ?? 0,
  }));
}

export async function listTagMessages(
  handle: string,
  userId: string,
  limit = 100,
): Promise<TagMessage[]> {
  if (!supabaseAdmin) return [];

  const handleId = await ownedHandleId(handle, userId);
  if (!handleId) return [];

  const { data: tags } = await supabaseAdmin
    .from("object_tags")
    .select("id")
    .eq("handle_id", handleId);

  const ids = (tags ?? []).map((t) => t.id as string);
  if (ids.length === 0) return [];

  const { data } = await supabaseAdmin
    .from("tag_messages")
    .select("id, tag_id, kind, body, reply_to, place, read_at, created_at")
    .in("tag_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? [])
    .filter((row) => isMessageKind(row.kind))
    .map((row) => ({
      id: row.id as number,
      tagId: row.tag_id as string,
      kind: row.kind as MessageKind,
      body: (row.body as string | null) ?? null,
      replyTo: (row.reply_to as string | null) ?? null,
      place: (row.place as string | null) ?? null,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
    }));
}

export async function createTag(
  handle: string,
  userId: string,
  kind: string,
  label: string,
): Promise<{ ok: boolean; token?: string }> {
  if (!supabaseAdmin || !isTagKind(kind)) return { ok: false };

  const handleId = await ownedHandleId(handle, userId);
  if (!handleId) return { ok: false };

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const trimmed = label.trim().slice(0, 60);

  const { error } = await supabaseAdmin.from("object_tags").insert({
    handle_id: handleId,
    token,
    kind,
    label: trimmed || null,
  });

  return error ? { ok: false } : { ok: true, token };
}

/** Stop a tag answering without destroying what came through it. */
export async function setTagActive(
  handle: string,
  userId: string,
  tagId: string,
  active: boolean,
): Promise<boolean> {
  if (!supabaseAdmin) return false;

  const handleId = await ownedHandleId(handle, userId);
  if (!handleId) return false;

  const { data } = await supabaseAdmin
    .from("object_tags")
    .update({ active })
    .eq("id", tagId)
    .eq("handle_id", handleId)
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

export async function markMessagesRead(handle: string, userId: string): Promise<void> {
  if (!supabaseAdmin) return;

  const handleId = await ownedHandleId(handle, userId);
  if (!handleId) return;

  const { data: tags } = await supabaseAdmin
    .from("object_tags")
    .select("id")
    .eq("handle_id", handleId);

  const ids = (tags ?? []).map((t) => t.id as string);
  if (ids.length === 0) return;

  await supabaseAdmin
    .from("tag_messages")
    .update({ read_at: new Date().toISOString() })
    .in("tag_id", ids)
    .is("read_at", null);
}
