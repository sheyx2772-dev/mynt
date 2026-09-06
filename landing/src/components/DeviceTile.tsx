import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { money, type Device } from "@/lib/devices";

/**
 * One object on a shelf.
 *
 * The same tile on the entry page and in the catalogue, because they are the
 * same shelf seen from two distances. Two tiles would drift — a price rounded
 * in one place, a hover that only one of them has — and a visitor who noticed
 * would be right to wonder which page was stale.
 */
export default async function DeviceTile({
  device,
  sizes,
}: {
  device: Device;
  /** How wide the tile actually renders. Wrong here means a blurred photo. */
  sizes: string;
}) {
  const t = await getTranslations("devices");

  return (
    <Link
      href={`/devices/${device.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-colors hover:border-line-lead"
    >
      <div className="relative aspect-square overflow-hidden bg-paper">
        <Image
          src={`/mahsulot/${device.photo}.webp`}
          alt={t(`items.${device.slug}.name`)}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">
            {t(`items.${device.slug}.name`)}
          </span>
          <span className="font-mono text-[13px] tracking-[0.06em] whitespace-nowrap text-ink-3">
            {money(device.price)}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">
          {t(`items.${device.slug}.tagline`)}
        </p>
      </div>
    </Link>
  );
}
