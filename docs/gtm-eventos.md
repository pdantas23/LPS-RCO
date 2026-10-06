# GTM e eventos do dataLayer: referência única das 4 LPs

Domínio único **lp.rcohub.com.br**, um container GTM para todas as páginas e **um catálogo de eventos personalizados**. O mesmo evento (ex. `generate_lead`) significa a mesma coisa em qualquer LP; o que muda é o parâmetro de origem `lp_origem`.

| Rota | `lp_origem` | `page_id` (interno) | Quem serve | Estado |
|---|---|---|---|---|
| `/` (e `/curioso`) | `form` | `P02` | `formulario/` (Vite, Aerton) | no ar |
| `/lp01` | `lp01` | `P05` | `apps/web` (Next) | no ar |
| `/lp02` | `lp02` | `P04` | `apps/web` (Next) | **desligada** (`LP02_ATIVA=false`), 404 |
| `/lp-ecom` | `lp-ecom` | `ECOM` (provisório) | reservada, sem conteúdo | **desligada** (`LP_ECOM_ATIVA=false`), 404 |

Mapa no código: `apps/web/src/content/lps.ts` (Next) e `formulario/src/lib/tracking.ts` (formulário). A P01 (LP de venda do CRM) não faz parte deste repositório.

Container: **GTM-P9XNXV2B** em todas (constante `GTM_ID` em `apps/web/src/content/site.ts` e `formulario/src/gtm.ts`; não é variável de ambiente).
Next: snippet no layout raiz (`components/tracking/Analytics.tsx`, `next/script` `beforeInteractive`) + `<noscript>` no início do `<body>`. Formulário: injetado no HTML em build pelo `vite.config.ts` (`src/gtm.ts`).

**Pixel do Meta e GA4 são configurados DENTRO do GTM.** O código não carrega Pixel (`META_PIXEL_ID` vazio) nem GA4. Scroll e tempo na página ficam por conta do GTM (gatilhos nativos).

**Nenhum dado pessoal vai ao dataLayer** em nenhuma LP (nem nome, WhatsApp ou email, nem em hash). Só categorias, ids e parâmetros de campanha. Para Conversions API/Advanced Matching use o `event_id`. Testado nas duas pilhas (vitest) e no navegador (`scripts/e2e-gtm.mjs`).

## Parâmetros em TODO evento

| Parâmetro | Valor |
|---|---|
| `lp_origem` | `form` \| `lp01` \| `lp02` \| `lp-ecom`. **Padrão por página**: use para separar as LPs no GA4/Pixel. No Next é derivado do `page_id` dentro de `track()`; no formulário é fixo. Ausente só em `page_view` de rota fora das LPs (`page_id: "other"`). |
| `page_id` | id interno: `P02`, `P05`, `P04` (os mesmos do COMERCIAL), `ECOM` provisório. |

## Eventos (catálogo único)

| Evento | Quando | Parâmetros além de `lp_origem` e `page_id` | LPs |
|---|---|---|---|
| `page_view` | Entrada na página (e navegação client-side no Next) | `page_path`; `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid` (só os presentes; o Next também `wbraid`, `gbraid`) | todas |
| `cta_click` | Clique em botão que rola ao formulário | `cta_location`, `cta_text` | lp01, lp02 (o formulário não tem CTA) |
| `form_start` | Primeiro foco/interação no formulário (1x por visita) | | todas |
| `form_submit` | Tentativa de envio (clique no botão final), válida ou não | | todas |
| `form_error` | Falha ao enviar ou validar | `error_type`: `validation` \| `server` \| `network` \| `rate_limit`; `fields` (Next, só em `validation`); `error_detail` (formulário: código original do erro) | todas |
| `generate_lead` | Envio com sucesso confirmado pelo servidor | `nicho`, `faturamento`, `event_id` | todas |
| `faq_open` | Abertura de uma pergunta do FAQ | `question`, `question_index` | lp01, lp02 |
| `video_play`, `video_progress` | Vídeo real (25/50/75/100%) | `video_provider`, `percent` | lp02 (gancho pronto, ainda sem player real) |
| `form_step` | Conclusão de cada tela do formulário de uma pergunta por tela | `step`, `step_name`, mais os campos legados abaixo | só `form` |

Campos legados do formulário (mantidos, o Aerton já os usava): `page_type` (`performance_form`, `performance_form_curious` no `/curioso`) e `form_name` (`performance`). Podem ser ignorados no GTM; `lp_origem` é a chave padrão.

Notas:
- **`event_id`**: é o mesmo id que vai ao COMERCIAL (`respondent_id` no Next; `submission_id` no formulário). Use o mesmo valor como `event_id` do Pixel e da Conversions API para o Meta deduplicar. Reenvio da mesma tentativa reaproveita o id.
- **`nicho` e `faturamento` são categorias, mas com vocabulários DIFERENTES**: no Next vão os rótulos de `apps/web/src/content/options.ts` (ex. "Odontologia", "Até R$ 30 mil por mês"); no formulário vão os códigos de `formulario/src/formulario/config.ts` (ex. `saude`, `10k_30k`). Nunca texto livre ("Outro" do formulário vai só como `outro`). Para relatório cruzado entre LPs, mapear no GA4/Looker.
- **Vídeo:** a P04/lp02 tem só um espaço reservado, que NÃO gera `video_play`/`video_progress`. O gancho está em `components/video/VideoSlot.tsx`.
- `page_view` entra na fila do `dataLayer` mesmo se o GTM ainda estiver baixando. Use **o evento personalizado `page_view`** como gatilho das tags de visualização, não o gatilho "Page View" nativo (`gtm.js`), que dispara antes de `page_id`, `lp_origem` e UTMs existirem.
- LP desligada (404) não conta `page_view` e `/api/lead` recusa lead dela.

### Diferenças encontradas no GTM do formulário (e como foram alinhadas, 06/10/2026)

| Antes (Aerton) | Agora |
|---|---|
| Sem `lp_origem` nem `page_id` | Todos os eventos levam `lp_origem: "form"` e `page_id: "P02"` |
| `page_view` só com `page_type` | + `page_path` e UTMs/click ids presentes |
| Sem `form_submit` | Novo `form_submit` na tentativa de envio final |
| `form_error.error_type` = código cru (`required`, `server_rate_limited`, `submit_timeout`...) | `error_type` no padrão (`validation`/`server`/`network`/`rate_limit`); código cru em `error_detail` |
| `generate_lead` sem `event_id`/`nicho`/`faturamento` | + `event_id` (= submission_id), `nicho`, `faturamento` (códigos de categoria) |
| `form_step`, `page_type`, `form_name` | Mantidos (`form_step` só existe no formulário) |
| Página `/curioso`: `page_view` com `page_type: performance_form_curious` | Mantido + `lp_origem`, `page_id`, `page_path` |

**Atenção para tags já existentes no container**: se houver tag/gatilho que lê `error_type` do formulário esperando o código cru, passe a ler `error_detail`.

## Variáveis de dataLayer a criar no GTM (tipo "Variável da camada de dados", versão 2)

`lp_origem`, `page_id`, `page_path`, `error_detail`, `step`, `step_name`, `form_name`, `cta_location`, `cta_text`, `error_type`, `fields`, `nicho`, `faturamento`, `event_id`, `question`, `question_index`, `video_provider`, `percent`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`.

## Gatilhos (tipo "Evento personalizado", correspondência exata)

Um por evento da tabela: `page_view`, `cta_click`, `form_start`, `form_submit`, `form_error`, `generate_lead`, `faq_open`, `video_play`, `video_progress`, `form_step`. **Não crie gatilhos por LP**: use o mesmo gatilho e separe por `lp_origem` na tag/GA4 (ex. condição extra "lp_origem igual a lp01").

## Tags sugeridas

**GA4**
- Tag de configuração/Google tag com o ID de medição, disparando no gatilho `page_view` (desligue o page_view automático da tag para não contar 2x).
- Uma tag "Evento do GA4" por gatilho, com o mesmo nome do evento e os parâmetros como variáveis acima. Marque `generate_lead` como evento-chave (conversão). Registre `lp_origem`, `page_id`, `cta_location`, `nicho`, `faturamento`, `error_type` como dimensões personalizadas se quiser filtrar por elas.

**Meta Pixel** (tag HTML personalizada ou template da comunidade, ID do Pixel como constante do GTM)
- `PageView`: `fbq('init', '<ID>'); fbq('track', 'PageView');` no gatilho `page_view`.
- `Lead`: no gatilho `generate_lead`:
  `fbq('track', 'Lead', {content_name: '{{dlv - lp_origem}}', content_category: '{{dlv - nicho}}'}, {eventID: '{{dlv - event_id}}'});`
- Opcional: `ViewContent` em `faq_open`/`cta_click` para públicos de remarketing.

**Google Ads** (se for usar): tag de conversão no gatilho `generate_lead`; `gclid` já está no `page_view`.

## Consentimento (LGPD)

O GTM carrega em toda visita, sem aviso de cookies. Antes de publicar, decidir com a RCO: banner de consentimento (CMP) com Consent Mode v2 no próprio GTM, ou aceitar o risco. Não foi implementado nada porque exige texto e decisão jurídica.

## Como testar

1. `npm run dev` (raiz; porta 3100), abrir `/`, `/lp01` (e `/lp02` se ligada) com `?utm_source=teste&gclid=abc`.
2. No console do navegador: `dataLayer` mostra os eventos na ordem.
3. Para ver dentro do GTM: Tag Assistant (tagassistant.google.com), modo preview apontando para a URL. Atenção: testar com o GTM real publica visitas de teste no GA4/Pixel se as tags estiverem ativas; use o modo Preview ou uma propriedade de teste.
4. Testes automáticos: `npm test` (raiz: `apps/web/src/lib/tracking/events.test.ts` e `src/content/lps.test.ts`; formulário: `formulario/src/lib/tracking.test.ts` e `form.test.ts`). Navegador real (Chrome headless, com `npm run dev` no ar): `node scripts/e2e-gtm.mjs` (`--lp02` se ligada; `--prod` contra a imagem Docker).
