import type { Versao } from "@/content/captura/tipos";
import type { CapturaFormato } from "@/content/sites";

// ============================================================
// Sorteio da versão da captura, feito UMA vez por navegador e guardado (localStorage) para a pessoa não trocar de
// versão ao voltar (bloco 9). Duas chaves independentes:
//   formato  quiz | card       só sorteado quando CAPTURA_FORMATO = "sorteio" (1/3 card, 2/3 quiz)
//   caminho  curto | longo     sorteado 50/50 quando a pessoa precisa de um caminho do quiz
// Resultado: no "sorteio", um terço para cada versão (card, quiz_curto, quiz_longo) e curto/longo meio a meio.
// Sem localStorage (modo privado, bloqueio): sorteia na memória e segue; nesse caso pode trocar ao recarregar.
// Puro e injetável (storage, random) para testar.
// ============================================================

export const CHAVE_FORMATO = "rco_sites_formato_v1";
export const CHAVE_CAMINHO = "rco_sites_caminho_v1";

export type Caminho = "curto" | "longo";
export type Formato = "quiz" | "card";

export interface Armazenamento {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function ler(storage: Armazenamento | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function gravar(storage: Armazenamento | null, key: string, v: string): void {
  try {
    storage?.setItem(key, v);
  } catch {
    // bloqueado: segue sem guardar
  }
}

/** Caminho do quiz desta pessoa: o guardado, ou sorteia 50/50 e guarda. */
export function caminhoDaPessoa(storage: Armazenamento | null, random: () => number = Math.random): Caminho {
  const salvo = ler(storage, CHAVE_CAMINHO);
  if (salvo === "curto" || salvo === "longo") return salvo;
  const novo: Caminho = random() < 0.5 ? "curto" : "longo";
  gravar(storage, CHAVE_CAMINHO, novo);
  return novo;
}

/** Formato da LP para esta pessoa, conforme a configuração. Só sorteia (e guarda) em "sorteio". */
export function formatoDaPessoa(config: CapturaFormato, storage: Armazenamento | null, random: () => number = Math.random): Formato {
  if (config !== "sorteio") return config;
  const salvo = ler(storage, CHAVE_FORMATO);
  if (salvo === "quiz" || salvo === "card") return salvo;
  const novo: Formato = random() < 1 / 3 ? "card" : "quiz";
  gravar(storage, CHAVE_FORMATO, novo);
  return novo;
}

export function versaoDoQuiz(caminho: Caminho): Versao {
  return caminho === "longo" ? "quiz_longo" : "quiz_curto";
}

/**
 * Prévia por URL (?captura=card | quiz_curto | quiz_longo): força e GUARDA a versão, para o Luis e o time verem
 * cada uma sem depender do sorteio. Não use em link de anúncio (distorce a divisão do tráfego).
 */
export function aplicarPrevia(search: string, storage: Armazenamento | null): Versao | null {
  const v = new URLSearchParams(search).get("captura");
  if (v === "card") {
    gravar(storage, CHAVE_FORMATO, "card");
    return "card";
  }
  if (v === "quiz_curto" || v === "quiz_longo") {
    gravar(storage, CHAVE_FORMATO, "quiz");
    gravar(storage, CHAVE_CAMINHO, v === "quiz_longo" ? "longo" : "curto");
    return v;
  }
  return null;
}

/**
 * Versão desta pessoa na LP: prévia da URL > formato configurado/sorteado > caminho do quiz sorteado.
 * Com formato fixo ("quiz" ou "card") a prévia ainda vale, para conferir a outra versão.
 */
export function versaoDaLp(config: CapturaFormato, search: string, storage: Armazenamento | null, random: () => number = Math.random): Versao {
  const previa = aplicarPrevia(search, storage);
  if (previa) return previa;
  const formato = formatoDaPessoa(config, storage, random);
  return formato === "card" ? "card" : versaoDoQuiz(caminhoDaPessoa(storage, random));
}

/** Versão no quiz (/sites/quiz): sempre um caminho do quiz, mesmo para quem viu o card na LP. */
export function versaoDoQuizDaPessoa(search: string, storage: Armazenamento | null, random: () => number = Math.random): Versao {
  const previa = aplicarPrevia(search, storage);
  if (previa === "quiz_curto" || previa === "quiz_longo") return previa;
  return versaoDoQuiz(caminhoDaPessoa(storage, random));
}

/** localStorage do navegador, ou null se não existir/estiver bloqueado. */
export function armazenamentoLocal(): Armazenamento | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}
