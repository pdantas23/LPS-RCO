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
export const GTM_ID = "GTM-P9XNXV2B";

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
    shot: { src: "./telas/conversas.webp", alt: "Conversa de WhatsApp no CRM, do orçamento ao pagamento confirmado", width: 1233, height: 1688 },
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
    shot: { src: "./telas/funil.webp", alt: "Funil de vendas em kanban com negócios nas etapas Novo Lead, Tentando Contato e Follow Up 01", width: 1578, height: 1310 },
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
    shot: { src: "./telas/metricas.webp", alt: "Métricas comerciais com receita, gasto, ROAS e custo por lead de cada campanha", width: 1550, height: 1242 },
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

export interface TourScreen {
  id: string;
  /** Rótulo curto da aba. */
  tab: string;
  title: string;
  text: string;
  points: string[];
  /** Tela do CRM (dados fictícios: empresa, equipe e clientes inventados). */
  shot: Shot;
}

const screen = (id: string, alt: string): Shot => ({ src: `./telas/sistema-${id}.webp`, alt, width: 1920, height: 1200 });

/** Telas do CRM numa seção com abas. Só recursos que aparecem na própria tela. */
export const tour: TourScreen[] = [
  {
    id: "desempenho",
    tab: "Desempenho",
    title: "Os números do período num painel só",
    text: "Conversas iniciadas, novos contatos e receita no período que você escolher, junto com os tempos de atendimento.",
    points: ["Receita e conversas do período", "Tempo de espera e de primeira resposta", "Tempo do lead até a venda", "Gráfico diário de mensagens recebidas e enviadas"],
    shot: screen("desempenho", "Painel de desempenho do CRM com conversas, contatos, receita e tempos de atendimento"),
  },
  {
    id: "conversas",
    tab: "Conversas",
    title: "Do primeiro oi ao pagamento",
    text: "A caixa de entrada reúne os atendimentos do número da empresa. O atendente conversa com o histórico completo e vê a etapa do cliente no funil ao lado.",
    points: ["Lista de conversas com mensagens não lidas em destaque", "Anexos, áudios e respostas rápidas digitando /", "Funil e etapa do cliente ao lado da conversa", "Transferência do atendimento para outra pessoa"],
    shot: screen("conversas", "Caixa de entrada do CRM com uma conversa de venda pelo WhatsApp aberta"),
  },
  {
    id: "funil",
    tab: "Funil",
    title: "Cada negócio na etapa certa",
    text: "O funil em kanban mostra quantos negócios há em cada etapa e há quanto tempo cada um está parado.",
    points: ["Etapas do jeito da sua empresa", "Tempo de cada negócio na etapa", "Busca, filtros e etiquetas", "Novo lead com um clique"],
    shot: screen("funil", "Funil de vendas em kanban com as etapas Novo Lead, Tentando Contato e Follow Up"),
  },
  {
    id: "lead",
    tab: "Ficha do lead",
    title: "Tudo sobre o cliente numa ficha só",
    text: "Responsável, etapa, valor do negócio e contato ficam juntos, com a régua de follow-up e a linha do tempo do lead.",
    points: ["Responsável, etapa e valor do negócio", "Régua de follow-up por ligação e mensagem", "Etiquetas e notas", "Linha do tempo com cada mensagem e mudança de etapa"],
    shot: screen("lead", "Ficha do lead com informações do negócio, follow-up, etiquetas e linha do tempo"),
  },
  {
    id: "clientes",
    tab: "Clientes",
    title: "A base de clientes organizada",
    text: "Todos os contatos que chegaram pelo WhatsApp ficam numa lista, com telefone, e-mail e data de entrada.",
    points: ["Busca por nome, telefone ou e-mail", "Filtro por funil e filtros por etiqueta", "Importação de contatos", "Cadastro manual de clientes"],
    shot: screen("clientes", "Lista de clientes do CRM com nome, telefone, e-mail e data de criação"),
  },
  {
    id: "metas",
    tab: "Metas",
    title: "Ranking e metas do time",
    text: "O gestor acompanha leads, vendas, perdas e receita de cada vendedor nos últimos 30 dias.",
    points: ["Ranking de vendedores", "Meta mensal por vendedor", "Motivos de perda mais comuns"],
    shot: screen("metas", "Ranking de vendedores com metas do mês e motivos de perda"),
  },
  {
    id: "metricas",
    tab: "Métricas",
    title: "Quanto cada anúncio rendeu",
    text: "Leads, vendas e receita de cada campanha, com custo por lead e ROAS a partir do gasto informado.",
    points: ["Receita, gasto e ROAS do período", "Custo por lead de cada campanha", "Lançamento do gasto de anúncio por campanha"],
    shot: screen("metricas", "Métricas comerciais com receita, gasto, ROAS e custo por lead por campanha"),
  },
];
