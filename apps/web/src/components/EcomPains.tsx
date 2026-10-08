"use client";

import { ECOM_PAINS } from "@/content/ecom";
import { track } from "@/lib/tracking/events";
import { Gallery4 } from "./ui/gallery4";

/** Bloco 2 da /lp-ecom: as dores no carrossel Gallery4. O link de cada card rola até o formulário e conta `cta_click` (cta_location "dores"). */
export function EcomPains({ page, formId }: { page: string; formId: string }) {
  return (
    <Gallery4
      title={ECOM_PAINS.heading}
      description={ECOM_PAINS.description}
      cta={ECOM_PAINS.cta}
      items={ECOM_PAINS.items.map((p) => ({ id: p.id, title: p.title, description: p.text, image: p.image, href: `#${formId}` }))}
      onItemClick={() => track("cta_click", { page_id: page, cta_location: "dores", cta_text: ECOM_PAINS.cta })}
    />
  );
}
