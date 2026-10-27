// Board pieces: the 12 x 7 grid of tiles, round widgets and the small dot readouts that sit in
// them. Each helper returns HTML; styles/board.css gives it the look.
//
// Tiles are <section class="t …">: "s" strong (dark), "sl" strong that turns light in dark mode,
// "a" accent, "o" round, "clk" lifts on hover. A tile spans grid cells through grid-area.

import { haloEl } from "./halo";
import { esc } from "./util";

export interface Cell {
  id: string;
  area: string; // grid-area: row-start / col-start / row-end / col-end
  cls: string;
  halo?: boolean; // a backlight halo under the tile (round tiles)
  attrs?: Record<string, string>; // extra attributes, e.g. data-open
}

/** The board: halos first (they paint under the tiles), then one empty section per cell. */
export function boardHtml(cells: Cell[]): string {
  const halos = cells.filter((c) => c.halo).map((c) => haloEl(c.id, c.area)).join("");
  const tiles = cells
    .map((c) => {
      const extra = Object.entries(c.attrs ?? {})
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join("");
      return `<section id="${c.id}" class="${c.cls}" style="grid-area:${c.area}"${extra}></section>`;
    })
    .join("");
  return `<main class="board">${halos}${tiles}</main>`;
}

/** A round widget: a value (usually dot type or a mark), a name, a line of detail. */
export const round = (value: string, name: string, detail: string, detailCls = ""): string =>
  `<div class="circ">${value}<div class="n">${name}</div><div class="d ${detailCls}">${detail}</div></div>`;

/** Ten small dots under a reading; setLoadBars lights them. An empty key keeps the space. */
export const loadBar = (key: string, dots = 10): string =>
  `<span class="lvl${key ? "" : " blank"}"${key ? ` data-lvl="${key}"` : ""}>${"<i></i>".repeat(dots)}</span>`;

/** Light every load bar under `root` from 0..1 levels: low green, middle blue, high rose. */
export function setLoadBars(root: Element, levels: Record<string, number | null>): void {
  root.querySelectorAll<HTMLElement>("[data-lvl]").forEach((el) => {
    const dots = el.querySelectorAll("i");
    const f = levels[el.dataset.lvl ?? ""] ?? 0;
    const lit = f > 0 ? Math.max(1, Math.round(f * dots.length)) : 0;
    el.dataset.tone = f < 0.5 ? "low" : f < 0.8 ? "mid" : "high";
    dots.forEach((d, i) => d.classList.toggle("on", i < lit));
  });
}

/** A count as a row of dots (n lit out of `of`). */
export const meter = (n: number, of = 10): string =>
  `<div class="meter">${Array.from({ length: of }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div>`;

/** A share as a row of small accent dots (at least one lit). */
export const dotBar = (frac: number, of = 10): string =>
  `<div class="bar">${Array.from({ length: of }, (_, i) => `<i class="${i < Math.max(1, Math.round(of * frac)) ? "on" : ""}"></i>`).join("")}</div>`;

/** The last `n` probes as dots: lost ones (negative) in the accent. */
export const probes = (rec: number[] | null, n: number): string =>
  `<div class="pr">${(rec ?? []).slice(-n).map((v) => `<i class="${v < 0 ? "lost" : "ok"}"></i>`).join("")}</div>`;
