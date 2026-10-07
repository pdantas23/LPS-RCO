import type { Metadata } from "next";

/** Origem pública das LPs: base das URLs absolutas de og:image/og:url (o WhatsApp não resolve URL relativa). */
export const SITE_URL = "https://lp.rcohub.com.br";

/** Imagens de compartilhamento 1200x630 em public/og (gere de novo com `node scripts/gen-og.mjs`). */
export const OG_IMAGE_LP = "/og/lp.png";

const ALT = "RCO Hub";

/** Metadata completa (título, descrição, Open Graph e Twitter) de uma LP. openGraph de página substitui o do layout por inteiro, por isso tudo aqui. */
export function shareMetadata(opts: { title: string; description: string; path: string; image: string; alt?: string }): Metadata {
  const { title, description, path, image } = opts;
  const alt = opts.alt ?? title;
  return {
    title,
    description,
    openGraph: {
      type: "website",
      siteName: ALT,
      locale: "pt_BR",
      title,
      description,
      url: path,
      images: [{ url: image, width: 1200, height: 630, type: "image/png", alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt }] },
  };
}
