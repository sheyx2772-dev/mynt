import Link from "next/link";
import type { Metadata } from "next";
import { Nfc } from "lucide-react";
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

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="bg-dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_45%_at_50%_0%,black,transparent)]" />
      <div className="absolute -top-24 right-[-4rem] h-72 w-72 rounded-full bg-lime/20 blur-[90px]" />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col px-6 py-16">
        <Link href="/" className="mb-10 flex items-center gap-2 self-start font-display text-lg font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mynt-black">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          mynt
        </Link>
        {children}
      </div>
    </div>
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
      <PageShell>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-mynt-black/60">
            &quot;{handle}&quot; noto&apos;g&apos;ri format. Shaxsiy handle 3 harf + 3 raqamdan
            (masalan MYN042), MYNT CARD seriya raqami esa 6 ta raqamdan iborat bo&apos;ladi
            (masalan 000001).
          </p>
        </div>
      </PageShell>
    );
  }

  return <VanityHandlePage letters={parsed.letters} digits={parsed.digits} />;
}

async function VanityHandlePage({ letters, digits }: { letters: string; digits: string }) {
  const normalized = `${letters}${digits}`;
  const profile = await getClaimedProfile(normalized);

  if (profile) {
    return (
      <PageShell>
        <div className="grain card-sheen relative overflow-hidden rounded-[1.75rem] bg-mynt-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-lime font-display text-xl font-semibold text-mynt-black shadow-[0_10px_24px_-8px_rgba(171,255,9,0.6)]">
            {profile.name
              .split(" ")
              .map((p) => p[0])
              .join("")}
          </div>
          <h1 className="relative mt-5 font-display text-2xl font-semibold">{profile.name}</h1>
          <p className="relative mt-1 font-tabular text-sm text-white/50">mynt.uz/{normalized}</p>
          <p className="relative mt-4 text-sm text-white/70">{profile.bio}</p>
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
              className="block rounded-xl border border-black/10 bg-white px-5 py-3 text-center font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {link.label}
            </a>
          ))}
        </div>
      </PageShell>
    );
  }

  // Handle isn't claimed yet — show the rarity price breakdown and a claim CTA.
  const price = priceForHandle(letters, digits);
  const lr = letterRarity(letters);
  const dr = digitRarity(digits);

  return (
    <PageShell>
      <div className="relative rounded-[1.75rem] border border-black/10 bg-white p-8 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <p className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-semibold tracking-wide text-mynt-black/70 uppercase">
          Bo&apos;sh
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{normalized}</h1>
        <p className="mt-1 text-sm text-mynt-black/50">mynt.uz/{normalized}</p>

        <div className="mt-8 space-y-1 text-left font-tabular text-sm">
          <div className="flex justify-between border-b border-black/5 py-2.5">
            <span>Harf kamyobligi — {lr.reason}</span>
            <span className="font-semibold">&times;{lr.multiplier}</span>
          </div>
          <div className="flex justify-between border-b border-black/5 py-2.5">
            <span>Raqam kamyobligi — {dr.reason}</span>
            <span className="font-semibold">&times;{dr.multiplier}</span>
          </div>
          <div className="flex justify-between pt-4 font-display text-lg font-semibold">
            <span>Narx</span>
            <span>{formatUZS(price)}</span>
          </div>
        </div>

        <ClaimForm letters={letters} digits={digits} priceLabel={formatUZS(price)} />
      </div>
    </PageShell>
  );
}

async function GenesisCardPage({ serial }: { serial: string }) {
  const card = await getGenesisCard(serial);

  return (
    <PageShell>
      <div className="grain card-sheen relative overflow-hidden rounded-[1.75rem] bg-mynt-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
        <div className="relative flex items-center justify-between text-xs text-white/50">
          <span className="font-medium tracking-wide uppercase">MYNT CARD</span>
          <Nfc className="h-5 w-5 text-white/40" />
        </div>
        <div className="relative mt-10 font-display text-4xl font-semibold tracking-tight">
          #<span className="text-lime">{serial}</span>
        </div>
        <p className="relative mt-1 font-tabular text-sm text-white/50">mynt.uz/{serial}</p>

        {card?.status === "claimed" ? (
          <div className="relative mt-8 border-t border-white/10 pt-6">
            <p className="text-xs tracking-wide text-white/40 uppercase">Egasi</p>
            <p className="mt-1 font-display text-lg font-semibold">{card.ownerName}</p>
            {card.mintedAt && (
              <p className="mt-1 text-xs text-white/40">Ishlab chiqarilgan: {card.mintedAt}</p>
            )}
          </div>
        ) : (
          <div className="relative mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-white/60">
              {card ? "Bu karta hali egasiga topshirilmagan." : "Bu seriya raqami hali chiqarilmagan."}
            </p>
          </div>
        )}
      </div>

      {card?.status === "claimed" && card.ownerHandle && (
        <Link
          href={`/${card.ownerHandle.toLowerCase()}`}
          className="mt-6 block rounded-full bg-lime px-6 py-3 text-center font-medium text-mynt-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
        >
          Profilni ko&apos;rish
        </Link>
      )}

      <p className="mt-6 text-center text-xs text-mynt-black/40">
        MYNT CARD — ishlab chiqarilish tartibidagi noyob seriya raqami. Har bir karta faqat
        bitta marta chiqariladi va qayta ishlab chiqarilmaydi.
      </p>
    </PageShell>
  );
}
