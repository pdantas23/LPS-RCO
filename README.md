# RCO · landing pages (lp.rcohub.com.br)

Monorepo das landing pages da RCO Hub, servidas num **domínio único** por **um único serviço/imagem**.

| Rota | O que é | Estado | Lead vai para o COMERCIAL como |
|---|---|---|---|
| `/` (e `/curioso`) | Formulário P02 (`formulario/`, Vite, do Aerton) | no ar | origem **p02** (ver abaixo) |
| `/lp01` | P05, Performance sem VSL (`apps/web`, Next) | no ar | origem **p05** (token `P05`) |
| `/lp02` | P04, Performance com VSL (`apps/web`) | **desligada** (404), rota pronta | origem **p04** (token `P04`) |
| `/lp-ecom` | LP de e-commerce | **reservada**, sem conteúdo, desligada (404) | ainda não existe |

Fora do domínio: `lp-crm/` (P01 "CRM", Vite, do Aerton). Não entra na imagem nem no `npm run build`.

> Estado: publicação (DNS, EasyPanel, HTTPS) ainda NÃO feita. Veja `docs/fluxo-e-operacao.md`.

## Arquitetura

Um processo Node só (o app Next). O formulário do Aerton continua um projeto Vite **independente** (`formulario/`, com seu próprio `package.json`), mas é compilado com base `/_form/` e copiado para `apps/web/public/_form`; `next.config.ts` reescreve `/` e `/curioso` para esse build estático (o endereço no navegador não muda). Por que assim: sem nginx na frente, sem dois processos no contêiner, sem proxy interno; o outbox de leads, o `/api/lead` e os cabeçalhos de segurança ficam num lugar só. O `Dockerfile` e o `nginx.conf` do Aerton em `formulario/` ficam intactos (uso standalone), mas o deploy usa o `Dockerfile` da raiz.

```
apps/web/                 Next 16 (App Router, Tailwind 4). Serve /lp01, /lp02, /lp-ecom, /api/*
  src/content/site.ts       FLAGS das rotas (LP01_ATIVA, LP02_ATIVA, LP_ECOM_ATIVA), indexação, GTM
  src/content/lps.ts        mapa das 4 LPs: rota, lp_origem, page_id interno, ativa?
  src/content/pages.ts      TEXTO das páginas P04/P05 (tudo de exemplo)
  src/lib/tracking/         dataLayer (catálogo único; docs/gtm-eventos.md)
formulario/               Vite (P02). Build com base /_form/ vai para apps/web/public/_form
lp-crm/                   Vite (P01). FORA do domínio e da imagem
packages/lead-core/       lógica sem Next: telefone, validação, payload do COMERCIAL, fila em arquivos
scripts/dev.mjs           um comando para ver tudo junto
scripts/build-form.mjs    build do formulário + cópia para apps/web/public/_form
scripts/e2e-gtm.mjs       teste do dataLayer em Chrome headless
Dockerfile                imagem única (formulário + Next)
```

## Para onde cada página manda o lead

- **`/lp01` (P05) e `/lp02` (P04):** o servidor da LP (`/api/lead`) grava o lead em fila de arquivos e entrega ao COMERCIAL por `POST {COMERCIAL_BASE_URL}/api/webhooks/leads/respondi/<token>`, com `Página de origem` = `P05`/`P04` e token `COMERCIAL_LEAD_TOKEN_P05`/`_P04`. **A rota nova não muda isso**: o vínculo usa o id interno (`formId` `lp-p05`/`lp-p04`), não o caminho.
- **`/` (P02):** o navegador chama direto o Supabase da RCO (`sb.rcoacademy.com.br`, RPC `capturar_lead_performance_rco`, chave ANÔNIMA). O próprio banco (migration `formulario/supabase/migrations/002`, pg_cron a cada minuto) reenvia ao webhook Respondi do COMERCIAL (`form_id` `lp-p02`); a URL do webhook, com o token, fica no Vault do banco. Esse caminho **não passa pelo servidor Next nem pelo outbox**. Qual "origem" o COMERCIAL grava para esse token depende de como a integração foi cadastrada lá (não está neste repositório: conferir no COMERCIAL).

## Flags (ligar e desligar rotas)

Em `apps/web/src/content/site.ts` (constantes em código, de propósito: o EasyPanel repassa toda env como build-arg):

```ts
export const LP01_ATIVA = true;       // /lp01
export const LP02_ATIVA = false;      // /lp02: para ligar, troque para true
export const LP_ECOM_ATIVA = false;   // /lp-ecom: reservada
```

Desligada = **404** (sem conteúdo, sem contar visita no dataLayer, e `POST /api/lead` recusa lead dessa página com 404 `page_inactive`). Escolhi 404 e não redirecionar para `/` para não mandar tráfego de anúncio para outro formulário sem ninguém ter decidido isso, e para a rota não aparecer no Google. Todas as páginas saem com `noindex` enquanto `ALLOW_INDEXING=false` (mesmo arquivo). Para ligar a `/lp02`: troque a flag, `npm test` (o teste `lps.test.ts` guarda o estado entregue e vai pedir a atualização), publique. `/p04` e `/p05` antigos foram removidos (nunca estiveram no ar).

## Rodar localmente (tudo junto)

```bash
npm install
npm ci --prefix formulario                       # dependências do formulário (projeto à parte)
cp apps/web/.env.example apps/web/.env.local     # COMERCIAL_BASE_URL e tokens (só para /lp01 e /lp02)
npm run dev                                      # http://localhost:3100
```

`/` = formulário (com banco simulado PGlite, nada vai ao Supabase real), `/lp01`, `/lp02` e `/lp-ecom` (404 enquanto desligadas). Testes: `npm test` (raiz + formulário), `npm run typecheck`, `npm run lint`, `npm run build`; navegador: `npm i --no-save playwright-core && node scripts/e2e-gtm.mjs`.

**Cuidado com o alvo.** `COMERCIAL_BASE_URL` de produção cria contato e negócio de verdade e manda mensagem no grupo comercial de verdade. Para desenvolver, aponte para um COMERCIAL de demonstração (banco descartável).

## Publicar no EasyPanel (nada disso foi feito ainda)

Um serviço "App" por **Dockerfile** na raiz, contexto = raiz do repositório, porta do contêiner **3000**.

| Tipo | Nome | Valor |
|---|---|---|
| Build arg (EasyPanel já repassa toda env como build-arg) | `VITE_SUPABASE_URL` | `https://sb.rcoacademy.com.br` |
| Build arg | `VITE_SUPABASE_ANON_KEY` | chave ANÔNIMA (pública por natureza; só alcança a RPC de captação). O build **falha** sem as duas. |
| Env de runtime | `COMERCIAL_BASE_URL` | `https://comercial.rcoacademy.com.br` |
| Env de runtime | `COMERCIAL_LEAD_TOKEN_P05` | token da integração da LP05 (atenção: valor atual de produção ainda a decidir) |
| Env de runtime | `COMERCIAL_LEAD_TOKEN_P04` | token da LP04 (pode ficar vazio enquanto a `/lp02` estiver desligada) |
| Env de runtime (opcional) | `LEAD_OUTBOX_DIR` | já `/data/outbox` na imagem |
| Env de runtime (opcional) | `LEAD_ALLOWED_ORIGINS`, `OUTBOX_SENT_RETENTION_DAYS` | ver `docs/fluxo-e-operacao.md` |
| **Volume** | montar em `/data` | fila de leads. Sem ele, reinício apaga lead pendente |

Nunca declare token como `ARG`/`NEXT_PUBLIC_`/`VITE_`. Health: `GET /api/health`. Domínio: `lp.rcohub.com.br` apontando para o serviço (HTTPS pelo Traefik do EasyPanel). A imagem foi construída e testada localmente (rotas, headers, outbox em volume sobrevivendo a restart), sem publicar.

### DNS (não alterado)

`lp.rcohub.com.br` precisa de um registro **A** para a VPS **179.197.237.118** (onde roda o EasyPanel/Traefik), no DNS do domínio `rcohub.com.br`. O certificado HTTPS é emitido pelo EasyPanel depois que o domínio estiver apontado e cadastrado no serviço. Não é preciso DNS para `/lp01`, `/lp02`, `/lp-ecom` (são caminhos do mesmo host).

## Como mudar as coisas

| Quero... | Onde |
|---|---|
| Trocar textos, títulos, FAQ, passos | `src/content/pages.ts` |
| Mudar as opções de Nicho / Faturamento | `src/content/options.ts` (o servidor só aceita o que está lá) |
| Mudar cores e identidade visual | bloco `:root` em `src/app/globals.css` |
| GTM / eventos | `GTM_ID` em `src/content/site.ts`; eventos em `docs/gtm-eventos.md`. `META_PIXEL_ID` fica vazio (Pixel vai no GTM) |
| Liberar indexação / tirar a faixa "Conteúdo de exemplo" | `ALLOW_INDEXING` e `SHOW_PLACEHOLDER_BADGE` em `site.ts` |
| Colocar o vídeo real da P04 | ver abaixo |
| Criar uma página nova (P01, P02...) | novo item em `PAGES` e em `PAGE_IDS`, uma pasta em `src/app/<rota>/page.tsx` (copie a `lp01`), uma linha em `content/lps.ts` e uma flag em `site.ts`, e um token `COMERCIAL_LEAD_TOKEN_<ID>` |

`site.ts` é código, e não variável de ambiente, de propósito: o EasyPanel repassa toda
variável como build-arg, e valor embutido no build só vale se o Dockerfile o declarar.

### Trocar o vídeo da P04

A página só conhece `VideoSource` (`components/video/types.ts`); quem desenha o player é
um adaptador por `kind`. Hoje: `placeholder` (caixa com botão de play) e `embed` (iframe
genérico, só https).

- Provedor que dá URL de iframe (Panda, Vimeo, YouTube): em `pages.ts`, troque
  `source: { kind: "placeholder", ... }` por `{ kind: "embed", url: "https://...", title: "..." }`.
- Provedor com SDK (para saber o progresso e revelar o formulário no meio do vídeo): crie
  `components/video/<Provedor>Player.tsx`, adicione o `kind` em `types.ts` e registre em
  `VideoSlot.tsx`. O tipo obriga a registrar; nenhuma seção da página muda.

## O que já está garantido (e testado)

- O lead é **gravado em disco antes** de falar com o COMERCIAL; a pessoa nunca vê erro dele.
- COMERCIAL fora do ar: o lead fica pendente, sobrevive a reinício do servidor da LP e é
  reenviado, **uma vez só**.
- Reenvio, duplo clique e "recarreguei e mandei de novo" não duplicam contato, negócio nem aviso.
- O token do COMERCIAL só existe no servidor (variável sem `NEXT_PUBLIC_`).
- O aviso no grupo não leva UTM, gclid nem fbclid; esses dados ficam só no cadastro do contato.
