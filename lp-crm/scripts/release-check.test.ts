import { describe, expect, it } from "vitest";
import * as cfg from "../src/config.ts";
import { audit } from "./release-check.ts";

const blocks = (c: typeof cfg) => audit(c).filter((i) => i.level === "BLOQUEIA").map((i) => i.what);

describe("release-check", () => {
  it("config atual bloqueia a publicação como página de venda", () => {
    expect(blocks(cfg)).toHaveLength(4);
  });

  it("com planos, pagamento, confirmação e telas reais, não bloqueia", () => {
    const full = {
      ...cfg,
      plans: [{ id: "pro", name: "Pro", priceCents: 100, currency: "BRL" as const, period: "mês", features: [], limits: [], addons: [], checkoutUrl: "https://pay.example.com/p" }],
      checkout: { provider: "x", orderStatusEndpoint: "https://api.example.com/s" },
      heroShot: { src: "a.webp", alt: "Tela", width: 1, height: 1 },
    };
    expect(blocks(full)).toEqual([]);
  });
});
