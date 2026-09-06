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
        { id: "profile", Icon: UserRound, count: 0, wide: false },
        { id: "theme", Icon: Palette, count: 0, wide: false },
        { id: "qr", Icon: QrCode, count: 0, wide: true },
      ],
    },
    {
      key: "activity",
      title: tGrp("activity"),
      tiles: [
        { id: "leads", Icon: Users, count: leadsCount, wide: false },
        { id: "posts", Icon: MessageSquare, count: 0, wide: false },
        { id: "stats", Icon: BarChart3, count: 0, wide: true },
      ],
    },
    {
      key: "settings",
      title: tGrp("settings"),
      tiles: [
        { id: "privacy", Icon: Lock, count: waiting, wide: false },
        { id: "transfer", Icon: ArrowRightLeft, count: 0, wide: false },
        { id: "plan", Icon: CreditCard, count: 0, wide: true },
      ],
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2.5">
          <h3 className="px-1 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            {group.title}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {group.tiles.map(({ id, Icon, count, wide }) => (
              <Link
                key={id}
                href={at(id)}
                className={`flex min-h-24 flex-col justify-between rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted ${
                  wide ? "col-span-2" : ""
                }`}
              >
                <span className="flex items-start justify-between">
                  <Icon
                    aria-hidden
                    className="size-5 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  {count > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </span>
                <span>
                  <span className="block text-[15px] font-medium">
                    {tSec(`${id}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
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
