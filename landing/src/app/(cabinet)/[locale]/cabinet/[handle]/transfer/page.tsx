import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import SubScreen from "@/components/cabinet/SubScreen";
import TransferPanel from "@/components/cabinet/TransferPanel";
import { openScreen } from "@/lib/cabinet/screen";
import { listTransfersForHandle } from "@/lib/cabinet/transfers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cabinet.sections");
  return { title: t("transfer.title") };
}

// Handing a handle to someone else.
//
// Allows transferring ownership of the handle to another person via phone or email.
export default async function TransferPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const handle = await openScreen(params);
  const t = await getTranslations("cabinet.sections.transfer");
  const transfers = await listTransfersForHandle(handle.raqam);

  return (
    <SubScreen
      raqam={handle.raqam}
      title={t("title")}
      hint={t("hint")}
    >
      <TransferPanel
        raqam={handle.raqam}
        initialTransfers={transfers}
        transferTitle={t("sendTitle")}
        transferHint={t("sendHint")}
        recipientLabel={t("recipientLabel")}
        recipientPlaceholder={t("recipientPlaceholder")}
        submitLabel={t("submit")}
        activeTransfersTitle={t("activeTransfers")}
        pendingLabel={t("pending")}
        cancelLabel={t("cancel")}
        cancelSuccessLabel={t("cancelled")}
        createSuccessLabel={t("sent")}
      />
    </SubScreen>
  );
}
