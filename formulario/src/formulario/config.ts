/**
 * Fonte única de configuração da P02 (Formulário de Performance).
 * Tudo marcado com PENDENTE depende de decisão da RCO — os valores atuais são
 * provisórios e NÃO são regra oficial.
 */

export const FORM_NAME = "performance";

/** Versão gravada junto de cada lead (landing_page_version). Trocar a cada mudança relevante do formulário. */
export const LANDING_PAGE_VERSION = "p02-formulario-v2";

/**
 * Supabase oficial da RCO (https://sb.rcoacademy.com.br), via .env.production (fora do Git; modelo em .env.example).
 * A chave anônima é pública por natureza; ela só alcança a função de captação (ver a migration 001).
 * Sem essas variáveis o envio falha com erro visível — nunca finge sucesso.
 */
export const api = {
  url: (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, ""),
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  rpc: "capturar_lead_performance_rco",
  /** Contato parcial (quem para no meio), a partir da pergunta do WhatsApp — migration 004. */
  partialRpc: "salvar_parcial_performance_rco",
  timeoutMs: 15000,
};

/**
 * PENDENTE: método definitivo de confirmação do WhatsApp.
 * - "visual": TEMPORÁRIO. A pessoa digita o número de novo na tela "Confirme seu número" e os
 *   dois têm de bater. Evita erro de digitação, mas não prova posse do número.
 * - "codigo": código enviado ao WhatsApp. Exige provedor, custo, expiração, reenvio e limite
 *   de tentativas — NÃO implementado; precisa de autorização e de fluxo no servidor.
 */
export type WhatsappConfirmationMode = "visual" | "codigo";
export const WHATSAPP_CONFIRMATION_MODE: WhatsappConfirmationMode = "visual";

export interface Option {
  /** Valor gravado no banco: minúsculas, dígitos e _ (a função do banco exige esse formato). */
  value: string;
  label: string;
}

/** Valor do nicho que abre o campo de texto livre. */
export const NICHE_OTHER = "outro";

/** PENDENTE: lista final de nichos/segmentos. Provisória. "Outro" é obrigatório e fica por último. */
export const NICHES: Option[] = [
  { value: "servicos", label: "Serviços" },
  { value: "comercio_varejo", label: "Comércio / varejo" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "industria", label: "Indústria" },
  { value: NICHE_OTHER, label: "Outro" },
];

/** Faixas de faturamento mensal (formulário da RCO). Nenhuma faixa bloqueia o envio. */
export const REVENUE_RANGES: Option[] = [
  { value: "acima_1m", label: "Mais de R$ 1.000.000" },
  { value: "500k_1m", label: "De R$ 500.000 até R$ 1.000.000" },
  { value: "200k_500k", label: "De R$ 200.000 até R$ 500.000" },
  { value: "100k_200k", label: "De R$ 100.000 até R$ 200.000" },
  { value: "70k_100k", label: "De R$ 70.000 até R$ 100.000" },
  { value: "50k_70k", label: "De R$ 50.000 até R$ 70.000" },
  { value: "30k_50k", label: "De R$ 30.000 até R$ 50.000" },
  { value: "10k_30k", label: "De R$ 10.000 até R$ 30.000" },
  { value: "abaixo_10k", label: "Abaixo de R$ 10.000" },
  { value: "zero_nova", label: "Zero (Empresa nova)" },
  { value: "zero_com_capital", label: "Zero (Empresa nova. Mas tenho capital para investir)" },
];

export const EMPLOYEES: Option[] = [
  { value: "somente_eu", label: "Somente eu" },
  { value: "2_3", label: "De 2 a 3" },
  { value: "4_8", label: "De 4 a 8" },
  { value: "9_15", label: "De 9 a 15" },
  { value: "acima_16", label: "Acima de 16 funcionários" },
];

/** PENDENTE (copy): a 1ª opção veio cortada no formulário original ("Não consigo gerar"). */
export const SALES_CHALLENGES: Option[] = [
  { value: "nao_gera_demanda", label: "Não consigo gerar demanda" },
  { value: "leads_baixa_qualidade", label: "Consigo gerar demanda, mas os leads são de baixa qualidade" },
  { value: "nao_converte", label: "Consigo gerar demanda qualificada, mas não consigo converter em vendas" },
];

/** PENDENTE (copy): a opção B veio cortada no formulário original ("…tão relevantes quanto as"). */
export const URGENCY: Option[] = [
  { value: "imediato", label: "COMEÇAR PRA ONTEM! Alta prioridade, preciso resolver isso o mais rápido possível." },
  { value: "1_2_meses", label: "Daqui 1 ou 2 meses. É importante, mas tenho outros desafios no meu negócio tão relevantes quanto esse." },
  { value: "4_meses_1_ano", label: "Daqui 4 meses até 1 ano. Não é tão urgente." },
];

export const ADS_EXPERIENCE: Option[] = [
  { value: "nunca", label: "Nunca fiz anúncios" },
  { value: "conta_propria", label: "Já fiz anúncios por conta própria." },
  { value: "amigo_parente", label: "Um amigo/parente fez alguns anúncios para mim." },
  { value: "agencia_passado", label: "Já contratei uma agência no passado" },
  { value: "agencia_insatisfeito", label: "Estou com uma agência/gestor agora, porém insatisfeito(a)." },
];

export const labelOf = (options: Option[], value: string): string =>
  options.find((o) => o.value === value)?.label ?? value;

/**
 * Nomes "de curioso": quem se identifica assim vai para a página "Aqui não, curioso" e nada é salvo.
 * Comparação por palavra inteira, sem acento. Além desta lista: test/teste/testando e variações,
 * uma letra repetida (aaaa), palavra sem vogal com 4+ letras (sdfg) e nome com número.
 * A RCO pode acrescentar termos aqui.
 */
export const SUSPECT_NAMES: readonly string[] = [
  "fulano", "fulana", "ciclano", "ciclana", "sicrano", "sicrana", "beltrano", "beltrana",
  "asdf", "asdfg", "asdfgh", "qwerty", "qwert", "abc", "abcd", "xxx", "xpto",
  "lorem", "ipsum", "fake", "bot", "anonimo", "anonima", "ninguem", "curioso", "curiosa",
  "nada", "nome", "sobrenome", "exemplo",
];

/** Página para onde vai quem se identifica como curioso (relativa a /formulario/). */
export const CURIOUS_PAGE = "./curioso/";

/**
 * Uma pergunta por tela, nesta ordem. A última (confirmar o WhatsApp) é a que envia.
 * Trocar a ordem aqui muda a ordem na tela (e o número de cada etapa no form_step).
 */
export type ScreenKind = "text" | "email" | "instagram" | "whatsapp" | "whatsapp_confirm" | "choice" | "niche";

export interface Screen {
  /** Identificador estável: vira o step_name do form_step. */
  id: string;
  kind: ScreenKind;
  /** Campo do formulário que a tela preenche. */
  field: FieldName;
  title: string;
  description?: string;
  options?: Option[];
  optional?: boolean;
  placeholder?: string;
}

export type FieldName =
  | "full_name"
  | "employees"
  | "niche"
  | "email"
  | "instagram"
  | "whatsapp"
  | "whatsapp_repeat"
  | "partner"
  | "sales_challenge"
  | "urgency"
  | "ads_experience"
  | "revenue_range";

export const SCREENS: Screen[] = [
  {
    id: "name",
    kind: "text",
    field: "full_name",
    title: "Qual seu nome?",
    description:
      "Acreditamos que um bom atendimento começa chamando cada pessoa pelo nome. Essa informação também nos ajuda a identificar sua solicitação durante todo o processo.",
    placeholder: "Sua resposta...",
  },
  {
    id: "employees",
    kind: "choice",
    field: "employees",
    title: "Quantos funcionários tem na sua empresa?",
    description:
      "Essa informação nos permite compreender melhor a estrutura da sua empresa e preparar uma consultoria mais alinhada ao seu momento.",
    options: EMPLOYEES,
  },
  {
    // Pergunta extra (não estava no formulário original da RCO): mantida por decisão do Aerton.
    id: "niche",
    kind: "niche",
    field: "niche",
    title: "Qual o segmento da sua empresa?",
    options: NICHES,
  },
  {
    id: "email",
    kind: "email",
    field: "email",
    title: "Qual email você mais usa?",
    description: "Seu e-mail será utilizado apenas para confirmar seu cadastro e compartilhar informações sobre a sua consultoria.",
    placeholder: "Sua resposta...",
  },
  {
    id: "instagram",
    kind: "instagram",
    field: "instagram",
    title: "Qual o @ da sua empresa?",
    description:
      "Analisamos o Instagram da sua empresa antes da consultoria para entender o seu posicionamento atual e preparar recomendações específicas para o seu caso. Digite o @ do seu perfil, por exemplo: @omiguelrco ou @rcohub.",
    placeholder: "Sua resposta...",
  },
  {
    id: "whatsapp",
    kind: "whatsapp",
    field: "whatsapp",
    title: "Qual seu WhatsApp?",
    description:
      "O WhatsApp será o nosso principal canal de comunicação durante todo o processo. É por meio dele que enviaremos as confirmações, faremos o agendamento da consultoria e manteremos contato com você sempre que necessário.",
    placeholder: "(00) 00000-0000",
  },
  {
    id: "partner",
    kind: "text",
    field: "partner",
    title: "Você tem algum sócio ou outra pessoa importante que gostaria de convidar para participar da consultoria?",
    optional: true,
    placeholder: "Sua resposta...",
  },
  {
    id: "sales_challenge",
    kind: "choice",
    field: "sales_challenge",
    title: "Qual maior desafio em vendas na sua empresa?",
    description:
      "Queremos entender qual é o principal obstáculo que impede sua empresa de vender mais. Assim, nossa equipe poderá direcionar a consultoria para o que realmente faz diferença no seu negócio.",
    options: SALES_CHALLENGES,
  },
  {
    id: "urgency",
    kind: "choice",
    field: "urgency",
    title: "Quão urgente é resolver seus problemas relacionados a venda? Quando pretende começar o projeto?",
    description:
      "Queremos entender o quanto esse projeto é uma prioridade para sua empresa. Assim, conseguimos direcionar a consultoria de acordo com a urgência, os objetivos e o momento atual do seu negócio.",
    options: URGENCY,
  },
  {
    id: "ads_experience",
    kind: "choice",
    field: "ads_experience",
    title: "Já investiu em anúncios online?",
    description:
      "Essa pergunta é crucial para podermos preparar seu material, de acordo com seu nível de entendimento no assunto.",
    options: ADS_EXPERIENCE,
  },
  {
    id: "revenue",
    kind: "choice",
    field: "revenue_range",
    title: "Uma última pergunta, quanto sua empresa fatura por mês?",
    description:
      "Seu faturamento nos ajuda a compreender o estágio atual do seu negócio e direcionar recomendações que façam sentido para o seu momento.",
    options: REVENUE_RANGES,
  },
  {
    id: "whatsapp_confirmation",
    kind: "whatsapp_confirm",
    field: "whatsapp_repeat",
    title: "Confirme seu número de WhatsApp",
    description:
      "Pedimos que confirme seu WhatsApp para garantir que conseguiremos entrar em contato com você sem imprevistos. Um número informado incorretamente pode impedir o envio das informações da consultoria e dificultar o seu atendimento.",
    placeholder: "(00) 00000-0000",
  },
];
