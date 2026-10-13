import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as ecom from "./ecom";

// Fidelidade da copy: o texto da /lp-ecom (content/ecom.ts) tem de ser IGUAL, na mesma ordem, ao texto literal do
// documento final guardado em docs/copy-ecom-v2.md (cada linha "- texto" é uma string de copy). Mudou o texto de
// um lado e não do outro, este teste falha.

const SKIP_KEYS = new Set(["icon", "icons", "href", "id", "formId", "formName", "path"]);
const GROUPS = [
  "ECOM_PAGE", "ECOM_NAV", "ECOM_HERO", "ECOM_HERO_STORY", "ECOM_PAINS", "ECOM_FLOW", "ECOM_SERVICE", "ECOM_OBJECTIONS", "ECOM_MODELS",
  "ECOM_INDICATORS", "ECOM_METHOD", "ECOM_PROOF", "FATURAMENTOS_ECOM", "INVESTIMENTOS_ECOM", "ECOM_FORM", "ECOM_NEXT",
  "ECOM_FAQ", "ECOM_CLOSING", "ECOM_FOOTER",
] as const;

function leaves(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => leaves(x, out));
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) if (!SKIP_KEYS.has(k)) leaves(x, out);
  }
  return out;
}

const fromCode = GROUPS.flatMap((g) => leaves((ecom as Record<string, unknown>)[g]));
const md = fs.readFileSync(path.resolve(__dirname, "../../../../docs/copy-ecom-v2.md"), "utf8");
const fromDoc = md.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2));

describe("copy da /lp-ecom x documento final (docs/copy-ecom-v2.md)", () => {
  it("o conteúdo do código e o do documento são idênticos, na mesma ordem", () => {
    expect(fromCode).toEqual(fromDoc);
  });

  it("textos-chave do documento aparecem literalmente", () => {
    for (const t of [
      "Sua loja recebe visitas, mas você sabe onde está perdendo vendas?",
      "Gestão de tráfego para e-commerce | RCO Hub",
      "Quero analisar meu e-commerce",
      "Vamos entender o momento da sua loja?",
      "Nosso time vai avaliar os dados e entrar em contato pelo WhatsApp informado para combinar os próximos passos.",
    ]) {
      expect(fromCode).toContain(t);
    }
  });

  it("não afirma o que a RCO não faz (checkout, site, frete, logística) nem inventa garantia", () => {
    const all = fromCode.join(" ").toLowerCase();
    for (const bad of ["refazemos o checkout", "desenvolvemos o site", "alteramos o frete", "cuidamos da logística", "garantimos", "depoimento autorizado", "[resultado"]) {
      expect(all).not.toContain(bad);
    }
  });
});
