/**
 * Rascunho na sessão do próprio navegador: sobrevive a reload e mantém o mesmo
 * submission_id até o servidor confirmar o salvamento. Nunca vai para URL nem analytics.
 * Apagado assim que o lead é salvo.
 */
import { SCREENS } from "../formulario/config";
import { emptyForm, type FormData } from "./validation";

// v3: uma pergunta por tela, confirmação do WhatsApp por último (rascunhos de versões antigas não são reaproveitados).
const KEY = "rco_p02_rascunho_v3";

export interface Draft {
  submissionId: string;
  /** Tela atual: 0 = primeira pergunta … SCREENS.length - 1 = confirmação do WhatsApp (envia). */
  step: number;
  data: FormData;
  /** Dados do último envio com este submissionId (ver submissionIdFor em form.ts). */
  sentFingerprint?: string;
}

export function newSubmissionId(): string {
  return crypto.randomUUID();
}

export function loadDraft(storage: Storage | null): Draft {
  try {
    const raw = storage?.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Draft>;
      if (typeof d.submissionId === "string" && d.data) {
        return {
          submissionId: d.submissionId,
          step: Number.isInteger(d.step) && d.step! >= 0 && d.step! < SCREENS.length ? d.step! : 0,
          data: { ...emptyForm(), ...d.data },
          sentFingerprint: typeof d.sentFingerprint === "string" ? d.sentFingerprint : undefined,
        };
      }
    }
  } catch {
    /* rascunho corrompido: começa do zero */
  }
  return { submissionId: newSubmissionId(), step: 0, data: emptyForm() };
}

export function saveDraft(storage: Storage | null, draft: Draft): void {
  try {
    storage?.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* sem storage: o formulário funciona, só não sobrevive a reload */
  }
}

export function clearDraft(storage: Storage | null): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    /* nada a fazer */
  }
}
