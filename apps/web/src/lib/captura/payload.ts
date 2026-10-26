import type { CapturaConfig, Versao } from "@/content/captura/tipos";
import type { Respostas } from "./fluxo";

// ============================================================
// Respostas → campos personalizados do COMERCIAL (chaves de `answers` no webhook Respondi).
// Os rótulos vêm de `campoComercial` em cada tela da configuração; os três campos de controle abaixo não
// são perguntas. Lista completa e o que o COMERCIAL precisa cadastrar: docs/sites-comercial.md.
// ============================================================

export const CAMPOS_CONTROLE = {
  origem: "Página de origem",
  versao: "Versão da captura",
  perfil: "Perfil",
} as const;

/** Ordem de saída: identificação, controle, respostas na ordem do caminho longo, perfil por último. */
const ORDEM_IDENTIFICACAO = ["nome", "whatsapp", "email", "instagram"];

export function respostasParaComercial(
  cfg: CapturaConfig,
  args: { pageId: string; versao: Versao; respostas: Respostas; perfil: string },
): Record<string, string> {
  const { pageId, versao, respostas, perfil } = args;
  const out: Record<string, string> = {};
  const campo = (id: string) => cfg.telas.find((t) => t.id === id)?.campoComercial;
  for (const id of ORDEM_IDENTIFICACAO) {
    const c = campo(id);
    if (c && respostas[id]) out[c] = respostas[id]!;
  }
  out[CAMPOS_CONTROLE.origem] = pageId;
  out[CAMPOS_CONTROLE.versao] = versao;
  const ordem = cfg.caminhos.longo.flatMap((p) => (typeof p === "string" ? [p] : [...p]));
  for (const id of ordem) {
    if (ORDEM_IDENTIFICACAO.includes(id)) continue;
    const c = campo(id);
    if (c && respostas[id]) out[c] = respostas[id]!;
  }
  out[CAMPOS_CONTROLE.perfil] = perfil;
  return out;
}
