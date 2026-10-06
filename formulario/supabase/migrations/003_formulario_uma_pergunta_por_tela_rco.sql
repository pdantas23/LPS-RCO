-- ============================================================
-- 003 — P02 v2: uma pergunta por tela, com as perguntas do formulário da RCO
--
-- Perguntas novas: e-mail, @ da empresa, funcionários, sócio/convidado (opcional),
-- maior desafio em vendas, urgência e experiência com anúncios. Faturamento ganhou
-- as faixas do formulário da RCO. Segmento (nicho) continua.
--
-- Só acrescenta: colunas novas anuláveis (linhas antigas ficam intactas) e
-- create or replace das funções. Instância COMPARTILHADA: sufixo _rco, revogação
-- nome a nome, nenhum trigger. Seguro de rodar mais de uma vez.
--
-- CRM: o card "Landing Pages" só guarda Nome/WhatsApp/Email/Nicho/Faturamento.
-- O e-mail passa a ir no despacho; as demais respostas ficam só nesta tabela.
-- ============================================================

alter table public.leads_performance_rco
  add column if not exists email text,
  add column if not exists instagram text,
  add column if not exists employees text,
  add column if not exists partner text,
  add column if not exists sales_challenge text,
  add column if not exists urgency text,
  add column if not exists ads_experience text;

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
  v_email text;
  v_instagram text;
  v_funcionarios text;
  v_socio text;
  v_desafio text;
  v_urgencia text;
  v_anuncios text;
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

  -- O navegador só confirma por conferência (número digitado duas vezes); 'verificado_codigo'
  -- exigirá fluxo próprio no servidor.
  v_confirmacao := payload->>'whatsapp_confirmation_status';
  if v_confirmacao is distinct from 'confirmado_visualmente' then
    return jsonb_build_object('ok', false, 'error', 'whatsapp_not_confirmed', 'field', 'whatsapp_confirmation_status');
  end if;

  v_email := btrim(coalesce(payload->>'email', ''));
  if char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_email', 'field', 'email');
  end if;

  v_instagram := lower(btrim(coalesce(payload->>'instagram', '')));
  if v_instagram !~ '^@[a-z0-9._]{1,30}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_instagram', 'field', 'instagram');
  end if;

  v_funcionarios := btrim(coalesce(payload->>'employees', ''));
  if v_funcionarios !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_employees', 'field', 'employees');
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

  -- Sócio/convidado é opcional; vazio vira null.
  v_socio := nullif(regexp_replace(btrim(coalesce(payload->>'partner', '')), '\s+', ' ', 'g'), '');
  if char_length(v_socio) > 200 then
    return jsonb_build_object('ok', false, 'error', 'invalid_partner', 'field', 'partner');
  end if;

  v_desafio := btrim(coalesce(payload->>'sales_challenge', ''));
  if v_desafio !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_sales_challenge', 'field', 'sales_challenge');
  end if;

  v_urgencia := btrim(coalesce(payload->>'urgency', ''));
  if v_urgencia !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_urgency', 'field', 'urgency');
  end if;

  v_anuncios := btrim(coalesce(payload->>'ads_experience', ''));
  if v_anuncios !~ '^[a-z0-9_]{1,40}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_ads_experience', 'field', 'ads_experience');
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
    email, instagram, employees, partner, sales_challenge, urgency, ads_experience,
    source_page, conversion_page, landing_page_version,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid
  ) values (
    v_submission, v_nome, v_whatsapp, v_confirmacao,
    v_nicho, v_nicho_outro, v_faturamento,
    v_email, v_instagram, v_funcionarios, v_socio, v_desafio, v_urgencia, v_anuncios,
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

-- Faixas de faturamento do formulário da RCO (iguais a src/formulario/config.ts; o teste da 002 compara).
-- As faixas da v1 continuam com rótulo, para leads antigos que ainda estejam na fila.
create or replace function public._rotulo_faturamento_rco(v text)
returns text
language sql
immutable
as $$
  select case v
    when 'acima_1m' then 'Mais de R$ 1.000.000'
    when '500k_1m' then 'De R$ 500.000 até R$ 1.000.000'
    when '200k_500k' then 'De R$ 200.000 até R$ 500.000'
    when '100k_200k' then 'De R$ 100.000 até R$ 200.000'
    when '70k_100k' then 'De R$ 70.000 até R$ 100.000'
    when '50k_70k' then 'De R$ 50.000 até R$ 70.000'
    when '30k_50k' then 'De R$ 30.000 até R$ 50.000'
    when '10k_30k' then 'De R$ 10.000 até R$ 30.000'
    when 'abaixo_10k' then 'Abaixo de R$ 10.000'
    when 'zero_nova' then 'Zero (Empresa nova)'
    when 'zero_com_capital' then 'Zero (Empresa nova. Mas tenho capital para investir)'
    when 'ate_10k' then 'Até R$ 10 mil'
    when '10k_50k' then 'De R$ 10 mil a R$ 50 mil'
    when '50k_100k' then 'De R$ 50 mil a R$ 100 mil'
    when '100k_500k' then 'De R$ 100 mil a R$ 500 mil'
    when 'acima_500k' then 'Acima de R$ 500 mil'
    else v
  end
$$;

-- Despacho ao CRM: agora com o e-mail (campo nativo do card Landing Pages).
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
        'Email', l.email,
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

-- create or replace mantém os privilégios, mas a revogação é refeita por garantia.
revoke all on function public.capturar_lead_performance_rco(jsonb) from public;
revoke execute on function public.capturar_lead_performance_rco(jsonb) from anon, authenticated, service_role;
grant execute on function public.capturar_lead_performance_rco(jsonb) to anon;

revoke all on function public._rotulo_faturamento_rco(text) from public;
revoke execute on function public._rotulo_faturamento_rco(text) from anon, authenticated, service_role;
revoke all on function public._payload_crm_lead_rco(public.leads_performance_rco) from public;
revoke execute on function public._payload_crm_lead_rco(public.leads_performance_rco) from anon, authenticated, service_role;
