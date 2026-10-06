// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { createTestDb, rpcAsAnon } from "../../dev/test-db";
import { NICHES, NICHE_OTHER, REVENUE_RANGES } from "../../src/formulario/config";

const URL_WEBHOOK = "https://comercial.rcoacademy.com.br/api/webhooks/leads/respondi/tok123";

let db: PGlite;

/**
 * Sem http nem Vault no PGlite: troca as duas bordas por dublês. O "CRM" responde
 * na ordem da tabela crm_respostas_teste; cada POST fica em crm_chamadas_teste.
 */
beforeEach(async () => {
  db = await createTestDb();
  await db.exec(`
    create table crm_config_teste (url text);
    insert into crm_config_teste values ('${URL_WEBHOOK}');
    create table crm_respostas_teste (ordem serial, status int, content text);
    -- Sequência não volta no rollback: a resposta é consumida mesmo quando o dublê lança erro.
    create sequence crm_cursor_teste;
    create table crm_chamadas_teste (ordem serial, url text, corpo jsonb);

    create or replace function public._url_webhook_crm_rco() returns text
    language sql stable as $$ select url from crm_config_teste limit 1 $$;

    create or replace function public._crm_http_post_rco(url text, corpo text, out status integer, out content text)
    language plpgsql as $$
    declare r record; v_ordem bigint := nextval('crm_cursor_teste');
    begin
      insert into crm_chamadas_teste (url, corpo) values (url, corpo::jsonb);
      select t.status, t.content into r from crm_respostas_teste t where t.ordem = v_ordem;
      if r is null then raise exception 'sem resposta configurada'; end if;
      if r.status = -1 then raise exception 'timeout simulado'; end if;
      status := r.status; content := r.content;
    end $$;
  `);
});

const lead = (over: Record<string, unknown> = {}) => ({
  submission_id: crypto.randomUUID(),
  full_name: "Maria da Silva",
  whatsapp: "62998765432",
  whatsapp_confirmation_status: "confirmado_visualmente",
  niche: "saude",
  revenue_range: "50k_70k",
  email: "maria@empresa.com.br",
  instagram: "@empresa",
  employees: "2_3",
  sales_challenge: "nao_converte",
  urgency: "imediato",
  ads_experience: "nunca",
  utm_source: "instagram",
  utm_campaign: "performance",
  ...over,
});

const responde = async (...respostas: [number, unknown][]) => {
  for (const [status, body] of respostas) {
    await db.query("insert into crm_respostas_teste (status, content) values ($1, $2)", [
      status,
      typeof body === "string" ? body : JSON.stringify(body),
    ]);
  }
};

const despachar = async () =>
  (await db.query<{ n: number }>("select public.despachar_leads_crm_rco() n")).rows[0].n;

interface Chamada {
  url: string;
  corpo: { respondent: { answers: Record<string, string> } } & Record<string, unknown>;
}
const chamadas = async () =>
  (await db.query<Chamada>("select url, corpo from crm_chamadas_teste order by ordem")).rows;

interface LinhaCrm {
  crm_status: string;
  crm_attempts: number;
  crm_last_error: string | null;
  crm_next_attempt_at: Date | null;
  crm_synced_at: Date | null;
  crm_response: unknown;
}
const linha = async () =>
  (await db.query<LinhaCrm>("select * from leads_performance_rco")).rows[0];

/** Libera a próxima tentativa sem esperar o relógio. */
const venceEspera = () => db.exec("update leads_performance_rco set crm_next_attempt_at = now() - interval '1 second'");

const OK = { ok: true, contact_id: "c1", deal_id: "d1" };

describe("despachar_leads_crm_rco", () => {
  it("envia no formato das LPs do CRM e marca enviado", async () => {
    const payload = lead();
    await rpcAsAnon(db, payload);
    await responde([200, OK]);

    expect(await despachar()).toBe(1);

    const [c] = await chamadas();
    expect(c.url).toBe(URL_WEBHOOK);
    expect(c.corpo).toEqual({
      form: { form_id: "lp-p02", form_name: "LP P02 · Formulário de Performance" },
      respondent: {
        respondent_id: payload.submission_id,
        status: "completed",
        answers: {
          Nome: "Maria da Silva",
          WhatsApp: "5562998765432",
          Nicho: "Saúde",
          Email: "maria@empresa.com.br",
          Faturamento: "De R$ 50.000 até R$ 70.000",
          utm_source: "instagram",
          utm_campaign: "performance",
        },
      },
    });
    expect(await linha()).toMatchObject({
      crm_status: "enviado",
      crm_attempts: 1,
      crm_last_error: null,
      crm_next_attempt_at: null,
      crm_response: { status: 200, body: OK },
    });
    expect((await linha()).crm_synced_at).toBeInstanceOf(Date);

    // Enviado não volta para a fila.
    expect(await despachar()).toBe(0);
    expect(await chamadas()).toHaveLength(1);
  });

  it("rótulos de nicho e faturamento batem com src/formulario/config.ts", async () => {
    for (const n of NICHES.filter((o) => o.value !== NICHE_OTHER)) {
      const r = await db.query<{ v: string }>("select public._rotulo_nicho_rco($1, null) v", [n.value]);
      expect(r.rows[0].v, n.value).toBe(n.label);
    }
    for (const f of REVENUE_RANGES) {
      const r = await db.query<{ v: string }>("select public._rotulo_faturamento_rco($1) v", [f.value]);
      expect(r.rows[0].v, f.value).toBe(f.label);
    }
  });

  it('nicho "outro" vai com o texto digitado; valor desconhecido segue cru', async () => {
    const q = (sql: string) => db.query<{ v: string }>(sql).then((r) => r.rows[0].v);
    expect(await q("select public._rotulo_nicho_rco('outro', 'Pet shop') v")).toBe("Outro: Pet shop");
    expect(await q("select public._rotulo_nicho_rco('novo_nicho', null) v")).toBe("novo_nicho");
    expect(await q("select public._rotulo_faturamento_rco('faixa_x') v")).toBe("faixa_x");
  });

  it("duplicate do CRM também é sucesso", async () => {
    await rpcAsAnon(db, lead());
    await responde([200, { ok: true, duplicate: true }]);
    await despachar();
    expect((await linha()).crm_status).toBe("enviado");
  });

  it.each([
    ["5xx", 502, "Bad Gateway"],
    ["rate limit", 429, { error: "rate" }],
    ["token inexistente", 404, { error: "Integração não encontrada" }],
    ["integração desligada", 200, { ok: true, ignored: "disabled" }],
    ["sem telefone mapeado", 200, { ok: true, ignored: "no_phone" }],
    ["timeout", -1, ""],
  ])("%s: fica em erro e volta depois da espera", async (_nome, status, body) => {
    await rpcAsAnon(db, lead());
    await responde([status as number, body], [200, OK]);

    await despachar();
    let l = await linha();
    expect(l.crm_status).toBe("erro");
    expect(l.crm_attempts).toBe(1);
    expect(l.crm_last_error).toMatch(/^HTTP /);
    expect(l.crm_next_attempt_at!.getTime()).toBeGreaterThan(Date.now() + 60_000);

    // Antes da espera, não reenvia.
    expect(await despachar()).toBe(0);

    await venceEspera();
    await despachar();
    l = await linha();
    expect(l.crm_status).toBe("enviado");
    expect(l.crm_attempts).toBe(2);
    expect(l.crm_last_error).toBeNull();
  });

  it.each([
    ["erro depois de registrar", 200, { ok: true, warning: "processing_error" }],
    ["JSON inválido", 400, { error: "JSON inválido" }],
    ["corpo grande demais", 413, { error: "Payload muito grande" }],
  ])("%s: erro definitivo, não reenvia", async (_nome, status, body) => {
    await rpcAsAnon(db, lead());
    await responde([status, body]);
    await despachar();
    const l = await linha();
    expect(l.crm_status).toBe("erro");
    expect(l.crm_next_attempt_at).toBeNull();
    await venceEspera();
    expect(await despachar()).toBe(0);
    expect(await chamadas()).toHaveLength(1);
  });

  it("desiste depois do limite de tentativas", async () => {
    await rpcAsAnon(db, lead());
    const max = (await db.query<{ n: number }>("select public._crm_max_tentativas_rco() n")).rows[0].n;
    for (let i = 0; i < max + 2; i++) {
      await responde([503, "down"]);
      await despachar();
      await venceEspera();
    }
    expect(await chamadas()).toHaveLength(max);
    expect((await linha()).crm_attempts).toBe(max);
  });

  it("espera cresce 2, 4, 8… minutos até o teto de 6 h", async () => {
    await rpcAsAnon(db, lead());
    const esperas: number[] = [];
    for (let i = 0; i < 10; i++) {
      await responde([503, "down"]);
      await despachar();
      const r = await db.query<{ m: number }>(
        "select round(extract(epoch from crm_next_attempt_at - now()) / 60)::int m from leads_performance_rco",
      );
      esperas.push(r.rows[0].m);
      await venceEspera();
    }
    expect(esperas).toEqual([2, 4, 8, 16, 32, 64, 128, 256, 360, 360]);
  });

  it("sem URL no Vault não envia nada", async () => {
    await db.exec("delete from crm_config_teste");
    await rpcAsAnon(db, lead());
    expect(await despachar()).toBe(0);
    expect((await linha()).crm_status).toBe("pendente");
  });

  it("envia em ordem de chegada e respeita o limite por rodada", async () => {
    for (let i = 0; i < 3; i++) {
      await rpcAsAnon(db, lead({ whatsapp: `6299876543${i}` }));
    }
    await responde([200, OK], [200, OK], [200, OK]);
    expect((await db.query<{ n: number }>("select public.despachar_leads_crm_rco(2) n")).rows[0].n).toBe(2);
    expect(await despachar()).toBe(1);
    const fones = (await chamadas()).map((c) => c.corpo.respondent.answers.WhatsApp);
    expect(fones).toEqual(["5562998765430", "5562998765431", "5562998765432"]);
  });

  it("o site (anon) não alcança o despacho", async () => {
    await expect(
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        await tx.query("select public.despachar_leads_crm_rco()");
      }),
    ).rejects.toThrow(/permission denied/);
  });
});
