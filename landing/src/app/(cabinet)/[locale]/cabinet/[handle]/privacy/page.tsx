import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import PrivacySwitch from "@/components/cabinet/PrivacySwitch";
import RequestList from "@/components/cabinet/RequestList";
import SubScreen from "@/components/cabinet/SubScreen";
import { pendingRequests } from "@/lib/cabinet/requests";
import { openScreen } from "@/lib/cabinet/screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("privacy.title") };
}

// Who may see the profile, and who is asking to.
//
// The switch and the inbox are one screen because they are one subject: a
// request only exists because the door is closed, and an owner deciding
// whether to close it wants to know what that will mean for the people
// already outside. The preview beside the switch is what says it — drawn from
// this profile's own fields, so the owner sees their own bio go behind the
// lock rather than reading a paragraph about bios in general.
export default async function PrivacyPage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]/privacy">) {
  const handle = await openScreen(params);
  const t = await getTranslations("cabinet.sections");
  const inbox = await pendingRequests(handle.raqam);

  return (
    <SubScreen
      raqam={handle.raqam}
      title={t("privacy.title")}
      hint={t("privacy.hint")}
    >
      <PrivacySwitch
        raqam={handle.raqam}
        closed={handle.yopiq}
        commentsOpen={handle.izohlar_ochiq}
        profile={{
          name: handle.ism,
          avatar: handle.rasm,
          role: [handle.lavozim, handle.kompaniya].filter(Boolean).join(" · "),
          hasBio: Boolean(handle.bio),
          links: handle.havolalar?.length ?? 0,
          services: handle.xizmatlar?.length ?? 0,
        }}
      />
      <div className="mt-8">
        <RequestList
          raqam={handle.raqam}
          initial={inbox.list}
          closed={handle.yopiq}
        />
      </div>
    </SubScreen>
  );
}
