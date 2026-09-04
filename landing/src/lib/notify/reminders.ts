import "server-only";

import { supabaseAdmin } from "@/lib/supabase/admin";
import { notify } from "./index";

// Reminding people before their plan runs out.
//
// The message is the easy half. The hard half is not sending it every day for
// the week before expiry, which is why the database records what was already
// sent and records it against the expiry it was sent for — a renewal moves the
// expiry and therefore earns a fresh reminder next period, rather than
// silencing the account forever.

/** Far enough ahead to act on, close enough to be about this month. */
export const REMIND_DAYS_BEFORE = 7;

function daysUntil(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

export type ReminderRun = { checked: number; sent: number };

export async function sendPlanReminders(now: Date = new Date()): Promise<ReminderRun> {
  if (!supabaseAdmin) return { checked: 0, sent: 0 };

  const { data, error } = await supabaseAdmin.rpc("handles_needing_plan_reminder", {
    days: REMIND_DAYS_BEFORE,
  });

  if (error || !data) return { checked: 0, sent: 0 };

  let sent = 0;

  for (const row of data as { normalized: string; user_id: string; expires_at: string }[]) {
    const left = daysUntil(row.expires_at, now);

    await notify({
      userId: row.user_id,
      kind: "plan_expiring",
      handle: row.normalized,
      title: `${row.normalized} — premium ${left} kundan keyin tugaydi`,
      // What actually stops, in the words of what they will miss, rather than
      // "your subscription is ending". Somebody who cannot picture the loss
      // does not renew.
      body:
        "Statistika, kelgan kontaktlar va oltin bezak to'xtaydi. " +
        "Raqamingiz va profilingiz ochiq qoladi.",
      href: "/tarif",
    });

    // Marked only after the notice exists, so a run that dies halfway leaves
    // the reminder outstanding rather than swallowed.
    await supabaseAdmin.rpc("mark_plan_reminded", {
      target_handle: row.normalized,
      for_expiry: row.expires_at,
    });

    sent += 1;
  }

  return { checked: (data as unknown[]).length, sent };
}

// A venue's month running out is a different event from a personal plan's.
//
// What lapses is not a decoration: the call button disappears from every table
// in the room, and the owner would otherwise learn that from a waiter. So there
// are two notices rather than one — the warning, and the day it happens — and
// the second is sent even though the first was, because the second is the one
// that gets a venue back.

/** How long after a lapse it is still news worth sending. */
export const ANNOUNCE_LAPSE_WITHIN_DAYS = 3;

type VenueRow = {
  venue_id: string;
  handle: string;
  user_id: string;
  name: string;
  expires_at: string;
};

export async function sendVenuePlanReminders(now: Date = new Date()): Promise<ReminderRun> {
  if (!supabaseAdmin) return { checked: 0, sent: 0 };

  let checked = 0;
  let sent = 0;

  const { data: expiring } = await supabaseAdmin.rpc("venues_needing_plan_reminder", {
    days: REMIND_DAYS_BEFORE,
  });

  for (const row of (expiring ?? []) as VenueRow[]) {
    checked += 1;
    const left = daysUntil(row.expires_at, now);

    await notify({
      userId: row.user_id,
      kind: "plan_expiring",
      handle: row.handle,
      title: `${row.name} — obuna ${left} kundan keyin tugaydi`,
      // Named as the thing they will miss, not as an administrative state.
      // Somebody who cannot picture the loss does not renew.
      body:
        "Stollardagi chaqiruv tugmasi va hisobot to'xtaydi. " +
        "Menyu mehmonlarga ochiq qoladi.",
      href: `/kabinet/${row.handle}/obuna`,
    });

    // Marked only after the notice exists, so a run that dies halfway leaves
    // the reminder outstanding rather than swallowed.
    await supabaseAdmin.rpc("mark_venue_reminded", {
      target: row.venue_id,
      for_expiry: row.expires_at,
    });

    sent += 1;
  }

  const { data: lapsed } = await supabaseAdmin.rpc("venues_just_expired", {
    days: ANNOUNCE_LAPSE_WITHIN_DAYS,
  });

  for (const row of (lapsed ?? []) as VenueRow[]) {
    checked += 1;

    await notify({
      userId: row.user_id,
      kind: "plan_expired",
      handle: row.handle,
      title: `${row.name} — obuna tugadi`,
      // Present tense and specific, because it has already happened and the
      // owner needs to know exactly what a guest now sees.
      body:
        "Chaqiruv tugmasi stollardan olib tashlandi va hisobot yopildi. " +
        "Menyu ishlayapti — to'lovdan keyin hammasi joyiga qaytadi.",
      href: `/kabinet/${row.handle}/obuna`,
    });

    await supabaseAdmin.rpc("mark_venue_expired_told", {
      target: row.venue_id,
      for_expiry: row.expires_at,
    });

    sent += 1;
  }

  return { checked, sent };
}
