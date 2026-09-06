import { getTranslations } from "next-intl/server";

import LinkGlyph from "./LinkGlyph";
import ProfileRow from "./ProfileRow";
import ProfileSection from "./ProfileSection";
import type { Link } from "@/lib/backend/profile";
import { actionHref, linkText } from "@/lib/profile/links";

// Wherever else this person can be found.
//
// A link whose address does not survive `actionHref` is dropped rather than
// drawn without an href: a row that looks pressable and does nothing reads as a
// broken page, and the reason it was refused is not the reader's business.
// The paragraph in `lib/profile/links.ts` says what is being refused and why.

export default async function ProfileLinks({ links }: { links: Link[] }) {
  const t = await getTranslations("profile");

  const safe = links
    .map((link) => ({ link, href: actionHref(link.href) }))
    .filter((row): row is { link: Link; href: string } => row.href !== null);

  if (safe.length === 0) return null;

  return (
    <ProfileSection title={t("links")}>
      <div className="flex flex-col gap-2">
        {safe.map(({ link, href }) => (
          <ProfileRow
            key={href}
            href={href}
            external={href.startsWith("http")}
            icon={<LinkGlyph kind={link.kind} />}
            // The label is the owner's own text and is rendered as text; the
            // value under it is rebuilt from the parsed address, so the two
            // cannot be made to disagree about where the row goes.
            label={link.label}
            value={linkText(href)}
          />
        ))}
      </div>
    </ProfileSection>
  );
}
