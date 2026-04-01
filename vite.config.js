import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * - Local dev: leave VITE_BASE_PATH unset (base "/").
 * - GitHub Pages + custom domain: use "./" so assets resolve at site root (custom domain)
 *   and under /repo/ (default github.io URL) — same build works for both.
 * - Legacy: VITE_BASE_PATH=/<repo>/ only if you need absolute subpath (breaks custom domain root).
 */
function viteBase() {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
  if (raw === "./" || raw === ".") return "./";
  const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

export default defineConfig({
  base: viteBase(),
  root: ".",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "work.html"),
        about: resolve(__dirname, "about.html"),
      },
    },
  },
});
