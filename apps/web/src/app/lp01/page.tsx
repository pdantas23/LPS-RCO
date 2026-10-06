import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { LP_ROUTES } from "@/content/lps";
import { PAGES } from "@/content/pages";

const page = PAGES.P05;

export const metadata: Metadata = { title: page.title, description: page.description };

/** /lp01 = P05. Liga/desliga em LP01_ATIVA (content/site.ts). */
export default function Page() {
  if (!LP_ROUTES.lp01.ativa) notFound();
  return <LandingPage page={page} />;
}
