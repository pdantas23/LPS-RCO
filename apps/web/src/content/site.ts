// ============================================================
// Configuração do SITE que não é segredo e muda com o conteúdo final.
// Fica em código (não em variável de ambiente) de propósito: o EasyPanel
// repassa toda variável como build-arg, e valores embutidos no build
// (metadata, NEXT_PUBLIC_*) só valem se o Dockerfile declarar cada um. Uma
// constante versionada não tem esse risco e o histórico do git mostra quando mudou.
// ============================================================

/** Enquanto o texto for de exemplo, NÃO indexar nos buscadores. Mude para true junto do conteúdo final. */
export const ALLOW_INDEXING = false;

/** Faixa "Conteúdo de exemplo" no canto da tela. Desligar junto do conteúdo final. */
export const SHOW_PLACEHOLDER_BADGE = true;

// ---- Rotas do domínio único (lp.rcohub.com.br) ----
// Cada rota tem UMA chave. Desligada = a rota existe (código pronto), mas responde 404
// (sem conteúdo, sem formulário, sem GTM de evento, sem aceitar lead em /api/lead).
// Para ligar: troque para true, rode os testes e publique. Mapa completo em content/lps.ts.

/** /lp01 = P05 (Performance sem VSL). */
export const LP01_ATIVA = true;
/** /lp02 = P04 (Performance com VSL). Fora do ar por decisão do Philip (06/10): a rota está pronta, mas desligada. */
export const LP02_ATIVA = false;
/** /lp-ecom = LP de e-commerce, ainda não existe: rota reservada, sem conteúdo. */
export const LP_ECOM_ATIVA = false;

/** Container do Google Tag Manager. Vazio = GTM não é carregado. Constante (não env) de propósito: ver o topo do arquivo. */
export const GTM_ID = "GTM-P9XNXV2B";

/** DEIXE VAZIO. O Pixel do Meta é configurado dentro do GTM (docs/gtm-eventos.md); preencher aqui o carregaria duas vezes. */
export const META_PIXEL_ID = "";

/**
 * Logo do hero. O mesmo arquivo do COMERCIAL-RCO/CRM (`public/rco-icon.png`
 * lá, copiado pra cá como `public/rco-logo.png` — troque o arquivo se o CRM
 * atualizar o logo). Ver `components/Logo.tsx`.
 */
export const LOGO = { src: "/rco-logo.png", alt: "RCO", width: 256, height: 245 };
