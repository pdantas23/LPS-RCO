"use client";

import { useEffect } from "react";

/**
 * Controlador das animações da /sites (mesmo desenho do portfólio e da /lp-ecom). Não renderiza nada.
 *  - liga `is-live` nos `[data-sx-live]` visíveis: os loops (celulares rolando, flutuação) só rodam na tela;
 *  - marca o <main> com `rv-ready` e revela cada `[data-sx-rv]` uma vez ao entrar na tela. O HTML do servidor
 *    chega visível; itens já na tela no carregamento não somem e voltam.
 * Com prefers-reduced-motion: só o is-live (o CSS já para os loops), sem entrada ao rolar.
 */
export function SitesMotion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("main.sx");
    if (!main) return;
    const live = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle("is-live", e.isIntersecting);
    }, { rootMargin: "40px 0px" });
    main.querySelectorAll("[data-sx-live]").forEach((el) => live.observe(el));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => live.disconnect();

    const items = Array.from(main.querySelectorAll<HTMLElement>("[data-sx-rv]"));
    const vh = window.innerHeight;
    const below = items.filter((el) => el.getBoundingClientRect().top > vh * 0.92);
    items.filter((el) => !below.includes(el)).forEach((el) => el.removeAttribute("data-sx-rv"));
    main.classList.add("rv-ready");
    const reveal = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("rv-in");
        reveal.unobserve(e.target);
      }
    }, { rootMargin: "0px 0px -40px 0px", threshold: 0.01 });
    below.forEach((el) => reveal.observe(el));
    return () => {
      live.disconnect();
      reveal.disconnect();
      main.classList.remove("rv-ready");
    };
  }, []);
  return null;
}
