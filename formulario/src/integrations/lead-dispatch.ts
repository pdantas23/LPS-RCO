/**
 * Contratos das integrações que rodam DEPOIS do lead salvo (fila em
 * leads_performance_rco: crm_status / notify_status = 'pendente').
 *
 * CRM: resolvido no banco — migration 002 (despachar_leads_crm_rco, pg_cron) envia para o
 * webhook "Landing Pages" do CRM comercial no formato Respondi. buildCrmPayload abaixo é o
 * rascunho antigo e NÃO é o que vai para o CRM.
 * PENDENTE (RCO): aviso ao grupo fora do CRM (notify_status) e regra de distribuição.
 */
import { NICHES, NICHE_OTHER, REVENUE_RANGES, labelOf } from "../formulario/config";

/** Linha de leads_performance_rco (campos usados pelas integrações). */
export interface LeadRecord {
  id: string;
  full_name: string;
  whatsapp: string;
  whatsapp_confirmation_status: string;
  niche: string;
  niche_other: string | null;
  revenue_range: string;
  source_page: string | null;
  conversion_page: string | null;
  landing_page_version: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  created_at: string;
}

export const SERVICE_OF_INTEREST = "performance";

/** Origem legível: campanha quando existe; senão a página de onde veio; senão "acesso direto". */
export function describeOrigin(lead: LeadRecord): string {
  const campaign = [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ");
  if (campaign) return campaign;
  if (lead.source_page) {
    try {
      const u = new URL(lead.source_page);
      return u.host + (u.pathname === "/" ? "" : u.pathname);
    } catch {
      return lead.source_page;
    }
  }
  if (lead.gclid) return "Google Ads";
  if (lead.fbclid) return "Meta";
  return "acesso direto";
}

/**
 * Payload para o CRM. Casamento pelo telefone: contato existente recebe um NOVO interesse
 * (sem apagar histórico); contato novo é criado. O lead_id permite ao CRM ser idempotente.
 */
export function buildCrmPayload(lead: LeadRecord) {
  return {
    lead_id: lead.id,
    phone: lead.whatsapp,
    name: lead.full_name,
    service_of_interest: SERVICE_OF_INTEREST,
    whatsapp_confirmation_status: lead.whatsapp_confirmation_status,
    niche: lead.niche === NICHE_OTHER && lead.niche_other ? `Outro: ${lead.niche_other}` : labelOf(NICHES, lead.niche),
    revenue_range: labelOf(REVENUE_RANGES, lead.revenue_range),
    origin: {
      source_page: lead.source_page,
      conversion_page: lead.conversion_page,
      landing_page_version: lead.landing_page_version,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
      gclid: lead.gclid,
      fbclid: lead.fbclid,
    },
    submitted_at: lead.created_at,
  };
}

/** Aviso ao grupo INTERNO do comercial. O visitante nunca entra nesse grupo. */
export function buildCommercialMessage(lead: LeadRecord, fichaUrl: string | null): string {
  return [
    "Novo contato | Performance",
    "",
    `Nome: ${lead.full_name}`,
    `Origem: ${describeOrigin(lead)}`,
    `Ficha: ${fichaUrl ?? "(link do CRM pendente)"}`,
  ].join("\n");
}
