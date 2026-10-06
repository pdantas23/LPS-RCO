-- ============================================================
-- 002 — Despacho dos leads da P02 para o CRM comercial da RCO
--
-- Mesmo caminho das landing pages P04/P05 do CRM (pdantas23/COMERCIAL-RCO,
-- card "Landing Pages" em Configurações → Integrações): POST no webhook
-- /api/webhooks/leads/respondi/<token>, corpo no formato da Respondi, com as
-- respostas Nome / WhatsApp / Nicho / Faturamento. O CRM casa pelo telefone,
-- cria o negócio no funil configurado e avisa o grupo.
--
-- As LPs do CRM fazem esse POST do servidor delas. A P02 é site estático, então
-- quem faz é o próprio banco: a cada minuto (pg_cron) pega a fila
-- crm_status <> 'enviado' e envia pela extensão http, com retentativa.
--
-- A URL do webhook (o token é o segredo) fica no Vault, nunca no Git:
--   select vault.create_secret('<url>', 'crm_webhook_lp_p02_rco');
-- Sem o segredo o despacho não faz nada — a migration pode entrar antes.
--
-- Instância COMPARTILHADA: só objetos novos com sufixo _rco, revogação nome a
-- nome, nenhum trigger. Seguro de rodar mais de uma vez.
-- ============================================================

alter table public.leads_performance_rco
  add column if not exists crm_next_attempt_at timestamptz,
  add column if not exists crm_response jsonb;

-- Tentativas antes de desistir. Espera entre elas: 2, 4, 8… minutos, teto de 6 h.
create or replace function public._crm_max_tentativas_rco()
returns integer
language sql
immutable
as $$ select 12 $$;

-- Rótulos iguais aos de src/formulario/config.ts (o teste da 002 compara os dois).
-- Valor desconhecido segue como veio: nunca derruba o envio.
create or replace function public._rotulo_nicho_rco(v text, outro text)
returns text
language sql
immutable
as $$
  select case v
    when 'servicos' then 'Serviços'
    when 'comercio_varejo' then 'Comércio / varejo'
    when 'saude' then 'Saúde'
    when 'educacao' then 'Educação'
    when 'alimentacao' then 'Alimentação'
    when 'industria' then 'Indústria'
    when 'outro' then coalesce('Outro: ' || outro, 'Outro')
    else v
  end
$$;

create or replace function public._rotulo_faturamento_rco(v text)
returns text
language sql
immutable
as $$
  select case v
    when 'ate_10k' then 'Até R$ 10 mil'
    when '10k_50k' then 'De R$ 10 mil a R$ 50 mil'
    when '50k_100k' then 'De R$ 50 mil a R$ 100 mil'
    when '100k_500k' then 'De R$ 100 mil a R$ 500 mil'
    when 'acima_500k' then 'Acima de R$ 500 mil'
    else v
  end
$$;

-- Corpo no formato Respondi. respondent_id = submission_id: a chave de
-- idempotência do CRM, então reenvio nunca duplica o lead.
create or replace function public._payload_crm_lead_rco(l public.leads_performance_rco)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'form', jsonb_build_object('form_id', 'lp-p02', 'form_name', 'LP P02 · Formulário de Performance'),
    'respondent', jsonb_build_object(
      'respondent_id', l.submission_id,
      'status', 'completed',
      'answers', jsonb_strip_nulls(jsonb_build_object(
        'Nome', l.full_name,
        'WhatsApp', l.whatsapp,
        'Nicho', public._rotulo_nicho_rco(l.niche, l.niche_other),
        'Faturamento', public._rotulo_faturamento_rco(l.revenue_range),
        'utm_source', l.utm_source,
        'utm_medium', l.utm_medium,
        'utm_campaign', l.utm_campaign,
        'utm_content', l.utm_content,
        'utm_term', l.utm_term,
        'gclid', l.gclid,
        'fbclid', l.fbclid
      ))
    )
  )
$$;

-- Lê a resposta do webhook: 'enviado', 'retentar' ou 'falha' (não adianta repetir).
-- O CRM devolve 200 até quando o lead NÃO entrou (ignored), então o status HTTP não basta.
create or replace function public._classificar_resposta_crm_rco(status integer, corpo jsonb)
returns text
language sql
immutable
as $$
  select case
    when status = 200 and corpo->>'ok' = 'true'
         and (corpo ? 'contact_id' or corpo->>'duplicate' = 'true') then 'enviado'
    -- Lead registrado no CRM mas com erro depois: reenviar voltaria "duplicate" e
    -- esconderia o problema. Fica em erro para alguém olhar.
    when status = 200 and corpo->>'warning' is not null then 'falha'
    -- Corpo grande demais / JSON inválido: erro nosso, repetir dá o mesmo.
    when status in (400, 413) then 'falha'
    -- ignored (integração desligada, mapeamento errado), 404 (token), 429, 5xx,
    -- timeout: tudo isso pode se resolver sozinho ou com ajuste no CRM.
    else 'retentar'
  end
$$;

-- URL do webhook, do Vault. Nula = despacho desligado.
create or replace function public._url_webhook_crm_rco()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return (select decrypted_secret from vault.decrypted_secrets
          where name = 'crm_webhook_lp_p02_rco' limit 1);
end;
$$;

-- POST síncrono pela extensão http (schema public nesta instância).
create or replace function public._crm_http_post_rco(url text, corpo text, out status integer, out content text)
language plpgsql
set search_path = public, pg_temp
as $$
declare
  r record;
begin
  perform http_set_curlopt('CURLOPT_TIMEOUT_MS', '10000');
  select h.status, h.content into r
    from http(('POST', url, array[]::http_header[], 'application/json', corpo)::http_request) h;
  status := r.status;
  content := r.content;
end;
$$;

-- Consome a fila. Devolve quantos leads tentou enviar nesta rodada.
create or replace function public.despachar_leads_crm_rco(limite integer default 20)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text := public._url_webhook_crm_rco();
  l public.leads_performance_rco;
  v_status integer;
  v_content text;
  v_corpo jsonb;
  v_resultado text;
  v_n integer := 0;
begin
  if v_url is null then
    return 0;
  end if;

  for l in
    select * from public.leads_performance_rco
    where crm_status <> 'enviado'
      and crm_attempts < public._crm_max_tentativas_rco()
      and coalesce(crm_next_attempt_at, '-infinity') <= now()
    order by created_at
    limit limite
    for update skip locked
  loop
    v_n := v_n + 1;
    begin
      select p.status, p.content into v_status, v_content
        from public._crm_http_post_rco(v_url, public._payload_crm_lead_rco(l)::text) p;
    exception when others then
      v_status := 0;
      v_content := sqlerrm;
    end;

    begin
      v_corpo := v_content::jsonb;
    exception when others then
      v_corpo := jsonb_build_object('raw', left(coalesce(v_content, ''), 500));
    end;

    v_resultado := public._classificar_resposta_crm_rco(v_status, v_corpo);

    update public.leads_performance_rco set
      crm_attempts = crm_attempts + 1,
      crm_response = jsonb_build_object('status', v_status, 'body', v_corpo),
      crm_status = case when v_resultado = 'enviado' then 'enviado' else 'erro' end,
      crm_synced_at = case when v_resultado = 'enviado' then now() else crm_synced_at end,
      crm_last_error = case when v_resultado = 'enviado' then null
                            else left('HTTP ' || v_status || ': ' || coalesce(v_content, ''), 500) end,
      crm_next_attempt_at = case
        when v_resultado = 'retentar'
          then now() + least(power(2, crm_attempts + 1), 360) * interval '1 minute'
        else null end
    where id = l.id;

    -- 'falha' não volta para a fila: esgota as tentativas de uma vez.
    if v_resultado = 'falha' then
      update public.leads_performance_rco
        set crm_attempts = greatest(crm_attempts, public._crm_max_tentativas_rco())
        where id = l.id;
    end if;
  end loop;

  return v_n;
end;
$$;

-- Nada disso é público: só o dono (e o pg_cron, que roda como ele).
do $$
declare
  f text;
begin
  foreach f in array array[
    'public._crm_max_tentativas_rco()',
    'public._rotulo_nicho_rco(text, text)',
    'public._rotulo_faturamento_rco(text)',
    'public._payload_crm_lead_rco(public.leads_performance_rco)',
    'public._classificar_resposta_crm_rco(integer, jsonb)',
    'public._url_webhook_crm_rco()',
    'public._crm_http_post_rco(text, text)',
    'public.despachar_leads_crm_rco(integer)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('revoke execute on function %s from anon, authenticated, service_role', f);
  end loop;
end;
$$;

-- Agendamento a cada minuto. cron.schedule com o mesmo nome substitui o job.
-- (Fora do Supabase — PGlite dos testes — não há pg_cron e o bloco não faz nada.)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('despachar-leads-crm-rco', '* * * * *',
                          'select public.despachar_leads_crm_rco()');
  end if;
end;
$$;
