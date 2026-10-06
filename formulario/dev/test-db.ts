/**
 * Postgres real (PGlite, WASM) com as migrations da P02 aplicadas.
 * Usado nos testes e no servidor de desenvolvimento — nunca vai para o build.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS = ["001_leads_performance_rco.sql", "002_despacho_crm_rco.sql", "003_formulario_uma_pergunta_por_tela_rco.sql", "004_contatos_parciais_rco.sql"].map((f) =>
  resolve(process.cwd(), "supabase/migrations", f),
);

export async function createTestDb(): Promise<PGlite> {
  const db = new PGlite();
  // Papéis que o Supabase já tem de fábrica.
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin;`);
  for (const file of MIGRATIONS) {
    const sql = readFileSync(file, "utf8");
    await db.exec(sql);
    await db.exec(sql); // cada migration precisa aguentar rodar duas vezes
  }
  return db;
}

/** Chama a RPC como o site chamaria: papel anon. */
export async function rpcAsAnon(db: PGlite, payload: unknown): Promise<Record<string, unknown>> {
  return db.transaction(async (tx) => {
    await tx.exec("set local role anon");
    const res = await tx.query<{ r: Record<string, unknown> }>(
      "select public.capturar_lead_performance_rco($1::jsonb) as r",
      [JSON.stringify(payload)],
    );
    return res.rows[0].r;
  });
}

/** Qualquer RPC pública, como o site chamaria (papel anon). */
export async function callAsAnon(db: PGlite, fn: string, payload: unknown): Promise<Record<string, unknown>> {
  return db.transaction(async (tx) => {
    await tx.exec("set local role anon");
    const res = await tx.query<{ r: Record<string, unknown> }>(`select public.${fn}($1::jsonb) as r`, [
      JSON.stringify(payload),
    ]);
    return res.rows[0].r;
  });
}
