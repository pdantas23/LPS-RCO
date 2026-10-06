import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LP_ROUTES } from "@/content/lps";

export const metadata: Metadata = { title: "RCO Hub" };

/**
 * /lp-ecom: rota RESERVADA para a LP de e-commerce (implementação posterior). Sem conteúdo.
 * Desligada (LP_ECOM_ATIVA=false em content/site.ts) responde 404. Quando a página existir:
 * crie o conteúdo/componente aqui, ative o flag e troque o pageId "ECOM" em content/lps.ts
 * pelo id real que o COMERCIAL receber.
 */
export default function Page() {
  if (!LP_ROUTES["lp-ecom"].ativa) notFound();
  // Ativada sem a LP existir: erro claro em vez de página vazia no ar.
  throw new Error("LP_ECOM_ATIVA=true, mas a /lp-ecom ainda não tem conteúdo (apps/web/src/app/lp-ecom/page.tsx).");
}
