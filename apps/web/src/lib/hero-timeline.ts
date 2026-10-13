// ============================================================
// Linha do tempo do hero da /lp-ecom: porte da timeline GSAP do HTML do vídeo (rco-hub-hero-x300.html) para um motor
// pequeno e sem dependências. Cada animação é uma função PURA do tempo: valor(t) de cada propriedade de cada elemento.
// Por isso o loop, a pausa (fora da tela, aba oculta) e o modo reduced-motion (tempo fixo) são triviais e exatos.
//
// Mesmos tempos do original (5 s por cena). Diferença: a cena 6 do vídeo (logo e tagline) saiu; o ciclo volta direto da
// cena 5 para a 1, com blur, e dura LOOP_SECONDS (25,6 s: 25 s de cenas + a troca final).
// Curvas do GSAP: power1 = quad, power2 = cúbica, power3 = quártica; sine.inOut.
// ============================================================

export const LOOP_SECONDS = 25.6;
/** Tempo congelado do modo reduced-motion: tela 2 (produto) com "Adicionado" e a frase 2 inteira. */
export const STATIC_TIME = 8.2;

type Ease = (t: number) => number;
const EASE: Record<string, Ease> = {
  p1out: (t) => 1 - (1 - t) * (1 - t),
  p1in: (t) => t * t,
  p2in: (t) => t * t * t,
  p2out: (t) => 1 - (1 - t) ** 3,
  p3out: (t) => 1 - (1 - t) ** 4,
  p2io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  sineio: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export type Rgba = [number, number, number, number];
type Val = number | Rgba;
const isColor = (v: Val): v is Rgba => Array.isArray(v);
const lerp = (a: Val, b: Val, k: number): Val =>
  isColor(a) && isColor(b) ? (a.map((x, i) => x + (b[i]! - x) * k) as Rgba) : (a as number) + ((b as number) - (a as number)) * k;

export type PropName = "opacity" | "x" | "y" | "scale" | "scaleX" | "rotation" | "blur" | "bg" | "color";

interface Seg {
  t0: number;
  dur: number;
  from: Val;
  to: Val;
  ease: Ease;
}

export interface Timeline {
  /** Valor de cada elemento e propriedade no tempo t (0 a LOOP_SECONDS). */
  valuesAt(t: number): Map<string, Partial<Record<PropName, Val>>>;
  ids: string[];
}

interface RawTween {
  id: string;
  prop: PropName;
  t0: number;
  dur: number;
  ease: Ease;
  to: Val;
  order: number;
}

const hex = (h: string): Rgba => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 1];

/** Quantas palavras tem cada frase (para criar os ids word_i_j). */
export function buildTimeline(wordCounts: number[]): Timeline {
  const initial: Record<string, Partial<Record<PropName, Val>>> = {};
  const raw: RawTween[] = [];
  let order = 0;

  const init = (ids: string | string[], v: Partial<Record<PropName, Val>>) => {
    for (const id of [ids].flat()) initial[id] = { ...initial[id], ...v };
  };
  const to = (
    ids: string | string[],
    props: Partial<Record<PropName, Val>>,
    o: { t: number; dur?: number; ease?: string; stagger?: number },
  ) => {
    [ids].flat().forEach((id, i) => {
      for (const [prop, v] of Object.entries(props) as [PropName, Val][]) {
        raw.push({ id, prop, t0: o.t + i * (o.stagger ?? 0), dur: o.dur ?? 0, ease: EASE[o.ease ?? "p1out"]!, to: v, order: order++ });
      }
    });
  };
  const set = (ids: string | string[], props: Partial<Record<PropName, Val>>, t: number) => to(ids, props, { t, dur: 0 });

  const scr = [0, 1, 2, 3, 4].map((i) => `scr${i}`);
  const zoom = [0, 1, 2, 3, 4].map((i) => `zoom${i}`);
  const words = wordCounts.map((n, i) => Array.from({ length: n }, (_, j) => `word_${i}_${j}`));
  const allWords = words.flat();
  const rows4 = [0, 1, 2].map((i) => `row4_${i}`);
  const fws = [0, 1, 2, 3, 4].map((i) => `fw${i}`);
  const muted = [0, 1, 2, 3].map((i) => `muted${i}`);

  /* Estados iniciais (início do ciclo, tela 1 visível). */
  init("scr0", { opacity: 1, blur: 0, scale: 1 });
  init(scr.slice(1), { opacity: 0, blur: 12, scale: 0.97 });
  init(zoom, { scale: 1 });
  init("cont0", { y: 0 });
  init("finger", { opacity: 0, x: 110, y: 240, scale: 1, rotation: -16 });
  init("ripple", { opacity: 0, scale: 0.4 });
  init("cta1", { scale: 1 });
  init("shoe2", { scale: 1, y: 0 });
  init(["touch2", "touch3"], { opacity: 0, scale: 0.6 });
  init("ok2", { opacity: 0 });
  init(["b2", "b3"], { scale: 1 });
  init("item3", { x: 44, opacity: 0 });
  init("alert4", { opacity: 0, y: -10 });
  init(rows4, { bg: [245, 165, 36, 0] });
  init(fws, { scaleX: 0 });
  init("blue5", { opacity: 0 });
  init("hotName", { color: hex("#a9b6d6") });
  init(muted, { opacity: 1 });
  init(allWords, { opacity: 0, y: 26, blur: 14 });
  init("cam", { scale: 1 });

  const headIn = (i: number, t: number) => to(words[i]!, { opacity: 1, y: 0, blur: 0 }, { t, dur: 1.0, ease: "p3out", stagger: 0.08 });
  const headOut = (i: number, t: number) => to(words[i]!, { opacity: 0, y: -16, blur: 10 }, { t, dur: 0.6, ease: "p2in", stagger: 0.035 });
  const swap = (a: number, b: number, t: number) => {
    to(`scr${a}`, { opacity: 0, blur: 12, scale: 1.04 }, { t, dur: 0.65, ease: "p2in" });
    to(`scr${b}`, { opacity: 1, blur: 0, scale: 1 }, { t: t + 0.15, dur: 0.75, ease: "p2out" });
  };
  const tap = (touch: string, btn: string, t: number) => {
    to(touch, { opacity: 1, scale: 1 }, { t, dur: 0.4, ease: "p2out" });
    to(touch, { scale: 0.82 }, { t: t + 0.42, dur: 0.16, ease: "p1in" });
    to(btn, { scale: 0.97 }, { t: t + 0.42, dur: 0.16, ease: "p1in" });
    to(btn, { scale: 1 }, { t: t + 0.6, dur: 0.4, ease: "p2out" });
    to(touch, { opacity: 0, scale: 1.15 }, { t: t + 0.65, dur: 0.55, ease: "p2out" });
  };

  /* Aproximação lenta do celular em cada cena */
  for (let i = 0; i < 5; i++) {
    to("cam", { scale: 1.04 }, { t: i * 5 + 0.5, dur: 3.9, ease: "sineio" });
    to("cam", { scale: 1 }, { t: i * 5 + 4.4, dur: 0.9, ease: "p2io" });
  }

  /* 1. Feed: toque em Comprar agora (0 a 5 s) */
  headIn(0, 0.2);
  to("cont0", { y: -70 }, { t: 0.4, dur: 1.4, ease: "p2io" });
  to("zoom0", { scale: 1.12 }, { t: 1.4, dur: 1.7, ease: "p2io" });
  to("finger", { opacity: 1, x: 0, y: 0 }, { t: 1.6, dur: 0.85, ease: "p3out" });
  to("finger", { scale: 0.93, y: 5 }, { t: 2.5, dur: 0.16, ease: "p1in" });
  to("cta1", { scale: 0.965 }, { t: 2.5, dur: 0.16, ease: "p1in" });
  set("ripple", { opacity: 0.55, scale: 0.4 }, 2.65);
  to("ripple", { opacity: 0, scale: 3 }, { t: 2.65, dur: 1, ease: "p2out" });
  to("finger", { scale: 1, y: 0 }, { t: 2.67, dur: 0.35, ease: "p2out" });
  to("cta1", { scale: 1 }, { t: 2.67, dur: 0.4, ease: "p2out" });
  to("finger", { opacity: 0, x: 80, y: 220 }, { t: 3.4, dur: 0.75, ease: "p2in" });
  headOut(0, 4.25);
  swap(0, 1, 4.45);

  /* 2. Produto: Adicionar ao carrinho vira Adicionado (5 a 10 s) */
  headIn(1, 5.2);
  to("shoe2", { scale: 1.06, y: -8 }, { t: 5.1, dur: 4.2, ease: "sineio" });
  to("zoom1", { scale: 1.07 }, { t: 5.4, dur: 2.8, ease: "p2io" });
  tap("touch2", "b2", 6.6);
  to("ok2", { opacity: 1 }, { t: 7.2, dur: 0.45, ease: "p2out" });
  headOut(1, 9.25);
  swap(1, 2, 9.45);

  /* 3. Carrinho: o item entra, toque em Finalizar compra (10 a 15 s) */
  headIn(2, 10.2);
  to("item3", { x: 0, opacity: 1 }, { t: 10.35, dur: 0.8, ease: "p3out" });
  to("zoom2", { scale: 1.07 }, { t: 10.5, dur: 2.5, ease: "p2io" });
  tap("touch3", "b3", 12.0);
  headOut(2, 14.25);
  swap(2, 3, 14.45);

  /* 4. Checkout parado, alerta e linhas realçadas (15 a 20 s) */
  headIn(3, 15.2);
  to("zoom3", { scale: 1.07 }, { t: 15.4, dur: 3, ease: "p2io" });
  to("alert4", { opacity: 1, y: 0 }, { t: 15.6, dur: 0.7, ease: "p3out" });
  rows4.forEach((r, i) => to(r, { bg: [245, 165, 36, 0.17] }, { t: 16.4 + i * 0.3, dur: 0.8, ease: "p2out" }));
  headOut(3, 19.25);
  swap(3, 4, 19.45);

  /* 5. Painel RCO: o Checkout acende (20 a 25 s) */
  headIn(4, 20.2);
  to(fws, { scaleX: 1 }, { t: 20.55, dur: 1, ease: "p3out", stagger: 0.14 });
  to("zoom4", { scale: 1.08 }, { t: 21.5, dur: 2.8, ease: "p2io" });
  to("blue5", { opacity: 1 }, { t: 21.95, dur: 0.8, ease: "p2io" });
  to("hotName", { color: [255, 255, 255, 1] }, { t: 21.95, dur: 0.6 });
  to(muted, { opacity: 0.55 }, { t: 21.95, dur: 0.8 });
  headOut(4, 24.2);

  /* Volta direto para a cena 1, com blur (sem a cena da logo do vídeo). Os elementos da cena 1 são reiniciados enquanto a
     tela 1 está invisível; os das cenas 2 a 5, quando as telas delas já saíram. */
  set("scr0", { opacity: 0, blur: 12, scale: 0.97 }, 24.4);
  set("zoom0", { scale: 1 }, 24.4);
  set("cont0", { y: 0 }, 24.4);
  set("finger", { opacity: 0, x: 110, y: 240, scale: 1, rotation: -16 }, 24.4);
  set("ripple", { opacity: 0, scale: 0.4 }, 24.4);
  set("cta1", { scale: 1 }, 24.4);
  swap(4, 0, 24.45);
  set(scr.slice(1), { opacity: 0, blur: 12, scale: 0.97 }, 25.2);
  set(zoom.slice(1), { scale: 1 }, 25.2);
  set("shoe2", { scale: 1, y: 0 }, 25.2);
  set(["touch2", "touch3"], { opacity: 0, scale: 0.6 }, 25.2);
  set("ok2", { opacity: 0 }, 25.2);
  set(["b2", "b3"], { scale: 1 }, 25.2);
  set("item3", { x: 44, opacity: 0 }, 25.2);
  set("alert4", { opacity: 0, y: -10 }, 25.2);
  set(rows4, { bg: [245, 165, 36, 0] }, 25.2);
  set(fws, { scaleX: 0 }, 25.2);
  set("blue5", { opacity: 0 }, 25.2);
  set("hotName", { color: hex("#a9b6d6") }, 25.2);
  set(muted, { opacity: 1 }, 25.2);
  set(allWords, { opacity: 0, y: 26, blur: 14 }, 25.2);

  /* Agrupa por (id, prop) e calcula o valor inicial de cada trecho a partir do trecho anterior. */
  const byKey = new Map<string, RawTween[]>();
  for (const r of raw) {
    const k = `${r.id}|${r.prop}`;
    (byKey.get(k) ?? byKey.set(k, []).get(k)!).push(r);
  }
  const segs = new Map<string, Seg[]>();
  const valueOf = (list: Seg[], base: Val, t: number): Val => {
    let v = base;
    for (const s of list) {
      if (s.t0 > t) break;
      v = s.dur === 0 || t >= s.t0 + s.dur ? s.to : lerp(s.from, s.to, s.ease((t - s.t0) / s.dur));
    }
    return v;
  };
  for (const [k, list] of byKey) {
    const [id, prop] = k.split("|") as [string, PropName];
    const base = (initial[id]?.[prop] ?? 0) as Val;
    list.sort((a, b) => a.t0 - b.t0 || a.order - b.order);
    const out: Seg[] = [];
    for (const r of list) {
      out.push({ t0: r.t0, dur: r.dur, ease: r.ease, to: r.to, from: valueOf(out, base, r.t0) });
    }
    segs.set(k, out);
  }

  const ids = Array.from(new Set([...Object.keys(initial), ...raw.map((r) => r.id)]));
  const props = new Map<string, PropName[]>();
  for (const id of ids) {
    const p = new Set<PropName>(Object.keys(initial[id] ?? {}) as PropName[]);
    for (const r of raw) if (r.id === id) p.add(r.prop);
    props.set(id, [...p]);
  }

  return {
    ids,
    valuesAt(t) {
      const out = new Map<string, Partial<Record<PropName, Val>>>();
      for (const id of ids) {
        const v: Partial<Record<PropName, Val>> = {};
        for (const prop of props.get(id)!) {
          const base = (initial[id]?.[prop] ?? 0) as Val;
          v[prop] = valueOf(segs.get(`${id}|${prop}`) ?? [], base, t);
        }
        out.set(id, v);
      }
      return out;
    },
  };
}

/** Movimento ambiente do celular (período em segundos como no original; `t` é o relógio livre, sem laço). */
export function ambient(t: number) {
  const TAU = Math.PI * 2;
  const ry = 15 + Math.sin((TAU * t) / 15) * 5;
  const rx = 6 + Math.sin((TAU * t) / 10) * 2.2;
  const rz = Math.sin((TAU * t) / 30) * 1.2;
  const fy = Math.sin((TAU * t) / 6) * 12;
  return { ry, rx, rz, fy };
}

export { EASE as __EASE_FOR_TESTS };
