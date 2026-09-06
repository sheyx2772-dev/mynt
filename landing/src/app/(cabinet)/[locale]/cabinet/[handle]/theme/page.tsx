import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import DesignRequests from "@/components/cabinet/DesignRequests";
import SubScreen from "@/components/cabinet/SubScreen";
import ThemePicker from "@/components/cabinet/ThemePicker";
import { designRequests } from "@/lib/cabinet/design";
import { openScreen } from "@/lib/cabinet/screen";
import { themeEntry } from "@/lib/cabinet/themes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("theme.title") };
}

// The look the profile opens in, and the one drawn to order.
//
// `handles.dizayn` names the catalogue entry — one value, the same one the
// card was engraved in. The picker is a catalogue with a filter rather than a
// row of three swatches, because thirty is the plan and a row of thirty is a
// scroll nobody finishes.
//
// Under it, the custom design: the artwork the studio drew for this number
// if there is one, the wishes sent so far, and a box for the next. That is
// the shape "a design of my own" takes today — see `lib/cabinet/design.ts`
// for why it is a queue and not a colour picker.
export default async function ThemePage({
  params,
}: PageProps<"/[locale]/cabinet/[handle]/theme">) {
  const handle = await openScreen(params);
  const [t, requests] = await Promise.all([
    getTranslations("cabinet.sections"),
    designRequests(handle.raqam),
  ]);

  return (
    <SubScreen
      raqam={handle.raqam}
      screen="theme"
      title={t("theme.title")}
      hint={t("theme.hint")}
    >
      {/* Room at the bottom for the picker's pinned save button. */}
      <div className="flex flex-col gap-10 pb-24">
        <ThemePicker
          raqam={handle.raqam}
          current={themeEntry(handle.dizayn).id}
          profile={handle}
        />
        <DesignRequests
          raqam={handle.raqam}
          artwork={handle.maxsus_dizayn}
          requests={requests}
        />
      </div>
    </SubScreen>
  );
}
