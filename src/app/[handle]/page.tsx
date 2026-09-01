import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { Nfc, Eye } from "lucide-react";
import { parseHandle, parseGenesisSerial, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import { getClaimedProfile, getGenesisCard } from "@/lib/handles";
import { linkValue } from "@/lib/links";
import SaveContactButton from "@/components/SaveContactButton";
import ShareButton from "@/components/ShareButton";
import ProfileHandleSearch from "@/components/ProfileHandleSearch";
import ActionRow from "@/components/ActionRow";
import ClaimForm from "@/components/ClaimForm";
import PageShell from "@/components/PageShell";
import { getUser } from "@/lib/auth";
import { isAnyProviderConfigured } from "@/lib/payments/config";
import {
  readVisitorContext,
  readSource,
  recordProfileView,
  type VisitSource,
} from "@/lib/analytics";
import { timeAgo } from "@/lib/relative-time";
import { listPostsForHandle } from "@/lib/posts";
import { countFollowing, isFollowing } from "@/lib/follows";
import FollowButton from "@/components/FollowButton";
import PostList from "@/components/PostList";

export async function generateMetadata(props: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await props.params;
  const title = `${handle.toUpperCase()} — flex.com.uz`;

  // Only pages with a real person or a real card behind them are worth
  // indexing. An unclaimed handle is a price quote, and there are 17.5M of
  // them — letting crawlers in would bury the profiles that matter.
  const serial = parseGenesisSerial(handle);
  if (serial) {
    const card = await getGenesisCard(serial);
    return { title, robots: card ? undefined : { index: false } };
  }

  const parsed = parseHandle(handle);
  if (!parsed) return { title, robots: { index: false } };

  const profile = await getClaimedProfile(`${parsed.letters}${parsed.digits}`);
  return { title, robots: profile ? undefined : { index: false } };
}

export default async function HandlePage(props: PageProps<"/[handle]">) {
  const { handle } = await props.params;
  const { bolim, src } = await props.searchParams;

  const genesisSerial = parseGenesisSerial(handle);
  if (genesisSerial) {
    return <GenesisCardPage serial={genesisSerial} />;
  }

  const parsed = parseHandle(handle);
  // Neither a handle nor a serial — render the 404 page with a 404 status
  // rather than a 200 that invites crawlers to index every typo.
  if (!parsed) notFound();

  // parseHandle accepts any casing, so /abc123 rendered the same profile as
  // /ABC123 under a second address. A card, a QR code and the sitemap all
  // carry the uppercase form, so that is the canonical one and the rest
  // redirect to it rather than standing beside it as duplicates.
  const canonical = `${parsed.letters}${parsed.digits}`;
  if (handle !== canonical) {
    permanentRedirect(bolim === "postlar" ? `/${canonical}?bolim=postlar` : `/${canonical}`);
  }

  return (
    <VanityHandlePage
      letters={parsed.letters}
      digits={parsed.digits}
      tab={bolim === "postlar" ? "postlar" : "vizitka"}
      source={readSource(typeof src === "string" ? src : undefined)}
    />
  );
}

async function VanityHandlePage({
  letters,
  digits,
  tab,
  source,
}: {
  letters: string;
  digits: string;
  tab: "vizitka" | "postlar";
  source: VisitSource | null;
}) {
  const normalized = `${letters}${digits}`;
  const profile = await getClaimedProfile(normalized);

  if (profile) {
    const viewer = await getUser();
    const isOwner = Boolean(viewer && profile.userId && viewer.id === profile.userId);

    // Owners looking at their own page would otherwise inflate their numbers.
    // Recorded after the response so it never delays the profile.
    if (!isOwner) {
      const visitor = await readVisitorContext(source);
      after(() => recordProfileView(normalized, visitor));
    }

    const lastSeen = timeAgo(profile.lastSeenAt);

    const [following, followingCount, posts] = await Promise.all([
      viewer ? isFollowing(viewer.id, normalized) : Promise.resolve(false),
      profile.userId ? countFollowing(profile.userId) : Promise.resolve(0),
      tab === "postlar" ? listPostsForHandle(normalized) : Promise.resolve([]),
    ]);

    return (
      <PageShell>
        {/* The handle and what a handle of this rarity costs, then a slim
            search. Kept to one line each: a padded search panel above the card
            was louder than the person it introduced. */}
        <ProfileHandleSearch />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-black/12 bg-white px-3.5 py-1.5 font-tabular text-sm tracking-wider shadow-sm">
            {normalized}
          </span>
          <span className="rounded-full bg-flex-black px-3.5 py-1.5 font-tabular text-sm text-white">
            {formatUZS(priceForHandle(letters, digits))}
          </span>
        </div>

        <div className="relative mt-1 overflow-hidden rounded-[1.75rem] bg-flex-black text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
          {/* Every card in this market opens with a banner and an avatar lapping
              over it. It is what makes a profile read as a card rather than a
              list, and ours had nothing above the initials. */}
          {/* The gradient and the sheen are separate layers on purpose:
              `.card-sheen` sets background-image, so a gradient utility on the
              same element is silently overwritten by it. */}
          <div className="grain relative h-28 bg-[radial-gradient(90%_150%_at_15%_-10%,#5c9600_0%,#2b4a06_35%,#171128_68%,#0e0a1b_100%)]">
            <div className="card-sheen absolute inset-0" />
            <div className="absolute top-4 right-4 z-10">
              <ShareButton handle={normalized} name={profile.name} />
            </div>
          </div>

          <div className="relative px-6 pb-6">
            <div className="-mt-11 mb-4">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-22 w-22 rounded-2xl border-4 border-flex-black object-cover"
                />
              ) : (
                <div className="flex h-22 w-22 items-center justify-center rounded-2xl border-4 border-flex-black bg-lime font-display text-2xl font-semibold text-flex-black">
                  {profile.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
              )}
            </div>

            <h1 className="font-display text-2xl font-semibold">{profile.name}</h1>

            {profile.company && (
              <p className="mt-0.5 text-base text-lime">{profile.company}</p>
            )}

            {(profile.position || profile.city) && (
              <p className="mt-1.5 border-l-2 border-lime/50 pl-2.5 text-sm leading-snug text-white/55">
                {profile.position}
                {profile.position && profile.city && <br />}
                {profile.city}
              </p>
            )}

            <p className="mt-2 font-tabular text-sm text-white/40">flex.com.uz/{normalized}</p>

            {lastSeen && <p className="mt-1 text-xs text-white/35">Oxirgi faollik: {lastSeen}</p>}

            {profile.bio && <p className="mt-4 text-sm text-white/70">{profile.bio}</p>}

            {profile.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* The save-contact action and sharing sit side by side, the way the
                whole market lays them out: the wide one is the thing to do, the
                square one is the thing to keep. */}
            <div className="mt-5 flex gap-2">
              <div className="min-w-0 flex-1">
                <SaveContactButton
                  fullName={profile.name}
                  handle={normalized}
                  bio={profile.bio}
                  phone={profile.phone}
                  email={profile.contactEmail}
                  position={profile.position}
                  company={profile.company}
                />
              </div>
              {!isOwner && (
                <div className="shrink-0">
                  <FollowButton handle={normalized} initialFollowing={following} compact />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-6 border-b border-white/10 text-sm">
              <Link
                href={`/${normalized}`}
                className={
                  tab === "vizitka"
                    ? "-mb-px border-b-2 border-lime pb-2.5 font-medium text-white"
                    : "-mb-px border-b-2 border-transparent pb-2.5 text-white/45 transition-colors hover:text-white"
                }
              >
                Vizitka
              </Link>
              <Link
                href={`/${normalized}?bolim=postlar`}
                className={
                  tab === "postlar"
                    ? "-mb-px flex items-center gap-1.5 border-b-2 border-lime pb-2.5 font-medium text-white"
                    : "-mb-px flex items-center gap-1.5 border-b-2 border-transparent pb-2.5 text-white/45 transition-colors hover:text-white"
                }
              >
                Postlar
                {profile.postCount > 0 && (
                  <span className="font-tabular text-xs text-white/35">{profile.postCount}</span>
                )}
              </Link>
            </div>

            {tab === "vizitka" && (
              <div className="mt-4 space-y-2">
                {profile.phone && (
                  <ActionRow
                    label="Qo'ng'iroq"
                    value={profile.phone}
                    href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}
                  />
                )}
                {profile.contactEmail && (
                  <ActionRow
                    label="Email"
                    value={profile.contactEmail}
                    href={`mailto:${profile.contactEmail}`}
                  />
                )}
                {profile.links.map((link, index) => (
                  <ActionRow
                    key={link.href}
                    label={link.label}
                    value={linkValue(link)}
                    // Routed through /go so the click is counted; the destination
                    // is resolved from this index server-side, not from the URL.
                    href={`/${normalized}/go?to=${index}`}
                    external
                  />
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-8 border-t border-white/10 pt-5">
              <div>
                <p className="font-display text-lg font-semibold tabular-nums">
                  {profile.followerCount}
                </p>
                <p className="text-xs text-white/40">Obunachi</p>
              </div>
              <div>
                <p className="font-display text-lg font-semibold tabular-nums">{followingCount}</p>
                <p className="text-xs text-white/40">Obuna</p>
              </div>
              <div>
                <p className="font-display text-lg font-semibold tabular-nums">
                  {profile.viewCount}
                </p>
                <p className="flex items-center gap-1 text-xs text-white/40">
                  <Eye className="h-3 w-3" />
                  Ko&apos;rish
                </p>
              </div>
            </div>

            {isOwner && (
              <Link
                href={`/kabinet/${normalized}`}
                className="mt-5 block rounded-full border border-white/15 px-6 py-3 text-center text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Profilni tahrirlash
              </Link>
            )}
          </div>
        </div>

        {tab === "postlar" && (
          <div className="mt-6">
            <PostList
              posts={posts}
              emptyMessage={
                isOwner
                  ? "Hali post yozmadingiz. Kabinetdan birinchi postni joylang."
                  : "Bu profilda hali post yo'q."
              }
            />
          </div>
        )}
      </PageShell>
    );
  }

  // Handle isn't claimed yet — show the rarity price breakdown and a claim CTA.
  const price = priceForHandle(letters, digits);
  const lr = letterRarity(letters);
  const dr = digitRarity(digits);
  const isSignedIn = Boolean(await getUser());

  return (
    <PageShell>
      <div className="relative rounded-[1.75rem] border border-black/10 bg-white p-8 text-center shadow-[0_30px_60px_-30px_rgba(14,10,27,0.25)]">
        <p className="inline-block rounded-full bg-lime/20 px-3 py-1 text-xs font-semibold tracking-wide text-flex-black/70 uppercase">
          Bo&apos;sh
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{normalized}</h1>
        <p className="mt-1 text-sm text-flex-black/50">flex.com.uz/{normalized}</p>

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

        <ClaimForm
          handle={normalized}
          priceLabel={formatUZS(price)}
          isSignedIn={isSignedIn}
          paymentEnabled={isAnyProviderConfigured}
        />
      </div>
    </PageShell>
  );
}

async function GenesisCardPage({ serial }: { serial: string }) {
  const card = await getGenesisCard(serial);

  return (
    <PageShell>
      <div className="grain card-sheen relative overflow-hidden rounded-[1.75rem] bg-flex-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
        <div className="relative flex items-center justify-between text-xs text-white/50">
          <span className="font-medium tracking-wide uppercase">FLEX CARD</span>
          <Nfc className="h-5 w-5 text-white/40" />
        </div>
        <div className="relative mt-10 font-display text-4xl font-semibold tracking-tight">
          #<span className="text-lime">{serial}</span>
        </div>
        <p className="relative mt-1 text-center font-tabular text-sm text-white/50">flex.com.uz/{serial}</p>

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
          className="mt-6 block rounded-full bg-lime px-6 py-3 text-center font-medium text-flex-black shadow-[0_12px_30px_-10px_rgba(171,255,9,0.65)] transition-transform hover:scale-[1.01]"
        >
          Profilni ko&apos;rish
        </Link>
      )}

      <p className="mt-6 text-center text-xs text-flex-black/40">
        FLEX CARD — ishlab chiqarilish tartibidagi noyob seriya raqami. Har bir karta faqat
        bitta marta chiqariladi va qayta ishlab chiqarilmaydi.
      </p>
    </PageShell>
  );
}
