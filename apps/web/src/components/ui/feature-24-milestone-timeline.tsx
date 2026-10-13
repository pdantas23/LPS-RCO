"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
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

function Card({ item, measureLabel, align }: { item: TimelineItem; measureLabel: string; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all duration-300 hover:border-brand/60 hover:shadow-lg md:p-6",
        align === "left" && "sm:text-right",
      )}
    >
      <div className={cn("flex items-center gap-3", align === "left" && "sm:flex-row-reverse")}>
        {item.icon ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-bg text-brand">{item.icon}</span>
        ) : null}
        <span className="text-sm font-bold text-brand">{item.tag}</span>
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

  return (
    <div className={className}>
      <SectionHead eyebrow={eyebrow} title={title} support={subtitle} />
      <motion.div key={animate ? "animado" : "estatico"} {...container} className="relative mx-auto max-w-3xl">
        {/* Linha vertical: à esquerda no celular, no centro a partir de sm. */}
        <div aria-hidden="true" className="absolute top-0 bottom-0 left-[15px] w-0.5 bg-line sm:left-1/2 sm:-translate-x-1/2" />
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
                  className="absolute left-[10px] z-10 size-3.5 -translate-x-[6px] rounded-full border-4 border-brand bg-bg transition-transform duration-300 group-hover:scale-150 sm:left-1/2 sm:-translate-x-1/2"
                />
                <div className={cn("w-full pl-8 sm:w-[45%] sm:pl-0", !left && "pointer-events-none hidden sm:block sm:opacity-0")} aria-hidden={!left || undefined}>
                  {left ? <Card item={item} measureLabel={measureLabel} align="left" /> : null}
                </div>
                <div className={cn("w-full pl-8 sm:w-[45%] sm:pl-0", left && "pointer-events-none hidden sm:block sm:opacity-0")} aria-hidden={left || undefined}>
                  {!left ? <Card item={item} measureLabel={measureLabel} align="right" /> : null}
                </div>
              </motion.li>
            );
          })}
        </ol>
      </motion.div>
      {/* Elemento vindo do servidor: fica sozinho dentro de um wrapper (como filho único) para o React não pedir `key`. */}
      {footer ? <div>{footer}</div> : null}
    </div>
  );
}
