import type { Tracking } from "./tracking";
import { TRACKING_KEYS } from "./tracking";

// ============================================================
// Contrato com o COMERCIAL-RCO: POST /api/webhooks/leads/respondi/<token>.
// É o mesmo webhook que a Respondi usa; por isso o corpo tem o formato do
// payload dela. Documentado no repositório COMERCIAL-RCO em
// docs/integracao-lps-p04-p05.md. Se mexer aqui, confira lá.
//
// Regras que vêm do lado de lá:
//   - as chaves de `answers` têm que ser IGUAIS ao rótulo das perguntas
//     mapeadas na integração (Configurações → Integrações → Respondi);
//   - `respondent_id` é a chave de idempotência (mesmo id = mesmo lead);
//   - só `WhatsApp` é obrigatório; valor vazio deve ser omitido;
//   - resposta 200 NÃO significa lead criado: ver classifyCrmResponse.
// ============================================================

/** Rótulos exatos das perguntas, como estão mapeadas no COMERCIAL. */
export const ANSWER_KEYS = {
  nome: "Nome",
  whatsapp: "WhatsApp",
  email: "Email",
  nicho: "Nicho",
  faturamento: "Faturamento",
  origem: "Página de origem",
  /** Só /lp-ecom. */
  investimento: "Investimento em anúncio",
  perfil: "Perfil",
} as const;

export interface PageMeta {
  /** "P04" | "P05": vira o valor de "Página de origem". */
  id: string;
  /** Identificador do formulário, ex.: "lp-p04". */
  formId: string;
  /** Nome do formulário, ex.: "LP P04 · Performance com VSL". */
  formName: string;
}

export interface RespondiBody {
  form: { form_id: string; form_name: string };
  respondent: {
    respondent_id: string;
    status: "completed";
    answers: Record<string, string>;
  };
}

export interface BuildPayloadInput {
  page: PageMeta;
  respondentId: string;
  lead: {
    name: string;
    /** Já normalizado: 55 + DDD + número. */
    whatsappE164: string;
    email: string;
    nicho: string;
    faturamento: string;
  };
  tracking: Tracking;
}

export function buildRespondiPayload(input: BuildPayloadInput): RespondiBody {
  const { page, respondentId, lead, tracking } = input;
  const answers: Record<string, string> = {
    [ANSWER_KEYS.nome]: lead.name,
    [ANSWER_KEYS.whatsapp]: lead.whatsappE164,
    [ANSWER_KEYS.email]: lead.email,
    [ANSWER_KEYS.nicho]: lead.nicho,
    [ANSWER_KEYS.faturamento]: lead.faturamento,
    [ANSWER_KEYS.origem]: page.id,
  };
  for (const key of TRACKING_KEYS) {
    const value = tracking[key];
    if (value) answers[key] = value;
  }
  return {
    form: { form_id: page.formId, form_name: page.formName },
    respondent: { respondent_id: respondentId, status: "completed", answers },
  };
}

export interface BuildEcomPayloadInput {
  page: PageMeta;
  respondentId: string;
  lead: {
    name: string;
    whatsappE164: string;
    email: string;
    faturamento: string;
    investimento: string;
    /** Calculado no servidor a partir do faturamento. */
    perfil: "Dentro" | "Fora";
  };
  tracking: Tracking;
}

/** /lp-ecom: chaves Nome, WhatsApp, Email, Faturamento, Investimento em anúncio, Perfil (+ campanha). Sem Nicho e sem Página de origem (a origem é a integração/token). */
export function buildEcomRespondiPayload(input: BuildEcomPayloadInput): RespondiBody {
  const { page, respondentId, lead, tracking } = input;
  const answers: Record<string, string> = {
    [ANSWER_KEYS.nome]: lead.name,
    [ANSWER_KEYS.whatsapp]: lead.whatsappE164,
    [ANSWER_KEYS.email]: lead.email,
    [ANSWER_KEYS.faturamento]: lead.faturamento,
    [ANSWER_KEYS.investimento]: lead.investimento,
    [ANSWER_KEYS.perfil]: lead.perfil,
  };
  for (const key of TRACKING_KEYS) {
    const value = tracking[key];
    if (value) answers[key] = value;
  }
  return {
    form: { form_id: page.formId, form_name: page.formName },
    respondent: { respondent_id: respondentId, status: "completed", answers },
  };
}

// ---------------- cliente HTTP ----------------

export type CrmResult =
  /** Lead entrou (ou já tinha entrado). `warning` = entrou, mas houve erro ao processar. */
  | { kind: "sent"; httpStatus: number; duplicate: boolean; warning?: string; body: unknown }
  /** Falha passageira: tentar de novo depois. */
  | { kind: "retry"; reason: string; retryAfterMs?: number; httpStatus?: number }
  /** Falha definitiva: repetir não adianta (erro de configuração ou de dado). */
  | { kind: "failed"; reason: string; httpStatus?: number; body?: unknown };

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/**
 * Traduz a resposta do COMERCIAL. Regra que pega de surpresa: o webhook
 * responde 200 até quando NÃO virou lead, para a Respondi não reenviar. O
 * corpo é quem diz o que houve:
 *   {ok:true, contact_id}                 → entrou
 *   {ok:true, duplicate:true}             → já tinha entrado (idempotência)
 *   {ok:true, ignored:"no_phone" | ...}   → NÃO entrou (mapeamento/config)
 *   {ok:true, warning:"processing_error"} → registrou, mas o processamento
 *       falhou; reenviar devolve "duplicate", então não adianta tentar de novo.
 */
export function classifyCrmResponse(
  status: number,
  body: unknown,
  headers?: { get(name: string): string | null },
): CrmResult {
  const rec = asRecord(body);

  if (status === 200) {
    if (rec?.ignored) {
      return { kind: "failed", reason: `COMERCIAL ignorou o lead (${String(rec.ignored)})`, httpStatus: status, body };
    }
    if (rec?.ok === true) {
      const warning = typeof rec.warning === "string" ? rec.warning : undefined;
      return { kind: "sent", httpStatus: status, duplicate: rec.duplicate === true, warning, body };
    }
    return { kind: "failed", reason: "resposta 200 fora do contrato", httpStatus: status, body };
  }
  if (status === 429) {
    const ra = Number(headers?.get("retry-after"));
    return {
      kind: "retry",
      reason: "COMERCIAL limitou a taxa (429)",
      retryAfterMs: Number.isFinite(ra) && ra > 0 ? ra * 1000 : undefined,
      httpStatus: status,
    };
  }
  if (status === 408 || status >= 500) {
    return { kind: "retry", reason: `COMERCIAL indisponível (HTTP ${status})`, httpStatus: status };
  }
  if (status === 404) {
    return { kind: "failed", reason: "token da integração não existe (404)", httpStatus: status, body };
  }
  return { kind: "failed", reason: `COMERCIAL recusou (HTTP ${status})`, httpStatus: status, body };
}

export interface PostLeadArgs {
  /** Ex.: https://comercial.rcoacademy.com.br (sem barra no fim). */
  baseUrl: string;
  /** Token da integração. SEGREDO: nunca logar nem devolver ao browser. */
  token: string;
  body: RespondiBody;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** Nunca lança: erro de rede e timeout viram `retry`. */
export async function postLeadToComercial(args: PostLeadArgs): Promise<CrmResult> {
  const { baseUrl, token, body, timeoutMs = 6000, fetchImpl = fetch } = args;
  const url = `${baseUrl.replace(/\/+$/, "")}/api/webhooks/leads/respondi/${encodeURIComponent(token)}`;
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }
    return classifyCrmResponse(res.status, parsed, res.headers);
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const reason =
      name === "TimeoutError" || name === "AbortError"
        ? `COMERCIAL não respondeu em ${timeoutMs} ms`
        : `falha de rede ao falar com o COMERCIAL (${err instanceof Error ? err.message : "erro"})`;
    // O texto de erro do fetch pode conter a URL (e portanto o token): tira.
    return { kind: "retry", reason: reason.split(token).join("<token>") };
  }
}
