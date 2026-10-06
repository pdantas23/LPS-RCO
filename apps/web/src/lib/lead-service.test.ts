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
