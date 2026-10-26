"use client";

import Image from "next/image";
import { useState } from "react";
import { MOSTRAR_SELO_PROVISORIO, SITES_PORTFOLIO } from "@/content/sites";
import { casesDoFiltro, filtrosVisiveis, type TipoPortfolio } from "@/content/sites-portfolio";

/**
 * Galeria do portfólio com filtro por tipo (bloco 2). Filtros e cases de content/sites-portfolio.ts; tipo sem
 * case não aparece. Cartão: print, nome e etiquetas. Sem link para o site real.
 */
export function Galeria() {
  const [filtro, setFiltro] = useState<TipoPortfolio | null>(null);
  const filtros = filtrosVisiveis();
  const cases = casesDoFiltro(filtro);
  const chip = (ativo: boolean) =>
    `h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2878F6] ${
      ativo ? "border-[#2878F6] bg-[#2878F6] text-white" : "border-white/15 text-mute hover:border-white/35 hover:text-ink"
    }`;
  return (
    <div>
      <div role="group" aria-label="Filtrar por tipo de site" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        <button type="button" aria-pressed={filtro === null} onClick={() => setFiltro(null)} className={chip(filtro === null)}>
          {SITES_PORTFOLIO.todos}
        </button>
        {filtros.map((f) => (
          <button key={f} type="button" aria-pressed={filtro === f} onClick={() => setFiltro(f)} className={chip(filtro === f)}>
            {f}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {cases.length} sites
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c) => (
          <li key={c.id} className="sx-card overflow-hidden rounded-2xl border border-white/10 bg-[#0b1430]">
            <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
              <Image src={c.print.src} alt={c.print.alt} width={960} height={600} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="sx-card-shot h-full w-full object-cover object-top" />
              {MOSTRAR_SELO_PROVISORIO && c.provisorio ? (
                <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white/90">{SITES_PORTFOLIO.seloProvisorio}</span>
              ) : null}
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold">{c.nome}</h3>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tipo de site">
                {c.etiquetas.map((t) => (
                  <li key={t} className="rounded-full bg-[#2878F6]/15 px-3 py-1 text-xs font-medium text-[#8fb8ff]">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
