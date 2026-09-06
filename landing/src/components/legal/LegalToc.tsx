import type { LegalSection } from "@/lib/legal";

// Where you are in a long document, and how to get somewhere else in it.
//
// Hidden below `lg` rather than collapsed into an accordion at the top: on a
// phone the contents list is as long as the reading it saves, and a reader who
// has to open something to find out what is on the page has been given a
// second page instead of a shortcut.
//
// Sticky, so it stays reachable from clause nine. `scroll-margin-top` is set
// globally in `globals.css`, so a jump lands the heading below the sticky
// header rather than underneath it.
export default function LegalToc({
  label,
  sections,
}: {
  label: string;
  sections: LegalSection[];
}) {
  return (
    <nav aria-label={label} className="sticky top-24 hidden lg:block">
      <p className="cap mb-2.5 text-ink-3">{label}</p>
      <ol className="space-y-1">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex gap-2.5 rounded-plate py-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
            >
              <span className="font-mono text-xs text-ink-3 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="leading-snug">{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
