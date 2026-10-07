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
            <div className="eyebrow">DBC: BLACKDZ VIP</div>
            <h1>Faça parte de um nível <span>acima.</span></h1>
            <p>Entre para a área VIP do DBC: BlackDz Expanded, fortaleça o desenvolvimento do projeto e desbloqueie benefícios exclusivos dentro da BlackDz Community.</p>
            <div className="hero-actions">
              <Link href="/vip" className="btn btn-primary btn-large">Ver planos VIP</Link>
              <Link href="/api/auth/discord/start" className="btn btn-secondary btn-large">Entrar com Discord</Link>
            </div>
            <div className="trust-row">
              <span>✓ Login pelo Discord</span>
              <span>✓ Cargos automáticos</span>
              <span>✓ Área VIP exclusiva</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="energy-ring ring-one" />
            <div className="energy-ring ring-two" />
            <div className="vip-orbit orbit-one" />
            <div className="vip-orbit orbit-two" />
            <div className="hero-card">
              <div className="hero-card-glow" />
              <div className="hero-emblem">DZ</div>
              <span className="hero-card-label">MEMBRO OFICIAL</span>
              <strong>DBC: BlackDz VIP</strong>
              <p>Apoiador · VIP · VIP+</p>
              <div className="hero-tier-row">
                <span>💎</span><span>🌟</span><span>👑</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-grid">
          <div><strong>3</strong><span>Níveis exclusivos</span></div>
          <div><strong>Discord</strong><span>Conta e cargos integrados</span></div>
          <div><strong>Automático</strong><span>Benefícios sincronizados</span></div>
          <div><strong>24/7</strong><span>Área do membro</span></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><span className="eyebrow">PLANOS VIP</span><h2>Escolha seu nível.</h2></div>
          <p>Do Apoiador ao VIP+, cada nível ajuda o BlackDz Expanded a continuar crescendo e libera vantagens próprias na comunidade.</p>
        </div>
        <div className="plans-grid">
          {plans.map((plan) => <PlanCard key={plan.slug} plan={plan} compact />)}
        </div>
      </section>

      <section className="section container feature-section">
        <div className="feature-card">
          <span className="feature-number">01</span>
          <h3>Conecte seu Discord</h3>
          <p>Você entra com a própria conta e o sistema identifica exatamente quem deve receber os benefícios.</p>
        </div>
        <div className="feature-card">
          <span className="feature-number">02</span>
          <h3>Escolha seu nível VIP</h3>
          <p>Apoiador, VIP ou VIP+. Você pode consultar sua assinatura e o status diretamente no painel.</p>
        </div>
        <div className="feature-card">
          <span className="feature-number">03</span>
          <h3>Receba seu cargo</h3>
          <p>Após a confirmação da assinatura, o cargo correspondente é sincronizado no servidor BlackDz Community.</p>
        </div>
      </section>

      <section className="section container cta-box">
        <div>
          <span className="eyebrow">ENTRE PARA O VIP</span>
          <h2>Faça parte da evolução do BlackDz Expanded.</h2>
          <p>Mais conteúdo, mais proximidade com o projeto e uma comunidade que ajuda a construir o que vem depois.</p>
        </div>
        <Link href="/vip" className="btn btn-primary btn-large">Quero ser VIP</Link>
      </section>
    </>
  );
}
