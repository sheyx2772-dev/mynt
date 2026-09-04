import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { after } from "next/server";
import type { Metadata } from "next";
import { Clock, Eye, Nfc, Phone, Send } from "lucide-react";
import { parseHandle, parseGenesisSerial, priceForHandle, letterRarity, digitRarity } from "@/lib/pricing";
import { formatUZS } from "@/lib/format";
import { getClaimedProfile, getGenesisCard } from "@/lib/handles";
import { linkValue } from "@/lib/links";
import { dict, menuBar, type Lang } from "@/lib/i18n";
import { venueWords } from "@/lib/venue-words";
import { planState } from "@/lib/venue-billing";
import { getLang } from "@/lib/lang";
import { serviceLimit, FREE_LINK_LIMIT } from "@/lib/plans";
import { cardDesign } from "@/lib/card-designs";
import SaveContactButton from "@/components/SaveContactButton";
import ProfileHandleSearch from "@/components/ProfileHandleSearch";
import LangSwitch from "@/components/LangSwitch";
import Mark from "@/components/Mark";
import MenuView from "@/components/MenuView";
import Plate from "@/components/ui/Plate";
import CardObject from "@/components/ui/CardObject";
import MenuRequests from "@/components/MenuRequests";
import { getVenueByHandle, getMenu } from "@/lib/menu";
import ActionRow from "@/components/ActionRow";
import ExchangeContactForm from "@/components/ExchangeContactForm";
import ProfileComments from "@/components/ProfileComments";
import RecommendButton from "@/components/RecommendButton";
import { listRecommenders, isRecommended } from "@/lib/recommendations";
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
import { isFollowing } from "@/lib/follows";
import FollowButton from "@/components/FollowButton";
import PostList from "@/components/PostList";

// The two button shapes this page uses, named once.
//
// A raised slab in ink for the things a stranger actually came to do — ring,
// message — and a pressed-in one in paper for the things they might. The
// difference is real: one sticks up off the sheet and moves down a pixel when
// pressed, the other is already pressed into it.
const inkButton =
  "flex h-14 items-center justify-center gap-2.5 rounded-xl bg-ink text-[16px] font-semibold text-paper shadow-slab active:translate-y-px active:shadow-none";

const paperButton =
  "flex h-14 items-center justify-center gap-2 rounded-xl bg-paper px-3 text-[16px] font-medium text-ink shadow-deboss active:bg-ink/5";

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
  const { bolim, src, til, stol, xona } = await props.searchParams;

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
      params={{
        bolim: typeof bolim === "string" ? bolim : undefined,
        src: typeof src === "string" ? src : undefined,
        // Which point the tag was on. Carried through so the language switch
        // does not drop it and send the guest back to a list with no table or
        // room attached — a request from nowhere reaches nobody.
        stol: typeof stol === "string" ? stol : undefined,
        xona: typeof xona === "string" ? xona : undefined,
      }}
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
    // A number that belongs to a venue opens the venue, not a person. The tag
    // on a table is the same tag as a card in a pocket, and what is behind it
    // is what the owner made of it.
    const venue = await getVenueByHandle(normalized);

    if (venue) {
      const categories = await getMenu(venue.id, lang);
      const w = venueWords(venue.kind, lang);

      // The tag on a hotel door says xona, the one on a table says stol, and
      // whoever printed the stickers used the word for their own building.
      const rawPoint = params.stol ?? params.xona;
      const point = typeof rawPoint === "string" ? rawPoint.slice(0, 12) : null;

      // Counted the same as a profile: a table that gets tapped is the number
      // a venue is paying us to learn.
      const viewer = await getUser();
      const isOwner = Boolean(viewer && profile.userId && viewer.id === profile.userId);
      if (!isOwner) {
        const visitor = await readVisitorContext(source);
        after(() => recordProfileView(normalized, visitor));
      }

      return (
        // The same object logic as a profile: a menu is a printed thing lying
        // on a table, so it is a card lying on a ground rather than a page.
        <div data-surface="ink" className="relative min-h-full">
          {/* A guest reading a menu is a stranger who tapped a sticker on a
              table. Four of our tabs along the bottom of their screen are four
              things to press by accident on the way out — and one of them is a
              cabinet they will never have. This was on the profile branch
              below and missing here, so every cafe menu carried it. */}
          <span data-no-app-bar hidden />

          <div className="mx-auto w-full max-w-md px-4 pt-5 pb-[120px]">
            <div className="mb-4 flex h-11 items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-[15px] font-semibold text-paper"
              >
                <Mark tone="dark" />
                FLEX
              </Link>
              <LangSwitch lang={lang} next={`/${normalized}`} tone="dark" />
            </div>

            <article className="overflow-hidden rounded-tile bg-white px-5 py-5 text-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
              <MenuView venue={venue} categories={categories} point={point} w={w} />
            </article>
          </div>

          {/* The call button is what the venue pays for, so it is what stops
              when the venue stops paying. The menu above it does not: a sticker
              on a table cannot die because an invoice is late, and embarrassing
              a cafe in front of its own guests over our billing is not a thing
              we get to do to them. */}
          {planState(venue.planExpiresAt).active && (
            <MenuRequests handle={normalized} point={point} s={menuBar(lang)} w={w} />
          )}
        </div>
      );
    }

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

    const [following, posts, comments, recommenders, viewerRecommends] =
      await Promise.all([
      viewer ? isFollowing(viewer.id, normalized) : Promise.resolve(false),
      tab === "postlar" ? listPostsForHandle(normalized) : Promise.resolve([]),
      listComments(normalized),
      listRecommenders(normalized),
      viewer ? isRecommended(normalized, viewer.id) : Promise.resolve(false),
    ]);

    // The owner's own cover wins over the catalogue artwork, which wins over
    // the plain gradient. Three states, one variable.
    const banner =
      profile.bannerUrl ?? profile.team?.logoUrl ?? cardDesign(profile.cardDesign).image ?? null;

    // Two quick actions above the fold, because a stranger holding a phone
    // wants to ring or message and nothing else. Derived rather than
    // configured: whatever the owner actually filled in.
    const telegram = profile.links.find((l) => /telegram/i.test(l.label));
    const telegramIndex = telegram ? profile.links.indexOf(telegram) : -1;

    return (
      // A card on a desk, with a sheet of paper slid under it.
      //
      // The stranger reading this has just touched a piece of plastic, so the
      // screen answers with that piece of plastic and then puts the paperwork
      // underneath. Everything below the card is one continuous sheet: the
      // tabs are cut from it, and the sections are ruled rather than boxed,
      // because a document does not have cards inside it.
      <div className="min-h-full bg-paper pb-32 text-ink">
        {/* Keeps the app bar off somebody else's card. */}
        <span data-no-app-bar hidden />

        <main className="mx-auto flex w-full max-w-[460px] flex-col pt-8">
          <CardObject n={normalized} name={profile.name} artwork={banner} />

          {/* Slid under the card, and casting its shadow upward — which is what
              tells the eye which of the two is on top. */}
          <div className="relative z-10 -mt-12 mx-3 rounded-2xl bg-sheet px-5 pt-16 pb-6 shadow-sheet">
            <div className="flex items-end gap-4">
              <div className="relative -mt-10 shrink-0">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, avoids next.config remotePatterns coupling
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    width={96}
                    height={96}
                    className="size-24 rounded-[14px] border-[3px] border-sheet bg-paper object-cover shadow-photo"
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-[14px] border-[3px] border-sheet bg-ink text-[28px] font-semibold text-paper shadow-photo">
                    {profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
              </div>

              <div className="min-w-0 pb-1">
                <h1 className="text-[24px] leading-tight font-semibold tracking-[-0.01em] text-balance">
                  {profile.name}
                </h1>
                {(profile.position || profile.company) && (
                  <p className="mt-1 text-[16px] leading-6 text-mute">
                    {profile.position}
                    {profile.position && profile.company && " · "}
                    {profile.company && (
                      <span className="font-medium text-ink">{profile.company}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <Plate n={normalized} size="lg" />
            </div>

            {profile.bio && (
              <p className="mt-5 text-[16px] leading-relaxed text-ink/85 text-pretty">
                {profile.bio}
              </p>
            )}

            {profile.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-9 items-center rounded-lg bg-paper px-3 text-[16px] text-mute shadow-deboss"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {(profile.phone || telegram) && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone.replace(/[^0-9+]/g, "")}`}
                    className={inkButton}
                  >
                    <Phone className="size-5" />
                    {t.call}
                  </a>
                )}
                {telegram && (
                  <a
                    href={`/${normalized}/go?to=${telegramIndex}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={inkButton}
                  >
                    <Send className="size-5" />
                    Telegram
                  </a>
                )}
              </div>
            )}

            {!isOwner && (
              <div className="mt-3 flex flex-col gap-3">
                {/* A pair, so they sit as a pair. Stacked, each one read as a
                    separate decision and the sheet grew two rows taller for
                    nothing. */}
                <div className="grid grid-cols-2 gap-3">
                  <RecommendButton
                    handle={normalized}
                    count={profile.recommendCount}
                    recommended={viewerRecommends}
                    labels={{ recommend: t.recommend, recommended: t.recommended }}
                  />

                  <FollowButton
                    handle={normalized}
                    initialFollowing={following}
                    labels={{ follow: t.follow, following: t.following }}
                  />
                </div>

                {/* Who vouched, by their own handle. A name is a claim; a
                    handle is a profile the reader can open and judge. */}
                {recommenders.length > 0 && (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] leading-6 text-mute">
                    <span>{t.whoRecommended}</span>
                    {recommenders.map((r) => (
                      <Link
                        key={r.handle}
                        href={`/${r.handle}`}
                        title={r.name}
                        className="font-mono transition-colors hover:text-ink"
                      >
                        {r.handle}
                      </Link>
                    ))}
                  </p>
                )}

                {/* Premium, and only for a visitor: the owner has no reason to
                    send themselves a contact, and seeing the form on their own
                    page would read as something they are meant to fill in. */}
                {profile.plan === "premium" && (
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
            )}

            <dl className="mt-5 flex items-center gap-5 text-[16px] leading-6 text-mute">
              <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <dt className="sr-only">{t.views}</dt>
                <dd>
                  <span className="font-medium text-ink tabular-nums">
                    {profile.viewCount}
                  </span>{" "}
                  {t.views.toLowerCase()}
                </dd>
              </div>
              {lastSeen && (
                <>
                  <span className="size-1 rounded-full bg-mute/50" aria-hidden />
                  <div className="flex items-center gap-2">
                    <Clock className="size-4" />
                    <dt className="sr-only">{t.lastSeen}</dt>
                    <dd>{lastSeen}</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Folder tabs, cut from the sheet below them. The active one has no
              bottom edge — it joins the paper it belongs to — and the inactive
              one sits recessed behind. */}
          <div className="mx-3 mt-4">
            <div className="flex gap-1.5 px-1">
              <Link
                href={`/${normalized}`}
                className={
                  tab === "vizitka"
                    ? "relative z-10 flex h-14 flex-1 items-center justify-center rounded-t-xl bg-sheet text-[16px] font-semibold text-ink shadow-tab"
                    : "flex h-14 flex-1 items-center justify-center rounded-t-xl bg-ink/[0.045] text-[16px] font-medium text-mute active:bg-ink/10"
                }
              >
                {t.card}
              </Link>
              <Link
                href={`/${normalized}?bolim=postlar`}
                className={
                  tab === "postlar"
                    ? "relative z-10 flex h-14 flex-1 items-center justify-center gap-2 rounded-t-xl bg-sheet text-[16px] font-semibold text-ink shadow-tab"
                    : "flex h-14 flex-1 items-center justify-center gap-2 rounded-t-xl bg-ink/[0.045] text-[16px] font-medium text-mute active:bg-ink/10"
                }
              >
                {t.posts}
                {profile.postCount > 0 && (
                  <span className="tabular-nums text-mute">{profile.postCount}</span>
                )}
              </Link>
            </div>

            <div className="relative z-10 rounded-2xl bg-sheet px-5 pt-2 pb-6 shadow-sheet">
              {tab === "vizitka" && (
                <div className="flex flex-col gap-8">
                  <section>
                    <h2 className="rule pb-3 text-[16px] font-semibold tracking-[0.1em] uppercase">
                      {t.contacts}
                    </h2>
                    <ul className="flex flex-col">
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
                        <ActionRow
                          label={t.address}
                          icon="Veb-sayt"
                          value={profile.city}
                          href={`/rezidentlar?q=${encodeURIComponent(profile.city)}`}
                        />
                      )}
                      {/* Stored in full, shown by plan: an owner who fills in
                          eight and lets premium lapse keeps all eight in the
                          form and gets them back on renewal. */}
                      {/* Labelled with the company's name rather than
                          "Veb-sayt", which the member may also have: two rows
                          reading the same word and pointing at different
                          places is worse than either one alone. */}
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
                            // destination is resolved from this index
                            // server-side, not from the URL.
                            href={`/${normalized}/go?to=${index}`}
                            external
                          />
                        ))}
                    </ul>
                  </section>

                  {profile.services.length > 0 && (
                    <section>
                      <h2 className="rule pb-3 text-[16px] font-semibold tracking-[0.1em] uppercase">
                        {t.services}
                      </h2>
                      {/* A printed tariff sheet. The leader dots are not a
                          flourish — they are what carries the eye from a long
                          service name across to its price without a rule
                          under every row. */}
                      <ul className="flex flex-col">
                        {profile.services
                          .slice(0, serviceLimit(profile.plan))
                          .map((service) => (
                            <li
                              key={service.name}
                              className="rule flex min-h-14 items-baseline gap-3 py-3 last:bg-none"
                            >
                              <span className="text-[16px] leading-6 text-pretty">
                                {service.name}
                              </span>
                              <span
                                aria-hidden
                                className="mb-1.5 min-w-6 flex-1 self-end border-b-2 border-dotted border-ink/35"
                              />
                              {service.price && (
                                <span className="shrink-0 text-[16px] leading-6 font-semibold tabular-nums whitespace-nowrap">
                                  {service.price}
                                </span>
                              )}
                            </li>
                          ))}
                      </ul>
                    </section>
                  )}

                  {profile.commentsOpen && (
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
                </div>
              )}

              {tab === "postlar" && (
                <div className="pt-3">
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

              {isOwner && (
                <Link
                  href={`/kabinet/${normalized}`}
                  className={`${paperButton} mt-6 w-full`}
                >
                  Tahrirlash
                </Link>
              )}
            </div>
          </div>

          {/* Stamped at the foot of the document, the way a form carries its
              own reference number. */}
          <div className="mt-6 flex items-center justify-center gap-3 text-[16px] text-mute">
            <span>FLEX</span>
            <span className="font-mono font-medium tracking-[0.12em] text-ink tabular-nums">
              {normalized}
            </span>
            <span aria-hidden>·</span>
            <LangSwitch lang={lang} next={backTo} />
          </div>

          {/* The cheapest customer we will ever get.
              Most people meet Flex by tapping a stranger's card, and this page
              used to answer the question they arrive with — "is my own number
              free?" — by showing them this person's handle and its price,
              beside a handle that is plainly taken. It read as a price tag on
              somebody else's name.

              So it says what the thing is first, and only then offers the
              search.

              Not on premium: "the Flex mark is removed from the page" is a
              paid promise, and removing a small label while adding a larger
              block would be keeping the letter of it and breaking the rest. */}
          {profile.plan === "free" && (
            <div className="mx-3 mt-5 rounded-2xl bg-sheet px-5 py-5 shadow-sheet">
              <p className="text-[16px] font-semibold">{t.ownItTitle}</p>
              <p className="mt-2 text-[16px] leading-relaxed text-mute">
                {t.ownItLead}
              </p>
              <p className="mt-4 mb-2 text-[16px] font-semibold tracking-[0.1em] uppercase">
                {t.ownItCta}
              </p>
              <ProfileHandleSearch />
            </div>
          )}
        </main>

        {/* The one lime on this screen, and it stays on it: a stranger who
            scrolled to the services should not have to scroll back up to save
            the contact they came for. */}
        {!isOwner && (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper/90 to-transparent px-3 pt-8 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-[460px]">
              <SaveContactButton
                fullName={profile.name}
                handle={normalized}
                bio={profile.bio}
                phone={profile.phone}
                email={profile.contactEmail}
                position={profile.position}
                company={profile.company}
                label={t.saveContact}
                savedLabel={t.contactSaved}
              />
            </div>
          </div>
        )}
      </div>
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
      <div className="relative overflow-hidden rounded-[1.75rem] bg-flex-black p-8 text-white shadow-[0_35px_70px_-25px_rgba(14,10,27,0.55)]">
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
          className="mt-6 block rounded-full bg-lime px-6 py-3 text-center font-medium text-flex-black transition-transform hover:scale-[1.01]"
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
