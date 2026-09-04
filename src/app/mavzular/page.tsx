import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Eye, Phone, Send } from "lucide-react";

import CardObject from "@/components/ui/CardObject";
import PlaqueProfile from "@/components/ui/PlaqueProfile";
import SocialProfile from "@/components/ui/SocialProfile";
import PosterProfile from "@/components/ui/PosterProfile";
import ReceiptProfile from "@/components/ui/ReceiptProfile";
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
  { id: "registon", name: "Registon", note: "Lojuvard tunda oq varaq." },
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

// The ceremonial layout, rendered from the same data as the rest.
function PlaqueSample() {
  return (
    <div data-theme="zarbof" className="themed rounded-2xl">
      <PlaqueProfile
        n="MYN042"
        name="Aziz Karimov"
        role="Direktor"
        company="MC LEGAL"
        lastSeen="Oxirgi faollik: 2 kun oldin"
        bio="Korporativ huquq, shartnomalar va sud vakilligi — 12 yillik amaliyot."
        badges={[{ label: "Top #1" }, { label: "Obuna", href: "#" }]}
        stats={[
          { value: "823", label: "Ko'rish" },
          { value: "12", label: "Tavsiya" },
        ]}
        tabs={[
          { label: "Vizitka", active: true, href: "#" },
          { label: "Postlar", active: false, href: "#" },
        ]}
        links={[
          { label: "Telegram", text: "Telegram kanal", href: "#" },
          { label: "Instagram", text: "Instagram", href: "#" },
          { label: "WhatsApp", text: "WhatsApp", href: "#" },
          { label: "Veb-sayt", text: "mclegal.uz", href: "#" },
        ]}
      >
        <a
          href="#"
          className="flex h-12 w-full items-center justify-center rounded-full bg-lime font-serif text-[13px] font-bold tracking-[0.09em] text-on-accent uppercase"
        >
          Kontaktni saqlash
        </a>
      </PlaqueProfile>
    </div>
  );
}

const REACH = [
  { id: "phone" as const, href: "tel:+998901234567" },
  { id: "sms" as const, href: "sms:+998901234567" },
  { id: "telegram" as const, href: "#" },
  { id: "whatsapp" as const, href: "#" },
  { id: "instagram" as const, href: "#" },
  { id: "youtube" as const, href: "#" },
  { id: "linkedin" as const, href: "#" },
  { id: "facebook" as const, href: "#" },
];

const PAY = [
  { id: "payme" as const, href: "#" },
  { id: "click" as const, href: "#" },
  { id: "uzum" as const, href: "#" },
];

const ROWS = [
  { label: "Telefon", value: "+998 90 123 45 67", href: "tel:+998901234567" },
  { label: "Email", value: "aziz@mclegal.uz", href: "mailto:aziz@mclegal.uz" },
  { label: "Shahar", value: "Toshkent · Ташкент", href: "#" },
  { label: "Veb-sayt", value: "mclegal.uz", href: "#" },
];

const SERVICES = [
  { name: "Shartnoma ekspertizasi", price: "500\u00a0000\u00a0so'm" },
  { name: "Yuridik konsultatsiya", price: "200\u00a0000\u00a0so'm" },
  { name: "Sudda vakillik", price: "4\u00a0000\u00a0000\u00a0so'm" },
];

function SocialSample() {
  return (
    <div data-theme="ijtimoiy" className="themed rounded-2xl">
      <SocialProfile
        n="MYN042"
        name="Aziz Karimov"
        tagline="Fotograf · Toshkent"
        reach={REACH}
        pay={PAY}
      >
        <a
          href="#"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-lime text-[16px] font-bold text-on-accent"
        >
          Kontaktni saqlash
        </a>
      </SocialProfile>
    </div>
  );
}

function PosterSample() {
  return (
    <div data-theme="plakat" className="themed rounded-2xl">
      <PosterProfile n="MYN042" name="Aziz Karimov" role="Direktor · MC LEGAL" rows={ROWS}>
        <a
          href="#"
          className="mt-10 flex h-16 w-full items-center justify-center bg-lime text-[18px] font-bold tracking-[0.14em] text-on-accent uppercase"
        >
          Kontaktni saqlash
        </a>
      </PosterProfile>
    </div>
  );
}

function ReceiptSample() {
  return (
    <div data-theme="kvitansiya" className="themed rounded-2xl">
      <ReceiptProfile
        n="MYN042"
        name="Aziz Karimov"
        role="Direktor · MC LEGAL"
        rows={ROWS}
        services={SERVICES}
      >
        <a
          href="#"
          className="flex h-14 w-full items-center justify-center bg-lime font-mono text-[16px] font-bold tracking-[0.1em] text-on-accent uppercase"
        >
          Kontaktni saqlash
        </a>
        <p className="mt-4 text-center font-mono text-[16px] text-mute">
          * * * flex.com.uz/MYN042 * * *
        </p>
      </ReceiptProfile>
    </div>
  );
}

const LAYOUTS = [
  {
    name: "Zarbof",
    note: "Markazda, oltin serif, ikonkali konturli tabletkalar, halqadagi portret. Fonda oqim chiziqlari. Varaq yo'q — bitta panel.",
    who: "Fotograf, restoran, raqamni chiroyli bo'lgani uchun olgan odam.",
    render: () => <PlaqueSample />,
  },
  {
    name: "Ijtimoiy",
    note: "Telefon ekrani. To'liq logolar, o'z ranglarida, to'rttadan qatorda, ostida yozuvsiz. Pastda alohida to'lov qatori.",
    who: "Profili aynan hisoblaridan iborat odam — bloger, do'kon, fotograf.",
    render: () => <SocialSample />,
  },
  {
    name: "Plakat",
    note: "Bitta narsa juda katta, qolgani chetda. Ism chetdan chetga, havolalar quti emas — chiziq. Hech narsa sahifadan ko'tarilmaydi.",
    who: "Ismning o'zi mahsulot bo'lgan holat — musiqachi, brend, deraza ortidagi raqam.",
    render: () => <PosterSample />,
  },
  {
    name: "Kvitansiya",
    note: "Tor, monoshrift, ikki uchi yirtilgan. Hamma narsa — qator: ism ham, narx ham. Oq-qorada bosilsa ham yashaydi.",
    who: "Hunarmand — usta, haydovchi, quruvchi. Kartasi hisoblagich ortiga qistiriladi.",
    render: () => <ReceiptSample />,
  },
] as const;

export default function ThemesPage() {
  return (
    <div className="min-h-full bg-paper px-4 py-10 text-ink">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.01em]">
          Mavzular
        </h1>
        <p className="mt-2 max-w-[60ch] text-[16px] leading-6 text-mute">
          Oltitasi ham bir xil profilni ko&apos;rsatadi — bir xil ism, bir
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

        <h2 className="mt-10 text-[20px] leading-6 font-semibold">
          To&apos;rtta maket
        </h2>
        <p className="mt-1 max-w-[70ch] text-[16px] leading-6 text-mute">
          Bular bir-birining rangi emas. Har birida tekislash, shrift, tugma
          shakli va tuzilma boshqa — va har biri boshqa odam uchun.
        </p>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {LAYOUTS.map((l) => (
            <section key={l.name}>
              <header className="mb-3">
                <h3 className="text-[17px] leading-6 font-semibold">{l.name}</h3>
                <p className="text-[16px] leading-6 text-mute">{l.note}</p>
                <p className="mt-0.5 text-[16px] leading-6 text-mute">{l.who}</p>
              </header>
              {l.render()}
            </section>
          ))}
        </div>

        <h2 className="mt-14 text-[20px] leading-6 font-semibold">
          Bitta maket, oltita rang
        </h2>
        <div className="mt-4 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
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
