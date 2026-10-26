"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CAPTURA_FORMATO, SITES_ANCORAS, SITES_CAPTURA_SECAO, SITES_PAGE } from "@/content/sites";
import type { Versao } from "@/content/captura/tipos";
import { EVENTOS_CARD, pushCaptura } from "@/lib/captura/eventos";
import { armazenamentoLocal, versaoDaLp } from "@/lib/captura/versao";
import { captureTracking, readTracking } from "@/lib/tracking/utms";
import { CardForm } from "./CardForm";

// ============================================================
// Versão da captura na LP (/sites): decidida UMA vez no navegador (sorteio guardado, lib/captura/versao.ts) e
// compartilhada por todos os botões, pelo botão fixo e pela seção de captura. No servidor ainda não se sabe a
// versão (a não ser com CAPTURA_FORMATO = "card"): os botões saem como link para o quiz e a seção de captura
// reserva o espaço até o navegador decidir.
// ============================================================

const PAGE = SITES_PAGE.id;
let cache: Versao | null = null;
const noop = () => () => {};
const lerVersao = () => (cache ??= versaoDaLp(CAPTURA_FORMATO, window.location.search, armazenamentoLocal()));
const versaoServidor = (): Versao | null => (CAPTURA_FORMATO === "card" ? "card" : null);

const Ctx = createContext<Versao | null>(null);
export const useVersao = () => useContext(Ctx);

export function SitesCapturaProvider({ children }: { children: ReactNode }) {
  const versao = useSyncExternalStore(noop, lerVersao, versaoServidor);
  const fired = useRef(false);
  useEffect(() => {
    if (!versao || fired.current) return;
    fired.current = true;
    captureTracking();
    pushCaptura("page_view", { page_id: PAGE, versao_captura: versao, page_path: window.location.pathname, ...readTracking() });
    if (versao === "card") pushCaptura(EVENTOS_CARD.vista, { page_id: PAGE, versao_captura: versao });
  }, [versao]);
  return <Ctx.Provider value={versao}>{children}</Ctx.Provider>;
}

const BTN =
  "inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[#2878F6] px-8 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(40,120,246,0.8)] transition-colors hover:bg-[#1f66d6] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/** Botão "Quero meu site": abre o quiz (fora da LP) ou rola até o card, conforme a versão. */
export function SitesCta({ label, location, className = "" }: { label: string; location: string; className?: string }) {
  const versao = useVersao();
  const onClick = (e: React.MouseEvent) => {
    if (versao) pushCaptura("cta_click", { page_id: PAGE, versao_captura: versao, cta_location: location, cta_text: label });
    if (versao === "card") {
      e.preventDefault();
      const el = document.getElementById(SITES_ANCORAS.captura);
      el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      window.setTimeout(() => el?.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true }), 500);
    }
  };
  const href = versao === "card" ? `#${SITES_ANCORAS.captura}` : SITES_PAGE.quizPath;
  return (
    <a href={href} onClick={onClick} className={`${BTN} ${className}`}>
      {label}
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
        <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}

/** Bloco de captura: o card (formulário dentro da LP) ou a chamada que abre o quiz. */
export function SitesCapturaSecao() {
  const versao = useVersao();
  if (!versao) return <div className="min-h-[420px]" aria-hidden="true" />;
  if (versao === "card") return <CardForm />;
  const T = SITES_CAPTURA_SECAO.quiz;
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1430] p-8 text-center sm:p-12">
      <h2 className="text-2xl font-bold sm:text-3xl">{T.title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-mute">{T.support}</p>
      <div className="mt-8 flex justify-center">
        <SitesCta label={T.cta} location="captura" />
      </div>
    </div>
  );
}

/**
 * Botão fixo "Quero meu site", visível durante a rolagem (bloco 1). Aparece depois que o botão do topo sai da
 * tela e some quando a captura está na tela (não cobre o próprio formulário).
 */
export function SitesBotaoFixo({ label }: { label: string }) {
  const [topoFora, setTopoFora] = useState(false);
  const [capturaNaTela, setCapturaNaTela] = useState(false);
  useEffect(() => {
    const topo = document.getElementById("sx-topo-cta");
    const captura = document.getElementById(SITES_ANCORAS.captura);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === topo) setTopoFora(!e.isIntersecting && e.boundingClientRect.top < 0);
        if (e.target === captura) setCapturaNaTela(e.isIntersecting);
      }
    });
    if (topo) io.observe(topo);
    if (captura) io.observe(captura);
    return () => io.disconnect();
  }, []);
  const on = topoFora && !capturaNaTela;
  return (
    <div
      data-on={on}
      inert={!on}
      className="sx-fixed fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:p-0"
    >
      <SitesCta label={label} location="fixo" className="w-full max-w-md sm:w-auto" />
    </div>
  );
}
