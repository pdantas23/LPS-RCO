import { ECOM_HERO_STORY } from "@/content/ecom";

type Word = { text: string; key: boolean };

/** Quebra a frase em palavras (cada uma é animada à parte). A pontuação que abre `after` gruda na última palavra. */
function words(h: { before: string; key: string; after: string }): Word[] {
  const out: Word[] = [...h.before.split(" ").map((text) => ({ text, key: false })), ...h.key.split(" ").map((text) => ({ text, key: true }))];
  const after = h.after.trim();
  if (!after) return out;
  const [first, ...rest] = after.split(" ");
  if (/^[.?!,;:]/.test(first!)) {
    const last = out[out.length - 1]!;
    out[out.length - 1] = { ...last, text: last.text + first };
  } else {
    out.push({ text: first!, key: false });
  }
  return [...out, ...rest.map((text) => ({ text, key: false }))];
}

/**
 * As 5 frases do hero (texto HTML real), empilhadas na MESMA célula de uma grade: a altura do bloco é a da maior frase e a
 * página não pula quando a frase troca. O motor do hero anima palavra por palavra, sincronizado com o celular.
 * Decorativo (aria-hidden): o texto acessível do hero é o h1.
 */
export function EcomHeroHeadlines({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" data-pj="heads" className={`hs-heads ${className}`}>
      {ECOM_HERO_STORY.headlines.map((h, i) => (
        <div key={i} className="hs-hl">
          {words(h).map((w, j, all) => (
            <span key={j}>
              <span className={`hs-w${w.key ? " hs-k" : ""}`}>{w.text}</span>
              {j < all.length - 1 ? " " : null}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
