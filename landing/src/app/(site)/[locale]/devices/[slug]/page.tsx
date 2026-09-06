import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Check } from "lucide-react";

import DeviceTile from "@/components/DeviceTile";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DEVICES, deviceBySlug, money } from "@/lib/devices";

/** Every device in every language, built once at deploy rather than on a tap. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    DEVICES.map((d) => ({ locale, slug: d.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/devices/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!deviceBySlug(slug)) return {};

  const t = await getTranslations({ locale, namespace: "devices" });
  return {
    title: t(`items.${slug}.name`),
    description: t(`items.${slug}.tagline`),
  };
}

// One object, at the length somebody deciding actually reads.
//
// The photograph is the same cut-out the shelf uses, larger. What is added is
// the part a tile cannot carry: what it is made of, what happens when it gets
// wet, what arrives in the box. Those are the questions that stop an order,
// and they are answered here rather than in a chat message on Monday.
export default async function DevicePage({
  params,
}: PageProps<"/[locale]/devices/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const device = deviceBySlug(slug);
  if (!device) notFound();

  const t = await getTranslations("devices");
  const item = (key: string) => t(`items.${slug}.${key}`);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <Link
          href="/devices"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {t("back")}
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="relative aspect-square overflow-hidden rounded-tile border border-line bg-paper">
            <Image
              src={`/mahsulot/${device.photo}.webp`}
              alt={item("name")}
              fill
              // The largest picture on the page, so it loads with the page
              // rather than after it — this is the one thing a visitor came
              // to look at.
              priority
              sizes="(min-width: 1024px) 544px, 100vw"
              className="object-cover"
            />
          </div>

          <div className="lg:pt-4">
            <h1 className="text-[34px] leading-10 font-semibold tracking-tight sm:text-[42px] sm:leading-[3rem]">
              {item("name")}
            </h1>
            <p className="mt-2 text-lg text-ink-2">{item("tagline")}</p>

            <p className="mt-6 leading-relaxed text-ink-2">{item("body")}</p>

            <p className="mt-8 font-mono text-2xl font-semibold tracking-[0.04em]">
              {money(device.price)}{" "}
              <span className="text-base font-normal text-ink-3">
                {t("soum")}
              </span>
            </p>

            <Button asChild size="lg" className="mt-5">
              <Link href="/personal">{t("buy")}</Link>
            </Button>

            <Specs
              title={t("specTitle")}
              lines={[item("spec1"), item("spec2"), item("spec3")]}
            />
            <Specs
              title={t("boxTitle")}
              lines={[t("chip"), t("battery"), t("app"), t("rewrite")]}
            />
          </div>
        </div>

        {device.scene && (
          <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-tile">
            <Image
              src={`/mahsulot/${device.scene}.webp`}
              alt=""
              fill
              sizes="(min-width: 1152px) 1104px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <h2 className="mt-16 text-[22px] font-semibold tracking-tight">
          {t("alsoTitle")}
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {DEVICES.filter((d) => d.slug !== slug)
            .slice(0, 4)
            .map((d) => (
              <li key={d.slug}>
                <DeviceTile device={d} sizes="(min-width: 1024px) 276px, 50vw" />
              </li>
            ))}
        </ul>
      </div>
    </main>
  );
}

function Specs({ title, lines }: { title: string; lines: string[] }) {
  return (
    <>
      <h2 className="cap mt-9 text-ink-3">{title}</h2>
      <ul className="mt-3 space-y-2">
        {lines.map((line) => (
          <li key={line} className="flex gap-2.5 text-[15px] text-ink-2">
            <Check className="mt-0.5 size-4 shrink-0 text-lime-ink" strokeWidth={2.4} />
            {line}
          </li>
        ))}
      </ul>
    </>
  );
}
