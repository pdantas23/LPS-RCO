import { describe, expect, it, vi } from "vitest";
import { savePartial, sendLead, type LeadPayload, type PartialPayload } from "./api";

const cfg = { url: "https://sb.example", anonKey: "anon", rpc: "capturar_lead_performance_rco", timeoutMs: 50 };
const payload = { submission_id: "x" } as LeadPayload;
const reply = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("sendLead", () => {
  it("saved só com ok:true e lead_id vindos do servidor", async () => {
    const f = reply(200, { ok: true, lead_id: "L1", duplicate: false });
    expect(await sendLead(payload, cfg, f)).toEqual({ kind: "saved", leadId: "L1", duplicate: false });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://sb.example/rest/v1/rpc/capturar_lead_performance_rco");
    expect(JSON.parse(init.body)).toEqual({ payload });
    expect(url).not.toContain("?");
  });

  it("rejeição do servidor vira rejected com o campo", async () => {
    expect(await sendLead(payload, cfg, reply(200, { ok: false, error: "invalid_whatsapp", field: "whatsapp" }))).toEqual({
      kind: "rejected",
      error: "invalid_whatsapp",
      field: "whatsapp",
    });
  });

  it("nada de falso sucesso: HTTP de erro, corpo estranho, rede, timeout e config ausente", async () => {
    expect(await sendLead(payload, cfg, reply(503, {}))).toEqual({ kind: "failed", reason: "http" });
    expect(await sendLead(payload, cfg, reply(200, { ok: true }))).toEqual({ kind: "failed", reason: "unexpected" });
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as unknown as typeof fetch;
    expect(await sendLead(payload, cfg, offline)).toEqual({ kind: "failed", reason: "network" });
    const hang = ((_u: string, init: RequestInit) =>
      new Promise((_r, reject) => init.signal!.addEventListener("abort", () => reject(new Error("abort"))))) as unknown as typeof fetch;
    expect(await sendLead(payload, cfg, hang)).toEqual({ kind: "failed", reason: "timeout" });
    expect(await sendLead(payload, { ...cfg, url: "" }, reply(200, {}))).toEqual({ kind: "failed", reason: "config" });
  });
});

describe("savePartial", () => {
  it("POST na RPC de parcial com keepalive; falha de rede não estoura", async () => {
    const f = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const p = { submission_id: "x", whatsapp: "5562998765432" } as PartialPayload;
    expect(() => savePartial(p, { url: "https://sb.example", anonKey: "anon", partialRpc: "salvar_parcial_performance_rco" }, f)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://sb.example/rest/v1/rpc/salvar_parcial_performance_rco");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual({ payload: p });
  });

  it("sem configuração não chama nada", () => {
    const f = vi.fn() as unknown as typeof fetch;
    savePartial({} as PartialPayload, { url: "", anonKey: "", partialRpc: "x" }, f);
    expect(f).not.toHaveBeenCalled();
  });
});
