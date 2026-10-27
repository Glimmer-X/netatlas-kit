// Small helpers shared by the kit's modules.

export const NS = "http://www.w3.org/2000/svg";

/** One decimal, for SVG coordinates. */
export const f1 = (v: number): string => v.toFixed(1);

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const esc = (s: unknown): string => String(s).replace(/[&<>"]/g, (c) => ESC[c] ?? c);
export const unesc = (s: string): string =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

export const reducedMotion = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;
