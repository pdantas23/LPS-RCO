// ============================================================
// Estrutura REAPROVEITÁVEL de uma captura qualificatória (quiz de uma pergunta por tela + card na LP).
//
// O conteúdo (perguntas, descrições, opções, rótulos do card, nomes dos campos no COMERCIAL) fica num
// arquivo de configuração por produto (ex.: content/captura/sites.ts). As telas (components/sites/Quiz.tsx e
// CardForm.tsx), a ramificação (lib/captura/fluxo.ts), a validação (lib/captura/schema.ts) e o envio
// (lib/captura/payload.ts) só leem esta estrutura. Para vender outro produto (IA, por exemplo) com o mesmo
// formato: um arquivo novo com outro `CapturaConfig`, sem mexer em código de tela. A pontuação do perfil
// é a única parte que depende do conteúdo (fica no servidor, lib/captura/perfil.ts).
// ============================================================

/** Versão da captura: vai em TODO evento do dataLayer e no campo "Versão da captura" do COMERCIAL. */
export const VERSOES = ["quiz_curto", "quiz_longo", "card"] as const;
export type Versao = (typeof VERSOES)[number];

/** Tipo de campo da tela. `opcoes` = cartões com letra no quiz e dropdown no card. */
export type TipoTela = "texto" | "opcoes" | "telefone" | "email" | "instagram";

export interface Tela {
  /** Chave da resposta (no navegador, no servidor e no mapeamento para o COMERCIAL). Estável: não mude depois de publicar. */
  id: string;
  /** Nome da tela nos eventos do dataLayer: quiz_visto_<n>_<slug>. Só letras minúsculas, dígitos e _. */
  slug: string;
  tipo: TipoTela;
  /** Pergunta do quiz, literal do documento. */
  pergunta: string;
  /** Descrição embaixo da pergunta (1 ou 2 frases). Telas do caminho longo podem não ter. */
  descricao?: string;
  /** Opções literais, na ordem do documento (só `tipo: "opcoes"`). */
  opcoes?: readonly string[];
  /** Exemplo no campo de digitação. `placeholderCard` substitui no card quando o documento pede outro. */
  placeholder?: string;
  placeholderCard?: string;
  /** Rótulo curto no card (tabela do bloco 5). Sem rótulo = a tela não existe no card. */
  rotuloCard?: string;
  /** Campo opcional (ex.: e-mail no caminho longo). Padrão: obrigatório. */
  opcional?: boolean;
  /** Tela ramificada: só aparece quando a resposta de `campo` é `valor`. */
  mostrarSe?: { campo: string; valor: string };
  /** Rótulo do campo personalizado no COMERCIAL (chave em `answers` do webhook). */
  campoComercial: string;
}

/**
 * Ordem das telas de um caminho. Cada posição tem um NÚMERO fixo (índice + 1), que é o <n> dos eventos.
 * Uma posição pode ter alternativas (telas ramificadas que dividem o mesmo número): aparece só a que casa
 * com `mostrarSe`; se nenhuma casar, a posição é pulada e os números seguintes NÃO mudam. Assim
 * quiz_visto_6_desafio é sempre a mesma tela no caminho longo, com ou sem ramo, e o funil compara direito.
 */
export type Posicao = string | readonly string[];

export interface CapturaConfig {
  /** Identificador do produto (ex.: "sites"). */
  produto: string;
  telas: readonly Tela[];
  caminhos: {
    /** Também é o conteúdo do card (o card usa só o caminho curto, sem ramificação). */
    curto: readonly Posicao[];
    longo: readonly Posicao[];
  };
}
