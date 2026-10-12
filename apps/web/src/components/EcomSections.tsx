import { cn } from "@/lib/utils";
import { EcomIcon } from "./EcomIcon";

// Blocos de apresentação da /lp-ecom (só HTML e CSS, sem estado: rodam no servidor). Cores só por token do site.

/** Sobretítulo + título + apoio, centralizados. Cada seção abre com isto (título em h2). */
export function SectionHead({ eyebrow, title, support, className }: { eyebrow?: string; title: string; support?: string; className?: string }) {
  return (
    <div className={cn("mx-auto mb-10 max-w-3xl text-center sm:mb-12", className)}>
      {eyebrow ? <p className="mb-3 text-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p> : null}
      <h2 className="text-2xl leading-tight font-bold sm:text-3xl">{title}</h2>
      {support ? <p className="mt-4 text-lg text-mute">{support}</p> : null}
    </div>
  );
}

export function IconBox({ name }: { name: string }) {
  return (
    <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-bg text-brand">
      <EcomIcon name={name} />
    </div>
  );
}

export interface IconCardItem {
  icon: string;
  title: string;
  text: string;
}

/**
 * Grade de cartões com ícone (não clicáveis): 3 colunas no desktop, 1 por linha no celular.
 * `quote`: o título é uma fala em destaque (seção de objeções), em vez de título comum.
 */
export function IconCards({ items, columns = 3, quote = false }: { items: readonly IconCardItem[]; columns?: 2 | 3; quote?: boolean }) {
  return (
    <ul className={cn("grid auto-rows-fr gap-4 sm:gap-5", columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
      {items.map((item) => (
        <li key={item.title} className="rounded-2xl border border-line bg-surface p-6">
          <IconBox name={item.icon} />
          <h3 className={cn("mt-4 font-bold", quote ? "text-xl leading-snug text-ink" : "text-lg")}>{item.title}</h3>
          <p className="mt-2 text-mute">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Caminho da compra: etapas ligadas por setas simples. Horizontal no desktop, vertical no celular.
 * Rótulos em HTML, sem percentuais nem números de exemplo.
 */
export function PurchaseFlow({ steps }: { steps: readonly IconCardItem[] }) {
  // Grade de colunas IGUAIS (minmax(0,1fr)) e linhas de mesma altura (auto-rows-fr): os 5 cartões têm a mesma largura
  // e a mesma altura. As setas ficam fora dos cartões, absolutas no vão entre eles (não entram no cálculo da largura).
  return (
    <ol className="grid auto-rows-fr grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-5">
      {steps.map((s, i) => (
        <li key={s.title} className="relative">
          <div className="h-full rounded-2xl border border-line bg-surface p-5 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-bg text-brand">
              <EcomIcon name={s.icon} />
            </div>
            <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
            <p className="mt-1.5 text-sm text-mute">{s.text}</p>
          </div>
          {i < steps.length - 1 ? (
            <div
              aria-hidden="true"
              className="absolute -bottom-10 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center text-brand lg:top-1/2 lg:right-[-2.5rem] lg:bottom-auto lg:left-auto lg:h-10 lg:-translate-x-0 lg:-translate-y-1/2"
            >
              <svg viewBox="0 0 24 24" className="size-6 rotate-90 fill-none stroke-current lg:rotate-0" strokeWidth="1.75">
                <path d="M4 12h15m-5-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/** Ilustração simples em código: grade de produtos em caixas (estoque próprio). */
function StockArt() {
  return (
    <svg viewBox="0 0 240 110" aria-hidden="true" className="h-28 w-full max-w-xs fill-none stroke-current text-brand" strokeWidth="1.5">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${12 + i * 56} 18)`}>
          <rect width="46" height="34" rx="4" className="fill-bg" />
          <path d="M0 12h46M23 0v12" />
          <rect y="42" width="46" height="34" rx="4" className="fill-bg" />
          <path d="M0 54h46M23 42v12" />
        </g>
      ))}
    </svg>
  );
}

/** Ilustração simples em código: cartão de produto ligado a fornecedor e entrega (dropshipping). */
function DropshipArt() {
  return (
    <svg viewBox="0 0 240 110" aria-hidden="true" className="h-28 w-full max-w-xs fill-none stroke-current text-brand" strokeWidth="1.5">
      <rect x="10" y="26" width="64" height="58" rx="6" className="fill-bg" />
      <rect x="18" y="34" width="48" height="26" rx="3" />
      <path d="M18 70h30M18 76h18" />
      <path d="M74 55h28" strokeDasharray="3 3" />
      <rect x="102" y="38" width="44" height="34" rx="6" className="fill-bg" />
      <path d="M112 50h24M112 58h14" />
      <path d="M146 55h28" strokeDasharray="3 3" />
      <rect x="174" y="38" width="56" height="34" rx="6" className="fill-bg" />
      <path d="M184 55h36m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Dois modelos de loja lado a lado (cada um com ícone e ilustração em código). */
export function TwoModels({ items }: { items: readonly IconCardItem[] }) {
  const arts = [<StockArt key="a" />, <DropshipArt key="b" />];
  return (
    <div className="grid auto-rows-fr gap-5 md:grid-cols-2">
      {items.map((m, i) => (
        <div key={m.title} className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <IconBox name={m.icon} />
            <h3 className="text-xl font-bold">{m.title}</h3>
          </div>
          <p className="mt-4 text-mute">{m.text}</p>
          <div className="mt-6 flex justify-center">{arts[i]}</div>
        </div>
      ))}
    </div>
  );
}
