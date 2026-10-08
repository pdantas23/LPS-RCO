"use client";

import { ECOM_PAINS } from "@/content/ecom";
import { HeroCta } from "./HeroCta";
import { Gallery4 } from "./ui/gallery4";

/**
 * Bloco 2 da /lp-ecom: as dores no carrossel Gallery4. Os cards são só informação; o botão
 * abaixo (mesmo do hero) rola até o formulário e conta `cta_click` (cta_location "dores").
 */
export function EcomPains({ page, formId }: { page: string; formId: string }) {
  return (
    <Gallery4
      title={ECOM_PAINS.heading}
      description={ECOM_PAINS.description}
      items={ECOM_PAINS.items.map((p) => ({ id: p.id, title: p.title, description: p.text, image: p.image }))}
      action={
        <div className="flex max-w-xl flex-col items-center gap-5 text-center">
          <p className="text-lg text-mute">{ECOM_PAINS.closing}</p>
          <HeroCta label={ECOM_PAINS.cta} targetSelector={`#${formId}`} page={page} location="dores" width={280} />
        </div>
      }
    />
  );
}
