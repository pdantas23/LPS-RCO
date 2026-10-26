import type { CapturaConfig, Tela, Versao } from "@/content/captura/tipos";

// ============================================================
// Ramificação e numeração das telas. Puro (sem navegador): o quiz usa para saber a próxima tela e o
// servidor usa para saber quais respostas valem para a versão enviada.
// ============================================================

export type Respostas = Record<string, string>;

/** Uma tela visível no caminho, com o número fixo da posição (o <n> dos eventos). */
export interface TelaNoCaminho {
  tela: Tela;
  numero: number;
}

export function telaPorId(cfg: CapturaConfig, id: string): Tela {
  const t = cfg.telas.find((x) => x.id === id);
  if (!t) throw new Error(`tela desconhecida: ${id}`);
  return t;
}

function casa(tela: Tela, respostas: Respostas): boolean {
  if (!tela.mostrarSe) return true;
  return respostas[tela.mostrarSe.campo] === tela.mostrarSe.valor;
}

/** Card e quiz curto usam o caminho curto (o card nunca ramifica). */
export function caminhoDaVersao(versao: Versao): "curto" | "longo" {
  return versao === "quiz_longo" ? "longo" : "curto";
}

/**
 * Telas que a pessoa vê, em ordem, com as respostas dadas até agora. Ramo ainda indefinido (a tela 3 não foi
 * respondida) = a posição do ramo fica de fora; aparece assim que a resposta casa.
 */
export function telasVisiveis(cfg: CapturaConfig, versao: Versao, respostas: Respostas): TelaNoCaminho[] {
  const out: TelaNoCaminho[] = [];
  cfg.caminhos[caminhoDaVersao(versao)].forEach((pos, i) => {
    const ids = typeof pos === "string" ? [pos] : pos;
    for (const id of ids) {
      const tela = telaPorId(cfg, id);
      if (casa(tela, respostas)) {
        out.push({ tela, numero: i + 1 });
        break;
      }
    }
  });
  return out;
}

/** Todas as telas que podem existir numa versão (para validar o que chega ao servidor). */
export function telasPossiveis(cfg: CapturaConfig, versao: Versao): Tela[] {
  return cfg.caminhos[caminhoDaVersao(versao)].flatMap((pos) => (typeof pos === "string" ? [pos] : [...pos])).map((id) => telaPorId(cfg, id));
}

/**
 * Só as respostas que valem: das telas visíveis da versão, com o ramo atual. Resposta de ramo que deixou de valer
 * (a pessoa voltou e trocou a necessidade) e campo do caminho longo enviado no curto ou no card são descartados.
 */
export function respostasValidas(cfg: CapturaConfig, versao: Versao, respostas: Respostas): Respostas {
  const out: Respostas = {};
  for (const { tela } of telasVisiveis(cfg, versao, respostas)) {
    const v = respostas[tela.id];
    if (typeof v === "string" && v !== "") out[tela.id] = v;
  }
  return out;
}

/** Nome do evento de tela: quiz_visto_4_desafio, quiz_respondido_4_desafio. */
export function nomeEventoTela(acao: "visto" | "respondido", numero: number, slug: string): string {
  return `quiz_${acao}_${numero}_${slug}`;
}

// ---------- Campos de digitação (rodam no navegador e no servidor) ----------

/**
 * "@RCOHub", "rcohub", "instagram.com/rcohub/" → "@rcohub". Inválido → null. Regras do Instagram: até 30
 * caracteres, letras, números, ponto e sublinhado.
 */
export function normalizarInstagram(input: string): string | null {
  let v = input.trim().toLowerCase();
  v = v.replace(/^https?:\/\//, "").replace(/^(www\.)?instagram\.com\//, "");
  v = v.split(/[/?#]/)[0] ?? "";
  v = v.replace(/^@+/, "");
  if (!/^[a-z0-9._]{1,30}$/.test(v)) return null;
  if (/^\.|\.$|\.\./.test(v)) return null;
  return `@${v}`;
}

/** Nome: 2 a 120 caracteres, sem link nem tag (mesma heurística das outras LPs). */
export function nomeValido(v: string): boolean {
  const t = v.trim();
  return t.length >= 2 && t.length <= 120 && !/https?:|www\.|<|>|@/i.test(t);
}

/** E-mail com domínio de verdade (algo@dominio.tld). */
export function emailValido(v: string): boolean {
  return /^[^@\s]+@([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(v.trim()) && v.trim().length <= 254;
}
