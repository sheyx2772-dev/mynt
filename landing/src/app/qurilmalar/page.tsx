import Link from "next/link";
import type { Metadata } from "next";

import Mark from "@/components/Mark";
import LangSwitch from "@/components/LangSwitch";
import LoadoutTile from "@/components/LoadoutTile";
import { catalogue, picker, b2b } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { formatUZS } from "@/lib/format";
import {
  LOADOUT_DEVICES,
  VERTICALS,
  deviceShot,
  verticalShot,
  devicePriceOrNull,
  UNPRICED_DEVICE,
} from "@/lib/loadout";

// The shelf.
//
// This page used to be three products described in prose, one under the other.
// It is now everything Flex sells, laid out as pictures you choose between —
// the shape a game uses for a loadout, and the right one here for the same
// reason: picking a ring over a card is a taste decision, and taste decisions
// are made by looking, not by reading.
//
// Tapping a tile opens the thing itself, where the detail belongs.

export async function generateMetadata({
  searchParams,
}: PageProps<"/qurilmalar">): Promise<Metadata> {
  const { til } = await searchParams;
  const p = picker(await getLang(til));
  return { title: p.metaTitle, description: p.metaDescription };
}

export default async function DevicesPage({ searchParams }: PageProps<"/qurilmalar">) {
  const { til } = await searchParams;
  const lang = await getLang(til);
  const p = picker(lang);
  const c = catalogue(lang);
  const t = b2b(lang);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0a0715] text-white">
      <div className="bg-dot-grid-light absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-lime/[0.12] blur-[130px]" />

      <div className="relative mx-auto max-w-5xl px-6 py-14 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <Mark tone="dark" />
            flex
          </Link>
          <LangSwitch lang={lang} next="/qurilmalar" tone="dark" />
        </div>

        <h1 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
          {p.title}
        </h1>
        <p className="mt-4 max-w-xl leading-relaxed text-white/55">{p.lead}</p>

        {/* Devices */}
        <div className="mt-12 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xs font-semibold tracking-widest text-lime uppercase">
            {p.groupDevices}
          </h2>
          <p className="text-xs text-white/35">{p.groupDevicesNote}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {LOADOUT_DEVICES.map((id) => {
            const price = devicePriceOrNull(id);
            const name =
              id === UNPRICED_DEVICE ? p.avtovizitka.name : c.devices[id].name;
            const note =
              id === UNPRICED_DEVICE ? p.avtovizitka.tagline : c.devices[id].tagline;
            return (
              <LoadoutTile
                key={id}
                href={`/qurilmalar/${id}`}
                shot={deviceShot(id)}
                name={name}
                note={note}
                price={price === null ? p.priceUnknown : formatUZS(price, lang)}
              />
            );
          })}
        </div>

        {/* Directions */}
        <div className="mt-14 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xs font-semibold tracking-widest text-lime uppercase">
            {p.groupDirections}
          </h2>
          <p className="text-xs text-white/35">{p.groupDirectionsNote}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {VERTICALS.map((id) => (
            <LoadoutTile
              key={id}
              href="/biznes"
              shot={verticalShot(id)}
              name={t.verticals[id].name}
              note={t.verticals[id].pointsWord}
              price={p.openCta}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
