"use client";

import { useActionState, useState } from "react";
import { Plus, Settings2 } from "lucide-react";

import {
  addCategoryAction,
  addItemAction,
  saveVenueAction,
} from "@/app/kabinet/[handle]/menyu/actions";
import type { MenuCategory, Venue } from "@/lib/menu";
import type { EditResult } from "@/lib/menu-edit";

// The three things an owner adds: a dish, a section, and the details about the
// place itself.
//
// All three are collapsed by default. The screen an owner opens twenty times a
// day is the list underneath — take the lagman off, put it back — and forms
// they use once a week should not be standing in front of it.

const field =
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-flex-black/30";
const label = "mb-1 block text-[11px] font-medium tracking-wide text-flex-black/45 uppercase";

const idle: EditResult = { ok: true };

export default function MenuEditor({
  handle,
  venue,
  categories,
}: {
  handle: string;
  venue: Venue;
  categories: MenuCategory[];
}) {
  const [open, setOpen] = useState<"item" | "category" | "venue" | null>("item");

  const [itemState, itemAction, itemBusy] = useActionState(addItemAction, idle);
  const [catState, catAction, catBusy] = useActionState(addCategoryAction, idle);
  const [venueState, venueAction, venueBusy] = useActionState(saveVenueAction, idle);

  const tab = (key: "item" | "category" | "venue", text: string) => (
    <button
      type="button"
      onClick={() => setOpen(open === key ? null : key)}
      className={
        open === key
          ? "rounded-full bg-flex-black px-4 py-2 text-sm font-medium text-white"
          : "rounded-full border border-black/10 px-4 py-2 text-sm text-flex-black/60 hover:bg-black/[0.03]"
      }
    >
      {text}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tab("item", "Taom qo'shish")}
        {tab("category", "Bo'lim qo'shish")}
        {tab("venue", "Obyekt ma'lumotlari")}
      </div>

      {open === "item" && (
        <form action={itemAction} className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
          <input type="hidden" name="handle" value={handle} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="mi-name" className={label}>
                Nomi
              </label>
              <input id="mi-name" name="name" required className={field} placeholder="Lag'mon" />
            </div>
            <div>
              <label htmlFor="mi-price" className={label}>
                Narxi — so&apos;m
              </label>
              <input
                id="mi-price"
                name="price"
                inputMode="numeric"
                required
                className={field}
                placeholder="38000"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="mi-note" className={label}>
                Izoh — ixtiyoriy
              </label>
              <input
                id="mi-note"
                name="note"
                className={field}
                placeholder="Qo'l uzilgan, o'tkir"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="mi-cat" className={label}>
                Bo&apos;lim
              </label>
              <select id="mi-cat" name="category_id" className={field} defaultValue="">
                <option value="">Bo&apos;limsiz</option>
                {categories
                  .filter((c) => c.id !== "boshqa")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Optional on purpose: a cafe types its menu once, in the language
                it thinks in, and a translation nobody wrote is better absent
                than machine-made. The guest page falls back. */}
            <div>
              <label htmlFor="mi-ru" className={label}>
                Ruscha — ixtiyoriy
              </label>
              <input id="mi-ru" name="name_ru" className={field} placeholder="Лагман" />
            </div>
            <div>
              <label htmlFor="mi-en" className={label}>
                Inglizcha — ixtiyoriy
              </label>
              <input id="mi-en" name="name_en" className={field} placeholder="Lagman" />
            </div>
          </div>

          {!itemState.ok && (
            <p className="mt-3 text-sm text-red-600">{itemState.error}</p>
          )}

          <button
            disabled={itemBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 font-medium text-flex-black disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {itemBusy ? "Qo'shilmoqda…" : "Qo'shish"}
          </button>
        </form>
      )}

      {open === "category" && (
        <form action={catAction} className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
          <input type="hidden" name="handle" value={handle} />
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="mc-name" className={label}>
                Nomi
              </label>
              <input id="mc-name" name="name" required className={field} placeholder="Issiq taomlar" />
            </div>
            <div>
              <label htmlFor="mc-ru" className={label}>
                Ruscha
              </label>
              <input id="mc-ru" name="name_ru" className={field} placeholder="Горячее" />
            </div>
            <div>
              <label htmlFor="mc-en" className={label}>
                Inglizcha
              </label>
              <input id="mc-en" name="name_en" className={field} placeholder="Hot dishes" />
            </div>
          </div>

          {!catState.ok && <p className="mt-3 text-sm text-red-600">{catState.error}</p>}

          <button
            disabled={catBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-flex-black px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {catBusy ? "Qo'shilmoqda…" : "Bo'lim qo'shish"}
          </button>
        </form>
      )}

      {open === "venue" && (
        <form action={venueAction} className="mt-4 rounded-2xl border border-black/10 bg-white p-5">
          <input type="hidden" name="handle" value={handle} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="v-name" className={label}>
                Obyekt nomi
              </label>
              <input id="v-name" name="name" required defaultValue={venue.name} className={field} />
            </div>
            <div>
              <label htmlFor="v-hours" className={label}>
                Ish vaqti
              </label>
              <input
                id="v-hours"
                name="hours"
                defaultValue={venue.hours ?? ""}
                className={field}
                placeholder="08:00 – 23:00"
              />
            </div>
            <div>
              <label htmlFor="v-address" className={label}>
                Manzil
              </label>
              <input
                id="v-address"
                name="address"
                defaultValue={venue.address ?? ""}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="v-wifi" className={label}>
                Wi-Fi nomi
              </label>
              <input
                id="v-wifi"
                name="wifi_name"
                defaultValue={venue.wifiName ?? ""}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="v-wifipass" className={label}>
                Wi-Fi paroli
              </label>
              <input
                id="v-wifipass"
                name="wifi_password"
                defaultValue={venue.wifiPassword ?? ""}
                className={field}
              />
            </div>
          </div>

          {!venueState.ok && <p className="mt-3 text-sm text-red-600">{venueState.error}</p>}

          <button
            disabled={venueBusy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-flex-black px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            <Settings2 className="h-4 w-4" />
            {venueBusy ? "Saqlanmoqda…" : "Saqlash"}
          </button>
        </form>
      )}
    </div>
  );
}
