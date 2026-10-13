// ============================================================
// CONTEÚDO DA /lp-ecom (LP de e-commerce), versão final do documento "RCO Hub | Landing page de
// performance para e-commerce" (09/10/2026). Só entram aqui os trechos "COPY PARA PUBLICAR".
// O texto literal está também em docs/copy-ecom-v2.md e um teste (ecom-copy.test.ts) garante que os dois
// batem. Para mudar texto: mude o documento e este arquivo juntos.
//
// Regras do documento: nunca inventar depoimento, resultado, número, prazo, garantia; nunca dizer que a RCO
// refaz checkout, desenvolve site, muda frete ou faz logística; sem urgência artificial.
// Campos "icon" são nomes de ícones Lucide (components/EcomIcon.tsx), não texto.
// Faixas do formulário: ECOM_FORM.faturamentos / investimentos (única fonte; options.ts só reexporta).
// ============================================================

/** Política de privacidade e contato comercial: VAZIO = não aparece (nem a frase, nem o link). Preencher quando houver URL real. */
export const PRIVACY_URL = "";
export const CONTACT_URL = "";

export const ECOM_PAGE = {
  id: "ECOM",
  path: "/lp-ecom",
  /** Vai em form_id no COMERCIAL (integração cadastrada lá com este id). */
  formId: "lp-ecom",
  formName: "LP E-commerce",
  title: "Gestão de tráfego para e-commerce | RCO Hub",
  description:
    "A RCO Hub gerencia anúncios para e-commerce e dropshipping. Entenda campanhas, produtos, carrinhos, checkouts e vendas antes de investir mais.",
  ogTitle: "Sua loja sabe onde está perdendo vendas?",
  ogDescription:
    "Conheça o serviço de tráfego para lojas virtuais da RCO Hub e solicite uma conversa sobre as campanhas do seu e-commerce.",
} as const;

/** Âncoras internas (ids das seções). O menu saiu; os ids ficam para links diretos. */
export const ECOM_ANCHORS = { form: "formulario", method: "como-trabalhamos", indicators: "o-que-acompanhamos", models: "para-quem-e", faq: "duvidas" } as const;

export const ECOM_HERO = {
  eyebrow: "Tráfego pago para e-commerce e dropshipping",
  title: "Sua loja recebe visitas, mas você sabe onde está perdendo vendas?",
  subtitle:
    "A RCO gerencia suas campanhas e analisa o caminho até a compra. Entenda quais produtos, anúncios e etapas da loja precisam de atenção antes de colocar mais dinheiro em tráfego.",
} as const;

/**
 * As 5 frases animadas do hero (texto HTML real, sincronizadas com as telas do celular). `key` é a palavra em destaque
 * (cor da marca); `after` que começa em pontuação gruda na última palavra. Decorativas: vão em bloco aria-hidden
 * (o h1 acessível é o ECOM_HERO.title, escondido só visualmente).
 */
export const ECOM_HERO_STORY = {
  headlines: [
    { before: "Seu", key: "anúncio", after: "leva a pessoa até a loja." },
    { before: "Ela vê o", key: "produto", after: "." },
    { before: "Coloca no", key: "carrinho", after: "." },
    { before: "E para no", key: "checkout", after: "?" },
    { before: "A RCO mostra", key: "onde a venda se perde", after: "." },
  ],
} as const;

export const ECOM_PAINS = {
  eyebrow: "O que pode estar acontecendo hoje",
  title: "O anúncio leva a pessoa até a loja. A venda pode estar se perdendo depois disso.",
  support:
    "Nem todo problema é falta de visita. Algumas lojas recebem tráfego, mas enfrentam dificuldades em diferentes momentos da compra.",
  items: [
    { icon: "mouse-pointer-click", title: "Visita entra, pedido não aparece", text: "Você paga para levar pessoas à loja, mas boa parte sai sem avançar para a compra." },
    { icon: "shopping-cart", title: "Carrinhos que não viram pedidos", text: "O cliente escolhe o produto, coloca no carrinho e não conclui. Sem olhar essa etapa, o motivo fica pouco claro." },
    { icon: "credit-card", title: "Checkouts que param no meio", text: "A pessoa começa a finalizar a compra, mas não chega ao pagamento confirmado. Frete, prazo, preço e experiência da página podem influenciar." },
    { icon: "wallet", title: "O anúncio vende, mas a margem aperta", text: "O faturamento aparece no relatório, mas o custo do produto, as taxas e a verba de mídia também precisam entrar na conta." },
    { icon: "image", title: "Dependência de um só criativo", text: "Quando o anúncio que mais vende perde força, sua loja não tem outros testes prontos para continuar aprendendo." },
    { icon: "chart-no-axes-combined", title: "Relatórios sem decisão clara", text: "Você vê cliques, alcance e ROAS, mas continua com dúvida sobre onde aumentar, reduzir ou revisar o investimento." },
  ],
} as const;

export const ECOM_FLOW = {
  eyebrow: "Do anúncio ao pedido",
  title: "Não olhamos somente para quem clicou. Olhamos para o que aconteceu depois.",
  text:
    "A mesma campanha pode levar pessoas até a sua loja e, ainda assim, não gerar o número de pedidos esperado. Para entender melhor esse cenário, acompanhamos as etapas que os dados da operação permitem visualizar.",
  steps: [
    { icon: "megaphone", title: "Anúncio", text: "A pessoa encontra seu produto em uma campanha." },
    { icon: "store", title: "Página do produto", text: "Ela visita a loja e avalia preço, oferta e informações do produto." },
    { icon: "shopping-cart", title: "Carrinho", text: "Demonstra interesse e adiciona um item." },
    { icon: "credit-card", title: "Checkout", text: "Começa a preencher os dados para comprar." },
    { icon: "package-check", title: "Compra", text: "O pedido é registrado e entra na análise dos anúncios." },
  ],
  closing: "Quando fica mais claro onde o cliente para, fica mais fácil decidir o que testar primeiro.",
} as const;

export const ECOM_SERVICE = {
  eyebrow: "Nosso trabalho com sua loja",
  title: "Campanhas pensadas para vender produtos, não apenas gerar visitas.",
  support:
    "Antes de aumentar a verba, precisamos entender o catálogo, o momento da loja e o que os dados mostram sobre as compras.",
  items: [
    { icon: "target", title: "Campanhas conforme seus produtos", text: "Organizamos as campanhas de acordo com os produtos, o público, a oferta e os canais de anúncio mais adequados à sua loja." },
    { icon: "images", title: "Criativos e ofertas em avaliação", text: "Acompanhamos quais anúncios chamam atenção e quais geram compras. A partir disso, orientamos novos testes de comunicação e oferta." },
    { icon: "shopping-cart", title: "Atenção ao carrinho e ao checkout", text: "Analisamos os sinais disponíveis para entender onde o cliente deixa de avançar e apontamos ajustes que precisam ser avaliados na loja." },
    { icon: "chart-no-axes-combined", title: "Investimento ligado ao resultado", text: "Acompanhamos custo por compra, valor dos pedidos e retorno das campanhas para decidir o que manter, testar ou reduzir." },
    { icon: "clipboard-list", title: "Acompanhamento da operação", text: "Você entende o que está sendo feito, por que estamos ajustando as campanhas e quais informações precisamos da sua loja para tomar decisões melhores." },
  ],
  cta: "Quero conversar sobre minhas campanhas",
} as const;

export const ECOM_OBJECTIONS = {
  eyebrow: "Para quem já tentou anunciar",
  title: "Você pode ter investido em tráfego antes e ainda não ter entendido o que precisava mudar.",
  items: [
    { icon: "message-square-warning", title: "“Já contratei agência e não vi resultado.”", text: "Na nossa conversa, queremos entender o que foi feito, quais produtos foram anunciados e quais resultados sua loja conseguiu medir. Trocar apenas quem aperta os botões não resolve um problema que ninguém identificou." },
    { icon: "calculator", title: "“Meu ROAS parece bom, mas sobra pouco.”", text: "ROAS mostra a receita atribuída aos anúncios em relação ao gasto com mídia. Para avaliar se a operação faz sentido, também é necessário considerar margem, custo dos produtos e outras despesas que sua loja informar." },
    { icon: "trending-up", title: "“Minha loja vende, mas não consigo aumentar o investimento com segurança.”", text: "Antes de subir a verba, precisamos avaliar se os produtos, os anúncios e as etapas da compra estão respondendo bem. Nem toda campanha melhora só porque recebe mais orçamento." },
  ],
} as const;

export const ECOM_MODELS = {
  eyebrow: "Para diferentes modelos de loja virtual",
  title: "Sua operação pode ter estoque próprio ou trabalhar com dropshipping. A análise precisa considerar isso.",
  items: [
    { icon: "package", title: "E-commerce com estoque próprio", text: "Consideramos produtos com maior saída, ticket médio, margem, sazonalidade, disponibilidade de estoque e oportunidades de recompra para orientar as campanhas." },
    { icon: "truck", title: "Loja de dropshipping", text: "Além dos anúncios, observamos oferta, página do produto, prazo de entrega informado, custo de aquisição e renovação de criativos. Esses pontos influenciam a decisão de compra." },
  ],
  closing:
    "Não tratamos uma loja com catálogo consolidado da mesma forma que uma operação que depende de testar produtos e ofertas com frequência.",
} as const;

export const ECOM_INDICATORS = {
  eyebrow: "O que acompanhamos nas campanhas",
  title: "Os números precisam ajudar você a decidir o que fazer com o investimento.",
  support:
    "Dependendo das integrações e dos dados disponíveis, observamos indicadores de anúncio, comportamento na loja e compras.",
  items: [
    { icon: "mouse-pointer-click", title: "Visitas e custo do tráfego", text: "Quanto custa levar pessoas até a loja e como cada campanha gera acesso." },
    { icon: "shopping-cart", title: "Adições ao carrinho", text: "Quantas pessoas demonstram interesse depois de visitar um produto." },
    { icon: "credit-card", title: "Inícios de checkout", text: "Quantos clientes chegam à etapa de finalizar o pedido." },
    { icon: "badge-dollar-sign", title: "Compras e custo por compra", text: "Quantos pedidos foram registrados e quanto foi investido para gerar cada compra atribuída." },
    { icon: "receipt", title: "Ticket médio e receita", text: "O valor médio dos pedidos e a receita atribuída, conforme os registros disponíveis." },
    { icon: "chart-column-increasing", title: "ROAS e leitura de margem", text: "O retorno atribuído aos anúncios e, quando a loja fornece os custos necessários, a análise junto à margem do negócio." },
  ],
  note: "ROAS não é lucro. Ele é um dos dados usados na análise, não a resposta inteira.",
} as const;

export const ECOM_METHOD = {
  eyebrow: "Como trabalhamos",
  title: "Primeiro entendemos a loja. Depois definimos onde vale a pena concentrar o trabalho.",
  items: [
    { title: "Entendemos sua operação", text: "Avaliamos produtos, ticket, margem informada, canais utilizados, verba de mídia e histórico das campanhas." },
    { title: "Organizamos as prioridades", text: "Definimos quais campanhas, produtos, públicos e criativos precisam entrar primeiro no planejamento." },
    { title: "Gerenciamos e testamos", text: "Acompanhamos os anúncios, ajustamos o investimento e avaliamos novas hipóteses conforme os resultados." },
    { title: "Acompanhamos as compras", text: "Usamos os dados disponíveis da loja e das campanhas para discutir o que funcionou e o que precisa mudar." },
  ],
  icons: ["store", "list-checks", "sliders-horizontal", "chart-no-axes-combined"],
} as const;

/**
 * Seção 11 (provas): ESCONDIDA até existirem cases reais e autorizados. Para ligar: `enabled: true` e
 * preencher `cases` (nome da loja, período, desafio inicial, o que foi feito, resultados verificáveis, fonte ou
 * autorização). Sem placeholders visíveis: com `enabled` falso ou `cases` vazio, nada é renderizado.
 */
export const SHOW_PROOF_SECTION = false;
export const ECOM_PROOF = {
  title: "Veja experiências de lojas atendidas pela RCO",
  support:
    "Conheça o cenário inicial, o trabalho realizado e os resultados registrados em operações que autorizaram a divulgação.",
  caseFields: ["Nome da loja", "Período", "Desafio inicial", "O que foi feito", "Resultados verificáveis", "Fonte ou autorização"],
} as const;
export interface ProofCase {
  loja: string;
  periodo: string;
  desafio: string;
  feito: string;
  resultados: string;
  fonte: string;
}
export const PROOF_CASES: readonly ProofCase[] = [];

export const FATURAMENTOS_ECOM = [
  "Até R$ 29.999",
  "De R$ 30.000 a R$ 49.999",
  "De R$ 50.000 a R$ 79.999",
  "De R$ 80.000 a R$ 119.999",
  "De R$ 120.000 a R$ 199.999",
  "De R$ 200.000 a R$ 349.999",
  "De R$ 350.000 a R$ 499.999",
  "De R$ 500.000 a R$ 999.999",
  "R$ 1 milhão ou mais",
  "Prefiro conversar sobre isso",
] as const;

export const INVESTIMENTOS_ECOM = [
  "Ainda não tenho verba definida",
  "Até R$ 1.999",
  "De R$ 2.000 a R$ 4.999",
  "De R$ 5.000 a R$ 9.999",
  "De R$ 10.000 a R$ 19.999",
  "De R$ 20.000 a R$ 49.999",
  "De R$ 50.000 a R$ 99.999",
  "R$ 100.000 ou mais",
  "Prefiro conversar sobre isso",
] as const;

export const ECOM_FORM = {
  title: "Vamos entender o momento da sua loja?",
  support:
    "Conte um pouco sobre seu e-commerce. Nosso time vai avaliar as informações e entrar em contato para conversar sobre as campanhas da sua operação.",
  name: { label: "Nome completo", placeholder: "Como podemos chamar você?" },
  whatsapp: { label: "WhatsApp", placeholder: "(00) 00000-0000" },
  email: { label: "E-mail", placeholder: "voce@sualoja.com.br" },
  faturamento: { label: "Qual é o faturamento médio mensal da sua loja?", placeholder: "Selecione uma faixa" },
  investimento: {
    label: "Quanto sua loja investe ou pode investir por mês em anúncios?",
    placeholder: "Selecione uma faixa",
    help: "Considere a verba destinada às plataformas de anúncios, sem contar o valor do serviço de gestão.",
  },
  submit: "Quero analisar meu e-commerce",
  sending: "Enviando seus dados...",
  consent: "Ao enviar, você autoriza a RCO Hub a usar seus dados para responder a esta solicitação.",
  privacyLink: "Consulte nossa Política de Privacidade.",
  successTitle: "Recebemos as informações da sua loja.",
  successText:
    "Nosso time vai avaliar os dados e entrar em contato pelo WhatsApp informado para combinar os próximos passos.",
  errors: {
    network: "Não conseguimos enviar agora. Confira sua conexão e tente novamente.",
    validation: "Confira os campos destacados e tente novamente.",
    rateLimit: "Recebemos muitas tentativas. Aguarde alguns minutos para reenviar.",
  },
} as const;

export const ECOM_NEXT = {
  eyebrow: "Próximos passos",
  title: "Você envia os dados. Nós entendemos o cenário antes de falar sobre uma proposta.",
  items: [
    { title: "Envie as informações", text: "Faturamento e verba de anúncios ajudam a entender o momento da operação." },
    { title: "Nosso time entra em contato", text: "Vamos conversar pelo WhatsApp para entender seus produtos, desafios e o que já foi feito em anúncios." },
    { title: "Avaliamos os próximos passos", text: "Se houver encaixe, combinamos uma conversa consultiva para explicar como a RCO poderia atuar na sua loja." },
  ],
  icons: ["clipboard-check", "messages-square", "calendar-check"],
} as const;

export const ECOM_FAQ = {
  eyebrow: "Dúvidas",
  title: "Perguntas frequentes",
  items: [
    { q: "A RCO atende loja virtual e dropshipping?", a: "Sim. Nosso serviço é voltado para empresas que vendem pela internet. Na conversa inicial, entendemos o modelo da loja, os produtos, as campanhas e o momento da operação para avaliar o encaixe." },
    { q: "Já tenho gestor ou agência. Ainda faz sentido conversar?", a: "Sim. Podemos entender o que está sendo feito hoje, o que a empresa consegue medir e quais pontos ainda geram dúvida. A conversa não exige cancelar outro contrato." },
    { q: "Vocês olham só para Meta Ads?", a: "Não necessariamente. Podemos avaliar a atuação em canais como Meta Ads, Google Ads e outros, conforme o perfil do e-commerce e o escopo combinado. A escolha dos canais depende da estratégia de cada operação." },
    { q: "Minha loja recebe carrinhos, mas poucas compras. Vocês conseguem ajudar?", a: "Podemos analisar os dados disponíveis e apontar hipóteses para investigar o que acontece entre produto, carrinho e checkout. Mudanças técnicas na plataforma da loja precisam ser avaliadas conforme o serviço contratado." },
    { q: "Vocês garantem um ROAS ou um número de vendas?", a: "Não. O resultado depende de fatores como produto, margem, preço, concorrência, site, estoque e investimento. Nosso trabalho é acompanhar os dados e tomar decisões com base no que a operação mostra." },
    { q: "Como sei se minha loja tem faturamento para contratar?", a: "Preencha as faixas de faturamento e verba do formulário. Nosso time avalia essas informações junto ao momento do negócio e informa se o serviço faz sentido para sua operação." },
    { q: "Quanto custa a gestão de tráfego?", a: "O valor depende da estrutura de campanhas, dos canais e do trabalho necessário. Por isso, primeiro entendemos a operação e depois apresentamos a proposta, se houver encaixe." },
    { q: "Em quanto tempo começo a ter resultados?", a: "O prazo varia conforme o histórico de campanhas, os produtos, a verba disponível e a experiência de compra na loja. Na conversa, explicamos o que seria acompanhado desde o começo, sem prometer um prazo único de vendas." },
    { q: "O que acontece depois que eu preencher o formulário?", a: "O time da RCO analisa seus dados e entra em contato pelo WhatsApp para entender melhor a loja. Se fizer sentido para os dois lados, seguimos para uma conversa consultiva." },
  ],
} as const;

export const ECOM_CLOSING = {
  headline: "Antes de aumentar o orçamento dos anúncios, entenda o que está acontecendo com as compras da sua loja.",
  text:
    "Conte para a RCO como seu e-commerce vende hoje. Vamos analisar as informações iniciais e conversar sobre o que precisa ser observado nas suas campanhas.",
  cta: "Quero analisar meu e-commerce",
  microtext: "Você será direcionado ao formulário desta página.",
} as const;

export const ECOM_FOOTER = {
  tagline: "RCO Hub. Gestão de tráfego para empresas que vendem pela internet.",
  privacy: "Política de Privacidade",
  contact: "Contato comercial",
  copyright: "© 2026 RCO Hub. Todos os direitos reservados.",
} as const;
