import Image from "next/image";
import { Nfc } from "lucide-react";

// The hero object, lit like a product shot rather than drawn like a diagram:
// one key light from the upper left, a lime rim on the opposite edge, a contact
// shadow on the floor and a mirrored fade beneath it. When a real photograph is
// present in public/mahsulot it replaces the drawing entirely.
export default function HeroStage({ shot }: { shot: string | null }) {
  if (shot) {
    return (
      <div className="relative w-full max-w-[34rem]">
        <div className="absolute -inset-16 -z-10 rounded-full bg-lime/20 blur-[110px]" />
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_60px_120px_-40px_rgba(0,0,0,0.9)]">
          <Image
            src={shot}
            alt="Flex NFC karta"
            fill
            priority
            sizes="(min-width: 1024px) 34rem, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-[20rem] sm:w-[25rem] lg:w-[27rem]">
      {/* Key light behind the object, not an even wash. */}
      <div className="absolute -top-24 -left-10 -z-10 h-72 w-72 rounded-full bg-lime/25 blur-[100px]" />
      <div className="absolute -right-16 -bottom-10 -z-10 h-64 w-64 rounded-full bg-lime/10 blur-[90px]" />

      {/* Rotation lives on the wrapper so the mirrored copy stays in register
          with the object it reflects. */}
      <div className="rotate-[-4deg]">
        <Face />

        {/* Reflection, cropped short and faded with a mask rather than a flat
            opacity so the falloff behaves like a real surface. */}
        <div aria-hidden className="h-24 overflow-hidden">
          <div className="scale-y-[-1] opacity-[0.18] [mask-image:linear-gradient(to_top,transparent_45%,black_100%)]">
            <Face />
          </div>
        </div>
      </div>

      {/* Contact shadow: the object sits on something. */}
      <div className="pointer-events-none absolute inset-x-[11%] bottom-[5.5rem] -z-10 h-10 rounded-[50%] bg-black blur-2xl" />
    </div>
  );
}

function Face() {
  return (
    <div className="grain relative aspect-[1.586/1] w-full overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[linear-gradient(145deg,#1e1736_0%,#0b0817_48%,#161127_100%)] p-7 text-white shadow-[0_50px_100px_-30px_rgba(0,0,0,0.95)]">
      {/* Specular sweep — a highlight travelling across the surface. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(112deg,transparent_28%,rgba(255,255,255,0.10)_44%,rgba(255,255,255,0.02)_52%,transparent_62%)]" />
      {/* Lime rim on the edge away from the key light. */}
      <div className="pointer-events-none absolute inset-y-8 -right-px w-px bg-gradient-to-b from-transparent via-lime/70 to-transparent" />

      <div className="relative flex items-start justify-between">
        {/* Recessed NFC disc, ringed the way a milled inlay catches light. */}
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#2a2145,#0a0714)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.12),inset_0_-2px_4px_rgba(0,0,0,0.8)]">
          <Nfc className="h-4 w-4 text-lime/80" />
        </span>
        <span className="font-tabular text-[10px] tracking-[0.22em] text-white/30 uppercase">
          flex
        </span>
      </div>

      <div className="relative mt-12 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        MYN<span className="text-lime">042</span>
      </div>
      <p className="relative mt-1 font-tabular text-sm text-white/40">flex.uz/MYN042</p>

      <div className="relative mt-8 flex items-center justify-between text-[11px] font-medium tracking-wide text-white/35 uppercase">
        <span>Tegizing</span>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
      </div>
    </div>
  );
}
