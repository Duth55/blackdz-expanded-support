import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";
import { listVipOrders } from "@/lib/db";
import { AdminOrders } from "@/components/admin-orders";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/discord/start?returnTo=/admin");
  if (session.id !== OWNER_DISCORD_ID) redirect("/dashboard");
  const orders = await listVipOrders(200);
  const pending = orders.filter((x) => x.status === "pending").length;
  const approved = orders.filter((x) => x.status === "approved").length;
  const rejected = orders.filter((x) => x.status === "rejected").length;

  return (
    <div className="container page-shell admin-shell">
      <section className="page-hero"><span className="eyebrow">ADMIN • DBC: BLACKDZ VIP</span><h1>Pedidos V.I.P</h1><p>Além dos botões no Discord, você pode acompanhar e analisar pedidos por aqui como alternativa.</p></section>
      <section className="admin-stat-grid">
        <div><strong>{pending}</strong><span>Em análise</span></div>
        <div><strong>{approved}</strong><span>Aprovados</span></div>
        <div><strong>{rejected}</strong><span>Recusados</span></div>
        <div><strong>{orders.length}</strong><span>Total</span></div>
      </section>
      <section className="admin-panel"><AdminOrders orders={orders} /></section>
    </div>
  );
}
