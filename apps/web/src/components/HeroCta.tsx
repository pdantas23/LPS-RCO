"use client";

import { track } from "@/lib/tracking/events";
import { ShimmerButton } from "./ui/shimmer-button";

/**
 * Só existe porque `OrbitHero` é um componente de servidor (sem estado, ver
 * o comentário lá) e não pode passar uma função (`onClick`) pra um
 * componente cliente como `ShimmerButton` — o Next não deixa serializar
 * função do servidor pro cliente. Este arquivo isola só o clique (rolar até
 * o formulário), recebendo do servidor só texto (`label`, `targetSelector`),
 * que é serializável.
 */
export function HeroCta({
  label,
  targetSelector,
  page,
  location,
  width = 240,
}: {
  label: string;
  targetSelector: string;
  /** Id da página (P04/P05), para o evento `cta_click`. */
  page: string;
  /** Onde na página está o botão (ex.: hero, resumo_oferta, chamada_final), para o `cta_click`. */
  location: string;
  width?: number;
}) {
  return (
    <ShimmerButton
      width={width}
      onClick={() => {
        track("cta_click", { page_id: page, cta_location: location, cta_text: label });
        document.querySelector(targetSelector)?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {label}
    </ShimmerButton>
  );
}
