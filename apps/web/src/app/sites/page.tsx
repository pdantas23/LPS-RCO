import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageSites } from "@/components/sites/LandingPageSites";
import { LP_ROUTES } from "@/content/lps";
import { SITES_PAGE } from "@/content/sites";
import { OG_IMAGE_SITES, shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: SITES_PAGE.title,
  description: SITES_PAGE.description,
  ogTitle: SITES_PAGE.ogTitle,
  ogDescription: SITES_PAGE.ogDescription,
  path: SITES_PAGE.path,
  image: OG_IMAGE_SITES,
});

/** /sites = LP de venda de sites (SITES). Liga/desliga em SITES_ATIVA (content/site.ts). */
export default function Page() {
  if (!LP_ROUTES.sites.ativa) notFound();
  return <LandingPageSites />;
}
