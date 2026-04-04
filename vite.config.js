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

/**
 * Vite injects the entry module script before the extracted CSS <link> in <head>.
 * That ordering can cause a flash of unstyled content on full-page navigations.
 * Move the built stylesheet immediately before the module script.
 */
function cssBeforeEntryModule() {
  return {
    name: "css-before-entry-module",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(
          /(<script[^>]*type="module"[^>]*><\/script>)\s*(<link[^>]*href="[^"]*assets\/[^"]+\.css"[^>]*>)/,
          "$2\n  $1",
        );
      },
    },
  };
}

export default defineConfig({
  base: viteBase(),
  root: ".",
  publicDir: "public",
  plugins: [cssBeforeEntryModule()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "work/index.html"),
        about: resolve(__dirname, "about/index.html"),
      },
    },
  },
});
