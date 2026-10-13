"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// ============================================================
// Vídeo do hero da /lp-ecom (loop, sem áudio, 960x1080), na moldura à esquerda do formulário. Só do breakpoint xl
// (1280 px) para cima. Abaixo disso o elemento <video> nem é renderizado, então celular e tablet não baixam nada.
// Não atrasa o LCP: o vídeo só entra na primeira interação do visitante (ver abaixo), com preload="metadata".
// Com prefers-reduced-motion mostra só o poster (imagem), sem baixar o vídeo.
// ============================================================

export const HERO_VIDEO = {
  mp4: "/ecom/hero-ecom.mp4",
  poster: "/ecom/hero-ecom-poster.jpg",
} as const;

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function EcomHeroVideo() {
  const desktop = useMedia("(min-width: 1280px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [armed, setArmed] = useState(false);

  // O vídeo só entra na PRIMEIRA interação (mouse, toque, teclado ou rolagem). Motivo: o navegador para de medir o LCP na
  // primeira interação, então nem o poster nem o vídeo (imagens grandes) viram o LCP: ele continua sendo o h1.
  // Até lá a moldura mostra só um fundo em degradê (CSS não conta como candidato a LCP).
  useEffect(() => {
    if (!desktop) return;
    const events = ["pointermove", "pointerdown", "keydown", "scroll", "wheel", "touchstart"] as const;
    const on = () => {
      setArmed(true);
      events.forEach((e) => window.removeEventListener(e, on));
    };
    events.forEach((e) => window.addEventListener(e, on, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, on));
  }, [desktop]);

  if (!desktop || !armed) return null;

  if (reduced) {
    // eslint-disable-next-line @next/next/no-img-element -- poster estático do vídeo, já dimensionado
    return <img src={HERO_VIDEO.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <video
      aria-hidden="true"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={HERO_VIDEO.poster}
      className="absolute inset-0 h-full w-full object-cover"
    >
      <source src={HERO_VIDEO.mp4} type="video/mp4" />
    </video>
  );
}
