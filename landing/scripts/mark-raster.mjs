// The Flex mark, drawn into pixels.
//
// The geometry is the same numbers as src/components/Mark.tsx, which draws it
// as SVG for the page. They are stated in both because a build script must not
// import from the application — this runs under plain node, with no bundler,
// no TypeScript and no `@/` — and a comment in each points at the other: if one
// moves, the other has to.
//
// A rasteriser rather than an image library: the mark is a disc and two arcs,
// which is thirty lines of arithmetic, and the alternative is a dependency in
// the tree for five files that change approximately never.

/** Mirrors MARK in src/components/Mark.tsx. Fractions of a 100-unit box. */
const MARK = {
  originX: 27,
  originY: 50,
  dotRadius: 10,
  arcRadii: [26, 45],
  arcStroke: 11,
  arcHalfSweep: 0.88,
};

const INK = [0x0e, 0x0a, 0x1b];
const LIME = [0xab, 0xff, 0x09];

// Edges are drawn at 4x and averaged down, which is cheaper to write than a
// coverage-based rasteriser and indistinguishable at these sizes.
const SS = 4;

function insideRoundedRect(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// A segment of a ring with round caps: within the stroke of the radius and
// inside the sweep, or within the stroke of either end point.
function nearArc(px, py, cx, cy, radius, halfSweep, halfWidth) {
  const dx = px - cx;
  const dy = py - cy;

  if (Math.abs(Math.hypot(dx, dy) - radius) <= halfWidth) {
    const angle = Math.atan2(dy, dx);
    if (angle >= -halfSweep && angle <= halfSweep) return true;
  }

  for (const a of [-halfSweep, halfSweep]) {
    const ex = px - (cx + Math.cos(a) * radius);
    const ey = py - (cy + Math.sin(a) * radius);
    if (ex * ex + ey * ey <= halfWidth * halfWidth) return true;
  }

  return false;
}

/** True where the mark's lime falls, in a box of `S` samples at `scale`. */
function insideMark(px, py, S, scale) {
  const offset = (S - S * scale) / 2;
  const x = (px - offset) / scale;
  const y = (py - offset) / scale;
  const s = S / 100;

  if (
    insideCircle(x, y, MARK.originX * s, MARK.originY * s, MARK.dotRadius * s)
  )
    return true;

  return MARK.arcRadii.some((r) =>
    nearArc(
      x,
      y,
      MARK.originX * s,
      MARK.originY * s,
      r * s,
      MARK.arcHalfSweep,
      (MARK.arcStroke * s) / 2,
    ),
  );
}

/**
 * RGBA pixels for one square icon.
 *
 * `mark` scales the glyph inside the tile; `cornerRadius` is a fraction of the
 * edge. `bare` leaves the ground transparent — the mark alone, which is what a
 * launcher's foreground layer is.
 */
export function render(size, { mark, cornerRadius, bare = false }) {
  const S = size * SS;
  const radius = cornerRadius * S;
  const pixels = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x * SS + sx + 0.5;
          const py = y * SS + sy + 0.5;

          if (insideMark(px, py, S, mark)) {
            r += LIME[0];
            g += LIME[1];
            b += LIME[2];
            a += 255;
          } else if (!bare && insideRoundedRect(px, py, S, radius)) {
            r += INK[0];
            g += INK[1];
            b += INK[2];
            a += 255;
          }
        }
      }

      const i = (y * size + x) * 4;
      // Divided by the samples that were covered rather than by all of them:
      // averaging in the transparent ones darkens every edge against a light
      // page, which is how a lime mark ends up with a grey fringe.
      const covered = a / 255;
      pixels[i] = covered ? Math.round(r / covered) : 0;
      pixels[i + 1] = covered ? Math.round(g / covered) : 0;
      pixels[i + 2] = covered ? Math.round(b / covered) : 0;
      pixels[i + 3] = Math.round(a / (SS * SS));
    }
  }

  return pixels;
}
