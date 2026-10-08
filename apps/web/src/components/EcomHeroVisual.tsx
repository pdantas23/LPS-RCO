import { BarChart3, Megaphone, MessageCircle, Package, ShoppingBag, Store } from "lucide-react";

/**
 * Ilustração do topo da /lp-ecom, feita em código com as cores da marca: uma vitrine de loja
 * online com produtos genéricos e três "fichas" do caminho anúncio, pedido e retorno.
 * Decorativa (aria-hidden) e SEM números, nomes ou resultados: nada aqui finge ser dado real.
 */
export function EcomHeroVisual() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-brand/25 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <div className="ml-3 flex h-6 flex-1 items-center gap-2 rounded-md bg-bg px-3 text-xs text-mute">
            <Store className="size-3.5" />
            <span>sualoja.com.br</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 p-4">
          {[ShoppingBag, Package, ShoppingBag, Package, ShoppingBag, Package].map((Icon, i) => (
            <div key={i} className="rounded-xl border border-line bg-bg p-2">
              <div
                className="grid aspect-square place-items-center rounded-lg"
                style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--brand) ${28 + i * 9}%, var(--bg)), var(--bg))` }}
              >
                <Icon className="size-7 text-ink/80" />
              </div>
              <div className="mt-2 h-1.5 w-4/5 rounded-full bg-line" />
              <div className="mt-1.5 h-1.5 w-2/5 rounded-full bg-brand/60" />
            </div>
          ))}
        </div>
      </div>

      <Chip className="-top-4 -left-3 sm:-left-8" icon={<Megaphone className="size-4" />} text="Anúncio no ar" />
      <Chip className="top-1/2 -right-3 sm:-right-10" icon={<ShoppingBag className="size-4" />} text="Novo pedido" ok />
      <Chip className="-bottom-4 left-4 sm:left-8" icon={<BarChart3 className="size-4" />} text="Quanto voltou" />
      <Chip className="-bottom-3 -right-2 hidden sm:flex" icon={<MessageCircle className="size-4" />} text="Cliente no WhatsApp" />
    </div>
  );
}

function Chip({ className, icon, text, ok }: { className: string; icon: React.ReactNode; text: string; ok?: boolean }) {
  return (
    <div className={`absolute flex items-center gap-2 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-semibold shadow-lg ${className}`}>
      <span className={ok ? "text-ok" : "text-brand"}>{icon}</span>
      {text}
    </div>
  );
}
