import "./style.css";
import { checkout } from "./config";
import { fetchOrderStatus, type OrderStatus } from "./lib/order-status";
import { createTracker } from "./lib/tracking";

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const tracker = createTracker(window, local());
tracker.pageView("crm_checkout_return");

/** Referência do pedido devolvida pelo provedor (nome do parâmetro depende do provedor: PENDING). */
const ref = new URLSearchParams(window.location.search).get("ref");

function show(state: OrderStatus["status"] | "checking") {
  for (const s of document.querySelectorAll<HTMLElement>("[data-state]")) s.hidden = s.dataset.state !== state;
}

export async function check(fetchImpl?: typeof fetch): Promise<OrderStatus> {
  show("checking");
  const result = await fetchOrderStatus(checkout.orderStatusEndpoint, ref, fetchImpl);
  // Único ponto que dispara purchase: status aprovado vindo do servidor.
  if (result.status === "approved") tracker.purchase(result);
  show(result.status);
  return result;
}

for (const b of document.querySelectorAll<HTMLButtonElement>("[data-recheck]")) b.addEventListener("click", () => void check());
void check();
