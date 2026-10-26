import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileOutbox, createRateLimiter, type CrmResult, type OutboxItem } from "@rco/lead-core/server";
import { handleLeadRequest, type LeadServiceDeps } from "./lead-service";
import { FATURAMENTOS, NICHOS } from "@/content/options";

let dir: string;
let outbox: FileOutbox;
let scheduled: Array<() => Promise<unknown>>;
const T0 = new Date("2026-09-27T12:00:00.000Z");

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "rco-lead-"));
  outbox = new FileOutbox(dir);
  scheduled = [];
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const ok: CrmResult = { kind: "sent", httpStatus: 200, duplicate: false, body: { ok: true } };

function deps(over: Partial<LeadServiceDeps> = {}): LeadServiceDeps {
  return {
    outbox,
    send: vi.fn(async () => ok),
    allowedOrigins: [],
    rateIp: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    ratePhone: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    recentByPhone: new Map(),
    now: () => T0,
    schedule: (t) => void scheduled.push(t),
    log: () => {},
    // Os testes do fluxo valem para qualquer página; a trava das flags tem o bloco próprio no fim do arquivo.
    isPageActive: () => true,
    ...over,
  };
}

function body(over: Record<string, unknown> = {}) {
  return {
    respondentId: crypto.randomUUID(),
    page: "P04",
    name: "Maria Souza",
    whatsapp: "(11) 99999-8888",
    email: "maria@exemplo.com",
    nicho: NICHOS[0],
    faturamento: FATURAMENTOS[1],
    website: "",
    tracking: { utm_source: "google", utm_medium: "cpc", gclid: "Cj0KCQ", ignorado: "x" },
    ...over,
  };
}

function post(payload: unknown, headers: Record<string, string> = {}, raw?: string) {
  return new Request("http://lp.test/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json", host: "lp.test", ...headers },
    body: raw ?? JSON.stringify(payload),
  });
}

const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

describe("POST /api/lead — caminho feliz", () => {
  it("grava na fila ANTES de entregar e responde 200 sem esperar o COMERCIAL", async () => {
    const send = vi.fn(async () => ok);
    const b = body();
    const res = await handleLeadRequest(post(b), deps({ send }));
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ ok: true, id: b.respondentId });
    // já está salvo, e o envio ao COMERCIAL ainda não aconteceu
    expect(outbox.statusOf(b.respondentId as string)).toBe("pending");
    expect(send).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(1);
    // a entrega roda depois da resposta
    await scheduled[0]!();
    expect(send).toHaveBeenCalledTimes(1);
    expect(outbox.statusOf(b.respondentId as string)).toBe("sent");
  });

  it("monta o payload do COMERCIAL: dígitos com DDI, origem da página e rastreamento limpo", async () => {
    const b = body();
    await handleLeadRequest(post(b), deps());
    const item = outbox.get(b.respondentId as string)!;
    const { answers } = item.payload.respondent;
    expect(item.payload.form).toEqual({ form_id: "lp-p04", form_name: "LP P04 · Performance com VSL" });
    expect(answers).toMatchObject({
      Nome: "Maria Souza",
      WhatsApp: "5511999998888",
      "Página de origem": "P04",
      utm_source: "google",
      utm_medium: "cpc",
      gclid: "Cj0KCQ",
    });
    expect(answers).not.toHaveProperty("ignorado");
    expect(answers).not.toHaveProperty("fbclid");
  });

  it("P05 leva 'P05' e o form_id certo", async () => {
    const b = body({ page: "P05" });
    await handleLeadRequest(post(b), deps());
    const item = outbox.get(b.respondentId as string)!;
    expect(item.page).toBe("P05");
    expect(item.payload.form.form_id).toBe("lp-p05");
    expect(item.payload.respondent.answers["Página de origem"]).toBe("P05");
  });
});

describe("POST /api/lead — COMERCIAL fora do ar não perde nem mostra erro", () => {
  it("a pessoa recebe 200 e o lead fica pendente com o motivo", async () => {
    const send = vi.fn(async (): Promise<CrmResult> => ({ kind: "retry", reason: "COMERCIAL indisponível (HTTP 503)" }));
    const b = body();
    const res = await handleLeadRequest(post(b), deps({ send }));
    expect(res.status).toBe(200);
    await scheduled[0]!();
    const item = outbox.get(b.respondentId as string)!;
    expect(item).toMatchObject({ status: "pending", attempts: 1, lastError: "COMERCIAL indisponível (HTTP 503)" });
    expect(item.nextAttemptAt).not.toBeNull();
  });

  it("se NÃO consegue gravar, responde 500 (sem fingir sucesso) e nada é entregue", async () => {
    const broken = { ...outbox, statusOf: () => null, enqueue: () => { throw new Error("disco cheio"); } } as unknown as FileOutbox;
    const send = vi.fn(async () => ok);
    const res = await handleLeadRequest(post(body()), deps({ outbox: broken, send }));
    expect(res.status).toBe(500);
    expect(scheduled).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("POST /api/lead — idempotência", () => {
  it("mesmo respondentId enviado 2x: uma entrada, uma entrega", async () => {
    const b = body();
    const d = deps();
    const r1 = await handleLeadRequest(post(b), d);
    const r2 = await handleLeadRequest(post(b), d);
    expect(r1.status).toBe(200);
    expect(await json(r2)).toMatchObject({ ok: true, duplicate: true });
    expect(scheduled).toHaveLength(1);
    expect(outbox.counts().pending).toBe(1);
  });

  it("mesma pessoa reenviando com OUTRO id logo depois não cria segundo lead", async () => {
    const d = deps();
    const r1 = await handleLeadRequest(post(body()), d);
    const r2 = await handleLeadRequest(post(body()), d);
    expect(r1.status).toBe(200);
    expect(await json(r2)).toMatchObject({ ok: true, duplicate: true });
    expect(outbox.counts().pending).toBe(1);
  });

  it("o mesmo telefone em OUTRA página é um lead separado", async () => {
    const d = deps();
    await handleLeadRequest(post(body({ page: "P04" })), d);
    const r2 = await handleLeadRequest(post(body({ page: "P05" })), d);
    expect(await json(r2)).not.toHaveProperty("duplicate");
    expect(outbox.counts().pending).toBe(2);
  });
});

describe("POST /api/lead — validação e abuso", () => {
  it("422 com erro por campo, sem gravar nada", async () => {
    const res = await handleLeadRequest(post(body({ whatsapp: "123", nicho: "Inventado" })), deps());
    expect(res.status).toBe(422);
    const j = (await json(res)) as { errors: Record<string, string> };
    expect(j.errors).toHaveProperty("whatsapp");
    expect(j.errors).toHaveProperty("nicho");
    expect(outbox.counts().pending).toBe(0);
  });

  it("honeypot preenchido: finge sucesso e descarta", async () => {
    const res = await handleLeadRequest(post(body({ website: "http://spam" })), deps());
    expect(res.status).toBe(200);
    expect(outbox.counts().pending).toBe(0);
    expect(scheduled).toHaveLength(0);
  });

  it("limite por IP: 429 com Retry-After", async () => {
    const d = deps({ rateIp: createRateLimiter({ limit: 1, windowMs: 60_000 }) });
    const h = { "x-forwarded-for": "9.9.9.9" };
    expect((await handleLeadRequest(post(body(), h), d)).status).toBe(200);
    const r = await handleLeadRequest(post(body({ whatsapp: "(21) 98888-7777" }), h), d);
    expect(r.status).toBe(429);
    expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("limite por telefone", async () => {
    const d = deps({ ratePhone: createRateLimiter({ limit: 1, windowMs: 60_000 }), recentByPhone: new Map() });
    await handleLeadRequest(post(body({ page: "P04" }), { "x-forwarded-for": "1.1.1.1" }), d);
    const r = await handleLeadRequest(post(body({ page: "P05" }), { "x-forwarded-for": "2.2.2.2" }), d);
    expect(r.status).toBe(429);
  });

  it("origem de outro site é barrada; a própria origem e as permitidas passam", async () => {
    const d = deps({ allowedOrigins: ["https://lp.exemplo.com"] });
    expect((await handleLeadRequest(post(body(), { origin: "https://evil.example" }), d)).status).toBe(403);
    expect((await handleLeadRequest(post(body(), { origin: "http://lp.test" }), d)).status).toBe(200);
    expect((await handleLeadRequest(post(body(), { origin: "https://lp.exemplo.com" }), d)).status).toBe(200);
  });

  it("corpo grande demais é recusado", async () => {
    const res = await handleLeadRequest(post(null, {}, JSON.stringify({ x: "a".repeat(20_000) })), deps());
    expect(res.status).toBe(413);
  });

  it.each(["not json", "[]", "null", '"texto"'])("JSON inválido (%s) é 400", async (raw) => {
    const res = await handleLeadRequest(post(null, {}, raw), deps());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/lead — o que NUNCA sai", () => {
  it("resposta não traz telefone, nome nem token", async () => {
    const b = body();
    const res = await handleLeadRequest(post(b), deps());
    const text = JSON.stringify(await json(res));
    expect(text).not.toContain("99999");
    expect(text).not.toContain("Maria");
    expect(text).not.toMatch(/token/i);
  });

  it("log não leva telefone inteiro nem nome", async () => {
    const lines: string[] = [];
    await handleLeadRequest(post(body()), deps({ log: (e, d) => lines.push(JSON.stringify({ e, d })) }));
    const all = lines.join("\n");
    expect(all).toContain("***8888");
    expect(all).not.toContain("5511999998888");
    expect(all).not.toContain("Maria");
  });

  it("os arquivos da fila guardam o item sem token (o token só existe no envio)", async () => {
    const b = body();
    await handleLeadRequest(post(b), deps());
    const raw = fs.readFileSync(path.join(dir, "pending", `${b.respondentId}.json`), "utf8");
    expect(raw).not.toMatch(/token/i);
    const item = JSON.parse(raw) as OutboxItem;
    expect(item.status).toBe("pending");
  });
});

describe("POST /api/lead — LP desligada não recebe lead (flags de content/site.ts)", () => {
  const real = { isPageActive: undefined };

  it("P04 (/lp02, desligada): 404, nada gravado e nada enviado ao COMERCIAL", async () => {
    const send = vi.fn(async () => ok);
    const b = body({ page: "P04" });
    const res = await handleLeadRequest(post(b), deps({ ...real, send }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "page_inactive" });
    expect(outbox.get(b.respondentId as string)).toBeNull();
    expect(scheduled).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("P05 (/lp01, ligada): segue o fluxo normal", async () => {
    const b = body({ page: "P05" });
    const res = await handleLeadRequest(post(b), deps(real));
    expect(res.status).toBe(200);
    expect(outbox.get(b.respondentId as string)?.page).toBe("P05");
  });
});

describe("POST /api/lead — /lp-ecom (ECOM)", () => {
  const ecom = (over: Record<string, unknown> = {}) => ({
    respondentId: crypto.randomUUID(),
    page: "ECOM",
    name: "Maria Souza",
    whatsapp: "(11) 99999-8888",
    email: "maria@sualoja.com.br",
    faturamento: "De R$ 50.000 a R$ 79.999",
    investimento: "De R$ 2.000 a R$ 4.999",
    website: "",
    tracking: { utm_source: "meta", fbclid: "abc", gclid: "g1", ignorado: "x" },
    ...over,
  });

  it("payload com as chaves exatas, sem Nicho nem Página de origem, Perfil Dentro", async () => {
    const b = ecom();
    const res = await handleLeadRequest(post(b), deps());
    expect(res.status).toBe(200);
    const item = outbox.get(b.respondentId as string)!;
    expect(item.page).toBe("ECOM");
    expect(item.payload.form).toEqual({ form_id: "lp-ecom", form_name: "LP E-commerce" });
    expect(item.payload.respondent.answers).toEqual({
      Nome: "Maria Souza",
      WhatsApp: "5511999998888",
      Email: "maria@sualoja.com.br",
      Faturamento: "De R$ 50.000 a R$ 79.999",
      "Investimento em anúncio": "De R$ 2.000 a R$ 4.999",
      Perfil: "Dentro",
      utm_source: "meta",
      gclid: "g1",
      fbclid: "abc",
    });
  });

  it("Até R$ 29.999 ENVIA normalmente, com Perfil Fora", async () => {
    const b = ecom({ faturamento: "Até R$ 29.999" });
    const res = await handleLeadRequest(post(b), deps());
    expect(res.status).toBe(200);
    expect(outbox.get(b.respondentId as string)!.payload.respondent.answers.Perfil).toBe("Fora");
  });

  it("o Perfil nunca vem do navegador (campo enviado é ignorado)", async () => {
    const b = ecom({ faturamento: "Até R$ 29.999", Perfil: "Dentro", perfil: "Dentro" });
    await handleLeadRequest(post(b), deps());
    expect(outbox.get(b.respondentId as string)!.payload.respondent.answers.Perfil).toBe("Fora");
  });

  it("'Prefiro conversar sobre isso' é Dentro", async () => {
    const b = ecom({ faturamento: "Prefiro conversar sobre isso" });
    expect((await handleLeadRequest(post(b), deps())).status).toBe(200);
    expect(outbox.get(b.respondentId as string)!.payload.respondent.answers.Perfil).toBe("Dentro");
  });

  it("422 sem investimento, com faixa inventada ou email sem domínio; nada gravado", async () => {
    for (const over of [{ investimento: undefined }, { faturamento: "R$ 1" }, { email: "maria@loja" }, { email: "maria@.com" }]) {
      const b = ecom(over);
      const res = await handleLeadRequest(post(b), deps());
      expect(res.status).toBe(422);
      expect(outbox.get(b.respondentId as string)).toBeNull();
    }
  });

  it("entrega usa o token da página ECOM (item.page)", async () => {
    const sent: OutboxItem[] = [];
    const send = async (item: OutboxItem) => {
      sent.push(item);
      return ok;
    };
    await handleLeadRequest(post(ecom()), deps({ send }));
    await scheduled[0]!();
    expect(sent.map((i) => i.page)).toEqual(["ECOM"]);
  });

  it("flag LP_ECOM_ATIVA=false: 404", async () => {
    const res = await handleLeadRequest(post(ecom()), deps({ isPageActive: (id) => id !== "ECOM" }));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/lead — /sites (SITES), captura configurável", () => {
  const curto = {
    nome: "Ana Lima",
    tipo: "Clínica ou saúde",
    necessidade: "Página de captura de leads",
    desafio: "Perco cliente quando pedem meu site e não tenho o que mostrar",
    anuncios: "Estou com uma agência ou gestor agora",
    prazo: "Pra ontem, o quanto antes",
    faturamento: "De R$ 70.000 até R$ 100.000",
    whatsapp: "(86) 99999-1234",
    instagram: "@ClinicaAna",
  };
  const sites = (over: Record<string, unknown> = {}) => ({
    respondentId: crypto.randomUUID(),
    page: "SITES",
    versao: "quiz_curto",
    respostas: curto,
    website: "",
    tracking: { utm_source: "meta", gclid: "g1", fbclid: "fb1", ignorado: "x" },
    ...over,
  });

  it("grava com os campos do bloco 10, perfil calculado no servidor (exemplo do bloco 6 = A) e devolve o perfil", async () => {
    const b = sites();
    const res = await handleLeadRequest(post(b), deps());
    expect(res.status).toBe(200);
    expect(await json(res)).toEqual({ ok: true, id: b.respondentId, perfil: "A" });
    const item = outbox.get(b.respondentId as string)!;
    expect(item.page).toBe("SITES");
    expect(item.payload.form).toEqual({ form_id: "lp-sites", form_name: "LP Sites" });
    expect(item.payload.respondent.answers).toEqual({
      Nome: "Ana Lima",
      WhatsApp: "5586999991234",
      Instagram: "@clinicaana",
      "Página de origem": "SITES",
      "Versão da captura": "quiz_curto",
      "Tipo de negócio": "Clínica ou saúde",
      Necessidade: "Página de captura de leads",
      Desafio: "Perco cliente quando pedem meu site e não tenho o que mostrar",
      Anúncio: "Estou com uma agência ou gestor agora",
      Prazo: "Pra ontem, o quanto antes",
      Faturamento: "De R$ 70.000 até R$ 100.000",
      Perfil: "A",
      utm_source: "meta",
      gclid: "g1",
      fbclid: "fb1",
    });
  });

  it("o perfil nunca vem do navegador; exemplo do bloco 8 (total 4) = B", async () => {
    const b = sites({
      perfil: "A",
      respostas: { ...curto, faturamento: "De R$ 30.000 até R$ 50.000", anuncios: "Já contratei uma agência no passado", Perfil: "A" },
    });
    const res = await handleLeadRequest(post(b), deps());
    expect((await json(res)).perfil).toBe("B");
    expect(outbox.get(b.respondentId as string)!.payload.respondent.answers.Perfil).toBe("B");
  });

  it("caminho longo: ramo, funcionários e e-mail vão; resposta de ramo que não vale é descartada", async () => {
    const b = sites({
      versao: "quiz_longo",
      respostas: { ...curto, site_atual: "Não tenho", oferta: "Tenho a oferta, falta o anúncio", produtos: "Até 20", funcionarios: "Somente eu", email: "ana@clinica.com.br" },
    });
    expect((await handleLeadRequest(post(b), deps())).status).toBe(200);
    const a = outbox.get(b.respondentId as string)!.payload.respondent.answers;
    expect(a).toMatchObject({ "Versão da captura": "quiz_longo", "Já tem site": "Não tenho", "Oferta e anúncio": "Tenho a oferta, falta o anúncio", Funcionários: "Somente eu", Email: "ana@clinica.com.br" });
    expect(a).not.toHaveProperty("Quantidade de produtos");
  });

  it("422 por tela: longo sem o ramo, opção inventada, @ inválido ou versão desconhecida; nada gravado", async () => {
    const casos = [
      sites({ versao: "quiz_longo", respostas: { ...curto, site_atual: "Não tenho", funcionarios: "Somente eu" } }),
      sites({ respostas: { ...curto, prazo: "Amanhã" } }),
      sites({ respostas: { ...curto, instagram: "rco hub" } }),
      sites({ versao: "quiz_medio" }),
    ];
    const campos: string[] = [];
    for (const b of casos) {
      const res = await handleLeadRequest(post(b), deps());
      expect(res.status).toBe(422);
      campos.push(Object.keys(((await json(res)).errors as Record<string, string>) ?? {}).join(","));
      expect(outbox.get(b.respondentId as string)).toBeNull();
    }
    expect(campos).toEqual(["oferta", "prazo", "instagram", "versao"]);
  });

  it("sem token do SITES o lead fica pendente na fila (transporte falso: nada sai para o COMERCIAL real)", async () => {
    const send = vi.fn(async (): Promise<CrmResult> => ({ kind: "retry", reason: "COMERCIAL_LEAD_TOKEN_SITES não configurado" }));
    const b = sites();
    await handleLeadRequest(post(b), deps({ send }));
    await scheduled[0]!();
    expect(send).toHaveBeenCalledTimes(1);
    expect(outbox.statusOf(b.respondentId as string)).toBe("pending");
    expect(outbox.get(b.respondentId as string)!.lastError).toContain("COMERCIAL_LEAD_TOKEN_SITES");
  });

  it("reenvio com o mesmo id não duplica e devolve o mesmo perfil; flag SITES_ATIVA=false = 404", async () => {
    const b = sites();
    await handleLeadRequest(post(b), deps());
    const again = await handleLeadRequest(post(b), deps());
    expect(await json(again)).toMatchObject({ ok: true, duplicate: true, perfil: "A" });
    const off = await handleLeadRequest(post(sites()), deps({ isPageActive: (id) => id !== "SITES" }));
    expect(off.status).toBe(404);
  });
});
