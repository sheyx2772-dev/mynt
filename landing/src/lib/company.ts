// The company behind Flex, and the terms it sells on.
//
// Ported unchanged from the site this one replaces. Kept in one place because
// the same facts appear on the offer, on the contact page, in the footer and
// in what a payment provider checks before it will route money to a site. A
// discrepancy between them is the kind of thing that fails a review.
//
// Nothing here is a secret and nothing here is a decision: the backend bills
// from its own rows. These are the seller's published details, which is why
// they may live in the bundle at all.

export const COMPANY = {
  legalName: '"MC LEGAL" AB',
  shortName: "MC LEGAL",
  inn: "312559000",
  oked: "69101",
  bank: "Ipoteka-bank AKIB Mehnat filiali",
  account: "20212000507346035001",
  mfo: "00423",
  // The registered address, and only that. It is a flat rather than a counter,
  // so it is printed where a buyer looks for who they are paying and never as
  // somewhere to walk into: a page that sends a stranger to a residential door
  // is the kind of listing that gets pulled, and the kind of knock the person
  // behind the door never agreed to. Nothing here links it to a map.
  address:
    "Toshkent shahri, Bektemir tumani, Abay MFY, Rohat ko'chasi, 23-uy, 85-xonadon",
  contactPerson: "Abrorov Javohir",
  phone: "+998 97 724 79 99",
  phoneHref: "+998977247999",
  // A mailbox that actually receives, which info@flex-nfc.uz did not: nothing
  // resolves that host. It is on the public offer, and a payment provider
  // checks it against a message it sends.
  email: "flexnfc@gmail.com",
} as const;

export const DELIVERY = {
  tashkentDays: 1,
  regionsDaysFrom: 2,
  regionsDaysTo: 3,
} as const;

/** Days a manufacturing fault can be reported and the device replaced. */
export const REPLACEMENT_WINDOW_DAYS = 3;

/** How long a handle is held for while a payment is being confirmed. */
export const HOLD_MINUTES = 30;
