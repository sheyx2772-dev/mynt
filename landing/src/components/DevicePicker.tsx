"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import DeviceFace from "@/components/DeviceFace";
import { catalogue } from "@/lib/i18n";
import { DEVICE_TYPES, type DeviceTypeId } from "@/lib/devices";
import { CARD_DESIGNS, type CardDesignId } from "@/lib/card-designs";
import { formatUZS } from "@/lib/format";

// One control for both halves of the choice: which object, and how it looks.
// They are shown together because the preview only makes sense as a pair —
// Naqsh on a ring is not the same picture as Naqsh on a card.
// The cabinet is Uzbek: its reader is the owner, who bought from an Uzbek site.
// Naming the language here rather than threading one through says that on
// purpose, so a later reader does not take it for an oversight.
const DEVICE_NAMES = {
  card: catalogue("uz").devices.card.name,
  ring: catalogue("uz").devices.ring.name,
  bracelet: catalogue("uz").devices.bracelet.name,
} as const;

export default function DevicePicker({
  handle,
  device,
  design,
  customImage = null,
  prices = false,
}: {
  handle: string;
  device: DeviceTypeId;
  design: CardDesignId;
  customImage?: string | null;
  /**
   * Show what each object costs.
   *
   * Off in the profile editor, where the choice is only which picture the card
   * carries and a price beside it would read as a charge for changing it. On
   * when the same control is being used to buy one, and then it belongs on the
   * tile: a row of three prices under the picker does not say which of them is
   * the one you just selected.
   */
  prices?: boolean;
}) {
  const [selectedDevice, setSelectedDevice] = useState<DeviceTypeId>(device);
  const [selectedDesign, setSelectedDesign] = useState<CardDesignId>(design);

  const legend = "mb-1.5 block text-xs font-medium tracking-wide text-paper-2 uppercase";

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={legend}>Qurilma</legend>
        <div className="grid grid-cols-3 gap-3">
          {DEVICE_TYPES.map((type) => {
            const active = selectedDevice === type.id;
            return (
              <label
                key={type.id}
                className={
                  active
                    ? "cursor-pointer rounded-2xl p-2 ring-2 ring-flex-black"
                    : "cursor-pointer rounded-2xl p-2 ring-1 ring-black/10 transition-colors hover:ring-black/25"
                }
              >
                <input
                  type="radio"
                  name="deviceType"
                  value={type.id}
                  checked={active}
                  onChange={() => setSelectedDevice(type.id)}
                  className="sr-only"
                />
                <DeviceFace
                  type={type.id}
                  design={selectedDesign}
                  handle={handle}
                  customImage={customImage}
                  compact
                />
                <span className="mt-1.5 flex items-center justify-between px-1 text-xs font-medium">
                  {DEVICE_NAMES[type.id]}
                  {active && <Check className="h-3.5 w-3.5" />}
                </span>
                {prices && (
                  <span className="mt-0.5 block px-1 text-xs text-paper-2">
                    {formatUZS(type.price, "uz")}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>Dizayn</legend>
        <div className="flex flex-wrap gap-2">
          {CARD_DESIGNS.map((d) => {
            const active = selectedDesign === d.id;
            return (
              <label
                key={d.id}
                className={
                  active
                    ? "cursor-pointer rounded-full bg-ink-s2 px-4 py-2 text-sm font-medium text-paper"
                    : "cursor-pointer rounded-full border border-ink-line px-4 py-2 text-sm text-paper-2 transition-colors hover:bg-ink-s2"
                }
              >
                <input
                  type="radio"
                  name="cardDesign"
                  value={d.id}
                  checked={active}
                  onChange={() => setSelectedDesign(d.id)}
                  className="sr-only"
                />
                {d.name}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-paper-3">
          Tanlovingiz qurilmangizga tushadi. Istalgan vaqtda almashtirasiz.
        </p>
      </fieldset>
    </div>
  );
}
