import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

// A label over a control, with the room a thumb needs.
//
// The gap between one field and the next is decided here, once. Sixty fields
// across the cabinet each choosing their own is how a form ends up looking
// hand-assembled.
export default function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-xs leading-4 text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** A section of a form, titled the way the public page titles the same block. */
export function Group({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 sm:p-5">
      <legend className="cap px-1 text-muted-foreground">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * A thumb-sized control. shadcn's inputs are 32px, a desktop size; this form
 * is filled in on a phone, where 44px is the smallest target a thumb lands on
 * reliably. `rounded-input` is the ladder's rung for an input.
 */
export const inputClass = "h-11 rounded-input px-3 text-base";
