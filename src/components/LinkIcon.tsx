// The four link glyphs, drawn here because lucide dropped its brand icons.
//
// A logo used as the icon on a link to that platform's own profile is the use
// each of these companies publishes their mark for; it is not the same thing as
// printing a marque on a product for sale, which is why `screenWish` still
// refuses that.

type Props = { label: string; className?: string };

const COMMON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export default function LinkIcon({ label, className = "h-4 w-4" }: Props) {
  switch (label) {
    case "Telegram":
      return (
        <svg {...COMMON} className={className}>
          <path d="m21.5 3.5-3.2 16.1c-.24 1.07-.88 1.34-1.78.83l-4.92-3.63-2.37 2.28c-.26.26-.48.48-.99.48l.35-5.02 9.13-8.25c.4-.35-.09-.55-.62-.2L5.82 13.2 1.9 11.97c-.85-.27-.87-.85.18-1.26L20.4 3.28c.7-.26 1.32.16 1.1 1.22Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case "Instagram":
      return (
        <svg {...COMMON} className={className}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...COMMON} className={className}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
          <path d="M7 10.5V17" />
          <circle cx="7" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
          <path d="M11 17v-3.6a2.4 2.4 0 0 1 4.8 0V17" />
          <path d="M11 10.5V17" />
        </svg>
      );
    default:
      return (
        <svg {...COMMON} className={className}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M2.5 12h19" />
          <path d="M12 2.5a15 15 0 0 1 0 19 15 15 0 0 1 0-19Z" />
        </svg>
      );
  }
}
