"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Smartphone } from "lucide-react";

import { rotateStaffTokenAction } from "@/app/kabinet/[handle]/sorovlar/actions";
import { staffUrl } from "@/lib/site-url";

// The address the till phone is left open on.
//
// No account and no password, because a password on a shared phone is a
// password written on the wall — and because the person who needs this screen
// is a waiter, not the person who bought the number.
//
// Replacing the link is the only revoke there is, and that is deliberate: one
// venue, one address, and pressing the button ends every phone that had the old
// one. A list of issued links would be a list somebody has to keep tidy.

export default function StaffLink({
  handle,
  token,
}: {
  handle: string;
  token: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const url = token ? staffUrl(token) : null;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold tracking-tight">
        <Smartphone className="h-4 w-4 text-flex-black/50" />
        Kassa havolasi
      </h2>
      <p className="mt-1 text-sm text-flex-black/50">
        Ofitsiant yoki kassadagi telefonda oching — kirish talab qilinmaydi, faqat shu
        ro&apos;yxat ko&apos;rinadi. Telefon shu sahifada qolsin.
      </p>

      {url ? (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate font-tabular text-xs text-flex-black/60">
              {url}
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  // Denied, or an insecure origin. The address is on screen.
                }
              }}
              aria-label="Nusxalash"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 text-flex-black/50 hover:bg-white"
            >
              {copied ? <Check className="h-4 w-4 text-lime-ink" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <form action={rotateStaffTokenAction} className="mt-3">
            <input type="hidden" name="handle" value={handle} />
            <button className="flex items-center gap-1.5 text-xs text-flex-black/45 hover:text-red-600">
              <RefreshCw className="h-3 w-3" />
              Havolani yangilash — eskisi ishlamay qoladi
            </button>
          </form>
        </>
      ) : (
        <form action={rotateStaffTokenAction} className="mt-4">
          <input type="hidden" name="handle" value={handle} />
          <button className="w-full rounded-xl bg-flex-black px-5 py-3 font-medium text-white">
            Havola yaratish
          </button>
        </form>
      )}
    </section>
  );
}
