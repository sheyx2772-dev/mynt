import Link from "next/link";
import type { Metadata } from "next";
import DeviceFace from "@/components/DeviceFace";
import DeviceTile from "@/components/DeviceTile";
import CardFan from "@/components/CardFan";
import { DEVICE_TYPES } from "@/lib/devices";
import { CARD_DESIGNS } from "@/lib/card-designs";

export const metadata: Metadata = {
  title: "Qurilmalar — flex.com.uz",
  description:
    "Flex raqamingizni karta, uzuk yoki braslet ko'rinishida olib yuring. Shaklni o'zingiz tanlaysiz.",
};

const SAMPLE = "MYN042";

export default function DevicesPage() {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-24 right-[-6rem] h-80 w-80 rounded-full bg-lime/20 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="mb-10 flex items-center gap-2 font-display text-lg font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-flex-black">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          flex
        </Link>

        <h1 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Raqamingizni qanday olib yurasiz &mdash; o&apos;zingiz tanlaysiz
        </h1>
        <p className="mt-4 max-w-xl text-flex-black/60">
          Siz noyob raqamni sotib olasiz. U sizniki bo&apos;lib qoladi, qaysi buyumda olib
          yurishingizdan qat&apos;i nazar &mdash; hammasi bir xil profilni ochadi.
        </p>

        {/* The three form factors */}
        <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-3">
          {DEVICE_TYPES.map((device) => (
            <div key={device.id}>
              <DeviceTile type={device.id} alt={`Flex ${device.name}`} />
              <h2 className="mt-5 font-display text-lg font-semibold">{device.name}</h2>
              <p className="mt-0.5 text-xs tracking-wide text-flex-black/40 uppercase">
                {device.tagline}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-flex-black/60">
                {device.description}
              </p>
            </div>
          ))}
        </div>

        {/* The design set, shared across every form */}
        <div className="mt-24 border-t border-black/8 pt-14">
          <h2 className="max-w-lg font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {CARD_DESIGNS.length} ta dizayn &mdash; uchala shaklda ham
          </h2>
          <p className="mt-3 max-w-xl text-flex-black/60">
            Dizaynni bir marta tanlaysiz va u tanlagan buyumingizga tushadi. Kabinetdan
            istalgan vaqtda almashtirasiz.
          </p>

          <CardFan handle={SAMPLE} />

          <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {CARD_DESIGNS.map((design) => (
              <div key={design.id}>
                <div className="rounded-2xl border border-black/8 bg-white p-4">
                  <DeviceFace type="card" design={design.id} handle={SAMPLE} />
                </div>
                <h3 className="mt-4 font-display font-semibold">{design.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-flex-black/55">
                  {design.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 rounded-[1.5rem] border border-black/10 bg-white p-7">
          <h2 className="font-display text-lg font-semibold">Nega birov brendini bosmaymiz</h2>
          <p className="mt-2 text-sm text-flex-black/60">
            Bozorda mashhur logotiplar bosilgan buyumlar uchraydi. Biz bunday qilmaymiz: bu
            tovar belgisi huquqini buzadi va buyumni hech qanday noyob qilmaydi &mdash;
            logotipni har kim nusxalashi mumkin. Sizning raqamingizni esa nusxalab
            bo&apos;lmaydi.
          </p>
          <Link
            href="/#narx"
            className="mt-6 inline-block rounded-full bg-lime px-6 py-3 font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
          >
            Raqam tanlash
          </Link>
        </div>
      </div>
    </div>
  );
}
