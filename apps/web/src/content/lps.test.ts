import { describe, expect, it } from "vitest";
import { LP_ORIGENS, LP_ROUTES, isPageIdActive, lpOrigemOfPageId } from "./lps";
import { PAGES, PAGE_IDS } from "./pages";
import { LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA } from "./site";

describe("rotas das LPs", () => {
  it("rotas pedidas: / = form, /lp01 = P05, /lp02 = P04, /lp-ecom reservada", () => {
    expect(LP_ROUTES.form).toMatchObject({ path: "/", pageId: "P02" });
    expect(LP_ROUTES.lp01).toMatchObject({ path: "/lp01", pageId: "P05" });
    expect(LP_ROUTES.lp02).toMatchObject({ path: "/lp02", pageId: "P04" });
    expect(LP_ROUTES["lp-ecom"]).toMatchObject({ path: "/lp-ecom" });
    expect(LP_ORIGENS).toEqual(["form", "lp01", "lp02", "lp-ecom"]);
  });

  it("estado entregue: lp01 no ar, lp02 e lp-ecom desligadas", () => {
    expect([LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA]).toEqual([true, false, false]);
    expect(isPageIdActive("P05")).toBe(true);
    expect(isPageIdActive("P04")).toBe(false);
    expect(isPageIdActive("ECOM")).toBe(false);
    expect(isPageIdActive("P99")).toBe(false);
  });

  it("o path de cada página do Next é o do mapa, e o vínculo com o COMERCIAL (formId) não mudou", () => {
    for (const id of PAGE_IDS) {
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
    expect(lpOrigemOfPageId("other")).toBeUndefined();
  });
});
