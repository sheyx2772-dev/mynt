import "server-only";

import { catalogue, picker, b2b, type Lang } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { productShot } from "@/lib/product-shots";
import {
  LOADOUT_DEVICES,
  VERTICALS,
  deviceShot,
  deviceCutout,
  verticalShot,
  devicePriceOrNull,
  UNPRICED_DEVICE,
} from "@/lib/loadout";
import type { StripItem } from "@/components/LoadoutStrip";
import type { CarouselItem } from "@/components/FloatingCarousel";

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
      // Every tile used to land on the top of /biznes, which made the strip
      // decoration rather than navigation: a cafe and a clinic arrived at the
      // same place and had to go looking again. Each now opens the price
      // picker with its own vertical already chosen.
      href: `/biznes?soha=${id}#soha`,
      src: shot ? productShot(shot) : null,
      name: t.verticals[id].name,
      note: t.verticals[id].pointsWord,
      price: p.openCta,
    };
  });
}

/**
 * The hero's carousel: the same objects as the shelf, cut out so they can hang
 * in the air, and the pet tag as well — it is sold like the rest even though it
 * has no row in DEVICE_TYPES.
 *
 * Built here rather than in the two hero components, for the same reason the
 * shelf is: the phone and the desktop both draw it and they must not drift.
 */
export function heroCarousel(lang: Lang): CarouselItem[] {
  const p = picker(lang);
  const c = catalogue(lang);

  const made = LOADOUT_DEVICES.map((id) => {
    const price = devicePriceOrNull(id);
    return {
      href: `/qurilmalar/${id}`,
      src: deviceCutout(id)!,
      name: id === UNPRICED_DEVICE ? p.avtovizitka.name : c.devices[id].name,
      price: price === null ? p.priceUnknown : formatUZS(price, lang),
    };
  });

  const petTag = {
    href: "/qurilmalar",
    src: deviceCutout("hayvon-teg")!,
    name: lang === "ru" ? "Жетон для животного" : lang === "en" ? "Pet tag" : "Hayvon jetoni",
    price: p.priceUnknown,
  };

  return [...made, petTag];
}
