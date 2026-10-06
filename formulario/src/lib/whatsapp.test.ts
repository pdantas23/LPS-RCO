import { describe, expect, it } from "vitest";
import { formatWhatsapp, nationalDigits, normalizeWhatsapp, whatsappProblem } from "./whatsapp";

describe("whatsapp", () => {
  it("vazio é obrigatório", () => {
    expect(whatsappProblem("")).toBe("required");
    expect(whatsappProblem("() -")).toBe("required");
  });

  it.each(["123", "(62) 9987-654", "(00) 99876-5432", "(20) 99876-5432", "(62) 89876-5432", "(62) 1212-3456"])(
    "formato inválido: %s",
    (v) => expect(whatsappProblem(v)).toBe("invalid"),
  );

  it.each(["(62) 99876-5432", "62998765432", "+55 (11) 91234-5678", "5511912345678", "(62) 3212-3456", "062 3212-3456", "062 99876-5432"])(
    "formato válido: %s",
    (v) => expect(whatsappProblem(v)).toBeNull(),
  );

  it("normaliza para 55 + DDD + número", () => {
    expect(normalizeWhatsapp("(62) 99876-5432")).toBe("5562998765432");
    expect(normalizeWhatsapp("+55 11 91234-5678")).toBe("5511912345678");
    expect(normalizeWhatsapp("(62) 3212-3456")).toBe("556232123456");
    expect(nationalDigits("0623212-3456")).toBe("6232123456");
    expect(normalizeWhatsapp("062 99876-5432")).toBe("5562998765432");
  });

  it("máscara progressiva", () => {
    expect(formatWhatsapp("6")).toBe("(6");
    expect(formatWhatsapp("629")).toBe("(62) 9");
    expect(formatWhatsapp("6299876")).toBe("(62) 9987-6");
    expect(formatWhatsapp("62998765432")).toBe("(62) 99876-5432");
    expect(formatWhatsapp("6232123456")).toBe("(62) 3212-3456");
    expect(formatWhatsapp("629987654321234")).toBe("(62) 99876-5432");
  });
});
