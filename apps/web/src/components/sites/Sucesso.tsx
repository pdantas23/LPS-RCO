import { CAPTURA_TEXTOS } from "@/content/captura/sites";

/** Confirmação final (quiz e card): o time chama no WhatsApp. Igual para todo perfil (o perfil nunca aparece). */
export function Sucesso({ className = "" }: { className?: string }) {
  const S = CAPTURA_TEXTOS.sucesso;
  return (
    <div role="status" className={`text-center ${className}`}>
      <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-ok/15 text-ok">
        <svg viewBox="0 0 24 24" className="size-8 fill-none stroke-current" strokeWidth="2.5" aria-hidden="true">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 tabIndex={-1} className="text-2xl font-bold sm:text-3xl">
        {S.titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-mute">{S.texto}</p>
    </div>
  );
}
