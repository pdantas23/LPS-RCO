import type { Tracking } from "@rco/lead-core/tracking";
import type { PageId } from "@/content/pages";
import { track } from "@/lib/tracking/events";

// Envio do formulário ao servidor + o que vai ao dataLayer em cada desfecho.
// Fica fora do componente para ser testável sem navegador.

export interface LeadValues {
  name: string;
  whatsapp: string;
  email: string;
  nicho: string;
  faturamento: string;
  website?: string;
}

export interface EcomLeadValues {
  name: string;
  whatsapp: string;
  email: string;
  faturamento: string;
  investimento: string;
  website?: string;
}

export type SubmitOutcome =
  | { kind: "done" }
  | { kind: "field_errors"; errors: Record<string, string> }
  | { kind: "error"; message: string };

export async function submitLead(args: {
  values: LeadValues | EcomLeadValues;
  respondentId: string;
  page: PageId;
  tracking: Tracking;
  fetchFn?: typeof fetch;
}): Promise<SubmitOutcome> {
  const { values, respondentId, page, tracking } = args;
  const doFetch = args.fetchFn ?? fetch;
  try {
    const res = await doFetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, respondentId, page, tracking }),
    });
    if (res.ok) {
      // Só categorias e o id da tentativa: nome, WhatsApp e email NUNCA vão ao dataLayer.
      // Mesmo evento em todas as LPs. A /lp-ecom não tem nicho (parâmetro omitido).
      track("generate_lead", {
        page_id: page,
        ...("nicho" in values ? { nicho: values.nicho } : {}),
        faturamento: values.faturamento,
        event_id: respondentId,
      });
      return { kind: "done" };
    }
    if (res.status === 422) {
      const body = (await res.json().catch(() => null)) as { errors?: Record<string, string> } | null;
      const errors = body?.errors ?? {};
      track("form_error", { page_id: page, error_type: "validation", fields: Object.keys(errors).join(",") });
      return { kind: "field_errors", errors };
    }
    if (res.status === 429) {
      track("form_error", { page_id: page, error_type: "rate_limit" });
      return { kind: "error", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    }
    track("form_error", { page_id: page, error_type: "server" });
    return { kind: "error", message: "Não foi possível enviar agora. Tente novamente em instantes." };
  } catch {
    track("form_error", { page_id: page, error_type: "network" });
    return { kind: "error", message: "Sem conexão. Verifique sua internet e tente novamente." };
  }
}
