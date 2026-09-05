// Which payment provider took the money.
//
// The name set as type on the brand's own colour — the same answer
// landing/src/components/ui/BrandTile.tsx already gave, and the same two
// colours, because the two applications describe one brand each way. If either
// colour changes, both files change; there is a note there pointing here.
//
// Not a drawn logo. I do not have Payme's or Click's mark, and a logo drawn
// from memory is a wrong logo — worse than none, because it is wrong in a way
// that looks deliberate. Both publish a merchant brand kit; when we have the
// files they replace `label` here with an <img> and nothing else moves.
//
// Nominative use: this identifies which gateway settled an order, on a screen
// only we see. It is not their mark on something we sell.
const PROVIDERS: Record<string, { label: string; fill: string }> = {
  payme: { label: "Payme", fill: "#00CFCF" },
  click: { label: "Click", fill: "#0071CE" },
};

/** The provider's wordmark, at the size a table row gives it. */
export function Provider({ name }: { name: string }) {
  const p = PROVIDERS[name.toLowerCase()];

  // An unknown provider still has to render: a row that vanishes because a
  // third gateway was added on the backend is worse than an unstyled name.
  if (!p) return <span className="text-muted-foreground text-xs">{name}</span>;

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 font-semibold text-[11px] text-white leading-none tracking-[-0.01em]"
      style={{ backgroundColor: p.fill }}
    >
      {p.label}
    </span>
  );
}
