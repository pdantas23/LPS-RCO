// UM comando para ver as 4 LPs juntas: Vite do formulário (porta 5174, banco simulado PGlite) +
// Next das LPs (porta 3100), com "/" reescrito para o formulário. Abra http://localhost:3100
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORM_PORT = process.env.FORM_DEV_PORT ?? "5174";
const WEB_PORT = process.env.PORT ?? "3100";

const kids = [];
const stop = () => kids.forEach((k) => k.kill());
process.on("exit", stop);
function run(name, cmd, args, cwd, env) {
  const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } });
  const tag = (d) => String(d).split("\n").filter(Boolean).forEach((l) => console.log(`[${name}] ${l}`));
  child.stdout.on("data", tag);
  child.stderr.on("data", tag);
  child.on("exit", (code) => {
    console.log(`[${name}] saiu (${code}); encerrando tudo`);
    process.exit(code ?? 1);
  });
  kids.push(child);
  return child;
}

const formDir = path.join(root, "formulario");
if (!existsSync(path.join(formDir, "node_modules"))) {
  console.error("Falta instalar o formulário: npm ci --prefix formulario");
  process.exit(1);
}

run("form", "npx", ["vite", "--host", "127.0.0.1", "--port", FORM_PORT, "--strictPort"], formDir, {
    FORM_BASE: "/_form/",
    FORM_DEV_PORT: FORM_PORT,
  });
run("web", "npx", ["next", "dev", "-H", "0.0.0.0", "-p", WEB_PORT], path.join(root, "apps", "web"), {
    FORM_DEV_URL: `http://127.0.0.1:${FORM_PORT}`,
  });
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
console.log(`\n  LPs juntas: http://localhost:${WEB_PORT}  ( / form · /lp01 · /lp02 desligada · /lp-ecom desligada )\n`);
