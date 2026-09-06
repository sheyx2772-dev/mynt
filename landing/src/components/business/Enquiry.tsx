import { getTranslations } from "next-intl/server";

import EnquiryForm from "./EnquiryForm";

// The phone number, written here as well as in the footer.
//
// Two copies of a fact is normally a bug, and this one is deliberate: the
// footer's copy is a legal disclosure sitting beside a tax number, and this
// one is the alternative to filling in a form. They are the same digits doing
// two different jobs, and the day the number changes both have to be found —
// `SiteFooter.tsx` holds the other.
const PHONE = "+998 97 724 79 99";

export default async function Enquiry() {
  const t = await getTranslations("business");

  return (
    <section id="enquiry" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <p className="cap text-ink-3">{t("formEyebrow")}</p>
        <h2 className="mt-2 text-[28px] leading-8 font-semibold tracking-tight">
          {t("formTitle")}
        </h2>
        <p className="mt-3 leading-relaxed text-ink-2">{t("formLead")}</p>

        <div className="mt-8">
          <EnquiryForm
            phone={PHONE}
            phoneHref={`tel:${PHONE.replace(/\s/g, "")}`}
          />
        </div>
      </div>
    </section>
  );
}
