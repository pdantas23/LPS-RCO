"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================================
// Adaptado de um bloco "features" (21st.dev): lista clicável à esquerda,
// painel fixo à direita (some no mobile, vira acordeão) mostrando o conteúdo
// do item ativo. O componente original vinha com imagens/vídeos de exemplo
// do próprio 21st.dev (Unsplash, clipes de demonstração de CLI) — removidos.
// Aqui `content` é sempre um texto que expande a frase curta do item; nunca
// print de tela nem foto genérica fingindo ser produto de verdade (mesma
// regra do resto do site, ver comentário em `content/pages.ts`). Quando a
// RCO Hub tiver captura de tela real do CRM ou um clipe curto, `content`
// aceita URL de imagem/vídeo também (ver `FeatureMedia` abaixo) sem mudar
// quem chama este componente.
// ============================================================

export interface FeatureItem {
  title: string;
  alt?: string;
  content: string | React.ReactNode;
}

function FeatureMedia({ content, alt }: { content: string | React.ReactNode; alt?: string }) {
  if (typeof content !== "string") {
    return <div className="h-full w-full">{content}</div>;
  }

  const isVideo = /\.(mp4|webm|ogg)$/i.test(content);
  const isImage = /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(content);

  if (isVideo) {
    return <video src={content} autoPlay muted loop playsInline className="h-full w-full object-cover" />;
  }

  if (isImage) {
    // `<img>` normal, não `next/image`: a URL vem de conteúdo (content/pages.ts),
    // não se sabe o domínio de antemão pra configurar `remotePatterns`.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={content} alt={alt} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <p className="text-sm leading-relaxed text-mute">{content}</p>
    </div>
  );
}

export function FeaturesWithPanel({ heading, items }: { heading?: string; items: FeatureItem[] }) {
  const [active, setActive] = React.useState(0);
  const activeItem = items[active];
  if (!activeItem) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          {heading ? <h2 className="mb-8 text-2xl font-bold lg:mb-10">{heading}</h2> : null}

          <ul className="flex flex-col gap-1">
            {items.map((item, index) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
                onClick={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer flex-col rounded-xl px-4 py-3.5 transition-all duration-200 lg:flex-row lg:items-center lg:gap-4",
                  active === index ? "ring-1 ring-brand" : "ring-1 ring-transparent",
                )}
              >
                <div className="flex w-full flex-row items-center gap-4 lg:contents">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-200",
                      active === index ? "bg-brand text-white" : "bg-line text-mute",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className={cn("text-sm font-medium transition-colors duration-200", active === index ? "text-ink" : "text-mute")}>
                    {item.title}
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {active === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="w-full overflow-hidden lg:hidden"
                    >
                      <Card className="relative mt-3 aspect-4/3 w-full gap-0 overflow-hidden p-0">
                        <div className="absolute inset-0">
                          <FeatureMedia content={item.content} alt={item.alt} />
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="sticky top-10 hidden lg:block">
          <Card className="relative aspect-4/3 w-full gap-0 overflow-hidden p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-0"
              >
                <FeatureMedia content={activeItem.content} alt={activeItem.alt} />
              </motion.div>
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </section>
  );
}
