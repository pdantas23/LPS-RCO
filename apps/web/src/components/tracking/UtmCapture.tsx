"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PAGES, PAGE_IDS } from "@/content/pages";
import { isPageIdActive } from "@/content/lps";
import { track } from "@/lib/tracking/events";
import { captureTracking, readTracking } from "@/lib/tracking/utms";

let lastTracked: string | null = null;

/**
 * Guarda os parâmetros de campanha da entrada e dispara `page_view` a cada
 * página vista: na carga e em toda navegação client-side (muda o `pathname`).
 * O `lastTracked` evita o disparo duplicado do modo estrito do React em
 * desenvolvimento (efeito roda 2x na mesma montagem); voltar a uma página
 * depois de outra dispara de novo, como deve.
 */
export function UtmCapture() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastTracked === pathname) return;
    lastTracked = pathname;
    captureTracking();
    const id = PAGE_IDS.find((p) => PAGES[p].path === pathname);
    // LP desligada (404): não conta visita. Rota fora das LPs: "other".
    if (id && !isPageIdActive(id)) return;
    track("page_view", { page_id: id ?? "other", page_path: pathname, ...readTracking() });
  }, [pathname]);
  return null;
}
