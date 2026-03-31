import { defineConfig } from "vite";

/**
 * GitHub Pages project site: https://<user>.github.io/<repo>/
 *   → build with: VITE_BASE_PATH=/<repo>/ npm run build
 * Root user site (repo <user>.github.io): leave unset (defaults to "/").
 */
function viteBase() {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
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
  },
});
