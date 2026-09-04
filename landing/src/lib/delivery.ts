// Where a device is going, as the buyer typed it.
//
// A pure module on purpose: this is the last chance to catch an address that
// cannot be delivered to, and the checks are the ones a courier actually
// fails on — a name too short to be a name, a phone with no digits in it, a
// street line that says "Toshkent" and nothing else. The database repeats the
// lengths in orders_address_before_making_check; nothing here is the only
// guard.
//
// It is separate from the profile because people buy these as presents. The
// recipient is not necessarily the account holder, and defaulting to the
// account's own details is how a card ends up at the wrong address.

export type Delivery = {
  recipient: string;
  phone: string;
  region: string;
  address: string;
  note: string | null;
};

export type DeliveryField = "recipient" | "phone" | "region" | "address";

export type DeliveryResult =
  | { ok: true; delivery: Delivery }
  | { ok: false; errors: Partial<Record<DeliveryField, string>> };

const LIMITS = {
  recipient: { min: 2, max: 80 },
  region: { min: 2, max: 60 },
  address: { min: 5, max: 300 },
  note: { max: 300 },
} as const;

// Uzbek mobile numbers are twelve digits with the country code and nine
// without. Both are accepted and stored as typed, because a courier reads it
// rather than a machine dialling it — but a string with four digits in it is
// not a phone number, whatever else it contains.
const MIN_DIGITS = 9;
const MAX_DIGITS = 15;

function squash(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
}

export function digitsOf(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Read a delivery address off a submitted form.
 *
 * Every field is reported at once rather than one per submission: this form is
 * shown to somebody who has already paid, and making them discover four
 * problems in four round trips is the worst moment to do it.
 */
export function parseDelivery(form: {
  get(name: string): unknown;
}): DeliveryResult {
  const recipient = squash(form.get("recipient"));
  const phoneRaw = squash(form.get("phone"));
  const region = squash(form.get("region"));
  const address = squash(form.get("address"));
  const note = squash(form.get("note"));

  const errors: Partial<Record<DeliveryField, string>> = {};

  if (recipient.length < LIMITS.recipient.min) {
    errors.recipient = "kim qabul qilishini yozing";
  } else if (recipient.length > LIMITS.recipient.max) {
    errors.recipient = "ism juda uzun";
  }

  const digits = digitsOf(phoneRaw);
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    errors.phone = "telefon raqamini to'liq yozing";
  } else if (!/^[0-9+()\- ]+$/.test(phoneRaw)) {
    errors.phone = "telefon raqamida faqat raqam va + ( ) - bo'lsin";
  }

  if (region.length < LIMITS.region.min) {
    errors.region = "viloyat yoki shaharni yozing";
  } else if (region.length > LIMITS.region.max) {
    errors.region = "juda uzun";
  }

  if (address.length < LIMITS.address.min) {
    errors.address = "ko'cha, uy va xonani yozing";
  } else if (address.length > LIMITS.address.max) {
    errors.address = "manzil juda uzun";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    delivery: {
      recipient,
      phone: phoneRaw,
      region,
      address,
      note: note ? note.slice(0, LIMITS.note.max) : null,
    },
  };
}

/**
 * The address on one line, for the queue and for a courier's label.
 *
 * The note is left out: it is an instruction to whoever knocks ("kechqurun
 * qo'ng'iroq qiling"), not part of where the parcel goes, and printing it on
 * an address line is how it gets read as one.
 */
export function addressLine(delivery: Pick<Delivery, "region" | "address">): string {
  return `${delivery.region}, ${delivery.address}`;
}
