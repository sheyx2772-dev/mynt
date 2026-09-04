"use client";

import { useActionState } from "react";
import Link from "next/link";

import { editItemAction } from "@/app/kabinet/[handle]/menyu/actions";
import type { EditResult } from "@/lib/menu-edit";
import type { VenueWords } from "@/lib/venue-words";

// Correcting one row.
//
// The price is first and largest, because that is what this screen gets opened
// for: a menu is typed once and repriced every few months. Everything else is
// underneath it in the order somebody would think of it.

const field =
  "w-full rounded-xl border border-ink-line bg-ink-s1 px-3 py-2.5 text-sm outline-none focus:border-flex-black/30";
const label = "mb-1 block text-[11px] font-medium tracking-wide text-paper-3 uppercase";

const idle: EditResult = { ok: true };

export default function EditDishForm({
  handle,
  item,
  categories,
  w,
}: {
  handle: string;
  item: {
    id: string;
    name: string;
    nameRu: string | null;
    nameEn: string | null;
    note: string | null;
    price: number;
    categoryId: string | null;
    photoUrl: string | null;
  };
  categories: { id: string; name: string }[];
  w: VenueWords;
}) {
  const [state, action, busy] = useActionState(editItemAction, idle);

  return (
    <form action={action}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="id" value={item.id} />

      <div className="rounded-2xl border border-ink-line bg-ink-s1 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="ed-price" className={label}>
              Narxi — so&apos;m
            </label>
            <input
              id="ed-price"
              name="price"
              inputMode="numeric"
              required
              defaultValue={item.price}
              className={`${field} font-tabular text-lg font-semibold`}
            />
          </div>

          <div>
            <label htmlFor="ed-cat" className={label}>
              Bo&apos;lim
            </label>
            <select
              id="ed-cat"
              name="category_id"
              className={field}
              defaultValue={item.categoryId ?? ""}
            >
              <option value="">Bo&apos;limsiz</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ed-name" className={label}>
              Nomi
            </label>
            <input
              id="ed-name"
              name="name"
              required
              defaultValue={item.name}
              className={field}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ed-note" className={label}>
              Izoh
            </label>
            <input
              id="ed-note"
              name="note"
              defaultValue={item.note ?? ""}
              placeholder={w.notePlaceholder}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="ed-ru" className={label}>
              Ruscha
            </label>
            <input
              id="ed-ru"
              name="name_ru"
              defaultValue={item.nameRu ?? ""}
              placeholder={w.itemPlaceholderRu}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="ed-en" className={label}>
              Inglizcha
            </label>
            <input
              id="ed-en"
              name="name_en"
              defaultValue={item.nameEn ?? ""}
              placeholder={w.itemPlaceholderEn}
              className={field}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="ed-photo" className={label}>
              Rasm
            </label>
            <div className="flex items-center gap-3">
              {item.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                <img
                  src={item.photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              )}
              <input
                id="ed-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={field}
              />
            </div>
            {/* Said plainly, because the opposite is what somebody fears when
                they open this screen to change a price. */}
            <p className="mt-1 text-xs text-paper-3">
              Bo&apos;sh qoldirsangiz hozirgi rasm saqlanadi.
            </p>
          </div>
        </div>

        {!state.ok && <p className="mt-3 text-sm text-danger-ink">{state.error}</p>}
        <button
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-lime px-5 py-3.5 font-medium text-ink disabled:opacity-60"
        >
          {busy ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>

      <Link
        href={`/kabinet/${handle}/menyu`}
        className="mt-4 block text-center text-sm text-paper-2 hover:text-paper"
      >
        {w.listTitle}ga qaytish
      </Link>
    </form>
  );
}
