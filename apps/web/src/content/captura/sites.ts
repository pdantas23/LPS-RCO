import type { CapturaConfig, Tela } from "./tipos";

// ============================================================
// CAPTURA DA LP DE SITES (/sites e /sites/quiz).
// Fonte: briefing do Luis "LP Portfólio de Sites da RCO" v2.2, 25/10/2026 (docs/briefings/lp-sites-v2.2.pdf).
// Perguntas, descrições e opções LITERAIS dos blocos 5, 6 e 7. Um teste (sites-captura.test.ts) confere
// o texto, a ordem e os limites do bloco 3 (no máximo 6 opções, exceto faturamento).
// Para mudar texto: mude o documento e este arquivo juntos. Nenhuma tela tem texto de pergunta no código.
// ============================================================

export const NECESSIDADE = {
  institucional: "Site institucional",
  captura: "Página de captura de leads",
  lancamento: "Página de lançamento",
  loja: "Loja virtual",
  orientacao: "Não sei, quero orientação",
} as const;

export const FATURAMENTOS_SITES = [
  "Mais de R$ 1.000.000",
  "De R$ 500.000 até R$ 1.000.000",
  "De R$ 200.000 até R$ 500.000",
  "De R$ 100.000 até R$ 200.000",
  "De R$ 70.000 até R$ 100.000",
  "De R$ 50.000 até R$ 70.000",
  "De R$ 30.000 até R$ 50.000",
  "De R$ 10.000 até R$ 30.000",
  "Abaixo de R$ 10.000",
  "Zero (Empresa nova)",
  "Zero (Empresa nova. Mas tenho capital para investir)",
] as const;

export const ANUNCIOS_SITES = [
  "Nunca fiz anúncios",
  "Já fiz anúncios por conta própria",
  "Um amigo ou parente fez alguns anúncios pra mim",
  "Já contratei uma agência no passado",
  "Estou com uma agência ou gestor agora",
] as const;

export const PRAZOS_SITES = ["Pra ontem, o quanto antes", "Até 30 dias", "De 1 a 3 meses", "Sem pressa"] as const;

const TELAS: Tela[] = [
  // ---------- Caminho curto (bloco 6), nesta ordem ----------
  {
    id: "nome",
    slug: "nome",
    tipo: "texto",
    pergunta: "Qual seu nome?",
    descricao: "Um bom atendimento começa chamando cada pessoa pelo nome.",
    placeholder: "Seu nome",
    rotuloCard: "Nome",
    campoComercial: "Nome",
  },
  {
    id: "tipo",
    slug: "tipo",
    tipo: "opcoes",
    pergunta: "Qual o tipo do seu negócio?",
    descricao: "Cada tipo de negócio precisa de um site diferente. Essa resposta direciona o que vamos te mostrar.",
    opcoes: [
      "Clínica ou saúde",
      "Escritório de advocacia",
      "Loja física ou e-commerce",
      "Prestador de serviço local",
      "Infoproduto ou lançamento",
      "Outro",
    ],
    rotuloCard: "Tipo de negócio",
    campoComercial: "Tipo de negócio",
  },
  {
    id: "necessidade",
    slug: "necessidade",
    tipo: "opcoes",
    pergunta: "O que você precisa agora?",
    descricao: "Com isso nosso time já chega na conversa sabendo o que montar pra você.",
    opcoes: [NECESSIDADE.institucional, NECESSIDADE.captura, NECESSIDADE.lancamento, NECESSIDADE.loja, NECESSIDADE.orientacao],
    rotuloCard: "O que você precisa",
    campoComercial: "Necessidade",
  },
  {
    id: "desafio",
    slug: "desafio",
    tipo: "opcoes",
    pergunta: "O que mais te atrapalha hoje nessa parte de site?",
    descricao: "Queremos entender o que está te travando pra atacar exatamente isso.",
    opcoes: [
      "Dependo só do Instagram e do WhatsApp",
      "Perco cliente quando pedem meu site e não tenho o que mostrar",
      "Tenho site, mas ele não gera contato nenhum",
      "Pago mensalidade de plataforma e quero sair disso",
      "Rodo anúncio sem página pra mandar o cliente",
      "Nada me atrapalha, quero só melhorar",
    ],
    rotuloCard: "Maior desafio hoje",
    campoComercial: "Desafio",
  },
  {
    id: "anuncios",
    slug: "anuncio",
    tipo: "opcoes",
    pergunta: "Já investiu em anúncios online?",
    descricao: "Essa resposta mostra em que estágio seu negócio está e o quanto um site vai te destravar.",
    opcoes: ANUNCIOS_SITES,
    rotuloCard: "Anúncios online",
    campoComercial: "Anúncio",
  },
  {
    id: "prazo",
    slug: "prazo",
    tipo: "opcoes",
    pergunta: "Pra quando você precisa do site no ar?",
    descricao: "Nossa agenda de produção é por vagas. Saber seu prazo define se conseguimos te encaixar neste mês.",
    opcoes: PRAZOS_SITES,
    rotuloCard: "Prazo",
    campoComercial: "Prazo",
  },
  {
    id: "faturamento",
    slug: "faturamento",
    tipo: "opcoes",
    pergunta: "Quanto sua empresa fatura por mês?",
    descricao:
      "Seu faturamento nos ajuda a compreender o estágio atual do seu negócio e direcionar recomendações que façam sentido para o seu momento.",
    opcoes: FATURAMENTOS_SITES,
    rotuloCard: "Faturamento mensal",
    campoComercial: "Faturamento",
  },
  {
    id: "whatsapp",
    slug: "whatsapp",
    tipo: "telefone",
    pergunta: "Qual seu WhatsApp?",
    descricao:
      "O WhatsApp será o nosso principal canal de comunicação. É por ele que vamos te chamar pra conversar sobre o seu site.",
    placeholder: "(11) 99999-9999",
    rotuloCard: "WhatsApp",
    campoComercial: "WhatsApp",
  },
  {
    id: "instagram",
    slug: "instagram",
    tipo: "instagram",
    pergunta: "Qual o @ da sua empresa?",
    descricao: "Analisamos o perfil da sua empresa antes da conversa pra chegar com recomendações prontas pro seu caso.",
    placeholder: "@rcohub",
    placeholderCard: "@suaempresa",
    rotuloCard: "@ da empresa no Instagram",
    // Não está na lista de campos do bloco 10, mas a pergunta existe nos dois formatos: vai como "Instagram" (dúvida para o Luis).
    campoComercial: "Instagram",
  },

  // ---------- Só no caminho longo (bloco 7). O documento não traz descrição para estas telas. ----------
  {
    id: "site_atual",
    slug: "site",
    tipo: "opcoes",
    pergunta: "Você já tem site?",
    opcoes: ["Não tenho", "Tenho e quero refazer", "Tenho e quero melhorar"],
    campoComercial: "Já tem site",
  },
  {
    id: "oferta",
    slug: "oferta",
    tipo: "opcoes",
    pergunta: "Já tem oferta e anúncio prontos pra rodar?",
    opcoes: ["Sim, tudo pronto", "Tenho a oferta, falta o anúncio", "Nada ainda"],
    mostrarSe: { campo: "necessidade", valor: NECESSIDADE.captura },
    campoComercial: "Oferta e anúncio",
  },
  {
    id: "produtos",
    slug: "produtos",
    tipo: "opcoes",
    pergunta: "Quantos produtos, mais ou menos?",
    opcoes: ["Até 20", "De 20 a 100", "Mais de 100"],
    mostrarSe: { campo: "necessidade", valor: NECESSIDADE.loja },
    campoComercial: "Quantidade de produtos",
  },
  {
    id: "momento",
    slug: "momento",
    tipo: "opcoes",
    pergunta: "Qual o seu momento?",
    opcoes: ["Lançamento marcado", "Construindo audiência", "Primeira vez lançando"],
    mostrarSe: { campo: "necessidade", valor: NECESSIDADE.lancamento },
    campoComercial: "Momento do lançamento",
  },
  {
    id: "funcionarios",
    slug: "funcionarios",
    tipo: "opcoes",
    pergunta: "Quantos funcionários tem na sua empresa?",
    opcoes: ["Somente eu", "De 2 a 3", "De 4 a 8", "De 9 a 15", "Acima de 16 funcionários"],
    campoComercial: "Funcionários",
  },
  {
    id: "email",
    slug: "email",
    tipo: "email",
    pergunta: "Qual email você mais usa?",
    placeholder: "voce@suaempresa.com.br",
    opcional: true,
    campoComercial: "Email",
  },
];

/**
 * Caminhos. Curto = as 9 telas do bloco 6. Longo = as 9 + as do bloco 7, cada uma depois da tela que o documento
 * indica: "Você já tem site?" e o ramo depois da 3; funcionários depois do faturamento; e-mail depois do WhatsApp.
 * No longo cada pessoa vê no máximo 13 telas (uma só das três ramificadas), dentro do limite de 14.
 * Ordem entre "Você já tem site?" e a tela do ramo (as duas entram depois da 3): o documento não define; ficou
 * site primeiro (dúvida para o Luis).
 */
export const SITES_CAPTURA: CapturaConfig = {
  produto: "sites",
  telas: TELAS,
  caminhos: {
    curto: ["nome", "tipo", "necessidade", "desafio", "anuncios", "prazo", "faturamento", "whatsapp", "instagram"],
    longo: [
      "nome",
      "tipo",
      "necessidade",
      "site_atual",
      ["oferta", "produtos", "momento"],
      "desafio",
      "anuncios",
      "prazo",
      "faturamento",
      "funcionarios",
      "whatsapp",
      "email",
      "instagram",
    ],
  },
};

/** Textos fixos das telas do quiz e do card que não são perguntas (provisórios, como a copy da LP). */
export const CAPTURA_TEXTOS = {
  quiz: {
    voltar: "Voltar",
    continuar: "Continuar",
    pular: "Pular",
    enviar: "Enviar",
    enviando: "Enviando...",
    progresso: (atual: number, total: number) => `Pergunta ${atual} de ${total}`,
    obrigatorio: "Responda para continuar.",
  },
  card: {
    titulo: "Fale com a gente",
    apoio: "Preencha e o time da RCO te chama no WhatsApp.",
    selecione: "Selecione",
    enviar: "Quero meu site",
    enviando: "Enviando...",
    erroCampos: "Confira os campos marcados.",
  },
  sucesso: {
    titulo: "Recebemos suas respostas",
    texto: "O time da RCO vai te chamar no WhatsApp para conversar sobre o seu site.",
  },
  erros: {
    nome: "Informe seu nome.",
    whatsapp: "Informe um WhatsApp válido: DDD e número com 9 dígitos.",
    email: "Informe um e-mail válido ou deixe em branco.",
    instagram: "Informe o @ da sua empresa, por exemplo @rcohub.",
    opcao: "Escolha uma opção.",
    rateLimit: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
    rede: "Não foi possível enviar agora. Suas respostas continuam aqui, tente de novo.",
  },
} as const;
