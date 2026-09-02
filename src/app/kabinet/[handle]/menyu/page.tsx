import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

import PageShell from "@/components/PageShell";
import { requireUser } from "@/lib/auth";
import { getOwnedVenue, getMenu } from "@/lib/menu";
import { formatNumber } from "@/lib/format";
import { parseHandle } from "@/lib/pricing";
import {
  removeCategoryAction,
  toggleItemAction,
  removeItemAction,
} from "./actions";
import MenuEditor from "@/components/MenuEditor";

export const metadata: Metadata = {
  title: "Menyu — flex.com.uz",
  robots: { index: false },
};

// The owner's side of the table stand.
//
// Server actions and plain forms rather than a client-side editor: this is
// used standing behind a counter on a phone with one bar of signal, and a form
// that posts is the only kind that still works there.

export default async function MenuAdminPage({ params }: PageProps<"/kabinet/[handle]/menyu">) {
  const { handle } = await params;
  const parsed = parseHandle(handle);
  if (!parsed) notFound();

  const normalized = `${parsed.letters}${parsed.digits}`;
  const user = await requireUser(`/kabinet/${normalized}/menyu`);
  const venue = await getOwnedVenue(normalized, user.id);

  // Not theirs, or the number is not a venue. Either way there is nothing here.
  if (!venue) notFound();

  const categories = await getMenu(venue.id, "uz");

  return (
    <PageShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={`/kabinet/${normalized}`}
          className="flex items-center gap-2 text-sm font-medium text-flex-black/60 hover:text-flex-black"
        >
          <ArrowLeft className="h-4 w-4" />
          {normalized}
        </Link>
        <Link
          href={`/${normalized}`}
          className="flex items-center gap-1.5 text-sm font-medium text-flex-black/60 hover:text-flex-black"
        >
          Menyuni ko&apos;rish
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold tracking-tight">{venue.name}</h1>
      <p className="mt-1 mb-8 text-sm text-flex-black/50">
        O&apos;zgartirish darhol ko&apos;rinadi — qayta chop etish kerak emas.
      </p>

      <MenuEditor handle={normalized} venue={venue} categories={categories} />

      {/* The list, with the two controls that get used every day: take a dish
          off, and put it back. */}
      {categories.map((category) => (
        <section key={category.id} className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              {category.name || "Bo'limsiz"}
            </h2>
            {category.id !== "boshqa" && (
              <form action={removeCategoryAction}>
                <input type="hidden" name="handle" value={normalized} />
                <input type="hidden" name="id" value={category.id} />
                <button className="text-xs text-flex-black/35 hover:text-red-600">
                  Bo&apos;limni o&apos;chirish
                </button>
              </form>
            )}
          </div>

          <div className="divide-y divide-black/6 rounded-2xl border border-black/10 bg-white">
            {category.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={item.available ? "font-medium" : "font-medium opacity-45"}>
                    {item.name}
                  </p>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-flex-black/45">{item.note}</p>
                  )}
                </div>

                <p className="shrink-0 font-tabular text-sm font-semibold">
                  {formatNumber(item.price)}
                </p>

                <form action={toggleItemAction} className="shrink-0">
                  <input type="hidden" name="handle" value={normalized} />
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="available" value={item.available ? "0" : "1"} />
                  <button
                    title={item.available ? "Bugun yo'q deb belgilash" : "Menyuga qaytarish"}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-flex-black/50 hover:bg-black/[0.03]"
                  >
                    {item.available ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </form>

                <form action={removeItemAction} className="shrink-0">
                  <input type="hidden" name="handle" value={normalized} />
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    title="O'chirish"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-flex-black/40 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
