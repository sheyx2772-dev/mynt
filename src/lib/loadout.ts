import { DEVICE_TYPES, type DeviceTypeId } from "@/lib/devices";
import { VERTICALS, type VerticalId } from "@/lib/venues";
import type { ShotName } from "@/lib/product-shots";

// Everything Flex sells, in one list, as things with pictures.
//
// The three devices already exist in devices.ts with their prices, and the
// verticals in venues.ts. This file does not restate either — it only says
// which photograph belongs to which, and adds the one item that is neither:
// the car card, which is a device we have not priced yet.

/** A device that has no row in DEVICE_TYPES because it has no price yet. */
export const UNPRICED_DEVICE = "avtovizitka" as const;

export type LoadoutDeviceId = DeviceTypeId | typeof UNPRICED_DEVICE;

export const LOADOUT_DEVICES: readonly LoadoutDeviceId[] = [
  ...DEVICE_TYPES.map((d) => d.id),
  UNPRICED_DEVICE,
];

export function isLoadoutDevice(value: unknown): value is LoadoutDeviceId {
  return (
    typeof value === "string" && (LOADOUT_DEVICES as readonly string[]).includes(value)
  );
}

const DEVICE_SHOTS: Record<LoadoutDeviceId, ShotName> = {
  card: "karta",
  ring: "uzuk",
  bracelet: "braslet",
  avtovizitka: "avtovizitka",
};

const VERTICAL_SHOTS: Record<VerticalId, ShotName | null> = {
  cafe: "kafe",
  hotel: "mehmonxona",
  shop: "dokon",
  other: "salon",
};

export function deviceShot(id: LoadoutDeviceId): ShotName {
  return DEVICE_SHOTS[id];
}

export function verticalShot(id: VerticalId): ShotName | null {
  return VERTICAL_SHOTS[id];
}

/** The price, or null when it is still a conversation. */
export function devicePriceOrNull(id: LoadoutDeviceId): number | null {
  const found = DEVICE_TYPES.find((d) => d.id === id);
  return found ? found.price : null;
}

export { VERTICALS };
export type { VerticalId };

/** The same objects with their background removed, for the suspended hero. */
const CUTOUTS: Record<string, string> = {
  card: "karta",
  ring: "uzuk",
  bracelet: "braslet",
  avtovizitka: "avtovizitka",
  "hayvon-teg": "hayvon-teg",
};

export function deviceCutout(id: string): string | null {
  const name = CUTOUTS[id];
  return name ? `/mahsulot/kesilgan/${name}.png` : null;
}

/**
 * The same object in the other finish.
 *
 * Two sets were supplied and both are used. The hero exists to say the number
 * comes on a range of things; showing one object in two finishes says that
 * better than showing it once, and costs nothing but a second file.
 */
export function deviceCutoutAlt(id: string): string | null {
  const name = CUTOUTS[id];
  return name ? `/mahsulot/kesilgan/${name}-2.png` : null;
}
