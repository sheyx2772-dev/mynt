"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// A message that arrives after an action, over the page rather than in it.
//
// The site had none, deliberately: a confirmation belongs on the control that
// was pressed, where the eye already is. This is the other case — something
// the person has to *read and use*, which did not exist when they pressed the
// button and has no place of its own on the form.
//
// It does not dismiss itself. A toast that disappears is fine for "saved" and
// wrong for anything carrying a value: the one time it vanishes early is the
// time somebody looked away, and there is no way to ask for it again.
export default function Toast({
  children,
  tone = "test",
}: {
  children: React.ReactNode;
  /** `test` marks something that will not exist in production. */
  tone?: "test" | "plain";
}) {
  const [open, setOpen] = useState(false);
  const [gone, setGone] = useState(false);

  // Mounted closed, then opened, so the transition has two states to move
  // between. Rendering it already open means the browser has nothing to
  // animate from and it appears in place.
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (gone) return null;

  const skin =
    tone === "test"
      ? "border-[#E8C86A] bg-[#FFF4D6] text-[#6B5514]"
      : "border-line bg-white text-flex-black";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm rounded-tile border px-4 py-3 shadow-slab transition-[opacity,transform] duration-300 motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 ${skin} ${
        open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 text-sm leading-relaxed">{children}</div>
        <button
          type="button"
          onClick={() => setGone(true)}
          aria-label="Yopish"
          className="-m-1 shrink-0 rounded-plate p-1 opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
