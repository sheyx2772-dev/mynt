import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { catalogue } from "@/lib/i18n";
import { COMPANY, DELIVERY, REPLACEMENT_WINDOW_DAYS } from "@/lib/company";
import { DEVICE_TYPES } from "@/lib/devices";
import { BASE_PRICE } from "@/lib/pricing";
import { plan, FREE_LINK_LIMIT } from "@/lib/plans";
import { formatUZS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ommaviy oferta va shartlar — flex.com.uz",
  description:
    "Flex xizmatining ommaviy oferta shartlari: narxlar, yetkazib berish, qaytarish va firma rekvizitlari.",
};

// Everything a buyer is entitled to know before paying, on one page: who is
// selling, what they get, when it arrives and what happens if it is faulty.
// The payment providers require most of it; a buyer parting with a month's
// phone bill deserves all of it.

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-black/8 py-8">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-flex-black/65">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 py-1.5">
      <dt className="w-48 shrink-0 text-flex-black/45">{label}</dt>
      <dd className="font-tabular">{value}</dd>
    </div>
  );
}

const PREMIUM = plan("premium");

export default function TermsPage() {
  return (
    <PageShell>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Ommaviy oferta va shartlar
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-flex-black/55">
        Bu sahifa {COMPANY.legalName} va xaridor o&apos;rtasidagi shartlarni belgilaydi.
        Saytda buyurtma berish va to&apos;lovni amalga oshirish shu shartlarga rozilik
        bildirish hisoblanadi.
      </p>

      <Section title="Xizmat nima">
        <p>
          Flex &mdash; noyob raqam (handle) va u ochadigan shaxsiy profil. Raqam 3 ta harf
          va 3 ta raqamdan iborat, masalan <span className="font-tabular">FLX007</span>.
          U <span className="font-tabular">flex.com.uz/FLX007</span> manzilida
          xaridorning profilini ochadi.
        </p>
        <p>
          Raqamni jismoniy qurilmada olib yurish mumkin: NFC karta, uzuk yoki braslet.
          Qurilma alohida mahsulot sifatida sotiladi.
        </p>
      </Section>

      <Section title="Narxlar">
        <p>
          Raqam narxi <strong>{formatUZS(BASE_PRICE)}</strong>dan boshlanadi va harflar
          hamda raqamlarning kamyobligiga qarab avtomatik hisoblanadi. Formula ochiq:
          bazaviy narx &times; harf koeffitsienti &times; raqam koeffitsienti. Yakuniy
          summa to&apos;lovdan oldin ko&apos;rsatiladi.
        </p>
        <dl className="mt-4 rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
          {DEVICE_TYPES.map((d) => (
            <Row key={d.id} label={catalogue("uz").devices[d.id].name} value={formatUZS(d.price)} />
          ))}
        </dl>
        <p>Narxlar O&apos;zbekiston so&apos;mida ko&apos;rsatilgan.</p>
      </Section>

      <Section title="Obuna">
        <p>
          Raqam va qurilma bir marta to&apos;lanadi. Profilning ishlab turishi uchun
          platformaga obuna alohida to&apos;lanadi: oyiga{" "}
          <strong>{formatUZS(PREMIUM.monthly)}</strong> yoki yiliga{" "}
          <strong>{formatUZS(PREMIUM.yearly)}</strong>.
        </p>
        <p>
          Obunasiz ham profil ishlaydi va raqam sizniki bo&apos;lib qoladi &mdash; u
          hech qachon o&apos;chirilmaydi. Oddiy rejada {FREE_LINK_LIMIT} tagacha havola,
          QR-kod va umumiy tashriflar soni mavjud. Obuna cheksiz havolalar, to&apos;liq
          analitika, postlar va AI dizayn so&apos;rovini ochadi.
        </p>
        <p>
          Obuna to&apos;xtatilsa, profil oddiy rejaga qaytadi. Ma&apos;lumotlar
          o&apos;chirilmaydi.
        </p>
      </Section>

      <Section title="To'lov">
        <p>
          To&apos;lov Payme yoki Click orqali amalga oshiriladi. To&apos;lov tasdiqlangunga
          qadar raqam 30 daqiqaga band qilinadi va shu vaqt ichida boshqa hech kimga
          sotilmaydi. To&apos;lov amalga oshmasa, band bekor bo&apos;ladi va raqam
          yana bo&apos;shaydi.
        </p>
      </Section>

      <Section title="Yetkazib berish">
        <p>
          Qurilma buyurtma tasdiqlangandan so&apos;ng yetkaziladi:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Toshkent shahri bo&apos;yicha &mdash; <strong>{DELIVERY.tashkentDays} kun</strong>
          </li>
          <li>
            Viloyatlarga &mdash;{" "}
            <strong>
              {DELIVERY.regionsDaysFrom}&ndash;{DELIVERY.regionsDaysTo} kun
            </strong>
          </li>
        </ul>
        <p>
          Raqam va profil to&apos;lov tasdiqlangan zahoti ishlay boshlaydi &mdash;
          qurilmani kutish shart emas.
        </p>
      </Section>

      <Section title="Qaytarish va almashtirish">
        <p>
          <strong>Raqam qaytarilmaydi.</strong> To&apos;lov amalga oshgan zahoti raqam
          xaridorga biriktiriladi va boshqa hech kimga sotilmaydi. Aynan shu cheklanganlik
          raqamning qiymatini tashkil qiladi, shuning uchun uni qaytarish boshqa
          xaridorlarning huquqini buzadi.
        </p>
        <p>
          <strong>Qurilmada zavod nuqsoni</strong> chiqsa &mdash; NFC chip ishlamasa,
          korpus shikastlangan bo&apos;lsa yoki bosma nuqsonli bo&apos;lsa &mdash; uni
          qabul qilgandan so&apos;ng <strong>{REPLACEMENT_WINDOW_DAYS} kun</strong> ichida
          xabar bering, biz yangisiga almashtiramiz. Almashtirish bepul.
        </p>
        <p>
          Foydalanish natijasida yuzaga kelgan shikast (chizilish, sinish, suvda qolish)
          zavod nuqsoni hisoblanmaydi.
        </p>
      </Section>

      <Section title="Raqamni boshqa odamga o'tkazish">
        <p>
          Raqam egasi uni istalgan vaqtda boshqa odamga o&apos;tkazishi mumkin &mdash;
          kabinetdan, qabul qiluvchining elektron pochtasi orqali. O&apos;tkazishda profil
          ma&apos;lumotlari (ism, bio, havolalar, postlar, obunachilar) tozalanadi va yangi
          egaga o&apos;tmaydi.
        </p>
      </Section>

      <Section title="Sotuvchi rekvizitlari">
        <p>
          Bu ma&apos;lumotlar sotuvchini tanishtirish uchun keltirilgan.{" "}
          <strong>Bu yerga pul o&apos;tkazish shart emas</strong> &mdash; to&apos;lov
          Payme yoki Click orqali, saytdagi tugma bilan amalga oshiriladi.
        </p>
        <dl className="rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
          <Row label="Tashkilot" value={COMPANY.legalName} />
          <Row label="STIR (INN)" value={COMPANY.inn} />
          <Row label="OKED" value={COMPANY.oked} />
          <Row label="Bank" value={COMPANY.bank} />
          <Row label="Hisob raqami" value={COMPANY.account} />
          <Row label="MFO" value={COMPANY.mfo} />
          <Row label="Manzil" value={COMPANY.address} />
        </dl>
      </Section>

      <Section title="Aloqa">
        <dl className="rounded-2xl border border-black/8 bg-black/[0.02] px-5 py-3">
          <Row label="Mas'ul shaxs" value={COMPANY.contactPerson} />
          <Row label="Telefon" value={COMPANY.phone} />
          <Row label="Elektron pochta" value={COMPANY.email} />
        </dl>
        <p>
          Savol yoki shikoyat bo&apos;lsa shu manzillarga murojaat qiling. Har bir murojaat
          ish kuni davomida ko&apos;rib chiqiladi.
        </p>
      </Section>
    </PageShell>
  );
}
