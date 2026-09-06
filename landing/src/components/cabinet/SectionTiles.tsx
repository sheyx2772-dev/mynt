import {
  ArrowRightLeft,
  BarChart3,
  CreditCard,
  Lock,
  MessageSquare,
  Palette,
  QrCode,
  UserRound,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { OwnedHandle } from "@/lib/cabinet/handles";

// The screens behind the number, organized into 3 clear logical clusters:
// 1. Card & Profile (appearance, identity, QR)
// 2. Activity & Networking (leads, posts, analytics)
// 3. Settings & Management (privacy, transfer, plan)
export default async function SectionTiles({
  handle,
  waiting,
  leadsCount = 0,
}: {
  handle: OwnedHandle;
  waiting: number;
  leadsCount?: number;
}) {
  const [tSec, tGrp] = await Promise.all([
    getTranslations("cabinet.sections"),
    getTranslations("cabinet.groups"),
  ]);
  const at = (screen: string) => `/cabinet/${handle.raqam}/${screen}`;

  const groups = [
    {
      key: "card",
      title: tGrp("card"),
      tiles: [
        {
          id: "profile",
          Icon: UserRound,
          count: 0,
          wide: false,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        },
        {
          id: "theme",
          Icon: Palette,
          count: 0,
          wide: false,
          color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
        },
        {
          id: "qr",
          Icon: QrCode,
          count: 0,
          wide: true,
          color: "text-lime bg-lime/10 border-lime/25",
        },
      ],
    },
    {
      key: "activity",
      title: tGrp("activity"),
      tiles: [
        {
          id: "leads",
          Icon: Users,
          count: leadsCount,
          wide: false,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        },
        {
          id: "posts",
          Icon: MessageSquare,
          count: 0,
          wide: false,
          color: "text-sky-400 bg-sky-500/10 border-sky-500/20",
        },
        {
          id: "stats",
          Icon: BarChart3,
          count: 0,
          wide: true,
          color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        },
      ],
    },
    {
      key: "settings",
      title: tGrp("settings"),
      tiles: [
        {
          id: "privacy",
          Icon: Lock,
          count: waiting,
          wide: false,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        },
        {
          id: "transfer",
          Icon: ArrowRightLeft,
          count: 0,
          wide: false,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
        },
        {
          id: "plan",
          Icon: CreditCard,
          count: 0,
          wide: true,
          color: "text-gold bg-gold/10 border-gold/25",
        },
      ],
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2.5">
          <h3 className="px-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/80">
            {group.title}
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {group.tiles.map(({ id, Icon, count, wide, color }) => (
              <Link
                key={id}
                href={at(id)}
                className={`group flex min-h-24 flex-col justify-between rounded-card border border-border/75 bg-card p-4 transition-all hover:border-lime/40 hover:bg-card/90 active:scale-[0.99] ${
                  wide ? "col-span-2" : ""
                }`}
              >
                <span className="flex items-start justify-between">
                  <span
                    className={`flex size-8 items-center justify-center rounded-lg border transition-transform group-hover:scale-105 ${color}`}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  {count > 0 && (
                    <span className="rounded-full bg-lime px-2 py-0.5 font-mono text-[11px] font-bold text-ink shadow-sm animate-pulse">
                      {count}
                    </span>
                  )}
                </span>
                <span className="mt-3">
                  <span className="block text-sm font-semibold text-foreground group-hover:text-lime transition-colors">
                    {tSec(`${id}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {tSec(`${id}.hint`)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
