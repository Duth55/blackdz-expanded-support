"use client";

import { useState } from "react";
import type { Plan } from "@/lib/db";

export function AdminConsole({ plans }: { plans: Plan[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function api(url: string, body?: unknown) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha na operação.");
      setMessage(data.message || "Operação concluída.");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-console">
      {message && <div className="notice info">{message}</div>}

      <section className="admin-panel">
        <div className="section-heading small-heading">
          <div><span className="eyebrow">ASSINATURAS</span><h2>Conceder manualmente</h2></div>
        </div>
        <form className="admin-form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          api("/api/admin/subscription", {
            action: "grant",
            discordUserId: String(f.get("discordUserId")),
            planSlug: String(f.get("planSlug")),
            days: Number(f.get("days") || 30),
          });
        }}>
          <label>ID do usuário Discord<input name="discordUserId" required /></label>
          <label>Plano<select name="planSlug">{plans.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}</select></label>
          <label>Dias<input name="days" type="number" min="1" defaultValue="30" required /></label>
          <button className="btn btn-primary" disabled={loading}>Conceder + cargo</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="section-heading small-heading">
          <div><span className="eyebrow">PICPAY</span><h2>Sincronizar planos</h2></div>
          <button className="btn btn-secondary" disabled={loading} onClick={() => api("/api/admin/picpay/sync-plans")}>Criar planos faltantes no PicPay</button>
        </div>
        <p className="muted">Use primeiro no Sandbox. Os IDs retornados ficam salvos no banco automaticamente.</p>
      </section>

      <section className="admin-panel">
        <div className="section-heading small-heading"><div><span className="eyebrow">PLANOS</span><h2>Preço e integração</h2></div></div>
        <div className="admin-plan-grid">
          {plans.map(plan => (
            <form key={plan.slug} className="admin-plan-card" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              api("/api/admin/plan", {
                slug: plan.slug,
                priceCents: Math.round(Number(f.get("price")) * 100),
                active: f.get("active") === "on",
                picpayPlanId: String(f.get("picpayPlanId") || "") || null,
              });
            }}>
              <strong>{plan.badge} {plan.name}</strong>
              <label>Preço (R$)<input name="price" type="number" step="0.01" min="1" defaultValue={(plan.price_cents / 100).toFixed(2)} /></label>
              <label>ID do plano PicPay<input name="picpayPlanId" defaultValue={plan.picpay_plan_id || ""} /></label>
              <label className="check-row"><input name="active" type="checkbox" defaultChecked={plan.active} /> Plano ativo</label>
              <button className="btn btn-secondary" disabled={loading}>Salvar</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
