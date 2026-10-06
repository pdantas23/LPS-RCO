import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import { slots } from "./src/render.ts";

/** Injeta o conteúdo gerado a partir de src/config.ts nos comentários <!-- app:... -->. */
function lpHtml(): Plugin {
  return {
    name: "lp-html",
    transformIndexHtml(html) {
      return html.replace(/<!-- app:([\w-]+) -->/g, (tag, slot: string) => (slots[slot] ? slots[slot]() : tag));
    },
  };
}

export default defineConfig({
  // Servida em crm.rcohub.com/lpcrm/ (o CRM continua no mesmo domínio, fora deste projeto).
  base: "/lpcrm/",
  plugins: [lpHtml()],
  build: {
    target: "es2019",
    rollupOptions: {
      input: {
        lp: resolve(import.meta.dirname, "index.html"),
        obrigado: resolve(import.meta.dirname, "obrigado/index.html"),
      },
    },
  },
  test: { environment: "jsdom", include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
});
