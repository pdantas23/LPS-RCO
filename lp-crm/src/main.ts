import "./style.css";
import { plans } from "./config";
import { captureCampaign, withParams } from "./lib/campaign";
import { buildCheckoutUrl, readyPlans } from "./lib/plans";
import { createTracker } from "./lib/tracking";

function session(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const storage = session();
const tracker = createTracker(window, storage);
tracker.pageView();
const campaign = captureCampaign(window.location.href, storage);

// CTAs com destino externo levam a origem da campanha; pendentes (sem href) não são medidos.
for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-cta][href]")) {
  const href = a.getAttribute("href") ?? "";
  if (/^https?:/.test(href)) a.href = withParams(href, campaign);
  a.addEventListener("click", () => tracker.ctaClick(a.dataset.cta ?? "", a.dataset.position ?? "", a.getAttribute("href") ?? ""));
}

// Planos: o link já sai com plan_id + origem; o clique registra a escolha e a saída para o checkout.
const byId = new Map(readyPlans(plans).map((p) => [p.id, p]));
for (const a of document.querySelectorAll<HTMLAnchorElement>("a[data-plan]")) {
  const plan = byId.get(a.dataset.plan ?? "");
  if (!plan) continue;
  a.href = buildCheckoutUrl(plan, campaign);
  a.addEventListener("click", () => {
    tracker.planSelect(plan);
    try {
      storage?.setItem("rco_p01_plano", plan.id); // o plano escolhido sobrevive à ida e volta do checkout
    } catch {
      /* sem storage: o plan_id já vai na URL do checkout */
    }
    tracker.beginCheckout(plan);
  });
}
