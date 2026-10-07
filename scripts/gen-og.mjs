// Gera as imagens de compartilhamento (og:image, 1200x630) em apps/web/public/og via Chrome headless.
// Uso: node scripts/gen-og.mjs   (precisa de internet para a fonte e de Google Chrome)
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const tpl = path.join(root, "scripts/og/template.html");
const jobs = { form: "form.png", lp: "lp.png" };
for (const [v, out] of Object.entries(jobs)) {
  const r = spawnSync(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    "--window-size=1200,630", "--virtual-time-budget=8000",
    `--screenshot=${path.join(root, "apps/web/public/og", out)}`, `file://${tpl}?v=${v}`,
  ], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
