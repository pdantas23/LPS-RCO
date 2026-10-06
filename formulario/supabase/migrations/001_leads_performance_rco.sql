-- ============================================================
-- 001 — Leads do formulário de Performance (P02, lp.rcohub.com/formulario)
--
-- Instância Supabase COMPARTILHADA da RCO: nomes com sufixo _rco, nada de
-- revogação em massa, nada de trigger. Só cria objetos novos.
--
-- Porta de entrada única: a função capturar_lead_performance_rco(jsonb),
-- chamada pelo site com a chave anônima (POST /rest/v1/rpc/...). O anônimo
-- NÃO alcança a tabela: só a função, que valida tudo no servidor.
--
-- Ordem: valida → grava → responde. CRM e aviso ao comercial NÃO participam
-- do aceite: o lead nasce com crm_status/notify_status = 'pendente' e um
-- processo à parte (a definir) consome essa fila e marca o resultado.
--
-- Idempotente por submission_id (gerado no navegador, reaproveitado em
-- retry/reload): a mesma submissão nunca vira dois leads.
-- Seguro de rodar mais de uma vez.
-- ============================================================

create table if not exists public.leads_performance_rco (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique,

  full_name text not null check (char_length(full_name) between 2 and 120),
  -- Só dígitos: 55 + DDD + número (8 ou 9 dígitos). Formato válido ≠ posse do número.
  whatsapp text not null check (whatsapp ~ '^55[1-9][0-9]9?[0-9]{8}$'),
  -- 'confirmado_visualmente' = a pessoa conferiu o número digitado (NÃO prova posse).
  -- 'verificado_codigo' fica reservado para um fluxo de código que ainda não existe.
  whatsapp_confirmation_status text not null
    check (whatsapp_confirmation_status in ('confirmado_visualmente', 'verificado_codigo')),

  niche text not null check (niche ~ '^[a-z0-9_]{1,40}$'),
  niche_other text check (niche_other is null or char_length(niche_other) between 1 and 80),
  revenue_range text not null check (revenue_range ~ '^[a-z0-9_]{1,40}$'),

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

  -- Fila das integrações (retry fica a cargo de quem consome).
  crm_status text not null default 'pendente' check (crm_status in ('pendente', 'enviado', 'erro')),
  crm_attempts integer not null default 0,
  crm_last_error text,
  crm_synced_at timestamptz,
  notify_status text not null default 'pendente' check (notify_status in ('pendente', 'enviado', 'erro')),
  notify_attempts integer not null default 0,
  notify_last_error text,
  notified_at timestamptz
);

create index if not exists leads_performance_rco_whatsapp_idx
  on public.leads_performance_rco (whatsapp, created_at desc);
create index if not exists leads_performance_rco_crm_pendente_idx
  on public.leads_performance_rco (created_at) where crm_status <> 'enviado';
create index if not exists leads_performance_rco_notify_pendente_idx
  on public.leads_performance_rco (created_at) where notify_status <> 'enviado';

-- Tabela fechada para o site: RLS ligado e sem policy. Revogação nome a nome.
alter table public.leads_performance_rco enable row level security;
revoke all on table public.leads_performance_rco from public;
revoke all on table public.leads_performance_rco from anon, authenticated;

-- Texto opcional: trim, vazio vira null, corta no limite (origem nunca derruba o lead).
create or replace function public._texto_opcional_rco(v text, limite integer)
returns text
language sql
immutable
as $$
  select nullif(left(btrim(coalesce(v, '')), limite), '')
$$;

revoke all on function public._texto_opcional_rco(text, integer) from public;
revoke execute on function public._texto_opcional_rco(text, integer) from anon, authenticated, service_role;

create or replace function public.capturar_lead_performance_rco(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_submission uuid;
  v_nome text;
  v_whatsapp text;
  v_confirmacao text;
  v_nicho text;
  v_nicho_outro text;
  v_faturamento text;
  v_id uuid;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'invalid_payload');
  end if;

  -- Armadilha anti-spam: campo escondido que pessoa não preenche.
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

  -- Repetição do mesmo envio (duplo clique, retry, reload): devolve o lead já salvo.
  select id into v_id from leads_performance_rco where submission_id = v_submission;
  if found then
    return jsonb_build_object('ok', true, 'lead_id', v_id, 'duplicate', true);
  end if;

  v_nome := regexp_replace(btrim(coalesce(payload->>'full_name', '')), '\s+', ' ', 'g');
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name', 'field', 'full_name');
  end if;

  v_whatsapp := regexp_replace(coalesce(payload->>'whatsapp', ''), '\D', '', 'g');
  if char_length(v_whatsapp) in (10, 11) then
    v_whatsapp := '55' || v_whatsapp;
  end if;
  if v_whatsapp !~ '^55[1-9][0-9]9?[0-9]{8}$'
     or (char_length(v_whatsapp) = 13 and substr(v_whatsapp, 5, 1) <> '9') then
    return jsonb_build_object('ok', false, 'error', 'invalid_whatsapp', 'field', 'whatsapp');
  end if;

  -- Só a confirmação visual pode vir do navegador; 'verificado_codigo' exigirá fluxo próprio no servidor.
  v_confirmacao := payload->>'whatsapp_confirmation_status';
  if v_confirmacao is distinct from 'confirmado_visualmente' then
    return jsonb_build_object('ok', false, 'error', 'whatsapp_not_confirmed', 'field', 'whatsapp_confirmation_status');
  end if;

  v_nicho := btrim(coalesce(payload->>'niche', ''));
  if v_nicho !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_niche', 'field', 'niche');
  end if;
  v_nicho_outro := _texto_opcional_rco(payload->>'niche_other', 80);
  if v_nicho = 'outro' and v_nicho_outro is null then
    return jsonb_build_object('ok', false, 'error', 'missing_niche_other', 'field', 'niche_other');
  end if;
  if v_nicho <> 'outro' then
    v_nicho_outro := null;
  end if;

  v_faturamento := btrim(coalesce(payload->>'revenue_range', ''));
  if v_faturamento !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_revenue_range', 'field', 'revenue_range');
  end if;

  -- Freio contra repetição em massa do mesmo número (não é regra de qualificação).
  if (select count(*) from leads_performance_rco
      where whatsapp = v_whatsapp and created_at > now() - interval '10 minutes') >= 3 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  insert into leads_performance_rco (
    submission_id, full_name, whatsapp, whatsapp_confirmation_status,
    niche, niche_other, revenue_range,
    source_page, conversion_page, landing_page_version,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid
  ) values (
    v_submission, v_nome, v_whatsapp, v_confirmacao,
    v_nicho, v_nicho_outro, v_faturamento,
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
  on conflict (submission_id) do nothing
  returning id into v_id;

  if v_id is null then
    -- Corrida entre duas requisições com o mesmo submission_id: a outra gravou primeiro.
    select id into v_id from leads_performance_rco where submission_id = v_submission;
    return jsonb_build_object('ok', true, 'lead_id', v_id, 'duplicate', true);
  end if;

  return jsonb_build_object('ok', true, 'lead_id', v_id, 'duplicate', false);
end;
$$;

-- Só esta função é pública, e só para o anônimo (o site).
revoke all on function public.capturar_lead_performance_rco(jsonb) from public;
revoke execute on function public.capturar_lead_performance_rco(jsonb) from anon, authenticated, service_role;
grant execute on function public.capturar_lead_performance_rco(jsonb) to anon;
