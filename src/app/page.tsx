import PricingCalculator from "@/components/PricingCalculator";
import { formatNumber } from "@/lib/format";

const NAMESPACE_SIZE = 26 * 26 * 26 * 10 * 10 * 10;

const consumerFeatures = [
  {
    title: "Shaxsiy profil",
    desc: "mynt.uz/HANDLE — barcha havolalaringiz, ijtimoiy tarmoqlaringiz va vizit ma'lumotlaringiz bitta sahifada.",
  },
  {
    title: "NFC karta",
    desc: "Telefoningizni bir marta tegizib, profilingizni ulashing. NFC yo'q qurilmalar uchun QR-kod zaxira variant.",
  },
  {
    title: "Kamyob handle",
    desc: "3 harf + 3 raqam — cheklangan miqdor. Kamdan-kam kombinatsiyalar qimmatroq, shaffof narx bilan.",
  },
  {
    title: "Analitika",
    desc: "Profilingizga necha marta qaralgani, havolalar bosilishi va tashrif buyurgan hududlar statistikasi.",
  },
];

const businessFeatures = [
  {
    title: "Jamoa uchun kartalar",
    desc: "Butun jamoangizga bir xil brend bilan handle va NFC kartalarni ommaviy tarzda chiqaring.",
  },
  {
    title: "Lead yig'ish",
    desc: "Tadbirlarda va uchrashuvlarda bir tegish bilan mijoz kontaktini lead sifatida saqlang.",
  },
  {
    title: "CRM integratsiya",
    desc: "HubSpot va Salesforce bilan ikki tomonlama sinxronizatsiya — maydonlarni o'zingiz moslashtiring.",
  },
  {
    title: "Jamoa analitikasi",
    desc: "Har bir xodim va butun jamoa bo'yicha lead'lar, tashriflar va konversiya statistikasi.",
  },
];

const comparison = [
  { label: "Kamyob/kolleksion handle", unqx: true, popl: false, mynt: true },
  { label: "Shaffof narx dvijoki", unqx: true, popl: false, mynt: true },
  { label: "Jismoniy NFC karta", unqx: true, popl: true, mynt: true },
  { label: "Jamoa/biznes tarif", unqx: false, popl: true, mynt: true },
  { label: "CRM sinxronizatsiya", unqx: false, popl: true, mynt: true },
  { label: "Tadbirda lead yig'ish", unqx: false, popl: true, mynt: true },
  { label: "Click / Payme to'lovlari", unqx: true, popl: false, mynt: true },
];

const faqs = [
  {
    q: "Handle nima va u qanday narxlanadi?",
    a: "Handle — 3 harf + 3 raqamdan iborat noyob kod (masalan MYN042), sizning shaxsiy profilingiz manzili bo'ladi. Narx bazaviy summadan, harflar va raqamlarning kamyobligiga qarab ko'payadigan koeffitsientlardan hisoblanadi. Yuqorida hisob-kitobni o'zingiz sinab ko'rishingiz mumkin.",
  },
  {
    q: "NFC karta qanday ishlaydi?",
    a: "Kartani boshqa telefonga tegizganingizda, sizning mynt.uz profilingiz avtomatik ochiladi. NFC qo'llamaydigan qurilmalar uchun kartada QR-kod ham bo'ladi.",
  },
  {
    q: "Biznes uchun qancha xodim qo'shsam bo'ladi?",
    a: "Jamoa tarifida xodimlar sonига cheklov yo'q — narx xodimlar soniga qarab (per-seat) hisoblanadi.",
  },
  {
    q: "To'lovni qanday amalga oshiraman?",
    a: "O'zbekistondagi foydalanuvchilar uchun Click va Payme, xalqaro kartalar uchun Stripe orqali to'lov qo'llab-quvvatlanadi.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="font-display text-xl font-semibold tracking-tight">
            mynt<span className="text-lime">.</span>
          </div>
          <nav className="hidden gap-8 text-sm text-mynt-black/70 sm:flex">
            <a href="#narx" className="hover:text-mynt-black">
              Narxlash
            </a>
            <a href="#individual" className="hover:text-mynt-black">
              Shaxsiy
            </a>
            <a href="#biznes" className="hover:text-mynt-black">
              Biznes
            </a>
            <a href="#savollar" className="hover:text-mynt-black">
              Savollar
            </a>
          </nav>
          <a
            href="#narx"
            className="rounded-full bg-mynt-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-mynt-black/85"
          >
            Handle oling
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-4 inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-medium tracking-wide text-mynt-black/80 uppercase">
                Raqamli shaxsingiz. Bir tegish.
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                O&apos;z shaxsingizni <span className="text-lime bg-mynt-black px-2">mint</span> qiling.
              </h1>
              <p className="mt-6 max-w-md text-lg text-mynt-black/70">
                Mynt — noyob raqamli handle, shaxsiy vizit-karta sahifasi va NFC karta orqali
                shaxsingizni ulashing. Jamoangiz uchun esa — tadbirlarda lead yig&apos;ish va CRM
                bilan sinxronizatsiya.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#narx"
                  className="rounded-full bg-lime px-6 py-3 font-medium text-mynt-black transition-transform hover:scale-[1.02]"
                >
                  Narxni hisoblang
                </a>
                <a
                  href="#biznes"
                  className="rounded-full border border-black/15 px-6 py-3 font-medium text-mynt-black transition-colors hover:bg-black/5"
                >
                  Biznes uchun
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-3xl bg-mynt-black p-8 text-white shadow-xl">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>MYNT ID</span>
                  <span className="h-2 w-2 rounded-full bg-lime" />
                </div>
                <div className="mt-10 font-display text-3xl font-semibold tracking-tight">
                  MYN<span className="text-lime">042</span>
                </div>
                <div className="mt-1 text-sm text-white/60">mynt.uz/MYN042</div>
                <div className="mt-10 flex items-center justify-between text-xs text-white/50">
                  <span>Tap to share</span>
                  <span className="font-tabular">NFC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scarcity strip */}
        <section className="border-y border-black/5 bg-black/[0.02] py-6">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-mynt-black/60 font-tabular">
            Jami{" "}
            <span className="font-semibold text-mynt-black">
              {formatNumber(NAMESPACE_SIZE)}
            </span>{" "}
            ta mumkin bo&apos;lgan handle — har biri faqat bitta odamga tegishli bo&apos;ladi.
          </div>
        </section>

        {/* Pricing calculator */}
        <section id="narx" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 max-w-lg">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Narx — to&apos;liq shaffof
            </h2>
            <p className="mt-3 text-mynt-black/70">
              Har bir handle narxi ochiq formula bilan hisoblanadi: bazaviy narx &times; harf
              kamyobligi &times; raqam kamyobligi. Pastda o&apos;zingiz sinab ko&apos;ring.
            </p>
          </div>
          <PricingCalculator />
        </section>

        {/* Individual features */}
        <section id="individual" className="border-t border-black/5 bg-black/[0.02] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Shaxsiy foydalanuvchilar uchun
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {consumerFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl border border-black/10 bg-white p-6">
                  <div className="mb-3 h-8 w-8 rounded-lg bg-lime" />
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-mynt-black/65">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business features */}
        <section id="biznes" className="py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Biznes va jamoalar uchun
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {businessFeatures.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl bg-mynt-black p-6 text-white"
                >
                  <div className="mb-3 h-8 w-8 rounded-lg bg-lime" />
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-white/65">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Differentiation table */}
        <section className="border-t border-black/5 bg-black/[0.02] py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-center">
              Nega Mynt?
            </h2>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-black/10 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-mynt-black/50">
                    <th className="px-4 py-3 font-medium">Xususiyat</th>
                    <th className="px-4 py-3 font-medium text-center">UNQX</th>
                    <th className="px-4 py-3 font-medium text-center">Popl</th>
                    <th className="px-4 py-3 font-medium text-center text-mynt-black">Mynt</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.label} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3 text-center">{row.unqx ? "✓" : "—"}</td>
                      <td className="px-4 py-3 text-center">{row.popl ? "✓" : "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {row.mynt ? <span className="text-lime bg-mynt-black rounded px-1.5 py-0.5">✓</span> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="savollar" className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-center">
            Savol-javob
          </h2>
          <div className="mt-10 space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-black/10 bg-white p-5 open:bg-black/[0.02]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {item.q}
                  <span className="text-mynt-black/40 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-mynt-black/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-mynt-black/50 sm:flex-row">
          <div className="font-display font-semibold text-mynt-black">
            mynt<span className="text-lime">.</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Mynt. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
