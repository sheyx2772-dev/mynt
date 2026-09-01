import LinkIcon from "@/components/LinkIcon";
import { Phone, Mail, ArrowRight } from "lucide-react";

// One row of the card's action list.
//
// Every profile in this market — Dot, Popl, Blinq — uses the same row and for a
// good reason: a centred button that says only "Instagram" makes a person tap to
// find out where they are going. A row that carries the icon, the label and the
// value answers that before the tap, and puts a phone number and a social link
// on the same footing, which is what a visiting card does.

type Props = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

// Each platform's own colour, so the list reads as a list of places rather than
// a stack of identical grey bars. The call and mail rows take semantic colours
// instead, because they are actions rather than destinations.
const TINT: Record<string, string> = {
  Telegram: "bg-[#229ED9]",
  Instagram: "bg-gradient-to-br from-[#F9CE34] via-[#EE2A7B] to-[#6228D7]",
  LinkedIn: "bg-[#0A66C2]",
  "Qo'ng'iroq": "bg-[#2FA84F]",
  Email: "bg-[#5B7CFA]",
};

export default function ActionRow({ label, value, href, external = false }: Props) {
  const tint = TINT[label] ?? "bg-white/15";

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${tint}`}
      >
        {label === "Qo'ng'iroq" ? (
          <Phone className="h-5 w-5" />
        ) : label === "Email" ? (
          <Mail className="h-5 w-5" />
        ) : (
          <LinkIcon label={label} className="h-5 w-5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="block truncate font-tabular text-xs text-white/45">{value}</span>
      </span>

      <ArrowRight className="h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
    </a>
  );
}
