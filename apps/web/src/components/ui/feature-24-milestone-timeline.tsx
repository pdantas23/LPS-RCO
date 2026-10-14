"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { SectionHead } from "../EcomSections";

// ============================================================
// Feature24 (linha do tempo de marcos, 21st.dev/shadcn) adaptado: recebe os dados por props (nada fixo do exemplo),
// usa os tokens da marca (bg, surface, line, brand, ink, mute) no lugar de teal/slate/branco, sem section própria
// (fica sobre o fundo único da página) e respeita prefers-reduced-motion (sem animação de entrada: tudo já visível).
// Animação com o pacote `motion` (o mesmo que o Faq e o ScrollGallery já usam), sem instalar outro.
// Celular: linha à esquerda e todos os cartões à direita dela. A partir de sm: alterna esquerda e direita.
// ============================================================

export interface TimelineItem {
  /** Rótulo pequeno em destaque no cartão (ex.: "Etapa 1"). */
  tag: string;
  title: string;
  description: string;
  icon?: ReactNode;
  /** Opcional: o que é medido nesta etapa. Sem valor, a linha não aparece. */
  measure?: string;
}

export interface MilestoneTimelineProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: readonly TimelineItem[];
  /** Rótulo da linha opcional `measure`. */
  measureLabel?: string;
  /** Conteúdo depois da linha do tempo (ex.: frase de fechamento). */
  footer?: ReactNode;
  className?: string;
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

function Card({ item, measureLabel, lit }: { item: TimelineItem; measureLabel: string; lit: boolean }) {
  // Todos os cartões (esquerda e direita da linha) têm o mesmo miolo, alinhado à esquerda: ícone + "Etapa N" na mesma linha
  // (ícone à esquerda); embaixo o título e o texto. `lit`: a linha do progresso chegou no ponto desta etapa, então o cartão acende
  // (borda e glow) e o feixe de luz atravessa uma vez, junto com o ponto.
  return (
    <div className={cn("fx-card rounded-2xl border border-line bg-surface p-4 text-left shadow-sm md:p-6", lit && "tl-card-lit")}>
      <div className="flex items-center gap-3">
        {item.icon ? (
          <span className="fx-icon grid size-9 shrink-0 place-items-center text-brand">{item.icon}</span>
        ) : null}
        <span className="fx-eyebrow text-sm font-bold text-brand">{item.tag}</span>
      </div>
      <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-mute">{item.description}</p>
      {item.measure ? (
        <p className="mt-3 text-sm leading-relaxed">
          <span className="font-semibold text-ink">{measureLabel}: </span>
          <span className="text-mute">{item.measure}</span>
        </p>
      ) : null}
    </div>
  );
}

export function MilestoneTimeline({ eyebrow, title, subtitle, items, measureLabel = "O que medimos", footer, className }: MilestoneTimelineProps) {
  const reduce = useReducedMotion();
  // `hydrated` é false no servidor e na hidratação, true depois: o HTML do servidor nasce SEM estado inicial escondido
  // (quem tem JS desligado ou prefers-reduced-motion vê tudo). Só depois de hidratar, e sem reduced-motion, o bloco é
  // remontado (key) com a animação de entrada. Remontar é necessário: o React não corrige estilos inline na hidratação.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const animate = hydrated && !reduce;
  const container = animate ? { variants: staggerContainer, initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" } } : {};
  const itemProps = animate ? { variants: popIn } : {};

  // A linha se desenha conforme a rolagem e cada ponto acende quando a linha chega nele. Sem animação (servidor, reduced-motion):
  // linha cheia e todos os pontos acesos.
  const wrapRef = useRef<HTMLDivElement>(null);
  const fracs = useRef<number[]>([]);
  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start 68%", "end 58%"] });
  const [lit, setLit] = useState(items.length);
  // `armed`: só depois da primeira medição (e só com animação) os cartões podem acender; no servidor e antes disso ficam como estão.
  const [armed, setArmed] = useState(false);
  const count = (p: number) => fracs.current.filter((f) => p >= f).length;
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !animate) return;
    const measure = () => {
      const h = wrap.offsetHeight || 1;
      fracs.current = Array.from(wrap.querySelectorAll<HTMLElement>("ol > li")).map((li) => (li.offsetTop + li.offsetHeight / 2) / h);
      setLit(count(scrollYProgress.get()));
      setArmed(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!animate) return;
    const n = count(p);
    setLit((prev) => (prev === n ? prev : n));
  });

  return (
    <div className={className}>
      <SectionHead eyebrow={eyebrow} title={title} support={subtitle} />
      <motion.div key={animate ? "animado" : "estatico"} {...container} ref={wrapRef} className="relative mx-auto max-w-3xl">
        {/* Linha vertical: à esquerda no celular, no centro a partir de sm. A de baixo é o trilho; a de cima é o progresso da rolagem. */}
        <div aria-hidden="true" className="absolute top-0 bottom-0 left-[16px] w-0.5 -translate-x-1/2 bg-line sm:left-1/2" />
        <motion.div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[16px] w-0.5 -translate-x-1/2 bg-[linear-gradient(180deg,var(--brand),#6ea8ff)] shadow-[0_0_12px_rgba(13,103,240,.7)] sm:left-1/2"
          style={animate ? { scaleY: scrollYProgress, originY: 0 } : { scaleY: 1, originY: 0 }}
        />
        <ol>
          {items.map((item, i) => {
            const left = i % 2 === 0;
            return (
              <motion.li
                key={item.title}
                {...itemProps}
                className="group relative mb-10 flex flex-col items-start justify-between last:mb-0 sm:flex-row sm:items-center md:mb-16"
              >
                {/* Ponto na cor da marca, sobre a linha. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[16px] z-10 size-3.5 -translate-x-1/2 rounded-full border-4 bg-bg transition-[transform,border-color,box-shadow] duration-500 group-hover:scale-150 sm:left-1/2",
                    i < lit ? "tl-dot-lit border-brand shadow-[0_0_14px_rgba(13,103,240,.85)]" : "border-line",
                  )}
                />
                <div className={cn("w-full pl-8 sm:w-[45%] sm:pl-0", !left && "pointer-events-none hidden sm:block sm:opacity-0")} aria-hidden={!left || undefined}>
                  {left ? <Card item={item} measureLabel={measureLabel} lit={armed && i < lit} /> : null}
                </div>
                <div className={cn("w-full pl-8 sm:w-[45%] sm:pl-0", left && "pointer-events-none hidden sm:block sm:opacity-0")} aria-hidden={left || undefined}>
                  {!left ? <Card item={item} measureLabel={measureLabel} lit={armed && i < lit} /> : null}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </motion.div>
      {/* Elemento vindo do servidor: fica sozinho dentro de um wrapper (como filho único) para o React não pedir `key`. */}
      {footer ? <div data-rv-group>{footer}</div> : null}
    </div>
  );
}
