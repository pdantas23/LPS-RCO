import { describe, expect, it } from "vitest";
import { buildTimeline, LOOP_SECONDS, STATIC_TIME } from "./hero-timeline";

const WORDS = [6, 4, 3, 4, 6];
const tl = buildTimeline(WORDS);
const at = (t: number, id: string, prop: string) => (tl.valuesAt(t).get(id) as Record<string, unknown>)[prop];

describe("linha do tempo do hero (porte do vídeo)", () => {
  it("o ciclo fecha: o estado no fim é igual ao do início (sem salto no laço)", () => {
    const a = tl.valuesAt(0);
    const b = tl.valuesAt(LOOP_SECONDS);
    for (const [id, v] of a) expect(b.get(id), id).toEqual(v);
  });

  it("5 cenas de 5 s: cada tela fica visível na sua janela e só nela", () => {
    const visible = (t: number) => [0, 1, 2, 3, 4].filter((i) => (at(t, `scr${i}`, "opacity") as number) > 0.99);
    expect([2, 7, 12, 17, 22].map(visible)).toEqual([[0], [1], [2], [3], [4]]);
  });

  it("as frases entram e saem junto com a cena (frase i visível no meio da cena i)", () => {
    for (let i = 0; i < 5; i++) {
      const mid = i * 5 + 3.2;
      expect(at(mid, `word_${i}_${WORDS[i]! - 1}`, "opacity")).toBeGreaterThan(0.99);
      const other = (i + 1) % 5;
      expect(at(mid, `word_${other}_0`, "opacity")).toBeLessThan(0.01);
    }
  });

  it("momentos do vídeo: toque no feed (2,65 s), Adicionado (7,65 s), checkout com alerta (17 s), Checkout aceso (23 s)", () => {
    expect(at(2.7, "ripple", "opacity")).toBeGreaterThan(0.3);
    expect(at(7.7, "ok2", "opacity")).toBeGreaterThan(0.99);
    expect(at(17, "alert4", "opacity")).toBeGreaterThan(0.99);
    expect((at(17.5, "row4_2", "bg") as number[])[3]).toBeGreaterThan(0.15);
    expect(at(23, "blue5", "opacity")).toBeGreaterThan(0.99);
    expect(at(23, "muted0", "opacity")).toBeLessThan(0.6);
  });

  it("quadro fixo do reduced-motion: tela 2 (produto) com 'Adicionado' e a frase 2 inteira", () => {
    expect(at(STATIC_TIME, "scr1", "opacity")).toBe(1);
    expect(at(STATIC_TIME, "scr0", "opacity")).toBe(0);
    expect(at(STATIC_TIME, "ok2", "opacity")).toBe(1);
    expect(at(STATIC_TIME, "word_1_3", "opacity")).toBe(1);
    expect(at(STATIC_TIME, "word_0_0", "opacity")).toBe(0);
  });
});
