// Teste de ponta a ponta do dataLayer em navegador real (Chrome headless): confere, em cada LP,
// o catálogo único de eventos e o `lp_origem` certo, e que nenhum dado pessoal vai ao dataLayer.
//
// Uso: com `npm run dev` rodando (http://localhost:3100):
//   npm i --no-save playwright-core && node scripts/e2e-gtm.mjs [--lp02]
// --lp02 também testa /lp02 (só se LP02_ATIVA=true em apps/web/src/content/site.ts).
// O GTM e o /api/lead são interceptados: nada vai ao Google nem ao COMERCIAL; o formulário "/" usa o
// banco simulado (PGlite) do dev.
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WITH_LP02 = process.argv.includes("--lp02");
// --prod: contra o build de produção (imagem Docker), que não tem o banco simulado do dev: no formulário "/" só confere a visita.
const PROD = process.argv.includes("--prod");
const PII = ["Maria", "Silva", "99876", "5562998765432", "maria@", "empresa.com", "@empresa", "Estetica"];

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "  ok  " : " FALHA"} ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });

async function open(path) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.route(/googletagmanager\.com|google-analytics\.com|fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`${BASE}${path}?utm_source=teste&gclid=abc123`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  return { ctx, page };
}
const layer = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.dataLayer ?? [])));
const hasGtm = (page) => page.evaluate(() => document.documentElement.innerHTML.includes("GTM-P9XNXV2B"));
const named = (dl, n) => dl.filter((e) => e.event === n);
const noPii = (dl) => PII.every((p) => !JSON.stringify(dl).includes(p));

// ---------------- "/" : formulário (P02) ----------------
console.log("\n/ (formulario)");
{
  const { ctx, page } = await open("/");
  check((await page.title()).includes("RCO"), `título: ${await page.title()}`);
  check(await hasGtm(page), "snippet do GTM-P9XNXV2B presente");
  let dl = await layer(page);
  const pv = named(dl, "page_view")[0];
  check(pv?.lp_origem === "form" && pv?.page_id === "P02" && pv?.page_path === "/", `page_view lp_origem=form page_id=P02 (${JSON.stringify(pv)})`);
  check(pv?.utm_source === "teste" && pv?.gclid === "abc123", "page_view leva UTM/gclid da URL");
  if (PROD) {
    check(await page.locator("#full_name").count() === 1, "formulário renderizado (assets /_form/ carregaram)");
    await ctx.close();
  } else {
  // percorre as 12 telas (DOM direto, igual aos testes do formulário) e envia
  await page.evaluate(async () => {
    const $ = (s) => document.querySelector(s);
    const type = (sel, v) => { const e = $(sel); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); };
    const choose = (sel) => { const e = $(sel); e.checked = true; e.dispatchEvent(new Event("change", { bubbles: true })); };
    const next = () => $("[data-screen]:not([hidden]) button[type=submit]").click();
    const steps = [
      () => type("#full_name", "Maria da Silva"), () => choose("#employees-2_3"),
      () => { const e = $("#niche"); e.value = "saude"; e.dispatchEvent(new Event("change", { bubbles: true })); },
      () => type("#email", "maria@empresa.com.br"), () => type("#instagram", "@empresa"),
      () => type("#whatsapp", "62998765432"), () => type("#partner", ""),
      () => choose("#sales_challenge-nao_converte"), () => choose("#urgency-imediato"),
      () => choose("#ads_experience-nunca"), () => choose("#revenue_range-10k_30k"),
      () => type("#whatsapp_repeat", "(62) 99876-5432"),
    ];
    for (const s of steps) { s(); next(); await new Promise((r) => setTimeout(r, 30)); }
  });
  await page.waitForTimeout(2500);
  dl = await layer(page);
  const gl = named(dl, "generate_lead")[0];
  check(gl?.lp_origem === "form" && gl?.page_id === "P02" && gl?.event_id && gl?.nicho === "saude" && gl?.faturamento === "10k_30k", `generate_lead com event_id e categorias (${JSON.stringify(gl)})`);
  check(named(dl, "form_start").length === 1 && named(dl, "form_submit").length === 1, "form_start 1x e form_submit 1x");
  check(dl.filter((e) => e.event !== "gtm.js" && e.event && !e.lp_origem && !e.event.startsWith("gtm.")).length === 0, "todo evento tem lp_origem");
  check(noPii(dl), "nenhum dado pessoal no dataLayer");
  const leads = await (await ctx.request.get(`${BASE}/__dev/leads`)).json();
  check(Array.isArray(leads) && leads.some((l) => l.id === gl?.event_id || l.submission_id === gl?.event_id), "lead gravado no banco simulado com submission_id = event_id");
  await ctx.close();
  }
}
console.log("\n/curioso");
{
  const { ctx, page } = await open("/curioso");
  const pv = named(await layer(page), "page_view")[0];
  check(pv?.lp_origem === "form" && pv?.page_id === "P02", `page_view curioso lp_origem=form (${JSON.stringify(pv)})`);
  await ctx.close();
}

// ---------------- /lp01, /lp02 (Next) ----------------
async function testNext(path, origem, pageId) {
  console.log(`\n${path} (${origem})`);
  const { ctx, page } = await open(path);
  await page.route("**/api/lead", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  let dl = await layer(page);
  const pv = named(dl, "page_view")[0];
  check(pv?.lp_origem === origem && pv?.page_id === pageId && pv?.page_path === path, `page_view lp_origem=${origem} page_id=${pageId} (${JSON.stringify(pv)})`);
  check(pv?.utm_source === "teste" && pv?.gclid === "abc123", "page_view leva UTM/gclid");
  check(await hasGtm(page), "snippet do GTM-P9XNXV2B presente");
  // erro de validação (envia vazio), depois preenche e envia
  await page.fill("#name", "Maria da Silva");
  await page.fill("#whatsapp", "62998765432");
  await page.fill("#email", "maria@empresa.com.br");
  await page.locator("form button[type=submit]").click(); // nicho/faturamento faltando -> form_error
  await page.waitForTimeout(500);
  for (const [id, text] of [["nicho", "Estética e beleza"], ["faturamento", "Até R$ 30 mil por mês"]]) {
    await page.locator(`#${id}`).click();
    await page.getByRole("option", { name: text }).first().click();
  }
  await page.locator("form button[type=submit]").click();
  await page.waitForTimeout(1500);
  dl = await layer(page);
  const gl = named(dl, "generate_lead")[0];
  check(gl?.lp_origem === origem && gl?.page_id === pageId && gl?.event_id, `generate_lead com event_id (${JSON.stringify(gl)})`);
  check(named(dl, "form_start").length === 1, "form_start 1x");
  check(named(dl, "form_submit").length >= 1, "form_submit");
  const fe = named(dl, "form_error")[0];
  check(fe?.error_type === "validation" && fe?.lp_origem === origem, `form_error validation (${JSON.stringify(fe)})`);
  const faq = page.locator("button[aria-expanded]").filter({ hasText: /\?/ }).first();
  if (await faq.count()) {
    await faq.click();
    await page.waitForTimeout(300);
    const f = named(await layer(page), "faq_open")[0];
    check(f?.lp_origem === origem && f?.question_index === 1, `faq_open (${JSON.stringify(f)})`);
  }
  dl = await layer(page);
  check(dl.filter((e) => e.event && !e.event.startsWith("gtm.") && !e.lp_origem).length === 0, "todo evento tem lp_origem");
  check(noPii(dl), "nenhum dado pessoal no dataLayer");
  await ctx.close();
}
await testNext("/lp01", "lp01", "P05");
if (WITH_LP02) await testNext("/lp02", "lp02", "P04");

// ---------------- rotas desligadas / antigas ----------------
console.log("\nrotas desligadas");
for (const [p, code] of [["/lp-ecom", 404], ["/p04", 404], ["/p05", 404], ...(WITH_LP02 ? [] : [["/lp02", 404]])]) {
  const r = await fetch(BASE + p);
  check(r.status === code, `${p} -> ${r.status}`);
}
const rl = await fetch(`${BASE}/api/lead`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ respondentId: "8f0c7a52-1d34-4b6e-9a77-0f2f5c1d9e10", page: "P04", name: "Maria da Silva", whatsapp: "11999998888", email: "m@e.com", nicho: "Odontologia", faturamento: "Até R$ 30 mil por mês", website: "", tracking: {} }) });
if (!WITH_LP02) check(rl.status === 404, `POST /api/lead page=P04 -> ${rl.status} (lp02 desligada não recebe lead)`);

await browser.close();
console.log(failures ? `\n${failures} FALHA(S)` : "\nTudo certo.");
process.exit(failures ? 1 : 0);
