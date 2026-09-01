import LinkIcon from "@/components/LinkIcon";
import { Phone, Mail, ChevronRight } from "lucide-react";

// One row of the card's contact list.
//
// The first version gave every row a saturated brand circle — Instagram's
// gradient, Telegram's blue — copied from the consumer products. On a card a
// company director hands to a client that reads as a toy: six competing colours
// and six bubbles, none of them his.
//
// A printed card of any standing does the opposite. One ink, hairline rules, the
// information ranked by weight rather than by colour. So the rows share a single
// container and are separated by a rule, the icons are monochrome in a quiet
// square, and the only colour on the card is the owner's own photograph.

type Props = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

export default function ActionRow({ label, value, href, external = false }: Props) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition-colors group-hover:border-[color:var(--accent)]/40 group-hover:text-[color:var(--accent)]">
        {label === "Qo'ng'iroq" ? (
          <Phone className="h-4 w-4" />
        ) : label === "Email" ? (
          <Mail className="h-4 w-4" />
        ) : (
          <LinkIcon label={label} className="h-4 w-4" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-medium tracking-[0.16em] text-white/35 uppercase">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-tabular text-sm text-white/85">{value}</span>
      </span>

      <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-colors group-hover:text-white/50" />
    </a>
  );
}
