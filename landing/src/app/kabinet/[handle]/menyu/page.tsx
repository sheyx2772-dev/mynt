import ConfirmDelete from "@/components/ConfirmDelete";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import { requireUser } from "@/lib/auth";
import { getOwnedVenue, getMenu } from "@/lib/menu";
import { formatNumber } from "@/lib/format";
import { parseHandle } from "@/lib/pricing";
import {
  removeCategoryAction,
  toggleItemAction,
  removeItemAction,
  moveItemAction,
  moveCategoryAction,
} from "./actions";
import MenuEditor from "@/components/MenuEditor";
import DishPhotoButton from "@/components/DishPhotoButton";
import { venueWords } from "@/lib/venue-words";

export const metadata: Metadata = {
  title: "Ro'yxat",
  robots: { index: false },
};

// The owner's side of the tag — a table stand in a cafe, a card by the door in
// a hotel. One editor: the rows are the same shape and only the nouns differ.
//
// Server actions and plain forms rather than a client-side editor: this is
// used standing behind a counter on a phone with one bar of signal, and a form
// that posts is the only kind that still works there.

/** One nudge up or down. Plain forms, so it works on a counter phone with one
    bar of signal exactly as the rest of this screen does. */
function Move({
  action,
  handle,
  id,
  direction,
}: {
  action: (form: FormData) => Promise<void>;
  handle: string;
  id: string;
  direction: "up" | "down";
}) {
  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        title={direction === "up" ? "Yuqoriga" : "Pastga"}
        className="flex size-11 items-center justify-center rounded-plate text-paper-3 hover:bg-ink-s2 hover:text-paper"
      >
        {direction === "up" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}

export default async function MenuAdminPage({
  params,
}: PageProps<"/kabinet/[handle]/menyu">) {
  const { handle } = await params;
  const parsed = parseHandle(handle);
  if (!parsed) notFound();

  const normalized = `${parsed.letters}${parsed.digits}`;
  const user = await requireUser(`/kabinet/${normalized}/menyu`);
  const venue = await getOwnedVenue(normalized);

  // Not theirs, or the number is not a venue. Either way there is nothing here.
  // Owning the number but not having made it a place is not an error — it is
  // the state every number starts in. Sending them to the screen that creates
  // one is what obyekt/page.tsx already does in the mirror case.
  if (!venue) redirect(`/kabinet/${normalized}/obyekt`);

  const categories = await getMenu(normalized, "uz");
  const w = venueWords(venue.kind, "uz");

  return (
    <PageShell surface="ink">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link
          href={`/kabinet/${normalized}`}
          className="flex items-center gap-2 text-sm font-medium text-paper-2 hover:text-paper"
        >
          <ArrowLeft className="h-4 w-4" />
          {normalized}
        </Link>
        <Link
          href={`/${normalized}`}
          className="flex items-center gap-1.5 text-sm font-medium text-paper-2 hover:text-paper"
        >
          {w.listTitle}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <h1 className="font-display text-2xl font-semibold tracking-tight">
        {venue.name}
      </h1>
      <p className="mt-1 mb-8 text-sm text-paper-2">
        O&apos;zgartirish darhol ko&apos;rinadi — qayta chop etish kerak emas.
      </p>

      <MenuEditor
        handle={normalized}
        venue={venue}
        categories={categories}
        w={w}
      />

      {/* The list, with the two controls that get used every day: take a dish
          off, and put it back. */}
      {categories.map((category) => (
        <section key={category.id} className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-paper-3 uppercase">
              {category.name || "Bo'limsiz"}
            </h2>
            {category.id !== "boshqa" && (
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/kabinet/${normalized}/menyu/bolim/${category.id}`}
                  title="Nomini o'zgartirish"
                  className="flex size-11 items-center justify-center rounded-plate text-paper-3 hover:bg-ink-s2 hover:text-paper"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <Move
                  action={moveCategoryAction}
                  handle={normalized}
                  id={category.id}
                  direction="up"
                />
                <Move
                  action={moveCategoryAction}
                  handle={normalized}
                  id={category.id}
                  direction="down"
                />
                <ConfirmDelete
                  className="ml-1.5"
                  what={`«${category.name}» va undagi ${category.items.length} ta ${w.itemWord}`}
                  action={async () => {
                    "use server";
                    return removeCategoryAction(normalized, category.id);
                  }}
                />
              </div>
            )}
          </div>

          <div className="divide-y divide-ink-line rounded-card border border-ink-line bg-ink-s1">
            {category.items.map((item) => (
              // Two lines, not one. The controls outgrew the row the moment
              // reordering and editing joined them, and a dish called "Bahor
              // salati" was wrapping to three lines to make space for buttons.
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-plate object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        item.available
                          ? "font-medium"
                          : "font-medium opacity-45"
                      }
                    >
                      {item.name}
                    </p>
                    {item.note && (
                      <p className="mt-0.5 text-xs text-paper-3">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <p className="shrink-0 font-tabular text-sm font-semibold">
                    {item.price === 0 ? (
                      <span className="text-xs font-medium text-paper-3">
                        {w.freeWord}
                      </span>
                    ) : (
                      formatNumber(item.price)
                    )}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <Move
                    action={moveItemAction}
                    handle={normalized}
                    id={item.id}
                    direction="up"
                  />
                  <Move
                    action={moveItemAction}
                    handle={normalized}
                    id={item.id}
                    direction="down"
                  />

                  <Link
                    href={`/kabinet/${normalized}/menyu/${item.id}`}
                    title="Tahrirlash"
                    className="flex size-11 shrink-0 items-center justify-center rounded-plate border border-ink-line text-paper-2 hover:bg-ink-s2"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  <DishPhotoButton
                    handle={normalized}
                    itemId={item.id}
                    hasPhoto={Boolean(item.photoUrl)}
                  />

                  <form action={toggleItemAction} className="shrink-0">
                    <input type="hidden" name="handle" value={normalized} />
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="available"
                      value={item.available ? "0" : "1"}
                    />
                    <button
                      title={
                        item.available
                          ? `${w.soldOut} deb belgilash`
                          : "Ro'yxatga qaytarish"
                      }
                      className="flex size-11 items-center justify-center rounded-plate border border-ink-line text-paper-2 hover:bg-ink-s2"
                    >
                      {item.available ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </form>

                  <div className="shrink-0">
                    <ConfirmDelete
                      what={`«${item.name}»`}
                      action={async () => {
                        "use server";
                        return removeItemAction(normalized, item.id);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
