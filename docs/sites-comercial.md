# /sites → COMERCIAL-RCO: o que precisa existir lá

Material para preparar o SQL e o código do COMERCIAL-RCO (aprovação do Philip antes de aplicar). Nada aqui foi feito no COMERCIAL. Fonte: briefing do Luis "LP Portfólio de Sites da RCO" v2.2 (`docs/briefings/lp-sites-v2.2.pdf`, bloco 10) e o código desta LP (`apps/web/src/content/captura/sites.ts`, `apps/web/src/lib/captura/payload.ts`). Um teste (`apps/web/src/lib/captura/captura.test.ts`) confere que todo rótulo usado no código aparece neste documento.

## Como o lead chega

Igual à P04, à P05 e à /lp-ecom: o servidor da LP grava o lead na fila (arquivo, volume `/data/outbox`) e entrega por

```
POST {COMERCIAL_BASE_URL}/api/webhooks/leads/respondi/<COMERCIAL_LEAD_TOKEN_SITES>
```

com o corpo no formato da Respondi:

```json
{
  "form": { "form_id": "lp-sites", "form_name": "LP Sites" },
  "respondent": {
    "respondent_id": "<uuid único por envio>",
    "status": "completed",
    "answers": { "Nome": "...", "WhatsApp": "55869...", "...": "..." }
  }
}
```

- `respondent_id`: um UUID por tentativa de envio (reenvio da mesma tentativa usa o mesmo id; é a chave de idempotência do COMERCIAL).
- Valor vazio não é enviado (a chave some). Campos das telas ramificadas chegam vazios (ausentes) para quem é de outro ramo, e isso é normal (bloco 7).
- `WhatsApp` sempre presente, só dígitos com DDI 55 (ex.: `5586999991234`).
- Sem `COMERCIAL_LEAD_TOKEN_SITES` no EasyPanel, os leads ficam **pendentes** na fila e saem sozinhos quando o token entrar (mesmo comportamento das outras LPs). Variável sem `NEXT_PUBLIC_`.

## O que criar no COMERCIAL

1. **Integração Respondi** nova, para o formulário `lp-sites` ("LP Sites"). O token dela vira `COMERCIAL_LEAD_TOKEN_SITES` no serviço das LPs.
2. **Origem nova `sites`** na aba Leads (mesmo ajuste feito para `p04` e `p05`: `lead_source` nativo, ou `lead_source_override` na integração, como foi na migration 119).
3. **Campos personalizados** abaixo, com o rótulo EXATO (é a chave em `answers`). Todos texto.
4. **Mapeamento** de cada pergunta da integração para o campo de mesmo nome.
5. **Aviso no grupo do comercial** com os campos da seção "Aviso no grupo".

## Mapeamento pergunta → campo

| Tela (quiz) | Rótulo no card | Versões | Campo no COMERCIAL (chave em `answers`) | Valores |
|---|---|---|---|---|
| Qual seu nome? | Nome | todas | `Nome` | texto livre (2 a 120 caracteres) |
| Qual seu WhatsApp? | WhatsApp | todas | `WhatsApp` | dígitos com 55 |
| Qual email você mais usa? | (não existe no card) | só quiz_longo, opcional | `Email` | e-mail, minúsculo; ausente se a pessoa pulou |
| Qual o @ da sua empresa? | @ da empresa no Instagram | todas | `Instagram` | `@usuario`, minúsculo, normalizado (aceita URL do perfil) |
| (controle) | | todas | `Página de origem` | `SITES` |
| (controle) | | todas | `Versão da captura` | `quiz_curto`, `quiz_longo` ou `card` |
| Qual o tipo do seu negócio? | Tipo de negócio | todas | `Tipo de negócio` | Clínica ou saúde, Escritório de advocacia, Loja física ou e-commerce, Prestador de serviço local, Infoproduto ou lançamento, Outro |
| O que você precisa agora? | O que você precisa | todas | `Necessidade` | Site institucional, Página de captura de leads, Página de lançamento, Loja virtual, Não sei, quero orientação |
| Você já tem site? | | só quiz_longo | `Já tem site` | Não tenho, Tenho e quero refazer, Tenho e quero melhorar |
| Já tem oferta e anúncio prontos pra rodar? | | quiz_longo, só "Página de captura de leads" | `Oferta e anúncio` | Sim, tudo pronto, Tenho a oferta, falta o anúncio, Nada ainda |
| Quantos produtos, mais ou menos? | | quiz_longo, só "Loja virtual" | `Quantidade de produtos` | Até 20, De 20 a 100, Mais de 100 |
| Qual o seu momento? | | quiz_longo, só "Página de lançamento" | `Momento do lançamento` | Lançamento marcado, Construindo audiência, Primeira vez lançando |
| O que mais te atrapalha hoje nessa parte de site? | Maior desafio hoje | todas | `Desafio` | as 6 opções do bloco 6 |
| Já investiu em anúncios online? | Anúncios online | todas | `Anúncio` | Nunca fiz anúncios, Já fiz anúncios por conta própria, Um amigo ou parente fez alguns anúncios pra mim, Já contratei uma agência no passado, Estou com uma agência ou gestor agora |
| Pra quando você precisa do site no ar? | Prazo | todas | `Prazo` | Pra ontem, o quanto antes, Até 30 dias, De 1 a 3 meses, Sem pressa |
| Quanto sua empresa fatura por mês? | Faturamento mensal | todas | `Faturamento` | as 11 faixas padrão da RCO |
| Quantos funcionários tem na sua empresa? | | só quiz_longo | `Funcionários` | Somente eu, De 2 a 3, De 4 a 8, De 9 a 15, Acima de 16 funcionários |
| (calculado no servidor da LP) | | todas | `Perfil` | `A`, `B`, `C` ou `D` (regra do bloco 8) |
| (URL de entrada) | | todas, quando houver | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `wbraid`, `gbraid` | texto |

Os valores das opções vão como o texto literal da opção (não código). As três respostas de ramo usam nomes de campo propostos aqui (`Oferta e anúncio`, `Quantidade de produtos`, `Momento do lançamento`): o briefing só diz "respostas de ramo". `Instagram` não está na lista do bloco 10, mas a pergunta existe nos dois formatos e o próprio texto dela diz que o perfil é analisado antes da conversa; vai como campo próprio (confirmar com o Luis).

### Perfil (para conferência do lado de lá)

Soma de 3 notas. Faturamento: 2 de R$ 50.000 pra cima; 1 de R$ 10.000 até R$ 50.000 ou "Zero (Empresa nova. Mas tenho capital para investir)"; 0 abaixo de R$ 10.000 ou "Zero (Empresa nova)". Anúncio: 2 "Estou com uma agência ou gestor agora"; 1 por conta própria, amigo ou parente, agência no passado; 0 nunca. Prazo: 2 pra ontem; 1 até 30 dias; 0 de 1 a 3 meses ou sem pressa. A = 5 ou 6, B = 3 ou 4, C = 2, D = 0 ou 1. O COMERCIAL não precisa recalcular: recebe pronto em `Perfil`.

## Aviso no grupo do comercial

Mostrar só: **Nome, Telefone, Tipo de negócio, Necessidade, Faturamento, Prazo e Perfil** (campos `Nome`, `WhatsApp`, `Tipo de negócio`, `Necessidade`, `Faturamento`, `Prazo`, `Perfil`). UTMs, `gclid` e `fbclid` ficam só no cadastro do contato, nunca no aviso. Sugestão de ordem: Perfil em destaque no topo (o comercial liga primeiro para o A).

## Deduplicação e segurança

- Mesmo telefone na mesma página em 10 minutos é tratado como a mesma pessoa pela LP (não cria segundo envio). Mesmo `respondent_id` é idempotente no COMERCIAL.
- Limite por IP (10 em 10 min) e por telefone (3 em 10 min) no `/api/lead`, iguais às outras LPs.
- Hoje o segredo do webhook ainda é igual ao do CRM-RCO (pendência já registrada para as P04/P05); vale o mesmo aqui.
