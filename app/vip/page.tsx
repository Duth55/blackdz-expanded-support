import { PlanCard } from "@/components/plan-card";
import { getPlans } from "@/lib/db";

export default async function VipPlansPage() {
  const plans = await getPlans();
  return (
    <div className="container page-shell">
      <section className="page-hero centered vip-page-hero">
        <span className="eyebrow">DBC: BLACKDZ VIP</span>
        <h1>Escolha seu nível VIP</h1>
        <p>Conecte seu Discord, escolha o plano ideal e acompanhe tudo pela sua área VIP. Os cargos são vinculados à mesma conta usada no login.</p>
      </section>

      <section className="plans-grid full-plans">
        {plans.map((plan) => <PlanCard key={plan.slug} plan={plan} />)}
      </section>

      <section className="faq-grid section">
        <article><span>01</span><h3>Posso cancelar?</h3><p>Sim. O cancelamento pode ser solicitado pela sua área VIP. Quando ele for confirmado, os benefícios vinculados à assinatura são encerrados.</p></article>
        <article><span>02</span><h3>Preciso estar no servidor?</h3><p>Sim. Para o bot entregar o cargo, a conta do Discord usada no site precisa estar na BlackDz Community.</p></article>
        <article><span>03</span><h3>O que é o DBC: BlackDz VIP?</h3><p>É o sistema oficial de apoio e benefícios do DBC: BlackDz Expanded, integrado diretamente ao Discord e administrado pelo próprio projeto.</p></article>
        <article><span>04</span><h3>Como recebo o cargo?</h3><p>Depois que uma assinatura real for confirmada pelo provedor de pagamento, o sistema sincroniza automaticamente o cargo Apoiador, VIP ou VIP+.</p></article>
      </section>
    </div>
  );
}
