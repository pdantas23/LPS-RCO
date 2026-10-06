import { beforeEach, describe, expect, it } from "vitest";
import { captureAttribution } from "./attribution";

const FORM = "https://lp.rcohub.com/formulario/";
beforeEach(() => sessionStorage.clear());

describe("origem", () => {
  it("captura os 7 parâmetros, ignora o resto e limpa a própria página", () => {
    const a = captureAttribution(
      `${FORM}?utm_source=instagram&utm_medium=bio&utm_campaign=performance&utm_content=story&utm_term=crm&gclid=G1&fbclid=ABC&nome=Joao&foo=bar`,
      "https://bio.rcohub.com/?utm_source=instagram",
      sessionStorage,
    );
    expect(a).toEqual({
      utm_source: "instagram",
      utm_medium: "bio",
      utm_campaign: "performance",
      utm_content: "story",
      utm_term: "crm",
      gclid: "G1",
      fbclid: "ABC",
      source_page: "https://bio.rcohub.com/",
      conversion_page: FORM,
    });
    expect(JSON.stringify(a)).not.toMatch(/Joao|foo/);
  });

  it("mantém a origem na sessão quando a URL perde os parâmetros (reload/navegação)", () => {
    captureAttribution(`${FORM}?utm_source=instagram&gclid=G1`, "https://bio.rcohub.com/", sessionStorage);
    const again = captureAttribution(FORM, FORM, sessionStorage);
    expect(again.utm_source).toBe("instagram");
    expect(again.gclid).toBe("G1");
    expect(again.source_page).toBe("https://bio.rcohub.com/");
  });

  it("nova campanha na URL substitui a anterior", () => {
    captureAttribution(`${FORM}?utm_source=instagram&utm_campaign=a`, "", sessionStorage);
    const b = captureAttribution(`${FORM}?utm_source=facebook`, "", sessionStorage);
    expect(b.utm_source).toBe("facebook");
    expect(b.utm_campaign).toBeNull();
  });

  it("sem parâmetros e sem sessão: tudo null, sem inventar campanha", () => {
    const a = captureAttribution(FORM, "", sessionStorage);
    expect(a.utm_source).toBeNull();
    expect(a.gclid).toBeNull();
    expect(a.source_page).toBeNull();
  });
});
