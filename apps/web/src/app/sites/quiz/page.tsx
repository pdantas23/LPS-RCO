import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/sites/Quiz";
import { SITES_CAPTURA } from "@/content/captura/sites";
import { LP_ROUTES } from "@/content/lps";
import { SITES_PAGE } from "@/content/sites";
import { OG_IMAGE_SITES, shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: SITES_PAGE.quizTitle,
  description: SITES_PAGE.description,
  ogTitle: SITES_PAGE.ogTitle,
  ogDescription: SITES_PAGE.ogDescription,
  path: SITES_PAGE.quizPath,
  image: OG_IMAGE_SITES,
});

/** /sites/quiz = captura em tela própria, uma pergunta por tela (bloco 4). Mesma flag da LP. */
export default function Page() {
  if (!LP_ROUTES.sites.ativa) notFound();
  return <Quiz config={SITES_CAPTURA} pageId={SITES_PAGE.id} voltarHref={SITES_PAGE.path} />;
}
