"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";


type Props = {
  fullName: string;
  handle: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  company?: string | null;
  label: string;
  /** What the button says once the file has been handed over. */
  savedLabel: string;
};

// vCard treats a comma, a semicolon and a backslash as structure, and a raw
// newline ends the property. A bio written across two lines, or a company
// name with a comma in it, would otherwise produce a file the phone imports
// with the fields cut short.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export default function SaveContactButton({
  fullName,
  handle,
  bio,
  phone,
  email,
  position,
  company,
  label,
  savedLabel,
}: Props) {
  function handleSave() {
    // Only the fields the owner filled in — an empty TEL line makes a phone
    // show a blank number field on the saved contact.
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${esc(fullName)}`,
      phone ? `TEL;TYPE=CELL:${esc(phone)}` : null,
      email ? `EMAIL;TYPE=INTERNET:${esc(email)}` : null,
      company ? `ORG:${esc(company)}` : null,
      position ? `TITLE:${esc(position)}` : null,
      bio ? `NOTE:${esc(bio)}` : null,
      `URL:https://flex.com.uz/${handle}`,
      "END:VCARD",
    ].filter((line): line is string => line !== null);

    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${handle}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // The confirmation is the button itself, for a second and a half.
  //
  // A toast would be a second thing appearing on a screen whose whole design
  // budget is one action — and on a phone it lands where the thumb already is.
  // Saying it in place answers the only question the person has, which is
  // whether the press worked.
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button
      onClick={() => {
        handleSave();
        setSaved(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSaved(false), 1500);
      }}
      className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-lime text-[16px] font-semibold text-on-accent shadow-slab transition-transform duration-[120ms] active:translate-y-px active:shadow-none"
    >
      {saved ? (
        <>
          <Check className="h-5 w-5" />
          {savedLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
