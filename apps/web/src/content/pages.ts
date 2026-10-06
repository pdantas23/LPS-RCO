import type { VideoSource } from "@/components/video/types";
import type { PainItem } from "@/components/ui/scroll-gallery";
import type { Testimonial } from "@/components/TestimonialsMarquee";

// ============================================================
// CONTEÚDO DAS PÁGINAS.
//
// P05 segue a estrutura AIDA original (ver LandingPage.tsx):
//   Atenção   hero (logo + título)
//   Interesse pains (as dores que a pessoa reconhece) + steps (como funciona)
//   Desejo    features (painel clicável, components/ui/features-with-panel.tsx)
//   Ação      faq (tira objeção) + form (o formulário em si)
//
// P04 tem o próprio fluxo, com vídeo (ver LandingPageP04.tsx e o comentário
// lá): hero+vídeo → resumo da oferta (`offerSummary`) → resultados e
// depoimentos (`results`) → steps (reaproveitado) → faq+form (reaproveitado).
// `pains`/`features` continuam preenchidos pra P04 porque são o mesmo
// objeto que a P05 usa (`const pains`/`const features` logo abaixo, únicos
// pras duas páginas) — a P04 só não RENDERIZA nenhum dos dois no fluxo
// dela; não é lixo nem contradição, é conteúdo compartilhado que uma das
// duas páginas não usa.
//
// Para trocar o vídeo da P04: mude `video` (ver README do projeto, seção
// "Trocar o vídeo da P04"). Para adicionar uma página nova (P01, P02...):
// novo item em PAGES + uma pasta em src/app com 3 linhas + o id em PAGE_IDS.
//
// Sobre `features.items[].content` e `results.note`: nunca print de tela,
// depoimento ou número fabricado fingindo ser prova real — só texto que
// expande o título do item ou avisa que o material ainda não existe (mesmo
// motivo do vídeo em modo "placeholder"). Troque por conteúdo real assim
// que existir; o layout não muda.
// ============================================================

export const PAGE_IDS = ["P04", "P05"] as const;
export type PageId = (typeof PAGE_IDS)[number];

export interface PageConfig {
  id: PageId;
  /** Caminho público da página. */
  path: string;
  /** Vai em "Página de origem" no COMERCIAL. */
  formId: string;
  formName: string;
  /** Título da aba / SEO. */
  title: string;
  description: string;

  // ---- Atenção ----
  /** Na P05, o botão fica no próprio hero. Na P04, o vídeo (bloco 01) não
   *  tem botão nenhum: `cta` vira o texto do botão do bloco 02
   *  (`offerSummary`), separado do vídeo. */
  hero: { eyebrow: string; title: string; subtitle: string; cta: string };
  /** null = página sem vídeo (P05). */
  video: null | { source: VideoSource };
  /** Só a P04 (bloco 02, "resumo da oferta"): `undefined` na P05. */
  offerSummary?: { text: string };
  /** Só a P04 (bloco 03, "resultados e depoimentos"): `undefined` na P05.
   *  Sem `testimonials` (ainda não existe depoimento real de cliente,
   *  ver o comentário no topo do arquivo): `LandingPageP04` mostra `note`
   *  num card de "ainda não existe" em vez do carrossel. Assim que
   *  `testimonials` tiver pelo menos um item, o carrossel some do lugar
   *  do aviso sozinho — não precisa mexer em mais nada. */
  results?: { heading: string; note: string; testimonials?: Testimonial[] };

  // ---- Interesse ----
  /** Conteúdo só da P05 (a P04 não renderiza pains nem features, ver o
   *  comentário no topo do arquivo) — continua obrigatório porque as duas
   *  páginas compartilham o mesmo objeto (`const pains` abaixo). */
  pains: { heading: string; items: PainItem[] };
  steps: { heading: string; subtitle: string; items: { title: string; text: string }[] };

  // ---- Desejo ----
  /** Conteúdo só da P05 (ver comentário de `pains` acima). */
  features: { heading: string; items: { title: string; content: string }[] };

  // ---- Ação ----
  faq: { q: string; a: string }[];
  form: { heading: string; text: string; submit: string };
  /** Só a P05 (bloco 08, "chamada final", depois do FAQ): texto curto
   *  acima do botão que antes ficava no hero (ver LandingPage.tsx). A P04
   *  não usa este campo porque o bloco equivalente dela (`offerSummary`,
   *  também depois do FAQ) já tem o próprio texto. */
  closingText?: string;
}

const pains = {
  heading: "Isso parece com o seu dia a dia?",
  items: [
    {
      icon: "trend-down",
      text: "Você investe em anúncios, mas não sabe ao certo quantos desses cliques viraram cliente de verdade.",
      image: "/pains/trend-down.jpg",
    },
    {
      icon: "clock",
      text: "Um lead chega pelo WhatsApp fora do horário comercial e demora até alguém responder, tempo suficiente para ele procurar outra opção.",
    },
    {
      icon: "repeat",
      text: "O time comercial gasta tempo respondendo pergunta repetida em vez de falar só com quem já está pronto para comprar.",
    },
    {
      icon: "eye-off",
      text: "Você já tentou tráfego pago por conta própria ou com outra agência e não teve controle real sobre o que acontecia depois do clique.",
    },
    {
      icon: "lost-history",
      text: "Cada atendente guarda as conversas do seu jeito, e quando alguém sai do time, o histórico do cliente some junto.",
    },
  ] satisfies PainItem[],
};

const features = {
  heading: "Por que escolher o CRM RCO?",
  items: [
    {
      title: "Resposta imediata no WhatsApp",
      content:
        "Assim que a pessoa manda mensagem, o atendimento automatizado já responde e começa a entender o que ela precisa, mesmo de madrugada ou no fim de semana. Ninguém fica esperando.",
    },
    {
      title: "Lead qualificado antes de chegar no comercial",
      content:
        "O atendimento faz as perguntas certas antes de encaminhar a conversa. Seu time só entra quando o lead já demonstrou interesse de verdade, sem perder tempo com curioso.",
    },
    {
      title: "Cada conversa fica registrada",
      content:
        "Toda mensagem e negócio ficam no histórico do CRM, sem depender de planilha nem de lembrar o que foi combinado. Você acompanha o andamento sempre que quiser.",
    },
    {
      title: "Tráfego pago e atendimento trabalham juntos",
      content:
        "Anúncio e atendimento são desenhados como uma coisa só, não dois serviços separados que não conversam entre si. O clique no anúncio já tem para onde ir.",
    },
    {
      title: "Acompanhamento direto com o nosso time",
      content: "Você fala com quem está cuidando do seu tráfego e do seu CRM, sem depender só de um relatório mensal genérico.",
    },
  ],
};

const faq = [
  {
    q: "O que eu recebo, exatamente?",
    a: "O CRM RCO, completo e que fica sendo seu: nele ficam as conversas do WhatsApp, o histórico de cada cliente e o andamento de cada venda. A RCO Hub cuida do tráfego pago e do atendimento automatizado que alimentam esse CRM, tudo centralizado em um só lugar.",
  },
  {
    q: "Preciso ter uma equipe comercial pronta para começar?",
    a: "Não. O atendimento automatizado no WhatsApp já faz o primeiro contato e a qualificação. Você só precisa de alguém disponível para continuar a conversa quando o lead estiver pronto.",
  },
  {
    q: "Funciona para o meu tipo de negócio?",
    a: "O serviço foi pensado para negócios locais que dependem de gerar contato pelo WhatsApp, como clínicas, escritórios, escolas e lojas. No formulário, escolha o nicho mais parecido com o seu.",
  },
  {
    q: "Em quanto tempo eu vejo resultado?",
    a: "Isso varia conforme o seu nicho, a região e o investimento em anúncios. Depois de preencher o formulário, o nosso time explica com mais detalhe o que esperar para o seu caso.",
  },
  {
    q: "Quanto custa?",
    a: "O valor depende do escopo do seu negócio e do investimento em anúncios que você já tem ou planeja ter. Fale com o nosso time para montar uma proposta.",
  },
];

const steps = {
  heading: "Comece em 3 passos simples",
  subtitle: "Do formulário ao primeiro contato, sem enrolação: só o necessário para o nosso time entender o seu momento e montar um plano sob medida.",
  items: [
    { title: "Você preenche o formulário", text: "Leva menos de um minuto: nome, WhatsApp, nicho e faturamento aproximado." },
    { title: "Nosso time entra em contato", text: "Alguém do time comercial da RCO Hub chama você no WhatsApp para entender o seu momento." },
    {
      title: "Montamos o plano para o seu negócio",
      text: "Receba um plano exclusivo para o seu negócio, focado em aumentar sua taxa de conversão.",
    },
  ],
};

export const PAGES: Record<PageId, PageConfig> = {
  P04: {
    id: "P04",
    path: "/lp02",
    formId: "lp-p04",
    formName: "LP P04 · Performance com VSL",
    title: "CRM com tráfego pago e atendimento automatizado no WhatsApp | RCO Hub",
    description:
      "A RCO Hub te dá o CRM RCO, completo, que une tráfego pago e atendimento automatizado no WhatsApp para trazer clientes prontos para comprar até o seu negócio.",
    hero: {
      eyebrow: "Performance para o seu negócio",
      title: "Pare de perder vendas no WhatsApp por falta de organização. Conheça o CRM RCO",
      // Sem subtítulo no bloco 01 (VideoHero não recebe `hero.subtitle` no
      // fluxo da P04, ver LandingPageP04.tsx): o resumo da oferta já é o
      // bloco 02 (`offerSummary`), logo abaixo do vídeo — duplicar o mesmo
      // texto nos dois lugares seria repetição. Campo vazio só por causa do
      // tipo compartilhado com a P05 (`PageConfig.hero.subtitle` é
      // obrigatório porque a P05 usa o dela).
      subtitle: "",
      cta: "Quero falar com o time",
    },
    video: {
      // Troque por um provedor real quando o vídeo existir (ver README).
      source: { kind: "placeholder", title: "Vídeo em produção" },
    },
    offerSummary: {
      text: "O CRM RCO une tráfego pago, atendimento automatizado no WhatsApp e o histórico de cada cliente em um só lugar. Fale com o nosso time agora.",
    },
    results: {
      heading: "Resultados e depoimentos",
      note: "Estamos reunindo os primeiros casos e depoimentos reais de clientes do CRM RCO. Assim que tivermos resultados verificáveis, essa seção passa a trazer eles, sem depoimento nem número inventado.",
      // EXEMPLO temporário, só pra visualizar o carrossel (TestimonialsMarquee)
      // com texto de tamanho realista — nenhum desses nomes/depoimentos é de
      // cliente de verdade. Tirar assim que você tiver visto e decidido o
      // próximo passo (ou trocar pelos depoimentos reais quando existirem).
      testimonials: [
        { name: "Exemplo — Clínica odontológica", quote: "Antes a gente perdia contato de gente que mandava mensagem fora do horário. Agora o CRM responde na hora e já chega qualificado pra mim." },
        { name: "Exemplo — Studio de estética", quote: "O que mais mudou foi parar de responder a mesma pergunta 20 vezes por dia. O atendimento automatizado já resolve isso." },
        { name: "Exemplo — Escritório de advocacia", quote: "Consigo ver o histórico de cada cliente num lugar só, sem depender de planilha ou de lembrar o que foi combinado." },
        { name: "Exemplo — Loja de e-commerce", quote: "O tráfego pago finalmente conversa com o atendimento. Antes eram dois fornecedores que não se falavam." },
        { name: "Exemplo — Escola de idiomas", quote: "Meu time só entra na conversa quando o lead já demonstrou interesse de verdade. Isso economiza um tempo enorme." },
        { name: "Exemplo — Clínica de estética", quote: "Deixei de perder venda por demora no WhatsApp. O CRM já qualifica antes de chegar pra mim." },
        { name: "Exemplo — Consultório médico", quote: "Gosto de falar direto com quem cuida do meu tráfego, sem depender só de relatório mensal genérico." },
        { name: "Exemplo — Barbearia", quote: "Simples de usar, e o cliente nem percebe que quem responde primeiro é automatizado." },
        { name: "Exemplo — Curso online", quote: "Cada negócio fechado fica registrado. Não preciso mais confiar na memória de ninguém do time." },
      ],
    },
    pains,
    steps,
    features,
    faq,
    form: {
      heading: "Quero falar com o time comercial",
      text: "Preencha os dados abaixo. Nosso time entra em contato pelo WhatsApp para entender o seu momento e mostrar como aplicar isso no seu negócio.",
      submit: "Quero receber contato",
    },
  },
  P05: {
    id: "P05",
    path: "/lp01",
    formId: "lp-p05",
    formName: "LP P05 · Performance sem VSL",
    title: "CRM com performance em tráfego pago e WhatsApp | RCO Hub",
    description: "Fale com o time da RCO Hub e conheça o CRM RCO, que une tráfego pago e atendimento automatizado no WhatsApp para o seu negócio.",
    hero: {
      eyebrow: "Performance para o seu negócio",
      title: "Pare de perder vendas no WhatsApp por falta de organização. Conheça o CRM RCO",
      subtitle: "Conheça o CRM RCO, que acompanha o comercial do seu negócio, do primeiro contato no WhatsApp até o fechamento.",
      cta: "Quero falar com o time",
    },
    video: null,
    pains,
    steps,
    features,
    faq,
    form: {
      heading: "Fale com o time comercial",
      text: "Preencha os dados abaixo. Nosso time entra em contato pelo WhatsApp para entender o seu momento e mostrar como aplicar isso no seu negócio.",
      submit: "Quero receber contato",
    },
    closingText: "Pronto para organizar o WhatsApp do seu negócio? Fale com o nosso time agora.",
  },
};

export function pageMeta(id: PageId) {
  const p = PAGES[id];
  return { id: p.id, formId: p.formId, formName: p.formName };
}
