"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { decide } from "@/app/(cabinet)/[locale]/cabinet/[handle]/privacy/actions";
import { initials } from "@/lib/cabinet/format";
import type { FollowRequest } from "@/lib/cabinet/requests";
import { imageSrc } from "@/lib/profile/links";

// The people outside a closed door, each with two buttons.
//
// A decided row leaves the list at once. The backend answers 404 for a row
// that was already decided elsewhere — the phone, another tab — and that is
// treated the same as success here: the request is gone either way, and the
// owner is not asked to care which device got there first.
export default function RequestList({
  raqam,
  initial,
  closed,
}: {
  raqam: string;
  initial: FollowRequest[];
  closed: boolean;
}) {
  const t = useTranslations("cabinet.privacy");
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();

  const settle = (user: string, accept: boolean) =>
    start(async () => {
      const done = await decide(raqam, user, accept);
      setRows((r) => r.filter((x) => x.foydalanuvchi !== user));
      if (!done) toast(t("alreadyDecided"));
    });

  return (
    <section>
      <h2 className="cap mb-3 text-muted-foreground">{t("inbox")}</h2>

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {closed ? t("nobodyWaiting") : t("openNobodyWaits")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => {
            const avatar = imageSrc(r.rasm);
            const name = r.ism || r.raqam || t("someone");
            return (
              <li
                key={r.foydalanuvchi}
                className="flex items-center gap-3 rounded-card bg-card p-3"
              >
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted font-mono text-sm font-semibold text-muted-foreground">
                    {initials(name)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {name}
                  </span>
                  {r.raqam && (
                    <span className="block font-mono text-xs tracking-[0.12em] text-muted-foreground">
                      {r.raqam}
                    </span>
                  )}
                </span>
                <Button
                  type="button"
                  size="icon-lg"
                  aria-label={t("accept")}
                  disabled={pending}
                  onClick={() => settle(r.foydalanuvchi, true)}
                  className="size-11 rounded-input"
                >
                  <Check strokeWidth={2.5} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t("refuse")}
                  disabled={pending}
                  onClick={() => settle(r.foydalanuvchi, false)}
                  className="size-11 rounded-input"
                >
                  <X strokeWidth={2} />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
