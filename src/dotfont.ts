// Round-dot type: 5x7 glyphs drawn as SVG circles (dot diameter = 0.8 pitch).
// Used only for numbers and short English labels; Chinese stays in the system sans.
// Round letters share the flat 0: three-dot top and bottom rows.

import { esc, f1, reducedMotion, unesc } from "./util";

const GLYPH: Record<string, readonly string[]> = {
  "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "##..#", "#.#.#", "#..##", "#..##", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".###.", "#...#", "#....", ".###.", "....#", "#...#", ".###."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "#.#.#", ".#.#."],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  ".": [".", ".", ".", ".", ".", ".", "#"],
  ",": ["..", "..", "..", "..", "..", ".#", "#."],
  ":": [".", "#", ".", ".", ".", "#", "."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "%": ["##..#", "##..#", "...#.", "..#..", ".#...", "#..##", "#..##"],
  "°": [".#.", "#.#", ".#.", "...", "...", "...", "..."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "-": ["....", "....", "....", "####", "....", "....", "...."],
  "<": ["...#", "..#.", ".#..", "#...", ".#..", "..#.", "...#"],
  ">": ["#...", ".#..", "..#.", "...#", "..#.", ".#..", "#..."],
  "↓": ["..#..", "..#..", "..#..", "..#..", "#.#.#", ".###.", "..#.."],
  "↑": ["..#..", ".###.", "#.#.#", "..#..", "..#..", "..#..", "..#.."],
  "!": ["#", "#", "#", "#", "#", ".", "#"],
  " ": ["..", "..", "..", "..", "..", "..", ".."],
};

interface Layout {
  w: number;
  dots: [number, number][];
}

const cache = new Map<string, Layout>();

function layout(str: string): Layout {
  const key = str.toUpperCase().replace(/[—–]/g, "-");
  const hit = cache.get(key);
  if (hit) return hit;
  let x = 0;
  const dots: [number, number][] = [];
  [...key].forEach((ch, i) => {
    const g = GLYPH[ch] ?? GLYPH[" "]!;
    if (i) x += 1; // one empty column between glyphs
    g.forEach((row, y) => [...row].forEach((c, cx) => c === "#" && dots.push([x + cx, y])));
    x += g[0]!.length;
  });
  const out = { w: x, dots };
  cache.set(key, out);
  return out;
}

const circ = ([x, y]: [number, number]): string => `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".4" data-k="${x},${y}"/>`;

/** Dot text for HTML. Its height is 1em: the element's font-size sets the glyph height. */
export function dt(str: string, cls = ""): string {
  const { w, dots } = layout(str);
  return `<span class="dt${cls ? ` ${cls}` : ""}"><svg viewBox="0 0 ${w} 7" style="width:${(w / 7).toFixed(3)}em" aria-hidden="true">${dots.map(circ).join("")}</svg><span class="sr">${esc(str)}</span></span>`;
}

export type Anchor = "start" | "middle" | "end";

/** Dot text inside an SVG; y is the baseline (bottom of the glyphs), h the glyph height. */
export function dtSvg(str: string, x: number, y: number, h: number, anchor: Anchor = "start", cls = ""): string {
  const { w, dots } = layout(str);
  const p = h / 7;
  const width = w * p;
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  return `<g class="${cls}" transform="translate(${f1(x0)} ${f1(y - h)}) scale(${p.toFixed(4)})" role="img" aria-label="${esc(str)}">${dots
    .map(([a, b]) => `<circle cx="${a + 0.5}" cy="${b + 0.5}" r=".4"/>`)
    .join("")}</g>`;
}

export const dtWidth = (str: string, h: number): number => (layout(str).w * h) / 7;

/** Change a dot text in place: shared dots stay, the others fade and scale in a left-to-right wipe. */
function setDt(el: Element, str: string): void {
  const sr = el.querySelector(".sr");
  const svg = el.querySelector("svg");
  if (!sr || !svg || sr.textContent === str) return;
  sr.textContent = str;
  const { w, dots } = layout(str);
  svg.setAttribute("viewBox", `0 0 ${w} 7`);
  svg.style.width = `${(w / 7).toFixed(3)}em`;
  if (reducedMotion()) {
    svg.innerHTML = dots.map(circ).join("");
    return;
  }
  const want = new Set(dots.map((d) => d.join(",")));
  const have = new Map([...svg.querySelectorAll<SVGCircleElement>("circle:not(.out)")].map((c) => [c.dataset.k ?? "", c]));
  have.forEach((c, k) => {
    if (want.has(k)) return;
    c.style.transitionDelay = `${Number(k.split(",")[0]) * 12}ms`;
    c.classList.add("out");
    setTimeout(() => c.remove(), 520);
  });
  const fresh: SVGCircleElement[] = [];
  for (const d of dots) {
    if (have.has(d.join(","))) continue;
    svg.insertAdjacentHTML("beforeend", circ(d));
    const c = svg.lastElementChild as SVGCircleElement;
    c.classList.add("in");
    c.style.transitionDelay = `${80 + d[0] * 12}ms`;
    fresh.push(c);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => fresh.forEach((c) => c.classList.remove("in"))));
}

const DT_RE = /<span class="dt([^"]*)"><svg[\s\S]*?<\/svg><span class="sr">([\s\S]*?)<\/span><\/span>/g;
const shapes = new WeakMap<Element, string>();

/**
 * Update a container from fresh HTML. When only dot-text values differ, the existing dot texts
 * morph in place (the digit animation); any other change replaces the HTML.
 * Returns true when the HTML was replaced, so callers can re-wire listeners.
 */
export function patch(el: Element, html: string, force = false): boolean {
  const shape = html.replace(DT_RE, "<dt$1>");
  if (!force && shapes.get(el) === shape) {
    const vals = [...html.matchAll(DT_RE)].map((m) => unesc(m[2] ?? ""));
    el.querySelectorAll(".dt").forEach((d, i) => {
      const v = vals[i];
      if (v != null) setDt(d, v);
    });
    return false;
  }
  el.innerHTML = html;
  shapes.set(el, shape);
  return true;
}
