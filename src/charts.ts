// Charts in the board's round-dot language.

import { f1 } from "./util";

const LOG_LO = 5; // 100 kb/s
const LOG_HI = Math.log10(5e7); // 50 Mb/s

/** Rows lit for a rate on a log scale. */
const level = (bytesPerSec: number, rows: number): number => {
  const b = bytesPerSec * 8;
  if (!(b > 0)) return 0;
  return Math.max(1, Math.min(rows, Math.ceil((rows * (Math.log10(b) - LOG_LO)) / (LOG_HI - LOG_LO))));
};

interface DotColumnsOpts {
  W: number;
  RX: number; // rows above the baseline (download)
  TX: number; // rows below (upload)
  on?: string;
  sub?: string;
  off?: string;
  rmax?: number;
  hover?: boolean; // wrap columns in hit groups (data-i)
}

/** Traffic as dot columns: rx above the baseline, tx below; null columns are "no record". */
export function dotColumns(cols: ([number, number] | null)[], o: DotColumnsOpts): { svg: string; h: number; pitch: number; base: number } {
  const { W, RX, TX, on = "var(--on-s)", sub = "var(--s-mute)", off = "var(--s-off)", rmax = 2.2, hover = false } = o;
  const pitch = W / cols.length;
  const r = Math.min(rmax, pitch * 0.34);
  const base = r + 2 + (RX - 1) * pitch;
  const txTop = base + pitch * 1.7;
  let s = "";
  cols.forEach((c, i) => {
    const x = f1(pitch * i + pitch / 2);
    const a = c ? level(c[0], RX) : 0;
    const b = c ? level(c[1], TX) : 0;
    const op = c ? "" : ' opacity=".45"';
    s += hover ? `<g class="col" data-i="${i}"><rect x="${f1(pitch * i)}" y="0" width="${f1(pitch)}" height="${f1(txTop + TX * pitch)}" fill="transparent"/>` : "<g>";
    for (let k = 0; k < RX; k++) s += `<circle cx="${x}" cy="${f1(base - k * pitch)}" r="${r}" fill="${k < a ? on : off}"${op}/>`;
    for (let k = 0; k < TX; k++) s += `<circle cx="${x}" cy="${f1(txTop + k * pitch)}" r="${r}" fill="${k < b ? sub : off}"${op}/>`;
    s += "</g>";
  });
  return { svg: s, h: txTop + (TX - 1) * pitch + r + 2, pitch, base };
}

/**
 * Spread [unix s, value] points over n equal time slots between `from` and `to` (max per slot);
 * slots without a point are null. The column count never depends on how many points exist.
 */
export function timeColumns(points: [number, number][], n: number, from: number, to: number): (number | null)[] {
  const out: (number | null)[] = new Array<number | null>(n).fill(null);
  const span = Math.max(1, to - from);
  for (const [ts, v] of points) {
    if (!Number.isFinite(v) || ts < from || ts > to) continue;
    const i = Math.min(n - 1, Math.floor(((ts - from) / span) * n));
    out[i] = Math.max(out[i] ?? -Infinity, v);
  }
  return out;
}

/** A single value over time as dot columns between lo and hi (null = no record). */
export function valueColumns(vals: (number | null)[], o: { W: number; rows: number; lo: number; hi: number; on: string; off: string; warnAt?: number; r?: number }): { svg: string; h: number } {
  if (!vals.length) return { svg: "", h: 0 };
  const pitch = o.W / vals.length;
  const r = Math.min(o.r ?? 2.4, pitch * 0.34);
  let s = "";
  vals.forEach((v, i) => {
    const x = f1(pitch * i + pitch / 2);
    const lit = v == null ? 0 : Math.max(1, Math.min(o.rows, Math.round((o.rows * (v - o.lo)) / (o.hi - o.lo))));
    const hot = v != null && o.warnAt != null && v >= o.warnAt;
    for (let k = 0; k < o.rows; k++)
      s += `<circle cx="${x}" cy="${f1(r + 1 + (o.rows - 1 - k) * pitch)}" r="${r}" fill="${k < lit ? (hot ? "var(--accent)" : o.on) : o.off}"${v == null ? ' opacity=".5"' : ""}/>`;
  });
  return { svg: s, h: o.rows * pitch + 2 };
}

/**
 * A variable-width ribbon through points: at each point the stroke swells to its half-width,
 * then tapers smoothly to the next (Catmull-Rom through both edges).
 */
export function ribbonPath(xs: number[], y: number, half: number[]): string {
  const top = xs.map((x, i) => [x, y - half[i]!] as const);
  const bot = xs.map((x, i) => [x, y + half[i]!] as const).reverse();
  const curve = (pts: readonly (readonly [number, number])[]): string => {
    let d = "";
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f1(c1[0]!)} ${f1(c1[1]!)} ${f1(c2[0]!)} ${f1(c2[1]!)} ${f1(p2[0])} ${f1(p2[1])}`;
    }
    return d;
  };
  const t0 = top[0]!;
  const b0 = bot[0]!;
  return `M${f1(t0[0])} ${f1(t0[1])}${curve(top)} L${f1(b0[0])} ${f1(b0[1])}${curve(bot)} Z`;
}
