import type { Plan } from "../config";
import { withParams, type Campaign } from "./campaign";

/** Um plano só vai para a tela quando TODO dado comercial dele está definido. */
export function isPlanReady(plan: Plan): boolean {
  return (
    plan.id.trim() !== "" &&
    plan.name.trim() !== "" &&
    Number.isInteger(plan.priceCents) &&
    (plan.priceCents as number) >= 0 &&
    plan.period.trim() !== "" &&
    /^https:\/\//.test(plan.checkoutUrl)
  );
}

export function readyPlans(plans: Plan[]): Plan[] {
  return plans.filter(isPlanReady);
}

export function formatPrice(cents: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

/**
 * URL do checkout: plano escolhido (plan_id) + origem da campanha. Nada pessoal na URL.
 * O plano também vai no próprio link do provedor (checkoutUrl é por plano), então ele não se perde.
 */
export function buildCheckoutUrl(plan: Plan, campaign: Campaign): string {
  return withParams(plan.checkoutUrl, { plan_id: plan.id, ...campaign });
}
