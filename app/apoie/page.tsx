import { PlanCard } from "@/components/plan-card";
import { getPlans } from "@/lib/db";

export default async function SupportPage() {
  const plans = await getPlans();
  return (
    <div className="container page-shell">
      <section className="page-hero centered">
        <span className="eyebrow">APOIE O PROJETO</span>
        <h1>Escolha seu nível de apoio</h1>
        <p>Todos os planos são mensais. Você entra com Discord, conclui a assinatura e recebe o cargo do plano no servidor.</p>
      </section>

      <section className="plans-grid full-plans">
        {plans.map((plan) => <PlanCard key={plan.slug} plan={plan} />)}
      </section>

      <section className="faq-grid section">
        <article><h3>Posso cancelar?</h3><p>Sim. O painel permite cancelar a assinatura. Quando o cancelamento for confirmado, o cargo é removido.</p></article>
        <article><h3>Preciso estar no servidor?</h3><p>Sim. Para o bot conseguir entregar o cargo, sua conta precisa estar na BlackDz Community.</p></article>
        <article><h3>É o Patreon oficial?</h3><p>Não. Este é um sistema próprio do BlackDz Expanded. Os nomes dos cargos atuais podem continuar usando “Patreon”, mas a cobrança acontece pelo sistema configurado no site.</p></article>
        <article><h3>Pix é recorrente?</h3><p>O fluxo de recorrência preparado aqui usa cartão via PicPay. Outros meios podem ser adicionados depois como pagamentos avulsos.</p></article>
      </section>
    </div>
  );
}
