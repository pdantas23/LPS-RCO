import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitLead, type LeadValues } from "@/lib/lead-submit";
import { track } from "./events";

// Simula o navegador: só o que o código usa (window.dataLayer).
type Entry = Record<string, unknown>;
let dataLayer: Entry[];

beforeEach(() => {
  dataLayer = [];
  vi.stubGlobal("window", { dataLayer });
});
afterEach(() => vi.unstubAllGlobals());

const values: LeadValues = {
  name: "Maria da Silva",
  whatsapp: "(11) 98888-7777",
  email: "maria.silva@exemplo.com.br",
  nicho: "Odontologia",
  faturamento: "De R$ 30 mil a R$ 100 mil por mês",
  website: "",
};
const ID = "8f0c7a52-1d34-4b6e-9a77-0f2f5c1d9e10";

const fakeFetch = (status: number, body: unknown = {}) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

async function send(fetchFn: typeof fetch) {
  return submitLead({ values, respondentId: ID, page: "P04", tracking: { utm_source: "meta" }, fetchFn });
}

describe("track", () => {
  it("empurra { event, ...params } no dataLayer", () => {
    track("cta_click", { page_id: "P04", cta_location: "hero", cta_text: "Quero analisar minha operação" });
    expect(dataLayer).toEqual([
      { event: "cta_click", lp_origem: "lp02", page_id: "P04", cta_location: "hero", cta_text: "Quero analisar minha operação" },
    ]);
  });

  it("todo evento leva lp_origem conforme o page_id (P05 = lp01, P04 = lp02); id desconhecido vai sem", () => {
    track("page_view", { page_id: "P05", page_path: "/lp01" });
    track("form_start", { page_id: "P05" });
    track("faq_open", { page_id: "P04", question: "q", question_index: 1 });
    track("page_view", { page_id: "other", page_path: "/x" });
    expect(dataLayer.map((e) => e.lp_origem)).toEqual(["lp01", "lp01", "lp02", undefined]);
    expect("lp_origem" in dataLayer[3]!).toBe(false);
  });

  it("não quebra sem window (servidor)", () => {
    vi.unstubAllGlobals();
    expect(() => track("form_start", { page_id: "P04" })).not.toThrow();
  });
});

describe("generate_lead", () => {
  it("vai ao dataLayer no sucesso, com categorias e event_id", async () => {
    const out = await send(fakeFetch(200));
    expect(out.kind).toBe("done");
    expect(dataLayer).toEqual([
      {
        event: "generate_lead",
        lp_origem: "lp02",
        page_id: "P04",
        nicho: "Odontologia",
        faturamento: "De R$ 30 mil a R$ 100 mil por mês",
        event_id: ID,
      },
    ]);
  });

  it("o event_id é o MESMO respondent_id enviado ao servidor (deduplicação futura)", async () => {
    const f = fakeFetch(200);
    await send(f);
    const sent = JSON.parse((vi.mocked(f).mock.calls[0]![1] as RequestInit).body as string);
    expect(sent.respondentId).toBe(ID);
    expect(dataLayer[0]!.event_id).toBe(sent.respondentId);
  });

  it("NÃO vai ao dataLayer se o envio falha", async () => {
    await send(fakeFetch(500));
    expect(dataLayer.some((e) => e.event === "generate_lead")).toBe(false);
  });

  it("NÃO leva dado pessoal: nem chave, nem valor (nome, WhatsApp, email)", async () => {
    await send(fakeFetch(200));
    const pii = ["Maria", "Silva", "98888", "7777", "maria.silva", "exemplo.com.br", "@"];
    const json = JSON.stringify(dataLayer);
    for (const needle of pii) expect(json).not.toContain(needle);
    for (const key of ["name", "whatsapp", "email", "phone", "telefone", "nome"]) {
      expect(dataLayer.every((e) => !(key in e))).toBe(true);
    }
    // lista fechada de chaves do evento
    expect(Object.keys(dataLayer[0]!).sort()).toEqual(["event", "event_id", "faturamento", "lp_origem", "nicho", "page_id"]);
  });
});

describe("form_error", () => {
  it.each([
    [422, { errors: { email: "Informe um email válido." } }, "validation"],
    [429, {}, "rate_limit"],
    [500, {}, "server"],
  ] as const)("HTTP %s vira error_type=%s e nunca generate_lead", async (status, body, type) => {
    await send(fakeFetch(status, body));
    expect(dataLayer).toHaveLength(1);
    expect(dataLayer[0]).toMatchObject({ event: "form_error", page_id: "P04", error_type: type });
    expect(JSON.stringify(dataLayer)).not.toContain("maria.silva");
  });

  it("422 informa só os nomes dos campos, não a mensagem nem o valor", async () => {
    await send(fakeFetch(422, { errors: { email: "Informe um email válido.", whatsapp: "x" } }));
    expect(dataLayer[0]!.fields).toBe("email,whatsapp");
  });

  it("falha de rede vira error_type=network", async () => {
    const boom = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    await send(boom);
    expect(dataLayer[0]).toMatchObject({ event: "form_error", error_type: "network" });
  });
});
