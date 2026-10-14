"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PageConfig, PageId } from "@/content/pages";
import { track } from "@/lib/tracking/events";
import { cn } from "@/lib/utils";

// ============================================================
// Antes era `<details>`/`<summary>` nativo: abre/fecha na hora, sem
// transição (só o "+" girava, via CSS `group-open`). Reescrito com estado
// próprio + `motion` (mesma lib já usada em HeroTitle/IncludedFlow) pra
// animar altura e opacidade de verdade na abertura/fechamento. Cada item
// abre/fecha independente dos outros, igual ao `<details>` de antes (não é
// um acordeão exclusivo).
// ============================================================

export function Faq({ items, page, eyebrow, title = "Perguntas frequentes" }: { items: PageConfig["faq"]; page: PageId; eyebrow?: string; title?: string }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    // Só a ABERTURA conta (fechar não é interesse novo). Fora do updater: o React pode rodá-lo duas vezes.
    if (!openIndexes.has(index)) {
      track("faq_open", { page_id: page, question: items[index]!.q, question_index: index + 1 });
    }
  };

  return (
    <section data-rv-group className="mx-auto max-w-3xl px-5 pb-12 sm:pb-20">
      {eyebrow ? (
        <p data-rv-item className="fx-eyebrow mb-3 text-center text-sm font-semibold tracking-wide text-brand uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 data-rv-item className="mb-6 text-center text-2xl font-bold">
        {title}
      </h2>
      <div data-rv-item className="fx-faq divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((f, index) => {
          const open = openIndexes.has(index);
          const panelId = `faq-panel-${index}`;
          return (
            <div key={f.q} className="p-5">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 text-left font-semibold"
              >
                {f.q}
                <span
                  aria-hidden="true"
                  className={cn("shrink-0 text-brand transition-transform duration-300", open && "rotate-45")}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.div
                    id={panelId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 text-mute">{f.a}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
