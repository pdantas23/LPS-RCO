"use client";

import { useEffect } from "react";
import "./lp-motion.css";

/**
 * Controlador das animações da /lp-ecom (abaixo do hero). Não renderiza nada. Depois de hidratar:
 *  1. marca o <main> com `rv-ready`: só então o CSS esconde os itens `[data-rv-item]` (o HTML do servidor chega com o texto
 *     visível, para o Google e para quem está sem JS);
 *  2. um IntersectionObserver revela cada grupo `[data-rv-group]` uma vez só, um pouco antes de entrar na tela, em sequência
 *     (stagger por `--i`);
 *  3. outro observador liga `rv-live` nas seções visíveis: os loops contínuos (brilho dos ícones, reflexo dos botões, brilho
 *     dos rótulos) só rodam enquanto a seção está na tela.
 * Com prefers-reduced-motion nada disso é ligado: tudo aparece já no estado final, sem loops.
 */
export function EcomMotion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main.lpx");
    if (!main || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const groups = Array.from(main.querySelectorAll<HTMLElement>("[data-rv-group]"));
    for (const g of groups) {
      const items = g.matches("[data-rv-item]") ? [g] : Array.from(g.querySelectorAll<HTMLElement>("[data-rv-item]"));
      items.forEach((el, i) => el.style.setProperty("--i", String(Math.min(i, 8))));
    }
    main.classList.add("rv-ready");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("rv-in");
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px 140px 0px", threshold: 0.01 },
    );
    groups.forEach((g) => reveal.observe(g));

    const live = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.classList.toggle("rv-live", e.isIntersecting);
      },
      { rootMargin: "60px 0px" },
    );
    const sections = Array.from(main.querySelectorAll<HTMLElement>("section, footer"));
    sections.forEach((s) => live.observe(s));

    return () => {
      reveal.disconnect();
      live.disconnect();
      main.classList.remove("rv-ready");
      sections.forEach((s) => s.classList.remove("rv-live"));
    };
  }, []);
  return null;
}
