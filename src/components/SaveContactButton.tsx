"use client";

type Props = {
  fullName: string;
  handle: string;
  bio?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  company?: string | null;
};

// vCard treats a comma, a semicolon and a backslash as structure, and a raw
// newline ends the property. A bio written across two lines, or a company
// name with a comma in it, would otherwise produce a file the phone imports
// with the fields cut short.
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export default function SaveContactButton({
  fullName,
  handle,
  bio,
  phone,
  email,
  position,
  company,
}: Props) {
  function handleSave() {
    // Only the fields the owner filled in — an empty TEL line makes a phone
    // show a blank number field on the saved contact.
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${esc(fullName)}`,
      phone ? `TEL;TYPE=CELL:${esc(phone)}` : null,
      email ? `EMAIL;TYPE=INTERNET:${esc(email)}` : null,
      company ? `ORG:${esc(company)}` : null,
      position ? `TITLE:${esc(position)}` : null,
      bio ? `NOTE:${esc(bio)}` : null,
      `URL:https://flex.com.uz/${handle}`,
      "END:VCARD",
    ].filter((line): line is string => line !== null);

    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${handle}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleSave}
      className="w-full rounded-xl bg-white px-6 py-3.5 text-center text-[11px] font-semibold tracking-[0.16em] text-flex-black uppercase transition-colors hover:bg-white/90"
    >
      Kontaktni saqlash
    </button>
  );
}
