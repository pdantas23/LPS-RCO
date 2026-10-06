import { NICHE_OTHER, SCREENS, type FieldName, type Screen } from "../formulario/config";
import { nationalDigits, whatsappProblem } from "./whatsapp";

export interface FormData {
  full_name: string;
  employees: string;
  niche: string;
  niche_other: string;
  email: string;
  instagram: string;
  whatsapp: string;
  /** Número digitado de novo na tela de confirmação; tem de bater com `whatsapp`. */
  whatsapp_repeat: string;
  partner: string;
  sales_challenge: string;
  urgency: string;
  ads_experience: string;
  revenue_range: string;
}

export const emptyForm = (): FormData => ({
  full_name: "",
  employees: "",
  niche: "",
  niche_other: "",
  email: "",
  instagram: "",
  whatsapp: "",
  whatsapp_repeat: "",
  partner: "",
  sales_challenge: "",
  urgency: "",
  ads_experience: "",
  revenue_range: "",
});

export type Field = FieldName | "niche_other";

/** Código técnico do erro: é o que vai para o form_error (nunca o valor digitado). */
export type ErrorType =
  | "missing_name"
  | "invalid_name"
  | "missing_employees"
  | "missing_niche"
  | "missing_niche_other"
  | "missing_email"
  | "invalid_email"
  | "missing_instagram"
  | "invalid_instagram"
  | "missing_whatsapp"
  | "invalid_whatsapp"
  | "missing_whatsapp_repeat"
  | "whatsapp_mismatch"
  | "invalid_partner"
  | "missing_sales_challenge"
  | "missing_urgency"
  | "missing_ads_experience"
  | "missing_revenue_range";

export interface FieldError {
  field: Field;
  type: ErrorType;
}

export const ERROR_MESSAGES: Record<ErrorType, string> = {
  missing_name: "Informe seu nome.",
  invalid_name: "Informe um nome com pelo menos 2 letras (máximo de 120 caracteres).",
  missing_employees: "Escolha uma opção.",
  missing_niche: "Escolha o segmento da sua empresa.",
  missing_niche_other: "Conte qual é o segmento da sua empresa.",
  missing_email: "Informe seu e-mail.",
  invalid_email: "E-mail inválido. Confira, por exemplo: nome@empresa.com.br",
  missing_instagram: "Informe o @ da sua empresa.",
  invalid_instagram: "@ inválido. Use só letras, números, ponto e _ (ex.: @rcohub).",
  missing_whatsapp: "Informe seu WhatsApp com DDD.",
  invalid_whatsapp: "Número inválido. Use DDD + número, por exemplo (62) 99876-5432.",
  missing_whatsapp_repeat: "Digite o número de novo para confirmar.",
  whatsapp_mismatch: "Os números não são iguais. Confira e digite de novo.",
  invalid_partner: "Use no máximo 200 caracteres.",
  missing_sales_challenge: "Escolha uma opção.",
  missing_urgency: "Escolha uma opção.",
  missing_ads_experience: "Escolha uma opção.",
  missing_revenue_range: "Escolha a faixa de faturamento mensal.",
};

export const cleanName = (v: string) => v.trim().replace(/\s+/g, " ");

export const cleanEmail = (v: string) => v.trim();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (v: string) => cleanEmail(v).length <= 254 && EMAIL.test(cleanEmail(v));

/**
 * "@rcohub", "rcohub", "instagram.com/rcohub", "https://www.instagram.com/rcohub/?hl=pt" → "@rcohub".
 * Devolve "" quando não sobra um @ válido (letras, números, ponto e _, até 30).
 */
export function normalizeInstagram(v: string): string {
  let s = v.trim();
  const fromUrl = s.match(/instagram\.com\/([^/?#\s]+)/i);
  if (fromUrl) s = fromUrl[1];
  s = s.replace(/^@+/, "").toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(s) ? `@${s}` : "";
}

const PARTNER_MAX = 200;

function validateField(screen: Screen, data: FormData): FieldError[] {
  const e = (type: ErrorType, field: Field = screen.field): FieldError[] => [{ field, type }];
  switch (screen.field) {
    case "full_name": {
      const name = cleanName(data.full_name);
      if (!name) return e("missing_name");
      if (name.length < 2 || name.length > 120) return e("invalid_name");
      return [];
    }
    case "niche":
      if (!data.niche) return e("missing_niche");
      if (data.niche === NICHE_OTHER && !data.niche_other.trim()) return e("missing_niche_other", "niche_other");
      return [];
    case "email":
      if (!cleanEmail(data.email)) return e("missing_email");
      return isValidEmail(data.email) ? [] : e("invalid_email");
    case "instagram":
      if (!data.instagram.trim()) return e("missing_instagram");
      return normalizeInstagram(data.instagram) ? [] : e("invalid_instagram");
    case "whatsapp": {
      const p = whatsappProblem(data.whatsapp);
      if (p === "required") return e("missing_whatsapp");
      if (p === "invalid") return e("invalid_whatsapp");
      return [];
    }
    case "whatsapp_repeat":
      if (!nationalDigits(data.whatsapp_repeat)) return e("missing_whatsapp_repeat");
      return nationalDigits(data.whatsapp_repeat) === nationalDigits(data.whatsapp) ? [] : e("whatsapp_mismatch");
    case "partner":
      return data.partner.trim().length > PARTNER_MAX ? e("invalid_partner") : [];
    default:
      // Perguntas de múltipla escolha: basta ter escolhido.
      return data[screen.field] ? [] : e(`missing_${screen.field === "revenue_range" ? "revenue_range" : screen.field}` as ErrorType);
  }
}

/** Erros da tela `index` (0 = primeira pergunta). */
export function validateScreen(index: number, data: FormData): FieldError[] {
  const screen = SCREENS[index];
  return screen ? validateField(screen, data) : [];
}

/** Primeira tela com erro (a revisão revalida tudo antes do envio). */
export function firstInvalidScreen(data: FormData): number | null {
  for (let i = 0; i < SCREENS.length; i++) if (validateScreen(i, data).length) return i;
  return null;
}
