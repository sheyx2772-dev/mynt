"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestTelegramCode, checkTelegramLink } from "@/app/kabinet/xabarlar/actions";
import type { LinkState } from "@/lib/notify/link";

// Linking Telegram, which is two screens' worth of instruction compressed into
// one: get a code, send it to the bot, done. The screen watches for the link
// completing rather than asking the person to come back and refresh — they are
// holding their phone in the other hand and would not know when to.

export default function TelegramLink({
  initial,
  botName,
}: {
  initial: LinkState;
  botName: string | null;
}) {
  const [state, setState] = useState<LinkState>(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (state.state !== "waiting") return;

    // Every few seconds while the code is on screen, and never otherwise.
    const timer = setInterval(async () => {
      const next = await checkTelegramLink();
      if (next.state === "linked") {
        setState(next);
        router.refresh();
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [state, router]);

  if (state.state === "linked") {
    return (
      <p className="text-sm text-paper-2">
        Telegram ulangan — kontakt kelganda darhol xabar beramiz.
      </p>
    );
  }

  if (state.state === "waiting") {
    return (
      <div>
        <p className="text-sm text-paper-2">
          {botName ? (
            <>
              Telegram&apos;da{" "}
              <a
                href={`https://t.me/${botName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                @{botName}
              </a>{" "}
              ni oching va shu kodni yuboring:
            </>
          ) : (
            <>Botga shu kodni yuboring:</>
          )}
        </p>

        <p className="mt-3 inline-block rounded-xl border border-ink-line bg-ink-s2 px-5 py-3 font-tabular text-2xl font-semibold tracking-[0.25em]">
          {state.code}
        </p>

        <p className="mt-2 text-xs text-paper-3">
          Kod 15 daqiqa amal qiladi. Ulanishi bilan bu yozuv o&apos;zgaradi.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-paper-2">
        Kontakt kelganda Telegram&apos;ingizga darhol xabar boradi &mdash;
        kabinetga kirib ko&apos;rishni kutmaysiz.
      </p>
      <button
        onClick={() =>
          startTransition(async () => {
            setState(await requestTelegramCode());
          })
        }
        disabled={pending}
        className="mt-4 rounded-xl bg-ink-s2 px-5 py-2.5 text-[11px] font-semibold tracking-[0.16em] text-paper uppercase disabled:opacity-50"
      >
        {pending ? "..." : "Telegramni ulash"}
      </button>
    </div>
  );
}
