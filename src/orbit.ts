// The orbit: a node in the centre, three dotted rings around it, each member a dot on every ring
// it belongs to, joined by a spoke. Members sit in three arcs: on several rings (top right), on
// one ring only (bottom, unlabelled), and away (left). Members of the link ring can also draw a
// line into the centre: straight when direct, dotted when relayed through the centre's halo.
//
// Angles are stable: each member claims a slot in its arc from a hash of its id; older members
// (firstSeen) claim first, so a newcomer never pushes an existing dot aside.
//
// orbitSvg() is a pure function of the model. Styles: styles/orbit.css. Interaction helpers at the
// end (focus, isolate one ring) only toggle classes; the page wires events.

import { dtSvg, dtWidth } from "./dotfont";
import { fline } from "./flow";
import { esc, f1 } from "./util";

export const SZ = 674; // the orbit's square viewBox
export const CX = 337;
export const CY = 352;
export const RPI = 36; // the centre node
export const RADII = [110, 166, 222] as const; // inner, middle, outer ring

export type ArcGroup = "multi" | "single" | "away";
export type RingTone = "ink" | "blue" | "olive";

export interface OrbitRing {
  tone: RingTone;
  pill: string; // dot-type text in the pill at the ring's top
  note?: string; // sans text after it (e.g. a warning)
  alert?: boolean; // accent pill, and the centre's spoke to this ring turns dotted rose
}

export interface OrbitNode {
  id: string;
  name: string;
  sub: string; // second label line
  group: ArcGroup;
  firstSeen?: number;
  rings: (boolean | null)[]; // per ring: null = not a member, true/false = online on it
  online: boolean;
  addr?: (string | null)[]; // per ring, shown instead of `sub` when that ring is isolated
  link?: "direct" | "relay"; // a line from the link ring into the centre
  flow?: string; // flow key riding on that line (flow.ts)
  card?: string; // data-card hooks for the page's hover cards
  linkCard?: string;
}

export interface OrbitText {
  title: string; // dot type, top left
  sub: string;
  hint: string; // top right
  home: string; // captions inside the inner ring
  away: string;
  single: (n: number) => string; // under the bottom arc
  legend: { on: string; off: string; same: string; direct: string; relay: string };
}

export interface OrbitModel {
  rings: [OrbitRing, OrbitRing, OrbitRing];
  linkRing: number; // which ring's members may link into the centre
  centre: { label: string; sub: string; card?: string; open?: string; halo?: CentreHalo | null };
  nodes: OrbitNode[];
  text: OrbitText;
  compact?: boolean; // tighter legend for CJK labels
}

export interface CentreHalo {
  frac: number; // 0..1 arc from 12 o'clock
  alert?: boolean; // rose and breathing
}

const rad = (a: number): number => (a * Math.PI) / 180;
export const orbitPt = (r: number, a: number): [number, number] => [CX + r * Math.sin(rad(a)), CY - r * Math.cos(rad(a))];

const fnv = (s: string): number => {
  let h = 0x811c9dc5;
  for (const ch of s) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

// arc start and end (degrees clockwise from 12), minimum slots, labelled
const ARCS: Record<ArcGroup, [number, number, number, boolean]> = {
  multi: [34, 100, 6, true],
  single: [116, 238, 24, false],
  away: [252, 328, 8, true],
};

export interface Placed<N> {
  node: N;
  a: number; // angle, degrees clockwise from 12
  labeled: boolean;
}

/** Stable angles for members, by arc. Works on any object with an id, a group and firstSeen. */
export function placeNodes<N extends { id: string; group: ArcGroup; firstSeen?: number }>(nodes: N[]): Placed<N>[] {
  const out: Placed<N>[] = [];
  for (const [g, [a0, a1, minSlots, labeled]] of Object.entries(ARCS) as [ArcGroup, [number, number, number, boolean]][]) {
    const list = nodes.filter((d) => d.group === g).sort((a, b) => (a.firstSeen ?? 0) - (b.firstSeen ?? 0) || a.id.localeCompare(b.id));
    const n = Math.max(minSlots, list.length);
    const taken = new Array<boolean>(n).fill(false);
    for (const node of list) {
      let s = fnv(node.id) % n;
      while (taken[s]) s = (s + 1) % n;
      taken[s] = true;
      out.push({ node, a: n === 1 ? (a0 + a1) / 2 : a0 + ((a1 - a0) * s) / (n - 1), labeled });
    }
  }
  return out;
}

/** The centre's own backlight: an arc, rose and breathing on alert. */
export function centreHalo(h: CentreHalo | null | undefined): string {
  if (!h) return "";
  const r = RPI + 3;
  const c = 2 * Math.PI * r;
  const frac = h.alert ? 1 : Math.max(0.03, Math.min(1, h.frac));
  const arc = (cls: string): string =>
    `<circle class="${cls}" cx="${CX}" cy="${CY}" r="${r}" stroke-dasharray="${f1(frac * c)} ${f1(c)}" transform="rotate(-90 ${CX} ${CY})"/>`;
  return `<g class="c-halo${h.alert ? " alert" : ""}">${arc("ch-glow")}${arc("ch-core")}</g>`;
}

const truncate = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The whole orbit as an <svg>. */
export function orbitSvg(m: OrbitModel, id = ""): string {
  const R = RADII;
  const L = m.linkRing;
  const pt = orbitPt;
  const placed = placeNodes(m.nodes);
  let g = `<defs><filter id="o-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>`;
  m.rings.forEach((ring, i) => {
    g += `<circle class="ring r${i} t-${ring.tone}" cx="${CX}" cy="${CY}" r="${R[i]}"/><circle class="hit" data-ring="${i}" cx="${CX}" cy="${CY}" r="${R[i]}"/>`;
  });
  const cap = (a: number, s: string): string => {
    const [x, y] = pt(73, a);
    return `<text class="o-cap" x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle">${esc(s)}</text>`;
  };
  g += cap(68, m.text.home) + cap(292, m.text.away);
  // the centre's own spoke up through the rings
  g += `<line class="selfspoke${m.rings[1].alert ? " bad" : ""}" x1="${CX}" y1="${CY - RPI}" x2="${CX}" y2="${CY - R[1]}"/><line class="selfspoke${m.rings[2].alert ? " bad" : ""}" x1="${CX}" y1="${CY - R[1]}" x2="${CX}" y2="${CY - R[2]}"/>`;
  if (m.centre.card) g += `<line class="lhit" data-card="${esc(m.centre.card)}" x1="${CX}" y1="${CY - RPI}" x2="${CX}" y2="${CY - R[2]}"/>`;
  g += `<circle class="c-ring" cx="${CX}" cy="${CY}" r="${RPI + 7}"/>`;
  for (const { node: d, a, labeled } of placed) {
    const ms = d.rings.flatMap((on, i) => (on == null ? [] : [i]));
    if (!ms.length) continue;
    const rs = ms.map((i) => R[i]!);
    const rin = Math.min(...rs);
    const rout = Math.max(...rs);
    const card = d.card ? ` data-card="${esc(d.card)}"` : "";
    let s = "";
    if (d.link && d.rings[L] != null) {
      const relay = d.link === "relay";
      const [x0, y0] = pt(R[L]! - 7, a);
      const [x1, y1] = pt(RPI + (relay ? 7 : 2), a);
      s += fline(d.flow ?? "", x0, y0, x1, y1, relay ? "relay" : "direct", "blue", 2.3);
      if (d.linkCard) s += `<line class="lhit" data-card="${esc(d.linkCard)}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`;
    }
    if (ms.length > 1) {
      const [x0, y0] = pt(rin, a);
      const [x1, y1] = pt(rout, a);
      s += `<line class="spoke${d.online ? "" : " off"}" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`;
      if (card) s += `<line class="lhit"${card} x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`;
    }
    for (const i of ms) {
      const [x, y] = pt(R[i]!, a);
      if (card) s += `<circle class="hd-hit"${card} cx="${f1(x)}" cy="${f1(y)}" r="10"/>`;
      s += `<circle class="dv${d.rings[i] ? "" : " hollow"}" cx="${f1(x)}" cy="${f1(y)}" r="${labeled ? 4.8 : 3.9}"/>`;
    }
    if (labeled) {
      const [x, y] = pt(R[2] + 15, a);
      const anc = a > 180 ? "end" : "start";
      s += `<text class="lb"${card} x="${f1(x)}" y="${f1(y - 1)}" text-anchor="${anc}">${esc(truncate(d.name, 15))}</text>`;
      s += `<text class="lb2 v-def" x="${f1(x)}" y="${f1(y + 12)}" text-anchor="${anc}">${esc(d.sub)}</text>`;
      for (const i of ms) s += `<text class="lb2 v-net v${i}" x="${f1(x)}" y="${f1(y + 12)}" text-anchor="${anc}">${esc(d.addr?.[i] ?? "")}</text>`;
    } else if (d.rings[0] != null) {
      // radial name, revealed when the inner ring is isolated
      const [x, y] = pt(R[0] + 11, a);
      const flip = a > 180;
      const rot = flip ? a + 90 : a - 90;
      s += `<text class="rl" x="${f1(x)}" y="${f1(y)}" dy="3.2" text-anchor="${flip ? "end" : "start"}" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})">${esc(truncate(d.name, 13))}</text>`;
    }
    g += `<g class="dev ${ms.map((i) => `m${i}`).join(" ")}${d.online ? "" : " off"}" data-dev="${esc(d.id)}">${s}</g>`;
  }
  m.rings.forEach((ring, i) => {
    const h = 10;
    const y = CY - R[i]! + h / 2;
    const note = ring.note ?? "";
    const w = dtWidth(ring.pill, h) + (note ? 6 + note.length * (m.compact ? 11 : 6) : 0);
    g += `<g class="pill p${i}${ring.alert ? " alert" : ""}" data-ring="${i}"><rect rx="12" ry="12" height="24"/><g class="pc">${dtSvg(ring.pill, CX - w / 2, y, h)}${note ? `<text class="pn" x="${f1(CX - w / 2 + dtWidth(ring.pill, h) + 6)}" y="${f1(y)}">${esc(note)}</text>` : ""}</g></g>`;
  });
  g += `<g class="c-halo-slot">${centreHalo(m.centre.halo)}</g>`;
  const cAttrs = `${m.centre.card ? ` data-card="${esc(m.centre.card)}"` : ""}${m.centre.open ? ` data-open="${esc(m.centre.open)}"` : ""}`;
  g += `<g class="c-node"${cAttrs}><circle class="c-disc" cx="${CX}" cy="${CY}" r="${RPI}"/>${dtSvg(m.centre.label, CX, CY + 3, 15, "middle", "c-t")}<text class="c-t2" x="${CX}" y="${CY + 18}" text-anchor="middle">${esc(m.centre.sub)}</text></g>`;
  {
    const [x, y] = pt(R[2] + 22, 177);
    g += `<text class="o-cap single-cap" x="${f1(x)}" y="${f1(y + 4)}" text-anchor="middle">${esc(m.text.single(placed.filter((o) => !o.labeled).length))}</text>`;
  }
  const lg = m.text.legend;
  const zh = !!m.compact;
  g += `<g class="o-title">${dtSvg(m.text.title, 14, 34, 13)}</g><text class="o-cap" x="14" y="54">${esc(m.text.sub)}</text>`;
  g += `<text class="o-cap" x="${SZ - 14}" y="34" text-anchor="end">${esc(m.text.hint)}</text>`;
  g += `<g class="lg" transform="translate(14 ${SZ - 12})">
    <circle class="dv" cx="4" cy="-4" r="4.6"/><text x="15" y="0">${esc(lg.on)}</text>
    <g transform="translate(${zh ? 62 : 72} 0)"><circle class="dv hollow" cx="4" cy="-4" r="4.2"/><text x="15" y="0">${esc(lg.off)}</text></g>
    <g transform="translate(${zh ? 124 : 144} 0)"><line class="spoke" x1="2" y1="-4" x2="26" y2="-4"/><circle class="dv" cx="2" cy="-4" r="3.6"/><circle class="dv" cx="26" cy="-4" r="3.6"/><text x="37" y="0">${esc(lg.same)}</text></g>
    <g transform="translate(${zh ? 222 : 252} 0)"><line class="direct" x1="1" y1="-4" x2="25" y2="-4"/><text x="35" y="0">${esc(lg.direct)}</text></g>
    <g transform="translate(${zh ? 316 : 340} 0)"><line class="relay" x1="1" y1="-4" x2="25" y2="-4"/><text x="35" y="0">${esc(lg.relay)}</text></g></g>`;
  return `<svg class="orbit-map" viewBox="0 0 ${SZ} ${SZ}"${id ? ` id="${id}"` : ""}>${g}</svg>`;
}

/** Fit each pill's capsule to its text (needs the SVG in the document); again once web fonts
 *  have loaded, since a fallback font measures differently. */
export function sizePills(svg: SVGSVGElement): void {
  fitPills(svg);
  void document.fonts?.ready.then(() => fitPills(svg));
}

function fitPills(svg: SVGSVGElement): void {
  svg.querySelectorAll<SVGGElement>(".pill").forEach((p) => {
    const pc = p.querySelector<SVGGElement>(".pc");
    const r = p.querySelector("rect");
    if (!pc || !r) return;
    const b = pc.getBBox();
    const w = b.width + 24;
    r.setAttribute("width", f1(w));
    r.setAttribute("x", f1(b.x + b.width / 2 - w / 2));
    r.setAttribute("y", f1(b.y + b.height / 2 - 12));
  });
}

/** Bring one member forward and dim the rest (null clears). */
export function focusNode(svg: Element, id: string | null): void {
  svg.querySelectorAll(".dev.on").forEach((g) => g.classList.remove("on"));
  svg.classList.toggle("focus", !!id);
  if (id) svg.querySelector(`.dev[data-dev="${CSS.escape(id)}"]`)?.classList.add("on");
}

/** Show one ring alone (null shows all). */
export function isolateRing(svg: HTMLElement | SVGElement, ring: number | null): void {
  if (ring == null) delete svg.dataset.iso;
  else svg.dataset.iso = String(ring);
}

/** Replace a member's second label line without a redraw. */
export function setNodeSub(svg: Element, id: string, sub: string): void {
  const v = svg.querySelector(`.dev[data-dev="${CSS.escape(id)}"] .v-def`);
  if (v) v.textContent = sub;
}

/** Replace the centre's halo without a redraw. */
export function setCentreHalo(svg: Element, h: CentreHalo | null | undefined): void {
  const slot = svg.querySelector(".c-halo-slot");
  if (slot) slot.innerHTML = centreHalo(h);
}
