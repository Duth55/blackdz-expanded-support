import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getUserOrders, hasDatabase } from "@/lib/db";
import { hasVipRole } from "@/lib/discord";
import { OrderStatus } from "@/components/order-status";
import { money, VIP_PRICE_CENTS, VIP_ROLE_NAME } from "@/lib/config";

function avatarUrl(id: string, avatar?: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=128`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/discord/start?returnTo=/dashboard");
  const orders = hasDatabase() ? await getUserOrders(session.id, 20) : [];
  const vipActive = await hasVipRole(session.id).catch(() => false);

  return (
    <div className="container page-shell dashboard-shell">
      <section className="account-banner">
        <img src={avatarUrl(session.id, session.avatar)} alt="Avatar do Discord" />
        <div><span className="eyebrow">MINHA ÁREA V.I.P</span><h1>{session.globalName || session.username}</h1><p>@{session.username} · Discord conectado</p></div>
      </section>

      {!hasDatabase() && <div className="notice warning"><strong>Banco ainda não configurado.</strong><p>Adicione DATABASE_URL na Vercel para registrar e acompanhar pedidos.</p></div>}

      <section className="dashboard-grid manual-dashboard-grid">
        <article className="dashboard-card subscription-card">
          <div className="card-head"><span>Meu V.I.P</span><span className={`order-status ${vipActive ? "approved" : "pending"}`}>{vipActive ? "✅ Ativo" : "◇ Não ativo"}</span></div>
          <h2>{VIP_ROLE_NAME}</h2>
          <div className="big-price">{money(VIP_PRICE_CENTS)}</div>
          <p className="muted">O cargo é liberado depois que a staff confirma manualmente o pagamento.</p>
          {!vipActive && <Link href="/checkout/vip" className="btn btn-primary">Comprar V.I.P</Link>}
        </article>

        <article className="dashboard-card">
          <div className="card-head"><span>Como funciona</span></div>
          <ol className="process-list">
            <li><b>1</b><span>Você efetua o pagamento.</span></li>
            <li><b>2</b><span>Envia os dados e comprovante.</span></li>
            <li><b>3</b><span>A staff confere no Discord.</span></li>
            <li><b>4</b><span>O bot libera seu cargo.</span></li>
          </ol>
        </article>
      </section>

      <section className="section dashboard-card orders-section">
        <div className="section-heading small-heading"><div><span className="eyebrow">PEDIDOS</span><h2>Histórico</h2></div></div>
        <div className="order-history-list">
          {orders.map((order) => (
            <Link href={`/pedido/${order.id}`} className="order-history-card" key={order.id}>
              <div><strong>{order.id}</strong><span>{new Date(order.created_at).toLocaleString("pt-BR")}</span></div>
              <div><span>{money(order.amount_cents)}</span><OrderStatus status={order.status} /></div>
            </Link>
          ))}
          {!orders.length && <div className="empty-state">Você ainda não enviou nenhum pedido V.I.P.</div>}
        </div>
      </section>
    </div>
  );
}
