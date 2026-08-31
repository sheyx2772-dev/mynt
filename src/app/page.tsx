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
import CardFace from "@/components/CardFace";
import type { CardDesignId } from "@/lib/card-designs";
import { formatNumber } from "@/lib/format";

const NAMESPACE_SIZE = 26 * 26 * 26 * 10 * 10 * 10;

const consumerFeatures = [
  {
    icon: Link2,
    title: "Shaxsiy profil",
    desc: "flex.uz/HANDLE — barcha havolalaringiz, ijtimoiy tarmoqlaringiz va vizit ma'lumotlaringiz bitta sahifada.",
  },
  {
    icon: Nfc,
    title: "NFC karta",
    desc: "Telefoningizni bir marta tegizib, profilingizni ulashing. NFC yo'q qurilmalar uchun QR-kod zaxira variant.",
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
    title: "Jamoa uchun kartalar",
    desc: "Butun jamoangizga bir xil brend bilan handle va NFC kartalarni ommaviy tarzda chiqaring.",
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
    q: "NFC karta qanday ishlaydi?",
    a: "Kartani boshqa telefonga tegizganingizda, sizning flex.uz profilingiz avtomatik ochiladi. NFC qo'llamaydigan qurilmalar uchun kartada QR-kod ham bo'ladi.",
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
  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-flex-black">
              <span className="h-2 w-2 rounded-full bg-lime" />
            </span>
            flex
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-flex-black/60 sm:flex">
            <a href="#narx" className="transition-colors hover:text-flex-black">
              Narxlash
            </a>
            <a href="#individual" className="transition-colors hover:text-flex-black">
              Shaxsiy
            </a>
            <a href="#biznes" className="transition-colors hover:text-flex-black">
              Biznes
            </a>
            <a href="#savollar" className="transition-colors hover:text-flex-black">
              Savollar
            </a>
            {/* Signed-out visitors are sent to sign-in from there, which keeps
                this page static rather than making it depend on a session. */}
            <Link href="/kartalar" className="transition-colors hover:text-flex-black">
              Kartalar
            </Link>
            <Link href="/rezidentlar" className="transition-colors hover:text-flex-black">
              Rezidentlar
            </Link>
            <Link href="/kabinet" className="transition-colors hover:text-flex-black">
              Kabinet
            </Link>
          </nav>
          <a
            href="#narx"
            className="rounded-full bg-flex-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-flex-black/85"
          >
            Handle oling
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-32 right-[-6rem] h-96 w-96 rounded-full bg-lime/25 blur-[100px]" />

          <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
            <div className="grid items-center gap-16 lg:grid-cols-2">
              <div>
                <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium tracking-wide text-flex-black/70 uppercase shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                  Raqamli shaxsingiz. Bir tegish.
                </p>
                <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-tight text-balance sm:text-6xl lg:text-[4.5rem]">
                  Noyob handle &mdash;
                  <br />
                  <span className="relative inline-block px-1">
                    <span className="relative z-10">umrbod</span>
                    <span className="marker-stroke absolute inset-x-0 bottom-[6px] -z-0 h-[0.4em] rounded-sm bg-lime/80" />
                  </span>{" "}
                  sizniki.
                </h1>
                <p className="mt-7 max-w-md text-lg leading-relaxed text-flex-black/65">
                  Flex — noyob raqamli handle, shaxsiy vizit-karta sahifasi va NFC karta orqali
                  shaxsingizni ulashing. Jamoangiz uchun esa — tadbirlarda lead yig&apos;ish va
                  CRM bilan sinxronizatsiya.
                </p>
                <HandleChecker />

                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href="#narx"
                    className="rounded-full bg-lime px-7 py-3.5 font-medium text-flex-black shadow-[0_12px_30px_-8px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.03]"
                  >
                    Narxni hisoblang
                  </a>
                  <a
                    href="#biznes"
                    className="rounded-full border border-black/15 px-7 py-3.5 font-medium text-flex-black transition-colors hover:bg-black/5"
                  >
                    Biznes uchun
                  </a>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div className="absolute -left-10 -top-6 z-20 hidden -rotate-6 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-xl sm:block lg:-left-16">
                  <p className="text-[10px] font-medium tracking-wide text-flex-black/40 uppercase">
                    Bu hafta
                  </p>
                  <p className="font-display text-lg font-semibold">2 481 tashrif</p>
                </div>
                <div className="absolute -bottom-7 -right-6 z-20 hidden rotate-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-xl sm:block">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-flex-black/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                    NFC ulandi
                  </p>
                </div>

                <div className="absolute -inset-14 -z-10 rounded-[3rem] bg-lime/25 blur-[90px]" />

                <div className="grain card-sheen relative aspect-[1.586/1] w-[20rem] rotate-[-3deg] overflow-hidden rounded-[1.75rem] bg-flex-black p-7 text-white shadow-[0_45px_90px_-25px_rgba(14,10,27,0.6)] transition-transform duration-500 hover:rotate-0 sm:w-[25rem] lg:w-[27rem]">
                  <div className="relative flex items-start justify-between">
                    <div className="h-6 w-9 rounded-md bg-gradient-to-br from-lime/90 to-lime/30" />
                    <Nfc className="h-5 w-5 text-white/40" />
                  </div>
                  <div className="relative mt-14 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                    MYN<span className="text-lime">042</span>
                  </div>
                  <p className="relative mt-1 font-tabular text-sm text-white/45">
                    flex.uz/MYN042
                  </p>
                  <div className="relative mt-9 flex items-center justify-between text-[11px] font-medium tracking-wide text-white/40 uppercase">
                    <span>Tap to share</span>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              <div className="flex h-40 items-center justify-center rounded-2xl border border-black/8 bg-white">
                <div className="flex overflow-hidden rounded-xl border-2 border-flex-black/90 font-display text-xl font-semibold">
                  <span className="px-3 py-2">MYN</span>
                  <span className="w-px bg-black/10" />
                  <span className="bg-lime/15 px-3 py-2 font-tabular">042</span>
                </div>
              </div>
              <p className="mt-5 font-tabular text-xs text-flex-black/35">01</p>
              <h3 className="mt-1 font-display text-lg font-semibold">Handle tanlang</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                3 harf + 3 raqam. Narx darhol ko&apos;rinadi &mdash; yashirin to&apos;lov yo&apos;q.
              </p>
            </li>

            <li>
              <div className="flex h-40 items-center justify-center rounded-2xl border border-black/8 bg-white">
                <div className="grain relative w-40 overflow-hidden rounded-xl bg-flex-black p-3 text-white shadow-[0_16px_32px_-18px_rgba(14,10,27,0.7)]">
                  <span className="relative text-[7px] tracking-[0.16em] text-white/50 uppercase">
                    Flex card
                  </span>
                  <p className="relative mt-6 font-display text-sm font-semibold">
                    MYN<span className="text-lime">042</span>
                  </p>
                </div>
              </div>
              <p className="mt-5 font-tabular text-xs text-flex-black/35">02</p>
              <h3 className="mt-1 font-display text-lg font-semibold">Kartangizni oling</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                NFC chip va QR-kod bilan. Dizaynni o&apos;zingiz tanlaysiz.
              </p>
            </li>

            <li>
              <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-black/8 bg-white">
                {/* Concentric rings: the tap, drawn. */}
                <span className="absolute h-16 w-16 rounded-full border border-lime-ink/25" />
                <span className="absolute h-28 w-28 rounded-full border border-lime-ink/15" />
                <span className="absolute h-40 w-40 rounded-full border border-lime-ink/10" />
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-lime">
                  <Nfc className="h-4 w-4 text-flex-black" />
                </span>
              </div>
              <p className="mt-5 font-tabular text-xs text-flex-black/35">03</p>
              <h3 className="mt-1 font-display text-lg font-semibold">Tegizing</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-flex-black/60">
                Telefonga tegizasiz, profilingiz ochiladi. Hech kim ilova o&apos;rnatmaydi.
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
              Mumkin bo&apos;lgan handle&rsquo;lar soni. Boshqa yo&apos;q &mdash; har biri
              faqat bitta odamga tegishli bo&apos;ladi va qayta sotilmaydi.
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
              Har bir handle narxi ochiq formula bilan hisoblanadi: bazaviy narx &times; harf
              kamyobligi &times; raqam kamyobligi. Pastda o&apos;zingiz sinab ko&apos;ring.
            </p>
          </div>
          <PricingCalculator />
        </section>

        {/* What a profile actually looks like */}
        <section id="individual" className="border-t border-black/5 bg-black/[0.02] py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_320px] lg:gap-20">
            <div>
              <p className="mb-3 text-xs font-semibold tracking-widest text-flex-black/40 uppercase">
                Shaxsiy
              </p>
              <h2 className="max-w-md font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Bir tegish &mdash; va sizni to&apos;liq ko&apos;radi
              </h2>
              <p className="mt-4 max-w-md text-flex-black/65">
                Kartani tegizasiz, brauzer o&apos;zi ochiladi. Hech kim hech narsa
                o&apos;rnatmaydi.
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
                Kartalar
              </p>
              <h2 className="max-w-md font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Har bir dizayn Flex uchun chizilgan
              </h2>
            </div>
            <Link
              href="/kartalar"
              className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.03]"
            >
              Hammasini ko&apos;rish
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {["genesis", "naqsh", "lime"].map((design) => (
              <CardFace key={design} design={design as CardDesignId} handle="MYN042" />
            ))}
          </div>
        </section>

        {/* Business */}
        <section id="biznes" className="grain relative overflow-hidden bg-flex-black py-24">
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
                Xodimlaringizga bir xil brend bilan handle va NFC karta chiqaring, tadbirlarda
                yig&apos;ilgan kontaktlar to&apos;g&apos;ridan-to&apos;g&apos;ri CRM&apos;ingizga tushsin.
              </p>
            </div>

            <div className="mt-14 grid gap-x-14 border-t border-white/10 sm:grid-cols-2">
              {businessFeatures.map((f) => (
                <div
                  key={f.title}
                  className="flex gap-5 border-b border-white/10 py-7"
                >
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-lime" strokeWidth={1.75} />
                  <div>
                    <h3 className="font-display font-semibold text-white">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">{f.desc}</p>
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
                      <th className="px-5 py-4 text-center font-medium">UNQX</th>
                      <th className="px-5 py-4 text-center font-medium">Popl</th>
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
                              <Check className="h-4 w-4 text-flex-black" strokeWidth={3} />
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
                <p className="mt-3 text-sm leading-relaxed text-flex-black/65">{item.a}</p>
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
                  <a href="#narx" className="transition-colors hover:text-white">
                    Narxlash
                  </a>
                </li>
                <li>
                  <a href="#individual" className="transition-colors hover:text-white">
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
                  <a href="#biznes" className="transition-colors hover:text-white">
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
                  <a href="#savollar" className="transition-colors hover:text-white">
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
            <p>&copy; {new Date().getFullYear()} Flex. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
