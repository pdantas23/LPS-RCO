import { EcomIcon } from "./EcomIcon";

/**
 * Elemento gráfico discreto do hero: linhas finas ligando os ícones de anúncio, produto, carrinho e pedido,
 * ao fundo e em baixa opacidade. Só decoração (aria-hidden), sem números nem nomes.
 */
export function EcomHeroGraphic({ className = "" }: { className?: string }) {
  const nodes = [
    { icon: "megaphone", left: "6%", top: "78%" },
    { icon: "store", left: "34%", top: "90%" },
    { icon: "shopping-cart", left: "64%", top: "84%" },
    { icon: "package-check", left: "92%", top: "92%" },
  ];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden opacity-25 ${className}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none">
        <path d="M6 78 C 20 70, 26 94, 34 90 S 54 70, 64 84 S 84 98, 92 92" stroke="var(--brand)" strokeWidth="0.25" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1 }} />
      </svg>
      {nodes.map((n) => (
        <span key={n.icon} className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg text-brand" style={{ left: n.left, top: n.top }}>
          <EcomIcon name={n.icon} className="size-4" />
        </span>
      ))}
    </div>
  );
}
