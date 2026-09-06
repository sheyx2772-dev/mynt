import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import ProfileContacts from "@/components/profile/ProfileContacts";
import ProfileFooter from "@/components/profile/ProfileFooter";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileLinks from "@/components/profile/ProfileLinks";
import ProfileServices from "@/components/profile/ProfileServices";
import ProfileTags from "@/components/profile/ProfileTags";
import { ownerOf, type PublicProfile } from "@/lib/backend/profile";
import { imageSrc } from "@/lib/profile/links";
import { themeFor } from "@/lib/profile/theme";
import { SITE_URL, profileUrl } from "@/lib/site";

/**
 * Three letters and three digits, and nothing else reaches the backend.
 *
 * Checked here as well as in `proxy.ts` because a route parameter is whatever
 * arrived: the proxy is the reason this page is rendered at all, not a promise
 * about what it was rendered with, and a page that trusts its own params is one
 * rewrite away from passing arbitrary text into a backend path.
 *
 * Deliberately not `parseHandle` from `lib/pricing`, which also refuses the
 * combinations we never sell. Those are a sales rule; a profile that exists
 * must open even if its letters were taken off the price list afterwards.
 */
const HANDLE = /^[A-Z]{3}[0-9]{3}$/;

function normalize(raw: string): string | null {
  const handle = raw.toUpperCase();
  return HANDLE.test(handle) ? handle : null;
}

/** The owner, or null for both "nobody holds it" and "we could not ask". */
async function lookUp(raw: string): Promise<PublicProfile | null> {
  const handle = normalize(raw);
  if (!handle) return null;
  return ownerOf(handle);
}

export async function generateMetadata({
  params,
}: PageProps<"/p/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const number = normalize(handle) ?? handle.slice(0, 6).toUpperCase();

  let owner: PublicProfile | null = null;
  try {
    owner = await lookUp(handle);
  } catch {
    // Left null. A profile we could not read is not indexed and not described
    // — inventing either would put a wrong preview in every chat this link is
    // pasted into, and previews are cached far longer than an outage lasts.
  }

  if (!owner) {
    return { title: number, robots: { index: false, follow: true } };
  }

  const role = [owner.lavozim, owner.kompaniya].filter(Boolean).join(", ");
  const description =
    owner.tavsif ||
    [role, owner.shahar].filter(Boolean).join(" · ") ||
    `${owner.ism} — Flex ${owner.raqam}`;
  const title = role ? `${owner.ism} — ${role}` : owner.ism;

  return {
    // Absolute: the site layout's template would make this "… — Flex", and
    // this document is not a page of the site.
    title: { absolute: `${title} | ${owner.raqam}` },
    description,
    // Absolute, and from the one place the site's own origin is written down.
    // A relative `og:url` is a link Telegram cannot follow, and this page's
    // whole job is to be pasted into Telegram.
    metadataBase: new URL(SITE_URL),
    // The engraved address, not the internal one the proxy rewrites to.
    alternates: { canonical: `/${owner.raqam}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: profileUrl(owner.raqam),
      // The face is what a reader is looking for in a chat preview, and it is
      // the one picture on this page that is about the person.
      images: imageSrc(owner.rasm)
        ? [{ url: imageSrc(owner.rasm)!, alt: owner.ism }]
        : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: PageProps<"/p/[handle]">) {
  const { handle } = await params;
  const locale = await getLocale();
  const t = await getTranslations("profile");

  let owner: PublicProfile | null;
  try {
    owner = await lookUp(handle);
  } catch {
    // The backend did not answer. Saying "this number is free" would be the
    // one wrong thing to say — it invites a stranger to buy a number somebody
    // already owns. The reader is told to come back instead, and the reason
    // stays in the log where the detail belongs.
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-2 px-5 text-center">
        <h1 className="text-xl font-semibold">{t("unavailableTitle")}</h1>
        <p className="text-[15px] leading-5 text-[var(--p-text-2)]">
          {t("unavailableBody")}
        </p>
      </main>
    );
  }

  // A shape that is not a number, and a number nobody holds, get the same
  // answer. There are 17.5 million of the second kind, and telling the two
  // apart is not information a guesser is owed.
  if (!owner) notFound();

  const theme = themeFor(owner.dizayn);

  return (
    <main
      data-theme={theme.id}
      style={theme.style}
      className="mx-auto flex w-full max-w-md flex-col gap-8 px-5 pt-10 pb-14"
    >
      <ProfileHeader profile={owner} numberLabel={t("numberLabel")} />

      {owner.tavsif && (
        <p className="-mt-2 text-center text-[15px] leading-6 text-pretty text-[var(--p-text-2)]">
          {owner.tavsif}
        </p>
      )}

      <ProfileContacts telefon={owner.telefon} email={owner.email} />
      <ProfileLinks links={owner.havolalar} />
      <ProfileServices services={owner.xizmatlar} />
      <ProfileTags tags={owner.teglar} />

      <ProfileFooter
        handle={owner.raqam}
        views={owner.korishlar}
        locale={locale}
        showPitch={owner.tarif !== "premium"}
      />
    </main>
  );
}
