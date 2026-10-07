import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageP04 } from "@/components/LandingPageP04";
import { LP_ROUTES } from "@/content/lps";
import { PAGES } from "@/content/pages";
import { OG_IMAGE_LP, shareMetadata } from "@/lib/share";

const page = PAGES.P04;

export const metadata: Metadata = shareMetadata({ title: page.title, description: page.description, path: "/lp02", image: OG_IMAGE_LP });

/** /lp02 = P04. DESLIGADA por padrão: liga em LP02_ATIVA (content/site.ts); desligada responde 404. */
export default function Page() {
  if (!LP_ROUTES.lp02.ativa) notFound();
  return <LandingPageP04 page={page} />;
}
