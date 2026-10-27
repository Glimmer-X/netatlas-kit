// Weather icons in round dots, and WMO weather codes (as Open-Meteo reports them) mapped to them.
// Icons are composed on a 15 x 13 grid from a few shapes; a shape in front clears a one-dot
// gap in the shapes behind it (a cloud in front of the sun), the way a dot display would.

export type Sky = "clear" | "partly" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "thunder" | "alert";

/** WMO weather interpretation codes (Open-Meteo) to an icon. */
export function skyOf(code: number): Sky {
  if (code <= 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  return "cloud";
}

const W = 15;
const H = 13;
type Pt = [number, number];

const grid = (test: (x: number, y: number) => boolean): Pt[] => {
  const out: Pt[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (test(x, y)) out.push([x, y]);
  return out;
};
const inDisc = (x: number, y: number, cx: number, cy: number, r: number): boolean => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

function sun(cx: number, cy: number, r: number, ray: number): Pt[] {
  const pts = grid((x, y) => inDisc(x, y, cx, cy, r));
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    const d = k % 2 ? ray * 0.82 : ray; // diagonals sit on the same visual circle
    pts.push([Math.round(cx + d * Math.cos(a)), Math.round(cy + d * Math.sin(a))]);
  }
  return pts;
}

const moon = (cx: number, cy: number, r: number): Pt[] =>
  grid((x, y) => inDisc(x, y, cx, cy, r) && !inDisc(x, y, cx + r * 0.62, cy - r * 0.42, r * 0.86));

/** A cloud with a flat base at `base`, its left edge at `left`. */
const cloud = (left: number, base: number): Pt[] =>
  grid(
    (x, y) =>
      y <= base &&
      (inDisc(x, y, left + 2.3, base - 2, 2.4) ||
        inDisc(x, y, left + 6, base - 3.6, 3.4) ||
        inDisc(x, y, left + 9.5, base - 1.9, 2.3) ||
        (x >= left + 0.5 && x <= left + 10.6 && y >= base - 2 && y <= base)),
  );

const DROPS: Pt[] = [[4, 9], [3, 10], [8, 9], [7, 10], [12, 9], [11, 10], [6, 11], [5, 12], [10, 11], [9, 12]];
const DRIZZLE: Pt[] = [[4, 10], [8, 9], [12, 10], [6, 12], [10, 12]];
const FLAKES: Pt[] = [[3, 9], [2, 10], [4, 10], [3, 11], [11, 9], [10, 10], [12, 10], [11, 11], [7, 10], [7, 12], [5, 12], [9, 12]];
const BOLT: Pt[] = [[8, 8], [7, 9], [6, 10], [7, 10], [8, 10], [7, 11], [6, 12]];
const FOG: Pt[] = [
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((x): Pt => [x, 3]),
  ...[0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14].map((x): Pt => [x, 6]),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13].map((x): Pt => [x, 9]),
  ...[4, 5, 6, 7, 8, 9, 10].map((x): Pt => [x, 12]),
];
// A filled warning triangle with the "!" left dark.
const BANG = new Set(["7,5", "7,6", "7,7", "7,8", "7,10"]);
const ALERT: Pt[] = grid((x, y) => y >= 1 && y <= 12 && Math.abs(x - 7) <= ((y - 1) * 7) / 11 + 0.01 && !BANG.has(`${x},${y}`));

/** Front shapes clear a one-dot ring in the back shapes. */
function layer(back: Pt[], front: Pt[]): Pt[] {
  const near = (p: Pt): boolean => front.some(([x, y]) => Math.abs(x - p[0]) <= 1 && Math.abs(y - p[1]) <= 1);
  return [...back.filter((p) => !near(p)), ...front];
}

function shape(sky: Sky, day: boolean): Pt[] {
  const high = cloud(2, 7); // cloud raised to leave room for what falls from it
  switch (sky) {
    case "clear":
      return day ? sun(7, 6, 2.6, 5.2) : moon(7, 6, 5.2);
    case "partly":
      return layer(day ? sun(4.6, 3.6, 2.3, 3.9) : moon(4, 4.2, 4.3), cloud(3, 11));
    case "cloud":
      return cloud(2, 10);
    case "fog":
      return FOG;
    case "drizzle":
      return [...high, ...DRIZZLE];
    case "rain":
      return [...high, ...DROPS];
    case "snow":
      return [...high, ...FLAKES];
    case "thunder":
      return layer(high, BOLT);
    case "alert":
      return ALERT;
  }
}

/** A weather icon as inline SVG, `px` tall; lit dots follow currentColor, the unlit grid is faint. */
export function skyIcon(sky: Sky, day: boolean, px: number, cls = ""): string {
  const lit = new Set(shape(sky, day).filter(([x, y]) => x >= 0 && x < W && y >= 0 && y < H).map(([x, y]) => `${x},${y}`));
  let s = "";
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) s += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r=".38"${lit.has(`${x},${y}`) ? "" : ' class="u"'}/>`;
  return `<svg class="sky ${cls}" viewBox="0 0 ${W} ${H}" style="height:${px}px;width:${((px * W) / H).toFixed(1)}px" fill="currentColor" aria-hidden="true">${s}</svg>`;
}
