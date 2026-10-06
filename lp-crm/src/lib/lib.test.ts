import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Plan } from "../config";
import { captureCampaign, withParams } from "./campaign";
import { fetchOrderStatus } from "./order-status";
import { buildCheckoutUrl, formatPrice, isPlanReady, readyPlans } from "./plans";
import { createTracker } from "./tracking";

const plan = (over: Partial<Plan> = {}): Plan => ({
  id: "pro",
  name: "Pro",
  priceCents: 19900,
  currency: "BRL",
  period: "mês",
  features: [],
  limits: [],
  addons: [],
  checkoutUrl: "https://pay.example.com/p/abc?src=lp",
  ...over,
});

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("origem da campanha", () => {
  it("captura só os 7 parâmetros e guarda na sessão", () => {
    const c = captureCampaign("https://crm.rcohub.com/lpcrm/?utm_source=instagram&gclid=G&fbclid=F&nome=Joao", sessionStorage);
    expect(c).toEqual({ utm_source: "instagram", gclid: "G", fbclid: "F" });
    expect(captureCampaign("https://crm.rcohub.com/lpcrm/#planos", sessionStorage)).toEqual(c);
  });

  it("não sobrescreve nem duplica parâmetro do destino", () => {
    expect(withParams("https://x.com/p?utm_source=bio", { utm_source: "ig", gclid: "G" })).toBe(
      "https://x.com/p?utm_source=bio&gclid=G",
    );
  });
});

describe("planos", () => {
  it("só plano completo vai para a tela", () => {
    expect(isPlanReady(plan())).toBe(true);
    expect(isPlanReady(plan({ priceCents: null }))).toBe(false);
    expect(isPlanReady(plan({ name: " " }))).toBe(false);
    expect(isPlanReady(plan({ period: "" }))).toBe(false);
    expect(isPlanReady(plan({ checkoutUrl: "" }))).toBe(false);
    expect(isPlanReady(plan({ checkoutUrl: "http://inseguro.com" }))).toBe(false);
    expect(readyPlans([plan(), plan({ id: "x", priceCents: null })]).map((p) => p.id)).toEqual(["pro"]);
  });

  it("checkout recebe plan_id e a origem, preservando os parâmetros do provedor", () => {
    const url = new URL(buildCheckoutUrl(plan(), { utm_source: "instagram", fbclid: "F" }));
    expect(url.searchParams.get("src")).toBe("lp");
    expect(url.searchParams.get("plan_id")).toBe("pro");
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.get("fbclid")).toBe("F");
  });

  it("preço em reais", () => {
    expect(formatPrice(19900)).toBe("R$ 199,00");
  });
});

describe("status do pedido (servidor)", () => {
  const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
  const E = "https://api.example.com/order-status";

  it("sem endpoint ou sem referência: nunca aprovado", async () => {
    expect(await fetchOrderStatus("", "abc123")).toEqual({ status: "unknown", reason: "config" });
    expect(await fetchOrderStatus(E, null, ok({}))).toEqual({ status: "unknown", reason: "missing_ref" });
    expect(await fetchOrderStatus(E, "a b<script>", ok({}))).toEqual({ status: "unknown", reason: "missing_ref" });
  });

  it("aprovado só com dados completos do servidor", async () => {
    const f = ok({ status: "approved", transaction_id: "T1", value_cents: 19900, currency: "BRL", plan_id: "pro" });
    expect(await fetchOrderStatus(E, "ref123", f)).toEqual({
      status: "approved",
      transactionId: "T1",
      valueCents: 19900,
      currency: "BRL",
      planId: "pro",
    });
    expect(await fetchOrderStatus(E, "ref123", ok({ status: "approved", value_cents: 1 }))).toEqual({ status: "unknown", reason: "invalid" });
  });

  it("pendente, recusado, erro HTTP e rede", async () => {
    expect(await fetchOrderStatus(E, "ref123", ok({ status: "pending" }))).toEqual({ status: "pending" });
    expect(await fetchOrderStatus(E, "ref123", ok({ status: "refused" }))).toEqual({ status: "refused" });
    expect(await fetchOrderStatus(E, "ref123", ok({}, 500))).toEqual({ status: "unknown", reason: "http" });
    const off = vi.fn(async () => { throw new TypeError("offline"); }) as unknown as typeof fetch;
    expect(await fetchOrderStatus(E, "ref123", off)).toEqual({ status: "unknown", reason: "network" });
  });
});

describe("tracking", () => {
  it("page_view uma vez; plan_select e begin_checkout com plano, valor e moeda, sem PII", () => {
    const w = {} as Window;
    const t = createTracker(w, sessionStorage);
    t.pageView();
    t.pageView();
    t.planSelect(plan());
    t.beginCheckout(plan());
    t.ctaClick("cta_principal", "hero", "https://x.com/p?utm_source=ig&email=a@b.com");
    expect(w.dataLayer).toEqual([
      { event: "page_view", page_type: "crm_lp" },
      { event: "plan_select", page_type: "crm_lp", plan_id: "pro", plan_name: "Pro" },
      { event: "begin_checkout", page_type: "crm_lp", plan_id: "pro", plan_name: "Pro", value: 199, currency: "BRL" },
      { event: "cta_click", page_type: "crm_lp", button_name: "cta_principal", button_position: "hero", destination: "https://x.com/p" },
    ]);
  });

  it("purchase uma vez por transaction_id, inclusive após recarregar", () => {
    const w = {} as Window;
    const p = { transactionId: "T1", valueCents: 19900, currency: "BRL", planId: "pro" };
    expect(createTracker(w, localStorage).purchase(p)).toBe(true);
    expect(createTracker(w, localStorage).purchase(p)).toBe(false);
    expect(createTracker(w, localStorage).purchase({ ...p, transactionId: "T2" })).toBe(true);
    const buys = (w.dataLayer as Record<string, unknown>[]).filter((e) => e.event === "purchase");
    expect(buys).toEqual([
      { event: "purchase", transaction_id: "T1", value: 199, currency: "BRL", plan_id: "pro" },
      { event: "purchase", transaction_id: "T2", value: 199, currency: "BRL", plan_id: "pro" },
    ]);
  });
});
