import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { renderGtm, renderGtmNoscript } from "./src/gtm";

/**
 * SÓ EM DESENVOLVIMENTO: simula a RPC do Supabase com um Postgres real em memória
 * (PGlite + a migration 001). Permite testar o fluxo completo no navegador sem tocar
 * no banco de produção. Nada disso entra no build.
 *   POST /__dev/api/rest/v1/rpc/capturar_lead_performance_rco  → a função de verdade
 *   POST /__dev/fail?mode=http|timeout                           → próxima chamada falha
 *   GET  /__dev/leads                                            → linhas salvas
 *   POST /__dev/api/rest/v1/rpc/salvar_parcial_performance_rco   → contato parcial (migration 004)
 *   GET  /__dev/parciais                                         → parciais salvos
 */
function devLeadApi(): Plugin {
  return {
    name: "dev-lead-api",
    apply: "serve",
    async configureServer(server) {
      const { createTestDb, rpcAsAnon, callAsAnon } = await server.ssrLoadModule("/dev/test-db.ts");
      const db = await createTestDb();
      let failNext: string | null = null;

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://dev");
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        if (url.pathname === "/__dev/fail" && req.method === "POST") {
          failNext = url.searchParams.get("mode") ?? "http";
          return send(200, { failNext });
        }
        if (url.pathname === "/__dev/leads") {
          const rows = await db.query("select * from leads_performance_rco order by created_at");
          return send(200, rows.rows);
        }
        if (url.pathname === "/__dev/parciais") {
          const rows = await db.query("select * from leads_parciais_performance_rco order by created_at");
          return send(200, rows.rows);
        }
        if (url.pathname === "/__dev/api/rest/v1/rpc/salvar_parcial_performance_rco" && req.method === "POST") {
          let raw = "";
          for await (const chunk of req) raw += chunk;
          return send(200, await callAsAnon(db, "salvar_parcial_performance_rco", JSON.parse(raw).payload));
        }
        if (url.pathname === "/__dev/api/rest/v1/rpc/capturar_lead_performance_rco" && req.method === "POST") {
          let raw = "";
          for await (const chunk of req) raw += chunk;
          const mode = failNext;
          failNext = null;
          if (mode === "timeout") return; // nunca responde: o cliente aborta pelo timeout
          const result = await rpcAsAnon(db, JSON.parse(raw).payload);
          if (mode === "http") return send(503, { message: "falha simulada" }); // salvou, mas a resposta se perdeu
          return send(200, result);
        }
        next();
      });
    },
  };
}

/** GTM nas páginas do build e do dev (src/gtm.ts). */
function gtm(): Plugin {
  return {
    name: "gtm",
    transformIndexHtml(html) {
      return html.replace("<!-- app:gtm -->", renderGtm()).replace("<!-- app:gtm-noscript -->", renderGtmNoscript());
    },
  };
}

export default defineConfig({
  // Standalone (nginx do Dockerfile do Aerton): "/". Servido pelo app Next das LPs (raiz do monorepo): FORM_BASE=/_form/.
  base: process.env.FORM_BASE ?? "/",
  // HMR direto na porta do Vite quando o formulário roda atrás do Next (npm run dev da raiz).
  server: process.env.FORM_BASE ? { hmr: { clientPort: Number(process.env.FORM_DEV_PORT ?? 5174) } } : {},
  plugins: [devLeadApi(), gtm()],
  build: {
    target: "es2019",
    rollupOptions: {
      input: {
        formulario: resolve(import.meta.dirname, "formulario/index.html"),
        curioso: resolve(import.meta.dirname, "formulario/curioso/index.html"),
      },
    },
  },
});
