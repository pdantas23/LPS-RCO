// Link do Instagram da RCO Hub, primeiro item do rodapé de todas as LPs do app Next (/lp01, /lp02, /lp-ecom).
// Um componente só: troque a URL ou o @ aqui e vale em todas. Ícone do Instagram em contorno (uma cor, herda a cor do
// texto do rodapé) mais "@rcohub" ao lado; SVG inline, sem imagem externa. Hover igual ao dos outros links do rodapé
// (sublinhado e text-ink). Sem evento de dataLayer: os links do rodapé não rastreiam clique.

export const INSTAGRAM_URL = "https://www.instagram.com/rcohub/";
export const INSTAGRAM_HANDLE = "@rcohub";

export function InstagramLink() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram da RCO Hub"
      className="group mx-auto mb-2 flex min-h-11 w-fit items-center gap-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.125rem] shrink-0 fill-none stroke-current" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </svg>
      <span className="underline underline-offset-2">{INSTAGRAM_HANDLE}</span>
    </a>
  );
}
