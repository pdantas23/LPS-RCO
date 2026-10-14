import { useId } from "react";
import { cn } from "@/lib/utils";
import { IconBox } from "../EcomSections";

// ============================================================
// GridFeatureCards (grid-feature-cards, 21st.dev) adaptado à /lp-ecom: grade de cartões encostados, linhas tracejadas na cor
// `line`, e em cada cartão um fundo decorativo com malha e alguns quadrados. Diferenças do original:
//  - os quadrados da malha são DETERMINÍSTICOS (semente = título do item), sem sorteio a cada render: o servidor e o navegador geram os
//    mesmos quadrados e a hidratação não quebra;
//  - a cor vem da variável `--tone` (classe tone-* na seção, em lp-motion.css), não de `foreground`;
//  - a entrada ao rolar usa o sistema da página (data-rv-group/data-rv-item), no lugar do AnimatedContainer;
//  - todos os cartões de uma grade têm a mesma altura (auto-rows-fr).
// ============================================================

export interface GridFeature {
  icon: string;
  title: string;
  text: string;
}

/** Gerador pseudoaleatório com semente (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 5 quadrados [x de 7 a 10, y de 1 a 6], sempre os mesmos para o mesmo título. */
export function patternFor(title: string, n = 5): [number, number][] {
  const rnd = seeded(hash(title));
  const seen = new Set<string>();
  const out: [number, number][] = [];
  // Sem quadrados repetidos (a mesma posição duas vezes). A faixa tem 4 x 6 = 24 posições, então n <= 24 sempre fecha.
  for (let guard = 0; out.length < Math.min(n, 24) && guard < 500; guard++) {
    const p: [number, number] = [Math.floor(rnd() * 4) + 7, Math.floor(rnd() * 6) + 1];
    const k = `${p[0]}-${p[1]}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

function GridPattern({ squares }: { squares: [number, number][] }) {
  const id = useId();
  const size = 20;
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" style={{ stroke: "color-mix(in srgb, var(--tone) 30%, transparent)" }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x={-12} y={4}>
          <path d={`M.5 ${size}V.5H${size}`} fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
      <svg x={-12} y={4} className="overflow-visible" style={{ fill: "color-mix(in srgb, var(--tone) 24%, transparent)" }}>
        {squares.map(([x, y], i) => (
          <rect key={`${i}:${x}-${y}`} strokeWidth="0" width={size + 1} height={size + 1} x={x * size} y={y * size} />
        ))}
      </svg>
    </svg>
  );
}

function FeatureCard({ feature, quote }: { feature: GridFeature; quote: boolean }) {
  return (
    <li data-rv-item className="fx-gcard relative overflow-hidden p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]"
      >
        <div
          className="absolute inset-0 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]"
          style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--tone) 14%, transparent), color-mix(in srgb, var(--tone) 3%, transparent))" }}
        >
          <GridPattern squares={patternFor(feature.title)} />
        </div>
      </div>
      <div className="relative">
        <IconBox name={feature.icon} />
        <h3 className={cn("mt-8 font-bold text-ink", quote ? "text-lg leading-snug" : "text-base md:text-lg")}>{feature.title}</h3>
        <p className="relative z-20 mt-2 text-sm leading-relaxed text-mute">{feature.text}</p>
      </div>
    </li>
  );
}

/**
 * Grade de cartões (não clicáveis): 1 coluna no celular, 2 no sm, 3 no md. A cor da seção vem da classe tone-* que o pai aplica.
 * `quote`: o título é uma fala (Objeções).
 */
export function GridFeatureCards({ items, quote = false, className }: { items: readonly GridFeature[]; quote?: boolean; className?: string }) {
  return (
    <ul
      data-rv-group
      className={cn(
        "grid auto-rows-fr grid-cols-1 divide-x divide-y divide-dashed divide-line border border-dashed border-line sm:grid-cols-2 md:grid-cols-3",
        className,
      )}
    >
      {items.map((f) => (
        <FeatureCard key={f.title} feature={f} quote={quote} />
      ))}
    </ul>
  );
}
