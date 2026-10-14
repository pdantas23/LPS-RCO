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
  it("só 'Até R$ 29.999' é Fora; 'Prefiro conversar sobre isso' e as demais são Dentro", async () => {
    const { FATURAMENTOS_ECOM, INVESTIMENTOS_ECOM, perfilEcom } = await import("./options");
    expect(FATURAMENTOS_ECOM[0]).toBe("Até R$ 29.999");
    expect(FATURAMENTOS_ECOM).toHaveLength(10);
    expect(INVESTIMENTOS_ECOM).toHaveLength(9);
    expect(FATURAMENTOS_ECOM.map(perfilEcom)).toEqual(["Fora", ...Array(9).fill("Dentro")]);
    expect(perfilEcom("Prefiro conversar sobre isso")).toBe("Dentro");
  });
});

describe("/lp-ecom: sem sobras das versões anteriores", () => {
  it("fotos, carrossel e placeholders de prova não estão mais na página", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const comp = path.resolve(__dirname, "../components");
    const page = fs.readFileSync(path.join(comp, "LandingPageEcom.tsx"), "utf8");
    expect(page).not.toContain("Gallery4");
    expect(page).not.toContain("TestimonialsMarquee");
    expect(page).not.toContain("PROOF_PLACEHOLDERS");
    // as fotos das dores antigas saíram de public/ecom (hoje só há o vídeo do hero e o poster)
    for (const f of ["dor-anuncio.webp", "dor-promocao.webp", "dor-carrinho.webp", "dor-relatorio.webp", "dor-cliente.webp", "CREDITOS.md"]) {
      expect(fs.existsSync(path.resolve(__dirname, "../../public/ecom", f)), f).toBe(false);
    }
  });

  it("a seção de provas fica escondida e sem cases", async () => {
    const { SHOW_PROOF_SECTION, PROOF_CASES, PRIVACY_URL, CONTACT_URL } = await import("./ecom");
    expect(SHOW_PROOF_SECTION).toBe(false);
    expect(PROOF_CASES).toHaveLength(0);
    // sem URL real, política e contato não aparecem
    expect([PRIVACY_URL, CONTACT_URL]).toEqual(["", ""]);
  });
});

describe("/lp-ecom: código sem sobras e cartões de tamanho igual", () => {
  it("Gallery4, carrossel e botão shadcn foram removidos (nada os importa)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const ui = path.resolve(__dirname, "../components/ui");
    for (const f of ["gallery4.tsx", "carousel.tsx", "button.tsx"]) expect(fs.existsSync(path.join(ui, f)), f).toBe(false);
  });

  it("as grades de cartões (dores, objeções, indicadores, dois modelos) usam colunas iguais e linhas de mesma altura (auto-rows-fr)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(path.resolve(__dirname, "../components/EcomSections.tsx"), "utf8");
    expect((src.match(/auto-rows-fr/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(src).not.toContain("PurchaseFlow");
  });
});

describe("rodapé: Instagram como primeiro item nas três LPs do Next", () => {
  it("um componente só (InstagramLink), com URL limpa, nova aba e aria-label; usado pelos dois rodapés", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.resolve(__dirname, "../components");
    const ig = fs.readFileSync(path.join(dir, "InstagramLink.tsx"), "utf8");
    expect(ig).toContain('"https://www.instagram.com/rcohub/"');
    expect(ig).not.toContain("utm_source");
    expect(ig).toContain('target="_blank"');
    expect(ig).toContain('rel="noopener noreferrer"');
    expect(ig).toContain('aria-label="Instagram da RCO Hub"');
    expect(ig).toContain('"@rcohub"');
    expect(ig).not.toContain("underline");
    expect(ig).toContain("focus-visible:outline");
    expect(ig).toContain("linearGradient");
    expect(ig).toContain("useId");
    for (const f of ["sections.tsx", "EcomFooter.tsx"]) expect(fs.readFileSync(path.join(dir, f), "utf8"), f).toContain("<InstagramLink />");
  });
});

describe("/lp-ecom: linha do tempo do caminho da compra (Feature24)", () => {
  it("usa o pacote motion que já existe, respeita prefers-reduced-motion e aceita o campo opcional 'measure' sem renderizá-lo vazio", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.resolve(__dirname, "../components");
    const t = fs.readFileSync(path.join(dir, "ui/feature-24-milestone-timeline.tsx"), "utf8");
    expect(t).toContain('from "motion/react"');
    expect(t).not.toContain("framer-motion");
    expect(t).toContain("useReducedMotion");
    expect(t).toContain("measure?: string");
    expect(t).toContain("tl-card-lit"); // o cartão acende quando a linha chega no ponto
    expect(t).not.toContain("flex-row-reverse"); // ícone sempre à esquerda, tudo alinhado à esquerda
    expect(t).toContain("{item.measure ?");
    const page = fs.readFileSync(path.join(dir, "LandingPageEcom.tsx"), "utf8");
    expect(page).toContain("<MilestoneTimeline");
    expect(page).not.toContain("measure:"); // ainda sem preencher
  });
});

describe("/lp-ecom: hero com o celular animado (sem vídeo)", () => {
  it("não sobrou vídeo, poster nem carga na primeira interação; h1 só no DOM; celular e frases decorativos", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const comp = path.resolve(__dirname, "../components");
    for (const f of ["EcomHeroVideo.tsx", "EcomHeroGraphic.tsx"]) expect(fs.existsSync(path.join(comp, f)), f).toBe(false);
    for (const f of ["hero-ecom.mp4", "hero-ecom-poster.jpg"]) expect(fs.existsSync(path.resolve(__dirname, "../../public/ecom", f)), f).toBe(false);
    const page = fs.readFileSync(path.join(comp, "LandingPageEcom.tsx"), "utf8");
    expect(page).toContain('<h1 className="sr-only">');
    expect(page).toContain("<PhoneJourney");
    expect(page).toContain("<EcomHeroHeadlines");
    expect(page).not.toContain("<video");
    const phone = fs.readFileSync(path.join(comp, "ui/phone-journey.tsx"), "utf8");
    expect(phone).toContain('aria-hidden="true"');
    const heads = fs.readFileSync(path.join(comp, "EcomHeroHeadlines.tsx"), "utf8");
    expect(heads).toContain('aria-hidden="true"');
    const story = fs.readFileSync(path.join(comp, "EcomHeroStory.tsx"), "utf8");
    expect(story).toContain("IntersectionObserver");
    expect(story).toContain("visibilitychange");
    expect(story).toContain("prefers-reduced-motion");
  });
});

describe("/lp-ecom: animações abaixo do hero", () => {
  it("só transform, opacity, filter (e sombra/fundo de brilho) nos keyframes; nada de width, height, top ou left", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const css = fs.readFileSync(path.resolve(__dirname, "../components/lp-motion.css"), "utf8") + fs.readFileSync(path.resolve(__dirname, "../components/hero-story.css"), "utf8");
    const keyframes = css.match(/@keyframes [^{]+\{(?:[^{}]*\{[^{}]*\})+[^{}]*\}/g) ?? [];
    expect(keyframes.length).toBeGreaterThan(6);
    for (const k of keyframes) expect(k, k.slice(0, 40)).not.toMatch(/(^|[;{\s])(width|height|top|left|right|bottom|margin|padding)\s*:/);
  });

  it("esconde só depois de hidratar (rv-ready), respeita reduced-motion e pausa loops fora da tela (rv-live)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.resolve(__dirname, "../components");
    const css = fs.readFileSync(path.join(dir, "lp-motion.css"), "utf8");
    const ctl = fs.readFileSync(path.join(dir, "EcomMotion.tsx"), "utf8");
    expect(css).toContain(".lpx.rv-ready [data-rv-item]");
    expect(css).not.toMatch(/^\.lpx \[data-rv-item\]/m); // nunca esconde sem o rv-ready
    expect(css).toContain("prefers-reduced-motion:no-preference");
    expect(css).toContain("animation-play-state:paused");
    expect(ctl).toContain("prefers-reduced-motion: reduce");
    expect(ctl).toContain("IntersectionObserver");
    expect(ctl).toContain("rv-live");
  });
});
