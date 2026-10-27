// Dot marks: small pictures drawn on a grid of round dots, like the dot type.
// A mark is a list of rows: "#" a dot, "o" a faint dot, anything else empty. Colour follows
// currentColor, so the caller decides colour and opacity.

import { f1 } from "./util";

export type DotRows = readonly string[];

function dots(rows: DotRows): { w: number; h: number; s: string } {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  let s = "";
  rows.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c === "#") s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".4"/>`;
      else if (c === "o") s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".4" opacity=".35"/>`;
    }),
  );
  return { w, h, s };
}

/** A mark for HTML, `px` tall. */
export function dotMark(rows: DotRows, px: number, cls = ""): string {
  const { w, h, s } = dots(rows);
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" style="height:${px}px;width:${f1((px * w) / h)}px" fill="currentColor" aria-hidden="true">${s}</svg>`;
}

/** A mark inside an SVG, centred on (cx, cy), `h` tall. */
export function dotMarkSvg(rows: DotRows, cx: number, cy: number, h: number, cls = ""): string {
  const { w, h: n, s } = dots(rows);
  const p = h / n;
  return `<g class="${cls}" transform="translate(${f1(cx - (w * p) / 2)} ${f1(cy - h / 2)}) scale(${p.toFixed(4)})">${s}</g>`;
}

/** A finer dot texture from a test on a w x h grid, for large quiet backgrounds. */
export function dotField(w: number, h: number, on: (x: number, y: number) => boolean, px: number, cls = "", r = 0.36): string {
  let s = "";
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="${r}"/>`;
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" style="height:${px}px;width:${f1((px * w) / h)}px" fill="currentColor" aria-hidden="true">${s}</svg>`;
}

/** A small set of generic glyphs (7 to 9 dots tall). */
export const GLYPHS = {
  home: ["...#...", "..###..", ".#####.", "#######", ".#...#.", ".#.#.#.", ".#.#.#."],
  orbit: ["..#####..", ".#.....#.", "#..###..#", "#.#...#.#", "#.#.#.#.#", "#.#...#.#", "#..###..#", ".#.....#.", "..#####.."],
  out: ["...####", ".....##", "....#.#", "...#..#", "..#....", ".#.....", "#......"],
  entries: ["....#..", "#######", "....#..", ".......", "....#..", "#######", "....#.."],
  router: ["#.....#", "#.....#", "#.....#", "#######", "#.....#", "#.#.#.#", "#######"],
  bars: ["......#", "......#", "....#.#", "..#.#.#", "..#.#.#", "#.#.#.#", "#.#.#.#"],
  card: ["#######", "#.....#", "#.###.#", "#.....#", "#.##..#", "#.....#", "#######"],
  grid: ["###.###", "###.###", "###.###", ".......", "###.###", "###.###", "###.###"],
  parts: [".#..###", "###.###", ".#..###", ".......", "#######", "#######"],
  halo: ["..ooo..", ".o###o.", "o#...#o", "o#...#o", "o#...#o", ".o###o.", "..ooo.."],
} satisfies Record<string, DotRows>;

export type Glyph = keyof typeof GLYPHS;
