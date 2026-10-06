// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { callAsAnon, createTestDb, rpcAsAnon } from "../../dev/test-db";

const URL_INCOMPLETO = "https://comercial.rcoacademy.com.br/api/webhooks/leads/respondi/tok-incompleto";

let db: PGlite;

/** Sem http nem Vault no PGlite: dublês iguais aos da 002, com a URL da integração "Não terminou". */
beforeEach(async () => {
  db = await createTestDb();
  await db.exec(`
    create table crm_respostas_teste (ordem serial, status int, content text);
    create sequence crm_cursor_teste;
    create table crm_chamadas_teste (ordem serial, url text, corpo jsonb);
    create table crm_config_teste (url text);
    insert into crm_config_teste values ('${URL_INCOMPLETO}');

    create or replace function public._url_webhook_incompleto_crm_rco() returns text
    language sql stable as $$ select url from crm_config_teste limit 1 $$;

    create or replace function public._crm_http_post_rco(url text, corpo text, out status integer, out content text)
    language plpgsql as $$
    declare r record; v_ordem bigint := nextval('crm_cursor_teste');
    begin
      insert into crm_chamadas_teste (url, corpo) values (url, corpo::jsonb);
      select t.status, t.content into r from crm_respostas_teste t where t.ordem = v_ordem;
      if r is null then raise exception 'sem resposta configurada'; end if;
      status := r.status; content := r.content;
    end $$;
  `);
});

const sub = () => crypto.randomUUID();
const parcial = (over: Record<string, unknown> = {}) => ({
  submission_id: sub(),
  full_name: "  Maria   da Silva ",
  whatsapp: "(62) 99876-5432",
  email: "maria@empresa.com.br",
  instagram: "@empresa",
  employees: "2_3",
  niche: "saude",
  last_step: "whatsapp",
  utm_source: "instagram",
  website: "",
  ...over,
});
const completo = (over: Record<string, unknown> = {}) => ({
  submission_id: sub(),
  full_name: "Maria da Silva",
  whatsapp: "62998765432",
  whatsapp_confirmation_status: "confirmado_visualmente",
  niche: "saude",
  revenue_range: "10k_30k",
  email: "maria@empresa.com.br",
  instagram: "@empresa",
  employees: "2_3",
  sales_challenge: "nao_converte",
  urgency: "imediato",
  ads_experience: "nunca",
  ...over,
});

const salvar = (p: unknown) => callAsAnon(db, "salvar_parcial_performance_rco", p);
interface Parcial {
  submission_id: string;
  respondent_id: string;
  crm_status: string;
  crm_next_attempt_at: Date;
  revenue_range: string | null;
  [col: string]: unknown;
}
const linhas = async () =>
  (await db.query<Parcial>("select * from leads_parciais_performance_rco order by created_at")).rows;
/** Faz de conta que passaram 31 minutos desde a última resposta. */
const abandonar = () => db.exec("update leads_parciais_performance_rco set updated_at = now() - interval '31 minutes'");
const despachar = async () =>
  (await db.query<{ n: number }>("select public.despachar_parciais_crm_rco() n")).rows[0].n;
const responde = async (status: number, body: unknown) =>
  db.query("insert into crm_respostas_teste (status, content) values ($1, $2)", [status, JSON.stringify(body)]);
const chamadas = async () => (await db.query<{ url: string; corpo: unknown }>("select url, corpo from crm_chamadas_teste order by ordem")).rows;

describe("salvar_parcial_performance_rco", () => {
  it("grava o que já foi respondido, normalizado; atualiza a mesma linha a cada tela", async () => {
    const p = parcial();
    expect(await salvar(p)).toEqual({ ok: true });
    expect(await salvar({ ...p, sales_challenge: "nao_converte", last_step: "sales_challenge" })).toEqual({ ok: true });
    const [row] = await linhas();
    expect(await linhas()).toHaveLength(1);
    expect(row).toMatchObject({
      whatsapp: "5562998765432",
      full_name: "Maria da Silva",
      email: "maria@empresa.com.br",
      instagram: "@empresa",
      employees: "2_3",
      niche: "saude",
      sales_challenge: "nao_converte",
      last_step: "sales_challenge",
      utm_source: "instagram",
      saves: 2,
      crm_status: "pendente",
    });
    expect(row.respondent_id).not.toBe(row.submission_id);
  });

  it("só o WhatsApp é obrigatório; resposta estranha vira null em vez de recusar", async () => {
    expect(await salvar(parcial({ whatsapp: "123" }))).toEqual({ ok: false, error: "invalid_whatsapp" });
    expect(await salvar(parcial({ email: "sem-arroba", instagram: "@a b", employees: "<b>", full_name: "" }))).toEqual({ ok: true });
    const [row] = await linhas();
    expect(row).toMatchObject({ email: null, instagram: null, employees: null, full_name: null });
  });

  it("honeypot, submission_id inválido e freio de 5 jornadas por número em 10 min", async () => {
    expect((await salvar(parcial({ website: "x" }))).error).toBe("rejected");
    expect((await salvar(parcial({ submission_id: "abc" }))).error).toBe("invalid_submission_id");
    for (let i = 0; i < 5; i++) expect((await salvar(parcial())).ok).toBe(true);
    expect((await salvar(parcial())).error).toBe("rate_limited");
    expect((await salvar(parcial({ whatsapp: "11987654321" }))).ok).toBe(true);
  });

  it("depois de terminado, o parcial não é mais gravado", async () => {
    const c = completo();
    await rpcAsAnon(db, c);
    expect(await salvar(parcial({ submission_id: c.submission_id }))).toEqual({ ok: true, ignored: "completed" });
    expect(await linhas()).toHaveLength(0);
  });

  it("o site (anon) só alcança salvar: tabela e despacho fechados", async () => {
    const asAnon = (sql: string) =>
      db.transaction(async (tx) => {
        await tx.exec("set local role anon");
        await tx.query(sql);
      });
    await expect(asAnon("select * from leads_parciais_performance_rco")).rejects.toThrow(/permission denied/);
    await expect(asAnon("select public.despachar_parciais_crm_rco()")).rejects.toThrow(/permission denied/);
  });
});

describe("despachar_parciais_crm_rco", () => {
  it("antes de 30 minutos parado, não envia", async () => {
    await salvar(parcial());
    expect(await despachar()).toBe(0);
    expect(await chamadas()).toHaveLength(0);
  });

  it("abandonou: envia para a integração 'Não terminou' com o que foi respondido", async () => {
    const p = parcial();
    await salvar(p);
    await abandonar();
    await responde(200, { ok: true, contact_id: "c1", deal_id: "d1" });
    expect(await despachar()).toBe(1);
    const [c] = await chamadas();
    const [row] = await linhas();
    expect(c.url).toBe(URL_INCOMPLETO);
    expect(c.corpo).toEqual({
      form: { form_id: "lp-p02-incompleto", form_name: "LP P02 · Não terminou" },
      respondent: {
        respondent_id: row.respondent_id,
        status: "incomplete",
        answers: {
          Nome: "Maria da Silva",
          WhatsApp: "5562998765432",
          Email: "maria@empresa.com.br",
          Nicho: "Saúde",
          utm_source: "instagram",
        },
      },
    });
    expect(row.crm_status).toBe("enviado");
    // Enviado não sai de novo, nem se o site mandar mais respostas.
    await salvar({ ...p, revenue_range: "10k_30k" });
    await abandonar();
    expect(await despachar()).toBe(0);
    expect((await linhas())[0].revenue_range).toBeNull();
  });

  it("terminou (mesmo submission_id ou mesmo número depois): parcial descartado, nada enviado", async () => {
    const a = parcial();
    await salvar(a);
    await salvar(parcial({ whatsapp: "11987654321" }));
    await rpcAsAnon(db, completo({ submission_id: a.submission_id }));
    await rpcAsAnon(db, completo({ whatsapp: "11987654321" })); // outro submission_id (ex.: ID novo após falha)
    await abandonar();
    expect(await despachar()).toBe(0);
    expect((await linhas()).map((r) => r.crm_status)).toEqual(["descartado", "descartado"]);
    expect(await chamadas()).toHaveLength(0);
  });

  it("falha no CRM: fica em erro e tenta de novo depois", async () => {
    await salvar(parcial());
    await abandonar();
    await responde(503, { message: "down" });
    await despachar();
    const [row] = await linhas();
    expect(row.crm_status).toBe("erro");
    expect(row.crm_next_attempt_at.getTime()).toBeGreaterThan(Date.now());
    await db.exec("update leads_parciais_performance_rco set crm_next_attempt_at = now() - interval '1 second'");
    await responde(200, { ok: true, duplicate: true });
    await despachar();
    expect((await linhas())[0].crm_status).toBe("enviado");
  });

  it("sem URL no Vault não envia", async () => {
    await db.exec("delete from crm_config_teste");
    await salvar(parcial());
    await abandonar();
    expect(await despachar()).toBe(0);
  });
});
