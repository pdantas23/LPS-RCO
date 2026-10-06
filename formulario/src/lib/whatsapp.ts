/**
 * WhatsApp brasileiro: máscara, normalização e validação de FORMATO.
 * Formato válido não prova que a pessoa controla o número.
 */

/** DDDs em uso no Brasil (Anatel). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Só os dígitos do número nacional (DDD + número), sem 55 nem zero de operadora. */
export function nationalDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if ((d.length === 11 || d.length === 12) && d.startsWith("0")) d = d.slice(1); // 0 + DDD + fixo ou celular
  return d.slice(0, 11);
}

export type WhatsappProblem = "required" | "invalid";

export function whatsappProblem(input: string): WhatsappProblem | null {
  const d = nationalDigits(input);
  if (!d) return "required";
  if (d.length !== 10 && d.length !== 11) return "invalid";
  if (!DDDS.has(Number(d.slice(0, 2)))) return "invalid";
  if (d.length === 11 && d[2] !== "9") return "invalid";
  if (d.length === 10 && !/[2-5]/.test(d[2])) return "invalid"; // fixo começa com 2–5
  return null;
}

/** "5562998765432" — formato gravado no banco. Só chamar depois de validar. */
export function normalizeWhatsapp(input: string): string {
  return "55" + nationalDigits(input);
}

/** Máscara progressiva: (62) 99876-5432 ou (62) 3212-3456. */
export function formatWhatsapp(input: string): string {
  const d = nationalDigits(input);
  if (d.length <= 2) return d ? `(${d}` : "";
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
