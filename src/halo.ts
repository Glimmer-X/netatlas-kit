// Backlight halos: a ring of light behind a round widget, like LEDs under the panel glowing out
// around its edge. Arc length (from 12 o'clock, clockwise) carries a share or a level; a problem
// ("alert") breathes in rose; work in progress turns slowly. The halo sits in the same grid cell, under the widget
// (styles/halo.css).

export type HaloTone = "light" | "blue" | "olive" | "rose" | "alert";
export type HaloMode = "steady" | "breathe" | "spin";

export interface Halo {
  frac: number; // 0..1 of the circle; 0 hides the halo
  tone: HaloTone;
  mode?: HaloMode;
  level?: number; // 0..1 brightness, default 1
}

/** The halo element for a widget placed in the board grid. */
export function haloEl(forId: string, gridArea: string): string {
  return `<div class="halo" id="halo-${forId}" style="grid-area:${gridArea}" aria-hidden="true"><i class="hg"></i><i class="hc"></i></div>`;
}

export function setHalo(forId: string, h: Halo | null): void {
  const el = document.getElementById(`halo-${forId}`);
  if (!el) return;
  const frac = h ? Math.max(0, Math.min(1, h.frac)) : 0;
  el.style.setProperty("--f", frac.toFixed(3));
  el.style.setProperty("--lv", (h?.level ?? 1).toFixed(2));
  el.dataset.tone = h?.tone ?? "light";
  el.dataset.mode = h?.mode ?? "steady";
  el.classList.toggle("on", frac > 0);
}
