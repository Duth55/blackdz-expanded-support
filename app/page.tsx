import Link from "next/link";
import { PlanCard } from "@/components/plan-card";
import { getPlans } from "@/lib/db";

export default async function HomePage() {
  const plans = await getPlans();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">BLACKDZ EXPANDED SUPPORT</div>
            <h1>Ajude o projeto a <span>ir além.</span></h1>
            <p>Seu apoio mantém o DBC: BlackDz Expanded evoluindo e ainda libera benefícios exclusivos dentro da BlackDz Community.</p>
            <div className="hero-actions">
              <Link href="/apoie" className="btn btn-primary btn-large">Ver planos</Link>
              <Link href="/api/auth/discord/start" className="btn btn-secondary btn-large">Entrar com Discord</Link>
            </div>
            <div className="trust-row">
              <span>✓ Login Discord</span>
              <span>✓ Cargo automático</span>
              <span>✓ Pagamento recorrente</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="energy-ring ring-one" />
            <div className="energy-ring ring-two" />
            <div className="hero-card">
              <div className="hero-emblem">DZ</div>
              <span className="hero-card-label">SUPPORTER SYSTEM</span>
              <strong>BlackDz Expanded</strong>
              <div className="hero-tier-row">
                <span>💎</span><span>🌟</span><span>👑</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-grid">
          <div><strong>3</strong><span>Níveis de apoio</span></div>
          <div><strong>Discord</strong><span>Benefícios integrados</span></div>
          <div><strong>PicPay</strong><span>Recorrência preparada</span></div>
          <div><strong>24/7</strong><span>Painel do apoiador</span></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><span className="eyebrow">PLANOS</span><h2>Escolha como apoiar</h2></div>
          <p>Comece em qualquer nível. Os cargos e benefícios são ligados automaticamente à sua conta do Discord.</p>
        </div>
        <div className="plans-grid">
          {plans.map((plan) => <PlanCard key={plan.slug} plan={plan} compact />)}
        </div>
      </section>

      <section className="section container feature-section">
        <div className="feature-card">
          <span className="feature-number">01</span>
          <h3>Entre com Discord</h3>
          <p>O site identifica sua conta e sabe exatamente em quem liberar o cargo.</p>
        </div>
        <div className="feature-card">
          <span className="feature-number">02</span>
          <h3>Escolha seu nível</h3>
          <p>Apoiador, Apoiador+ ou VIP. Cada plano é mensal e pode ser gerenciado pelo painel.</p>
        </div>
        <div className="feature-card">
          <span className="feature-number">03</span>
          <h3>Receba seus benefícios</h3>
          <p>Com a assinatura ativa, o sistema sincroniza o cargo correspondente no servidor oficial.</p>
        </div>
      </section>

      <section className="section container cta-box">
        <div>
          <span className="eyebrow">FAÇA PARTE</span>
          <h2>Ajude a construir a próxima fase.</h2>
          <p>Seu apoio fortalece o desenvolvimento, testes, infraestrutura e crescimento da comunidade.</p>
        </div>
        <Link href="/apoie" className="btn btn-primary btn-large">Quero apoiar</Link>
      </section>
    </>
  );
}
