/**
 * Fonte única de conteúdo e configuração da P01 (LP de venda do CRM da RCO).
 *
 * Regra: nada comercial inventado. Todo dado que depende da RCO fica marcado com
 * PENDING_BUSINESS_CONFIGURATION e NÃO aparece na página enquanto estiver vazio.
 * `npm run release-check` lista as pendências e falha se alguma bloquear a venda.
 *
 * Recursos: só o que existe no CRM-RCO (~/Documents/CRM-RCO), com status "entregue"
 * no PLANO-DE-EXECUCAO.md (auditado em 27/09/2026). A seleção do que divulgar é da RCO.
 */

export const PENDING = "PENDING_BUSINESS_CONFIGURATION" as const;

/** Endereço público da LP (canonical/Open Graph). */
export const SITE_URL = "https://crm.rcohub.com/lpcrm/";

/** PENDING_BUSINESS_CONFIGURATION: ID do container GTM. Vazio = GTM não carrega (o dataLayer continua). */
export const GTM_ID = "";

export const links = {
  /**
   * PENDING_BUSINESS_CONFIGURATION: link oficial do acesso de clientes.
   * O login em produção hoje responde em https://crm.rcoacademy.com.br/login, mas o
   * caminho oficial do acesso ainda não foi definido (Mapa: "caminho a definir").
   */
  login: "",
  /** PENDING_BUSINESS_CONFIGURATION: WhatsApp comercial do CRM. */
  whatsapp: "",
};

// ---------------------------------------------------------------------------
// Planos e contratação
// ---------------------------------------------------------------------------

export interface Plan {
  /** Identificador estável (vai para plan_select / begin_checkout / URL do checkout). */
  id: string;
  name: string;
  /** Preço em centavos. null = não definido (o plano não é exibido). */
  priceCents: number | null;
  currency: "BRL";
  /** Ex.: "mês", "ano". */
  period: string;
  features: string[];
  limits: string[];
  addons: string[];
  /** URL do checkout do provedor para este plano. Vazio = sem botão de contratação. */
  checkoutUrl: string;
  highlighted?: boolean;
}

/**
 * PENDING_BUSINESS_CONFIGURATION: planos, preços, periodicidade, limites e adicionais.
 * Não existe nenhum plano cadastrado no CRM-RCO. Enquanto a lista estiver vazia, a seção
 * de planos mostra apenas que os planos estão em definição (sem preço, sem botão).
 */
export const plans: Plan[] = [];

export const checkout = {
  /** PENDING_BUSINESS_CONFIGURATION: provedor de pagamento da assinatura do CRM. */
  provider: "",
  /**
   * PENDING_BUSINESS_CONFIGURATION: endpoint do SERVIDOR que devolve o status do pedido
   * (alimentado pelo webhook/consulta do provedor). Contrato em src/lib/order-status.ts.
   * Sem ele, a página de retorno nunca confirma compra — redirect ≠ pagamento.
   */
  orderStatusEndpoint: "",
};

// ---------------------------------------------------------------------------
// Conteúdo (PENDING_BUSINESS_CONFIGURATION: copy oficial; textos atuais são neutros)
// ---------------------------------------------------------------------------

export const copy = {
  title: "CRM RCO | Atendimento e vendas pelo WhatsApp",
  description:
    "CRM da RCO para organizar atendimento, funil de vendas e origem dos leads no WhatsApp, com integrações de venda e conversões.",
  heroTitle: "Atendimento e vendas pelo WhatsApp num só lugar",
  heroKicker: "Para empresas que atendem e vendem pelo WhatsApp",
  heroLead:
    "Conversas do time, funil de vendas e origem de cada lead no mesmo sistema, conectado à API oficial do WhatsApp.",
  pillarsTitle: "Tudo o que o time comercial usa no dia a dia",
  closingTitle: "Organize o atendimento e as vendas do seu time no WhatsApp",
};

export interface Shot {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Desenho esquemático exibido enquanto não houver tela real (não imita interface nem dados). */
export type Art = "inbox" | "funnel" | "origin" | "automation";

/** Três frentes (cards de abertura). */
export const pillars: { title: string; text: string; art: Art }[] = [
  {
    title: "Atendimento",
    text: "O time atende pelo mesmo número de WhatsApp, com responsável e histórico em cada conversa.",
    art: "inbox",
  },
  {
    title: "Funil de vendas",
    text: "Negócios em etapas, ligados às conversas, com follow-up que para quando o cliente responde.",
    art: "funnel",
  },
  {
    title: "Origem e resultado",
    text: "Cada lead chega com a campanha de origem, e as vendas voltam como conversão para Meta e Google Ads.",
    art: "origin",
  },
];

export interface DeepDive {
  id: string;
  /** O problema que a seção resolve. */
  problem: string;
  title: string;
  /** Só recursos com status "entregue" no PLANO-DE-EXECUCAO.md (código entre parênteses no comentário). */
  points: string[];
  art: Art;
  /** PENDING_BUSINESS_CONFIGURATION: tela real desta área. null = mostra o desenho esquemático. */
  shot: Shot | null;
  dark?: boolean;
}

export const deepDives: DeepDive[] = [
  {
    // Inbox (base wacrm), CN1, AT1 ✅, AT2 ✅, AT4 ✅, MR3 ✅, MR4 ✅.
    id: "atendimento",
    problem: "Para quando as conversas estão espalhadas em vários celulares",
    title: "Atendimento em equipe na API oficial do WhatsApp",
    points: [
      "Caixa de entrada compartilhada, com responsável por conversa",
      "Distribuição automática de novos leads entre os atendentes",
      "Escalonamento quando a resposta demora",
      "Horário comercial e atendimento fora do expediente",
      "Painéis por atendente e por setor",
    ],
    art: "inbox",
    shot: null,
  },
  {
    // Funis kanban e broadcasts (base wacrm), CV1 ✅, CV2 ✅, EN2 🟢.
    id: "funil",
    problem: "Para quando ninguém sabe em que etapa está cada venda",
    title: "Funil de vendas ligado às conversas",
    points: [
      "Funis em kanban com as etapas da sua empresa",
      "Negócios ligados ao contato e à conversa",
      "Vendas da Hotmart, da Kiwify e da Eduzz entram como negócio ganho",
      "Régua de follow-up que para quando o cliente responde",
      "Disparos com modelos de mensagem aprovados pela Meta",
    ],
    art: "funnel",
    shot: null,
  },
  {
    // RA1 ✅, RA2 ✅, RA3 ✅, CV4 🟢, CV5 🟢, CV6 🟢 (gasto informado manualmente).
    id: "origem",
    problem: "Para quando não se sabe qual anúncio trouxe a venda",
    title: "Origem de cada lead e retorno do anúncio",
    points: [
      "Origem capturada automaticamente em anúncios Click-to-WhatsApp",
      "Links rastreáveis que preservam as UTMs",
      "Painel de atribuição por campanha",
      "Conversões enviadas à Meta e ao Google Ads",
      "Custo por lead e ROAS a partir do gasto informado",
    ],
    art: "origin",
    shot: null,
  },
  {
    // Automações e fluxos (base wacrm), IA2 🟢, CV3 ✅, IA1 ✅, CV7 ✅, API pública.
    id: "automacao",
    problem: "Para ganhar tempo no operacional",
    title: "Automação e inteligência no dia a dia",
    points: [
      "Automações por gatilho e fluxos visuais",
      "Classificação de leads por temperatura com IA",
      "Vendas identificadas pela IA e confirmadas por uma pessoa",
      "Insights para o gestor",
      "Webhooks de saída e API REST para integrações próprias",
    ],
    art: "automation",
    shot: null,
    dark: true,
  },
];

/** Jornada real de hoje (docs/runbook-provisionamento.md). Muda quando existir contratação online. */
export const onboarding: { title: string; text: string }[] = [
  { title: "Criação da conta", text: "A equipe da RCO cria a conta da sua empresa." },
  { title: "WhatsApp conectado", text: "Seu número é conectado pela API oficial do WhatsApp Business." },
  { title: "Funil e marca", text: "Você define as etapas do funil e aplica o nome e a cor da sua empresa." },
  { title: "Integrações e rastreamento", text: "Links rastreáveis, plataformas de venda e conversões para Meta e Google Ads." },
];

/** Segurança e controle: só o que existe no código do CRM-RCO. */
export const trust: { title: string; text: string }[] = [
  { title: "Papéis e setores", text: "Proprietário, administrador, atendente e visualizador, com separação por setor." },
  { title: "Log de auditoria", text: "Ações relevantes da conta ficam registradas." },
  { title: "Credenciais protegidas", text: "Tokens de integração ficam criptografados no servidor." },
  { title: "API com chaves revogáveis", text: "Integrações próprias com permissões por escopo e limite de uso." },
];

/** FAQ: só respostas confirmadas no produto. Pagamento, cancelamento e suporte: PENDING_BUSINESS_CONFIGURATION. */
export const faq: { q: string; a: string }[] = [
  {
    q: "O CRM usa a API oficial do WhatsApp?",
    a: "Sim. A conexão é feita pela API oficial do WhatsApp Business (Cloud API).",
  },
  {
    q: "Dá para trabalhar com um time inteiro?",
    a: "Sim. A conta tem vários usuários, com papéis (proprietário, administrador, atendente e visualizador) e setores.",
  },
  {
    q: "Integra com plataformas de venda?",
    a: "Sim. Vendas aprovadas na Hotmart, na Kiwify e na Eduzz entram direto no funil.",
  },
  {
    q: "Existe API para integrações próprias?",
    a: "Sim. Há uma API REST com chaves de acesso revogáveis e permissões por escopo, além de webhooks de saída.",
  },
  {
    q: "Como é criado o acesso?",
    a: "Hoje a conta é criada pela equipe da RCO. Depois disso, você conecta o WhatsApp e configura o funil.",
  },
];

/** PENDING_BUSINESS_CONFIGURATION: tela real principal do CRM (abaixo da abertura). null = sem imagem. */
export const heroShot: Shot | null = null;

/** PENDING_BUSINESS_CONFIGURATION: depoimentos AUTORIZADOS. Vazio = seção oculta (nada inventado). */
export const testimonials: { quote: string; author: string; company: string }[] = [];
