import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Check, Phone, ArrowRight } from "lucide-react";

import Mark from "@/components/Mark";
import LangSwitch from "@/components/LangSwitch";
import CardFan from "@/components/CardFan";
import { catalogue, picker } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { formatUZS } from "@/lib/format";
import { productShot } from "@/lib/product-shots";
import { COMPANY } from "@/lib/company";
import {
  LOADOUT_DEVICES,
  isLoadoutDevice,
  deviceShot,
  devicePriceOrNull,
  UNPRICED_DEVICE,
} from "@/lib/loadout";

// One item, opened.
//
// The shelf gets you to want something; this is where you find out what it is
// and what it costs. Prerendered for the four we sell, so tapping a tile lands
// on a page that is already there rather than one being built.

export function generateStaticParams() {
  return LOADOUT_DEVICES.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/qurilmalar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { til } = await searchParams;
  const lang = await getLang(til);
  if (!isLoadoutDevice(id)) return {};

  const p = picker(lang);
  const c = catalogue(lang);
  const name = id === UNPRICED_DEVICE ? p.avtovizitka.name : c.devices[id].name;
  const description =
    id === UNPRICED_DEVICE ? p.avtovizitka.description : c.devices[id].description;

  return { title: `${name} — flex.com.uz`, description };
}

export default async function DevicePage({
  params,
  searchParams,
}: PageProps<"/qurilmalar/[id]">) {
  const { id } = await params;
  const { til } = await searchParams;
  const lang = await getLang(til);

  if (!isLoadoutDevice(id)) notFound();

  const p = picker(lang);
  const c = catalogue(lang);

  const isCar = id === UNPRICED_DEVICE;
  const name = isCar ? p.avtovizitka.name : c.devices[id].name;
  const tagline = isCar ? p.avtovizitka.tagline : c.devices[id].tagline;
  const description = isCar ? p.avtovizitka.description : c.devices[id].description;
  const price = devicePriceOrNull(id);
  const shot = productShot(deviceShot(id));

  return (
    <div className="relative min-h-full overflow-hidden bg-[#0a0715] text-white">
      <div className="bg-dot-grid-light absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-lime/[0.12] blur-[130px]" />

      <div className="relative mx-auto max-w-4xl px-6 py-14 sm:py-16">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link
            href="/qurilmalar"
            className="flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {p.back}
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitch lang={lang} next={`/qurilmalar/${id}`} tone="dark" />
            <Link href="/" aria-label="Flex">
              <Mark tone="dark" />
            </Link>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div
            className={`relative overflow-hidden rounded-3xl bg-flex-black ring-1 ring-white/10 ${
              isCar ? "aspect-[16/9] lg:aspect-square" : "aspect-square"
            }`}
          >
            {shot ? (
              <Image
                src={shot}
                alt={name}
                fill
                priority
                sizes="(min-width: 1024px) 30rem, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grain absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#211a3c_0%,#0b0817_70%)]" />
            )}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-lime uppercase">
              {tagline}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {name}
            </h1>
            <p className="mt-5 leading-relaxed text-white/60">{description}</p>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-display text-3xl font-semibold tracking-tight">
                {price === null ? p.priceUnknown : formatUZS(price, lang)}
              </span>
            </div>
            <p className="mt-2 text-sm text-white/40">{p.priceNote}</p>

            <h2 className="mt-9 text-xs font-semibold tracking-widest text-white/40 uppercase">
              {p.includesLabel}
            </h2>
            <ul className="mt-3 space-y-2">
              {(isCar ? p.carIncludes : p.includes).map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-white/70">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-lime" strokeWidth={2.4} />
                  {line}
                </li>
              ))}
            </ul>

            {/* A device is useless without a number, so the priced ones send
                you to pick one. The car card has no price yet and sends you to
                a person instead of pretending it can be bought here. */}
            {price === null ? (
              <a
                href={`tel:${COMPANY.phoneHref}`}
                className="mt-9 flex items-center justify-center gap-2 rounded-2xl bg-lime px-6 py-4 font-medium text-flex-black shadow-[0_16px_40px_-16px_rgba(171,255,9,0.8)] transition-transform hover:scale-[1.01]"
              >
                <Phone className="h-4 w-4" />
                {p.askPrice}
              </a>
            ) : (
              <Link
                href="/shaxsiy#narx"
                className="mt-9 flex items-center justify-center gap-2 rounded-2xl bg-lime px-6 py-4 font-medium text-flex-black shadow-[0_16px_40px_-16px_rgba(171,255,9,0.8)] transition-transform hover:scale-[1.01]"
              >
                {p.orderCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* The designs, for the things a design goes on. */}
        {!isCar && (
          <div className="mt-16">
            <CardFan handle="MYN042" />
          </div>
        )}
      </div>
    </div>
  );
}
