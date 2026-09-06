"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendEnquiry, type EnquiryState } from "./actions";
import { DIRECTIONS } from "./venues";

const FIELD =
  "h-12 w-full rounded-input border border-line-2 bg-white px-3.5 text-[15px] text-ink transition-colors placeholder:text-line-lead focus:border-ink focus:ring-2 focus:ring-ring focus:outline-none";
const LABEL = "cap mb-1.5 block text-ink-3";

/**
 * The enquiry, and the phone number underneath it.
 *
 * The number is not a fallback that appears when something breaks — it is
 * printed the whole time. Somebody who runs a restaurant at nine in the
 * evening would rather call than fill in six fields, and the form should not
 * be the only door.
 */
export default function EnquiryForm({
  phone,
  phoneHref,
}: {
  phone: string;
  phoneHref: string;
}) {
  const t = useTranslations("business");
  const [state, action, sending] = useActionState<EnquiryState, FormData>(
    sendEnquiry,
    {},
  );

  if (state.sent) {
    return (
      <div className="rounded-tile border border-lime-ink/40 bg-lime/[0.08] p-6 sm:p-8">
        <h3 className="text-xl font-semibold">{t("sentTitle")}</h3>
        <p className="mt-2 leading-relaxed text-ink-2">
          {t("sentBody")}{" "}
          <a href={phoneHref} className="font-medium text-ink underline">
            {phone}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-tile border border-line bg-white p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="direction" className={LABEL}>
            {t("fieldVertical")}
          </label>
          {/* Ours rather than the browser's. A native `<select>` opens the
              operating system's list, which arrives in the system font, at the
              system size, in the system's blue — beside a form built out of
              this product's own type and radii it reads as a piece of a
              different application. Radix keeps a hidden native input in sync
              behind it, so the form still posts `direction` and still works
              from the keyboard.

              The server does not trust any of it either way: `actions.ts`
              matches the posted value against our own list rather than passing
              it through, because a select is markup and markup is a suggestion
              to whoever is sending the request. */}
          <Select name="direction" defaultValue="cafes">
            <SelectTrigger
              id="direction"
              className="h-12! w-full rounded-input border-line-2 bg-white px-3.5 text-[15px] text-ink data-[placeholder]:text-line-lead"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-input">
              {DIRECTIONS.map((id) => (
                <SelectItem key={id} value={id} className="text-[15px]">
                  {t(`vertical${id[0].toUpperCase()}${id.slice(1)}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="points" className={LABEL}>
            {t("fieldPoints")}
          </label>
          <input
            id="points"
            name="points"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            placeholder={t("fieldPointsPlaceholder")}
            className={FIELD}
          />
          <p className="mt-1.5 text-[13px] text-ink-3">
            {t("fieldPointsHint")}
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company" className={LABEL}>
            {t("fieldCompany")}
          </label>
          <input
            id="company"
            name="company"
            required
            maxLength={120}
            autoComplete="organization"
            placeholder={t("fieldCompanyPlaceholder")}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="name" className={LABEL}>
            {t("fieldName")}
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            autoComplete="name"
            placeholder={t("fieldNamePlaceholder")}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="phone" className={LABEL}>
            {t("fieldPhone")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            maxLength={32}
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            className={FIELD}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="note" className={LABEL}>
            {t("fieldNote")}
          </label>
          <textarea
            id="note"
            name="note"
            rows={3}
            maxLength={1000}
            placeholder={t("fieldNoteHint")}
            className={`${FIELD} h-auto py-3`}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {t(`error${state.error[0].toUpperCase()}${state.error.slice(1)}`)}{" "}
          {state.error === "save" && (
            <a href={phoneHref} className="font-medium underline">
              {phone}
            </a>
          )}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={sending}
          className="flex h-12 items-center rounded-input bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-s2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
        >
          {sending ? t("sending") : t("submit")}
        </button>

        <p className="text-sm text-ink-3">
          {t("callInstead")}{" "}
          <a
            href={phoneHref}
            className="font-mono text-[13px] tracking-[0.08em] text-ink transition-colors hover:text-ink-2"
          >
            {phone}
          </a>
        </p>
      </div>
    </form>
  );
}
