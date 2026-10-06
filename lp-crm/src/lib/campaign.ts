/**
 * Origem da campanha (mesmas regras da P02/P03): só estes 7 parâmetros viajam,
 * guardados na sessão para sobreviver à troca de seção/rota até o checkout.
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

export type Campaign = Partial<Record<(typeof CAMPAIGN_PARAMS)[number], string>>;

const KEY = "rco_p01_origem";

/** URL com algum parâmetro de campanha vence; sem nenhum, vale o que já estava na sessão. */
export function captureCampaign(href: string, storage: Storage | null): Campaign {
  const params = new URL(href).searchParams;
  const fromUrl: Campaign = {};
  for (const key of CAMPAIGN_PARAMS) {
    const v = (params.get(key) ?? "").trim().slice(0, 300);
    if (v) fromUrl[key] = v;
  }
  if (Object.keys(fromUrl).length) {
    try {
      storage?.setItem(KEY, JSON.stringify(fromUrl));
    } catch {
      /* sem storage: segue só com a URL */
    }
    return fromUrl;
  }
  try {
    const stored = JSON.parse(storage?.getItem(KEY) ?? "{}") as Campaign;
    const clean: Campaign = {};
    for (const key of CAMPAIGN_PARAMS) if (typeof stored[key] === "string") clean[key] = stored[key];
    return clean;
  } catch {
    return {};
  }
}

/** Acrescenta parâmetros ao destino sem sobrescrever nem duplicar os que ele já tem. */
export function withParams(destination: string, extra: Record<string, string | undefined>): string {
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    return destination;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return destination;
  for (const [key, value] of Object.entries(extra)) {
    if (value && !url.searchParams.has(key)) url.searchParams.append(key, value);
  }
  return url.toString();
}
