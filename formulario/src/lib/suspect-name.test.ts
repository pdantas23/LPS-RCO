import { describe, expect, it } from "vitest";
import { SUSPECT_NAMES } from "../formulario/config";
import { isSuspectName } from "./suspect-name";

const suspect = (n: string) => isSuspectName(n, SUSPECT_NAMES);

describe("nome de curioso", () => {
  it.each([
    "Teste", "teste", "TESTE", "Teste Teste", "Maria Teste", "testando", "Testeee", "test",
    "Fulano", "Fulano de Tal", "Ciclano", "Sicrano", "Beltrano", "Fulana da Silva",
    "aaaaa", "Aaa", "kkkkk", "aaa bbb",
    "asdf", "asdfg", "qwerty", "sdfg", "xptz", "Lorem Ipsum",
    "teste123", "Maria 2", "...", "---",
    "Téste", "FÚLANO",
  ])("barra: %s", (n) => expect(suspect(n)).toBe(true));

  it.each([
    "Maria da Silva", "João Pedro", "Ana", "Celeste Souza", "Teresa Cristina", "Tessa Lima",
    "Isaac Aaron", "Wladmyr Costa", "Tenório Neto", "Anna", "Llanos", "Brenda",
    "José dos Santos", "Ellen", "Bruna Testoni", "Carlos Testa", "Célia Testai",
  ])("não barra nome real: %s", (n) => expect(suspect(n)).toBe(false));

  it("vazio não é tratado como curioso (a validação de obrigatório cuida disso)", () => {
    expect(suspect("   ")).toBe(false);
  });
});
