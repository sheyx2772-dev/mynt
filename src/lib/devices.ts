// Flex is one profile behind three objects. The design set is shared: a
// person who picks Naqsh gets Naqsh whether they wear it on a wrist or carry
// it in a wallet.

// The number and the thing that carries it are priced separately, because they
// are separate things: the number is scarce and its price follows that, while a
// device is manufactured and its price follows what it costs to make. Selling
// the device inside the number's price would mean a rare handle subsidising the
// same piece of metal a common one gets.
export const DEVICE_TYPES = [
  {
    id: "card",
    name: "Karta",
    tagline: "Cho'ntakda, hamyonda",
    description:
      "Bank kartasi o'lchamida. NFC chip va QR-kod bilan — tegizasiz yoki skanerlaysiz.",
    price: 200_000,
  },
  {
    id: "ring",
    name: "Uzuk",
    tagline: "Qo'lda, doim o'zingiz bilan",
    description:
      "Hech narsa olib yurish shart emas. Qo'l siltashning o'zi profilingizni ochadi.",
    price: 350_000,
  },
  {
    id: "bracelet",
    name: "Braslet",
    tagline: "Bilakda, tadbirlar uchun",
    description:
      "Tadbir va konferensiyalarda qulay: qo'lingiz band bo'lsa ham bir tegish yetadi.",
    price: 250_000,
  },
] as const;

export type DeviceTypeId = (typeof DEVICE_TYPES)[number]["id"];

export const DEFAULT_DEVICE_TYPE: DeviceTypeId = "card";

export function isDeviceType(value: unknown): value is DeviceTypeId {
  return DEVICE_TYPES.some((d) => d.id === value);
}

export function devicePrice(id: DeviceTypeId): number {
  return DEVICE_TYPES.find((d) => d.id === id)?.price ?? DEVICE_TYPES[0].price;
}

export function deviceName(id: DeviceTypeId): string {
  return DEVICE_TYPES.find((d) => d.id === id)?.name ?? "Karta";
}
