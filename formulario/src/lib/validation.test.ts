import { describe, expect, it } from "vitest";
import { SCREENS } from "../formulario/config";
import { emptyForm, firstInvalidScreen, normalizeInstagram, validateScreen, type FormData } from "./validation";

const at = (field: string) => SCREENS.findIndex((s) => s.field === field);
const valid = (over: Partial<FormData> = {}): FormData => ({
  ...emptyForm(),
  full_name: "Maria da Silva",
  employees: "2_3",
  niche: "saude",
  email: "maria@empresa.com.br",
  instagram: "@empresa",
  whatsapp: "(62) 99876-5432",
  whatsapp_repeat: "(62) 99876-5432",
  sales_challenge: "nao_converte",
  urgency: "imediato",
  ads_experience: "nunca",
  revenue_range: "10k_30k",
  ...over,
});
const types = (field: string, over: Partial<FormData>) => validateScreen(at(field), valid(over)).map((e) => e.type);

describe("validação por tela", () => {
  it("formulário completo passa em todas as telas; sócio pode ficar vazio", () => {
    expect(firstInvalidScreen(valid())).toBeNull();
    expect(firstInvalidScreen(emptyForm())).toBe(0);
  });

  it("nome", () => {
    expect(types("full_name", { full_name: "   " })).toEqual(["missing_name"]);
    expect(types("full_name", { full_name: "A" })).toEqual(["invalid_name"]);
    expect(types("full_name", { full_name: "  José  D'Ávila-Souza " })).toEqual([]);
  });

  it("e-mail", () => {
    expect(types("email", { email: " " })).toEqual(["missing_email"]);
    for (const bad of ["maria", "maria@empresa", "maria @empresa.com", "@empresa.com"]) {
      expect(types("email", { email: bad }), bad).toEqual(["invalid_email"]);
    }
    expect(types("email", { email: "  maria.silva+rco@empresa.com.br " })).toEqual([]);
  });

  it("@ da empresa aceita @, sem @ e link do Instagram", () => {
    expect(normalizeInstagram("@RcoHub")).toBe("@rcohub");
    expect(normalizeInstagram("rcohub")).toBe("@rcohub");
    expect(normalizeInstagram("https://www.instagram.com/rco.hub/?hl=pt-br")).toBe("@rco.hub");
    expect(normalizeInstagram("instagram.com/rco_hub")).toBe("@rco_hub");
    expect(normalizeInstagram("@rco hub")).toBe("");
    expect(normalizeInstagram("<script>")).toBe("");
    expect(types("instagram", { instagram: "" })).toEqual(["missing_instagram"]);
    expect(types("instagram", { instagram: "@a b" })).toEqual(["invalid_instagram"]);
  });

  it("confirmação do WhatsApp: tem de bater com o número (com ou sem máscara/55)", () => {
    expect(types("whatsapp_repeat", { whatsapp_repeat: "" })).toEqual(["missing_whatsapp_repeat"]);
    expect(types("whatsapp_repeat", { whatsapp_repeat: "(62) 99876-5433" })).toEqual(["whatsapp_mismatch"]);
    expect(types("whatsapp_repeat", { whatsapp_repeat: "+55 62 99876-5432" })).toEqual([]);
  });

  it("múltipla escolha é obrigatória; sócio é opcional com limite", () => {
    expect(types("employees", { employees: "" })).toEqual(["missing_employees"]);
    expect(types("sales_challenge", { sales_challenge: "" })).toEqual(["missing_sales_challenge"]);
    expect(types("urgency", { urgency: "" })).toEqual(["missing_urgency"]);
    expect(types("ads_experience", { ads_experience: "" })).toEqual(["missing_ads_experience"]);
    expect(types("revenue_range", { revenue_range: "" })).toEqual(["missing_revenue_range"]);
    expect(types("partner", { partner: "" })).toEqual([]);
    expect(types("partner", { partner: "x".repeat(201) })).toEqual(["invalid_partner"]);
  });

  it("segmento: Outro exige o texto", () => {
    expect(types("niche", { niche: "" })).toEqual(["missing_niche"]);
    expect(types("niche", { niche: "outro", niche_other: " " })).toEqual(["missing_niche_other"]);
    expect(types("niche", { niche: "outro", niche_other: "Pet shop" })).toEqual([]);
  });
});
