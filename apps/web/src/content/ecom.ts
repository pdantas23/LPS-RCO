// ============================================================
// CONTEÚDO DA /lp-ecom (LP de e-commerce). Todo o texto da página está aqui;
// os componentes só desenham. Faixas do formulário: content/options.ts.
//
// Regras do briefing da RCO que valem para qualquer edição:
//   - NUNCA inventar preço, bônus, prazo, garantia, número de clientes, resultado ou depoimento;
//   - não prometer prazo de retorno; sem pop-up; sem vídeo;
//   - sigla (ROAS, CAC) só com explicação na mesma frase;
//   - sem travessão nos textos.
// O bloco 5 (provas) tem ESPAÇOS RESERVADOS visíveis (PROOF_PLACEHOLDERS): troque cada um
// pelo material real e autorizado; enquanto não houver, nada é inventado.
// ============================================================

export const ECOM_PAGE = {
  id: "ECOM",
  path: "/lp-ecom",
  /** Vai em form_id no COMERCIAL (integração cadastrada lá com este id). */
  formId: "lp-ecom",
  formName: "LP E-commerce",
  title: "Tráfego pago para loja online que fatura a partir de R$ 30 mil por mês | RCO Hub",
  description:
    "Você investe em anúncio e não sabe quanto voltou em venda? A RCO Hub analisa a sua loja online e mostra o que está travando os pedidos.",
} as const;

export const ECOM_HERO = {
  eyebrow: "Para loja online",
  title: "Sua loja online fatura a partir de R$\u00a030 mil por mês e o anúncio ainda não responde quanto voltou?",
  subtitle:
    "A RCO Hub cuida do tráfego pago da sua loja com foco no que importa: pedido entrando e dinheiro voltando do que você investiu.",
  cta: "Quero analisar minha loja",
} as const;

export const ECOM_PAINS = {
  heading: "Isso acontece na sua loja?",
  description: "Cinco situações comuns em loja online que investe em anúncio.",
  cta: "Quero resolver isso",
  items: [
    { id: "anuncio", image: "/ecom/dor-anuncio.webp", title: "Gasta em anúncio e não sabe o que voltou", text: "O dinheiro sai todo mês, mas ninguém mostra quanto de venda veio de cada real investido." },
    { id: "promocao", image: "/ecom/dor-promocao.webp", title: "Só vende em promoção", text: "Sem desconto o pedido não entra, e a margem some junto com a promoção." },
    { id: "carrinho", image: "/ecom/dor-carrinho.webp", title: "Carrinho abandonado sem resposta", text: "A pessoa escolhe o produto, não finaliza a compra e ninguém volta a falar com ela." },
    { id: "relatorio", image: "/ecom/dor-relatorio.webp", title: "Relatório que ninguém entende", text: "Alcance, clique e curtida no relatório, mas nenhuma resposta sobre venda e lucro." },
    { id: "cliente", image: "/ecom/dor-cliente.webp", title: "Cliente compra uma vez e não volta", text: "Cada venda parece começar do zero, porque ninguém cuida de quem já comprou." },
  ],
} as const;

export const ECOM_SERVICE = {
  heading: "O que a RCO faz pela sua loja",
  subtitle: "Do anúncio ao pedido, tudo olhado como uma coisa só.",
  items: [
    { icon: "megaphone", title: "Anúncios feitos para vender", text: "Campanhas pensadas em pedido, não em clique." },
    { icon: "bar-chart", title: "Medição do que voltou", text: "Você passa a ver quanto de venda veio do que investiu, em linguagem simples." },
    { icon: "image", title: "Criativos e ofertas testados", text: "Imagens, textos e ofertas diferentes são comparados para manter o que vende." },
    { icon: "cart", title: "Recuperação de carrinho abandonado", text: "Quem parou no meio da compra recebe um motivo para voltar." },
    { icon: "message", title: "Atendimento no WhatsApp", text: "Dúvida de cliente respondida rápido, com o histórico guardado." },
    { icon: "users", title: "Acompanhamento direto com o time", text: "Você fala com quem cuida da sua conta, sem depender só de relatório." },
  ],
} as const;

export const ECOM_METHOD = {
  heading: "Como a RCO trabalha uma loja online",
  subtitle: "Quatro passos, na ordem em que eles fazem diferença.",
  cta: "Quero analisar minha loja",
  items: [
    { title: "Diagnóstico da loja", text: "Olhamos anúncios, site e pedidos para entender onde a venda está travando." },
    { title: "Medição confiável", text: "Ajustamos o acompanhamento para saber, de verdade, quanto cada anúncio trouxe de venda." },
    { title: "Anúncios e ofertas", text: "Montamos campanhas e testamos criativos e ofertas, mantendo o que gera pedido." },
    { title: "Otimização contínua", text: "Acompanhamos os números com você e ajustamos onde o dinheiro rende mais." },
  ],
} as const;

export const ECOM_PROOF = {
  heading: "Quem é a RCO Hub",
  about:
    "A RCO Hub é uma agência de performance: cuida de tráfego pago e do atendimento comercial no WhatsApp, com CRM próprio. Em vez de entregar relatório de alcance, trabalhamos para a sua loja entender quanto o anúncio devolveu em venda.",
  resultsHeading: "Resultados e depoimentos",
  resultsNote: "Só publicamos resultado e depoimento autorizado por cliente. Os espaços abaixo serão preenchidos assim que houver material real.",
} as const;

/**
 * ESPAÇOS RESERVADOS do bloco 5: cada um é um cartão tracejado, visível e honesto, na página.
 * Trocar por material real e autorizado (ver README/relatório). `kind` define o formato do cartão.
 */
export const PROOF_PLACEHOLDERS = [
  { id: "resultado-1", kind: "resultado", label: "[Resultado autorizado de cliente]" },
  { id: "resultado-2", kind: "resultado", label: "[Resultado autorizado de cliente]" },
  { id: "depoimento-1", kind: "depoimento", label: "[Depoimento autorizado de lojista]" },
  { id: "depoimento-2", kind: "depoimento", label: "[Depoimento autorizado de lojista]" },
  { id: "equipe", kind: "equipe", label: "[Foto e nome de quem atende a sua conta]" },
  { id: "logos", kind: "logos", label: "[Logos de lojas atendidas, com autorização]" },
] as const;

export const ECOM_FAQ = [
  {
    q: "Quanto custa?",
    a: "O valor depende do tamanho da sua operação e do quanto você investe em anúncio. Não passamos preço aqui: depois do formulário, o time analisa a sua loja e monta uma proposta.",
  },
  {
    q: "Em quanto tempo vejo resultado?",
    a: "Depende da sua loja, do produto e do investimento, então não prometemos prazo. Na conversa, o time explica o que dá para esperar no seu caso.",
  },
  {
    q: "Minha loja precisa faturar um mínimo?",
    a: "Hoje o atendimento tem mais foco em lojas que faturam a partir de R$ 30 mil por mês. Se você fatura menos, pode enviar o formulário do mesmo jeito: o time avalia o seu caso.",
  },
  {
    q: "E se eu ainda não invisto em anúncio?",
    a: "Pode enviar. A pergunta sobre investimento serve para o time entender o seu ponto de partida, e há uma opção para quem ainda não investe.",
  },
  {
    q: "O que é ROAS?",
    a: "É quanto a loja vende para cada R$ 1 investido em anúncio. Usamos esse número, e outros em linguagem simples, para você saber se o anúncio está se pagando.",
  },
  {
    q: "Já tenho agência ou alguém cuidando do tráfego. Posso enviar?",
    a: "Pode. O time olha o que existe hoje e diz com sinceridade se faz sentido trocar, ajustar ou manter como está.",
  },
  {
    q: "O que acontece depois que eu enviar o formulário?",
    a: "O time da RCO analisa as suas respostas e chama você no WhatsApp para conversar sobre a sua loja. Você não paga nada para enviar.",
  },
] as const;

export const ECOM_FORM = {
  heading: "Quero analisar minha loja",
  text: "Responda cinco perguntas rápidas. O time da RCO analisa as respostas e chama você no WhatsApp.",
  submit: "Quero analisar minha loja",
  whatsappHelp: "Com DDD. Digite de novo abaixo para termos certeza de que conseguimos falar com você.",
} as const;

/** Tela depois do envio, uma para cada perfil. */
export const ECOM_THANKS = {
  Dentro: {
    title: "Recebemos os dados da sua loja!",
    text: "O time da RCO vai analisar as suas respostas e chamar você no WhatsApp para conversar sobre a sua loja.",
  },
  Fora: {
    title: "Recebemos os seus dados!",
    text: "Hoje o nosso atendimento tem mais foco em lojas que faturam a partir de R$ 30 mil por mês. Seu contato ficou guardado e o time vai avaliar o seu caso, então a resposta pode não ser imediata.",
  },
} as const;
