import LinkIcon from "@/components/LinkIcon";
import { Phone, Mail } from "lucide-react";

// One line of the contact ledger.
//
// The first version gave every row a saturated brand circle — Instagram's
// gradient, Telegram's blue — copied from the consumer products. On a card a
// company director hands to a client that reads as a toy: six competing
// colours and six bubbles, none of them his.
//
// A printed record does the opposite, and this is a printed record: one ink,
// a hairline under each line, the label above the value so a long address
// never has to compete with its own caption for the width. Both are 16px —
// there is no small text on this screen, because it is read outdoors.
//
// The rule is a background rather than a border, so the last line can drop it
// with `last:bg-none` while the row keeps its radius and its pressed state.

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
    <li className="rule last:bg-none">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="-mx-2 flex min-h-16 items-center gap-4 rounded-lg px-2 py-2 active:bg-ink/5"
      >
        <span className="size-5 shrink-0 text-mute">
          {icon === "call" ? (
            <Phone className="size-5" />
          ) : icon === "email" ? (
            <Mail className="size-5" />
          ) : (
            <LinkIcon label={icon} className="size-5" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16px] leading-6 text-mute">{label}</span>
          <span className="text-[16px] leading-6 font-medium break-words text-ink">
            {value}
          </span>
        </span>
      </a>
    </li>
  );
}
