/**
 * Nome "de curioso" (Teste, Fulano, aaaa, asdf…). Regra de UX da RCO: quem se identifica
 * assim vai para a página "Aqui não, curioso" e nada é salvo.
 * Compara palavra por palavra (sem acento, minúsculas) para não barrar nomes reais
 * como Celeste, Teresa ou Isaac.
 */

export const normalizeName = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function isSuspectName(name: string, blocklist: readonly string[]): boolean {
  const norm = normalizeName(name);
  if (!norm) return false;
  if (/\d/.test(norm)) return true; // nome com número: teste123, maria2

  const blocked = new Set(blocklist.map(normalizeName));
  const words = norm.split(/[^a-z]+/).filter(Boolean);
  if (!words.length) return true; // só símbolos: "...", "---"

  return words.some(
    (w) =>
      blocked.has(w) ||
      /^test(e+|ando|ing|er)?$/.test(w) || // test, teste, testeee, testando, testing (não pega Testoni)
      /^([a-z])\1{2,}$/.test(w) || // aaa, kkkk
      (w.length >= 4 && !/[aeiouy]/.test(w)), // sdfg, qwrt, xptz
  );
}
