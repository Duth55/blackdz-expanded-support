import type { VipOrderStatus } from "@/lib/db";

export function OrderStatus({ status }: { status: VipOrderStatus }) {
  const map = {
    pending: { label: "Em análise", icon: "⏳", cls: "pending" },
    approved: { label: "Aprovado", icon: "✅", cls: "approved" },
    rejected: { label: "Recusado", icon: "❌", cls: "rejected" },
  } as const;
  const item = map[status];
  return <span className={`order-status ${item.cls}`}>{item.icon} {item.label}</span>;
}
