"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// ============================================================
// Gallery4 (shadcn/21st.dev), com a mesma estrutura e classes do original.
// Ajustes: sem `data` de demonstração (sem conteúdo padrão), texto do link e rótulos
// de acessibilidade em pt-BR (`cta`), `onItemClick` para o rastreamento (cta_click),
// `container` do original trocado por largura máxima + gutter (e o primeiro card alinhado a esse gutter) e a cor `primary`
// do gradiente vem do azul da marca (tokens em globals.css).
// ============================================================

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  href: string;
  image: string;
}

export interface Gallery4Props {
  title?: string;
  description?: string;
  items: Gallery4Item[];
  /** Texto do link no rodapé de cada card. */
  cta?: string;
  onItemClick?: (item: Gallery4Item) => void;
}

export function Gallery4({ title, description, items, cta = "Saiba mais", onItemClick }: Gallery4Props) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-8 flex items-end justify-between md:mb-14 lg:mb-16">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-medium md:text-4xl lg:text-5xl">{title}</h2>
            {description ? <p className="max-w-lg text-muted-foreground">{description}</p> : null}
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Card anterior"
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Próximo card"
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{ breakpoints: { "(max-width: 768px)": { dragFree: true } } }}
          aria-label={title}
        >
          <CarouselContent className="ml-[max(0px,calc((100vw-72rem)/2))] 2xl:mr-[max(0rem,calc(50vw-700px))]">
            {items.map((item) => (
              <CarouselItem key={item.id} className="max-w-[320px] pl-[20px] lg:max-w-[360px]">
                <a href={item.href} className="group rounded-xl" onClick={() => onItemClick?.(item)}>
                  <div className="group relative h-full min-h-[27rem] max-w-full overflow-hidden rounded-xl md:aspect-[5/4] lg:aspect-[16/9]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- fotos estáticas já reduzidas em public/ecom; o componente original usa <img> */}
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      draggable={false}
                      className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 h-full bg-[linear-gradient(transparent,color-mix(in_srgb,var(--brand)_40%,transparent),color-mix(in_srgb,var(--brand)_80%,transparent)_100%)] mix-blend-multiply" />
                    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-primary-foreground md:p-8">
                      <div className="mb-2 pt-4 text-xl font-semibold md:mb-3 md:pt-4 lg:pt-4">{item.title}</div>
                      <div className="mb-8 line-clamp-2 md:mb-12 lg:mb-9">{item.description}</div>
                      <div className="flex items-center text-sm font-semibold">
                        {cta} <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="mt-8 flex justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`h-2 w-2 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-primary/20"}`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Ir para o card ${index + 1}`}
              aria-current={currentSlide === index ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
