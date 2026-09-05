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

/**
 * Every finish an object has been shot in, newest first.
 *
 * Not a fixed number per object: the sets arrive as they arrive, and the
 * bracelet has five where the pet tag has two. Anything that assumes the
 * counts match breaks the next time one more file turns up.
 */
const CUTOUTS: Record<string, string[]> = {
  card: ["karta", "karta-2", "karta-3", "karta-4", "karta-5", "karta-6"],
  ring: ["uzuk", "uzuk-2", "uzuk-3", "uzuk-4", "uzuk-5", "uzuk-6"],
  bracelet: [
    "braslet", "braslet-2", "braslet-3", "braslet-4",
    "braslet-5", "braslet-6", "braslet-7", "braslet-8",
  ],
  avtovizitka: ["avtovizitka", "avtovizitka-2", "avtovizitka-3"],
  "hayvon-teg": [
    "hayvon-teg", "hayvon-teg-2", "hayvon-teg-3",
    "hayvon-teg-4", "hayvon-teg-5",
  ],
};

export function deviceCutouts(id: string): string[] {
  return (CUTOUTS[id] ?? []).map((n) => `/mahsulot/kesilgan/${n}.png`);
}

export function deviceCutout(id: string): string | null {
  return deviceCutouts(id)[0] ?? null;
}
