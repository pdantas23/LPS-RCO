import { LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA, SITES_ATIVA } from "./site";

// ============================================================
// As LPs do domínio único e a ligação entre elas.
//
//   rota          lp_origem   page_id (interno)   quem serve                         lead vai como
//   /             form        P02                 build estático (formulario/)        origem p02 (ver README)
//   /lp01         lp01        P05                 este app Next                       origem p05 (token P05)
//   /lp02         lp02        P04                 este app Next (DESLIGADA)           origem p04 (token P04)
//   /lp-ecom      lp-ecom     ECOM                este app Next (LP de e-commerce)    origem lp-ecom (token ECOM)
//   /sites        sites       SITES               este app Next (LP de sites + quiz)  origem sites (token SITES)
//
// `lp_origem` é o parâmetro padrão de TODO evento do dataLayer (docs/gtm-eventos.md);
// `page_id` continua sendo o id interno (o mesmo que o COMERCIAL conhece). O vínculo com
// o COMERCIAL NÃO usa a rota: usa page_id (PAGES.*.formId e o token COMERCIAL_LEAD_TOKEN_<ID>).
// ============================================================

export const LP_ORIGENS = ["form", "lp01", "lp02", "lp-ecom", "sites"] as const;
export type LpOrigem = (typeof LP_ORIGENS)[number];

export interface LpRoute {
  origem: LpOrigem;
  path: string;
  /** Id interno da página (o do COMERCIAL para P02/P04/P05). */
  pageId: string;
  ativa: boolean;
}

export const LP_ROUTES: Record<LpOrigem, LpRoute> = {
  form: { origem: "form", path: "/", pageId: "P02", ativa: true },
  lp01: { origem: "lp01", path: "/lp01", pageId: "P05", ativa: LP01_ATIVA },
  lp02: { origem: "lp02", path: "/lp02", pageId: "P04", ativa: LP02_ATIVA },
  "lp-ecom": { origem: "lp-ecom", path: "/lp-ecom", pageId: "ECOM", ativa: LP_ECOM_ATIVA },
  // O quiz (/sites/quiz) é a mesma LP: mesmo page_id e mesma origem (content/sites.ts → SITES_PAGE.quizPath).
  sites: { origem: "sites", path: "/sites", pageId: "SITES", ativa: SITES_ATIVA },
};

/** `lp_origem` de um page_id interno; undefined para id desconhecido ("other"). */
export function lpOrigemOfPageId(pageId: string): LpOrigem | undefined {
  return Object.values(LP_ROUTES).find((r) => r.pageId === pageId)?.origem;
}

/** A LP atende neste momento? Id desconhecido = não. */
export function isPageIdActive(pageId: string): boolean {
  return Object.values(LP_ROUTES).some((r) => r.pageId === pageId && r.ativa);
}
