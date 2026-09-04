"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { parseHandle } from "@/lib/pricing";

// A profile is where most people meet Flex for the first time — a card is
// tapped, a link is forwarded — and until now that page had no way to ask the
// one question a visitor asks next: is my own number free?
//
// It goes to /{handle}, the same destination as the hero checker, because that
// page already answers both halves of the question: free or taken, and at what
// price. A second search screen would only be a detour.

export default function ProfileHandleSearch() {
  const [value, setValue] = useState("");
  const router = useRouter();

  // Letters and digits only, upper-cased as typed: the format is three letters
  // then three digits, and a person typing their own name in lower case should
  // not be told their entry is wrong.
  function onChange(raw: string) {
    setValue(raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseHandle(value);
        if (parsed) router.push(`/${parsed.letters}${parsed.digits}`);
      }}
      className="mb-4"
    >
      <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 shadow-sm">
        <span className="font-tabular text-sm text-flex-black/35">flex.com.uz/</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="AAA000"
          aria-label="Raqamni tekshirish"
          className="min-w-0 flex-1 bg-transparent font-tabular text-sm tracking-wider outline-none placeholder:text-flex-black/25"
        />
        <button
          type="submit"
          disabled={parseHandle(value) === null}
          aria-label="Qidirish"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-flex-black text-white transition-opacity disabled:opacity-25"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
