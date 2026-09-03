// A card on the paper face is a sheet, not a panel: white, a hairline border,
// and no shadow at all.
//
// The shadow is not a taste call. On the cheap Android screens most of this
// audience carries, a soft shadow bands into visible rings; and a shadow reads
// as "application chrome" where a border reads as "a document" — which is what
// a profile is meant to feel like to somebody who did not ask to be here.
//
// Cards do not nest. Inside one there are list rows, and that is all.
export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-line bg-white p-4 ${className}`}>
      {children}
    </section>
  );
}
