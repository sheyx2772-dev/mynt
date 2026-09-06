import { Music as MusicIcon, Play } from "lucide-react";

import { musicEmbed, type Music } from "@/lib/music";

// The owner's song, on the card.
//
// A player when the service has one we can draw — Spotify and YouTube embed
// without a key — and otherwise the title, the artist and a button to where it
// plays. The title is drawn either way, because an iframe that has not loaded
// yet is a grey rectangle, and a grey rectangle says nothing about why it is
// there.

export default function MusicCard({
  music,
  labels,
}: {
  music: Music;
  labels: { song: string; listen: string };
}) {
  const embed = musicEmbed(music.url);

  return (
    <section className="mt-6" aria-label={labels.song}>
      <div className="flex items-center gap-3">
        <MusicIcon className="size-4 shrink-0 text-mute" strokeWidth={1.8} aria-hidden />
        <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
          {music.title}
          {music.artist && <span className="font-normal text-mute"> — {music.artist}</span>}
        </p>
        <a
          href={music.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-plate bg-slab px-3 text-[11px] font-bold tracking-[0.04em] text-on-slab uppercase"
        >
          <Play className="size-3.5" strokeWidth={2.2} aria-hidden />
          {labels.listen}
        </a>
      </div>

      {embed.kind === "spotify" && (
        <iframe
          title={music.title}
          src={embed.src}
          width="100%"
          height="80"
          loading="lazy"
          allow="encrypted-media; clipboard-write"
          className="mt-3 block rounded-plate border-0"
        />
      )}
      {embed.kind === "youtube" && (
        <iframe
          title={music.title}
          src={embed.src}
          loading="lazy"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
          className="mt-3 block aspect-video w-full rounded-plate border-0"
        />
      )}
    </section>
  );
}
