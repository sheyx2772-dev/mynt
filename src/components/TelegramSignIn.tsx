"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, RotateCw } from "lucide-react";

import { beginTelegramSignIn, pollTelegramSignIn } from "@/app/kirish/actions";

// The Telegram door.
//
// One tap out and one tap back: the link carries the code, so nobody reads six
// characters off one screen and types them into another. Telegram sends the bot
// `/start <code>` when they press Start, and this tab — which asks the bot for
// news the whole time they are away — has the session ready before they finish
// switching back.
//
// The button is a real link with the code already in it, and that is the whole
// point of minting the code on the server before this renders. The first
// version asked for a code on click and opened the window afterwards; by then
// the click was no longer a user gesture, so the popup blocker ate it, nothing
// appeared to happen, and people pressed the button again and again — three
// unanswered codes in five seconds, then "your code expired".
//
// The code is shown as well, because deep links do fail: an in-app browser that
// will not hand off, a desktop with no Telegram installed. Then it is a message
// they can send by hand and the same polling picks it up.

const POLL_MS = 2500;

type Phase =
  | { at: "ready"; code: string; deepLink: string }
  | { at: "waiting"; code: string; deepLink: string }
  | { at: "stale"; error: string };

export default function TelegramSignIn({
  next,
  code,
  deepLink,
}: {
  next: string;
  code: string;
  deepLink: string;
}) {
  const [phase, setPhase] = useState<Phase>({ at: "ready", code, deepLink });
  const [retrying, setRetrying] = useState(false);
  const router = useRouter();
  const stop = useRef(false);

  // Set on the way in as well as cleared on the way out. Without the first
  // line this never polls in development: React mounts, unmounts and remounts
  // effects, the unmount sets the flag, and the remount finds it still set.
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
        setPhase({ at: "stale", error: "Kod muddati tugadi." });
      } else if (result.state === "error") {
        window.clearInterval(id);
        setPhase({ at: "stale", error: result.error });
      }
    }, POLL_MS);

    return () => window.clearInterval(id);
  }, [phase, next, router]);

  async function again() {
    setRetrying(true);
    const result = await beginTelegramSignIn();
    setRetrying(false);

    if (!result.ok) {
      setPhase({ at: "stale", error: result.error });
      return;
    }
    setPhase({ at: "ready", code: result.code, deepLink: result.deepLink });
  }

  if (phase.at === "stale") {
    return (
      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 text-center">
        <p className="text-sm text-flex-black/70">{phase.error}</p>
        <button
          type="button"
          onClick={again}
          disabled={retrying}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-flex-black px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {retrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
          Qaytadan urinish
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* An anchor, not a button that opens a window: a real navigation is
          never blocked, and it works inside the webviews Telegram links are
          most often tapped from. */}
      <a
        href={phase.deepLink}
        target="_blank"
        rel="noopener"
        onClick={() => setPhase({ at: "waiting", code: phase.code, deepLink: phase.deepLink })}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-flex-black px-6 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.005]"
      >
        <Send className="h-4 w-4" />
        Telegram orqali kirish
      </a>

      {phase.at === "waiting" ? (
        <div className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-lime-ink" />
            Telegram javobini kutmoqdamiz
          </p>
          <p className="mt-2 text-xs leading-relaxed text-flex-black/55">
            Ochilgan botda <b>Start</b> tugmasini bosing.
          </p>
          <p className="mt-3 font-display text-xl font-semibold tracking-[0.2em]">
            {phase.code}
          </p>
          <p className="mt-1 text-[11px] text-flex-black/40">
            Bot ochilmadimi — shu kodni botga xabar qilib yuboring
          </p>
        </div>
      ) : (
        <p className="mt-2 text-center text-xs text-flex-black/40">
          Bot ochiladi, <b>Start</b> bosasiz — tamom. Parol ham, email ham kerak emas.
        </p>
      )}
    </div>
  );
}
