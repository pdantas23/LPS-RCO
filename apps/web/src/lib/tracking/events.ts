import type { Tracking } from "@rco/lead-core/tracking";
import { lpOrigemOfPageId } from "@/content/lps";

// ============================================================
// dataLayer do GTM: UM helper (`track`) e UM catálogo de eventos (`EventMap`).
// Documentação para quem configura o container: docs/gtm-eventos.md.
//
// REGRA: nenhum dado pessoal no dataLayer. Nada de nome, WhatsApp ou email,
// nem em texto puro nem em hash. O catálogo abaixo é a lista fechada do que
// pode ir: o tipo de cada evento NÃO tem campo para dado pessoal, então
// colocar um por engano não compila (e `events.test.ts` confere em runtime).
// Pixel do Meta e GA4 NÃO são carregados no código: vivem dentro do GTM e
// leem estes eventos. Scroll e tempo na página também ficam por conta do GTM.
// ============================================================

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export type FormErrorType = "validation" | "server" | "network" | "rate_limit";

/** Percentuais de progresso do vídeo que geram evento. */
export const VIDEO_MILESTONES = [25, 50, 75, 100] as const;
export type VideoMilestone = (typeof VIDEO_MILESTONES)[number];

/** Catálogo fechado de eventos e seus parâmetros. */
export interface EventMap {
  /** Entrada na página (e a cada navegação client-side). Carrega as UTMs/click ids da sessão. */
  page_view: { page_id: string; page_path: string } & Tracking;
  cta_click: { page_id: string; cta_location: string; cta_text: string };
  /** Primeiro foco em qualquer campo do formulário (uma vez por visita). */
  form_start: { page_id: string };
  /** Tentativa de envio (clique no botão), válida ou não. */
  form_submit: { page_id: string };
  /** `fields` = só os NOMES dos campos com erro de validação, separados por vírgula. */
  form_error: { page_id: string; error_type: FormErrorType; fields?: string };
  /** Lead enviado com sucesso. `event_id` é o mesmo `respondent_id` enviado ao COMERCIAL (deduplicação com CAPI). */
  generate_lead: { page_id: string; nicho: string; faturamento: string; event_id: string };
  faq_open: { page_id: string; question: string; question_index: number };
  video_play: { page_id: string; video_provider: string };
  video_progress: { page_id: string; video_provider: string; percent: VideoMilestone };
}

export type EventName = keyof EventMap;

/**
 * Empurra um evento. TODO evento leva `lp_origem` ("form" | "lp01" | "lp02" | "lp-ecom"), derivado do
 * `page_id` em content/lps.ts: o mesmo evento personalizado vale em todas as LPs, e a origem diz de onde veio.
 * Id fora do mapa (ex. "other") vai sem `lp_origem`.
 */
export function track<E extends EventName>(event: E, params: EventMap[E]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  const lp_origem = lpOrigemOfPageId(params.page_id);
  window.dataLayer.push({ event, ...(lp_origem ? { lp_origem } : {}), ...params });
}

/** UUID v4. Cai para getRandomValues em navegador sem randomUUID (contexto não seguro). */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
