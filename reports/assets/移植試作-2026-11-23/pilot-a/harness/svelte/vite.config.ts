import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwind from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import localeFromUrl from "../locale-plugin.mjs";
import rounds from "../rounds-plugin.mjs";
const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  plugins: [localeFromUrl(), rounds(root), svelte(), tailwind()],
});
