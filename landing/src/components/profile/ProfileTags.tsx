import { getTranslations } from "next-intl/server";

import ProfileSection from "./ProfileSection";

// What this person does, in their own words, one word at a time.
//
// Chips rather than a sentence, because a tag is a word somebody chose from a
// list and a sentence made of them reads like a keyword stuffing.

export default async function ProfileTags({ tags }: { tags: string[] }) {
  const t = await getTranslations("profile");
  if (tags.length === 0) return null;

  return (
    <ProfileSection title={t("tags")}>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag}
            className="rounded-plate bg-[var(--p-surface)] px-3 py-1.5 text-[13px] leading-4 text-[var(--p-text-2)]"
          >
            {tag}
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
