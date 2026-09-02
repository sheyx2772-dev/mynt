"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

import {
  beginTelegramSignIn,
  pollTelegramSignIn,
  type TelegramStart,
} from "@/app/kirish/actions";

// The Telegram door.
//
// One tap out and one tap back: the link carries the code, so nobody reads six
// characters off one screen and types them into another. Telegram sends the bot
// `/start <code>` when they press the button it shows them, and this tab —
// which has been asking the bot for news the whole time they were away — has
// the session ready before they finish switching back.
//
// The code is shown as well, because deep links do fail: an in-app browser that
// will not hand off, a desktop with no Telegram installed. Then it is a message
// they can send by hand and the same polling picks it up.

const POLL_MS = 2500;

type Phase =
  | { at: "idle" }
  | { at: "starting" }
  | { at: "waiting"; code: string; deepLink: string }
  | { at: "failed"; error: string };

export default function TelegramSignIn({ next }: { next: string }) {
  const [phase, setPhase] = useState<Phase>({ at: "idle" });
  const router = useRouter();
  const stop = useRef(false);

  // Set on the way in as well as cleared on the way out. Without the first
  // line this never polls in development: React mounts, unmounts and remounts
  // effects, the unmount sets the flag, and the remount would have found it
  // still set — so every poll returned before doing anything.
  useEffect(() => {
    stop.current = false;
    return () => {
      stop.current = true;
    };
  }, []);

  useEffect(() => {
    if (phase.at !== "waiting") return;

    const id = window.setInterval(async () => {
      if (stop.current) return;

      const result = await pollTelegramSignIn(phase.code, next);

      if (result.state === "done") {
        window.clearInterval(id);
        // A full navigation rather than a push: every server component on the
        // way back has to be rendered for the new session, not reused.
        router.replace(result.next);
        router.refresh();
      } else if (result.state === "expired") {
        window.clearInterval(id);
        setPhase({ at: "failed", error: "Kod muddati tugadi. Qaytadan boshlang." });
      } else if (result.state === "error") {
        window.clearInterval(id);
        setPhase({ at: "failed", error: result.error });
      }
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [phase, next, router]);

  async function start() {
    setPhase({ at: "starting" });
    const result: TelegramStart = await beginTelegramSignIn();

    if (!result.ok) {
      setPhase({ at: "failed", error: result.error });
      return;
    }

    setPhase({ at: "waiting", code: result.code, deepLink: result.deepLink });
    // Opened from the click that started it, so the browser treats it as a
    // gesture rather than a popup.
    window.open(result.deepLink, "_blank", "noopener");
  }

  if (phase.at === "waiting") {
    return (
      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-lime-ink" />
          Telegram javobini kutmoqdamiz
        </p>
        <p className="mt-2 text-xs leading-relaxed text-flex-black/55">
          Ochilgan botda <b>Start</b> tugmasini bosing. Bot ochilmadimi — quyidagi
          kodni botga xabar qilib yuboring.
        </p>

        <p className="mt-4 font-display text-2xl font-semibold tracking-[0.2em]">
          {phase.code}
        </p>

        <a
          href={phase.deepLink}
          target="_blank"
          rel="noopener"
          className="mt-4 inline-block text-xs font-medium text-lime-ink underline"
        >
          Botni qayta ochish
        </a>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={phase.at === "starting"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flex-black px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.005] disabled:opacity-60"
      >
        {phase.at === "starting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Telegram orqali kirish
      </button>

      {phase.at === "failed" && (
        <p className="mt-3 text-center text-sm text-red-600">{phase.error}</p>
      )}
    </div>
  );
}
