import { getTranslations } from "next-intl/server";

import ProfileSection from "./ProfileSection";
import type { Service } from "@/lib/backend/profile";

// A tariff sheet, set the way a printed one is.
//
// The leader dots are not decoration: they carry the eye from a long service
// name across to its price without a rule under every row, which is what keeps
// twelve services from reading as a table. The price is whatever the owner
// typed — "300 000 so'm", "kelishilgan holda" — so it is set as text and never
// parsed into a number we would then have to format for three languages.

export default async function ProfileServices({
  services,
}: {
  services: Service[];
}) {
  const t = await getTranslations("profile");
  if (services.length === 0) return null;

  return (
    <ProfileSection title={t("services")}>
      <ul className="flex flex-col">
        {services.map((service) => (
          <li
            key={service.name}
            className="flex min-h-12 items-baseline gap-2.5 border-b border-[var(--p-line)] py-2.5 last:border-b-0"
          >
            <span className="text-[15px] leading-5 text-pretty text-[var(--p-text)]">
              {service.name}
            </span>
            <span
              aria-hidden
              className="mb-1 min-w-5 flex-1 self-end border-b border-dotted border-[var(--p-line)]"
            />
            {service.price && (
              <span className="shrink-0 font-mono text-[15px] leading-5 font-semibold tabular-nums whitespace-nowrap text-[var(--p-text)]">
                {service.price}
              </span>
            )}
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
