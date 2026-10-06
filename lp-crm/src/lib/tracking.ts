/**
 * Eventos da P01 no dataLayer. Sem dado pessoal: só nomes de botão, ids de plano e valores.
 * Travas: page_view uma vez por carregamento; purchase uma vez por transaction_id (localStorage,
 * vale entre sessões e recargas da página de retorno).
 */
import type { Plan } from "../config";

export const PAGE_TYPE = "crm_lp";
const PURCHASE_KEY = "rco_p01_purchases";

type Event = Record<string, string | number>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/** Destino sem query string (âncoras internas ficam como estão). */
export function cleanDestination(href: string): string {
  if (href.startsWith("#")) return href;
  try {
    const u = new URL(href);
    return u.origin + u.pathname;
  } catch {
    return href.split(/[?#]/)[0];
  }
}

export function createTracker(target: Window = window, storage: Storage | null = null) {
  let viewed = false;
  const push = (e: Event) => {
    target.dataLayer = target.dataLayer || [];
    target.dataLayer.push(e);
  };
  const value = (plan: Plan) => (plan.priceCents ?? 0) / 100;

  return {
    pageView(pageType = PAGE_TYPE) {
      if (viewed) return;
      viewed = true;
      push({ event: "page_view", page_type: pageType });
    },
    ctaClick(name: string, position: string, destination: string) {
      push({ event: "cta_click", page_type: PAGE_TYPE, button_name: name, button_position: position, destination: cleanDestination(destination) });
    },
    planSelect(plan: Plan) {
      push({ event: "plan_select", page_type: PAGE_TYPE, plan_id: plan.id, plan_name: plan.name });
    },
    /** Só chamar no momento em que o navegador sai para o checkout do provedor. */
    beginCheckout(plan: Plan) {
      push({ event: "begin_checkout", page_type: PAGE_TYPE, plan_id: plan.id, plan_name: plan.name, value: value(plan), currency: plan.currency });
    },
    /** Só chamar com status "approved" vindo do servidor. Retorna false se já tinha sido registrado. */
    purchase(p: { transactionId: string; valueCents: number; currency: string; planId: string }): boolean {
      const done = readPurchases(storage);
      if (done.includes(p.transactionId)) return false;
      push({ event: "purchase", transaction_id: p.transactionId, value: p.valueCents / 100, currency: p.currency, plan_id: p.planId });
      try {
        storage?.setItem(PURCHASE_KEY, JSON.stringify([...done, p.transactionId].slice(-50)));
      } catch {
        /* sem storage: sem trava entre recargas, mas a página só chama uma vez por carga */
      }
      return true;
    },
  };
}

function readPurchases(storage: Storage | null): string[] {
  try {
    const v = JSON.parse(storage?.getItem(PURCHASE_KEY) ?? "[]");
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export type Tracker = ReturnType<typeof createTracker>;
