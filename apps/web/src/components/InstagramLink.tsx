import { useId } from "react";

// Link do Instagram da RCO Hub, primeiro item do rodapé de todas as LPs do app Next (/lp01, /lp02, /lp-ecom).
// Um componente só: troque a URL ou o @ aqui e vale em todas. Ícone do Instagram em contorno, com o traço no gradiente
// do Instagram (amarelo/laranja embaixo à esquerda, rosa, roxo em cima à direita), mais "@rcohub" na cor do rodapé; SVG inline, sem imagem externa. Sem sublinhado (nem parado nem no hover);
// o hover só muda a cor do texto (text-ink) e o foco do teclado mostra um outline. Sem evento de dataLayer: os links do rodapé não rastreiam clique.

export const INSTAGRAM_URL = "https://www.instagram.com/rcohub/";
export const INSTAGRAM_HANDLE = "@rcohub";

export function InstagramLink() {
  // id único por instância: o componente pode aparecer mais de uma vez e ids repetidos de gradiente colidem.
  const gradId = `rco-ig-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram da RCO Hub"
      className="group mx-auto mb-2 flex min-h-11 w-fit items-center gap-2 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.125rem] shrink-0 fill-none" stroke={`url(#${gradId})`} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="3" y1="21" x2="21" y2="3">
            <stop offset="0" stopColor="#feda77" />
            <stop offset="0.25" stopColor="#f58529" />
            <stop offset="0.5" stopColor="#dd2a7b" />
            <stop offset="0.8" stopColor="#8134af" />
            <stop offset="1" stopColor="#6a5be8" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.7" fill={`url(#${gradId})`} />
      </svg>
      <span>{INSTAGRAM_HANDLE}</span>
    </a>
  );
}
