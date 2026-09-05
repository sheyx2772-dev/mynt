import "server-only";

import { catalogue, picker, b2b, type Lang } from "@/lib/i18n";
import { formatUZS } from "@/lib/format";
import { productShot } from "@/lib/product-shots";
import {
  LOADOUT_DEVICES,
  VERTICALS,
  deviceShot,
  deviceCutout,
  deviceCutouts,
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
      id,
      href: `/qurilmalar/${id}`,
      name: id === UNPRICED_DEVICE ? p.avtovizitka.name : c.devices[id].name,
      price: price === null ? p.priceUnknown : formatUZS(price, lang),
    };
  });

  const petTag = {
    id: "hayvon-teg",
    href: "/qurilmalar",
    name: lang === "ru" ? "Жетон для животного" : lang === "en" ? "Pet tag" : "Hayvon jetoni",
    price: p.priceUnknown,
  };

  // Every finish of every object, ordered so no object appears twice running.
  //
  // The counts are uneven — five bracelets, two pet tags — so a pass-per-set
  // does not work: the last passes would be bracelet after bracelet. Instead
  // the object with the most left to show goes next, unless it just went, in
  // which case the runner-up does. That spreads the bracelets through the
  // others rather than stacking them at the end.
  const all = [...made, petTag];
  const left = new Map(all.map((d) => [d.id, deviceCutouts(d.id)]));
  const order: CarouselItem[] = [];
  let previous: string | null = null;

  for (;;) {
    const ready = all
      .filter((d) => (left.get(d.id)?.length ?? 0) > 0)
      .sort((a, b) => (left.get(b.id)!.length - left.get(a.id)!.length));
    if (ready.length === 0) break;

    const pick = ready.find((d) => d.id !== previous) ?? ready[0];
    const src = left.get(pick.id)!.shift()!;
    const { id: _id, ...rest } = pick;
    order.push({ ...rest, src });
    previous = pick.id;
  }

  return order;
}
