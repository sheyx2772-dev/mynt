import {
  CalendarDays,
  CreditCard,
  Globe,
  Link2,
  MessageCircle,
  Send,
} from "lucide-react";

// A glyph for a link, chosen from what the backend says the link is.
//
// lucide dropped its brand marks, and drawing Instagram's own glyph would be
// using somebody else's trademark on a page we sell. So the icons say what a
// row does — write, book, pay, open a site — and the platform names itself in
// the label beside it, which is the part a reader is looking at anyway.
const BY_KIND = {
  website: Globe,
  telegram: Send,
  whatsapp: MessageCircle,
  booking: CalendarDays,
  payment: CreditCard,
} as const;

export default function LinkGlyph({ kind }: { kind?: string }) {
  const Icon = (kind && BY_KIND[kind as keyof typeof BY_KIND]) || Link2;
  return <Icon aria-hidden strokeWidth={1.75} />;
}
