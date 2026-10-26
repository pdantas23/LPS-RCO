import Image from "next/image";
import {
  SITES_ANCORAS, SITES_COMO_FUNCIONA, SITES_FIXO, SITES_HERO, SITES_PORTFOLIO, SITES_RODAPE, VAGAS_FRASE,
} from "@/content/sites";
import { Galeria } from "./Galeria";
import { SitesBotaoFixo, SitesCapturaProvider, SitesCapturaSecao, SitesCta } from "./SitesCaptura";
import { SitesDevices } from "./SitesDevices";
import { SitesMotion } from "./SitesMotion";
import "./sites.css";

const WRAP = "mx-auto w-full max-w-6xl px-5 sm:px-8";

function Words({ text }: { text: string }) {
  return text.split(" ").map((w, i) => (
    <span key={`${w}-${i}`}>
      <span className="sx-word" style={{ ["--w" as string]: i }}>
        {w}
      </span>{" "}
    </span>
  ));
}

function Cabecalho({ eyebrow, title, support }: { eyebrow: string; title: string; support?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p data-sx-rv className="text-sm font-semibold tracking-wide text-[#8fb8ff] uppercase">{eyebrow}</p>
      <h2 data-sx-rv style={{ ["--i" as string]: 1 }} className="mt-3 text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-4xl">
        {title}
      </h2>
      {support ? (
        <p data-sx-rv style={{ ["--i" as string]: 2 }} className="mt-4 text-lg text-mute">
          {support}
        </p>
      ) : null}
    </div>
  );
}

function Icone({ nome }: { nome: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7">
      {nome === "code" ? <path {...p} d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /> : null}
      {nome === "wallet" ? <path {...p} d="M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14V9H5a2 2 0 0 1-2-2Zm13 7h.01" /> : null}
      {nome === "whatsapp" ? <path {...p} d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8L4 20Zm5-11c0 3 3 6 6 6l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2L9 9Z" /> : null}
    </svg>
  );
}

/**
 * /sites: LP de venda de sites (briefing do Luis v2.2, bloco 1). De cima pra baixo: topo (promessa, botão e
 * aparelhos com sites da RCO), portfólio com filtro, como funciona, captura (quiz ou card, conforme a versão) e
 * botão fixo "Quero meu site". Sem menu, sem link para fora e sem preço. Texto em content/sites.ts (PROVISÓRIO).
 */
export function LandingPageSites() {
  return (
    <SitesCapturaProvider>
      <main className="sx relative overflow-x-clip pb-24 sm:pb-0">
        <SitesMotion />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[1100px]" style={{ background: "radial-gradient(60% 50% at 80% 0%, rgba(40,120,246,.28), transparent 70%), radial-gradient(50% 40% at 0% 30%, rgba(13,103,240,.18), transparent 70%)" }} />

        {/* ---------- Topo ---------- */}
        <section className={`${WRAP} relative pt-6 pb-10 sm:pb-16`}>
          <div className="flex justify-center">
            <Image src="/rco-logo-white.png" alt="RCO Hub" width={406} height={387} priority className="h-9 w-auto" />
          </div>
          <div className="mx-auto mt-10 max-w-4xl text-center sm:mt-14">
            <p className="sx-fade text-sm font-semibold tracking-wide text-[#8fb8ff] uppercase" style={{ ["--d" as string]: "0.05s" }}>
              {SITES_HERO.eyebrow}
            </p>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.6rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">
              <Words text={SITES_HERO.title} />
            </h1>
            <p className="sx-fade mx-auto mt-5 max-w-2xl text-lg text-mute" style={{ ["--d" as string]: "0.55s" }}>
              {SITES_HERO.subtitle}
            </p>
            <div id="sx-topo-cta" className="sx-fade mt-8 flex justify-center" style={{ ["--d" as string]: "0.75s" }}>
              <SitesCta label={SITES_HERO.cta} location="topo" />
            </div>
            {VAGAS_FRASE ? <p className="mt-4 text-sm text-mute">{VAGAS_FRASE}</p> : null}
          </div>
          <div className="mt-10 sm:mt-14">
            <SitesDevices />
          </div>
        </section>

        {/* ---------- Portfólio ---------- */}
        <section id={SITES_ANCORAS.portfolio} className={`${WRAP} scroll-mt-6 py-14 sm:py-20`}>
          <Cabecalho eyebrow={SITES_PORTFOLIO.eyebrow} title={SITES_PORTFOLIO.title} support={SITES_PORTFOLIO.support} />
          <div data-sx-rv className="mt-10">
            <Galeria />
          </div>
        </section>

        {/* ---------- Como funciona ---------- */}
        <section id={SITES_ANCORAS.comoFunciona} className={`${WRAP} scroll-mt-6 py-14 sm:py-20`}>
          <Cabecalho eyebrow={SITES_COMO_FUNCIONA.eyebrow} title={SITES_COMO_FUNCIONA.title} support={SITES_COMO_FUNCIONA.support} />
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {SITES_COMO_FUNCIONA.items.map((it, i) => (
              <li key={it.title} data-sx-rv style={{ ["--i" as string]: i }} className="rounded-2xl border border-white/10 bg-[#0b1430] p-6 sm:p-7">
                <div className="flex items-center gap-3 text-[#5c9bff]">
                  <Icone nome={it.icon} />
                  <span className="text-sm font-semibold text-mute">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{it.title}</h3>
                <p className="mt-2 leading-relaxed text-mute">{it.text}</p>
              </li>
            ))}
          </ol>
          <p data-sx-rv className="mx-auto mt-10 max-w-2xl text-center text-mute">{SITES_COMO_FUNCIONA.nota}</p>
          <div data-sx-rv className="mt-8 flex justify-center">
            <SitesCta label={SITES_COMO_FUNCIONA.cta} location="como_funciona" />
          </div>
        </section>

        {/* ---------- Captura ---------- */}
        <section id={SITES_ANCORAS.captura} className="mx-auto w-full max-w-xl scroll-mt-6 px-5 py-14 sm:py-20">
          <SitesCapturaSecao />
        </section>

        <footer className="border-t border-white/10">
          <div className={`${WRAP} py-8 text-center text-sm text-mute`}>
            <p>{SITES_RODAPE.tagline}</p>
            <p className="mt-2">{SITES_RODAPE.copyright}</p>
          </div>
        </footer>

        <SitesBotaoFixo label={SITES_FIXO.cta} />
      </main>
    </SitesCapturaProvider>
  );
}
