// The company behind Flex, and the terms it sells on.
//
// Kept in one place because the same facts appear on the terms page, in the
// footer and in what a payment provider checks before it will route money to
// a site. A discrepancy between them is the kind of thing that fails a review.

export const COMPANY = {
  legalName: '"MC LEGAL" AB',
  shortName: "MC LEGAL",
  inn: "312559000",
  oked: "69101",
  bank: 'Ipoteka-bank AKIB Mehnat filiali',
  account: "20212000507346035001",
  mfo: "00423",
  address:
    "Toshkent shahri, Bektemir tumani, Abay MFY, Rohat ko'chasi, 23-uy, 85-xonadon",
  contactPerson: "Abrorov Javohir",
  phone: "+998 97 724 79 99",
  phoneHref: "+998977247999",
  email: "info@flex.com.uz",
} as const;

export const DELIVERY = {
  tashkentDays: 1,
  regionsDaysFrom: 2,
  regionsDaysTo: 3,
} as const;

/** Days a manufacturing fault can be reported and the device replaced. */
export const REPLACEMENT_WINDOW_DAYS = 3;
