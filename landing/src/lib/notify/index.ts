import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { telegramChannel } from "./telegram";
import type { Notice, Channel } from "./types";

export type { Notice, NotificationKind } from "./types";

// Recording a notice, then delivering it.
//
// The order matters and is deliberate: the row is written first and the channels
// run afterwards. A notice that was recorded but not delivered is a notice the
// owner still finds in their cabinet; one that was delivered but not recorded is
// gone the moment the message scrolls away.

/**
 * Every channel that could deliver. Email is missing on purpose rather than by
 * oversight: transactional mail needs a provider and a verified domain, and the
 * domain is not pointed yet. When it is, it is one more entry here.
 */
const CHANNELS: Channel[] = [telegramChannel];

export async function notify(notice: Notice): Promise<void> {
  if (!supabaseAdmin) return;

  // Recorded first, and on its own: if the insert fails there is nothing to
  // deliver, and if delivery fails the record still stands.
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: notice.userId,
    kind: notice.kind,
    handle: notice.handle ?? null,
    title: notice.title,
    body: notice.body ?? null,
    href: notice.href ?? null,
  });

  if (error) return;

  const { data: settings } = await supabaseAdmin
    .from("notification_settings")
    .select("telegram_chat_id, lead_alerts, plan_alerts")
    .eq("user_id", notice.userId)
    .maybeSingle();

  // No settings row is the normal state for somebody who has never linked
  // anything. They still have the notice; there is simply nowhere to push it.
  if (!settings) return;

  // A table waiting for a waiter is the same kind of event as a lead — somebody
  // is in front of the product right now — so it follows the same switch rather
  // than the one about invoices.
  const live = notice.kind === "lead" || notice.kind === "venue_request";
  const wanted = live ? settings.lead_alerts !== false : settings.plan_alerts !== false;
  if (!wanted) return;

  const target = {
    telegramChatId: (settings.telegram_chat_id as number) ?? null,
    email: null,
  };

  // Channels run together and none of them can fail the caller: a lead being
  // saved must not depend on Telegram being up.
  await Promise.all(CHANNELS.map((channel) => channel.send(notice, target)));
}

export type StoredNotification = {
  id: number;
  kind: string;
  handle: string | null;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(userId: string): Promise<StoredNotification[]> {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("notifications")
    .select("id, kind, handle, title, body, href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id as number,
    kind: row.kind as string,
    handle: (row.handle as string) ?? null,
    title: row.title as string,
    body: (row.body as string) ?? null,
    href: (row.href as string) ?? null,
    readAt: (row.read_at as string) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function markAllRead(userId: string): Promise<void> {
  if (!supabaseAdmin) return;

  await supabaseAdmin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}
