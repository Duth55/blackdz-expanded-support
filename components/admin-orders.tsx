"use client";

import { useState } from "react";
import type { VipOrder } from "@/lib/db";
import { OrderStatus } from "@/components/order-status";

export function AdminOrders({ orders }: { orders: VipOrder[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function review(orderId: string, action: "approve" | "reject") {
    let reason = "";
    if (action === "reject") {
      reason = window.prompt("Motivo da recusa:", "Pagamento não localizado pela staff.") || "";
      if (!reason.trim()) return;
    }
    setBusy(orderId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/orders/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action, reason }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao analisar pedido.");
      setMessage(data.message || "Pedido atualizado.");
      setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="admin-orders-wrap">
      {message && <div className="notice info">{message}</div>}
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead><tr><th>Pedido</th><th>Discord</th><th>Pagador</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><a href={`/pedido/${order.id}`}><strong>{order.id}</strong></a><small>{new Date(order.created_at).toLocaleString("pt-BR")}</small></td>
                <td><code>{order.discord_username}</code><small>{order.discord_user_id}</small></td>
                <td>{order.payer_name}<small>{order.payment_method}</small></td>
                <td>R$ {(order.amount_cents / 100).toFixed(2).replace(".", ",")}</td>
                <td><OrderStatus status={order.status} /></td>
                <td>
                  {order.status === "pending" ? (
                    <div className="table-actions">
                      <button className="mini-action approve" disabled={busy === order.id} onClick={() => review(order.id, "approve")}>Confirmar</button>
                      <button className="mini-action reject" disabled={busy === order.id} onClick={() => review(order.id, "reject")}>Recusar</button>
                    </div>
                  ) : <span className="muted">Finalizado</span>}
                </td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={6}><div className="empty-state">Nenhum pedido recebido ainda.</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
