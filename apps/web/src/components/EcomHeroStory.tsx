"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ambient, buildTimeline, LOOP_SECONDS, STATIC_TIME, type PropName, type Rgba } from "@/lib/hero-timeline";
import { cn } from "@/lib/utils";
import "./hero-story.css";

const TAU = Math.PI * 2;

/**
 * Raiz do hero da /lp-ecom: desenha o fundo animado (de ponta a ponta, atrás de tudo) e roda o motor que anima o celular
 * (PhoneJourney) e as frases (EcomHeroHeadlines), sincronizados. O conteúdo vem como `children`.
 *
 * Desempenho: um único requestAnimationFrame; pausa quando o hero sai da tela (IntersectionObserver) e quando a aba fica
 * oculta; só escreve no DOM o que mudou. Reduced-motion: quadro fixo (tela 2, "Adicionado", frase 2), sem flutuação e sem
 * brilhos em movimento.
 */
export function EcomHeroStory({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    const qa = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => Array.from(from.querySelectorAll<T>(sel));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pj = q<HTMLElement>('[data-pj="root"]');
    const screensEl = q('[data-pj="screens"]');
    const headsEl = q('[data-pj="heads"]');
    if (!pj || !screensEl || !headsEl) return;

    // Escala do celular: projetado em 400 px, escalado pela largura real do componente.
    const setScale = () => pj.style.setProperty("--pj-scale", String(pj.clientWidth / 400));
    setScale();
    const sro = new ResizeObserver(setScale);
    sro.observe(pj);

    let cancelled = false;
    let raf = 0;
    let stop = () => {};

    const boot = () => {
      if (cancelled) return;
      /* ---- Peças ---- */
      const scr = qa(".scr", screensEl);
      const zooms = scr.map((s) => s.querySelector<HTMLElement>(".zoom")!);
      const contents = scr.map((s) => s.querySelector<HTMLElement>(".content")!);
      const heads = qa(".hs-hl", headsEl);
      const wordEls = heads.map((h) => qa(".hs-w", h));
      const finger = q<HTMLElement>('[data-pj="finger"]')! as unknown as HTMLElement;
      const cam = q('[data-pj="cam"]')!;
      const rot = q('[data-pj="rot"]')!;
      const shadow = q('[data-pj="shadow"]')!;
      const glowA = q(".hs-glow-a")!;
      const glowB = q(".hs-glow-b")!;
      const glowC = q(".hs-glow-c")!;

      /* ---- Posições medidas (como no original) ---- */
      const offsetIn = (el: HTMLElement, anc: HTMLElement) => {
        let x = 0;
        let y = 0;
        let e: HTMLElement | null = el;
        while (e && e !== anc) {
          x += e.offsetLeft;
          y += e.offsetTop;
          e = e.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };
      const centerIn = (el: HTMLElement, anc: HTMLElement) => {
        const o = offsetIn(el, anc);
        return { x: o.x + el.offsetWidth / 2, y: o.y + el.offsetHeight / 2 };
      };
      const cta1 = scr[0]!.querySelector<HTMLElement>(".cta")!;
      const ripple = scr[0]!.querySelector<HTMLElement>(".ripple")!;
      const c1 = centerIn(cta1, contents[0]!);
      ripple.style.left = c1.x + "px";
      ripple.style.top = c1.y + "px";
      zooms[0]!.style.transformOrigin = `${c1.x}px ${c1.y - 70}px`;
      finger.style.left = 14 + c1.x - 48 + "px";
      finger.style.top = 14 + c1.y - 70 - 8 + "px";
      finger.style.transformOrigin = "48px 8px";
      const b2 = scr[1]!.querySelector<HTMLElement>(".b2")!;
      const b3 = scr[2]!.querySelector<HTMLElement>(".b3")!;
      const touch2 = scr[1]!.querySelector<HTMLElement>(".touch")!;
      const touch3 = scr[2]!.querySelector<HTMLElement>(".touch")!;
      ([[b2, touch2, contents[1]!], [b3, touch3, contents[2]!]] as const).forEach(([b, t, c]) => {
        const p = centerIn(b, c);
        t.style.left = p.x + 30 + "px";
        t.style.top = p.y + "px";
      });
      zooms[1]!.style.transformOrigin = "50% 82%";
      zooms[2]!.style.transformOrigin = "50% 32%";
      zooms[3]!.style.transformOrigin = "50% 68%";
      zooms[4]!.style.transformOrigin = "50% 60%";
      const ring4 = scr[3]!.querySelector<HTMLElement>(".ring")!;
      const blue5 = scr[4]!.querySelector<HTMLElement>(".fill.b")!;

      /* ---- Mapa id -> elemento ---- */
      const els = new Map<string, HTMLElement>();
      scr.forEach((e, i) => els.set(`scr${i}`, e));
      zooms.forEach((e, i) => els.set(`zoom${i}`, e));
      els.set("cont0", contents[0]!);
      els.set("finger", finger);
      els.set("ripple", ripple);
      els.set("cta1", cta1);
      els.set("shoe2", scr[1]!.querySelector<HTMLElement>(".shoe")!);
      els.set("touch2", touch2);
      els.set("touch3", touch3);
      els.set("ok2", scr[1]!.querySelector<HTMLElement>(".ok")!);
      els.set("b2", b2);
      els.set("b3", b3);
      els.set("item3", scr[2]!.querySelector<HTMLElement>(".c-item")!);
      els.set("alert4", scr[3]!.querySelector<HTMLElement>(".alert")!);
      qa(".sr", scr[3]!).forEach((e, i) => els.set(`row4_${i}`, e));
      qa(".fw", scr[4]!).forEach((e, i) => els.set(`fw${i}`, e));
      els.set("blue5", blue5);
      els.set("hotName", scr[4]!.querySelector<HTMLElement>(".hot .nm")!);
      qa(".fr:not(.hot) .fill.m", scr[4]!).forEach((e, i) => els.set(`muted${i}`, e));
      els.set("cam", cam);
      wordEls.forEach((ws, i) => ws.forEach((w, j) => els.set(`word_${i}_${j}`, w)));

      const timeline = buildTimeline(wordEls.map((w) => w.length));
      const cache = new WeakMap<HTMLElement, string>();
      const rgba = (c: Rgba) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${+c[3].toFixed(3)})`;
      const n = (v: number) => +v.toFixed(3);

      const applyAt = (t: number) => {
        const values = timeline.valuesAt(t);
        for (const [id, v] of values) {
          const el = els.get(id);
          if (!el) continue;
          const p = v as Partial<Record<PropName, number | Rgba>>;
          const hasT = p.x !== undefined || p.y !== undefined || p.scale !== undefined || p.scaleX !== undefined || p.rotation !== undefined;
          let css = "";
          if (hasT) {
            const sy = (p.scale as number | undefined) ?? 1;
            const sx = (p.scaleX as number | undefined) ?? sy;
            css += `transform:translate(${n((p.x as number) ?? 0)}px,${n((p.y as number) ?? 0)}px) rotate(${n((p.rotation as number) ?? 0)}deg) scale(${n(sx)},${n(sy)});`;
          }
          if (p.opacity !== undefined) css += `opacity:${n(p.opacity as number)};`;
          if (p.blur !== undefined) css += `filter:${(p.blur as number) > 0.05 ? `blur(${n(p.blur as number)}px)` : "none"};`;
          if (p.bg !== undefined) css += `background-color:${rgba(p.bg as Rgba)};`;
          if (p.color !== undefined) css += `color:${rgba(p.color as Rgba)};`;
          if (cache.get(el) !== css) {
            cache.set(el, css);
            // escreve só as propriedades do motor (o resto do style, como transform-origin, não é tocado)
            for (const decl of css.split(";")) {
              if (!decl) continue;
              const i = decl.indexOf(":");
              el.style.setProperty(decl.slice(0, i), decl.slice(i + 1));
            }
          }
        }
      };

      const applyAmbient = (clock: number, still: boolean) => {
        const a = still ? ambient(0) : ambient(clock);
        const fy = still ? 0 : a.fy;
        rot.style.transform = `translateY(${n(fy)}px) rotateX(${n(a.rx)}deg) rotateY(${n(a.ry)}deg) rotateZ(${n(a.rz)}deg)`;
        shadow.style.transform = `translateX(${n(-a.ry * 1.2)}px) scale(${n(1 - fy * 0.004)},${n(1 - fy * 0.003)})`;
        if (!still) {
          glowA.style.transform = `translate(${n(Math.sin((TAU * clock) / 30) * 40)}px,${n(Math.cos((TAU * clock) / 15) * 30)}px) scale(${n(1 + Math.sin((TAU * clock) / 10) * 0.05)})`;
          glowB.style.transform = `translate(${n(Math.cos((TAU * clock) / 30) * 50)}px,${n(Math.sin((TAU * clock) / 10) * 24)}px) scale(${n(1 + Math.cos((TAU * clock) / 15) * 0.06)})`;
          glowC.style.transform = `translate(${n(Math.sin((TAU * clock) / 15) * 30)}px,${n(Math.cos((TAU * clock) / 30) * 30)}px)`;
          const ph = (clock % 2.5) / 2.5;
          ring4.style.transform = `scale(${n(1 + ph * 1.1)})`;
          ring4.style.opacity = (0.6 * (1 - ph)).toFixed(3);
          blue5.style.boxShadow = `0 0 ${n(22 + Math.sin((TAU * clock) / 2.5) * 6)}px rgba(13,103,240,${(0.55 + Math.sin((TAU * clock) / 2.5) * 0.12).toFixed(3)})`;
        }
      };

      if (reduced) {
        applyAt(STATIC_TIME);
        applyAmbient(0, true);
        return;
      }

      /* ---- Laço: um rAF, pausa fora da tela e com a aba oculta ---- */
      let loopT = 0;
      let clock = 0;
      let last = 0;
      let visible = true;
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        loopT = (loopT + dt) % LOOP_SECONDS;
        clock += dt;
        applyAt(loopT);
        applyAmbient(clock, false);
        raf = requestAnimationFrame(tick);
      };
      const run = () => {
        if (raf || !visible || document.hidden) return;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      };
      const halt = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      applyAt(0);
      applyAmbient(0, false);
      const io = new IntersectionObserver(
        ([e]) => {
          visible = !!e?.isIntersecting;
          if (visible) run();
          else halt();
        },
        { threshold: 0 },
      );
      io.observe(root);
      const onVis = () => (document.hidden ? halt() : run());
      document.addEventListener("visibilitychange", onVis);
      run();
      stop = () => {
        halt();
        io.disconnect();
        document.removeEventListener("visibilitychange", onVis);
      };
    };

    // Como no original: espera as fontes (as posições dos toques dependem das medidas do texto).
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]).then(boot);

    return () => {
      cancelled = true;
      sro.disconnect();
      stop();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={rootRef} className={cn("hs relative overflow-hidden", className)}>
      {/* Fundo animado: ocupa o hero inteiro (inclusive atrás do formulário). */}
      <div className="hs-bg" aria-hidden="true">
        <div className="hs-glow hs-glow-a" />
        <div className="hs-glow hs-glow-c" />
        <div className="hs-glow hs-glow-b" />
        <div className="hs-grid" />
        <div className="hs-shade" />
        <div className="hs-seam" />
      </div>
      {children}
    </section>
  );
}
