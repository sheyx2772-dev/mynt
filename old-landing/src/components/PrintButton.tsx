"use client";

import { Printer } from "lucide-react";

// The browser's own print dialog, which is also where "save as PDF" lives —
// so this one button covers both printing at home and sending the sheet to a
// print shop.
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-ink-s2 px-5 py-2.5 text-sm font-medium text-paper transition-transform active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" />
      Chop etish
    </button>
  );
}
