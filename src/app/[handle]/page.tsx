import Link from "next/link";
import type { Metadata } from "next";
import { parseHandle, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import SaveContactButton from "@/components/SaveContactButton";

// Demo dataset — stands in for a real profile database until one exists.
const DEMO_PROFILES: Record<
  string,
  { name: string; bio: string; links: { label: string; href: string }[] }
> = {
  MYN042: {
    name: "Aziz Karimov",
    bio: "Mynt asoschisi. Raqamli shaxs va networking bilan shug'ullanaman.",
    links: [
      { label: "Telegram", href: "https://t.me/azizkarimov" },
      { label: "Instagram", href: "https://instagram.com/azizkarimov" },
      { label: "Veb-sayt", href: "https://mynt.uz" },
    ],
  },
};

type Params = { handle: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${handle.toUpperCase()} — mynt.uz` };
}

export default async function HandlePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;
  const parsed = parseHandle(handle);

  if (!parsed) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-mynt-black/60">
          &quot;{handle}&quot; noto&apos;g&apos;ri format. Handle 3 harf + 3 raqamdan iborat
          bo&apos;lishi kerak (masalan MYN042).
        </p>
        <Link href="/" className="mt-6 text-sm font-medium underline">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const normalized = `${parsed.letters}${parsed.digits}`;
  const demo = DEMO_PROFILES[normalized];

  if (demo) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
        <Link href="/" className="mb-10 self-start font-display text-lg font-semibold">
          mynt<span className="text-lime">.</span>
        </Link>
        <div className="rounded-3xl bg-mynt-black p-8 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime font-display text-xl font-semibold text-mynt-black">
            {demo.name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">{demo.name}</h1>
          <p className="mt-1 font-tabular text-sm text-white/50">mynt.uz/{normalized}</p>
          <p className="mt-4 text-sm text-white/70">{demo.bio}</p>
        </div>

        <div className="mt-6">
          <SaveContactButton fullName={demo.name} handle={normalized} bio={demo.bio} />
        </div>

        <div className="mt-6 space-y-3">
          {demo.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-black/10 px-5 py-3 text-center font-medium transition-colors hover:bg-black/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Handle isn't claimed yet — show pricing breakdown and a claim CTA.
  const price = priceForHandle(parsed.letters, parsed.digits);
  const lr = letterRarity(parsed.letters);
  const dr = digitRarity(parsed.digits);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
      <Link href="/" className="mb-10 self-start font-display text-lg font-semibold">
        mynt<span className="text-lime">.</span>
      </Link>

      <div className="rounded-3xl border border-black/10 p-8 text-center">
        <p className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
          Bo&apos;sh
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
          {normalized}
        </h1>
        <p className="mt-1 text-sm text-mynt-black/50">mynt.uz/{normalized}</p>

        <div className="mt-8 space-y-2 text-left font-tabular text-sm">
          <div className="flex justify-between border-b border-black/5 py-2">
            <span>Harf kamyobligi — {lr.reason}</span>
            <span>&times;{lr.multiplier}</span>
          </div>
          <div className="flex justify-between border-b border-black/5 py-2">
            <span>Raqam kamyobligi — {dr.reason}</span>
            <span>&times;{dr.multiplier}</span>
          </div>
          <div className="flex justify-between pt-3 font-display text-lg font-semibold">
            <span>Narx</span>
            <span>{formatUZS(price)}</span>
          </div>
        </div>

        <button
          disabled
          title="Sotib olish oqimi tez orada ishga tushadi"
          className="mt-8 w-full cursor-not-allowed rounded-full bg-black/10 px-6 py-3 font-medium text-mynt-black/40"
        >
          Sotib olish — tez orada
        </button>
      </div>
    </div>
  );
}
