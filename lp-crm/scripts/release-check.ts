/**
 * Trava de publicação da P01: lista o que ainda é PENDING_BUSINESS_CONFIGURATION.
 * Sai com erro (exit 1) enquanto houver bloqueio para VENDER — não publique com ele falhando.
 */
import * as cfg from "../src/config.ts";
import { isPlanReady } from "../src/lib/plans.ts";

type Item = { level: "BLOQUEIA" | "pendente"; what: string };
export function audit(c: typeof cfg): Item[] {
  const items: Item[] = [];
  const ready = c.plans.filter(isPlanReady);
  if (!ready.length) items.push({ level: "BLOQUEIA", what: "planos, preços e periodicidade (nenhum plano completo)" });
  for (const p of c.plans.filter((p) => !isPlanReady(p)))
    items.push({ level: "BLOQUEIA", what: `plano "${p.id || "(sem id)"}" incompleto (nome, preço, período ou checkoutUrl)` });
  if (!c.checkout.provider) items.push({ level: "BLOQUEIA", what: "provedor de pagamento" });
  if (!c.checkout.orderStatusEndpoint)
    items.push({ level: "BLOQUEIA", what: "endpoint de status do pedido no servidor (confirmação de pagamento)" });
  if (!c.heroShot) items.push({ level: "BLOQUEIA", what: "tela real principal do CRM (heroShot)" });
  const semTela = c.deepDives.filter((d) => !d.shot).map((d) => d.id);
  if (semTela.length) items.push({ level: "pendente", what: `telas reais das seções: ${semTela.join(", ")} (hoje com desenho esquemático)` });
  if (!c.links.login) items.push({ level: "pendente", what: "link oficial do acesso de clientes" });
  if (!c.links.whatsapp) items.push({ level: "pendente", what: "WhatsApp comercial" });
  if (!c.GTM_ID) items.push({ level: "pendente", what: "GTM ID" });
  if (!c.testimonials.length) items.push({ level: "pendente", what: "depoimentos autorizados (seção oculta)" });
  items.push({ level: "pendente", what: "copy oficial, suporte, cancelamento e regra de liberação de acesso" });
  return items;
}

if (process.argv[1]?.endsWith("release-check.ts")) {
  const items = audit(cfg);
  for (const i of items) console.log(`${i.level === "BLOQUEIA" ? "✗" : "·"} [${i.level}] ${i.what}`);
  const blocks = items.filter((i) => i.level === "BLOQUEIA").length;
  console.log(blocks ? `\n${cfg.PENDING}: ${blocks} bloqueio(s) — NÃO publicar como página de venda.` : "\nSem bloqueios comerciais.");
  process.exit(blocks ? 1 : 0);
}
