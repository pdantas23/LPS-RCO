// Gera o build estático do formulário (formulario/, projeto Vite do Aerton) com base /_form/ e copia
// para apps/web/public/_form, de onde o app Next serve "/" e "/curioso" (rewrites em next.config.ts).
// Precisa de VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (a chave ANÔNIMA, pública por natureza) no
// ambiente ou em formulario/.env.production; sem elas o formulário sai sem destino e o envio falha à vista.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const form = path.join(root, "formulario");
const target = path.join(root, "apps", "web", "public", "_form");

if (!existsSync(path.join(form, "node_modules"))) {
  console.log("[build:form] instalando dependências do formulário (npm ci)...");
  const i = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: form, stdio: "inherit" });
  if (i.status !== 0) process.exit(i.status ?? 1);
}

const b = spawnSync("npm", ["run", "build"], {
  cwd: form,
  stdio: "inherit",
  env: { ...process.env, FORM_BASE: "/_form/" },
});
if (b.status !== 0) process.exit(b.status ?? 1);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(path.join(form, "dist"), target, { recursive: true });
console.log("[build:form] formulário copiado para apps/web/public/_form");
