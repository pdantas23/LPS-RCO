import { describe, expect, it } from "vitest";
import { buildCommercialMessage, buildCrmPayload, describeOrigin, type LeadRecord } from "./lead-dispatch";

const lead: LeadRecord = {
  id: "L1",
  full_name: "Maria da Silva",
  whatsapp: "5562998765432",
  whatsapp_confirmation_status: "confirmado_visualmente",
  niche: "outro",
  niche_other: "Pet shop",
  revenue_range: "10k_30k",
  source_page: "https://bio.rcohub.com/",
  conversion_page: "https://lp.rcohub.com/formulario/",
  landing_page_version: "p02-formulario-v1",
  utm_source: "instagram",
  utm_medium: "bio",
  utm_campaign: "performance",
  utm_content: null,
  utm_term: null,
  gclid: null,
  fbclid: "ABC",
  created_at: "2026-09-27T12:00:00Z",
};

describe("integrações (contratos)", () => {
  it("mensagem do comercial no formato do briefing", () => {
    expect(buildCommercialMessage(lead, "https://crm.rcohub.com/contacts/1")).toBe(
      "Novo contato | Performance\n\nNome: Maria da Silva\nOrigem: instagram / bio / performance\nFicha: https://crm.rcohub.com/contacts/1",
    );
    expect(buildCommercialMessage(lead, null)).toContain("Ficha: (link do CRM pendente)");
  });

  it("origem sem campanha cai para a página de origem, depois para acesso direto", () => {
    const semUtm = { ...lead, utm_source: null, utm_medium: null, utm_campaign: null };
    expect(describeOrigin(semUtm)).toBe("bio.rcohub.com");
    expect(describeOrigin({ ...semUtm, source_page: null, fbclid: null })).toBe("acesso direto");
  });

  it("payload do CRM leva serviço, origem completa e lead_id para idempotência", () => {
    const p = buildCrmPayload(lead);
    expect(p).toMatchObject({
      lead_id: "L1",
      phone: "5562998765432",
      service_of_interest: "performance",
      niche: "Outro: Pet shop",
      revenue_range: "De R$ 10.000 até R$ 30.000",
      origin: { utm_source: "instagram", fbclid: "ABC", source_page: "https://bio.rcohub.com/" },
    });
  });
});
