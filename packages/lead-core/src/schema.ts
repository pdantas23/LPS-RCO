import { z } from "zod";
import { cleanText } from "./tracking";
import { normalizeBrPhone } from "./phone";

// ============================================================
// Validação do formulário. O MESMO schema roda no browser (react-hook-form)
// e no servidor (/api/lead): o servidor revalida tudo.
//
// Os limites de valor (páginas, nichos, faixas de faturamento) vêm da
// configuração do app (createLeadSchema), não daqui: o conteúdo final ainda
// não existe e vai mudar sem tocar neste pacote.
// ============================================================

export interface LeadSchemaConfig {
  /** Ids de página aceitos, ex.: ["P04", "P05"]. */
  pages: readonly [string, ...string[]];
  /** Valores aceitos em "Nicho" (o que a pessoa pode escolher). */
  nichos: readonly [string, ...string[]];
  /** Valores aceitos em "Faturamento". */
  faturamentos: readonly [string, ...string[]];
}

const text = (max: number) =>
  z
    .string()
    .transform((v) => cleanText(v, max));

/** Heurística anti-spam bem básica: nome não é lugar de link nem de tag. */
const parecesSpam = (v: string) => /https?:|www\.|<|>|@/i.test(v);

/** Campos que a pessoa preenche. Compartilhado entre o formulário e o envio. */
function personFields(cfg: LeadSchemaConfig) {
  return {
    name: text(120)
      .refine((v) => v.length >= 2, "Informe seu nome.")
      .refine((v) => !parecesSpam(v), "Informe apenas seu nome."),
    whatsapp: z
      .string()
      .refine(
        (v) => normalizeBrPhone(v) !== null,
        "Informe um WhatsApp válido: DDD + número com 9 dígitos.",
      ),
    email: text(254).refine((v) => z.email().safeParse(v).success, "Informe um email válido."),
    nicho: z.enum(cfg.nichos, { error: "Escolha uma opção." }),
    faturamento: z.enum(cfg.faturamentos, { error: "Escolha uma opção." }),
    /** Honeypot: campo escondido. Humano deixa vazio; robô costuma preencher. */
    website: z.string().max(200).optional(),
  };
}

/** Schema do que chega em POST /api/lead. O servidor revalida tudo com ele. */
export function createLeadSchema(cfg: LeadSchemaConfig) {
  return z.object({
    respondentId: z.uuid({ error: "Identificador de envio inválido." }),
    page: z.enum(cfg.pages, { error: "Página inválida." }),
    ...personFields(cfg),
    tracking: z.unknown().optional(),
  });
}

/** Schema do formulário no browser (sem id de envio nem página: quem injeta é o código). */
export function createLeadFormSchema(cfg: LeadSchemaConfig) {
  return z.object(personFields(cfg));
}

export type LeadSchema = ReturnType<typeof createLeadSchema>;
export type LeadInput = z.infer<LeadSchema>;
export type LeadFormSchema = ReturnType<typeof createLeadFormSchema>;

/** Erros por campo, no formato que o formulário consome. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

// ============================================================
// LP de e-commerce (/lp-ecom): 5 perguntas, sem nicho, um campo de WhatsApp.
// O "Perfil" (Dentro/Fora) NUNCA vem do navegador: o servidor calcula a partir do faturamento.
// ============================================================

export interface EcomSchemaConfig {
  page: string;
  faturamentos: readonly [string, ...string[]];
  investimentos: readonly [string, ...string[]];
}

/** Email com domínio de verdade: algo@dominio.tld (z.email já exige ponto e TLD; aqui barra espaços e domínio com hífen nas pontas). Não exige email corporativo. */
const emailComDominio = (v: string) =>
  z.email().safeParse(v).success && /^[^@\s]+@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(v);

function ecomFields(cfg: EcomSchemaConfig) {
  return {
    name: text(120)
      .refine((v) => v.length >= 2, "Informe seu nome.")
      .refine((v) => !parecesSpam(v), "Informe apenas seu nome."),
    whatsapp: z
      .string()
      .refine((v) => normalizeBrPhone(v) !== null, "Informe um WhatsApp válido: DDD + número com 9 dígitos."),
    email: text(254).refine(emailComDominio, "Informe um email válido, com @ e domínio (ex.: voce@loja.com.br)."),
    faturamento: z.enum(cfg.faturamentos, { error: "Escolha uma opção." }),
    investimento: z.enum(cfg.investimentos, { error: "Escolha uma opção." }),
    website: z.string().max(200).optional(),
  };
}

export function createEcomLeadSchema(cfg: EcomSchemaConfig) {
  return z.object({
    respondentId: z.uuid({ error: "Identificador de envio inválido." }),
    page: z.literal(cfg.page, { error: "Página inválida." }),
    ...ecomFields(cfg),
    tracking: z.unknown().optional(),
  });
}

/** Formulário no navegador: os mesmos campos do servidor (um campo de WhatsApp só, sem confirmação). */
export function createEcomFormSchema(cfg: EcomSchemaConfig) {
  return z.object(ecomFields(cfg));
}

export type EcomLeadInput = z.infer<ReturnType<typeof createEcomLeadSchema>>;
