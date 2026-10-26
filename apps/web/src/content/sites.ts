// ============================================================
// CONTEÚDO DA /sites (LP de venda de sites da RCO). Briefing: docs/briefings/lp-sites-v2.2.pdf (Luis, v2.2, 25/10/2026).
//
// >>> COPY PROVISÓRIA <<< Todo texto da página neste arquivo foi escrito pelo time de desenvolvimento só para
// a página existir. A copy final é do Luis (bloco "Fora desta entrega"). Troque aqui, sem mexer em componente.
// Regras do briefing para a copy: direto e comercial (dor, consequência de ficar como está, oferta); sem frase de
// efeito, sem palavra de impacto, sem promessa exagerada, sem travessão; sem preço nem "a partir de" em lugar
// nenhum; sem menu e sem link para fora (um caminho só: a captura); escassez só com dado real.
//
// As PERGUNTAS da captura não ficam aqui: estão em content/captura/sites.ts (literais do documento).
// ============================================================

export const SITES_PAGE = {
  id: "SITES",
  path: "/sites",
  /** Quiz em tela própria, fora da LP (bloco 4). */
  quizPath: "/sites/quiz",
  /** Vai em form_id no COMERCIAL (a integração de lá precisa ser cadastrada com este id; ver docs/sites-comercial.md). */
  formId: "lp-sites",
  formName: "LP Sites",
  // PROVISÓRIO (copy do Luis)
  title: "Site com código próprio para a sua empresa | RCO Hub",
  description:
    "A RCO Hub constrói sites com código próprio: institucional, página de captura, lançamento e loja virtual. Pagamento único, sem mensalidade de plataforma.",
  ogTitle: "Sua empresa precisa de um site que traga cliente",
  ogDescription: "Sites com código próprio, pagamento único e contato do cliente caindo no seu WhatsApp. Veja o portfólio da RCO.",
  quizTitle: "Conte o que você precisa | RCO Hub",
} as const;

/**
 * Como o visitante cai na captura. O briefing descreve os dois formatos e as três versões (quiz_curto, quiz_longo,
 * card), mas não diz como escolher entre quiz e card. DECISÃO DO LUIS.
 *  - "quiz": todo botão abre o quiz em /sites/quiz; caminho curto ou longo sorteado 50/50 na primeira visita.
 *  - "card": o formulário fica dentro da LP (só caminho curto); os botões rolam até ele.
 *  - "sorteio": cada visitante novo cai numa das três versões, um terço para cada (quiz_curto, quiz_longo, card).
 *    Mantém curto e longo meio a meio entre si, como pede o bloco 9, e deixa comparar os dois formatos com o
 *    mesmo conteúdo, como pede o bloco 5.
 * Padrão "sorteio": é o que o documento mais sugere (eventos com a versão card ao lado das duas do quiz e "a
 * comparação entre os formatos só vale se o conteúdo for o mesmo").
 * A versão sorteada fica guardada no navegador (lib/captura/versao.ts): quem volta não troca de versão.
 */
export type CapturaFormato = "quiz" | "card" | "sorteio";
export const CAPTURA_FORMATO: CapturaFormato = "sorteio";

/**
 * Escassez: só com dado real (vagas de produção no mês, agenda do time). Sem dado, fica VAZIA e a frase não
 * aparece. Exemplo de uso quando houver número real: "Restam 3 vagas de produção em novembro."
 */
export const VAGAS_FRASE = "";

/**
 * Selo "print provisório" nos cartões do portfólio. DESLIGADO a pedido do Philip (26/10/2026): a marcação de
 * provisório fica só na configuração (content/sites-portfolio.ts, campo `provisorio`).
 */
export const MOSTRAR_SELO_PROVISORIO = false;

export const SITES_ANCORAS = { portfolio: "portfolio", comoFunciona: "como-funciona", captura: "captura" } as const;

// ---------- Textos (PROVISÓRIOS) ----------

export const SITES_HERO = {
  // Escolhido pelo Philip em 26/10/2026.
  eyebrow: "O seu site do seu jeito",
  title: "Cliente que pede o seu site e não recebe um link vai comprar de quem tem.",
  subtitle:
    "Instagram e WhatsApp não bastam quando o cliente quer comparar. A RCO constrói o site da sua empresa com código próprio, você paga uma vez só e recebe tudo funcionando, com o contato do cliente chegando no seu WhatsApp.",
  cta: "Quero meu site",
} as const;

export const SITES_PORTFOLIO = {
  eyebrow: "Portfólio",
  title: "Sites que a RCO já colocou no ar",
  support: "Escolha o tipo de site que você precisa e veja como ele fica pronto.",
  todos: "Todos",
  seloProvisorio: "Print provisório",
} as const;

export const SITES_COMO_FUNCIONA = {
  eyebrow: "Como funciona",
  title: "Você paga o site uma vez e ele é seu",
  support:
    "Site em plataforma de montar cobra todo mês, fica com cara de modelo pronto e não leva o cliente até você. Enquanto isso, o anúncio que você paga manda gente para um perfil que não fecha venda.",
  items: [
    {
      icon: "code",
      title: "Código próprio",
      text: "O site é feito para a sua empresa, do zero. Não fica preso a plataforma de montar site nem a modelo pronto.",
    },
    {
      icon: "wallet",
      title: "Pagamento único",
      text: "Você paga a construção uma vez. Não existe mensalidade de plataforma. Manutenção é contratada à parte, só se você quiser.",
    },
    {
      icon: "whatsapp",
      title: "Entregue funcionando",
      text: "A página de captura sai pronta para receber contato, e cada pessoa que preenche chega direto no seu WhatsApp.",
    },
  ],
  nota: "O valor é passado na conversa, de acordo com as funções que o seu site precisa.",
  cta: "Quero meu site",
} as const;

export const SITES_CAPTURA_SECAO = {
  /** Formato quiz: chamada que abre o quiz fora da LP. */
  quiz: {
    title: "Conte o que você precisa",
    support: "São perguntas rápidas, uma por tela. No fim, o time da RCO te chama no WhatsApp.",
    cta: "Quero meu site",
  },
} as const;

export const SITES_FIXO = { cta: "Quero meu site" } as const;

export const SITES_RODAPE = {
  tagline: "RCO Hub. Sites, tráfego pago e CRM.",
  copyright: `© ${2026} RCO Hub. Todos os direitos reservados.`,
} as const;
