import { describe, expect, it } from "vitest";
import { LP_ORIGENS, LP_ROUTES, isPageIdActive, lpOrigemOfPageId } from "./lps";
import { ECOM_PAGE } from "./ecom";
import { FORM_PAGE_IDS, PAGES } from "./pages";
import { LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA } from "./site";

describe("rotas das LPs", () => {
  it("rotas pedidas: / = form, /lp01 = P05, /lp02 = P04, /lp-ecom reservada", () => {
    expect(LP_ROUTES.form).toMatchObject({ path: "/", pageId: "P02" });
    expect(LP_ROUTES.lp01).toMatchObject({ path: "/lp01", pageId: "P05" });
    expect(LP_ROUTES.lp02).toMatchObject({ path: "/lp02", pageId: "P04" });
    expect(LP_ROUTES["lp-ecom"]).toMatchObject({ path: "/lp-ecom", pageId: "ECOM" });
    expect(ECOM_PAGE).toMatchObject({ path: "/lp-ecom", id: "ECOM", formId: "lp-ecom" });
    expect(LP_ORIGENS).toEqual(["form", "lp01", "lp02", "lp-ecom"]);
  });

  it("estado entregue: lp01 e lp-ecom no ar, lp02 desligada", () => {
    expect([LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA]).toEqual([true, false, true]);
    expect(isPageIdActive("P05")).toBe(true);
    expect(isPageIdActive("P04")).toBe(false);
    expect(isPageIdActive("ECOM")).toBe(true);
    expect(isPageIdActive("P99")).toBe(false);
  });

  it("o path de cada página do Next é o do mapa, e o vínculo com o COMERCIAL (formId) não mudou", () => {
    for (const id of FORM_PAGE_IDS) {
      const route = Object.values(LP_ROUTES).find((r) => r.pageId === id)!;
      expect(PAGES[id].path).toBe(route.path);
    }
    expect(PAGES.P05.formId).toBe("lp-p05");
    expect(PAGES.P04.formId).toBe("lp-p04");
  });

  it("lp_origem por page_id", () => {
    expect(lpOrigemOfPageId("P02")).toBe("form");
    expect(lpOrigemOfPageId("P05")).toBe("lp01");
    expect(lpOrigemOfPageId("P04")).toBe("lp02");
    expect(lpOrigemOfPageId("ECOM")).toBe("lp-ecom");
    expect(lpOrigemOfPageId("other")).toBeUndefined();
  });
});

describe("/lp-ecom: faixas e perfil", () => {
  it("só a primeira faixa de faturamento é Fora; as listas têm as faixas combinadas", async () => {
    const { FATURAMENTOS_ECOM, INVESTIMENTOS_ECOM, perfilEcom } = await import("./options");
    expect(FATURAMENTOS_ECOM[0]).toBe("Abaixo de R$ 30 mil");
    expect(FATURAMENTOS_ECOM).toHaveLength(6);
    expect(INVESTIMENTOS_ECOM).toHaveLength(6);
    expect(FATURAMENTOS_ECOM.map(perfilEcom)).toEqual(["Fora", "Dentro", "Dentro", "Dentro", "Dentro", "Dentro"]);
  });
});

describe("/lp-ecom: fotos das dores", () => {
  it("cada dor tem foto local em public/ecom, abaixo de 150 KB, e há créditos", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { ECOM_PAINS } = await import("./ecom");
    const pub = path.resolve(__dirname, "../../public");
    expect(ECOM_PAINS.items).toHaveLength(5);
    for (const p of ECOM_PAINS.items) {
      expect(p.image.startsWith("/ecom/"), p.image).toBe(true);
      expect(fs.statSync(path.join(pub, p.image)).size, p.image).toBeLessThan(150 * 1024);
    }
    expect(fs.existsSync(path.join(pub, "ecom/CREDITOS.md"))).toBe(true);
  });
});

describe("/lp-ecom: carrossel das dores", () => {
  it("botão único abaixo (cta_location dores), sem link nos cards, sem corte de texto e sem bolinhas", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.resolve(__dirname, "../components");
    const pains = fs.readFileSync(path.join(dir, "EcomPains.tsx"), "utf8");
    const gallery = fs.readFileSync(path.join(dir, "ui/gallery4.tsx"), "utf8");
    expect(pains).toContain('location="dores"');
    expect(gallery).not.toContain("line-clamp");
    expect(gallery).not.toContain("<a ");
    expect(gallery).not.toContain("Ir para o card");
    expect(gallery).toContain("Próximo card");
  });
});
