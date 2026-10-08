"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// ============================================================
// Gallery4 (shadcn/21st.dev), com a mesma estrutura e classes do original.
// Ajustes: sem `data` de demonstração (sem conteúdo padrão), texto do link e rótulos
// de acessibilidade em pt-BR (`cta`), `onItemClick` para o rastreamento (cta_click),
// `container` do original trocado por largura máxima + gutter (o primeiro card alinhado a esse gutter; setas em faixas laterais fora da área dos cards) e a cor `primary`
// do gradiente vem do azul da marca (tokens em globals.css).
// ============================================================

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface Gallery4Props {
  title?: string;
  description?: string;
  items: Gallery4Item[];
  /** Botão (ou qualquer elemento) centralizado abaixo do carrossel. */
  action?: React.ReactNode;
}

export function Gallery4({ title, description, items, action }: Gallery4Props) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };
    carouselApi.on("init", updateSelection);
    carouselApi.on("reInit", updateSelection);
    carouselApi.on("select", updateSelection);
    queueMicrotask(updateSelection);
    return () => {
      carouselApi.off("init", updateSelection);
      carouselApi.off("reInit", updateSelection);
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium md:text-4xl lg:text-5xl">{title}</h2>
            {description ? <p className="max-w-lg text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{ breakpoints: { "(max-width: 768px)": { dragFree: true } } }}
          aria-label={title}
          // md+: faixas de 48 px dos dois lados, só para as setas (nenhum card passa por baixo delas).
          // Carrossel de ponta a ponta da tela (o título fica no container normal); em telas enormes para em 1800 px.
          className="mx-auto w-full max-w-[1800px] md:px-[48px]"
        >
          <CarouselContent className="touch-pan-y ml-0">
            {items.map((item) => (
              <CarouselItem key={item.id} className="max-w-[320px] pl-[20px] lg:max-w-[360px]">
                <div className="group relative h-full min-h-[30rem] max-w-full overflow-hidden rounded-xl md:aspect-[5/4] lg:aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fotos estáticas já reduzidas em public/ecom; o componente original usa <img> */}
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 h-full bg-[linear-gradient(transparent,color-mix(in_srgb,var(--brand)_40%,transparent),color-mix(in_srgb,var(--brand)_80%,transparent)_100%)] mix-blend-multiply" />
                  {/* Camada escura embaixo: o texto inteiro (sem corte) precisa ler bem sobre qualquer foto. */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--bg)_92%,transparent)_0%,color-mix(in_srgb,var(--bg)_75%,transparent)_45%,transparent_75%)]" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-primary-foreground md:p-8">
                    <div className="mb-3 text-xl font-semibold">{item.title}</div>
                    <p className="text-base leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Setas nas laterais, só a partir de md (no celular o dedo arrasta e rola os cards). */}
          <Button
            size="icon"
            variant="ghost"
            aria-label="Card anterior"
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="absolute top-1/2 left-0 z-10 hidden size-11 [&_svg]:size-7 -translate-y-1/2 text-ink/90 transition-colors hover:bg-transparent hover:text-brand disabled:opacity-30 md:left-[4px] md:inline-flex"
          >
            <ArrowLeft className="size-7" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Próximo card"
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            className="absolute top-1/2 right-0 z-10 hidden size-11 [&_svg]:size-7 -translate-y-1/2 text-ink/90 transition-colors hover:bg-transparent hover:text-brand disabled:opacity-30 md:right-[4px] md:inline-flex"
          >
            <ArrowRight className="size-7" />
          </Button>
        </Carousel>
        {action ? <div className="mt-10 flex justify-center px-5">{action}</div> : null}
      </div>
    </section>
  );
}
