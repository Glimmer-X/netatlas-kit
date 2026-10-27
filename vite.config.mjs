// Demo page: `npm run dev` serves demo/, `npm run build` writes a static copy to dist/.
// Plain object (no import from vite), so the config also loads with a vite installed elsewhere.
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export default {
  root: resolve(here, "demo"),
  base: "./",
  cacheDir: process.env.KIT_VITE_CACHE ? resolve(process.env.KIT_VITE_CACHE) : resolve(here, "node_modules/.vite"),
  build: { outDir: resolve(here, "dist"), emptyOutDir: true },
  server: { host: "127.0.0.1", port: 5190, fs: { allow: [here] } },
};
