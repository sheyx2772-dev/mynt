"use client";

import { useState, useTransition } from "react";
import { assignHandle } from "@/app/kabinet/jamoa/actions";

// Handing a spare number to a member of staff.
//
// Inline on the row rather than on its own screen: an admin setting up twenty
// people is doing the same thing twenty times, and a page transition between
// each of them is nineteen more than the work needs.

export default function AssignHandleForm({ handle }: { handle: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (message) {
    return <p className="text-xs text-paper-2">{message}</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-ink-line px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-ink-s2"
      >
        Biriktirish
      </button>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await assignHandle(handle, String(formData.get("email") ?? ""));
          if (!result.ok) {
            setError(result.error ?? "Bo'lmadi.");
            return;
          }
          setMessage(
            result.invited
              ? `${handle} biriktirildi — xodimga taklif emaili yuborildi.`
              : `${handle} biriktirildi.`,
          );
        })
      }
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <input
        name="email"
        type="email"
        required
        placeholder="xodim@email.com"
        className="w-52 rounded-lg border border-ink-line bg-ink-s1 px-3 py-1.5 text-xs outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink-s2 px-3.5 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
      >
        {pending ? "..." : "Yuborish"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="rounded-lg border border-ink-line px-3 py-1.5 text-xs"
      >
        Bekor
      </button>
      {error && <p className="w-full text-right text-xs text-danger-ink">{error}</p>}
    </form>
  );
}
