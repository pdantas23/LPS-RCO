import { z } from "zod";
import { cleanText } from "@rco/lead-core/tracking";
import { normalizeBrPhone } from "@rco/lead-core/phone";
import { CAPTURA_TEXTOS } from "@/content/captura/sites";
import { VERSOES, type CapturaConfig, type Tela, type Versao } from "@/content/captura/tipos";
import { emailValido, nomeValido, normalizarInstagram, respostasValidas, telasVisiveis, type Respostas } from "./fluxo";

// ============================================================
// Validação das respostas de uma captura. A MESMA função roda no quiz/card (antes de avançar ou enviar) e no
// servidor (que revalida tudo e nunca confia no navegador). O servidor ainda descarta respostas que não valem
// para a versão e o ramo enviados (lib/captura/fluxo.ts → respostasValidas).
// ============================================================

const E = CAPTURA_TEXTOS.erros;

/** Erro de UMA tela, ou null. `valor` já limpo. */
export function erroDaTela(tela: Tela, valor: string | undefined): string | null {
  const v = (valor ?? "").trim();
  if (!v) return tela.opcional ? null : tela.tipo === "opcoes" ? E.opcao : erroVazio(tela);
  switch (tela.tipo) {
    case "texto":
      return nomeValido(v) ? null : E.nome;
    case "telefone":
      return normalizeBrPhone(v) ? null : E.whatsapp;
    case "email":
      return emailValido(v) ? null : E.email;
    case "instagram":
      return normalizarInstagram(v) ? null : E.instagram;
    case "opcoes":
      return tela.opcoes?.includes(v) ? null : E.opcao;
  }
}

function erroVazio(tela: Tela): string {
  if (tela.tipo === "telefone") return E.whatsapp;
  if (tela.tipo === "instagram") return E.instagram;
  if (tela.tipo === "email") return E.email;
  return E.nome;
}

/** Valor como vai ao COMERCIAL: telefone só dígitos com 55, @ normalizado, texto limpo. */
export function normalizarValor(tela: Tela, valor: string): string {
  const v = cleanText(valor, tela.tipo === "email" ? 254 : 120);
  if (tela.tipo === "telefone") return normalizeBrPhone(v) ?? v;
  if (tela.tipo === "instagram") return normalizarInstagram(v) ?? v;
  if (tela.tipo === "email") return v.toLowerCase();
  return v;
}

export type ResultadoValidacao =
  | { ok: true; respostas: Respostas }
  | { ok: false; erros: Record<string, string> };

/** Valida todas as telas visíveis da versão; devolve as respostas normalizadas (só as que valem). */
export function validarRespostas(cfg: CapturaConfig, versao: Versao, bruto: Respostas): ResultadoValidacao {
  const respostas = respostasValidas(cfg, versao, bruto);
  const erros: Record<string, string> = {};
  for (const { tela } of telasVisiveis(cfg, versao, respostas)) {
    const e = erroDaTela(tela, respostas[tela.id]);
    if (e) erros[tela.id] = e;
  }
  // Ramo indefinido porque a tela 3 está vazia já cai no erro dela; ramo com resposta faltando cai aqui também
  // (telasVisiveis com as respostas atuais inclui a tela do ramo).
  if (Object.keys(erros).length > 0) return { ok: false, erros };
  const out: Respostas = {};
  for (const [id, v] of Object.entries(respostas)) {
    const tela = cfg.telas.find((t) => t.id === id)!;
    out[id] = normalizarValor(tela, v);
  }
  return { ok: true, respostas: out };
}

/** Corpo de POST /api/lead da captura (page fixa da LP). Os valores de cada resposta são validados à parte. */
export function criarSchemaEnvio(pageId: string) {
  return z.object({
    respondentId: z.uuid({ error: "Identificador de envio inválido." }),
    page: z.literal(pageId, { error: "Página inválida." }),
    versao: z.enum(VERSOES, { error: "Versão inválida." }),
    respostas: z.record(z.string().max(40), z.string().max(300)).refine((r) => Object.keys(r).length <= 30, "Respostas demais."),
    website: z.string().max(200).optional(),
    tracking: z.unknown().optional(),
  });
}
