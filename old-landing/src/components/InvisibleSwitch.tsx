"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setInvisibleMode } from "@/app/kabinet/[handle]/actions";

// The trade, as one switch: nobody sees you, and you see nobody.
export default function InvisibleSwitch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const flip = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const ok = await setInvisibleMode(next);
      if (!ok) setOn(!next);
      else router.refresh();
    });
  };

  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-card border border-ink-line bg-ink-s1 px-4 py-3 text-sm">
      <input type="checkbox" checked={on} onChange={flip} disabled={pending} className="mt-0.5 size-4 accent-lime" />
      <span>
        <span className="font-medium">Ko&apos;rinmas rejim</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-paper-3">
          Siz ochgan profillar egalari sizni ro&apos;yxatda ko&apos;rmaydi — va siz ham o&apos;zingiznikini
          kim ko&apos;rganini ko&apos;rmaysiz. Avval yozilganlar o&apos;chiriladi.
        </span>
      </span>
    </label>
  );
}
