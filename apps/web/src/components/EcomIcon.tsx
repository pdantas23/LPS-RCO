import { createElement } from "react";
import {
  BadgeDollarSign, Calculator, CalendarCheck, ChartColumnIncreasing, ChartNoAxesCombined, CheckCheck, ClipboardCheck,
  ClipboardList, CreditCard, Image as ImageIcon, Images, ListChecks, Megaphone, MessageSquareWarning, MessagesSquare,
  MousePointerClick, Package, PackageCheck, Receipt, ShoppingBag, ShoppingCart, SlidersHorizontal, Store, Target,
  TrendingUp, Truck, Wallet, type LucideIcon,
} from "lucide-react";

/** Ícones Lucide usados pela /lp-ecom, pelo nome que está em content/ecom.ts. Traço uniforme (strokeWidth 1.75). */
const ICONS: Record<string, LucideIcon> = {
  "badge-dollar-sign": BadgeDollarSign,
  calculator: Calculator,
  "calendar-check": CalendarCheck,
  "chart-column-increasing": ChartColumnIncreasing,
  "chart-no-axes-combined": ChartNoAxesCombined,
  "check-check": CheckCheck,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  "credit-card": CreditCard,
  image: ImageIcon,
  images: Images,
  "list-checks": ListChecks,
  megaphone: Megaphone,
  "message-square-warning": MessageSquareWarning,
  "messages-square": MessagesSquare,
  "mouse-pointer-click": MousePointerClick,
  package: Package,
  "package-check": PackageCheck,
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  "sliders-horizontal": SlidersHorizontal,
  store: Store,
  target: Target,
  "trending-up": TrendingUp,
  truck: Truck,
  wallet: Wallet,
};

export function iconOf(name: string): LucideIcon {
  const icon = ICONS[name];
  if (!icon) throw new Error(`ícone desconhecido na /lp-ecom: ${name}`);
  return icon;
}

export function EcomIcon({ name, className = "size-6" }: { name: string; className?: string }) {
  return createElement(iconOf(name), { "aria-hidden": true, strokeWidth: 1.75, className });
}
