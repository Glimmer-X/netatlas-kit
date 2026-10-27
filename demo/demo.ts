// The kit on one page: a board built only from kit pieces with made-up data, then a specimen
// sheet (palette, dot type, glyphs, weather icons, halo tones). Nothing here talks to a server.

import "../styles/kit.css";
import "./demo.css";
import {
  GLYPHS, boardHtml, dotBar, dotColumns, dotMark, dt, flh, flowOf, focusNode, isolateRing, loadBar, meter, orbitSvg,
  probes, round, setFlows, setHalo, setLoadBars, sizePills, skyIcon, startFlows,
  type Cell, type Flow, type Glyph, type HaloTone, type OrbitModel, type OrbitNode, type Sky,
} from "../src";

/* ---------- made-up data, the same on every load ---------- */

let seed = 7;
const rnd = (): number => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const HOME_MULTI = ["studio-pc", "laptop-01", "laptop-02", "desk-mini", "nas", "media-box"];
const HOME_SINGLE = [
  "tv-lounge", "speaker-1", "speaker-2", "printer", "phone-a", "phone-b", "tablet", "camera-door", "camera-yard", "hub",
  "console", "watch", "e-reader", "thermostat", "doorbell", "light-hall", "light-desk", "plug-1", "plug-2", "vacuum",
  "air-sensor", "frame",
];
const AWAY = ["office-pc", "travel-laptop", "cloud-vm", "lab-box", "phone-remote"];

const nodes: OrbitNode[] = [
  ...HOME_MULTI.map((name, i): OrbitNode => ({
    id: name, name, group: "multi", firstSeen: i, online: true,
    sub: `${(1 + rnd() * 6).toFixed(1)} ms · ${i % 2 ? "Wired" : "5 GHz"}`,
    rings: [true, true, i < 3 ? true : null],
    addr: ["192.0.2." + (10 + i), "100.64.0." + (10 + i), i < 3 ? "10.0.0." + (10 + i) : null],
    link: "direct", flow: `link:${name}`, card: name,
  })),
  ...HOME_SINGLE.map((name, i): OrbitNode => ({
    id: name, name, group: "single", firstSeen: 10 + i, online: i !== 5, sub: "", rings: [i !== 5],
  })),
  ...AWAY.map((name, i): OrbitNode => ({
    id: name, name, group: "away", firstSeen: 40 + i, online: i !== 4,
    sub: i === 4 ? "Offline" : `${20 + Math.round(rnd() * 30)} ms · ${i % 2 ? "Relayed" : "Direct"}`,
    rings: [null, i === 4 ? false : true, i < 2 ? i !== 4 : null],
    link: i === 4 ? undefined : i % 2 ? "relay" : "direct", flow: `link:${name}`, card: name,
  })),
];

const model: OrbitModel = {
  rings: [
    { tone: "ink", pill: "LAN 27" },
    { tone: "blue", pill: "MESH 10/11" },
    { tone: "olive", pill: "OVERLAY 5/5" },
  ],
  linkRing: 1,
  centre: { label: "HUB", sub: ".1", halo: { frac: 0.18 } },
  nodes,
  text: {
    title: "ORBIT",
    sub: "Three rings around one node",
    hint: "Hover a dot · a pill shows its ring alone",
    home: "Home",
    away: "Away",
    single: (n) => `+${n} more on the LAN only`,
    legend: { on: "Online", off: "Offline", same: "Same device", direct: "Direct", relay: "Relayed" },
  },
};

/* ---------- the board ---------- */

const cells: Cell[] = [
  { id: "inet", area: "1 / 1 / 3 / 3", cls: "t s o", halo: true },
  { id: "r0", area: "1 / 3 / 2 / 4", cls: "t o clk", halo: true },
  { id: "r1", area: "2 / 3 / 3 / 4", cls: "t o clk", halo: true },
  { id: "r2", area: "3 / 3 / 4 / 4", cls: "t o clk", halo: true },
  { id: "node", area: "3 / 1 / 5 / 3", cls: "t clk" },
  { id: "new", area: "4 / 3 / 5 / 4", cls: "t o clk", halo: true },
  { id: "traffic", area: "5 / 1 / 7 / 4", cls: "t sl clk" },
  { id: "hw", area: "7 / 1 / 8 / 4", cls: "t clk" },
  { id: "orbit", area: "1 / 4 / 7 / 10", cls: "orbit" },
  { id: "detail", area: "7 / 4 / 8 / 10", cls: "t sl" },
  { id: "s1", area: "1 / 10 / 2 / 11", cls: "t s o clk", halo: true },
  { id: "s2", area: "1 / 11 / 2 / 12", cls: "t o clk", halo: true },
  { id: "s3", area: "1 / 12 / 2 / 13", cls: "t s o clk", halo: true },
  { id: "s4", area: "2 / 10 / 3 / 11", cls: "t o clk", halo: true },
  { id: "s5", area: "2 / 11 / 3 / 12", cls: "t o clk", halo: true },
  { id: "s6", area: "2 / 12 / 3 / 13", cls: "t o clk", halo: true },
  { id: "brief", area: "3 / 10 / 4 / 13", cls: "t a clk" },
  { id: "flows", area: "4 / 10 / 6 / 13", cls: "t sl clk" },
  { id: "probes", area: "6 / 10 / 8 / 13", cls: "t clk" },
];

const set = (id: string, html: string): void => {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
};
const glyph = (g: Glyph, px: number): string => `<span class="lg-wrap">${dotMark(GLYPHS[g], px)}</span>`;

function fillBoard(): void {
  set("inet", `<div class="big-round"><div class="k">${dt("INTERNET")}</div><div class="big"><span class="ar">↓</span>${dt("226")}</div><div class="u">Mb/s · of 461 Mb/s</div><div class="up"><span class="ar sm">↑</span>${dt("26.4")}<span class="u">Mb/s</span></div></div>`);
  set("r0", round(`<div class="v">${dt("27")}</div>`, "LAN", "All online"));
  set("r1", round(`<div class="v">${dt("10/11")}</div>`, `<span class="mk" style="background:var(--blue)"></span>Mesh`, "2 relayed"));
  set("r2", round(`<div class="v">${dt("5/5")}</div>`, `<span class="mk" style="background:var(--olive)"></span>Overlay`, "10.0.0.0/24"));
  set("new", round(`<div class="v">${dt("+3")}</div>`, "New devices", "last 24 h"));

  const bands: [string, number][] = [["2.4", 6], ["5G", 11], ["6G", 4], ["ETH", 3]];
  set("node", `<div class="pad"><div class="hd">${dt("NODE", "lg")}<span class="cap">Router</span></div>
    <div class="readings">${[["14%", "CPU", "n-cpu"], ["66%", "Memory", "n-mem"], ["61°", "Temp", "n-temp"]].map(([v, c, k]) => `<div>${dt(v!)}${loadBar(k!)}<span class="cap">${c}</span></div>`).join("")}</div>
    <div class="bands">${bands.map(([b, n]) => `<span class="b">${dt(b)}</span>${meter(n)}<span class="cnt">${dt(String(n))}</span>`).join("")}</div></div>`);
  setLoadBars(document.getElementById("node")!, { "n-cpu": 0.14, "n-mem": 0.66, "n-temp": 0.55 });

  const cols = Array.from({ length: 43 }, (_, i): [number, number] | null =>
    i < 4 ? null : [2e5 * (1 + 40 * (0.5 + 0.5 * Math.sin(i * 0.33)) ** 2), 4e4 * (1 + 6 * rnd())]);
  const ch = dotColumns(cols, { W: 291, RX: 10, TX: 4 });
  set("traffic", `<div class="pad"><div class="hd">${dt("TRAFFIC")}<span class="cap">Last 24 h</span></div>
    <div class="hd" style="margin-top:8px"><span class="cap">↓ Down · <span class="dim">↑ Up</span></span><span class="cap">Peak 48.4 Mb/s</span></div>
    <svg class="chart" viewBox="0 0 291 ${ch.h.toFixed(0)}">${ch.svg}</svg>
    <div class="hd" style="margin-top:6px"><span class="cap">08:00</span><span class="cap">08:00</span></div></div>`);

  set("hw", `<div class="readings four">${[["58.2°", "Temp", "h-t"], ["6%", "CPU", "h-c"], ["22%", "Memory", "h-m"], ["74", "Days up", ""]].map(([v, c, k]) => `<div>${dt(v!)}${loadBar(k!)}<span class="cap">${c}</span></div>`).join("")}</div>`);
  setLoadBars(document.getElementById("hw")!, { "h-t": 0.5, "h-c": 0.06, "h-m": 0.22 });

  const orbit = document.getElementById("orbit")!;
  orbit.innerHTML = orbitSvg(model);
  const svg = orbit.querySelector("svg")!;
  sizePills(svg);
  svg.querySelectorAll<SVGGElement>(".dev").forEach((g) => {
    g.addEventListener("mouseenter", () => focusNode(svg, g.dataset.dev ?? null));
    g.addEventListener("mouseleave", () => focusNode(svg, null));
  });
  svg.querySelectorAll<SVGGElement>(".pill").forEach((p) => {
    p.addEventListener("mouseenter", () => isolateRing(svg, Number(p.dataset.ring)));
    p.addEventListener("mouseleave", () => isolateRing(svg, null));
  });

  set("detail", `<div class="det"><div class="who"><div class="name">studio-pc</div><div class="cap">Home · desktop</div></div>
    ${[["LAN", "var(--s-mute)", "192.0.2.10", "Wired"], ["MESH", "var(--blue)", "100.64.0.10", "Direct · 1 ms"], ["OVERLAY", "var(--olive)", "10.0.0.10", "Direct · 2 ms"]]
      .map(([k, c, ip, sub]) => `<div class="col"><div class="k"><span class="mk" style="background:${c}"></span>${dt(k!)}</div><div class="ip">${ip}</div><div class="sub">${sub}</div></div>`).join("")}
    <div class="rtt">${dt("1.2")}<div class="cap">ms</div></div></div>`);

  const services: [string, string, string, string][] = [
    [`<div class="v">${dt("4")}</div>`, "Entry A", "TCP 443", ""],
    [`<div class="v">${dt("2")}</div>`, "Entry B", "UDP 443", ""],
    [`<div class="v">${dt("7")}</div>`, "Relay", "2/6 relayed", ""],
    [glyph("halo", 20), "Overlay", "Running", ""],
    [glyph("grid", 16), "Mesh", "Running", ""],
    [glyph("out", 14), "Tunnel", "Stopped", "warn"],
  ];
  services.forEach(([v, n, d, w], i) => set(`s${i + 1}`, round(v, n, d, w)));

  set("brief", `<div class="bf">${skyIcon("partly", true, 46)}<div class="bf-main"><div class="bf-k">${dt("HARBOUR TOWN")}</div><div class="bf-big">${dt("17.2")}<small>°C</small></div><div class="bf-sub">Partly cloudy</div></div><div class="bf-side">23° / 9°<br>rain 0%<br>feels 16°</div></div>`);

  const hosts: [string, number][] = [["video.example", 1], ["files.example", 0.42], ["mail.example", 0.12]];
  set("flows", `<div class="pad"><div class="hd">${dt("FLOWS")}<span class="cap">Through the hub</span></div>
    <div class="big-num">${dt("8")}<span class="cap">connections</span></div>
    <div class="flow"><span>phone-remote</span>${flh("demo:in")}${dt("443")}${flh("demo:out")}${dt("NET")}</div>
    <div class="dest">${hosts.map(([h, f]) => `<div class="h">${h}</div>${dotBar(f)}`).join("")}</div></div>`);

  const rows: [string, number[], string][] = [
    ["studio-pc", Array(14).fill(1), "1.2"], ["printer", [1, 1, -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1], "38%"],
    ["phone-b", [1, -1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1, 1, 1], "21%"], ["nas", Array(14).fill(1), "0.8"],
    ["camera-door", [1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1], "4.6"], ["tablet", Array(14).fill(1), "3.1"],
  ];
  set("probes", `<div class="pad"><div class="hd">${dt("PROBES")}<span class="cap">Latency & loss</span></div>
    <div class="lat">${rows.map(([n, rec, v]) => `<span class="nm">${n}</span>${probes(rec, 14)}<span class="val${v.endsWith("%") ? " bad" : ""}">${v.endsWith("%") ? `${v} loss` : `${dt(v)}<small>ms</small>`}</span>`).join("")}</div></div>`);

  const halos: [string, number, HaloTone, ("steady" | "spin" | "breathe")?][] = [
    ["inet", 0.62, "light"], ["r0", 1, "light"], ["r1", 10 / 11, "blue"], ["r2", 1, "olive"],
    ["s1", 0.66, "rose", "spin"], ["s2", 0.34, "rose"], ["s3", 0.33, "blue"], ["s6", 1, "alert", "breathe"],
  ];
  halos.forEach(([id, frac, tone, mode]) => setHalo(id, { frac, tone, mode }));

  const flows = new Map<string, Flow>();
  const put = (k: string, f: Flow | null): void => void (f && flows.set(k, f));
  nodes.forEach((n) => n.link && put(`link:${n.name}`, flowOf(1e4 + rnd() * 3e5, 2e3)));
  put("demo:in", flowOf(4e5, 1e4));
  put("demo:out", flowOf(3e5, 2e6));
  setFlows(flows);
}

/* ---------- specimen ---------- */

const TOKENS = ["--board", "--w", "--w2", "--s", "--ink", "--mute", "--faint", "--off", "--accent", "--blue", "--olive", "--lv-low", "--lv-mid", "--lv-high"];
const SKIES: Sky[] = ["clear", "partly", "cloud", "fog", "drizzle", "rain", "snow", "thunder", "alert"];
const TONES: HaloTone[] = ["light", "blue", "olive", "rose", "alert"];

function specimen(): string {
  const sec = (title: string, note: string, body: string): string =>
    `<section class="spec" id="spec-${title.toLowerCase()}"><div class="spec-hd">${dt(title)}<span class="cap">${note}</span></div>${body}</section>`;
  return [
    sec("PALETTE", "Neutral panels; colour only where it means something. The accent is kept for alerts.",
      `<div class="swatches">${TOKENS.map((t) => `<div><i style="background:var(${t})"></i><span class="cap">${t.slice(2)}</span></div>`).join("")}</div>`),
    sec("TYPE", "5 × 7 round dots, for numbers and short labels. Body text stays in a plain sans.",
      `<div class="type">${["0123456789", "ABCDEFGHIJKLM", "NOPQRSTUVWXYZ", ". , : / % ° + - < > ↓ ↑ !"].map((s) => `<div>${dt(s)}</div>`).join("")}</div>`),
    sec("GLYPHS", "Small marks on the same dot grid.",
      `<div class="glyphs">${(Object.keys(GLYPHS) as Glyph[]).map((g) => `<div>${dotMark(GLYPHS[g], 34)}<span class="cap">${g}</span></div>`).join("")}</div>`),
    sec("WEATHER", "15 × 13 dots; the unlit grid stays faintly visible.",
      `<div class="glyphs">${SKIES.map((s) => `<div>${skyIcon(s, true, 46)}<span class="cap">${s}</span></div>`).join("")}</div>`),
    sec("HALOS", "Light from behind a round tile. Arc length is a share; alert breathes, work turns.",
      `<div class="halo-row">${boardHtml(TONES.map((t, i): Cell => ({ id: `h-${t}`, area: `1 / ${i + 1} / 2 / ${i + 2}`, cls: "t o", halo: true })))}</div>`),
  ].join("");
}

/* ---------- page ---------- */

function themeSeg(): string {
  return `<div class="seg" id="theme">${["auto", "light", "dark"].map((v) => `<button data-v="${v}">${v[0]!.toUpperCase()}${v.slice(1)}</button>`).join("")}</div>`;
}

function setTheme(v: string): void {
  if (v === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = v;
  document.querySelectorAll<HTMLButtonElement>("#theme button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
}

const app = document.getElementById("app")!;
app.innerHTML = `<header class="top"><div class="brand">${dt("NETATLAS KIT")}<span class="cap">A visual system for live dashboards</span></div>${themeSeg()}</header>
  ${boardHtml(cells)}${specimen()}
  <footer class="cap">Everything on this page is made up. <a href="https://github.com/Glimmer-X/netatlas-kit">Source and documentation on GitHub</a>.</footer>`;
fillBoard();
TONES.forEach((t, i) => {
  document.getElementById(`h-${t}`)!.innerHTML = round(`<div class="v">${dt(String([62, 80, 45, 30, 100][i]))}</div>`, t, "");
  setHalo(`h-${t}`, { frac: [0.62, 0.8, 0.45, 0.3, 1][i]!, tone: t, mode: t === "alert" ? "breathe" : "steady" });
});
document.querySelectorAll<HTMLButtonElement>("#theme button").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.v ?? "auto")));
setTheme(new URLSearchParams(location.search).get("theme") ?? "auto");
startFlows();

const fit = (): void => void (app.style.zoom = String(Math.min(1, (innerWidth - 32) / 1360)));
addEventListener("resize", fit);
fit();
