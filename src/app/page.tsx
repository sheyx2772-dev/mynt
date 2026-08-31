import {
  Link2,
  Nfc,
  Sparkles,
  BarChart3,
  Users,
  Target,
  RefreshCw,
  TrendingUp,
  Check,
  Minus,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import PricingCalculator from "@/components/PricingCalculator";
import ProfilePreview from "@/components/ProfilePreview";
import PhoneFrame from "@/components/PhoneFrame";
import HandleChecker from "@/components/HandleChecker";
import HeroStage from "@/components/HeroStage";
import Image from "next/image";
import { productShot } from "@/lib/product-shots";
import DeviceTile from "@/components/DeviceTile";
import { DEVICE_TYPES } from "@/lib/devices";
import { formatNumber } from "@/lib/format";

const NAMESPACE_SIZE = 26 * 26 * 26 * 10 * 10 * 10;

const consumerFeatures = [
  {
    icon: Link2,
    title: "Shaxsiy profil",
    desc: "flex.com.uz/HANDLE — barcha havolalaringiz, ijtimoiy tarmoqlaringiz va vizit ma'lumotlaringiz bitta sahifada.",
  },
  {
    icon: Nfc,
    title: "Qurilmani o'zingiz tanlaysiz",
    desc: "Karta, uzuk yoki braslet — uchalasi ham bir tegishda o'sha profilni ochadi. NFC yo'q telefonlar uchun QR-kod zaxira variant.",
  },
  {
    icon: Sparkles,
    title: "Kamyob handle",
    desc: "3 harf + 3 raqam — cheklangan miqdor. Kamdan-kam kombinatsiyalar qimmatroq, shaffof narx bilan.",
  },
  {
    icon: BarChart3,
    title: "Analitika",
    desc: "Profilingizga necha marta qaralgani, havolalar bosilishi va tashrif buyurgan hududlar statistikasi.",
  },
];

const businessFeatures = [
  {
    icon: Users,
    title: "Jamoa uchun raqamlar",
    desc: "Butun jamoangizga bir xil brend bilan raqam va qurilma chiqaring — har bir xodim o'ziga qulayini tanlaydi.",
  },
  {
    icon: Target,
    title: "Lead yig'ish",
    desc: "Tadbirlarda va uchrashuvlarda bir tegish bilan mijoz kontaktini lead sifatida saqlang.",
  },
  {
    icon: RefreshCw,
    title: "CRM integratsiya",
    desc: "HubSpot va Salesforce bilan ikki tomonlama sinxronizatsiya — maydonlarni o'zingiz moslashtiring.",
  },
  {
    icon: TrendingUp,
    title: "Jamoa analitikasi",
    desc: "Har bir xodim va butun jamoa bo'yicha lead'lar, tashriflar va konversiya statistikasi.",
  },
];

const comparison = [
  { label: "Kamyob/kolleksion handle", unqx: true, popl: false, flex: true },
  { label: "Shaffof narx dvijoki", unqx: true, popl: false, flex: true },
  { label: "Jismoniy NFC karta", unqx: true, popl: true, flex: true },
  { label: "Jamoa/biznes tarif", unqx: false, popl: true, flex: true },
  { label: "CRM sinxronizatsiya", unqx: false, popl: true, flex: true },
  { label: "Tadbirda lead yig'ish", unqx: false, popl: true, flex: true },
  { label: "Click / Payme to'lovlari", unqx: true, popl: false, flex: true },
];

const faqs = [
  {
    q: "Handle nima va u qanday narxlanadi?",
    a: "Handle — 3 harf + 3 raqamdan iborat noyob kod (masalan MYN042), sizning shaxsiy profilingiz manzili bo'ladi. Narx bazaviy summadan, harflar va raqamlarning kamyobligiga qarab ko'payadigan koeffitsientlardan hisoblanadi. Yuqorida hisob-kitobni o'zingiz sinab ko'rishingiz mumkin.",
  },
  {
    q: "NFC qurilma qanday ishlaydi?",
    a: "Qurilmani (karta, uzuk yoki braslet) boshqa telefonga tegizganingizda, sizning flex.com.uz profilingiz avtomatik ochiladi. Hech kim ilova o'rnatmaydi. NFC qo'llamaydigan telefonlar uchun QR-kod zaxira variant sifatida ishlaydi.",
  },
  {
    q: "Biznes uchun qancha xodim qo'shsam bo'ladi?",
    a: "Jamoa tarifida xodimlar soniga cheklov yo'q — narx xodimlar soniga qarab (per-seat) hisoblanadi.",
  },
  {
    q: "To'lovni qanday amalga oshiraman?",
    a: "O'zbekistondagi foydalanuvchilar uchun Click va Payme, xalqaro kartalar uchun Stripe orqali to'lov qo'llab-quvvatlanadi.",
  },
];

export default function Home() {
  const tapShot = productShot("tegizish");
  const familyShot = productShot("oila");

  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-flex-black/85 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5">
              <span className="h-2 w-2 rounded-full bg-lime" />
            </span>
            flex
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-white/55 sm:flex">
            <a href="#narx" className="transition-colors hover:text-white">
              Narxlash
            </a>
            <a
              href="#individual"
              className="transition-colors hover:text-white"
            >
              Shaxsiy
            </a>
            <a href="#biznes" className="transition-colors hover:text-white">
              Biznes
            </a>
            <a href="#savollar" className="transition-colors hover:text-white">
              Savollar
            </a>
            {/* Signed-out visitors are sent to sign-in from there, which keeps
                this page static rather than making it depend on a session. */}
            <Link
              href="/qurilmalar"
              className="transition-colors hover:text-white"
            >
              Qurilmalar
            </Link>
            <Link
              href="/rezidentlar"
              className="transition-colors hover:text-white"
            >
              Rezidentlar
            </Link>
            <Link
              href="/kabinet"
              className="transition-colors hover:text-white"
            >
              Kabinet
            </Link>
          </nav>
          <a
            href="#narx"
            className="rounded-full bg-lime px-4 py-2 text-sm font-medium text-flex-black transition-colors hover:bg-lime/85"
          >
            Handle oling
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="grain relative overflow-hidden bg-flex-black text-white">
          <div className="bg-dot-grid-light absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-lime/[0.13] blur-[140px]" />

          <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-28 sm:pt-28">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium tracking-wide text-white/70 uppercase backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                  Raqamli shaxsingiz. Bir tegish.
                </p>
                <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-[4.5rem]">
                  Noyob raqam,{" "}
                  <span className="marker-reveal inline-block rounded-md bg-lime px-2 text-flex-black">
                    umrbod
                  </span>{" "}
                  sizniki.
                </h1>
                <p className="mt-7 max-w-md text-lg leading-relaxed text-white/60">
                  Siz noyob raqam sotib olasiz &mdash; u umrbod sizniki. Uni
                  karta, uzuk yoki braslet ko&apos;rinishida olib yurasiz,
                  tanlov sizniki. Har biri bitta profilni ochadi.
                </p>
                <HandleChecker tone="dark" />

                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="#narx"
                    className="rounded-full bg-lime px-7 py-3.5 font-medium text-flex-black shadow-[0_12px_36px_-8px_rgba(171,255,9,0.5)] transition-transform hover:scale-[1.03]"
                  >
                    Narxni hisoblang
                  </a>
                  <a
                    href="#biznes"
                    className="rounded-full border border-white/20 px-7 py-3.5 font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Biznes uchun
                  </a>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="absolute -top-6 -left-10 z-20 hidden -rotate-6 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-md sm:block lg:-left-16">
                  <p className="text-[10px] font-medium tracking-wide text-white/40 uppercase">
                    Bu hafta
                  </p>
                  <p className="font-display text-lg font-semibold">
                    2 481 tashrif
                  </p>
                </div>
                <div className="absolute -right-6 -bottom-4 z-20 hidden rotate-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-md sm:block">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-white/75">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    NFC ulandi
                  </p>
                </div>

                <HeroStage shot={productShot("karta-hero")} />
              </div>
            </div>
          </div>

          {/* The dark section ends on the page ground rather than a hard edge. */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            Qanday ishlaydi
          </p>
          <h2 className="max-w-lg font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Uch qadam, o&apos;n daqiqa
          </h2>

          <ol className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-3">
            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                <div className="relative flex overflow-hidden rounded-xl border border-white/15 font-display text-xl font-semibold text-white">
                  <span className="px-3 py-2">MYN</span>
                  <span className="w-px bg-white/15" />
                  <span className="bg-lime px-3 py-2 font-tabular text-flex-black">
                    042
                  </span>
                </div>
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                01
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                Handle tanlang
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                3 harf + 3 raqam. Narx darhol ko&apos;rinadi &mdash; yashirin
                to&apos;lov yo&apos;q.
              </p>
            </li>

            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                {familyShot ? (
                  <Image
                    src={familyShot}
                    alt="Flex karta, uzuk va braslet"
                    fill
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <div className="absolute inset-x-0 -top-8 h-32 bg-lime/10 blur-3xl" />
                    {/* Card, ring, bracelet — three silhouettes, each given one
                    lime mark so a black object stays legible on a black stage. */}
                    <div className="relative flex items-center gap-4">
                      <span className="relative h-16 w-24 rotate-[-8deg] rounded-lg border border-white/20 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                        <span className="absolute bottom-2 left-2 h-1 w-6 rounded-full bg-lime" />
                      </span>
                      <span className="h-16 w-16 rounded-full border-[6px] border-white/20 bg-[linear-gradient(140deg,#312653,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95),inset_0_0_0_2px_rgba(171,255,9,0.5)]" />
                      <span className="relative h-20 w-9 rotate-[6deg] rounded-full border border-white/20 bg-[linear-gradient(140deg,#2b2250,#0c0818)] shadow-[0_18px_32px_-14px_rgba(0,0,0,0.95)]">
                        <span className="absolute top-1/2 left-1/2 h-6 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-black ring-1 ring-lime/60" />
                      </span>
                    </div>
                  </>
                )}
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                02
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                Qurilmani tanlang
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                Karta, uzuk yoki braslet. Dizaynni ham o&apos;zingiz tanlaysiz.
              </p>
            </li>

            <li>
              <div className="grain relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_30%,#211a3c_0%,#0b0817_72%)]">
                {tapShot ? (
                  <Image
                    src={tapShot}
                    alt="Kartani telefonga tegizish"
                    fill
                    sizes="(min-width: 640px) 20rem, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <>
                    {/* Concentric rings: the tap, drawn. */}
                    <span className="absolute h-16 w-16 rounded-full border border-lime/25" />
                    <span className="absolute h-28 w-28 rounded-full border border-lime/15" />
                    <span className="absolute h-44 w-44 rounded-full border border-lime/10" />
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-lime shadow-[0_0_40px_rgba(171,255,9,0.5)]">
                      <Nfc className="h-5 w-5 text-flex-black" />
                    </span>
                  </>
                )}
              </div>
              <p className="mt-5 font-tabular text-xs font-semibold tracking-widest text-flex-black/30">
                03
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                Tegizing
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                Telefonga tegizasiz, profilingiz ochiladi. Hech kim ilova
                o&apos;rnatmaydi.
              </p>
            </li>
          </ol>
        </section>

        {/* Scarcity */}
        <section className="grain relative overflow-hidden bg-flex-black py-20 sm:py-28">
          <div className="bg-dot-grid-light absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_50%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold tracking-widest text-lime/70 uppercase">
              Cheklangan miqdor
            </p>
            <p className="mt-5 font-display text-[clamp(2.75rem,11vw,7.5rem)] leading-[0.85] font-semibold tracking-tight text-white tabular-nums">
              {formatNumber(NAMESPACE_SIZE)}
            </p>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
              Mumkin bo&apos;lgan handle&rsquo;lar soni. Boshqa yo&apos;q
              &mdash; har biri faqat bitta odamga tegishli bo&apos;ladi va qayta
              sotilmaydi.
            </p>
          </div>
        </section>

        {/* Pricing calculator */}
        <section id="narx" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-12 max-w-lg">
            <p className="mb-3 text-xs font-semibold tracking-widest text-lime/80 uppercase [-webkit-text-stroke:0.3px_rgba(14,10,27,0.4)]">
              Narxlash
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Narx — to&apos;liq shaffof
            </h2>
            <p className="mt-3 text-flex-black/65">
              Har bir handle narxi ochiq formula bilan hisoblanadi: bazaviy narx
              &times; harf kamyobligi &times; raqam kamyobligi. Pastda
              o&apos;zingiz sinab ko&apos;ring.
            </p>
          </div>
          <PricingCalculator />
        </section>

        {/* What a profile actually looks like */}
        <section
          id="individual"
          className="border-t border-black/5 bg-black/[0.02] py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_320px] lg:gap-20">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Shaxsiy
              </p>
              <h2 className="max-w-md font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Bir tegish &mdash; va sizni to&apos;liq ko&apos;radi
              </h2>
              <p className="mt-4 max-w-md text-flex-black/65">
                Kartani tegizasiz, brauzer o&apos;zi ochiladi. Hech kim hech
                narsa o&apos;rnatmaydi.
              </p>

              <dl className="mt-10 divide-y divide-black/8 border-y border-black/8">
                {consumerFeatures.map((f) => (
                  <div key={f.title} className="flex gap-5 py-5">
                    <f.icon
                      className="mt-0.5 h-5 w-5 shrink-0 text-flex-black/35"
                      strokeWidth={1.75}
                    />
                    <div>
                      <dt className="font-display font-semibold">{f.title}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-flex-black/60">
                        {f.desc}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:pt-4">
              <PhoneFrame>
                <ProfilePreview />
              </PhoneFrame>
            </div>
          </div>
        </section>

        {/* The cards themselves */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Qurilmalar
              </p>
              <h2 className="max-w-md font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Bitta raqam, uchta shakl
              </h2>
            </div>
            <Link
              href="/qurilmalar"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
            >
              Hammasini ko&apos;rish
            </Link>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {DEVICE_TYPES.map((device) => (
              <div key={device.id}>
                <DeviceTile type={device.id} alt={`Flex ${device.name}`} />
                <h3 className="mt-4 font-display font-semibold">
                  {device.name}
                </h3>
                <p className="mt-1 text-sm text-flex-black/55">
                  {device.tagline}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Business */}
        <section
          id="biznes"
          className="grain relative overflow-hidden bg-flex-black py-24"
        >
          <div className="bg-dot-grid-light absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-semibold tracking-widest text-lime/70 uppercase">
                Biznes
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
                Bitta karta emas &mdash; butun jamoa
              </h2>
              <p className="mt-4 text-white/55">
                Xodimlaringizga bir xil brend bilan handle va NFC karta
                chiqaring, tadbirlarda yig&apos;ilgan kontaktlar
                to&apos;g&apos;ridan-to&apos;g&apos;ri CRM&apos;ingizga tushsin.
              </p>
            </div>

            <div className="mt-14 grid gap-x-14 border-t border-white/10 sm:grid-cols-2">
              {businessFeatures.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-5 border-b border-white/10 py-7"
                >
                  <f.icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-lime"
                    strokeWidth={1.75}
                  />
                  <div>
                    <h3 className="font-display font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#savollar"
              className="mt-12 inline-block rounded-full bg-lime px-7 py-3.5 font-medium text-flex-black shadow-[0_14px_34px_-12px_rgba(171,255,9,0.7)] transition-transform hover:scale-[1.02]"
            >
              Jamoangiz uchun hisob-kitob
            </a>
          </div>
        </section>

        <section className="border-t border-black/5 bg-black/[0.02] py-24">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-3 text-center text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
              Taqqoslash
            </p>
            <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Nega Flex?
            </h2>
            <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_50px_-24px_rgba(14,10,27,0.2)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-left text-flex-black/45">
                      <th className="px-5 py-4 font-medium">Xususiyat</th>
                      <th className="px-5 py-4 text-center font-medium">
                        UNQX
                      </th>
                      <th className="px-5 py-4 text-center font-medium">
                        Popl
                      </th>
                      <th className="bg-lime/10 px-5 py-4 text-center font-semibold text-flex-black">
                        Flex
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, i) => (
                      <tr
                        key={row.label}
                        className={`border-b border-black/5 last:border-0 ${i % 2 === 1 ? "bg-black/[0.015]" : ""}`}
                      >
                        <td className="px-5 py-4">{row.label}</td>
                        <td className="px-5 py-4 text-center">
                          {row.unqx ? (
                            <Check className="mx-auto h-4 w-4 text-flex-black/50" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {row.popl ? (
                            <Check className="mx-auto h-4 w-4 text-flex-black/50" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                        <td className="bg-lime/10 px-5 py-4 text-center">
                          {row.flex ? (
                            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-lime">
                              <Check
                                className="h-4 w-4 text-flex-black"
                                strokeWidth={3}
                              />
                            </span>
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-flex-black/20" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="savollar" className="mx-auto max-w-3xl px-6 py-24">
          <p className="mb-3 text-center text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
            Savollar
          </p>
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Savol-javob
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-black/10 bg-white p-5 open:shadow-[0_12px_30px_-16px_rgba(14,10,27,0.2)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium marker:content-none">
                  {item.q}
                  <ChevronDown className="h-4 w-4 text-flex-black/40 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-flex-black/65">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="grain relative overflow-hidden bg-flex-black pt-16 pb-10 text-white">
        <div className="bg-dot-grid-light absolute inset-0 opacity-20 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-display text-xl font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime">
                  <span className="h-2 w-2 rounded-full bg-flex-black" />
                </span>
                flex
              </div>
              <p className="mt-3 max-w-[220px] text-sm text-white/50">
                Raqamli shaxsingiz. Bir tegish bilan ulashing.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                Mahsulot
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li>
                  <a
                    href="#narx"
                    className="transition-colors hover:text-white"
                  >
                    Narxlash
                  </a>
                </li>
                <li>
                  <a
                    href="#individual"
                    className="transition-colors hover:text-white"
                  >
                    Shaxsiy profil
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    FLEX CARD
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                Biznes
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li>
                  <a
                    href="#biznes"
                    className="transition-colors hover:text-white"
                  >
                    Jamoa kartalari
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    CRM integratsiya
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Tadbir rejimi
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                Kompaniya
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-white/60">
                <li>
                  <a
                    href="#savollar"
                    className="transition-colors hover:text-white"
                  >
                    Savollar
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Aloqa
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} Flex. Barcha huquqlar
              himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
