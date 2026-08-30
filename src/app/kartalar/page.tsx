import Link from "next/link";
import type { Metadata } from "next";
import CardFace from "@/components/CardFace";
import { CARD_DESIGNS } from "@/lib/card-designs";

export const metadata: Metadata = {
  title: "Kartalar — mynt.uz",
  description:
    "MYNT CARD dizaynlari: har biri Mynt uchun chizilgan, NFC va QR bilan ishlaydi.",
};

export default function CardsPage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-lime/20 blur-[100px]" />

      <div className="relative mx-auto max-w-4xl px-6 py-16">
        <Link href="/" className="mb-10 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mynt-black">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          mynt
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Kartalar</h1>
        <p className="mt-3 max-w-xl text-mynt-black/60">
          Har bir dizayn Mynt uchun chizilgan. Kartada NFC chip va QR-kod bo&apos;ladi — tegizasiz
          yoki skanerlaysiz, profilingiz ochiladi. Dizaynni kabinetdan istalgan vaqtda
          almashtirasiz.
        </p>

        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {CARD_DESIGNS.map((design) => (
            <div key={design.id}>
              <CardFace design={design.id} handle="MYN042" />
              <h2 className="mt-4 font-display text-lg font-semibold">{design.name}</h2>
              <p className="mt-1 text-sm text-mynt-black/55">{design.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[1.5rem] border border-black/10 bg-white p-7">
          <h2 className="font-display text-lg font-semibold">Nega birov brendini bosmaymiz</h2>
          <p className="mt-2 text-sm text-mynt-black/60">
            Bozorda mashhur logotiplar bosilgan kartalar uchraydi. Biz bunday qilmaymiz: bu
            tovar belgisi huquqini buzadi va kartani hech qanday noyob qilmaydi — logotipni
            har kim nusxalashi mumkin. Sizning genesis seriya raqamingizni esa nusxalab
            bo&apos;lmaydi.
          </p>
          <Link
            href="/#narx"
            className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
          >
            Handle tanlash
          </Link>
        </div>
      </div>
    </div>
  );
}
