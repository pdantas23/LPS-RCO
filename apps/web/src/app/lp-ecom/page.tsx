import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageEcom } from "@/components/LandingPageEcom";
import { ECOM_PAGE } from "@/content/ecom";
import { LP_ROUTES } from "@/content/lps";
import { OG_IMAGE_ECOM, shareMetadata } from "@/lib/share";

export const metadata: Metadata = shareMetadata({
  title: ECOM_PAGE.title,
  description: ECOM_PAGE.description,
  path: ECOM_PAGE.path,
  image: OG_IMAGE_ECOM,
});

/** /lp-ecom = ECOM (LP de e-commerce). Liga/desliga em LP_ECOM_ATIVA (content/site.ts). */
export default function Page() {
  if (!LP_ROUTES["lp-ecom"].ativa) notFound();
  return <LandingPageEcom />;
}
