/**
 * Eventos da P02 no dataLayer (mesmo padrão da Bio). Regras:
 * - nenhum valor digitado entra aqui: só nomes de etapa, códigos de erro e o nome do formulário;
 * - generate_lead só é chamado depois que o servidor confirmou o salvamento;
 * - cada evento tem sua trava contra duplicidade (ver abaixo).
 */
import { FORM_NAME } from "../formulario/config";

export const PAGE_TYPE = "performance_form";

type Event = Record<string, string | number>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}


const LEAD_KEY = "rco_p02_lead_enviado";
const STEPS_KEY = "rco_p02_etapas";

export interface Tracker {
  pageView(): void;
  formStart(): void;
  /** step: posição da tela (1 = primeira pergunta); stepName: id estável da tela (ver SCREENS). */
  formStep(step: number, stepName: string, submissionId: string): void;
  formError(errorType: string): void;
  generateLead(submissionId: string): void;
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
    pageView() {
      if (viewed) return;
      viewed = true;
      push({ event: "page_view", page_type: PAGE_TYPE });
    },
    formStart() {
      if (started) return;
      started = true;
      push({ event: "form_start", page_type: PAGE_TYPE, form_name: FORM_NAME });
    },
    formStep(step, stepName, submissionId) {
      const done = readSteps(storage, submissionId);
      if (done.includes(step)) return;
      push({ event: "form_step", page_type: PAGE_TYPE, form_name: FORM_NAME, step, step_name: stepName });
      memorySteps.set(submissionId, [...done, step]);
      try {
        storage?.setItem(STEPS_KEY, JSON.stringify({ id: submissionId, steps: [...done, step] }));
      } catch {
        /* sem storage: vale só a trava em memória deste carregamento */
      }
    },
    formError(errorType) {
      push({ event: "form_error", page_type: PAGE_TYPE, form_name: FORM_NAME, error_type: errorType });
    },
    generateLead(submissionId) {
      const sent = readSent(storage);
      if (sent.includes(submissionId)) return;
      push({ event: "generate_lead", page_type: PAGE_TYPE, form_name: FORM_NAME });
      try {
        storage?.setItem(LEAD_KEY, JSON.stringify([...sent, submissionId].slice(-20)));
      } catch {
        /* sem storage: a trava em memória do fluxo (status success) ainda impede repetir */
      }
    },
  };
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
