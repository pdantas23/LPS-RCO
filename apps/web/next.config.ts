import path from "node:path";
import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança básicos. SEM Content-Security-Policy por enquanto:
 * GTM, Pixel e o player de vídeo (Panda/Vimeo) ainda não foram escolhidos, e
 * a CSP certa depende deles. Definir a CSP junto com a publicação.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

/**
 * "/" e "/curioso" são do formulário (formulario/, projeto Vite do Aerton, P02), não do app Next.
 * Build de produção: o build estático fica em public/_form (npm run build:form) e a raiz é reescrita
 * para ele; o endereço no navegador continua "/". Dev (npm run dev na raiz): FORM_DEV_URL aponta para
 * o servidor Vite do formulário (a API local PGlite dele atende /__dev).
 */
const FORM_DEV_URL = (process.env.FORM_DEV_URL ?? "").replace(/\/+$/, "");
const formRewrites = FORM_DEV_URL
  ? [
      { source: "/", destination: `${FORM_DEV_URL}/_form/formulario/index.html` },
      { source: "/curioso", destination: `${FORM_DEV_URL}/_form/formulario/curioso/index.html` },
      { source: "/_form/:path*", destination: `${FORM_DEV_URL}/_form/:path*` },
      { source: "/__dev/:path*", destination: `${FORM_DEV_URL}/__dev/:path*` },
    ]
  : [
      { source: "/", destination: "/_form/formulario/index.html" },
      { source: "/curioso", destination: "/_form/formulario/curioso/index.html" },
    ];

const nextConfig: NextConfig = {
  // Imagem enxuta para o Docker (usado na publicação, que fica pro fim).
  output: "standalone",
  // Monorepo: o rastreamento do standalone precisa enxergar packages/*.
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  transpilePackages: ["@rco/lead-core"],
  poweredByHeader: false,
  // Só vale em `next dev`: sem isso, o Next bloqueia os recursos internos
  // (o que liga o JavaScript da página, incluindo o HMR) quando o acesso
  // vem de um IP da rede local em vez de "localhost" — testar pelo celular
  // carregava a página, mas nenhum efeito de JavaScript rodava (nem o
  // carrossel da seção 2, nem as linhas do diagrama). Rede doméstica/do
  // escritório do usuário, IP pode mudar se o roteador reatribuir — se
  // parar de funcionar de novo, é só o IP ter mudado, atualiza aqui.
  allowedDevOrigins: ["192.168.1.20"],
  // Link antigo do formulário (serviço rco-lp, até 07/10/2026) apontava para /formulario/.
  async redirects() {
    return [
      { source: "/formulario", destination: "/", permanent: true },
      { source: "/formulario/curioso", destination: "/curioso", permanent: true },
      { source: "/formulario/:path*", destination: "/", permanent: true },
    ];
  },
  async rewrites() {
    return { beforeFiles: formRewrites, afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Arquivos do formulário têm hash no nome: cache longo. O HTML nunca fica em cache (deploy novo aparece).
      { source: "/_form/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, immutable" }] },
      { source: "/_form/:path*.html", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
    ];
  },
};

export default nextConfig;
