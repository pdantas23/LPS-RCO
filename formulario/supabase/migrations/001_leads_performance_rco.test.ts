// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb, rpcAsAnon } from "../../dev/test-db";

let db: PGlite;
beforeEach(async () => {
  db = await createTestDb();
});

const base = (over: Record<string, unknown> = {}) => ({
  submission_id: crypto.randomUUID(),
  full_name: "  Maria   da Silva ",
  whatsapp: "(62) 99876-5432",
  whatsapp_confirmation_status: "confirmado_visualmente",
  niche: "servicos",
  revenue_range: "faixa_1",
  // Perguntas da v2 (migration 003).
  email: "maria@empresa.com.br",
  instagram: "@empresa",
  employees: "2_3",
  partner: null,
  sales_challenge: "nao_converte",
  urgency: "imediato",
  ads_experience: "nunca",
  source_page: "https://bio.rcohub.com/",
  conversion_page: "https://lp.rcohub.com/formulario/",
  landing_page_version: "p02-v1",
  utm_source: "instagram",
  utm_medium: "bio",
  utm_campaign: "performance",
  utm_content: "story",
  utm_term: "crm",
  gclid: "G1",
  fbclid: "ABC",
  ...over,
});

const count = async () =>
  (await db.query<{ n: number }>("select count(*)::int n from leads_performance_rco")).rows[0].n;

describe("capturar_lead_performance_rco", () => {
  it("salva o lead normalizado com a origem completa e fila pendente", async () => {
    const r = await rpcAsAnon(db, base());
    expect(r).toMatchObject({ ok: true, duplicate: false });
    const row = (await db.query<Record<string, unknown>>("select * from leads_performance_rco")).rows[0];
    expect(row).toMatchObject({
      full_name: "Maria da Silva",
      whatsapp: "5562998765432",
      whatsapp_confirmation_status: "confirmado_visualmente",
      niche: "servicos",
      revenue_range: "faixa_1",
      utm_source: "instagram",
      utm_medium: "bio",
      utm_campaign: "performance",
      utm_content: "story",
      utm_term: "crm",
      gclid: "G1",
      fbclid: "ABC",
      source_page: "https://bio.rcohub.com/",
      landing_page_version: "p02-v1",
      crm_status: "pendente",
      notify_status: "pendente",
    });
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it("idempotência: o mesmo submission_id não cria duplicado", async () => {
    const payload = base();
    const a = await rpcAsAnon(db, payload);
    const b = await rpcAsAnon(db, payload);
    const c = await rpcAsAnon(db, { ...payload, full_name: "Outro Nome" });
    expect(a.duplicate).toBe(false);
    expect(b).toEqual({ ok: true, lead_id: a.lead_id, duplicate: true });
    expect(c.lead_id).toBe(a.lead_id);
    expect(await count()).toBe(1);
  });

  it("submissões diferentes do mesmo número entram (novo interesse), até o freio de 3 em 10 min", async () => {
    for (let i = 0; i < 3; i++) expect((await rpcAsAnon(db, base())).ok).toBe(true);
    expect(await rpcAsAnon(db, base())).toEqual({ ok: false, error: "rate_limited" });
    expect(await count()).toBe(3);
  });

  it("freio: outro número não é afetado, retry do mesmo envio passa e a janela de 10 min expira", async () => {
    const first = base();
    await rpcAsAnon(db, first);
    for (let i = 0; i < 2; i++) await rpcAsAnon(db, base());
    expect((await rpcAsAnon(db, base())).error).toBe("rate_limited");
    expect((await rpcAsAnon(db, base({ whatsapp: "11987654321" }))).ok).toBe(true);
    // Retry de um envio já gravado responde duplicate antes do freio.
    expect(await rpcAsAnon(db, first)).toMatchObject({ ok: true, duplicate: true });

    await db.exec("update leads_performance_rco set created_at = created_at - interval '10 minutes 1 second'");
    expect((await rpcAsAnon(db, base())).ok).toBe(true);
  });

  it.each([
    [{ full_name: "   " }, "invalid_name"],
    [{ full_name: "x".repeat(121) }, "invalid_name"],
    [{ whatsapp: "" }, "invalid_whatsapp"],
    [{ whatsapp: "(62) 8876-543" }, "invalid_whatsapp"],
    [{ whatsapp: "(00) 99876-5432" }, "invalid_whatsapp"],
    [{ whatsapp: "(62) 89876-5432" }, "invalid_whatsapp"],
    [{ whatsapp_confirmation_status: undefined }, "whatsapp_not_confirmed"],
    [{ whatsapp_confirmation_status: "verificado_codigo" }, "whatsapp_not_confirmed"],
    [{ niche: "" }, "invalid_niche"],
    [{ niche: "<script>" }, "invalid_niche"],
    [{ niche: "outro", niche_other: "  " }, "missing_niche_other"],
    [{ revenue_range: "" }, "invalid_revenue_range"],
    [{ email: "" }, "invalid_email"],
    [{ email: "maria@empresa" }, "invalid_email"],
    [{ email: "maria @empresa.com" }, "invalid_email"],
    [{ instagram: "" }, "invalid_instagram"],
    [{ instagram: "empresa" }, "invalid_instagram"],
    [{ instagram: "@em presa" }, "invalid_instagram"],
    [{ employees: "" }, "invalid_employees"],
    [{ partner: "x".repeat(201) }, "invalid_partner"],
    [{ sales_challenge: "" }, "invalid_sales_challenge"],
    [{ urgency: "<b>" }, "invalid_urgency"],
    [{ ads_experience: undefined }, "invalid_ads_experience"],
    [{ submission_id: "nao-e-uuid" }, "invalid_submission_id"],
    [{ website: "http://spam" }, "rejected"],
  ])("valida no servidor: %o → %s", async (over, error) => {
    const r = await rpcAsAnon(db, base(over));
    expect(r.ok).toBe(false);
    expect(r.error).toBe(error);
    expect(await count()).toBe(0);
  });

  it("perguntas da v2: gravadas normalizadas; sócio é opcional", async () => {
    await rpcAsAnon(db, base({ email: "  Maria@Empresa.com.br ", instagram: " @Empresa.Oficial ", partner: "  João   (sócio) " }));
    await rpcAsAnon(db, base({ whatsapp: "11912345678", partner: "   " }));
    const rows = (await db.query<Record<string, string | null>>(
      "select email, instagram, employees, partner, sales_challenge, urgency, ads_experience from leads_performance_rco order by whatsapp desc",
    )).rows;
    expect(rows[0]).toEqual({
      email: "Maria@Empresa.com.br",
      instagram: "@empresa.oficial",
      employees: "2_3",
      partner: "João (sócio)",
      sales_challenge: "nao_converte",
      urgency: "imediato",
      ads_experience: "nunca",
    });
    expect(rows[1].partner).toBeNull();
  });

  it("aceita telefone fixo (10 dígitos) e número já com 55", async () => {
    expect((await rpcAsAnon(db, base({ whatsapp: "(62) 3212-3456" }))).ok).toBe(true);
    expect((await rpcAsAnon(db, base({ whatsapp: "+55 11 91234-5678" }))).ok).toBe(true);
    const nums = (await db.query<{ whatsapp: string }>("select whatsapp from leads_performance_rco order by whatsapp")).rows;
    expect(nums.map((r) => r.whatsapp)).toEqual(["5511912345678", "556232123456"]);
  });

  it("nicho 'outro' guarda o texto; outro nicho descarta niche_other", async () => {
    await rpcAsAnon(db, base({ niche: "outro", niche_other: " Pet shop " }));
    await rpcAsAnon(db, base({ niche: "servicos", niche_other: "ignorado", whatsapp: "11912345678" }));
    const rows = (await db.query<{ niche: string; niche_other: string | null }>(
      "select niche, niche_other from leads_performance_rco order by niche",
    )).rows;
    expect(rows).toEqual([{ niche: "outro", niche_other: "Pet shop" }, { niche: "servicos", niche_other: null }]);
  });

  it("não rejeita por faturamento ou nicho (sem regra de qualificação)", async () => {
    expect((await rpcAsAnon(db, base({ revenue_range: "ate_10_mil", niche: "qualquer_um" }))).ok).toBe(true);
  });

  it("origem longa é cortada, nunca derruba o lead; campo vazio vira null", async () => {
    const r = await rpcAsAnon(db, base({ utm_campaign: "x".repeat(1000), gclid: "", fbclid: null }));
    expect(r.ok).toBe(true);
    const row = (await db.query<{ c: number; gclid: null; fbclid: null }>(
      "select char_length(utm_campaign) c, gclid, fbclid from leads_performance_rco",
    )).rows[0];
    expect(row).toEqual({ c: 300, gclid: null, fbclid: null });
  });

  it("anônimo só alcança a função: tabela e helper fechados", async () => {
    const privs = (await db.query<Record<string, boolean>>(`select
      has_table_privilege('anon', 'public.leads_performance_rco', 'select') anon_select,
      has_table_privilege('anon', 'public.leads_performance_rco', 'insert') anon_insert,
      has_table_privilege('authenticated', 'public.leads_performance_rco', 'select') auth_select,
      has_function_privilege('anon', 'public.capturar_lead_performance_rco(jsonb)', 'execute') anon_rpc,
      has_function_privilege('authenticated', 'public.capturar_lead_performance_rco(jsonb)', 'execute') auth_rpc,
      has_function_privilege('anon', 'public._texto_opcional_rco(text, integer)', 'execute') anon_helper`)).rows[0];
    expect(privs).toEqual({
      anon_select: false,
      anon_insert: false,
      auth_select: false,
      anon_rpc: true,
      auth_rpc: false,
      anon_helper: false,
    });
  });
});
