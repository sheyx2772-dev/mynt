import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import { SubScreen } from "@/components/HandleHub";
import EditProfileForm from "@/components/EditProfileForm";
import { requireOwnHandle } from "@/lib/kabinet";
import { linkFieldValue } from "@/lib/profile-form";

export const metadata: Metadata = { title: "Tahrirlash — flex.com.uz", robots: { index: false } };

export default async function EditProfilePage({
  params,
}: PageProps<"/kabinet/[handle]/tahrirlash">) {
  const { handle } = await params;
  const { normalized, owned } = await requireOwnHandle(handle, "/kabinet/[handle]/tahrirlash");

  return (
    <PageShell surface="ink">
      <SubScreen
        handle={normalized}
        title="Profil"
        hint="O'zgarishlar darhol ko'rinadi."
      >
        <EditProfileForm
          handle={normalized}
          defaults={{
            name: owned.name,
            bio: owned.bio,
            booking: linkFieldValue(owned.links, "Uchrashuv"),
            telegram: linkFieldValue(owned.links, "Telegram"),
            whatsapp: linkFieldValue(owned.links, "WhatsApp"),
            instagram: linkFieldValue(owned.links, "Instagram"),
            linkedin: linkFieldValue(owned.links, "LinkedIn"),
            facebook: linkFieldValue(owned.links, "Facebook"),
            youtube: linkFieldValue(owned.links, "YouTube"),
            website: linkFieldValue(owned.links, "Veb-sayt"),
            city: owned.city ?? "",
            contactEmail: owned.contactEmail ?? "",
            phone: owned.phone ?? "",
            position: owned.position ?? "",
            company: owned.company ?? "",
            services: owned.services,
            plan: owned.plan,
            bannerUrl: owned.bannerUrl,
            teamName: owned.teamName,
            commentsOpen: owned.commentsOpen,
            tags: owned.tags.join(", "),
            cardDesign: owned.cardDesign,
            customDesignUrl: owned.customDesignUrl,
            deviceType: owned.deviceType,
          }}
        />
      </SubScreen>
    </PageShell>
  );
}
