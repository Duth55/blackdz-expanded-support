import Link from "next/link";
import { money } from "@/lib/config";
import type { Plan } from "@/lib/db";

export function PlanCard({ plan, compact = false }: { plan: Plan; compact?: boolean }) {
  return (
    <article className={`plan-card tier-${plan.slug} ${plan.featured ? "featured" : ""}`}>
      {plan.featured && <div className="popular-badge">MAIS ESCOLHIDO</div>}
      <div className="plan-icon">{plan.badge}</div>
      <div className="plan-title-row">
        <span className="plan-level">DBC BLACKDZ VIP</span>
        <h3>{plan.name}</h3>
      </div>
      <p className="muted">{plan.description}</p>
      <div className="price-row">
        <strong>{money(plan.price_cents)}</strong>
        <span>/mês</span>
      </div>
      {!compact && (
        <ul className="benefit-list">
          {plan.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}
        </ul>
      )}
      <Link href={`/checkout/${plan.slug}`} className={`btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}>
        Quero ser {plan.name}
      </Link>
      <small className="role-hint">Cargo do Discord liberado automaticamente após a confirmação.</small>
    </article>
  );
}
