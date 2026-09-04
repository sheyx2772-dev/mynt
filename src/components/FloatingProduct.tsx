import Image from "next/image";
import Link from "next/link";

/**
 * A product suspended over the hero, not sitting in a card.
 *
 * The object bobs and its shadow answers: as the thing rises the shadow
 * shrinks and fades, which is the whole of what makes it read as airborne
 * rather than as a picture sliding up and down. The two share one period and
 * are deliberately out of phase with the scale, so neither leads the other.
 *
 * The shadow is drawn rather than photographed. A shadow baked into the file
 * travels with the object and gives the trick away immediately.
 */
export default function FloatingProduct({
  src,
  alt,
  href,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  href: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={alt}
      className="group relative block select-none"
    >
      {/* The light it is lifted into. Without this the object reads as pasted
          onto the dark rather than lit by the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 42%, rgba(171,255,9,0.14), transparent 70%)",
        }}
      />

      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 1024px) 30rem, 80vw"
        className="float-bob relative mx-auto h-auto w-full drop-shadow-[0_28px_40px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-[1.03]"
      />

      <div
        aria-hidden
        className="float-cast mx-auto mt-[-6%] h-[6%] w-[62%] rounded-[50%] bg-black/55 blur-xl"
      />
    </Link>
  );
}
