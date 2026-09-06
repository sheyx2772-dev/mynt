import Link from "next/link";
import { Eye } from "lucide-react";

import InvisibleSwitch from "@/components/InvisibleSwitch";
import type { Viewers } from "@/lib/viewers";
import { timeAgo } from "@/lib/relative-time";

// Who opened the profile.
//
// The count is drawn for everyone; the names are what premium buys, and the
// panel says so in one line rather than showing a locked list. An owner who
// went invisible is told the list is empty because of their own switch,
// which is the one case where "nobody" would be a lie.

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function ViewersPanel({ data, invisible }: { data: Viewers; invisible: boolean }) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="size-4 text-paper-3" strokeWidth={1.8} aria-hidden />
          Kim ko&apos;rdi
        </p>
        <p className="font-tabular text-xs text-paper-3">30 kunda {data.count} kishi</p>
      </div>

      {data.reason === "bepul" ? (
        <div className="mt-3 rounded-card border border-ink-line bg-ink-s2 p-4 text-sm text-paper-2">
          Kimligini ko&apos;rish — premium rejada. Hisobi bor odam profilingizni ochsa, ismi va raqami
          shu yerda chiqadi.{" "}
          <Link href="/tarif" className="underline underline-offset-2">Tariflar</Link>
        </div>
      ) : data.reason === "korinmas" ? (
        <p className="mt-3 rounded-card border border-ink-line bg-ink-s2 p-4 text-sm text-paper-2">
          Ko&apos;rinmas rejim yoqilgan — siz ham ro&apos;yxatni ko&apos;rmaysiz. O&apos;chirsangiz yana
          yig&apos;ila boshlaydi.
        </p>
      ) : data.viewers.length === 0 ? (
        <p className="mt-3 text-sm text-paper-3">Hisobi bor odamlar hali ochmagan.</p>
      ) : (
        <ul className="mt-3 divide-y divide-ink-line rounded-card border border-ink-line bg-ink-s1">
          {data.viewers.map((v, i) => (
            <li key={`${v.handle ?? "x"}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
              {v.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-s2 text-xs font-semibold text-paper-2">
                  {initials(v.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                {v.handle ? (
                  <Link href={`/${v.handle}`} className="block truncate text-sm font-medium">{v.name}</Link>
                ) : (
                  <p className="truncate text-sm font-medium">{v.name}</p>
                )}
                <p className="text-xs text-paper-3">
                  {timeAgo(v.at, "uz")}
                  {v.times > 1 ? ` · ${v.times} marta` : ""}
                </p>
              </div>
              {v.handle && <span className="font-mono text-xs text-paper-3">{v.handle}</span>}
            </li>
          ))}
        </ul>
      )}

      <InvisibleSwitch initial={invisible} />
    </section>
  );
}
