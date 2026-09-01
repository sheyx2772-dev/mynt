import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { Nfc } from "lucide-react";
import { parseHandle, parseGenesisSerial, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import { getClaimedProfile, getGenesisCard } from "@/lib/handles";
import { linkValue } from "@/lib/links";
import { dict, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { PLAN_ACCENT, serviceLimit, FREE_LINK_LIMIT } from "@/lib/plans";
import { cardDesign } from "@/lib/card-designs";
import SaveContactButton from "@/components/SaveContactButton";
import ShareButton from "@/components/ShareButton";
import ProfileHandleSearch from "@/components/ProfileHandleSearch";
import LangSwitch from "@/components/LangSwitch";
import ActionRow from "@/components/ActionRow";
import ExchangeContactForm from "@/components/ExchangeContactForm";
import ProfileComments from "@/components/ProfileComments";
import { listComments } from "@/lib/comments";
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
  const { bolim, src, til } = await props.searchParams;

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
      lang={await getLang(til)}
      params={{ bolim: typeof bolim === "string" ? bolim : undefined, src: typeof src === "string" ? src : undefined }}
    />
  );
}

async function VanityHandlePage({
  letters,
  digits,
  tab,
  source,
  lang,
  params,
}: {
  letters: string;
  digits: string;
  tab: "vizitka" | "postlar";
  source: VisitSource | null;
  lang: Lang;
  params: Record<string, string | undefined>;
}) {
  const normalized = `${letters}${digits}`;
  const t = dict(lang);
  const profile = await getClaimedProfile(normalized);

  if (profile) {
    // The owner's first name, which two of the visitor-facing sentences use.
    const firstName = profile.name.split(" ")[0] || normalized;

    // Where the language switch returns to: this page, with whatever else was
    // in the address, so switching on the posts tab does not send you back to
    // the card.
    const kept = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    const backTo = `/${normalized}${kept.size ? `?${kept}` : ""}`;

    const viewer = await getUser();
    const isOwner = Boolean(viewer && profile.userId && viewer.id === profile.userId);

    // Owners looking at their own page would otherwise inflate their numbers.
    // Recorded after the response so it never delays the profile.
    if (!isOwner) {
      const visitor = await readVisitorContext(source);
      after(() => recordProfileView(normalized, visitor));
    }

    const lastSeen = timeAgo(profile.lastSeenAt, lang);

    const [following, followingCount, posts, comments] = await Promise.all([
      viewer ? isFollowing(viewer.id, normalized) : Promise.resolve(false),
      profile.userId ? countFollowing(profile.userId) : Promise.resolve(0),
      tab === "postlar" ? listPostsForHandle(normalized) : Promise.resolve([]),
      listComments(normalized),
    ]);

    // The owner's own cover wins over the catalogue artwork, which wins over
    // the plain gradient. Three states, one variable.
    const banner =
      profile.bannerUrl ?? profile.team?.logoUrl ?? cardDesign(profile.cardDesign).image ?? null;

    return (
      <PageShell>
        {/* The handle and what a handle of this rarity costs, then a slim
            search. Kept to one line each: a padded search panel above the card
            was louder than the person it introduced. */}
        <ProfileHandleSearch />

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-black/12 bg-white px-3 py-1.5 font-tabular text-xs tracking-[0.14em] shadow-sm">
            {normalized}
          </span>
          <span className="rounded-lg bg-flex-black px-3 py-1.5 font-tabular text-xs tracking-wide text-white">
            {formatUZS(priceForHandle(letters, digits))}
          </span>

          <div className="ml-auto">
            <LangSwitch lang={lang} next={backTo} />
          </div>
        </div>

        {/* Gold marks a live subscription, lime a profile without one. It is
            the one benefit of the monthly plan that the people a card is handed
            to can actually see, and the one that stops the month the payments
            do. Every child reads it from this one variable. */}
        <div
          style={{ "--accent": PLAN_ACCENT[profile.plan] } as React.CSSProperties}
          className="relative mt-1 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B0B0F] text-white shadow-[0_40px_80px_-30px_rgba(0,0,0,0.75)]"
        >
          {/* Two channels, so neither has to give way. The banner shows the
              artwork of the card the owner actually holds — a person who tapped
              a gold-engraved card sees that engraving here — while the accent
              above marks whether the subscription is live. The handle sits over
              both as a watermark, the way a serial is put on the object rather
              than printed on its sleeve. */}
          <div className="grain relative h-24 bg-[linear-gradient(160deg,#17171e_0%,#0B0B0F_75%)]">
            {banner ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- a static file in public/, sized by CSS */}
                <img
                  src={banner}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                {/* The artwork is a card face, not a header: it has to sink far
                    enough for white text and a lapping avatar to sit on it. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.35)_0%,rgba(11,11,15,0.8)_100%)]"
                />
              </>
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.16]"
                style={{
                  backgroundImage:
                    "radial-gradient(85% 130% at 12% -20%, var(--accent) 0%, transparent 62%)",
                }}
              />
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute top-5 left-6 font-display text-[2.6rem] leading-none font-semibold tracking-[0.08em] text-[color:var(--accent)] opacity-[0.09] select-none"
            >
              {normalized}
            </span>
            <div className="absolute top-4 right-4 z-10">
              <ShareButton handle={normalized} name={profile.name} />
            </div>
          </div>

          <div className="relative px-6 pb-6">
            <div className="-mt-10 mb-5">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="h-20 w-20 rounded-xl border border-white/15 object-cover shadow-[0_12px_30px_-12px_rgba(0,0,0,0.9)]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-white/15 bg-[#15151b] font-display text-xl font-semibold tracking-wide text-white/80">
                  {profile.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </div>
              )}
            </div>

            <h1 className="font-display text-[1.65rem] leading-tight font-semibold tracking-tight">
              {profile.name}
            </h1>

            {(profile.position || profile.company) && (
              <p className="mt-2 text-[11px] font-medium tracking-[0.18em] text-white/45 uppercase">
                {[profile.position, profile.company].filter(Boolean).join(" · ")}
              </p>
            )}

            {lastSeen && (
              <p className="mt-2 text-xs text-[color:var(--accent)]">
                {t.lastSeen} — {lastSeen}
              </p>
            )}

            {profile.bio && (
              <p className="mt-4 text-sm leading-relaxed text-white/60">{profile.bio}</p>
            )}

            {profile.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.14em] text-white/30 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* A rectangle, not a pill, and white rather than brand-filled. A
                saturated lime slab is the loudest thing on a screen and reads as
                an app's call to action; the card wants the quietest possible
                statement of the one thing to do. */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="min-w-0">
                <SaveContactButton
                  fullName={profile.name}
                  handle={normalized}
                  bio={profile.bio}
                  phone={profile.phone}
                  email={profile.contactEmail}
                  position={profile.position}
                  company={profile.company}
                  label={t.saveContact}
                />
              </div>
              {!isOwner && <FollowButton
                  handle={normalized}
                  initialFollowing={following}
                  labels={{ follow: t.follow, following: t.following }}
                />}

              {/* Premium, and only for a visitor: the owner has no reason to
                  send themselves a contact, and seeing the form on their own
                  page would read as something they are meant to fill in. */}
              {!isOwner && profile.plan === "premium" && (
                <ExchangeContactForm
                  handle={normalized}
                  source={source ?? undefined}
                  t={{
                    sent: t.sent,
                    sendContact: t.sendContact,
                    reachYou: t.reachYou(firstName),
                    contactHint: t.contactHint(firstName),
                    yourName: t.yourName,
                    phone: t.phone,
                    company: t.company,
                    note: t.note,
                    send: t.send,
                    sending: t.sending,
                    cancel: t.cancel,
                  }}
                />
              )}
            </div>

            <div className="mt-6 flex gap-7 border-t border-white/[0.08] pt-5">
              {(profile.followerCount > 0 || followingCount > 0) && (
                <>
                  <div>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {profile.followerCount}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-[0.14em] text-white/30 uppercase">
                      {t.followers}
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-base font-semibold tabular-nums">
                      {followingCount}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-[0.14em] text-white/30 uppercase">
                      {t.follows}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="font-display text-base font-semibold tabular-nums">
                  {profile.viewCount}
                </p>
                <p className="mt-0.5 text-[10px] tracking-[0.14em] text-white/30 uppercase">
                  {t.views}
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-7 border-b border-white/[0.08] text-[11px] tracking-[0.16em] uppercase">
              <Link
                href={`/${normalized}`}
                className={
                  tab === "vizitka"
                    ? "-mb-px border-b border-[color:var(--accent)] pb-3 font-medium text-white"
                    : "-mb-px border-b border-transparent pb-3 text-white/35 transition-colors hover:text-white/70"
                }
              >
                {t.card}
              </Link>
              <Link
                href={`/${normalized}?bolim=postlar`}
                className={
                  tab === "postlar"
                    ? "-mb-px flex items-center gap-1.5 border-b border-[color:var(--accent)] pb-3 font-medium text-white"
                    : "-mb-px flex items-center gap-1.5 border-b border-transparent pb-3 text-white/35 transition-colors hover:text-white/70"
                }
              >
                {t.posts}
                {profile.postCount > 0 && (
                  <span className="font-tabular text-white/25">{profile.postCount}</span>
                )}
              </Link>
            </div>

            {tab === "vizitka" && (
              <div className="mt-5 divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08]">
                {profile.phone && (
                  <ActionRow
                    label={t.call}
                    icon="call"
                    value={profile.phone}
                    href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}
                  />
                )}
                {profile.contactEmail && (
                  <ActionRow
                    label={t.email}
                    icon="email"
                    value={profile.contactEmail}
                    href={`mailto:${profile.contactEmail}`}
                  />
                )}
                {profile.city && (
                  <ActionRow label={t.address} icon="Veb-sayt" value={profile.city} href={`/rezidentlar?q=${encodeURIComponent(profile.city)}`} />
                )}
                {/* Stored in full, shown by plan: an owner who fills in eight
                    and lets premium lapse keeps all eight in the form and gets
                    them back on renewal. */}
                {/* Labelled with the company's name rather than "Veb-sayt",
                    which the member may also have: two rows reading the same
                    word and pointing at different places is worse than either
                    one alone. */}
                {profile.team?.website && (
                  <ActionRow
                    label={profile.team.name}
                    icon="Veb-sayt"
                    value={linkValue({ label: "Veb-sayt", href: profile.team.website })}
                    href={profile.team.website}
                    external
                  />
                )}

                {profile.links
                  .map((link, index) => ({ link, index }))
                  .slice(0, profile.plan === "premium" ? undefined : FREE_LINK_LIMIT)
                  .map(({ link, index }) => (
                    <ActionRow
                      key={link.href}
                      // A platform names itself; only "Uchrashuv" and
                      // "Veb-sayt" are ours to translate.
                      label={
                        link.label === "Uchrashuv"
                          ? t.meeting
                          : link.label === "Veb-sayt"
                            ? t.website
                            : link.label
                      }
                      icon={link.label}
                      value={linkValue(link)}
                      // Routed through /go so the click is counted; the
                      // destination is resolved from this index server-side,
                      // not from the URL.
                      href={`/${normalized}/go?to=${index}`}
                      external
                    />
                  ))}
              </div>
            )}

            {tab === "vizitka" && profile.services.length > 0 && (
              <div className="mt-6">
                <p className="text-[10px] font-medium tracking-[0.18em] text-white/35 uppercase">
                  {t.services}
                </p>
                <ul className="mt-3 divide-y divide-white/[0.07] overflow-hidden rounded-xl border border-white/[0.08]">
                  {profile.services.slice(0, serviceLimit(profile.plan)).map((service) => (
                    <li
                      key={service.name}
                      className="flex items-baseline justify-between gap-4 px-4 py-3"
                    >
                      <span className="min-w-0 text-sm text-white/85">{service.name}</span>
                      {service.price && (
                        <span className="shrink-0 font-tabular text-sm text-[color:var(--accent)]">
                          {service.price}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "vizitka" && profile.commentsOpen && (
              <ProfileComments
                handle={normalized}
                comments={comments}
                viewerId={viewer?.id ?? null}
                ownerId={profile.userId}
                labels={{
                  title: t.comments,
                  placeholder: t.commentPlaceholder,
                  send: t.commentSend,
                  sending: t.commentSending,
                  empty: t.commentsEmpty,
                  signIn: t.commentSignIn,
                }}
              />
            )}

            {isOwner && (
              <Link
                href={`/kabinet/${normalized}`}
                className="mt-4 block rounded-xl border border-white/12 py-3 text-center text-[11px] font-medium tracking-[0.16em] text-white/55 uppercase transition-colors hover:border-white/25 hover:text-white"
              >
                Tahrirlash
              </Link>
            )}

            {/* The foot of the card, the way an object is marked: what it is
                and nothing else. */}
            <div className="mt-7 flex justify-end border-t border-white/[0.08] pt-5">
              {profile.plan === "free" && (
                <Link
                  href="/tarif"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-white/25 uppercase transition-colors hover:text-white/45"
                >
                  <span className="h-1 w-1 rounded-full bg-[color:var(--accent)]" />
                  Flex
                </Link>
              )}
            </div>


          </div>
        </div>

        {tab === "postlar" && (
          <div className="mt-6">
            <PostList
              posts={posts}
              emptyMessage={
                isOwner
                  ? "Hali post yozmadingiz. Kabinetdan birinchi postni joylang."
                  : t.noPosts
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
