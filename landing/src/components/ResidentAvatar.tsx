import Image from "next/image";

/**
 * The face, or the initials standing in for it.
 *
 * One component for the entry-page strip and the directory, because the rule
 * about which of the two you get is a security rule and a security rule kept
 * in two places is a security rule that will be relaxed in one of them.
 *
 * `next.config.ts` names the hosts an avatar may come from, one at a time, and
 * anything else falls back to initials. The tempting one-line fix there is
 * `remotePatterns: [{ hostname: "**" }]`, and it is the thing that must never
 * be done: Next's optimiser fetches the URL FROM THE SERVER, so a wildcard
 * turns this site into an open image proxy pointed at whatever a profile owner
 * typed into their avatar field — including addresses only our own container
 * network can reach, the backend among them.
 *
 * The check here is a second gate rather than the gate. Next refuses a host it
 * was not told about; this refuses a scheme, so a `javascript:` or `data:`
 * avatar never reaches the optimiser to be refused. `//host/path` is tested
 * apart from `/path` because a protocol-relative URL also begins with a slash
 * and is not local at all.
 */
export default function ResidentAvatar({
  name,
  photo,
  size = 44,
}: {
  name: string;
  photo?: string;
  size?: number;
}) {
  const usable =
    photo &&
    ((photo.startsWith("/") && !photo.startsWith("//")) ||
      photo.startsWith("https://"));

  if (usable && photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-lime font-semibold text-ink"
    >
      {initials(name)}
    </span>
  );
}

/** Two letters at most: three is a monogram, and these are not monograms. */
function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}
