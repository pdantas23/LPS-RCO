"use client";

import { ECOM_ANCHORS, ECOM_NAV } from "@/content/ecom";
import { track } from "@/lib/tracking/events";
import { Logo } from "./Logo";

/**
 * Menu da /lp-ecom: logo à esquerda, âncoras internas e o botão "Analisar minha loja" (rola até o formulário).
 * No celular só o logo e o botão.
 */
export function EcomHeader({ page }: { page: string }) {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-center gap-4 md:justify-between px-5 py-4">
      <a href="#topo" aria-label="RCO Hub, início da página">
        <Logo className="h-9" />
      </a>
      <nav aria-label="Seções da página" className="hidden items-center gap-7 text-sm md:flex">
        {ECOM_NAV.links.map((l) => (
          <a key={l.href} href={l.href} className="text-mute transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            {l.label}
          </a>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => {
          track("cta_click", { page_id: page, cta_location: "menu", cta_text: ECOM_NAV.cta });
          document.querySelector(`#${ECOM_ANCHORS.form}`)?.scrollIntoView({ behavior: "smooth" });
        }}
        className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 md:block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {ECOM_NAV.cta}
      </button>
    </header>
  );
}
