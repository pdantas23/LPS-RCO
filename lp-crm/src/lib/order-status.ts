/**
 * Contrato com o SERVIDOR que conhece o status real do pagamento (webhook/consulta do provedor).
 * O navegador nunca decide que houve compra: chegar na página de retorno não é pagamento.
 *
 * GET <endpoint>?ref=<referência do pedido>
 *   200 { status: "approved" | "pending" | "refused", transaction_id, value_cents, currency, plan_id }
 */
export type OrderStatus =
  | { status: "approved"; transactionId: string; valueCents: number; currency: string; planId: string }
  | { status: "pending" }
  | { status: "refused" }
  | { status: "unknown"; reason: "config" | "missing_ref" | "network" | "http" | "invalid" };

export async function fetchOrderStatus(
  endpoint: string,
  ref: string | null,
  fetchImpl: typeof fetch = (...a) => fetch(...a),
  timeoutMs = 15000,
): Promise<OrderStatus> {
  if (!endpoint) return { status: "unknown", reason: "config" };
  if (!ref || !/^[A-Za-z0-9_-]{4,128}$/.test(ref)) return { status: "unknown", reason: "missing_ref" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    const url = new URL(endpoint);
    url.searchParams.set("ref", ref);
    res = await fetchImpl(url.toString(), { signal: ctrl.signal, headers: { Accept: "application/json" } });
  } catch {
    return { status: "unknown", reason: "network" };
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return { status: "unknown", reason: "http" };

  let b: Record<string, unknown>;
  try {
    b = (await res.json()) as Record<string, unknown>;
  } catch {
    return { status: "unknown", reason: "invalid" };
  }
  if (b.status === "pending") return { status: "pending" };
  if (b.status === "refused") return { status: "refused" };
  if (
    b.status === "approved" &&
    typeof b.transaction_id === "string" &&
    b.transaction_id.length > 0 &&
    Number.isInteger(b.value_cents) &&
    (b.value_cents as number) >= 0 &&
    typeof b.currency === "string" &&
    typeof b.plan_id === "string"
  ) {
    return {
      status: "approved",
      transactionId: b.transaction_id,
      valueCents: b.value_cents as number,
      currency: b.currency,
      planId: b.plan_id,
    };
  }
  return { status: "unknown", reason: "invalid" };
}
