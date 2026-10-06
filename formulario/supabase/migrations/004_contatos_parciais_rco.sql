-- ============================================================
-- 004 — Contato parcial da P02: quem começa e não termina também vira contato
--
-- A partir da pergunta do WhatsApp, o site salva o que a pessoa já respondeu em
-- leads_parciais_performance_rco (uma linha por submission_id, atualizada a cada tela).
-- Se ela ficar 30 minutos sem terminar, o banco manda o contato para uma 2ª integração
-- do card Landing Pages do CRM ("LP P02 · Não terminou", origem p02_incompleto, funil
-- SDR): o cartão do negócio mostra o selo "P02 · não terminou" e o comercial/IA entra
-- em contato. A URL dela (com o token) fica no Vault:
--   select vault.create_secret('<url>', 'crm_webhook_lp_p02_incompleto_rco');
-- Sem o segredo o despacho de parciais não faz nada.
--
-- Nunca duplica com o lead completo: se existir lead completo com o mesmo
-- submission_id, ou com o mesmo WhatsApp a partir do início do parcial, o parcial
-- é descartado em vez de enviado. Se a pessoa terminar DEPOIS do envio do parcial,
-- o CRM casa pelo telefone (mesmo contato) e o completo chega como novo envio.
--
-- Instância COMPARTILHADA: só objetos novos com sufixo _rco, revogação nome a nome,
-- nenhum trigger. Seguro de rodar mais de uma vez.
-- ============================================================

create table if not exists public.leads_parciais_performance_rco (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,
  -- Chave de idempotência no CRM, diferente do submission_id: se a pessoa terminar
  -- depois, o lead completo não pode ser confundido com o parcial ("duplicate").
  respondent_id uuid not null default gen_random_uuid(),

  whatsapp text not null check (whatsapp ~ '^55[1-9][0-9]9?[0-9]{8}$'),
  full_name text,
  email text,
  instagram text,
  employees text,
  niche text,
  niche_other text,
  partner text,
  sales_challenge text,
  urgency text,
  ads_experience text,
  revenue_range text,
  /** Última tela concluída (id da tela no config.ts). */
  last_step text,
  saves integer not null default 1,

  source_page text,
  conversion_page text,
  landing_page_version text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 'descartado' = a pessoa terminou o formulário; o lead completo já cuida do contato.
  crm_status text not null default 'pendente' check (crm_status in ('pendente', 'enviado', 'erro', 'descartado')),
  crm_attempts integer not null default 0,
  crm_last_error text,
  crm_next_attempt_at timestamptz,
  crm_response jsonb,
  crm_synced_at timestamptz
);

create index if not exists leads_parciais_performance_rco_fila_idx
  on public.leads_parciais_performance_rco (updated_at) where crm_status in ('pendente', 'erro');
create index if not exists leads_parciais_performance_rco_whatsapp_idx
  on public.leads_parciais_performance_rco (whatsapp, created_at desc);

alter table public.leads_parciais_performance_rco enable row level security;
revoke all on table public.leads_parciais_performance_rco from public;
revoke all on table public.leads_parciais_performance_rco from anon, authenticated;

-- Tempo sem resposta até o parcial ser considerado abandono.
create or replace function public._parcial_espera_rco()
returns interval
language sql
immutable
as $$ select interval '30 minutes' $$;

-- Código de opção (a-z, 0-9, _) ou null: resposta parcial estranha nunca derruba o salvamento.
create or replace function public._opcao_rco(v text)
returns text
language sql
immutable
as $$
  select case when btrim(coalesce(v, '')) ~ '^[a-z0-9_]{1,40}$' then btrim(v) end
$$;

/*
 * Chamada pelo site (anon) a cada tela concluída a partir do WhatsApp. Grava o que já foi
 * respondido; só o WhatsApp é obrigatório. Respostas inválidas viram null em vez de recusar.
 */
create or replace function public.salvar_parcial_performance_rco(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission uuid;
  v_whatsapp text;
  v_nome text;
  v_email text;
  v_instagram text;
  v_nicho text;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  if coalesce(btrim(payload->>'website'), '') <> '' then
    return jsonb_build_object('ok', false, 'error', 'rejected');
  end if;

  begin
    v_submission := (payload->>'submission_id')::uuid;
  exception when others then
    v_submission := null;
  end;
  if v_submission is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_submission_id');
  end if;

  -- Já terminou: o lead completo manda; o parcial não é mais necessário.
  if exists (select 1 from leads_performance_rco where submission_id = v_submission) then
    return jsonb_build_object('ok', true, 'ignored', 'completed');
  end if;

  v_whatsapp := regexp_replace(coalesce(payload->>'whatsapp', ''), '\D', '', 'g');
  if char_length(v_whatsapp) in (10, 11) then
    v_whatsapp := '55' || v_whatsapp;
  end if;
  if v_whatsapp !~ '^55[1-9][0-9]9?[0-9]{8}$'
     or (char_length(v_whatsapp) = 13 and substr(v_whatsapp, 5, 1) <> '9') then
    return jsonb_build_object('ok', false, 'error', 'invalid_whatsapp');
  end if;

  v_nome := nullif(left(regexp_replace(btrim(coalesce(payload->>'full_name', '')), '\s+', ' ', 'g'), 120), '');
  v_email := btrim(coalesce(payload->>'email', ''));
  if char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    v_email := null;
  end if;
  v_instagram := lower(btrim(coalesce(payload->>'instagram', '')));
  if v_instagram !~ '^@[a-z0-9._]{1,30}$' then
    v_instagram := null;
  end if;
  v_nicho := _opcao_rco(payload->>'niche');

  -- Freio: no máximo 5 jornadas parciais novas do mesmo número em 10 minutos.
  if not exists (select 1 from leads_parciais_performance_rco where submission_id = v_submission)
     and (select count(*) from leads_parciais_performance_rco
          where whatsapp = v_whatsapp and created_at > now() - interval '10 minutes') >= 5 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into leads_parciais_performance_rco as p (
    submission_id, whatsapp, full_name, email, instagram, employees, niche, niche_other,
    partner, sales_challenge, urgency, ads_experience, revenue_range, last_step,
    source_page, conversion_page, landing_page_version,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid
  ) values (
    v_submission, v_whatsapp, v_nome, v_email, v_instagram,
    _opcao_rco(payload->>'employees'),
    v_nicho,
    case when v_nicho = 'outro' then _texto_opcional_rco(payload->>'niche_other', 80) end,
    _texto_opcional_rco(regexp_replace(coalesce(payload->>'partner', ''), '\s+', ' ', 'g'), 200),
    _opcao_rco(payload->>'sales_challenge'),
    _opcao_rco(payload->>'urgency'),
    _opcao_rco(payload->>'ads_experience'),
    _opcao_rco(payload->>'revenue_range'),
    _opcao_rco(payload->>'last_step'),
    _texto_opcional_rco(payload->>'source_page', 500),
    _texto_opcional_rco(payload->>'conversion_page', 500),
    _texto_opcional_rco(payload->>'landing_page_version', 40),
    _texto_opcional_rco(payload->>'utm_source', 300),
    _texto_opcional_rco(payload->>'utm_medium', 300),
    _texto_opcional_rco(payload->>'utm_campaign', 300),
    _texto_opcional_rco(payload->>'utm_content', 300),
    _texto_opcional_rco(payload->>'utm_term', 300),
    _texto_opcional_rco(payload->>'gclid', 300),
    _texto_opcional_rco(payload->>'fbclid', 300)
  )
  on conflict (submission_id) do update set
    whatsapp = excluded.whatsapp,
    full_name = excluded.full_name,
    email = excluded.email,
    instagram = excluded.instagram,
    employees = excluded.employees,
    niche = excluded.niche,
    niche_other = excluded.niche_other,
    partner = excluded.partner,
    sales_challenge = excluded.sales_challenge,
    urgency = excluded.urgency,
    ads_experience = excluded.ads_experience,
    revenue_range = excluded.revenue_range,
    last_step = excluded.last_step,
    saves = p.saves + 1,
    updated_at = now()
  -- Depois de enviado ao CRM o parcial fica congelado (o que foi mandado é o que vale).
  where p.crm_status in ('pendente', 'erro') and p.saves < 100;

  return jsonb_build_object('ok', true);
end;
$$;

-- URL do webhook da integração "Não terminou", do Vault. Nula = despacho de parciais desligado.
create or replace function public._url_webhook_incompleto_crm_rco()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return (select decrypted_secret from vault.decrypted_secrets
          where name = 'crm_webhook_lp_p02_incompleto_rco' limit 1);
end;
$$;

-- Corpo no formato Respondi, igual ao do lead completo, com o que já foi respondido.
create or replace function public._payload_crm_parcial_rco(p public.leads_parciais_performance_rco)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'form', jsonb_build_object('form_id', 'lp-p02-incompleto', 'form_name', 'LP P02 · Não terminou'),
    'respondent', jsonb_build_object(
      'respondent_id', p.respondent_id,
      'status', 'incomplete',
      'answers', jsonb_strip_nulls(jsonb_build_object(
        'Nome', p.full_name,
        'WhatsApp', p.whatsapp,
        'Email', p.email,
        'Nicho', case when p.niche is not null then public._rotulo_nicho_rco(p.niche, p.niche_other) end,
        'Faturamento', case when p.revenue_range is not null then public._rotulo_faturamento_rco(p.revenue_range) end,
        'utm_source', p.utm_source,
        'utm_medium', p.utm_medium,
        'utm_campaign', p.utm_campaign,
        'utm_content', p.utm_content,
        'utm_term', p.utm_term,
        'gclid', p.gclid,
        'fbclid', p.fbclid
      ))
    )
  )
$$;

-- Consome os parciais abandonados. Devolve quantos tentou enviar nesta rodada.
create or replace function public.despachar_parciais_crm_rco(limite integer default 20)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text := public._url_webhook_incompleto_crm_rco();
  p public.leads_parciais_performance_rco;
  v_status integer;
  v_content text;
  v_corpo jsonb;
  v_resultado text;
  v_n integer := 0;
begin
  if v_url is null then
    return 0;
  end if;

  for p in
    select * from public.leads_parciais_performance_rco
    where crm_status in ('pendente', 'erro')
      and crm_attempts < public._crm_max_tentativas_rco()
      and updated_at <= now() - public._parcial_espera_rco()
      and coalesce(crm_next_attempt_at, '-infinity') <= now()
    order by updated_at
    limit limite
    for update skip locked
  loop
    -- Terminou (mesmo submission_id, ou o mesmo número depois de começar): não manda o parcial.
    if exists (
      select 1 from public.leads_performance_rco l
      where l.submission_id = p.submission_id
         or (l.whatsapp = p.whatsapp and l.created_at >= p.created_at - interval '1 hour')
    ) then
      update public.leads_parciais_performance_rco set crm_status = 'descartado', crm_next_attempt_at = null
        where id = p.id;
      continue;
    end if;

    v_n := v_n + 1;
    begin
      select r.status, r.content into v_status, v_content
        from public._crm_http_post_rco(v_url, public._payload_crm_parcial_rco(p)::text) r;
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

    update public.leads_parciais_performance_rco set
      crm_attempts = case when v_resultado = 'falha' then greatest(crm_attempts + 1, public._crm_max_tentativas_rco())
                          else crm_attempts + 1 end,
      crm_response = jsonb_build_object('status', v_status, 'body', v_corpo),
      crm_status = case when v_resultado = 'enviado' then 'enviado' else 'erro' end,
      crm_synced_at = case when v_resultado = 'enviado' then now() else crm_synced_at end,
      crm_last_error = case when v_resultado = 'enviado' then null
                            else left('HTTP ' || v_status || ': ' || coalesce(v_content, ''), 500) end,
      crm_next_attempt_at = case
        when v_resultado = 'retentar'
          then now() + least(power(2, crm_attempts + 1), 360) * interval '1 minute'
        else null end
    where id = p.id;
  end loop;

  return v_n;
end;
$$;

-- Só salvar_parcial é público (para o site); o resto só o dono e o pg_cron.
do $$
declare
  f text;
begin
  foreach f in array array[
    'public._parcial_espera_rco()',
    'public._url_webhook_incompleto_crm_rco()',
    'public._opcao_rco(text)',
    'public.salvar_parcial_performance_rco(jsonb)',
    'public._payload_crm_parcial_rco(public.leads_parciais_performance_rco)',
    'public.despachar_parciais_crm_rco(integer)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('revoke execute on function %s from anon, authenticated, service_role', f);
  end loop;
end;
$$;
grant execute on function public.salvar_parcial_performance_rco(jsonb) to anon;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('despachar-parciais-crm-rco', '* * * * *',
                          'select public.despachar_parciais_crm_rco()');
  end if;
end;
$$;
