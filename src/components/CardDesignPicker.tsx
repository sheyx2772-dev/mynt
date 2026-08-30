"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import CardFace from "@/components/CardFace";
import { CARD_DESIGNS, type CardDesignId } from "@/lib/card-designs";

// Radio inputs under the hood, so the choice submits with the surrounding
// form and works with a keyboard before any JavaScript decides to help.
export default function CardDesignPicker({
  handle,
  value,
}: {
  handle: string;
  value: CardDesignId;
}) {
  const [selected, setSelected] = useState<CardDesignId>(value);

  return (
    <fieldset>
      <legend className="mb-1.5 block text-xs font-medium tracking-wide text-mynt-black/50 uppercase">
        Karta dizayni
      </legend>

      <div className="grid grid-cols-2 gap-3">
        {CARD_DESIGNS.map((design) => {
          const active = selected === design.id;
          return (
            <label
              key={design.id}
              className={
                active
                  ? "relative cursor-pointer rounded-2xl p-1.5 ring-2 ring-mynt-black"
                  : "relative cursor-pointer rounded-2xl p-1.5 ring-1 ring-black/10 transition-colors hover:ring-black/25"
              }
            >
              <input
                type="radio"
                name="cardDesign"
                value={design.id}
                checked={active}
                onChange={() => setSelected(design.id)}
                className="sr-only"
              />
              <CardFace design={design.id} handle={handle} />
              <span className="mt-2 flex items-center justify-between px-1 pb-1 text-xs font-medium">
                {design.name}
                {active && <Check className="h-3.5 w-3.5" />}
              </span>
            </label>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-mynt-black/35">
        Dizayn kartangizga bosiladi. Istalgan vaqtda almashtirishingiz mumkin.
      </p>
    </fieldset>
  );
}
