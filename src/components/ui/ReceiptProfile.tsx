import Plate from "@/components/ui/Plate";

// The receipt.
//
// Narrow, monospaced, torn at both ends. Everything is a line item: the name
// is a line item, the phone is a line item, the services are priced and
// totalled. It is the only layout here that admits the profile is a list of
// facts and stops dressing it as anything else.
//
// It suits a trade — a repairer, a driver, a builder, somebody whose card gets
// wedged behind a meter. And it is the one that survives being printed in
// black and white on a shop's own printer, which is a thing people here
// actually do.
//
// The tear is drawn with a repeating conic gradient rather than a zigzag SVG:
// it scales with the width and costs one gradient rather than a path.

type Row = { label: string; value: string; href?: string };

const TEAR =
  "h-3 w-full bg-[repeating-conic-gradient(var(--color-sheet)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]";

export default function ReceiptProfile({
  n,
  name,
  role,
  rows,
  services,
  children,
}: {
  n: string;
  name: string;
  role?: string | null;
  rows: Row[];
  services?: { name: string; price: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[380px] px-4 py-10">
      <div className={TEAR} aria-hidden />

      <div className="bg-sheet px-6 py-7 font-mono">
        <p className="text-center text-[16px] tracking-[0.3em] uppercase">
          Flex
        </p>
        <p className="mt-1 text-center text-[16px] text-mute">flex.com.uz</p>

        <div className="my-5 border-t border-dashed border-ink/30" />

        <h1 className="text-center text-[22px] leading-tight font-bold tracking-[0.04em] uppercase">
          {name}
        </h1>
        {role && (
          <p className="mt-1 text-center text-[16px] text-mute">{role}</p>
        )}

        <div className="mt-5 flex justify-center">
          <Plate n={n} size="sm" mark={false} />
        </div>

        <div className="my-5 border-t border-dashed border-ink/30" />

        <dl>
          {rows.map((r) => (
            <div key={r.label} className="flex min-h-14 items-baseline gap-2 py-2.5">
              <dt className="shrink-0 text-[16px] text-mute uppercase">{r.label}</dt>
              <span
                aria-hidden
                className="mb-1 min-w-4 flex-1 self-end border-b border-dotted border-ink/30"
              />
              <dd className="min-w-0 shrink-0 truncate text-[16px]">
                {r.href ? (
                  <a href={r.href} className="underline underline-offset-2">
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {services && services.length > 0 && (
          <>
            <div className="my-5 border-t border-dashed border-ink/30" />
            <p className="text-[16px] tracking-[0.2em] uppercase">Xizmatlar</p>
            <dl className="mt-2">
              {services.map((s) => (
                <div key={s.name} className="flex min-h-14 items-baseline gap-2 py-2.5">
                  <dt className="min-w-0 text-[16px]">{s.name}</dt>
                  <span
                    aria-hidden
                    className="mb-1 min-w-4 flex-1 self-end border-b border-dotted border-ink/30"
                  />
                  <dd className="shrink-0 text-[16px] font-bold tabular-nums whitespace-nowrap">
                    {s.price}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <div className="my-5 border-t border-dashed border-ink/30" />
        {children}
      </div>

      <div className={`${TEAR} rotate-180`} aria-hidden />
    </div>
  );
}
