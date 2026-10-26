import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANUNCIOS_SITES, CAPTURA_TEXTOS, FATURAMENTOS_SITES, NECESSIDADE, PRAZOS_SITES, SITES_CAPTURA } from "@/content/captura/sites";
import { nomeEventoTela, normalizarInstagram, respostasValidas, telaPorId, telasVisiveis, type Respostas } from "./fluxo";
import { NOTA_ANUNCIO, NOTA_FATURAMENTO, NOTA_PRAZO, perfilDosPontos, perfilSites, pontosSites } from "./perfil";
import { respostasParaComercial } from "./payload";
import { validarRespostas } from "./validacao";
import {
  CHAVE_CAMINHO, CHAVE_FORMATO, caminhoDaPessoa, formatoDaPessoa, versaoDaLp, versaoDoQuizDaPessoa, type Armazenamento,
} from "./versao";
import { criarRastreioDeTelas, pushCaptura } from "./eventos";
import { enviarCaptura } from "./envio";

const cfg = SITES_CAPTURA;

// ---------------------------------------------------------------- conteúdo literal (bloco 6 e 7)
describe("configuração da captura: perguntas literais do briefing v2.2", () => {
  it("caminho curto = 9 telas na ordem do bloco 6, com os rótulos curtos do card (bloco 5)", () => {
    const curto = telasVisiveis(cfg, "quiz_curto", {}).map((x) => [x.numero, x.tela.pergunta, x.tela.rotuloCard]);
    expect(curto).toEqual([
      [1, "Qual seu nome?", "Nome"],
      [2, "Qual o tipo do seu negócio?", "Tipo de negócio"],
      [3, "O que você precisa agora?", "O que você precisa"],
      [4, "O que mais te atrapalha hoje nessa parte de site?", "Maior desafio hoje"],
      [5, "Já investiu em anúncios online?", "Anúncios online"],
      [6, "Pra quando você precisa do site no ar?", "Prazo"],
      [7, "Quanto sua empresa fatura por mês?", "Faturamento mensal"],
      [8, "Qual seu WhatsApp?", "WhatsApp"],
      [9, "Qual o @ da sua empresa?", "@ da empresa no Instagram"],
    ]);
  });

  it("opções literais e regras do bloco 3: no máximo 6 opções, exceto faturamento (11 faixas)", () => {
    expect(telaPorId(cfg, "tipo").opcoes).toEqual(["Clínica ou saúde", "Escritório de advocacia", "Loja física ou e-commerce", "Prestador de serviço local", "Infoproduto ou lançamento", "Outro"]);
    expect(telaPorId(cfg, "necessidade").opcoes).toEqual(["Site institucional", "Página de captura de leads", "Página de lançamento", "Loja virtual", "Não sei, quero orientação"]);
    expect(telaPorId(cfg, "desafio").opcoes).toHaveLength(6);
    expect(telaPorId(cfg, "faturamento").opcoes).toHaveLength(11);
    expect(telaPorId(cfg, "faturamento").opcoes![10]).toBe("Zero (Empresa nova. Mas tenho capital para investir)");
    expect(telaPorId(cfg, "funcionarios").opcoes).toEqual(["Somente eu", "De 2 a 3", "De 4 a 8", "De 9 a 15", "Acima de 16 funcionários"]);
    for (const t of cfg.telas) if (t.opcoes && t.id !== "faturamento") expect(t.opcoes.length, t.id).toBeLessThanOrEqual(6);
    // Toda tela de opções do caminho curto tem descrição (bloco 3); slug só com [a-z0-9_]
    for (const { tela } of telasVisiveis(cfg, "quiz_curto", {})) expect(tela.descricao, tela.id).toBeTruthy();
    for (const t of cfg.telas) expect(t.slug).toMatch(/^[a-z0-9_]+$/);
  });

  it("placeholders: 'Seu nome' e '@rcohub' no quiz, '@suaempresa' no card; sem e-mail no curto", () => {
    expect(telaPorId(cfg, "nome").placeholder).toBe("Seu nome");
    expect(telaPorId(cfg, "instagram").placeholder).toBe("@rcohub");
    expect(telaPorId(cfg, "instagram").placeholderCard).toBe("@suaempresa");
    expect(telasVisiveis(cfg, "quiz_curto", {}).some((x) => x.tela.tipo === "email")).toBe(false);
  });

  it("nenhum componente de tela tem texto de pergunta (perguntas só no arquivo de configuração)", () => {
    const dir = path.resolve(__dirname, "../../components/sites");
    const codigo = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    for (const t of cfg.telas) expect(codigo.includes(t.pergunta), t.pergunta).toBe(false);
  });
});

// ---------------------------------------------------------------- ramificação (bloco 7)
describe("ramificação do caminho longo", () => {
  const base: Respostas = { nome: "Ana", tipo: "Outro" };
  const ids = (r: Respostas) => telasVisiveis(cfg, "quiz_longo", r).map((x) => `${x.numero}:${x.tela.id}`);

  it("sem ramo: 12 telas, e o número das telas depois do ramo não muda (posição 5 pulada)", () => {
    expect(ids({ ...base, necessidade: NECESSIDADE.institucional })).toEqual([
      "1:nome", "2:tipo", "3:necessidade", "4:site_atual", "6:desafio", "7:anuncios", "8:prazo", "9:faturamento", "10:funcionarios", "11:whatsapp", "12:email", "13:instagram",
    ]);
    expect(ids({ ...base, necessidade: NECESSIDADE.orientacao })).toHaveLength(12);
  });

  it("captura → oferta, loja → produtos, lançamento → momento; 13 telas, nunca mais de 14", () => {
    expect(ids({ ...base, necessidade: NECESSIDADE.captura })[4]).toBe("5:oferta");
    expect(ids({ ...base, necessidade: NECESSIDADE.loja })[4]).toBe("5:produtos");
    expect(ids({ ...base, necessidade: NECESSIDADE.lancamento })[4]).toBe("5:momento");
    for (const n of Object.values(NECESSIDADE)) expect(ids({ ...base, necessidade: n }).length).toBeLessThanOrEqual(14);
  });

  it("curto e card nunca ramificam", () => {
    for (const v of ["quiz_curto", "card"] as const) {
      expect(telasVisiveis(cfg, v, { necessidade: NECESSIDADE.loja }).map((x) => x.tela.id)).not.toContain("produtos");
    }
  });

  it("resposta de ramo que deixou de valer e campo do longo enviado no curto são descartados", () => {
    const r = { ...base, necessidade: NECESSIDADE.institucional, produtos: "Até 20", site_atual: "Não tenho", email: "a@b.com" };
    expect(respostasValidas(cfg, "quiz_longo", r)).not.toHaveProperty("produtos");
    expect(respostasValidas(cfg, "quiz_longo", r)).toHaveProperty("site_atual");
    const curto = respostasValidas(cfg, "quiz_curto", r);
    expect(curto).not.toHaveProperty("site_atual");
    expect(curto).not.toHaveProperty("email");
  });
});

// ---------------------------------------------------------------- perfil (bloco 8)
describe("perfil A a D (servidor)", () => {
  it("exemplo do PDF: 30-50 mil (1) + agência no passado (1) + pra ontem (2) = 4 = B", () => {
    const r = { faturamento: "De R$ 30.000 até R$ 50.000", anuncios: "Já contratei uma agência no passado", prazo: "Pra ontem, o quanto antes" };
    expect(pontosSites(r)).toBe(4);
    expect(perfilSites(r)).toBe("B");
  });

  it("exemplo do bloco 6 (dono de clínica): 70-100 mil + agência agora + pra ontem = 6 = A", () => {
    expect(perfilSites({ faturamento: "De R$ 70.000 até R$ 100.000", anuncios: "Estou com uma agência ou gestor agora", prazo: "Pra ontem, o quanto antes" })).toBe("A");
  });

  it("faixas na fronteira: 50-70 mil = 2; 30-50 mil = 1; 10-30 mil = 1; abaixo de 10 mil = 0; zero = 0; zero com capital = 1", () => {
    expect(NOTA_FATURAMENTO["De R$ 50.000 até R$ 70.000"]).toBe(2);
    expect(NOTA_FATURAMENTO["De R$ 30.000 até R$ 50.000"]).toBe(1);
    expect(NOTA_FATURAMENTO["De R$ 10.000 até R$ 30.000"]).toBe(1);
    expect(NOTA_FATURAMENTO["Abaixo de R$ 10.000"]).toBe(0);
    expect(NOTA_FATURAMENTO["Zero (Empresa nova)"]).toBe(0);
    expect(NOTA_FATURAMENTO["Zero (Empresa nova. Mas tenho capital para investir)"]).toBe(1);
    expect(FATURAMENTOS_SITES.slice(0, 6).map((f) => NOTA_FATURAMENTO[f])).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it("anúncio e prazo conforme a regra", () => {
    expect(ANUNCIOS_SITES.map((a) => NOTA_ANUNCIO[a])).toEqual([0, 1, 1, 1, 2]);
    expect(PRAZOS_SITES.map((p) => NOTA_PRAZO[p])).toEqual([2, 1, 0, 0]);
  });

  it("tabela de perfil: 0-1 D, 2 C, 3-4 B, 5-6 A; mínimo 0 = D e máximo 6 = A", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(perfilDosPontos)).toEqual(["D", "D", "C", "B", "B", "A", "A"]);
    expect(perfilSites({ faturamento: "Zero (Empresa nova)", anuncios: "Nunca fiz anúncios", prazo: "Sem pressa" })).toBe("D");
    expect(perfilSites({ faturamento: "Mais de R$ 1.000.000", anuncios: "Estou com uma agência ou gestor agora", prazo: "Pra ontem, o quanto antes" })).toBe("A");
    expect(perfilSites({ faturamento: "Abaixo de R$ 10.000", anuncios: "Estou com uma agência ou gestor agora", prazo: "Até 30 dias" })).toBe("B"); // 0+2+1
    expect(perfilSites({ faturamento: "De R$ 10.000 até R$ 30.000", anuncios: "Já fiz anúncios por conta própria", prazo: "De 1 a 3 meses" })).toBe("C"); // 1+1+0
  });

  it("toda opção das três perguntas tem nota (opção nova na configuração quebra aqui)", () => {
    expect(Object.keys(NOTA_FATURAMENTO).sort()).toEqual([...telaPorId(cfg, "faturamento").opcoes!].sort());
    expect(Object.keys(NOTA_ANUNCIO).sort()).toEqual([...telaPorId(cfg, "anuncios").opcoes!].sort());
    expect(Object.keys(NOTA_PRAZO).sort()).toEqual([...telaPorId(cfg, "prazo").opcoes!].sort());
  });

  it("nunca vai ao navegador: nenhum arquivo 'use client' importa o cálculo do perfil", () => {
    const src = path.resolve(__dirname, "../..");
    const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const clientes = walk(src).filter((f) => /\.tsx?$/.test(f) && fs.readFileSync(f, "utf8").startsWith('"use client"'));
    expect(clientes.length).toBeGreaterThan(5);
    for (const f of clientes) expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/captura\/perfil|from "\.\/perfil"/);
    const quem = walk(src).filter((f) => /\.tsx?$/.test(f) && !f.endsWith(".test.ts") && /captura\/perfil"/.test(fs.readFileSync(f, "utf8")));
    expect(quem.map((f) => path.relative(src, f))).toEqual(["lib/lead-service.ts"]);
  });
});

// ---------------------------------------------------------------- validação e mapeamento (bloco 10)
const curtoCompleto: Respostas = {
  nome: "Ana Lima",
  tipo: "Clínica ou saúde",
  necessidade: NECESSIDADE.loja,
  desafio: "Tenho site, mas ele não gera contato nenhum",
  anuncios: "Já contratei uma agência no passado",
  prazo: "Pra ontem, o quanto antes",
  faturamento: "De R$ 30.000 até R$ 50.000",
  whatsapp: "(86) 99999-1234",
  instagram: "instagram.com/ClinicaAna/",
};

describe("validação", () => {
  it("instagram: normaliza @, URL e maiúsculas; recusa inválido", () => {
    expect(normalizarInstagram("@RCOHub")).toBe("@rcohub");
    expect(normalizarInstagram("https://www.instagram.com/rco.hub/?hl=pt")).toBe("@rco.hub");
    expect(normalizarInstagram("rco hub")).toBeNull();
    expect(normalizarInstagram("@")).toBeNull();
  });

  it("curto completo passa e sai normalizado (telefone 55+DDD, @ minúsculo)", () => {
    const v = validarRespostas(cfg, "quiz_curto", curtoCompleto);
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.respostas.whatsapp).toBe("5586999991234");
      expect(v.respostas.instagram).toBe("@clinicaana");
    }
  });

  it("longo exige site, ramo e funcionários; e-mail opcional, mas se vier tem que ser válido", () => {
    const v = validarRespostas(cfg, "quiz_longo", curtoCompleto);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(Object.keys(v.erros).sort()).toEqual(["funcionarios", "produtos", "site_atual"]);
    const ok = validarRespostas(cfg, "quiz_longo", { ...curtoCompleto, site_atual: "Não tenho", produtos: "Até 20", funcionarios: "De 2 a 3" });
    expect(ok.ok).toBe(true);
    const ruim = validarRespostas(cfg, "quiz_longo", { ...curtoCompleto, site_atual: "Não tenho", produtos: "Até 20", funcionarios: "De 2 a 3", email: "sem-arroba" });
    expect(ruim.ok).toBe(false);
  });

  it("opção fora da lista é recusada", () => {
    const v = validarRespostas(cfg, "card", { ...curtoCompleto, prazo: "Amanhã" });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.erros.prazo).toBe(CAPTURA_TEXTOS.erros.opcao);
  });
});

describe("mapeamento para os campos do COMERCIAL (bloco 10)", () => {
  it("longo com ramo: rótulos do documento, origem, versão e perfil; e-mail quando houver", () => {
    const v = validarRespostas(cfg, "quiz_longo", { ...curtoCompleto, site_atual: "Tenho e quero refazer", produtos: "De 20 a 100", funcionarios: "De 4 a 8", email: "Ana@Clinica.com.br" });
    if (!v.ok) throw new Error("devia passar");
    const a = respostasParaComercial(cfg, { pageId: "SITES", versao: "quiz_longo", respostas: v.respostas, perfil: "B" });
    expect(a).toEqual({
      Nome: "Ana Lima",
      WhatsApp: "5586999991234",
      Email: "ana@clinica.com.br",
      Instagram: "@clinicaana",
      "Página de origem": "SITES",
      "Versão da captura": "quiz_longo",
      "Tipo de negócio": "Clínica ou saúde",
      Necessidade: "Loja virtual",
      "Já tem site": "Tenho e quero refazer",
      "Quantidade de produtos": "De 20 a 100",
      Desafio: "Tenho site, mas ele não gera contato nenhum",
      Anúncio: "Já contratei uma agência no passado",
      Prazo: "Pra ontem, o quanto antes",
      Faturamento: "De R$ 30.000 até R$ 50.000",
      Funcionários: "De 4 a 8",
      Perfil: "B",
    });
  });

  it("card: só os campos do curto (sem e-mail, sem ramo, sem funcionários)", () => {
    const v = validarRespostas(cfg, "card", curtoCompleto);
    if (!v.ok) throw new Error("devia passar");
    const a = respostasParaComercial(cfg, { pageId: "SITES", versao: "card", respostas: v.respostas, perfil: "B" });
    expect(Object.keys(a)).toEqual(["Nome", "WhatsApp", "Instagram", "Página de origem", "Versão da captura", "Tipo de negócio", "Necessidade", "Desafio", "Anúncio", "Prazo", "Faturamento", "Perfil"]);
    expect(a["Versão da captura"]).toBe("card");
  });

  it("os rótulos dos ramos são os que o docs/sites-comercial.md manda cadastrar", () => {
    const doc = fs.readFileSync(path.resolve(__dirname, "../../../../../docs/sites-comercial.md"), "utf8");
    for (const t of cfg.telas) expect(doc, t.campoComercial).toContain(`\`${t.campoComercial}\``);
    for (const c of ["Página de origem", "Versão da captura", "Perfil"]) expect(doc).toContain(`\`${c}\``);
  });
});

// ---------------------------------------------------------------- sorteio persistido (bloco 9)
function memoria(inicial: Record<string, string> = {}): Armazenamento & { dados: Record<string, string> } {
  const dados = { ...inicial };
  return { dados, getItem: (k) => dados[k] ?? null, setItem: (k, v) => void (dados[k] = v) };
}

describe("sorteio da versão, guardado", () => {
  it("caminho: sorteia 50/50 na primeira visita e repete o guardado nas seguintes", () => {
    const s = memoria();
    expect(caminhoDaPessoa(s, () => 0.7)).toBe("longo");
    expect(s.dados[CHAVE_CAMINHO]).toBe("longo");
    expect(caminhoDaPessoa(s, () => 0.1)).toBe("longo"); // não troca ao voltar
    expect(caminhoDaPessoa(memoria(), () => 0.49)).toBe("curto");
  });

  it("formato fixo não sorteia; 'sorteio' dá 1/3 card e guarda", () => {
    const s = memoria();
    expect(formatoDaPessoa("quiz", s, () => 0)).toBe("quiz");
    expect(formatoDaPessoa("card", s, () => 0.9)).toBe("card");
    expect(s.dados[CHAVE_FORMATO]).toBeUndefined();
    expect(formatoDaPessoa("sorteio", s, () => 0.2)).toBe("card");
    expect(formatoDaPessoa("sorteio", s, () => 0.9)).toBe("card");
  });

  it("no sorteio as três versões saem em partes iguais e curto/longo meio a meio", () => {
    const cont = { card: 0, quiz_curto: 0, quiz_longo: 0 };
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 30000; i++) cont[versaoDaLp("sorteio", "", memoria(), rnd)]++;
    for (const n of Object.values(cont)) expect(n / 30000).toBeGreaterThan(0.31);
    for (const n of Object.values(cont)) expect(n / 30000).toBeLessThan(0.36);
  });

  it("quem viu o card e abre o quiz direto cai num caminho do quiz; a versão do quiz é a mesma da LP", () => {
    const s = memoria({ [CHAVE_FORMATO]: "quiz", [CHAVE_CAMINHO]: "longo" });
    expect(versaoDaLp("sorteio", "", s)).toBe("quiz_longo");
    expect(versaoDoQuizDaPessoa("", s)).toBe("quiz_longo");
    const c = memoria({ [CHAVE_FORMATO]: "card" });
    expect(versaoDaLp("sorteio", "", c)).toBe("card");
    expect(["quiz_curto", "quiz_longo"]).toContain(versaoDoQuizDaPessoa("", c));
  });

  it("prévia ?captura= força e guarda; storage bloqueado não quebra", () => {
    const s = memoria();
    expect(versaoDaLp("quiz", "?captura=card", s)).toBe("card");
    expect(versaoDaLp("sorteio", "?captura=quiz_longo", s)).toBe("quiz_longo");
    expect(versaoDaLp("sorteio", "", s)).toBe("quiz_longo");
    const quebrado: Armazenamento = { getItem: () => { throw new Error("x"); }, setItem: () => { throw new Error("x"); } };
    expect(["card", "quiz_curto", "quiz_longo"]).toContain(versaoDaLp("sorteio", "", quebrado));
  });
});

// ---------------------------------------------------------------- eventos (bloco 9)
describe("eventos do dataLayer", () => {
  let dataLayer: Record<string, unknown>[];
  beforeEach(() => {
    dataLayer = [];
    vi.stubGlobal("window", { dataLayer });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("nome do evento de tela igual ao exemplo do PDF", () => {
    expect(nomeEventoTela("visto", 4, "desafio")).toBe("quiz_visto_4_desafio");
    expect(nomeEventoTela("respondido", 4, "desafio")).toBe("quiz_respondido_4_desafio");
  });

  it("vista e respondida uma vez por tela, com versão, lp_origem e page_id", () => {
    const t = criarRastreioDeTelas("SITES", "quiz_curto");
    t.visto(1, "nome");
    t.visto(1, "nome");
    t.respondido(1, "nome");
    t.visto(2, "tipo");
    expect(dataLayer).toEqual([
      { event: "quiz_visto_1_nome", lp_origem: "sites", page_id: "SITES", versao_captura: "quiz_curto", tela_numero: 1, tela_nome: "nome" },
      { event: "quiz_respondido_1_nome", lp_origem: "sites", page_id: "SITES", versao_captura: "quiz_curto", tela_numero: 1, tela_nome: "nome" },
      { event: "quiz_visto_2_tipo", lp_origem: "sites", page_id: "SITES", versao_captura: "quiz_curto", tela_numero: 2, tela_nome: "tipo" },
    ]);
  });

  it("nome fora do catálogo não entra", () => {
    expect(() => pushCaptura("lead_nome_ana", { page_id: "SITES", versao_captura: "card" })).toThrow();
  });

  const ID = "8f0c7a52-1d34-4b6e-9a77-0f2f5c1d9e10";
  const ok = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;

  it("quiz enviado: quiz_enviado + generate_lead com versão, perfil do servidor e event_id; nada pessoal", async () => {
    const fetchFn = ok({ ok: true, id: ID, perfil: "B" });
    const out = await enviarCaptura({ pageId: "SITES", versao: "quiz_longo", respostas: curtoCompleto, respondentId: ID, tracking: { utm_source: "meta" }, fetchFn });
    expect(out).toEqual({ kind: "ok", perfil: "B" });
    expect(dataLayer.map((e) => e.event)).toEqual(["quiz_enviado", "generate_lead"]);
    expect(dataLayer[0]).toEqual({ event: "quiz_enviado", lp_origem: "sites", page_id: "SITES", versao_captura: "quiz_longo", event_id: ID, perfil: "B" });
    const tudo = JSON.stringify(dataLayer);
    for (const pessoal of ["Ana", "99999", "clinicaana", "ClinicaAna"]) expect(tudo).not.toContain(pessoal);
    // corpo enviado: versão, respostas, página; sem perfil (o servidor calcula)
    const body = JSON.parse((fetchFn as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0]![1].body as string);
    expect(body).toMatchObject({ page: "SITES", versao: "quiz_longo", respondentId: ID });
    expect(body).not.toHaveProperty("perfil");
  });

  it("card enviado: card_formulario_enviado; erro 422 vira form_error com os campos", async () => {
    await enviarCaptura({ pageId: "SITES", versao: "card", respostas: curtoCompleto, respondentId: ID, tracking: {}, fetchFn: ok({ ok: true, perfil: "A" }) });
    expect(dataLayer[0]).toMatchObject({ event: "card_formulario_enviado", versao_captura: "card", perfil: "A" });
    dataLayer.length = 0;
    const f422 = vi.fn(async () => new Response(JSON.stringify({ ok: false, errors: { whatsapp: "x" } }), { status: 422 })) as unknown as typeof fetch;
    const out = await enviarCaptura({ pageId: "SITES", versao: "card", respostas: curtoCompleto, respondentId: ID, tracking: {}, fetchFn: f422 });
    expect(out).toEqual({ kind: "erros", erros: { whatsapp: "x" } });
    expect(dataLayer).toEqual([{ event: "form_error", lp_origem: "sites", page_id: "SITES", versao_captura: "card", error_type: "validation", fields: "whatsapp" }]);
  });
});

// ---------------------------------------------------------------- galeria (bloco 2 + ajustes do Philip, 26/10)
describe("galeria do portfólio", () => {
  it("todo case tem descrição curta (sem travessão) e é provisório; selo desligado e sem etiqueta no cartão", async () => {
    const { PORTFOLIO_CASES, filtrosVisiveis } = await import("@/content/sites-portfolio");
    const { MOSTRAR_SELO_PROVISORIO } = await import("@/content/sites");
    expect(MOSTRAR_SELO_PROVISORIO).toBe(false);
    for (const c of PORTFOLIO_CASES) {
      expect(c.descricao.length, c.id).toBeGreaterThan(10);
      expect(c.descricao.length, c.id).toBeLessThanOrEqual(70);
      expect(c.descricao, c.id).not.toMatch(/[—–]/);
      expect(c.descricao, c.id).not.toMatch(/incr[ií]vel|exclusiv|premium|transform|revolucion|inesquec/i);
      expect(c.provisorio).toBe(true);
    }
    // filtros continuam vindo dos tipos; Clínicas sem case não aparece
    expect(filtrosVisiveis()).toEqual(["Institucional", "Captura de leads", "Lançamento", "Loja virtual", "Advocacia"]);
    const g = fs.readFileSync(path.resolve(__dirname, "../../components/sites/Galeria.tsx"), "utf8");
    expect(g).not.toContain("c.etiquetas.map");
    expect(g).toContain("c.descricao");
    // troca animada: layoutId do filtro, AnimatePresence, reduced-motion e altura reservada
    for (const t of ["layoutId", "AnimatePresence", "useReducedMotion", "minHeight"]) expect(g).toContain(t);
  });

  it("Âncora Prime mostra o site de consórcio, não a página de links da bio", async () => {
    const { PORTFOLIO_CASES } = await import("@/content/sites-portfolio");
    const a = PORTFOLIO_CASES.find((c) => c.id === "ancora")!;
    expect(a.celular.height).toBeGreaterThan(1000); // a página de links tinha 649 px
    const cfgSrc = fs.readFileSync(path.resolve(__dirname, "../../content/sites-portfolio.ts"), "utf8");
    expect(cfgSrc).toContain("ancoraprime.com/consorcios");
  });
});
