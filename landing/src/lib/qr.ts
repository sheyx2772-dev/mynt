import "server-only";
import { create } from "qrcode";

// A QR code, drawn here rather than fetched from somebody.
//
// Every public QR generator works by URL: the image is requested by the
// reader's browser, so the third party is handed our visitor's address, their
// user agent, and the thing being encoded — which is a page on our own site.
// It also puts a section of the home page behind an availability we do not
// own: the day that host is slow, blocked in Uzbekistan, or gone, the code is
// a broken image and the section stops making its point.
//
// `server-only` because the encoder is the whole reason this is cheap: it
// runs once when the page is rendered, not in every visitor's browser, and
// the markup that arrives is the finished picture.

/**
 * The dark modules of a code, as one SVG path in a `size`-unit square.
 *
 * A path rather than a rect per module: the same code is roughly 700 elements
 * as rects and one attribute as a path, and adjacent modules in a row are
 * merged into a single run so a hairline cannot appear between them when a
 * browser rounds the geometry.
 */
export function qrPath(
  text: string,
  // Four modules is what the spec asks for around a code, and the reason is
  // physical: a scanner finds the symbol by its silence. Two, plus the white
  // padding of the card it sits in, is what a screen actually needs.
  quiet = 2,
): { d: string; size: number } {
  const { modules } = create(text, { errorCorrectionLevel: "M" });
  const { size, data } = modules;

  const runs: string[] = [];
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < size && data[y * size + x + run]) run++;
      runs.push(`M${x + quiet} ${y + quiet}h${run}v1h-${run}z`);
      x += run;
    }
  }

  return { d: runs.join(""), size: size + quiet * 2 };
}
