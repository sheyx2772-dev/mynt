import "server-only";

import { catalogue, picker, b2b, type Lang } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { productShot } from "@/lib/product-shots";
import {
  LOADOUT_DEVICES,
  VERTICALS,
  deviceShot,
  verticalShot,
  devicePriceOrNull,
  UNPRICED_DEVICE,
} from "@/lib/loadout";
import type { StripItem } from "@/components/LoadoutStrip";

// The strip is a client component, so the photographs have to be resolved on
// the server and handed over as plain strings. Built here rather than in each
// page, because the same two rows appear on the entry page and on the phone's
// app home and they must not drift apart.

export function deviceStrip(lang: Lang): StripItem[] {
  const p = picker(lang);
  const c = catalogue(lang);

  return LOADOUT_DEVICES.map((id) => {
    const price = devicePriceOrNull(id);
    return {
      href: `/qurilmalar/${id}`,
      src: productShot(deviceShot(id)),
      name: id === UNPRICED_DEVICE ? p.avtovizitka.name : c.devices[id].name,
      note: id === UNPRICED_DEVICE ? p.avtovizitka.tagline : c.devices[id].tagline,
      price: price === null ? p.priceUnknown : formatUZS(price, lang),
    };
  });
}

export function verticalStrip(lang: Lang): StripItem[] {
  const p = picker(lang);
  const t = b2b(lang);

  return VERTICALS.map((id) => {
    const shot = verticalShot(id);
    return {
      href: "/biznes",
      src: shot ? productShot(shot) : null,
      name: t.verticals[id].name,
      note: t.verticals[id].pointsWord,
      price: p.openCta,
    };
  });
}
