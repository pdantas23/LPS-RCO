import { PORTFOLIO_CASES, VITRINE, type CasePortfolio } from "@/content/sites-portfolio";

// Composição de aparelhos do topo (notebook atrás, três celulares na frente), copiada do projeto do portfólio
// (portfolio/src/components/HeroShowcase.tsx, Phone.tsx e Laptop.tsx) e simplificada: sem parallax de mouse, sem
// link. Decorativa: aria-hidden. Os prints são PROVISÓRIOS (content/sites-portfolio.ts).
// A tela do celular mostra o print de página inteira rolando sozinho, só com o palco visível (classe is-live,
// ligada por SitesMotion).

const SCREEN_W = 372;
const VISIBLE_H = 792 - 54;

function Phone({ c }: { c: CasePortfolio }) {
  const shownH = (SCREEN_W * c.celular.height) / c.celular.width;
  const travel = `${(-Math.max(0, 1 - VISIBLE_H / shownH) * 100).toFixed(3)}%`;
  const ink = c.statusInk === "light" ? "#fff" : "#0f1730";
  return (
    <div className="sx-phone">
      <div className="sx-phone-scale">
        <div className="sx-phone-front">
          <div className="sx-phone-bezel" />
          <div className="sx-phone-screen" style={{ background: c.statusBg }}>
            <div className="sx-phone-status" style={{ background: c.statusBg, color: ink }}>
              <b>9:41</b>
              <svg viewBox="0 0 62 14" fill="currentColor">
                <rect x="0" y="9" width="3" height="5" rx="1" />
                <rect x="5" y="6" width="3" height="8" rx="1" />
                <rect x="10" y="3" width="3" height="11" rx="1" />
                <rect x="15" y="0" width="3" height="14" rx="1" />
                <rect x="45" y="1.5" width="15" height="11" rx="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <rect x="47" y="3.5" width="10" height="7" rx="1.5" />
              </svg>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- print longo rolado por CSS; next/image não ajuda aqui */}
            <img src={c.celular.src} alt="" width={c.celular.width} height={c.celular.height} loading="eager" decoding="async" className="sx-phone-shot" style={{ ["--travel" as string]: travel }} />
          </div>
          <div className="sx-phone-island" />
          <div className="sx-phone-glass" />
        </div>
      </div>
    </div>
  );
}

const byId = (id: string) => PORTFOLIO_CASES.find((c) => c.id === id)!;

export function SitesDevices() {
  const laptop = byId(VITRINE.notebook);
  const phones = VITRINE.celulares.map(byId);
  return (
    <div data-sx-live className="sx-stage" aria-hidden="true">
      <div className="sx-glow" />
      <div className="sx-layer sx-l-laptop">
        <div className="sx-in">
          <div className="sx-float">
            <div className="sx-laptop-lid">
              <div className="sx-laptop-bezel">
                <div className="sx-laptop-screen">
                  {/* eslint-disable-next-line @next/next/no-img-element -- imagem decorativa dentro de um aparelho desenhado em CSS */}
                  <img src={laptop.print.src} alt="" width={960} height={600} fetchPriority="high" />
                  <div className="sx-laptop-glass" />
                </div>
              </div>
            </div>
            <div className="sx-laptop-base" />
          </div>
        </div>
      </div>
      {phones.map((p, i) => (
        <div key={p.id} className={`sx-layer sx-l-phone sx-p${i}`}>
          <div className="sx-tilt">
            <div className="sx-in">
              <div className="sx-float">
                <Phone c={p} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
