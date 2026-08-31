// Every established NFC-card site shows the profile inside a device rather
// than floating on the page — it reads as a product someone is holding
// instead of a rectangle someone drew. Frame only; the screen is a slot.
export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[290px]">
      <div className="absolute -inset-8 -z-10 rounded-[4rem] bg-lime/20 blur-[70px]" />

      <div className="rounded-[2.6rem] bg-flex-black p-[10px] shadow-[0_45px_90px_-30px_rgba(14,10,27,0.6)] ring-1 ring-white/10">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-white">
          {/* The notch, drawn rather than imaged. */}
          <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-flex-black" />
          <div className="max-h-[560px] overflow-hidden px-4 pt-10 pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
