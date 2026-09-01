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
