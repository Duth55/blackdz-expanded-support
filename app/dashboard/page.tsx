import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLatestSubscription, hasDatabase } from "@/lib/db";
import { StatusPill } from "@/components/status-pill";
import { DashboardActions } from "@/components/dashboard-actions";
import { money } from "@/lib/config";

function avatarUrl(id: string, avatar?: string | null) {
  if (!avatar) return `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id) >> 22n) % 6}.png`;
  return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=128`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/discord/start?returnTo=/dashboard");
  const sub = await getLatestSubscription(session.id);

  return (
    <div className="container page-shell dashboard-shell">
      <section className="account-banner">
        <img src={avatarUrl(session.id, session.avatar)} alt="Avatar do Discord" />
        <div><span className="eyebrow">MINHA CONTA</span><h1>{session.globalName || session.username}</h1><p>@{session.username} · Discord ID {session.id}</p></div>
      </section>

      {!hasDatabase() && <div className="notice warning"><strong>Banco ainda não configurado.</strong><p>O login funciona, mas assinaturas e histórico só serão persistidos depois que DATABASE_URL for adicionada.</p></div>}

      <section className="dashboard-grid">
        <article className="dashboard-card subscription-card">
          <div className="card-head"><span>Assinatura</span>{sub ? <StatusPill status={sub.status} /> : <StatusPill status="inactive" />}</div>
          {sub ? (
            <>
              <h2>{sub.plan_name || sub.plan_slug}</h2>
              <div className="big-price">{money(Number(sub.price_cents || 0))}<span>/mês</span></div>
              <dl className="details-list">
                <div><dt>Provedor</dt><dd>{sub.provider === "picpay" ? "PicPay" : sub.provider === "demo" ? "Teste" : "Manual"}</dd></div>
                <div><dt>Início</dt><dd>{new Date(sub.started_at).toLocaleDateString("pt-BR")}</dd></div>
                <div><dt>Próxima referência</dt><dd>{sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}</dd></div>
              </dl>
              <DashboardActions canCancel={sub.status === "active" || sub.status === "pending"} />
            </>
          ) : (
            <>
              <h2>Nenhuma assinatura ativa</h2>
              <p className="muted">Escolha um plano para apoiar o projeto e desbloquear seus benefícios.</p>
              <DashboardActions canCancel={false} />
            </>
          )}
        </article>

        <article className="dashboard-card">
          <div className="card-head"><span>Discord</span><span className="mini-ok">CONECTADO</span></div>
          <h2>BlackDz Community</h2>
          <p className="muted">A conta usada no site é a mesma que receberá o cargo de apoiador.</p>
          {sub?.role_id && <div className="role-display"><span>Cargo configurado</span><strong>{sub.role_id}</strong></div>}
        </article>

        <article className="dashboard-card">
          <div className="card-head"><span>Segurança</span><span>🔒</span></div>
          <h2>Pagamento protegido</h2>
          <p className="muted">O site não armazena número completo do cartão nem CVV. No fluxo real, a tokenização é feita pelo checkout do PicPay.</p>
        </article>
      </section>
    </div>
  );
}
