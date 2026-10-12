// Link do Instagram da RCO Hub, primeiro item do rodapé de todas as LPs do app Next (/lp01, /lp02, /lp-ecom).
// Um componente só: troque a URL aqui e vale em todas. O glifo é o do Instagram (quadrado arredondado com gradiente e
// câmera em branco), em SVG inline, sem imagem externa. Sem evento de dataLayer: os links do rodapé não rastreiam clique.

export const INSTAGRAM_URL = "https://www.instagram.com/rcohub/";

export function InstagramLink() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram da RCO Hub"
      className="mx-auto mb-3 grid size-11 place-items-center rounded-xl transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8">
        <defs>
          <radialGradient id="rco-ig-gradient" cx="0.3" cy="1.07" r="1.5" gradientUnits="objectBoundingBox">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.05" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.6" stopColor="#d6249f" />
            <stop offset="0.9" stopColor="#285aeb" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6.5" fill="url(#rco-ig-gradient)" />
        <rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="16.6" cy="7.4" r="1.05" fill="#fff" />
      </svg>
    </a>
  );
}
