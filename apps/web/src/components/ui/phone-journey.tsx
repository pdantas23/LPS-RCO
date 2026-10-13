import "./phone-journey.css";
import { PHONE_SCREENS_HTML } from "./phone-screens";

/**
 * PhoneJourney: o iPhone 3D do hero da /lp-ecom (porte do HTML do vídeo), com as 5 telas da jornada de compra em HTML, CSS e
 * SVG vetoriais (nítido em qualquer zoom, sem imagem). Este componente é só a marcação: quem anima é o motor do hero
 * (components/EcomHeroStory.tsx + lib/hero-timeline.ts), que encontra as peças pelos atributos `data-pj`.
 * Decorativo: aria-hidden. A largura vem do `className` (o conjunto é projetado em 400 px e escalado pela largura).
 */
export function PhoneJourney({ className = "" }: { className?: string }) {
  return (
    <div className={`pj ${className}`} aria-hidden="true" data-pj="root">
      <div className="pj-rig">
        <div className="pj-shadow" data-pj="shadow" />
        <div className="pj-cam" data-pj="cam">
          <div className="pj-stage">
            <div className="pj-rot" data-pj="rot">
              {Array.from({ length: 13 }, (_, i) => i + 1).map((i) => (
                <div key={i} className="edge" style={{ transform: `translateZ(${-i}px)`, ...(i === 13 ? { background: "#10141d" } : {}) }} />
              ))}
              <div className="front">
                <div className="side r" />
                <div className="side l1" />
                <div className="side l2" />
                <div className="side l3" />
                <div className="bezel" />
                <div className="scrn" data-pj="screens" dangerouslySetInnerHTML={{ __html: PHONE_SCREENS_HTML }} />
                <div className="island" />
                <div className="glass" />
                {/* O dedo é cortado nas bordas do aparelho (no vídeo, a tela cortava): não vaza sobre o formulário na pilha. */}
                <div className="finger-clip">
                <svg className="finger" data-pj="finger" width="96" height="300" viewBox="0 0 96 300">
                  <defs>
                    <linearGradient id="fgSkin" x1="0" x2="1">
                      <stop offset="0" stopColor="#e2a988" />
                      <stop offset=".5" stopColor="#f6cfb4" />
                      <stop offset="1" stopColor="#d49674" />
                    </linearGradient>
                    <linearGradient id="fgFade" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#fff" />
                      <stop offset=".55" stopColor="#fff" />
                      <stop offset="1" stopColor="#fff" stopOpacity="0" />
                    </linearGradient>
                    <mask id="fgMask">
                      <rect width="96" height="300" fill="url(#fgFade)" />
                    </mask>
                  </defs>
                  <g mask="url(#fgMask)">
                    <path d="M14 300 L14 52 C14 26 30 8 48 8 C66 8 82 26 82 52 L82 300 Z" fill="url(#fgSkin)" />
                    <path d="M31 40 C31 26 39 18 48 18 C57 18 65 26 65 40 L65 62 C65 70 57 74 48 74 C39 74 31 70 31 62 Z" fill="#fbe4d6" opacity=".9" />
                    <path d="M28 132 C40 138 56 138 68 132" stroke="#c4876a" strokeWidth="2" fill="none" opacity=".5" />
                    <path d="M30 142 C42 147 54 147 66 142" stroke="#c4876a" strokeWidth="1.5" fill="none" opacity=".4" />
                  </g>
                </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
