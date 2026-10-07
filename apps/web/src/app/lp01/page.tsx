import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { LP_ROUTES } from "@/content/lps";
import { PAGES } from "@/content/pages";
import { OG_IMAGE_LP, shareMetadata } from "@/lib/share";

const page = PAGES.P05;

export const metadata: Metadata = shareMetadata({ title: page.title, description: page.description, path: "/lp01", image: OG_IMAGE_LP });

/** /lp01 = P05. Liga/desliga em LP01_ATIVA (content/site.ts). */
export default function Page() {
  if (!LP_ROUTES.lp01.ativa) notFound();
  return <LandingPage page={page} />;
}
