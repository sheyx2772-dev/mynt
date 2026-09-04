// The colour each platform is recognised by.
//
// Used on one layout and one layout only. Everywhere else in this product the
// link rows are monochrome, on purpose: a card a director hands to a client
// with six saturated bubbles on it reads as a toy, and none of those six
// colours is his.
//
// The social layout is the exception, and it is a deliberate one. Somebody
// whose profile IS their accounts — a photographer, a shop, a blogger — is not
// handing over a business card. For them the platform marks are the content,
// and stripping the colour out of them makes the page harder to use rather
// than more tasteful: a person looking for Telegram finds it by its blue
// before they have read a word.
//
// Nominative use: these identify the platform a link goes to, which is what
// each company publishes its mark for. That is a different thing from printing
// a marque on a product for sale, which this project still refuses.

export const PLATFORM_COLOUR: Record<string, string> = {
  Telegram: "#229ED9",
  Instagram: "#D6249F",
  WhatsApp: "#25D366",
  LinkedIn: "#0A66C2",
  Facebook: "#1877F2",
  YouTube: "#FF0033",
};

/** The mark's own colour, or null where the row is not a platform. */
export function platformColour(label: string): string | null {
  return PLATFORM_COLOUR[label] ?? null;
}
