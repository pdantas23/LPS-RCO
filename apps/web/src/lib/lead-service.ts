import {
  buildRespondiPayload,
  deliverItem,
  fieldErrors,
  normalizeBrPhone,
  phoneTail,
  sanitizeTracking,
  type CrmResult,
  type FileOutbox,
  type LogFn,
  type OutboxItem,
  type RateLimiter,
} from "@rco/lead-core/server";
import { isPageIdActive } from "@/content/lps";
import { pageMeta, type PageId } from "@/content/pages";
import { leadSchema } from "./lead-schema";

// ============================================================
// POST /api/lead — a parte que roda no SERVIDOR da LP.
//
// Ordem importa, e é o que protege o lead:
//   1. barra o que é lixo óbvio (origem, tamanho, honeypot, taxa);
//   2. revalida TUDO (o navegador nunca é confiável);
//   3. GRAVA na fila (arquivo) ANTES de falar com o COMERCIAL;
//   4. responde 200 à pessoa;
//   5. só então entrega ao COMERCIAL, fora do caminho da resposta.
// Se o COMERCIAL estiver fora do ar, o lead já está salvo e o worker
// reenvia. A pessoa nunca vê erro do COMERCIAL.
//
// Recebe e devolve Request/Response padrão: dá pra testar sem subir o Next.
// ============================================================

const MAX_BODY_BYTES = 16 * 1024;
const RECENT_TTL_MS = 10 * 60_000;

export interface LeadServiceDeps {
  outbox: FileOutbox;
  send: (item: OutboxItem) => Promise<CrmResult>;
  allowedOrigins: string[];
  rateIp: RateLimiter;
  ratePhone: RateLimiter;
  /** Mesmo telefone + página em poucos minutos = mesma pessoa reenviando. */
  recentByPhone: Map<string, { id: string; at: number }>;
  now?: () => Date;
  /** Roda depois da resposta (no Next: `after`). */
  schedule?: (task: () => Promise<unknown>) => void;
  log?: LogFn;
  /** A LP atende? Padrão: as flags de content/site.ts (LP02_ATIVA etc.). Injetável para testar o fluxo sem depender delas. */
  isPageActive?: (pageId: string) => boolean;
}

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

function originAllowed(req: Request, allowed: string[]): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // não-navegador (curl, teste): a origem não protege contra isso
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host && parsed.host === host) return true;
  return allowed.includes(origin.replace(/\/+$/, ""));
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function handleLeadRequest(req: Request, deps: LeadServiceDeps): Promise<Response> {
  const { outbox, send, rateIp, ratePhone, recentByPhone, allowedOrigins } = deps;
  const now = deps.now ?? (() => new Date());
  const log: LogFn = deps.log ?? (() => {});
  const schedule = deps.schedule ?? ((task) => void task());

  if (!originAllowed(req, allowedOrigins)) {
    log("lead.blocked_origin", {});
    return json(403, { ok: false, error: "forbidden" });
  }

  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" });
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" });

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return json(400, { ok: false, error: "invalid_json" });

  // Honeypot: robô preencheu o campo escondido. Finge sucesso e descarta.
  const website = (data as { website?: unknown }).website;
  if (typeof website === "string" && website.trim() !== "") {
    log("lead.honeypot", { ip: clientIp(req) });
    return json(200, { ok: true });
  }

  const ip = rateIp.check(clientIp(req));
  if (!ip.ok) return json(429, { ok: false, error: "rate_limited" }, { "retry-after": String(ip.retryAfterSec) });

  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) return json(422, { ok: false, errors: fieldErrors(parsed.error) });
  const lead = parsed.data;

  // LP desligada (ex. LP02_ATIVA=false): não aceita lead dela, nem por chamada direta à API.
  if (!(deps.isPageActive ?? isPageIdActive)(lead.page)) {
    log("lead.page_inactive", { page: lead.page });
    return json(404, { ok: false, error: "page_inactive" });
  }

  const e164 = normalizeBrPhone(lead.whatsapp);
  if (!e164) return json(422, { ok: false, errors: { whatsapp: "Informe um WhatsApp válido." } });

  const phone = ratePhone.check(e164);
  if (!phone.ok) return json(429, { ok: false, error: "rate_limited" }, { "retry-after": String(phone.retryAfterSec) });

  const at = now();
  const page = lead.page as PageId;

  // Mesma pessoa reenviando (recarregou a página, clicou de novo com outro id):
  // não cria segundo lead nem segundo negócio no CRM.
  const recentKey = `${page}|${e164}`;
  const recent = recentByPhone.get(recentKey);
  if (recent && at.getTime() - recent.at < RECENT_TTL_MS && outbox.statusOf(recent.id)) {
    log("lead.duplicate_recent", { id: recent.id, page, phone: phoneTail(e164) });
    return json(200, { ok: true, id: recent.id, duplicate: true });
  }

  const payload = buildRespondiPayload({
    page: pageMeta(page),
    respondentId: lead.respondentId,
    lead: { name: lead.name, whatsappE164: e164, email: lead.email, nicho: lead.nicho, faturamento: lead.faturamento },
    tracking: sanitizeTracking(lead.tracking),
  });

  const item: OutboxItem = {
    id: lead.respondentId,
    page,
    status: "pending",
    payload,
    createdAt: at.toISOString(),
    attempts: 0,
    lastAttemptAt: null,
    nextAttemptAt: null,
    lastError: null,
    sentAt: null,
    crm: null,
  };

  try {
    const { created } = outbox.enqueue(item);
    if (!created) {
      log("lead.duplicate_id", { id: item.id, page });
      return json(200, { ok: true, id: item.id, duplicate: true });
    }
  } catch (err) {
    // Sem gravar, não há garantia nenhuma: melhor falhar e a pessoa tentar de novo
    // (com o MESMO id, então não duplica).
    log("lead.persist_error", { page, error: err instanceof Error ? err.message : String(err) });
    return json(500, { ok: false, error: "unavailable" });
  }

  recentByPhone.set(recentKey, { id: item.id, at: at.getTime() });
  if (recentByPhone.size > 1000) {
    for (const [k, v] of recentByPhone) if (at.getTime() - v.at > RECENT_TTL_MS) recentByPhone.delete(k);
  }

  log("lead.received", {
    id: item.id,
    page,
    phone: phoneTail(e164),
    tracking: Object.keys(sanitizeTracking(lead.tracking)),
  });

  schedule(() => deliverItem({ outbox, send, now, log }, item.id));
  return json(200, { ok: true, id: item.id });
}
