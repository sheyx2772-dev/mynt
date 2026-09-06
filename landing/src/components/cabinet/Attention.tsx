import { CalendarClock, ChevronRight, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { OwnedHandle } from "@/lib/cabinet/handles";
import type { PlanState } from "@/lib/cabinet/plan";

// What is waiting on the owner, if anything.
//
// The one lime element on the home screen, and it appears only when there is
// something to do — people at the door of a closed profile, a plan inside its
// last two weeks. A row that is always there is furniture; a row that appears
// is a message. Drawn above the tiles because it is the reason somebody
// opened the app today, and it should not be the fourth thing they find.
export default async function Attention({
  handle,
  plan,
  waiting,
}: {
  handle: OwnedHandle;
  plan: PlanState;
  waiting: number;
}) {
  const t = await getTranslations("cabinet");
  const at = (screen: string) => `/cabinet/${handle.raqam}/${screen}`;

  if (waiting === 0 && !plan.endingSoon) return null;

  return (
    <div className="flex flex-col gap-2">
      {waiting > 0 && (
        <Link
          href={at("privacy")}
          className="flex min-h-14 items-center gap-3.5 rounded-card bg-primary px-4 text-primary-foreground transition-transform active:scale-[0.99]"
        >
          <UserPlus aria-hidden className="size-5" strokeWidth={2} />
          <span className="flex-1 text-[15px] font-medium">
            {t("home.waiting", { count: waiting })}
          </span>
          <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
        </Link>
      )}

      {plan.endingSoon && (
        <Link
          href={at("plan")}
          className="flex min-h-14 items-center gap-3.5 rounded-card border border-warn/40 bg-card px-4 text-warn transition-transform active:scale-[0.99]"
        >
          <CalendarClock aria-hidden className="size-5" strokeWidth={2} />
          <span className="flex-1 text-[15px] font-medium">
            {t("home.endingSoon", { days: plan.daysLeft ?? 0 })}
          </span>
          <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
