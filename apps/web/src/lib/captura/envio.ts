import type { Tracking } from "@rco/lead-core/tracking";
import type { Versao } from "@/content/captura/tipos";
import { CAPTURA_TEXTOS } from "@/content/captura/sites";
import type { Respostas } from "./fluxo";
import { EVENTOS_CARD, EVENTO_QUIZ_ENVIADO, pushCaptura } from "./eventos";

// ============================================================
// Envio da captura (quiz ou card) ao /api/lead + eventos de cada desfecho. Fora do componente para testar
// sem navegador. O perfil volta do servidor só para o evento final; nenhuma tela o mostra.
// ============================================================

export type DesfechoEnvio =
  | { kind: "ok"; perfil: string | null }
  | { kind: "erros"; erros: Record<string, string> }
  | { kind: "falha"; mensagem: string };

export async function enviarCaptura(args: {
  pageId: string;
  versao: Versao;
  respostas: Respostas;
  respondentId: string;
  tracking: Tracking;
  website?: string;
  fetchFn?: typeof fetch;
}): Promise<DesfechoEnvio> {
  const { pageId, versao, respostas, respondentId, tracking } = args;
  const doFetch = args.fetchFn ?? fetch;
  const E = CAPTURA_TEXTOS.erros;
  const base = { page_id: pageId, versao_captura: versao };
  try {
    const res = await doFetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ respondentId, page: pageId, versao, respostas, website: args.website ?? "", tracking }),
    });
    if (res.ok) {
      const body = (await res.json().catch(() => null)) as { perfil?: unknown } | null;
      const perfil = typeof body?.perfil === "string" ? body.perfil : null;
      const final = { ...base, event_id: respondentId, ...(perfil ? { perfil } : {}) };
      pushCaptura(versao === "card" ? EVENTOS_CARD.enviado : EVENTO_QUIZ_ENVIADO, final);
      // Mesmo evento de conversão das outras LPs (gatilhos do GTM já existentes), separado por lp_origem = sites.
      pushCaptura("generate_lead", { ...final, faturamento: respostas.faturamento });
      return { kind: "ok", perfil };
    }
    if (res.status === 422) {
      const body = (await res.json().catch(() => null)) as { errors?: Record<string, string> } | null;
      const erros = body?.errors ?? {};
      pushCaptura("form_error", { ...base, error_type: "validation", fields: Object.keys(erros).join(",") });
      return { kind: "erros", erros };
    }
    if (res.status === 429) {
      pushCaptura("form_error", { ...base, error_type: "rate_limit" });
      return { kind: "falha", mensagem: E.rateLimit };
    }
    pushCaptura("form_error", { ...base, error_type: "server" });
    return { kind: "falha", mensagem: E.rede };
  } catch {
    pushCaptura("form_error", { ...base, error_type: "network" });
    return { kind: "falha", mensagem: E.rede };
  }
}
