import { describe, expect, it, vi } from "vitest";
import { ANSWER_KEYS, buildRespondiPayload, classifyCrmResponse, postLeadToComercial } from "./respondi";

const page = { id: "P04", formId: "lp-p04", formName: "LP P04 · Performance com VSL" };
const base = {
  page,
  respondentId: "5f0c2a4e-9d1b-4c53-8a77-2b6f0d1e9a10",
  lead: {
    name: "Maria Souza",
    whatsappE164: "5511999998888",
    email: "maria@exemplo.com",
    nicho: "Estética",
    faturamento: "Até R$ 30 mil",
  },
};

describe("buildRespondiPayload (contrato com o COMERCIAL-RCO)", () => {
  it("usa exatamente os rótulos mapeados lá", () => {
    expect(ANSWER_KEYS).toMatchObject({
      nome: "Nome",
      whatsapp: "WhatsApp",
      email: "Email",
      nicho: "Nicho",
      faturamento: "Faturamento",
      origem: "Página de origem",
    });
  });

  it("monta o corpo no formato da Respondi, com origem fixa da página", () => {
    const body = buildRespondiPayload({
      ...base,
      tracking: { utm_source: "google", utm_medium: "cpc", gclid: "Cj0KCQ" },
    });
    expect(body.form).toEqual({ form_id: "lp-p04", form_name: "LP P04 · Performance com VSL" });
    expect(body.respondent.respondent_id).toBe(base.respondentId);
    expect(body.respondent.status).toBe("completed");
    expect(body.respondent.answers).toMatchObject({
      Nome: "Maria Souza",
      WhatsApp: "5511999998888",
      Email: "maria@exemplo.com",
      Nicho: "Estética",
      Faturamento: "Até R$ 30 mil",
      "Página de origem": "P04",
      utm_source: "google",
      utm_medium: "cpc",
      gclid: "Cj0KCQ",
    });
  });

  it("omite rastreamento vazio (não manda chave sem valor)", () => {
    const { answers } = buildRespondiPayload({ ...base, tracking: {} }).respondent;
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"]) {
      expect(answers).not.toHaveProperty(k);
    }
  });

  it("o WhatsApp vai só com dígitos e DDI", () => {
    const { answers } = buildRespondiPayload({ ...base, tracking: {} }).respondent;
    expect(answers.WhatsApp).toMatch(/^55\d{11}$/);
  });
});

describe("classifyCrmResponse", () => {
  const h = (v?: string) => ({ get: (n: string) => (n.toLowerCase() === "retry-after" ? (v ?? null) : null) });

  it("200 com ok:true entrou", () => {
    expect(classifyCrmResponse(200, { ok: true, contact_id: "c", deal_id: "d" })).toMatchObject({ kind: "sent", duplicate: false });
  });
  it("200 duplicate conta como entregue (idempotência)", () => {
    expect(classifyCrmResponse(200, { ok: true, duplicate: true })).toMatchObject({ kind: "sent", duplicate: true });
  });
  it.each(["no_phone", "unparseable", "disabled"])("200 ignored:%s NÃO é sucesso", (ignored) => {
    expect(classifyCrmResponse(200, { ok: true, ignored })).toMatchObject({ kind: "failed" });
  });
  it("200 com warning entra, marcado pra atenção", () => {
    expect(classifyCrmResponse(200, { ok: true, warning: "processing_error" })).toMatchObject({ kind: "sent", warning: "processing_error" });
  });
  it("200 fora do contrato é falha (não some em silêncio)", () => {
    expect(classifyCrmResponse(200, { qualquer: 1 })).toMatchObject({ kind: "failed" });
    expect(classifyCrmResponse(200, null)).toMatchObject({ kind: "failed" });
  });
  it("404 (token inexistente) é definitivo", () => {
    expect(classifyCrmResponse(404, { error: "x" })).toMatchObject({ kind: "failed" });
  });
  it.each([400, 401, 403, 413])("HTTP %i é definitivo", (s) => {
    expect(classifyCrmResponse(s, {})).toMatchObject({ kind: "failed" });
  });
  it.each([408, 500, 502, 503, 504])("HTTP %i tenta de novo", (s) => {
    expect(classifyCrmResponse(s, null)).toMatchObject({ kind: "retry" });
  });
  it("429 respeita Retry-After", () => {
    expect(classifyCrmResponse(429, null, h("45"))).toMatchObject({ kind: "retry", retryAfterMs: 45_000 });
    expect(classifyCrmResponse(429, null, h())).toMatchObject({ kind: "retry", retryAfterMs: undefined });
  });
});

describe("postLeadToComercial", () => {
  const body = buildRespondiPayload({ ...base, tracking: {} });
  const res = (status: number, json: unknown) => new Response(JSON.stringify(json), { status });

  it("chama a URL do webhook com o token e o corpo em JSON", async () => {
    const fetchImpl = vi.fn(async () => res(200, { ok: true, contact_id: "c" }));
    const r = await postLeadToComercial({ baseUrl: "https://comercial.exemplo/", token: "tok/1", body, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.kind).toBe("sent");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://comercial.exemplo/api/webhooks/leads/respondi/tok%2F1");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body)).respondent.respondent_id).toBe(base.respondentId);
  });

  it("erro de rede vira retry e NÃO vaza o token na mensagem", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("connect ECONNREFUSED https://x/api/webhooks/leads/respondi/SEGREDO123");
    });
    const r = await postLeadToComercial({ baseUrl: "https://x", token: "SEGREDO123", body, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.kind).toBe("retry");
    expect(JSON.stringify(r)).not.toContain("SEGREDO123");
  });

  it("timeout vira retry", async () => {
    const fetchImpl = vi.fn(async () => {
      const e = new Error("aborted");
      e.name = "TimeoutError";
      throw e;
    });
    const r = await postLeadToComercial({ baseUrl: "https://x", token: "t", body, timeoutMs: 50, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({ kind: "retry" });
  });

  it("corpo que não é JSON não derruba: classifica pelo status", async () => {
    const fetchImpl = vi.fn(async () => new Response("<html>bad gateway</html>", { status: 502 }));
    const r = await postLeadToComercial({ baseUrl: "https://x", token: "t", body, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.kind).toBe("retry");
  });
});

describe("buildAnswersRespondiPayload (respostas já com os rótulos do COMERCIAL)", () => {
  it("preserva a ordem e os rótulos, omite vazio e acrescenta só a campanha presente", async () => {
    const { buildAnswersRespondiPayload } = await import("./respondi");
    const body = buildAnswersRespondiPayload({
      page: { id: "SITES", formId: "lp-sites", formName: "LP Sites" },
      respondentId: "5f0c2a4e-9d1b-4c53-8a77-2b6f0d1e9a10",
      answers: { Nome: "Ana", WhatsApp: "5511999998888", Email: "", "Já tem site": "  ", Perfil: "B" },
      tracking: { utm_source: "meta", gclid: "" , fbclid: "fb.1"},
    });
    expect(body.form).toEqual({ form_id: "lp-sites", form_name: "LP Sites" });
    expect(body.respondent.respondent_id).toBe("5f0c2a4e-9d1b-4c53-8a77-2b6f0d1e9a10");
    expect(Object.keys(body.respondent.answers)).toEqual(["Nome", "WhatsApp", "Perfil", "utm_source", "fbclid"]);
  });
});
