"use client";

import { useActionState, useState } from "react";
import { Car, Check, Copy, Dog, Package, Plus, QrCode } from "lucide-react";

import { addTag, toggleTag, type TagState } from "@/app/kabinet/[handle]/buyumlar/actions";
import { TAG_KINDS, type TagKind } from "@/lib/tags";
import type { Tag } from "@/lib/object-tags";

// The owner's list of things, and the addresses printed on them.
//
// The address is the product here: it goes on a sticker or into an NFC tag, so
// the one thing this screen must do well is hand it over — copyable, and a QR
// away from being printed.

const ICON: Record<TagKind, typeof Car> = {
  car: Car,
  pet: Dog,
  thing: Package,
};

const KIND_NAME: Record<TagKind, string> = {
  car: "Mashina",
  pet: "Hayvon",
  thing: "Buyum",
};

function TagAddress({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://flex.com.uz/x/${token}`;

  return (
    <div className="mt-3 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-xl bg-ink-s2 px-3 py-2 font-tabular text-[12px] text-paper-2">
        {url}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // A denied clipboard is not worth a dialogue: the address is on
            // screen and can be selected.
          }
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink-s2 px-3 py-2 text-[12px] font-medium transition-colors hover:bg-ink-s2"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-lime" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Nusxa olindi" : "Nusxa"}
      </button>
      <a
        href={`/${token}/qr`}
        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-ink-s2 px-3 py-2 text-[12px] font-medium transition-colors hover:bg-ink-s2"
        aria-label="QR"
      >
        <QrCode className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export default function TagList({ handle, tags }: { handle: string; tags: Tag[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, saving] = useActionState<TagState, FormData>(addTag, {});
  const [kind, setKind] = useState<TagKind>("car");

  return (
    <section>
      <ul className="space-y-2">
        {tags.map((tag, i) => {
          const Icon = ICON[tag.kind];
          return (
            <li
              key={tag.id}
              className="rise rounded-2xl border border-ink-line bg-ink-s1 p-4"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={
                    tag.active
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-s2 text-paper"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-s2 text-paper-3"
                  }
                >
                  <Icon className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold tracking-tight">
                    {tag.label ?? KIND_NAME[tag.kind]}
                    {!tag.active && (
                      <span className="ml-2 font-normal text-paper-3">
                        to&apos;xtatilgan
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12px] text-paper-3">
                    {KIND_NAME[tag.kind]}
                  </p>
                </div>

                {tag.unread > 0 && (
                  <span className="shrink-0 rounded-lg bg-lime px-2 py-1 font-tabular text-[11px] font-semibold text-ink">
                    {tag.unread}
                  </span>
                )}

                <form action={toggleTag} className="shrink-0">
                  <input type="hidden" name="handle" value={handle} />
                  <input type="hidden" name="tagId" value={tag.id} />
                  <input type="hidden" name="active" value={tag.active ? "0" : "1"} />
                  <button
                    type="submit"
                    className="rounded-xl px-3 py-2 text-[12px] text-paper-3 transition-colors hover:text-paper"
                  >
                    {tag.active ? "To'xtatish" : "Yoqish"}
                  </button>
                </form>
              </div>

              {tag.active && <TagAddress token={tag.token} />}
            </li>
          );
        })}
      </ul>

      {state.token && (
        <p className="mt-3 rounded-2xl border border-lime/50 bg-lime/[0.08] px-4 py-3 text-[13px]">
          Qo&apos;shildi. Manzilni nusxa olib, stikerga yoki NFC tegiga yozing.
        </p>
      )}

      {open ? (
        <form
          action={action}
          className="mt-4 rounded-[1.5rem] border border-ink-line bg-ink-s1 p-5"
        >
          <input type="hidden" name="handle" value={handle} />
          <input type="hidden" name="kind" value={kind} />

          <div className="flex gap-2">
            {TAG_KINDS.map((k) => {
              const Icon = ICON[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={
                    kind === k
                      ? "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-s2 px-3 py-2.5 text-[12px] font-semibold text-paper"
                      : "flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink-s2 px-3 py-2.5 text-[12px] text-paper-2 transition-colors hover:bg-ink-s2"
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {KIND_NAME[k]}
                </button>
              );
            })}
          </div>

          <input
            name="label"
            placeholder={kind === "pet" ? "Rex" : kind === "car" ? "Malibu" : "Kalitlar"}
            className="mt-3 w-full rounded-xl bg-ink-s2 px-4 py-3 text-[14px] outline-none placeholder:text-paper-3 focus:bg-ink-s2"
          />
          {/* Said here because it is not obvious and it matters: a stranger who
              is greeted by name sounds like somebody who knows you. */}
          <p className="mt-1.5 text-[12px] text-paper-3">
            Faqat siz ko&apos;rasiz — xabar yozayotgan odamga ko&apos;rsatilmaydi.
          </p>

          {state.error && (
            <p className="mt-3 text-[13px] text-danger-ink">{state.error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink-s2 px-5 py-2.5 text-[13px] font-semibold text-paper disabled:opacity-40"
            >
              {saving ? "Qo'shilyapti…" : "Qo'shish"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-[13px] text-paper-3"
            >
              Yopish
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-ink-line px-5 py-3 text-[13px] text-paper-2 transition-colors hover:border-black/40"
        >
          <Plus className="h-4 w-4" />
          Buyum qo&apos;shish
        </button>
      )}
    </section>
  );
}
