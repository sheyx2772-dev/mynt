import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ProfileForm from "@/components/cabinet/ProfileForm";
import SubScreen from "@/components/cabinet/SubScreen";
import { toProfileInput } from "@/lib/cabinet/profile";
import { openScreen } from "@/lib/cabinet/screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("profile.title") };
}

// Everything a stranger reads, in one form.
//
// One screen rather than one per field, because the fields are written
// together — a person filling in a new card does name, role, city and links
// in one sitting. It is long, so the save button is pinned to the bottom of
// the phone and the sections are labelled the way the public page labels
// them, so the owner can see where each line will land.
export default async function ProfilePage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]/profile">) {
  const handle = await openScreen(params);
  const t = await getTranslations("cabinet.sections");

  return (
    <SubScreen
      raqam={handle.raqam}
      title={t("profile.title")}
      hint={t("profile.hint")}
    >
      <ProfileForm
        raqam={handle.raqam}
        defaults={toProfileInput(handle)}
        serviceLimit={handle.tarif === "premium" ? 8 : 5}
      />
    </SubScreen>
  );
}
