/**
 * Origem do lead. Os parâmetros chegam da Bio (P03) ou do anúncio e ficam guardados
 * na sessão: trocar de etapa, recarregar ou corrigir dados não apaga a campanha.
 */

export const CAMPAIGN_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

export type CampaignParam = (typeof CAMPAIGN_PARAMS)[number];

export type Attribution = Record<CampaignParam, string | null> & {
  source_page: string | null;
  conversion_page: string;
};

const KEY = "rco_p02_origem";
const MAX = 300;

/** Só origem + caminho: query e hash de uma página anterior podem carregar qualquer coisa. */
export function pageWithoutQuery(href: string): string | null {
  try {
    const u = new URL(href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin + u.pathname;
  } catch {
    return null;
  }
}

function readStored(storage: Storage | null): Partial<Attribution> | null {
  try {
    const raw = storage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Attribution>) : null;
  } catch {
    return null;
  }
}

/**
 * - URL com algum parâmetro de campanha: vale a URL (nova campanha substitui a anterior).
 * - URL sem parâmetros: vale o que já estava guardado na sessão.
 * - Qualquer outro parâmetro da URL é ignorado.
 */
export function captureAttribution(href: string, referrer: string, storage: Storage | null): Attribution {
  const url = new URL(href);
  const fromUrl = {} as Record<CampaignParam, string | null>;
  let urlHasCampaign = false;
  for (const key of CAMPAIGN_PARAMS) {
    const v = (url.searchParams.get(key) ?? "").trim().slice(0, MAX);
    fromUrl[key] = v || null;
    if (v) urlHasCampaign = true;
  }

  const stored = readStored(storage);
  const campaign = urlHasCampaign || !stored ? fromUrl : pickCampaign(stored);
  const ownPage = pageWithoutQuery(href) ?? href;
  const referrerPage = referrer ? pageWithoutQuery(referrer) : null;

  const result: Attribution = {
    ...campaign,
    // Primeira página de fora vista na sessão; recarregar o formulário não troca a origem.
    source_page: stored?.source_page ?? (referrerPage !== ownPage ? referrerPage : null),
    conversion_page: ownPage,
  };
  try {
    storage?.setItem(KEY, JSON.stringify(result));
  } catch {
    /* navegação privada sem storage: segue só com a URL */
  }
  return result;
}

function pickCampaign(src: Partial<Attribution>): Record<CampaignParam, string | null> {
  const out = {} as Record<CampaignParam, string | null>;
  for (const key of CAMPAIGN_PARAMS) out[key] = typeof src[key] === "string" ? (src[key] as string) : null;
  return out;
}
