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

/**
 * VAT on invoices, in one place because it belongs to the seller and not to any
 * one document.
 *
 * UNDECIDED. Nobody has confirmed it, and it is left at zero because a wrong
 * figure on an invoice is the buyer's accountant's problem and then ours.
 *
 * What the answer depends on, from the legislation rather than from memory:
 *
 *   IT Park residency exempts a resident from every tax until 2028 — except
 *   VAT, which the decree names as excluded from the general privilege. The VAT
 *   relief that does exist covers services *exported*, and a subscription sold
 *   to an Uzbek company is not an export.
 *
 *   The residency privileges themselves are conditional: over half of annual
 *   income from export, or half the staff drawn from IT graduates.
 *
 *   And it depends which legal entity issues the invoice. The seller recorded
 *   here is MC LEGAL, OKED 69101 — legal services, not IT. An IT Park resident
 *   registers under IT codes, so either the residency belongs to a different
 *   entity or the OKED is out of date; whichever it is decides this.
 *
 * Confirm with the company's accountant or IT Park, then set the number. It is
 * read by every invoice, so it only has to be set once.
 *
 * @see https://buxgalter.uz/oz/publish/doc/text205244_sk-2025_it-park_rezidentlari_uchun_imtiezlar_uzaytirildi
 */
export const VAT = {
  percent: 0,
  /**
   * Printed under the total when a rate of zero is a legal exemption rather
   * than simply nothing. An invoice claiming an exemption is expected to name
   * the ground for it; until somebody supplies one, the invoice says only that
   * VAT was not applied, which is a statement of fact rather than a claim.
   */
  exemptionNote: null as string | null,
} as const;

/** Days a manufacturing fault can be reported and the device replaced. */
export const REPLACEMENT_WINDOW_DAYS = 3;
