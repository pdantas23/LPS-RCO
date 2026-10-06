/**
 * GTM do formulário (mesmo container da Bio e da LP do CRM), injetado no HTML em build pelo vite.config.
 * Vazio = GTM não é carregado; o dataLayer continua recebendo os eventos (src/lib/tracking.ts).
 */
export const GTM_ID = "GTM-P9XNXV2B";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Vai no fim do <head>. */
export function renderGtm(id = GTM_ID): string {
  if (!id) return "";
  return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${esc(id)}');</script>`;
}

/** Vai logo após o <body>. */
export function renderGtmNoscript(id = GTM_ID): string {
  if (!id) return "";
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${esc(id)}" height="0" width="0" style="display:none;visibility:hidden" title="GTM"></iframe></noscript>`;
}
