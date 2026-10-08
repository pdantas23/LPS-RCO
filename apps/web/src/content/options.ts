// ============================================================
// OPÇÕES DO FORMULÁRIO (conteúdo provisório: a RCO define as finais).
//
// Estes valores são gravados como TEXTO nos campos personalizados "Nicho" e
// "Faturamento" do COMERCIAL-RCO. Mudar a lista aqui não exige mudar nada
// lá: os campos são de texto livre. O servidor só aceita o que está nesta lista.
// ============================================================

export const NICHOS = [
  "Estética e beleza",
  "Odontologia",
  "Saúde e clínicas",
  "Advocacia",
  "Educação e cursos",
  "E-commerce",
  "Serviços locais",
  "Outro",
] as const;

export const FATURAMENTOS = [
  "Ainda não faturo",
  "Até R$ 30 mil por mês",
  "De R$ 30 mil a R$ 100 mil por mês",
  "De R$ 100 mil a R$ 300 mil por mês",
  "Acima de R$ 300 mil por mês",
] as const;

// ============================================================
// /lp-ecom: as duas perguntas de faixa e a regra do perfil. Lugar único:
// o formulário, o servidor (que calcula o Perfil) e os testes leem daqui.
// A PRIMEIRA faixa de faturamento é a única que vira Perfil "Fora".
// ============================================================

export const FATURAMENTOS_ECOM = [
  "Abaixo de R$ 30 mil",
  "R$ 30 mil a 50 mil",
  "R$ 50 mil a 100 mil",
  "R$ 100 mil a 300 mil",
  "R$ 300 mil a 1 milhão",
  "Acima de R$ 1 milhão",
] as const;

export const INVESTIMENTOS_ECOM = [
  "Até R$ 2 mil",
  "R$ 2 mil a 5 mil",
  "R$ 5 mil a 10 mil",
  "R$ 10 mil a 30 mil",
  "Acima de R$ 30 mil",
  "Ainda não invisto",
] as const;

export type PerfilEcom = "Dentro" | "Fora";

/** Abaixo de R$ 30 mil = Fora (o lead é enviado do mesmo jeito); de R$ 30 mil para cima = Dentro. */
export function perfilEcom(faturamento: string): PerfilEcom {
  return faturamento === FATURAMENTOS_ECOM[0] ? "Fora" : "Dentro";
}
