// Moving dots driven by measured rates (log scale, capped). Dots only ever travel along a line
// that is drawn: every flow layer sits on top of a visible line with the same end points.
// The page decides what flows (setFlows, keyed by any string); the kit draws and animates.

import { NS, esc, f1, reducedMotion } from "./util";

export interface Flow {
  n: number; // dots on the line, 1..4
  speed: number; // px per second
  dir: 1 | -1; // +1 along the drawn direction
}

let FLOW = new Map<string, Flow>();

/** A flow for traffic in both directions of a line (bytes per second); null when idle. */
export function flowOf(along: number, against: number): Flow | null {
  const tot = (along || 0) + (against || 0);
  if (!(tot > 0)) return null;
  const l = Math.log10(tot * 8); // bits per second
  return { n: Math.max(1, Math.min(4, Math.round(l - 2.2))), speed: Math.max(10, 10 + 11 * (l - 3)), dir: (along || 0) >= (against || 0) ? 1 : -1 };
}

/** Replace every flow at once. */
export function setFlows(flows: Map<string, Flow>): void {
  FLOW = flows;
}

/** Any measured traffic on this flow right now. */
export const flowing = (key: string): boolean => FLOW.has(key);

interface FlowEl extends Element {
  _dots?: SVGCircleElement[];
  _ph?: number;
}

let last = 0;
function frame(ts: number): void {
  const dts = last ? Math.min(0.1, (ts - last) / 1000) : 0;
  last = ts;
  const still = reducedMotion();
  document.querySelectorAll<SVGElement>("[data-flow]").forEach((node) => {
    const el = node as FlowEl & SVGElement;
    const f = FLOW.get(el.dataset.flow ?? "");
    const want = f ? f.n : 0;
    const dots = (el._dots ??= []);
    while (dots.length < want) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("r", el.dataset.r ?? "2.1");
      c.setAttribute("class", "fdot");
      el.appendChild(c);
      dots.push(c);
    }
    while (dots.length > want) dots.pop()?.remove();
    if (!f) return;
    let x0: number, y0: number, x1: number, y1: number;
    if (el.dataset.x0) {
      x0 = Number(el.dataset.x0);
      y0 = Number(el.dataset.y0);
      x1 = Number(el.dataset.x1);
      y1 = Number(el.dataset.y1);
    } else {
      const w = (el as unknown as SVGSVGElement).clientWidth;
      [x0, x1, y0, y1] = [2, w - 2, 4, 4];
    }
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    el._ph = ((el._ph ?? 0) + (still ? 0 : (dts * f.speed * f.dir) / len)) % 1;
    dots.forEach((c, i) => {
      const u = ((((el._ph ?? 0) + i / want) % 1) + 1) % 1;
      c.setAttribute("cx", f1(x0 + (x1 - x0) * u));
      c.setAttribute("cy", f1(y0 + (y1 - y0) * u));
      c.setAttribute("opacity", Math.min(1, u * 5, (1 - u) * 5).toFixed(2));
    });
  });
  requestAnimationFrame(frame);
}

export const startFlows = (): void => void requestAnimationFrame(frame);

/** A horizontal HTML flow line (thin static base; dots only with traffic). */
export const flh = (key: string): string =>
  `<svg class="flh"${key ? ` data-flow="${esc(key)}"` : ""} aria-hidden="true"><line class="fl-base" x1="2" y1="4" x2="100%" y2="4"/></svg>`;

/** A drawn SVG line with an optional flow layer on exactly the same end points. */
export function fline(key: string, x0: number, y0: number, x1: number, y1: number, cls = "hl", tone = "", r = 2.6): string {
  const line = `<line class="${cls}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`;
  if (!key) return line;
  return `${line}<g class="fg ${tone}" data-flow="${esc(key)}" data-x0="${f1(x0)}" data-y0="${f1(y0)}" data-x1="${f1(x1)}" data-y1="${f1(y1)}" data-r="${r}"></g>`;
}
