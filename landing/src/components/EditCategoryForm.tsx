"use client";

import { useActionState } from "react";
import Link from "next/link";

import { editCategoryAction } from "@/app/kabinet/[handle]/menyu/actions";
import type { EditResult } from "@/lib/menu-edit";
import type { VenueWords } from "@/lib/venue-words";

// Renaming one section.
//
// Three fields, because a section is a heading and nothing else. The two
// translations sit under the name rather than behind a toggle: somebody who
// opened this screen to fix a typo in the Uzbek almost always has the same typo
// in the Russian.

const field =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-flex-black/30";
const label = "mb-1 block text-[11px] font-medium tracking-wide text-flex-black/45 uppercase";

const idle: EditResult = { ok: true };

export default function EditCategoryForm({
  handle,
  category,
  w,
}: {
  handle: string;
  category: { id: string; name: string; nameRu: string | null; nameEn: string | null };
  w: VenueWords;
}) {
  const [state, action, busy] = useActionState(editCategoryAction, idle);

  return (
    <form action={action}>
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="id" value={category.id} />

      <div className="rounded-2xl border border-black/10 bg-white p-5">
        <div className="grid gap-3">
          <div>
            <label htmlFor="ec-name" className={label}>
              Nomi
            </label>
            <input
              id="ec-name"
              name="name"
              required
              defaultValue={category.name}
              placeholder={w.categoryPlaceholder}
              className={field}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ec-ru" className={label}>
                Ruscha
              </label>
              <input
                id="ec-ru"
                name="name_ru"
                defaultValue={category.nameRu ?? ""}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="ec-en" className={label}>
                Inglizcha
              </label>
              <input
                id="ec-en"
                name="name_en"
                defaultValue={category.nameEn ?? ""}
                className={field}
              />
            </div>
          </div>
        </div>

        {!state.ok && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

        <button
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-lime px-5 py-3.5 font-medium text-flex-black disabled:opacity-60"
        >
          {busy ? "Saqlanmoqda…" : "Saqlash"}
        </button>
      </div>

      <Link
        href={`/kabinet/${handle}/menyu`}
        className="mt-4 block text-center text-sm text-flex-black/50 hover:text-flex-black"
      >
        {w.listTitle}ga qaytish
      </Link>
    </form>
  );
}
