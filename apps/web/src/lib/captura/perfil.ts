import { ANUNCIOS_SITES, FATURAMENTOS_SITES, PRAZOS_SITES } from "@/content/captura/sites";

// ============================================================
// PERFIL A, B, C ou D da LP de sites (bloco 8 do briefing v2.2). SÓ NO SERVIDOR: este arquivo é importado
// apenas por lib/lead-service.ts (um teste garante que nenhum componente "use client" o importa). O perfil
// vai ao COMERCIAL (campo "Perfil") e volta na resposta do /api/lead só para o evento final do dataLayer;
// nenhuma tela mostra o perfil.
//
// Regra exata do documento, soma de 3 notas:
//   Faturamento  2: de R$ 50.000 pra cima | 1: de R$ 10.000 até R$ 50.000, ou Zero com capital | 0: abaixo de R$ 10.000 ou Zero (Empresa nova)
//   Anúncio      2: com agência ou gestor agora | 1: por conta própria, amigo ou parente, agência no passado | 0: nunca
//   Prazo        2: pra ontem | 1: até 30 dias | 0: de 1 a 3 meses ou sem pressa
//   Perfil       A: 5 ou 6 | B: 3 ou 4 | C: 2 | D: 0 ou 1
// As tabelas abaixo cobrem TODAS as opções (o teste quebra se uma opção nova ficar sem nota).
// ============================================================

export type Perfil = "A" | "B" | "C" | "D";

type Faturamento = (typeof FATURAMENTOS_SITES)[number];
type Anuncio = (typeof ANUNCIOS_SITES)[number];
type Prazo = (typeof PRAZOS_SITES)[number];

export const NOTA_FATURAMENTO: Record<Faturamento, 0 | 1 | 2> = {
  "Mais de R$ 1.000.000": 2,
  "De R$ 500.000 até R$ 1.000.000": 2,
  "De R$ 200.000 até R$ 500.000": 2,
  "De R$ 100.000 até R$ 200.000": 2,
  "De R$ 70.000 até R$ 100.000": 2,
  "De R$ 50.000 até R$ 70.000": 2,
  "De R$ 30.000 até R$ 50.000": 1,
  "De R$ 10.000 até R$ 30.000": 1,
  "Abaixo de R$ 10.000": 0,
  "Zero (Empresa nova)": 0,
  "Zero (Empresa nova. Mas tenho capital para investir)": 1,
};

export const NOTA_ANUNCIO: Record<Anuncio, 0 | 1 | 2> = {
  "Nunca fiz anúncios": 0,
  "Já fiz anúncios por conta própria": 1,
  "Um amigo ou parente fez alguns anúncios pra mim": 1,
  "Já contratei uma agência no passado": 1,
  "Estou com uma agência ou gestor agora": 2,
};

export const NOTA_PRAZO: Record<Prazo, 0 | 1 | 2> = {
  "Pra ontem, o quanto antes": 2,
  "Até 30 dias": 1,
  "De 1 a 3 meses": 0,
  "Sem pressa": 0,
};

const nota = <K extends string>(tabela: Record<K, number>, v: string): number => (v in tabela ? tabela[v as K] : 0);

export function pontosSites(r: { faturamento: string; anuncios: string; prazo: string }): number {
  return nota(NOTA_FATURAMENTO, r.faturamento) + nota(NOTA_ANUNCIO, r.anuncios) + nota(NOTA_PRAZO, r.prazo);
}

export function perfilDosPontos(total: number): Perfil {
  if (total >= 5) return "A";
  if (total >= 3) return "B";
  if (total === 2) return "C";
  return "D";
}

export function perfilSites(r: { faturamento: string; anuncios: string; prazo: string }): Perfil {
  return perfilDosPontos(pontosSites(r));
}
