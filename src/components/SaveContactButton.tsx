"use client";

type Props = {
  fullName: string;
  handle: string;
  bio?: string;
};

export default function SaveContactButton({ fullName, handle, bio }: Props) {
  function handleSave() {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${fullName}`,
      `NOTE:${bio ?? ""}`,
      `URL:https://flex.com.uz/${handle}`,
      "END:VCARD",
    ].join("\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
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
      className="w-full rounded-full bg-lime px-6 py-3 text-center font-medium text-flex-black transition-transform hover:scale-[1.01]"
    >
      Kontaktni saqlash
    </button>
  );
}
