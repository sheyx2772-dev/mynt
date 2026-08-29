import Link from "next/link";
import type { Metadata } from "next";
import { parseHandle, parseGenesisSerial, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import { getClaimedProfile, getGenesisCard } from "@/lib/handles";
import SaveContactButton from "@/components/SaveContactButton";
import ClaimForm from "@/components/ClaimForm";

type Params = { handle: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { handle } = await params;
  return { title: `${handle.toUpperCase()} — mynt.uz` };
}

function BrandLink() {
  return (
    <Link href="/" className="mb-10 self-start font-display text-lg font-semibold">
      mynt<span className="text-lime">.</span>
    </Link>
  );
}

export default async function HandlePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;

  const genesisSerial = parseGenesisSerial(handle);
  if (genesisSerial) {
    return <GenesisCardPage serial={genesisSerial} />;
  }

  const parsed = parseHandle(handle);
  if (!parsed) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-mynt-black/60">
          &quot;{handle}&quot; noto&apos;g&apos;ri format. Shaxsiy handle 3 harf + 3 raqamdan
          (masalan MYN042), MYNT CARD seriya raqami esa 6 ta raqamdan iborat bo&apos;ladi
          (masalan 000001).
        </p>
        <Link href="/" className="mt-6 text-sm font-medium underline">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  return <VanityHandlePage letters={parsed.letters} digits={parsed.digits} />;
}

async function VanityHandlePage({ letters, digits }: { letters: string; digits: string }) {
  const normalized = `${letters}${digits}`;
  const profile = await getClaimedProfile(normalized);

  if (profile) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
        <BrandLink />
        <div className="rounded-3xl bg-mynt-black p-8 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime font-display text-xl font-semibold text-mynt-black">
            {profile.name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold">{profile.name}</h1>
          <p className="mt-1 font-tabular text-sm text-white/50">mynt.uz/{normalized}</p>
          <p className="mt-4 text-sm text-white/70">{profile.bio}</p>
        </div>

        <div className="mt-6">
          <SaveContactButton fullName={profile.name} handle={normalized} bio={profile.bio} />
        </div>

        <div className="mt-6 space-y-3">
          {profile.links.map((link) => (
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

  // Handle isn't claimed yet — show the rarity price breakdown and a claim CTA.
  const price = priceForHandle(letters, digits);
  const lr = letterRarity(letters);
  const dr = digitRarity(digits);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
      <BrandLink />

      <div className="rounded-3xl border border-black/10 p-8 text-center">
        <p className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-medium uppercase tracking-wide">
          Bo&apos;sh
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{normalized}</h1>
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

        <ClaimForm letters={letters} digits={digits} priceLabel={formatUZS(price)} />
      </div>
    </div>
  );
}

async function GenesisCardPage({ serial }: { serial: string }) {
  const card = await getGenesisCard(serial);

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
      <BrandLink />

      <div className="rounded-3xl bg-mynt-black p-8 text-white">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>MYNT CARD</span>
          <span className="h-2 w-2 rounded-full bg-lime" />
        </div>
        <div className="mt-10 font-display text-4xl font-semibold tracking-tight">
          #<span className="text-lime">{serial}</span>
        </div>
        <p className="mt-1 font-tabular text-sm text-white/50">mynt.uz/{serial}</p>

        {card?.status === "claimed" ? (
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs uppercase tracking-wide text-white/40">Egasi</p>
            <p className="mt-1 font-display text-lg font-semibold">{card.ownerName}</p>
            {card.mintedAt && (
              <p className="mt-1 text-xs text-white/40">
                Ishlab chiqarilgan: {card.mintedAt}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-white/60">
              {card ? "Bu karta hali egasiga topshirilmagan." : "Bu seriya raqami hali chiqarilmagan."}
            </p>
          </div>
        )}
      </div>

      {card?.status === "claimed" && card.ownerHandle && (
        <Link
          href={`/${card.ownerHandle.toLowerCase()}`}
          className="mt-6 block rounded-full bg-lime px-6 py-3 text-center font-medium text-mynt-black transition-transform hover:scale-[1.01]"
        >
          Profilni ko&apos;rish
        </Link>
      )}

      <p className="mt-6 text-center text-xs text-mynt-black/40">
        MYNT CARD — ishlab chiqarilish tartibidagi noyob seriya raqami. Har bir karta faqat
        bitta marta chiqariladi va qayta ishlab chiqarilmaydi.
      </p>
    </div>
  );
}
