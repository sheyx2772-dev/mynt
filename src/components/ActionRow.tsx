import LinkIcon from "@/components/LinkIcon";
import { Phone, Mail, ChevronRight, ArrowUpRight } from "lucide-react";

// One row of the card's contact list.
//
// The first version gave every row a saturated brand circle — Instagram's
// gradient, Telegram's blue — copied from the consumer products. On a card a
// company director hands to a client that reads as a toy: six competing colours
// and six bubbles, none of them his.
//
// A printed card of any standing does the opposite. One ink, hairline rules,
// the information ranked by weight rather than by colour. So the rows share a
// single container and are separated by a rule, the icons are monochrome, and
// the only colour on the card is the owner's own photograph.
//
// 56px minimum, because it is tapped by a thumb belonging to somebody standing
// up. And the arrow tells the truth about where it goes: a chevron for a page
// inside this site, an outward arrow for anything that leaves it.

type Props = {
  /** What the row is, in the visitor's language. */
  label: string;
  /** Which glyph to draw. Not translated — it names a platform, or an action. */
  icon: string;
  value: string;
  href: string;
  external?: boolean;
};

export default function ActionRow({ label, icon, value, href, external = false }: Props) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-[56px] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 active:bg-fill"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-ink-2">
        {icon === "call" ? (
          <Phone className="h-5 w-5" />
        ) : icon === "email" ? (
          <Mail className="h-5 w-5" />
        ) : (
          <LinkIcon label={icon} className="h-5 w-5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] leading-6">{label}</span>
        <span className="num block truncate text-[13px] leading-[18px] text-ink-3">
          {value}
        </span>
      </span>

      {external ? (
        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-3" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-3" />
      )}
    </a>
  );
}
