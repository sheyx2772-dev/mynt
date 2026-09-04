import { after } from "next/server";
import { sendPlanReminders, sendVenuePlanReminders } from "@/lib/notify/reminders";

// The daily reminder run.
//
// A route rather than a worker because the whole platform is one deployment,
// and Vercel's scheduler calls a URL. That makes the URL the security problem:
// anyone can request it, and a reminder sent by a stranger at three in the
// morning is a reminder wasted for the month.
//
// So it needs the secret the scheduler is configured with. Without one set, the
// route refuses everybody rather than defaulting open — an endpoint that is
// only safe because nobody has guessed the path is not safe.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  // The scheduler wants an answer, not a report. Doing the work after the
  // response keeps a slow Telegram from turning into a timed-out cron that
  // gets retried and sends everything twice.
  after(async () => {
    // Sequential, not parallel: both walk the same notification channel, and a
    // burst of Telegram calls is the one way this run gets rate limited.
    await sendPlanReminders();
    await sendVenuePlanReminders();
  });

  return Response.json({ ok: true });
}
