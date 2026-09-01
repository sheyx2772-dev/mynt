import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import TelegramLink from "@/components/TelegramLink";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/notify";
import { getLinkState } from "@/lib/notify/link";
import { isTelegramConfigured } from "@/lib/notify/telegram";
import { timeAgo } from "@/lib/relative-time";
import { dismissAll } from "./actions";

export const metadata: Metadata = {
  title: "Xabarlar — flex.com.uz",
  robots: { index: false },
};

export default async function XabarlarPage() {
  const user = await requireUser("/kabinet/xabarlar");

  const [notifications, linkState] = await Promise.all([
    listNotifications(user.id),
    getLinkState(user.id),
  ]);

  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <PageShell>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Xabarlar</h1>
        {unread > 0 && (
          <form action={dismissAll}>
            <button className="text-sm text-flex-black/45 underline underline-offset-2">
              Hammasini o&apos;qilgan deb belgilash
            </button>
          </form>
        )}
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Telegram</h2>
        <div className="mt-3">
          {isTelegramConfigured ? (
            <TelegramLink
              initial={linkState}
              botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? null}
            />
          ) : (
            /* The bot is not configured. Saying so beats a button that opens a
               screen with no code on it. */
            <p className="text-sm text-flex-black/50">
              Telegram xabarnomalari hali ulanmagan.
            </p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[1.75rem] border border-black/10 bg-white p-7 shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Barchasi</h2>

        {notifications.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-black/12 px-4 py-6 text-center text-sm text-flex-black/45">
            Hali xabar yo&apos;q.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-black/5">
            {notifications.map((n) => {
              const row = (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={n.readAt ? "text-flex-black/60" : "font-medium"}>
                      {n.title}
                    </p>
                    <p className="font-tabular text-xs text-flex-black/35">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-sm break-words text-flex-black/55">{n.body}</p>
                  )}
                </>
              );

              return (
                <li key={n.id} className="py-3.5">
                  {n.href ? (
                    <Link href={n.href} className="block transition-opacity hover:opacity-70">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
