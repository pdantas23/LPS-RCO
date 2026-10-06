/**
 * Eventos da P02 no dataLayer. Segue o catálogo único das 4 LPs (docs/gtm-eventos.md na raiz do
 * monorepo): todo evento leva `lp_origem` ("form") e `page_id` ("P02"); os nomes e parâmetros
 * (page_view, form_start, form_submit, form_error, generate_lead) são os mesmos das outras LPs.
 * Os campos antigos (page_type, form_name) e o evento form_step foram mantidos. Regras:
 * - nenhum valor digitado entra aqui: só nomes de etapa, códigos de erro e o nome do formulário;
 * - generate_lead só é chamado depois que o servidor confirmou o salvamento;
 * - cada evento tem sua trava contra duplicidade (ver abaixo).
 */
import { FORM_NAME } from "../formulario/config";

export const PAGE_TYPE = "performance_form";
/** Origem padrão desta página em todos os eventos (catálogo único das LPs). */
export const LP_ORIGEM = "form";
export const PAGE_ID = "P02";

/** Campanha que acompanha o page_view (só os presentes). Nunca dado pessoal. */
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"] as const;

type Event = Record<string, string | number>;

const BASE = { lp_origem: LP_ORIGEM, page_id: PAGE_ID, page_type: PAGE_TYPE } as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}


const LEAD_KEY = "rco_p02_lead_enviado";
const STEPS_KEY = "rco_p02_etapas";

export interface Tracker {
  /** campaign: UTMs/click ids da sessão (opcional); entram só os preenchidos. */
  pageView(campaign?: Partial<Record<(typeof CAMPAIGN_KEYS)[number], string | null>>, path?: string): void;
  formStart(): void;
  /** Tentativa de envio (último botão), válida ou não. */
  formSubmit(): void;
  /** step: posição da tela (1 = primeira pergunta); stepName: id estável da tela (ver SCREENS). */
  formStep(step: number, stepName: string, submissionId: string): void;
  /** code: motivo detalhado (ex. required, server_rate_limited); error_type é derivado dele (catálogo). */
  formError(code: string): void;
  /** niche/revenue: códigos de categoria do formulário (nunca texto livre). event_id = submission_id. */
  generateLead(submissionId: string, answers?: { niche?: string; revenue?: string }): void;
}

/**
 * Travas:
 * - page_view e form_start: uma vez por carregamento da página;
 * - form_step: uma vez por etapa por submission_id, lembrado na sessão (voltar, avançar
 *   de novo e reload não repetem; jornada nova depois do sucesso conta de novo);
 * - generate_lead: uma vez por submission_id, lembrado na sessão (retry, resposta
 *   "duplicate" do servidor e reload não repetem).
 */
export function createTracker(target: Window = window, storage: Storage | null = safeSession(target)): Tracker {
  let viewed = false;
  let started = false;

  const push = (e: Event) => {
    target.dataLayer = target.dataLayer || [];
    target.dataLayer.push(e);
  };

  return {
    pageView(campaign = {}, path = "/") {
      if (viewed) return;
      viewed = true;
      const params: Event = {};
      for (const key of CAMPAIGN_KEYS) if (campaign[key]) params[key] = campaign[key] as string;
      push({ event: "page_view", ...BASE, page_path: path, ...params });
    },
    formStart() {
      if (started) return;
      started = true;
      push({ event: "form_start", ...BASE, form_name: FORM_NAME });
    },
    formSubmit() {
      push({ event: "form_submit", ...BASE, form_name: FORM_NAME });
    },
    formStep(step, stepName, submissionId) {
      const done = readSteps(storage, submissionId);
      if (done.includes(step)) return;
      push({ event: "form_step", ...BASE, form_name: FORM_NAME, step, step_name: stepName });
      memorySteps.set(submissionId, [...done, step]);
      try {
        storage?.setItem(STEPS_KEY, JSON.stringify({ id: submissionId, steps: [...done, step] }));
      } catch {
        /* sem storage: vale só a trava em memória deste carregamento */
      }
    },
    formError(code) {
      push({ event: "form_error", ...BASE, form_name: FORM_NAME, error_type: errorTypeOf(code), error_detail: code });
    },
    generateLead(submissionId, answers = {}) {
      const sent = readSent(storage);
      if (sent.includes(submissionId)) return;
      push({
        event: "generate_lead",
        ...BASE,
        form_name: FORM_NAME,
        ...(answers.niche ? { nicho: answers.niche } : {}),
        ...(answers.revenue ? { faturamento: answers.revenue } : {}),
        event_id: submissionId,
      });
      try {
        storage?.setItem(LEAD_KEY, JSON.stringify([...sent, submissionId].slice(-20)));
      } catch {
        /* sem storage: a trava em memória do fluxo (status success) ainda impede repetir */
      }
    },
  };
}

/**
 * error_type do catálogo (validation | server | network | rate_limit) a partir do código do formulário.
 * O código original continua em error_detail, então nada do que existia se perde.
 */
export function errorTypeOf(code: string): "validation" | "server" | "network" | "rate_limit" {
  if (code === "server_rate_limited") return "rate_limit";
  if (code === "submit_network" || code === "submit_timeout") return "network";
  if (code.startsWith("server_") || code.startsWith("submit_")) return "server";
  return "validation"; // required, invalid_*, suspect_name...
}

/** Trava em memória para quando o storage falha (navegação privada restrita). */
const memorySteps = new Map<string, number[]>();

function readSteps(storage: Storage | null, submissionId: string): number[] {
  if (!storage) return memorySteps.get(submissionId) ?? [];
  try {
    const saved = JSON.parse(storage.getItem(STEPS_KEY) ?? "null") as { id?: string; steps?: number[] } | null;
    return saved?.id === submissionId && Array.isArray(saved.steps) ? saved.steps : [];
  } catch {
    return memorySteps.get(submissionId) ?? []; // storage bloqueado
  }
}

function readSent(storage: Storage | null): string[] {
  try {
    return JSON.parse(storage?.getItem(LEAD_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function safeSession(w: Window): Storage | null {
  try {
    return w.sessionStorage;
  } catch {
    return null;
  }
}
