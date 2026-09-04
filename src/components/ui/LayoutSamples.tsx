// The seven layouts, lifted out of the /mavzular bench so the catalogue can
// show the same ones without a second copy drifting away from the first.
// Each renders inside its own [data-theme] wrapper, which is what the app's
// own theme system needs — the Figma catalogue's styles are scoped to
// .figma-katalog and do not reach in here.


import PlaqueProfile from "@/components/ui/PlaqueProfile";
import SocialProfile from "@/components/ui/SocialProfile";
import PosterProfile from "@/components/ui/PosterProfile";
import ReceiptProfile from "@/components/ui/ReceiptProfile";
import NfcCardProfile from "@/components/ui/NfcCardProfile";

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

const NFC_ACTIONS = [
  { kind: "email", label: "Email", href: "mailto:aziz@mclegal.uz" },
  { kind: "call", label: "Call", href: "tel:+998901234567" },
  { kind: "calendar", label: "Calendar", href: "#" },
  { kind: "connect", label: "Connect", href: "#" },
  { kind: "LinkedIn", label: "Linkedin", href: "#" },
  { kind: "Instagram", label: "Instagram", href: "#" },
  { kind: "YouTube", label: "Youtube", href: "#" },
  { kind: "Telegram", label: "Telegram", href: "#" },
];

function NfcSample({ theme }: { theme: string }) {
  return (
    <div data-theme={theme} className="themed overflow-hidden rounded-2xl">
      <NfcCardProfile
        name="Aziz Karimov"
        org="MC LEGAL"
        role="CEO"
        locationHref="#"
        actions={NFC_ACTIONS}
        websiteHref="#"
        labels={{ addToContacts: "Add to contacts", share: "Share" }}
        logo={
          <span className="text-[15px] font-black tracking-[0.24em] text-on-accent uppercase">
            FLEX
          </span>
        }
        about={{
          title: "Aziz Karimov",
          body:
            "MC LEGAL direktori. Korporativ huquq, shartnomalar va sud vakilligi bo'yicha 12 yillik amaliyot. Toshkent.",
        }}
      />
    </div>
  );
}

export const LAYOUTS = [
  {
    name: "NFC vizitka — ko'k",
    note: "Papkadagi shablon: brend lentasi, ustidan chiqib turgan doira portret, 4×2 dumaloq tugmalar to'ri, ikkita tugma qatori, sayt tugmasi, va \"haqida\" bo'limi.",
    who: "Tashkilot xodimi — bank, universitet, vazirlik. Brend rangi lentada va tugmalarda.",
    render: () => <NfcSample theme="nfc-kok" />,
  },
  {
    name: "NFC vizitka — tungi",
    note: "Xuddi shu shablon, qora fon va to'q sariq aksent bilan.",
    who: "Papkadagi uchinchi variant: gradient lenta, qora tana.",
    render: () => <NfcSample theme="nfc-tun" />,
  },
  {
    name: "NFC vizitka — yashil",
    note: "Xuddi shu shablon, bank yashili bilan.",
    who: "Papkadagi to'rtinchi variant.",
    render: () => <NfcSample theme="nfc-yashil" />,
  },
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

