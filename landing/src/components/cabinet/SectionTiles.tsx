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

// The screens behind the number, one tile each.
//
// Nine essential tiles in two columns.
// A tile carries a count only when the count is a reason to open it (e.g. pending
// follower requests, or newly received leads).
export default async function SectionTiles({
  handle,
  waiting,
  leadsCount = 0,
}: {
  handle: OwnedHandle;
  waiting: number;
  leadsCount?: number;
}) {
  const t = await getTranslations("cabinet.sections");
  const at = (screen: string) => `/cabinet/${handle.raqam}/${screen}`;

  const tiles = [
    { id: "profile", Icon: UserRound, count: 0 },
    { id: "posts", Icon: MessageSquare, count: 0 },
    { id: "qr", Icon: QrCode, count: 0 },
    { id: "leads", Icon: Users, count: leadsCount },
    { id: "privacy", Icon: Lock, count: waiting },
    { id: "stats", Icon: BarChart3, count: 0 },
    { id: "theme", Icon: Palette, count: 0 },
    { id: "transfer", Icon: ArrowRightLeft, count: 0 },
    { id: "plan", Icon: CreditCard, count: 0 },
  ] as const;

  return (
    <nav className="grid grid-cols-2 gap-2">
      {tiles.map(({ id, Icon, count }) => (
        <Link
          key={id}
          href={at(id)}
          className="flex min-h-24 flex-col justify-between rounded-card border border-border bg-card p-4 transition-colors hover:bg-muted"
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
              {t(`${id}.title`)}
            </span>
            <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
              {t(`${id}.hint`)}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
