import type { Audience } from "@/lib/visibility";

// Who may see one field. Sits on the label's row, so the choice reads as a
// property of that line rather than as a setting somewhere else.
//
// A native select rather than a segmented control: eleven of these on one
// form, and a phone shows a select as a sheet with the three words in full.
export default function AudienceSelect({
  field,
  value,
}: {
  field: string;
  value: Audience;
}) {
  return (
    <select
      name={`vis_${field}`}
      defaultValue={value}
      aria-label="Kim ko'radi"
      className="rounded-full border border-ink-line bg-ink-s2 px-2 py-0.5 text-[11px] text-paper-2 outline-none focus:border-paper-3"
    >
      <option value="ochiq">Hammaga</option>
      <option value="obuna">Obunachilarga</option>
      <option value="yopiq">Faqat menga</option>
    </select>
  );
}
