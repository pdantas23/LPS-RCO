import { describe, expect, it } from "vitest";
import { createEcomFormSchema, createEcomLeadSchema, createLeadFormSchema, createLeadSchema, fieldErrors } from "./schema";
import { sanitizeTracking, trackingFromSearchParams } from "./tracking";

const schema = createLeadSchema({
  pages: ["P04", "P05"],
  nichos: ["Estética", "Odontologia", "Outro"],
  faturamentos: ["Até R$ 30 mil", "Acima de R$ 100 mil"],
});

const valido = {
  respondentId: "5f0c2a4e-9d1b-4c53-8a77-2b6f0d1e9a10",
  page: "P04",
  name: "  Maria   Souza ",
  whatsapp: "(11) 99999-8888",
  email: "maria@exemplo.com",
  nicho: "Estética",
  faturamento: "Até R$ 30 mil",
};

describe("createLeadSchema", () => {
  it("aceita um envio válido e limpa o nome", () => {
    const r = schema.safeParse(valido);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("Maria Souza");
  });

  it("recusa telefone inválido com mensagem em português", () => {
    const r = schema.safeParse({ ...valido, whatsapp: "123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).whatsapp).toMatch(/WhatsApp/);
  });

  it.each([
    ["página fora da lista", { page: "P99" }, "page"],
    ["nicho fora da lista", { nicho: "Inventado" }, "nicho"],
    ["faturamento fora da lista", { faturamento: "R$ 1" }, "faturamento"],
    ["id de envio inválido", { respondentId: "abc" }, "respondentId"],
    ["nome curto", { name: "A" }, "name"],
    ["nome com link", { name: "veja http://x.com" }, "name"],
    ["nome com e-mail", { name: "a@b.com" }, "name"],
    ["email sem @", { email: "mariaexemplo.com" }, "email"],
    ["email vazio", { email: "" }, "email"],
  ])("recusa: %s", (_l, override, campo) => {
    const r = schema.safeParse({ ...valido, ...override });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error)).toHaveProperty(campo);
  });

  it("aceita o honeypot vazio ou ausente (a decisão de descartar é do servidor)", () => {
    expect(schema.safeParse({ ...valido, website: "" }).success).toBe(true);
    expect(schema.safeParse({ ...valido, website: "spam" }).success).toBe(true);
  });
});

describe("tracking", () => {
  it("sanitizeTracking mantém só chaves conhecidas, como texto limpo", () => {
    expect(
      sanitizeTracking({
        utm_source: " google ",
        gclid: "Cj0\nKC Q",
        fbclid: "",
        utm_medium: 42,
        outra: "x",
        "__proto__": "y",
      }),
    ).toEqual({ utm_source: "google", gclid: "Cj0 KC Q" });
  });

  it("corta valores gigantes", () => {
    const t = sanitizeTracking({ gclid: "a".repeat(5000) });
    expect(t.gclid?.length).toBe(512);
  });

  it("nunca lança com entrada estranha", () => {
    for (const v of [null, undefined, 1, "x", [], () => 1]) expect(sanitizeTracking(v)).toEqual({});
  });

  it("lê da query string", () => {
    const p = new URLSearchParams("utm_source=meta&fbclid=IwAR&x=1&utm_term=");
    expect(trackingFromSearchParams(p)).toEqual({ utm_source: "meta", fbclid: "IwAR" });
  });
});

describe("createLeadFormSchema (formulário do browser)", () => {
  const form = createLeadFormSchema({
    pages: ["P04", "P05"],
    nichos: ["Estética", "Odontologia", "Outro"],
    faturamentos: ["Até R$ 30 mil", "Acima de R$ 100 mil"],
  });
  const ok = {
    name: "Maria",
    whatsapp: "(11) 99999-8888",
    email: "maria@exemplo.com",
    nicho: "Estética",
    faturamento: "Até R$ 30 mil",
  };

  it("aceita os campos da pessoa", () => {
    expect(form.safeParse(ok).success).toBe(true);
  });
  it("não exige id de envio nem página", () => {
    expect(form.safeParse(ok).success).toBe(true);
  });
});

describe("schemas da /lp-ecom", () => {
  const cfg = { page: "ECOM", faturamentos: ["Até R$ 29.999", "De R$ 30.000 a R$ 49.999"], investimentos: ["Ainda não tenho verba definida", "Até R$ 1.999"] } as const;
  const form = createEcomFormSchema(cfg);
  const ok = { name: "José da Conceição Ávila", whatsapp: "(11) 99999-8888", email: "m@gmail.com", faturamento: "De R$ 30.000 a R$ 49.999", investimento: "Até R$ 1.999" };

  it("aceita nome composto com acento e email não corporativo", () => {
    expect(form.safeParse(ok).success).toBe(true);
  });
  it("não pede confirmação de WhatsApp", () => {
    expect("whatsappConfirm" in (form.safeParse(ok) as { data: object }).data).toBe(false);
  });
  it.each(["(00) 99999-8888", "(10) 99999-8888", "123"])("WhatsApp inválido (DDD ou tamanho): %s", (whatsapp) => {
    expect(form.safeParse({ ...ok, whatsapp }).success).toBe(false);
  });
  it.each(["maria", "maria@loja", "maria@loja.", "@loja.com", "maria loja@x.com", "maria@-loja.com"])("email inválido: %s", (email) => {
    expect(form.safeParse({ ...ok, email }).success).toBe(false);
  });
  it("servidor: página tem de ser ECOM e faixas têm de estar na lista", () => {
    const srv = createEcomLeadSchema(cfg);
    const base = { ...ok, respondentId: "5f0c2a4e-9d1b-4c53-8a77-2b6f0d1e9a10", page: "ECOM" };
    expect(srv.safeParse(base).success).toBe(true);
    expect(srv.safeParse({ ...base, page: "P04" }).success).toBe(false);
    expect(srv.safeParse({ ...base, investimento: "x" }).success).toBe(false);
  });
});
