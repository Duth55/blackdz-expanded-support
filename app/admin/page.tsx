import { redirect } from "next/navigation";
import { AdminConsole } from "@/components/admin-console";
import { adminMetrics, getPlans, hasDatabase, listAdminData } from "@/lib/db";
import { money, OWNER_DISCORD_ID } from "@/lib/config";
import { getSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/discord/start?returnTo=/admin");
  if (session.id !== OWNER_DISCORD_ID) redirect("/");

  const plans = await getPlans(true);
  const metrics = await adminMetrics();
  const data = await listAdminData();

  return (
    <div className="container page-shell admin-shell">
      <section className="page-hero">
        <span className="eyebrow">PAINEL ADMIN</span>
        <h1>BlackDz Support</h1>
        <p>Gerencie assinaturas, planos, integração PicPay e sincronização dos cargos do Discord.</p>
      </section>

      {!hasDatabase() && <div className="notice warning"><strong>DATABASE_URL ausente.</strong><p>Conecte um PostgreSQL/Neon para habilitar o painel administrativo completo.</p></div>}

      <section className="metric-grid">
        <div><span>Usuários</span><strong>{metrics.users}</strong></div>
        <div><span>Assinaturas ativas</span><strong>{metrics.active}</strong></div>
        <div><span>MRR estimado</span><strong>{money(metrics.mrrCents)}</strong></div>
        <div><span>Pagamentos confirmados</span><strong>{metrics.payments}</strong></div>
      </section>

      <AdminConsole plans={plans} />

      <section className="admin-panel">
        <div className="section-heading small-heading"><div><span className="eyebrow">RECENTES</span><h2>Assinaturas</h2></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Usuário</th><th>Discord ID</th><th>Plano</th><th>Status</th><th>Provedor</th><th>Criada</th></tr></thead>
            <tbody>
              {(data.subscriptions as any[]).map((s) => (
                <tr key={s.id}><td>{s.global_name || s.username}</td><td><code>{s.discord_user_id}</code></td><td>{s.plan_name}</td><td>{s.status}</td><td>{s.provider}</td><td>{new Date(s.created_at).toLocaleString("pt-BR")}</td></tr>
              ))}
              {data.subscriptions.length === 0 && <tr><td colSpan={6} className="empty-cell">Nenhuma assinatura registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
