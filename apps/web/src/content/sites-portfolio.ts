// ============================================================
// PORTFÓLIO DA /sites (bloco 2 do briefing). Arquivo de configuração: um case = um item em PORTFOLIO_CASES.
//
// >>> TUDO PROVISÓRIO, A CONFIRMAR COM O LUIS <<< A lista de cases e os prints são entrega do Luis. Até lá:
//  - os 10 sites abaixo são sites da RCO que estão no ar (conferidos pelo Philip em 26/10/2026);
//  - as ETIQUETAS (usadas só pelos filtros, não aparecem no cartão) foram deduzidas olhando a página pública;
//  - a DESCRIÇÃO de cada cartão usa só o que está no site (negócio, ação principal da página, cidade quando aparece),
//    lido em 26/10/2026 (a confirmar com o Luis);
//  - Âncora Prime: o print é da página de consórcio (ancoraprime.com/consorcios), um dos dois sites que a página
//    de links da bio (ancoraprime.com) abre; o outro é /seguros.
//  - os prints em public/sites/provisorio/ foram tirados com Chrome headless, só lendo a página pública
//    (sem clicar em nada nem enviar dado), em 26/10/2026. Trocar pelos prints do Luis.
// Regras: um site pode ter mais de uma etiqueta; tipo sem case NÃO vira filtro (Clínicas, hoje); sem link pro
// site real nesta versão (nenhum campo de URL aqui de propósito).
// ============================================================

/** Filtros, nesta ordem (bloco 2). "Todos" é fixo e fica fora da lista. */
export const TIPOS_PORTFOLIO = [
  "Institucional",
  "Captura de leads",
  "Lançamento",
  "Loja virtual",
  "Advocacia",
  "Clínicas",
] as const;
export type TipoPortfolio = (typeof TIPOS_PORTFOLIO)[number];

export interface CasePortfolio {
  id: string;
  nome: string;
  /** Linha curta sob o nome, dizendo o que é o site. A confirmar com o Luis. */
  descricao: string;
  /** Tipos do site: só para os filtros (não aparecem como etiqueta no cartão). */
  etiquetas: readonly TipoPortfolio[];
  /** Print do site no computador (960 x 600, recorte do topo). */
  print: { src: string; alt: string };
  /** Print de página inteira no celular (300 px de largura), usado nos celulares do topo. */
  celular: { src: string; width: number; height: number };
  /** Cor do topo do site, para a faixa de status do celular. */
  statusBg: string;
  statusInk: "dark" | "light";
  provisorio: true;
}

const P = "/sites/provisorio";
const c = (
  id: string,
  nome: string,
  descricao: string,
  etiquetas: TipoPortfolio[],
  alturaCelular: number,
  statusBg: string,
  statusInk: "dark" | "light",
): CasePortfolio => ({
  id,
  nome,
  descricao,
  etiquetas,
  print: { src: `${P}/${id}.webp`, alt: `Site ${nome} no computador` },
  celular: { src: `${P}/${id}-celular.webp`, width: 300, height: alturaCelular },
  statusBg,
  statusInk,
  provisorio: true,
});

export const PORTFOLIO_CASES: readonly CasePortfolio[] = [
  c("senma", "Senma Advocacia", "Advocacia tributária para empresas e agronegócio no Piauí e Maranhão", ["Institucional", "Advocacia"], 3000, "#ffffff", "dark"),
  c("plennus", "Plennus Ambientes Planejados", "Móveis planejados sob medida, com agendamento de visita técnica grátis", ["Institucional", "Captura de leads"], 3000, "#2b2b2b", "light"),
  c("leticia", "Letícia Nayara Arquitetura", "Arquitetura residencial e comercial com orçamento pelo WhatsApp", ["Institucional", "Captura de leads"], 3000, "#f7f2ec", "dark"),
  c("uniao", "União Uniformes", "Uniformes para empresas e escolas, com orçamento em 1 minuto", ["Institucional", "Captura de leads"], 3000, "#1d1d1f", "light"),
  c("encontro", "O Encontro", "Ingressos e programação do encontro de cerimonialistas do Piauí", ["Lançamento"], 3000, "#faf4f0", "dark"),
  c("forma", "Forma Eventos", "Formaturas e eventos corporativos em Teresina, com visita agendada", ["Institucional"], 3000, "#6019d2", "light"),
  c("elia", "Eliá Identidade Visual", "Identidade visual para empresas e eventos, com briefing pelo site", ["Institucional"], 3000, "#f4f0ea", "dark"),
  c("coral", "Coral Acessórios", "Catálogo de acessórios femininos com atendimento pelo WhatsApp", ["Loja virtual"], 1855, "#fbe3dc", "dark"),
  c("joseph", "Joseph Atelier", "Coleção de moda feminina com preços e atendimento pelo WhatsApp", ["Loja virtual"], 3000, "#f5f2ee", "dark"),
  c("ancora", "Âncora Prime", "Simulador de consórcio de carro, imóvel e máquinas no Piauí", ["Captura de leads"], 2115, "#1e3a8a", "light"),
];

/** Filtros que aparecem: só os tipos com pelo menos um case. */
export function filtrosVisiveis(cases: readonly CasePortfolio[] = PORTFOLIO_CASES): TipoPortfolio[] {
  return TIPOS_PORTFOLIO.filter((t) => cases.some((x) => x.etiquetas.includes(t)));
}

export function casesDoFiltro(filtro: TipoPortfolio | null, cases: readonly CasePortfolio[] = PORTFOLIO_CASES): CasePortfolio[] {
  return filtro ? cases.filter((x) => x.etiquetas.includes(filtro)) : [...cases];
}

/** Topo da LP: o notebook mostra um site e os três celulares, outros três. */
export const VITRINE = { notebook: "plennus", celulares: ["leticia", "forma", "senma"] } as const;
