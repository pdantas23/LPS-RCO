"use client";

import Image from "next/image";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MOSTRAR_SELO_PROVISORIO, SITES_PORTFOLIO } from "@/content/sites";
import { casesDoFiltro, filtrosVisiveis, type TipoPortfolio } from "@/content/sites-portfolio";

// Duração das transições da troca de filtro (faixa pedida: 150 a 250 ms, ease-out).
const DUR = 0.22;
const EASE = "easeOut" as const;
/** Intervalo entre os cartões que entram (sequência curta). */
const PASSO = 0.04;

/**
 * Galeria do portfólio com filtro por tipo (bloco 2). Filtros e cases de content/sites-portfolio.ts; tipo sem
 * case não aparece. Cartão: print, nome e uma linha dizendo o que é o site (os tipos servem só ao filtro). Sem link
 * para o site real.
 *
 * Troca de filtro com motion (mesmo pacote da /lp-ecom): o cartão que sai some com fade e encolhe de leve, os que
 * ficam deslizam para a nova posição (layout), os que entram aparecem com fade e sobem um pouco, em sequência
 * curta; o filtro ativo tem um indicador que desliza entre as opções (layoutId). A altura da grade fica reservada
 * durante a troca, para a página não pular. Com prefers-reduced-motion: só fade, sem deslocamento.
 */
export function Galeria() {
  const reduce = useReducedMotion() ?? false;
  const [filtro, setFiltro] = useState<TipoPortfolio | null>(null);
  const [alturaReservada, setAlturaReservada] = useState<number | null>(null);
  const gradeRef = useRef<HTMLUListElement>(null);
  const soltar = useRef<number | undefined>(undefined);
  const filtros = filtrosVisiveis();
  const cases = casesDoFiltro(filtro);

  useEffect(() => () => window.clearTimeout(soltar.current), []);

  const escolher = (f: TipoPortfolio | null) => {
    if (f === filtro) return;
    // Segura a altura atual da grade enquanto os cartões trocam; solta quando a animação termina.
    const h = gradeRef.current?.offsetHeight;
    if (h) setAlturaReservada(h);
    window.clearTimeout(soltar.current);
    soltar.current = window.setTimeout(() => setAlturaReservada(null), (DUR + PASSO * 6) * 1000 + 120);
    setFiltro(f);
  };

  const chip = (ativo: boolean) =>
    `relative h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2878F6] ${
      ativo ? "border-transparent text-white" : "border-white/15 text-mute hover:border-white/35 hover:text-ink"
    }`;
  const indicador = (
    <motion.span
      layoutId="sx-filtro-ativo"
      aria-hidden="true"
      className="absolute inset-0 rounded-full bg-[#2878F6]"
      transition={reduce ? { duration: 0 } : { duration: DUR, ease: EASE }}
    />
  );
  const opcoes: { valor: TipoPortfolio | null; rotulo: string }[] = [{ valor: null, rotulo: SITES_PORTFOLIO.todos }, ...filtros.map((f) => ({ valor: f, rotulo: f }))];

  return (
    <div>
      <LayoutGroup id="sx-filtros">
        <div role="group" aria-label="Filtrar por tipo de site" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          {opcoes.map((o) => {
            const ativo = filtro === o.valor;
            return (
              <button key={o.rotulo} type="button" aria-pressed={ativo} onClick={() => escolher(o.valor)} className={chip(ativo)}>
                {ativo ? indicador : null}
                <span className="relative">{o.rotulo}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      <p className="sr-only" aria-live="polite">
        {cases.length} sites
      </p>
      <ul
        ref={gradeRef}
        className="relative mt-8 grid grid-cols-1 content-start gap-5 sm:grid-cols-2 lg:grid-cols-3"
        style={alturaReservada ? { minHeight: alturaReservada } : undefined}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {cases.map((c, i) => (
            <motion.li
              key={c.id}
              layout={reduce ? false : "position"}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: DUR, ease: EASE, delay: reduce ? 0 : Math.min(i, 6) * PASSO } }}
              exit={reduce ? { opacity: 0, transition: { duration: DUR, ease: EASE } } : { opacity: 0, scale: 0.94, transition: { duration: DUR * 0.8, ease: EASE } }}
              transition={{ layout: { duration: DUR, ease: EASE } }}
              className="sx-card overflow-hidden rounded-2xl border border-white/10 bg-[#0b1430]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                <Image src={c.print.src} alt={c.print.alt} width={960} height={600} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="sx-card-shot h-full w-full object-cover object-top" />
                {MOSTRAR_SELO_PROVISORIO && c.provisorio ? (
                  <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90">{SITES_PORTFOLIO.seloProvisorio}</span>
                ) : null}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">{c.nome}</h3>
                <p className="mt-1.5 line-clamp-2 min-h-[2.75em] text-sm leading-snug text-mute">{c.descricao}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
