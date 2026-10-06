import { beforeEach, describe, expect, it, vi } from "vitest";

const plan = {
  id: "pro", name: "Pro", priceCents: 19900, currency: "BRL" as const, period: "mês",
  features: [], limits: [], addons: [], checkoutUrl: "https://pay.example.com/p/abc",
};

vi.mock("./config", async (orig) => ({
  ...(await orig<typeof import("./config")>()),
  plans: [plan],
  checkout: { provider: "teste", orderStatusEndpoint: "https://api.example.com/order-status" },
}));

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  localStorage.clear();
  window.dataLayer = [];
});

const events = () => (window.dataLayer as Record<string, unknown>[]).map((e) => e.event);

describe("LP → plano → checkout", () => {
  it("o plano escolhido e a origem chegam ao checkout; plan_select e begin_checkout só no clique", async () => {
    const { renderPlans } = await import("./render");
    const cfg = await import("./config");
    window.history.replaceState(null, "", "/lpcrm/?utm_source=instagram&gclid=G1&fbclid=F1&foo=bar");
    document.body.innerHTML = renderPlans(cfg);
    await import("./main");
    const a = document.querySelector<HTMLAnchorElement>('a[data-plan="pro"]')!;
    const url = new URL(a.href);
    expect(Object.fromEntries(url.searchParams)).toEqual({ plan_id: "pro", utm_source: "instagram", gclid: "G1", fbclid: "F1" });
    expect(events()).toEqual(["page_view"]);
    a.addEventListener("click", (e) => e.preventDefault());
    a.click();
    expect(events()).toEqual(["page_view", "plan_select", "begin_checkout"]);
    expect(sessionStorage.getItem("rco_p01_plano")).toBe("pro");
    expect(events()).not.toContain("purchase");
  });
});

describe("retorno do pagamento", () => {
  const page = () => {
    document.body.innerHTML = ["checking", "approved", "pending", "refused", "unknown"]
      .map((s) => `<section data-state="${s}" ${s === "checking" ? "" : "hidden"}></section>`)
      .join("");
  };
  const visible = () => document.querySelector<HTMLElement>("[data-state]:not([hidden])")?.dataset.state;
  const reply = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body)));

  it("redirect de sucesso sozinho não é compra: sem ?ref nada é confirmado", async () => {
    page();
    window.history.replaceState(null, "", "/lpcrm/obrigado/?status=approved");
    vi.stubGlobal("fetch", reply({ status: "approved", transaction_id: "T1", value_cents: 1, currency: "BRL", plan_id: "pro" }));
    await import("./obrigado");
    await new Promise((r) => setTimeout(r, 0));
    expect(visible()).toBe("unknown");
    expect(events()).not.toContain("purchase");
    vi.unstubAllGlobals();
  });

  it("aprovado pelo servidor: purchase uma vez, mesmo recarregando", async () => {
    window.history.replaceState(null, "", "/lpcrm/obrigado/?ref=pedido123");
    vi.stubGlobal("fetch", reply({ status: "approved", transaction_id: "T9", value_cents: 19900, currency: "BRL", plan_id: "pro" }));
    for (let i = 0; i < 2; i++) {
      vi.resetModules();
      page();
      await import("./obrigado");
      await new Promise((r) => setTimeout(r, 0));
      expect(visible()).toBe("approved");
    }
    const buys = (window.dataLayer as Record<string, unknown>[]).filter((e) => e.event === "purchase");
    expect(buys).toEqual([{ event: "purchase", transaction_id: "T9", value: 199, currency: "BRL", plan_id: "pro" }]);
    vi.unstubAllGlobals();
  });

  it.each(["pending", "refused"])("status %s: tela própria e nenhum purchase", async (status) => {
    page();
    window.history.replaceState(null, "", "/lpcrm/obrigado/?ref=pedido123");
    vi.stubGlobal("fetch", reply({ status }));
    await import("./obrigado");
    await new Promise((r) => setTimeout(r, 0));
    expect(visible()).toBe(status);
    expect(events()).not.toContain("purchase");
    vi.unstubAllGlobals();
  });
});
