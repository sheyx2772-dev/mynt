import { getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";

import ProfileRow from "./ProfileRow";
import { mailHref, telHref } from "@/lib/profile/links";

// The two rows a business card exists for.
//
// Above the links rather than among them: everything else on a profile is
// somewhere to look at somebody, and these two are the only ways to reach them.
// A number that will not parse into something a dialer accepts is left out —
// a row that opens an empty dialer is worse than a row that was never there.

export default async function ProfileContacts({
  telefon,
  email,
}: {
  telefon?: string;
  email?: string;
}) {
  const t = await getTranslations("profile");

  const tel = telefon ? telHref(telefon) : null;
  const mail = email ? mailHref(email) : null;
  if (!tel && !mail) return null;

  return (
    <div className="flex flex-col gap-2">
      {tel && telefon && (
        <ProfileRow
          href={tel}
          icon={<Phone aria-hidden strokeWidth={1.75} />}
          label={t("call")}
          value={telefon}
        />
      )}
      {mail && email && (
        <ProfileRow
          href={mail}
          icon={<Mail aria-hidden strokeWidth={1.75} />}
          label={t("write")}
          value={email}
        />
      )}
    </div>
  );
}
