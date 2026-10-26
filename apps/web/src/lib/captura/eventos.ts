import type { Tracking } from "@rco/lead-core/tracking";
import type { Versao } from "@/content/captura/tipos";
import { lpOrigemOfPageId } from "@/content/lps";
import { nomeEventoTela } from "./fluxo";

// ============================================================
// Eventos da captura no dataLayer (bloco 9 do briefing). Nomes:
//   quiz   quiz_visto_<n>_<tela>, quiz_respondido_<n>_<tela>, quiz_enviado
//   card   card_pagina_vista, card_formulario_iniciado, card_formulario_enviado
//   LP     page_view (com a versão), cta_click; e generate_lead no envio, igual às outras LPs
// TODO evento leva `versao_captura` (quiz_curto | quiz_longo | card), `page_id` e `lp_origem`.
// Os envios (quiz_enviado, card_formulario_enviado, generate_lead) levam o `perfil` que o SERVIDOR calculou.
// Nenhum dado pessoal: a lista de parâmetros abaixo é fechada (não há campo para nome, WhatsApp, e-mail ou @).
// Documentação para o GTM: docs/gtm-eventos.md, seção /sites.
// ============================================================

export const EVENTOS_CARD = {
  vista: "card_pagina_vista",
  iniciado: "card_formulario_iniciado",
  enviado: "card_formulario_enviado",
} as const;
export const EVENTO_QUIZ_ENVIADO = "quiz_enviado";

export interface ParamsCaptura {
  page_id: string;
  versao_captura: Versao;
  tela_numero?: number;
  tela_nome?: string;
  perfil?: string;
  event_id?: string;
  page_path?: string;
  cta_location?: string;
  cta_text?: string;
  error_type?: string;
  fields?: string;
  /** Categorias (opção escolhida), nunca texto digitado. */
  faturamento?: string;
}

type DL = Record<string, unknown>[];

function camada(): DL | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { dataLayer?: DL };
  w.dataLayer = w.dataLayer ?? [];
  return w.dataLayer;
}

/** Empurra um evento da captura. `event` só aceita os nomes do catálogo acima ou de tela (validado). */
export function pushCaptura(event: string, params: ParamsCaptura & Partial<Tracking>): void {
  if (!/^(quiz_(visto|respondido)_\d+_[a-z0-9_]+|quiz_enviado|card_(pagina_vista|formulario_iniciado|formulario_enviado)|page_view|cta_click|generate_lead|form_error|form_submit)$/.test(event)) {
    throw new Error(`evento fora do catálogo: ${event}`);
  }
  const dl = camada();
  if (!dl) return;
  const lp_origem = lpOrigemOfPageId(params.page_id);
  dl.push({ event, ...(lp_origem ? { lp_origem } : {}), ...params });
}

/** Tela vista/respondida, uma vez por tela por visita (voltar e avançar de novo não conta em dobro). */
export function criarRastreioDeTelas(pageId: string, versao: Versao) {
  const vistos = new Set<string>();
  const respondidos = new Set<string>();
  const emitir = (acao: "visto" | "respondido", numero: number, slug: string, set: Set<string>) => {
    const nome = nomeEventoTela(acao, numero, slug);
    if (set.has(nome)) return;
    set.add(nome);
    pushCaptura(nome, { page_id: pageId, versao_captura: versao, tela_numero: numero, tela_nome: slug });
  };
  return {
    visto: (numero: number, slug: string) => emitir("visto", numero, slug, vistos),
    respondido: (numero: number, slug: string) => emitir("respondido", numero, slug, respondidos),
  };
}
