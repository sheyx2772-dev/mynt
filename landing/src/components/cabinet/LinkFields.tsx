"use client";

import { useTranslations } from "next-intl";

import Field, { inputClass } from "./Field";
import { Input } from "@/components/ui/input";
import { LINK_FIELDS, type LinkInput } from "@/lib/cabinet/links";

// Nine named fields, not a list.
//
// The backend builds each link from a username or a checked address and
// drops what it cannot build (see `lib/cabinet/links.ts`). A free-form list
// with "add a link" would offer what the server refuses; nine fields with
// their base written beside them offer exactly what it keeps. The hint under
// each says what to type — a name, not an address — because the most common
// mistake on the old form was pasting a whole URL into the Instagram field.
export default function LinkFields({ defaults }: { defaults: LinkInput }) {
  const t = useTranslations("cabinet.profile.link");

  return (
    <>
      {LINK_FIELDS.map(({ field, base }) => (
        <Field
          key={field}
          id={field}
          label={t(`${field}.label`)}
          hint={t(`${field}.hint`)}
        >
          <div className="flex items-center">
            {base && (
              <span className="hidden h-11 shrink-0 items-center rounded-l-input border border-r-0 border-input bg-muted px-3 font-mono text-xs text-muted-foreground sm:flex">
                {base.replace(/^https:\/\//, "")}
              </span>
            )}
            <Input
              id={field}
              name={field}
              type={base ? "text" : "url"}
              inputMode={field === "whatsapp" ? "tel" : base ? "text" : "url"}
              autoCapitalize="none"
              maxLength={500}
              defaultValue={defaults[field] ?? ""}
              className={`${inputClass} ${base ? "sm:rounded-l-none" : ""}`}
            />
          </div>
        </Field>
      ))}
    </>
  );
}
