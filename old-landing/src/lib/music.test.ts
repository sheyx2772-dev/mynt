import { describe, expect, it } from "vitest";
import { musicEmbed } from "./music";

describe("musicEmbed", () => {
  it("turns a Spotify track into its player", () => {
    expect(musicEmbed("https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toEqual({
      kind: "spotify",
      src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC?theme=0",
    });
    expect(musicEmbed("https://open.spotify.com/intl-ru/album/abc123").kind).toBe("spotify");
  });

  it("knows both YouTube spellings", () => {
    expect(musicEmbed("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    });
    expect(musicEmbed("https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=x").kind).toBe("youtube");
  });

  it("falls back to a link for anything it cannot draw", () => {
    expect(musicEmbed("https://music.yandex.ru/album/1/track/2")).toEqual({ kind: "link" });
    expect(musicEmbed("https://open.spotify.com/user/somebody")).toEqual({ kind: "link" });
    expect(musicEmbed("not a url")).toEqual({ kind: "link" });
  });
});
