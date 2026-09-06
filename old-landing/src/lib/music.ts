// A song on a profile, and how to draw it.
//
// The backend keeps the link only when it points at a music service; this
// decides which of those the page can embed a player for, and which are
// shown as a link to press. Pure, so the address parsing is unit tested.

export type Music = { title: string; artist: string | null; url: string };

export type MusicEmbed =
  | { kind: "spotify"; src: string }
  | { kind: "youtube"; src: string }
  | { kind: "link" };

export function musicEmbed(url: string): MusicEmbed {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "link" };
  }
  const host = parsed.hostname.toLowerCase();

  // open.spotify.com/track/ID, /album/ID, /playlist/ID — the embed takes the
  // same path under /embed. A locale prefix (/intl-ru/track/ID) is dropped.
  if (host === "open.spotify.com") {
    const m = parsed.pathname.match(/\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (m) return { kind: "spotify", src: `https://open.spotify.com/embed/${m[1]}/${m[2]}?theme=0` };
    return { kind: "link" };
  }

  // youtu.be/ID, youtube.com/watch?v=ID, music.youtube.com/watch?v=ID.
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    const id = host === "youtu.be" ? parsed.pathname.slice(1).split("/")[0] : parsed.searchParams.get("v");
    if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    return { kind: "link" };
  }

  return { kind: "link" };
}
