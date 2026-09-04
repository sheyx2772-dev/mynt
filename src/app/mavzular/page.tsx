import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Eye, Phone, Send } from "lucide-react";

import CardObject from "@/components/ui/CardObject";
import Plate from "@/components/ui/Plate";
import { CARD_DESIGNS } from "@/lib/card-designs";

export const metadata: Metadata = {
  title: "Mavzular — flex.com.uz",
  robots: { index: false },
};

// Every theme, rendering the same profile.
//
// Side by side and with identical content on purpose: a theme judged on its
// own, with copy chosen to suit it, always looks good. The only honest
// comparison is the same name, the same number and the same four buttons in
// all of them, so what differs is the theme and nothing else.
//
// Not linked from anywhere. This is a bench, not a page — it exists so a
// decision about which themes to sell can be made by looking rather than by
// reading hex values.

const THEMES = [
  { id: "paper", name: "Qog'oz", note: "Oq varaq, qora karta. Asosiy." },
  { id: "suzani", name: "Suzani", note: "Krem yer, qizil ipak, gul." },
  { id: "ganch", name: "Ganch", note: "O'yilgan gips va feruza." },
  { id: "registon", name: "Registon", note: "Lojuvard tunda oq varaq." },
  { id: "adras", name: "Adras", note: "Bo'yalgan ip, chetlari oqadi." },
  { id: "qogoz", name: "Samarqand qog'ozi", note: "Tut po'stlog'i, yong'oq siyoh." },
  { id: "polat", name: "Po'lat", note: "Ishqalangan metall, signal rangi." },
  { id: "shaffof", name: "Shaffof", note: "Muzli plastik, sovuq yorug'lik." },
  { id: "tungi", name: "Tungi", note: "Qora sahifa, lime. Oldingi yuz." },
] as const;

/** Which designs open in a given theme — the answer to "who gets this one". */
function designsIn(theme: string): string[] {
  return CARD_DESIGNS.filter((d) => d.theme === theme).map((d) => d.name);
}

function Sample({ theme }: { theme: string }) {
  return (
    <div data-theme={theme} className="themed rounded-2xl px-3 pt-6 pb-8">
      <CardObject n="MYN042" name="Aziz Karimov" />

      <div className="relative z-10 mx-3 -mt-12 rounded-2xl bg-sheet px-5 pt-16 pb-6 text-ink shadow-sheet">
        <div className="flex items-end gap-4">
          <div className="relative -mt-10 flex size-24 shrink-0 items-center justify-center rounded-[14px] border-[3px] border-sheet bg-ink text-[28px] font-semibold text-sheet shadow-photo">
            AK
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-[24px] leading-tight font-semibold tracking-[-0.01em]">
              Aziz Karimov
            </p>
            <p className="mt-1 text-[16px] leading-6 text-mute">
              Direktor · <span className="font-medium text-ink">MC LEGAL</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Plate n="MYN042" size="lg" />
        </div>

        <p className="mt-5 text-[16px] leading-relaxed text-ink/85">
          Korporativ huquq, shartnomalar va sud vakilligi — 12 yillik amaliyot.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <span className="flex h-14 items-center justify-center gap-2.5 rounded-xl bg-ink text-[16px] font-semibold text-sheet shadow-slab">
            <Phone className="size-5" />
            Qo&apos;ng&apos;iroq
          </span>
          <span className="flex h-14 items-center justify-center gap-2.5 rounded-xl bg-ink text-[16px] font-semibold text-sheet shadow-slab">
            <Send className="size-5" />
            Telegram
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <span className="flex min-h-14 items-center justify-center rounded-xl bg-paper px-3 py-2 text-[16px] leading-5 font-medium text-balance shadow-deboss">
            Tavsiya qilaman
          </span>
          <span className="flex min-h-14 items-center justify-center rounded-xl bg-paper px-3 py-2 text-[16px] leading-5 font-medium text-balance shadow-deboss">
            Obuna bo&apos;lish
          </span>
        </div>

        <div className="mt-5 flex items-center gap-5 text-[16px] leading-6 text-mute">
          <span className="flex items-center gap-2">
            <Eye className="size-4" />
            <span className="font-medium text-ink tabular-nums">823</span> ko&apos;rish
          </span>
          <span className="size-1 rounded-full bg-mute/50" />
          <span className="flex items-center gap-2">
            <Clock className="size-4" />2 kun oldin
          </span>
        </div>

        <div className="mt-5">
          <p className="rule pb-3 text-[16px] font-semibold tracking-[0.1em] uppercase">
            Xizmatlar
          </p>
          <div className="rule flex min-h-14 items-baseline gap-3 py-3">
            <span className="text-[16px] leading-6">Sudda vakillik</span>
            <span className="mb-1.5 min-w-6 flex-1 self-end border-b-2 border-dotted border-ink/35" />
            <span className="shrink-0 text-[16px] leading-6 font-semibold tabular-nums">
              4&nbsp;000&nbsp;000&nbsp;so&apos;m
            </span>
          </div>
        </div>

        <div className="mt-6">
          <span className="flex h-14 items-center justify-center rounded-xl bg-lime text-[16px] font-semibold text-ink shadow-slab">
            Kontaktni saqlash
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  return (
    <div className="min-h-full bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.01em]">
          Mavzular
        </h1>
        <p className="mt-2 max-w-[60ch] text-[16px] leading-6 text-mute">
          To&apos;qqiztasi ham bir xil profilni ko&apos;rsatadi — bir xil ism, bir
          xil raqam, bir xil to&apos;rtta tugma. Har biri o&apos;z matni bilan
          bezansa, hammasi chiroyli chiqadi; farqni faqat shunday ko&apos;rish
          mumkin. Kontrasti <code className="font-mono">npm run themes</code>{" "}
          bilan o&apos;lchangan.
        </p>
        <p className="mt-2 text-[16px] leading-6 text-mute">
          <Link href="/MYN042" className="font-medium text-ink underline">
            Haqiqiy profilni ochish →
          </Link>
        </p>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {THEMES.map((t) => {
            const designs = designsIn(t.id);
            return (
              <section key={t.id}>
                <header className="mb-3">
                  <h2 className="text-[17px] leading-6 font-semibold">{t.name}</h2>
                  <p className="text-[16px] leading-6 text-mute">{t.note}</p>
                  <p className="mt-0.5 text-[16px] leading-6 text-mute">
                    {designs.length > 0 ? designs.join(", ") : "— hali kartasi yo'q"}
                  </p>
                </header>
                <Sample theme={t.id} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
