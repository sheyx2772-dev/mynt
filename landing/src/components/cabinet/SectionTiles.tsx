import {
  BarChart3,
  CreditCard,
  Lock,
  MessageSquare,
  Palette,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { OwnedHandle } from "@/lib/cabinet/handles";

// The screens behind the number, one tile each.
//
// Six, in two columns, so all of them fit above the fold on a phone with the
// card and the figures above them. The old cabinet had fourteen and most
// were for a cafe; those are not built here yet and would not belong on a
// person's home if they were. The order is how often each is opened: the
// profile most, the plan least.
//
// A tile carries a count only when the count is a reason to open it.
export default async function SectionTiles({
  handle,
  waiting,
}: {
  handle: OwnedHandle;
  waiting: number;
}) {
  const t = await getTranslations("cabinet.sections");
  const at = (screen: string) => `/cabinet/${handle.raqam}/${screen}`;

  const tiles = [
    { id: "profile", Icon: UserRound, count: 0 },
    { id: "posts", Icon: MessageSquare, count: 0 },
    { id: "privacy", Icon: Lock, count: waiting },
    { id: "stats", Icon: BarChart3, count: 0 },
    { id: "theme", Icon: Palette, count: 0 },
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
