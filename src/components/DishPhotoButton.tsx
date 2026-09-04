"use client";

import { useActionState, useRef } from "react";
import { ImagePlus, ImageOff } from "lucide-react";

import { setItemPhotoAction } from "@/app/kabinet/[handle]/menyu/actions";
import type { EditResult } from "@/lib/menu-edit";

// Putting a photograph on one dish.
//
// A file input styled as a button and submitted the moment a file is chosen:
// this is used by somebody walking around a kitchen with a phone, one dish at a
// time, and a Choose-file-then-Save pair would double every one of those trips.

const idle: EditResult = { ok: true };

export default function DishPhotoButton({
  handle,
  itemId,
  hasPhoto,
}: {
  handle: string;
  itemId: string;
  hasPhoto: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(setItemPhotoAction, idle);

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {!state.ok && (
        <span className="max-w-32 text-right text-xs leading-tight text-danger-ink">
          {state.error}
        </span>
      )}

      <form action={action} ref={form}>
        <input type="hidden" name="handle" value={handle} />
        <input type="hidden" name="id" value={itemId} />
        <label
          title={hasPhoto ? "Rasmni almashtirish" : "Rasm qo'shish"}
          className={
            hasPhoto
              ? "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-ink-line bg-lime/20 text-paper-2 hover:bg-lime/35"
              : "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-ink-line text-paper-3 hover:bg-ink-s2"
          }
        >
          <ImagePlus className="h-4 w-4" />
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={() => form.current?.requestSubmit()}
          />
        </label>
      </form>

      {hasPhoto && (
        <form action={action}>
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="id" value={itemId} />
          <input type="hidden" name="remove" value="1" />
          <button
            title="Rasmni olib tashlash"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-line text-paper-3 hover:bg-danger-ink/10 hover:text-danger-ink"
          >
            <ImageOff className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
