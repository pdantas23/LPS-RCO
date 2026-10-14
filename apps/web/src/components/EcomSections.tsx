import { cn } from "@/lib/utils";
import { EcomIcon } from "./EcomIcon";

// Blocos de apresentação da /lp-ecom (só HTML e CSS, sem estado: rodam no servidor). Cores só por token do site.

/** Sobretítulo + título + apoio, centralizados. Cada seção abre com isto (título em h2). */
export function SectionHead({ eyebrow, title, support, className }: { eyebrow?: string; title: string; support?: string; className?: string }) {
  return (
    <div data-rv-group className={cn("mx-auto mb-10 max-w-3xl text-center sm:mb-12", className)}>
      {eyebrow ? (
        <p data-rv-item className="fx-eyebrow mb-3 text-sm font-semibold tracking-wide text-brand uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2 data-rv-item className="text-2xl leading-tight font-bold sm:text-3xl">
        {title}
      </h2>
      {support ? (
        <p data-rv-item className="mt-4 text-lg text-mute">
          {support}
        </p>
      ) : null}
    </div>
  );
}

export function IconBox({ name }: { name: string }) {
  return (
    <div className="fx-icon grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-bg text-brand">
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
    <ul data-rv-group className={cn("grid auto-rows-fr gap-4 sm:gap-5", columns === 3 ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2")}>
      {items.map((item) => (
        <li key={item.title} data-rv-item>
          {/* A entrada ao rolar fica no <li>; o cartão (hover, brilho e reflexo) é o <div>, para os dois efeitos não se atrapalharem. */}
          <div className="fx-card h-full rounded-2xl border border-line bg-surface p-6">
            <IconBox name={item.icon} />
            <h3 className={cn("mt-4 font-bold", quote ? "text-xl leading-snug text-ink" : "text-lg")}>{item.title}</h3>
            <p className="mt-2 text-mute">{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
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
    <div data-rv-group className="grid auto-rows-fr gap-5 md:grid-cols-2">
      {items.map((m, i) => (
        <div key={m.title} data-rv-item>
          <div className="fx-card flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <IconBox name={m.icon} />
            <h3 className="text-xl font-bold">{m.title}</h3>
          </div>
          <p className="mt-4 text-mute">{m.text}</p>
          <div className="fx-float mt-6 flex justify-center">{arts[i]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
