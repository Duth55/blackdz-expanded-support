import Link from "next/link";
import { money, VIP_PRICE_CENTS, VIP_ROLE_NAME } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">DBC: BLACKDZ VIP</div>
            <h1>Entre para a área <span>V.I.P.</span></h1>
            <p>Apoie o desenvolvimento do DBC: BlackDz Expanded e desbloqueie o cargo oficial V.I.P, canais exclusivos e benefícios especiais dentro da BlackDz Community.</p>
            <div className="hero-actions">
              <Link href="/vip" className="btn btn-primary btn-large">Conhecer o V.I.P</Link>
              <Link href="/api/auth/discord/start" className="btn btn-secondary btn-large">Entrar com Discord</Link>
            </div>
            <div className="trust-row">
              <span>✓ Login pelo Discord</span>
              <span>✓ Análise manual pela staff</span>
              <span>✓ Cargo liberado após confirmação</span>
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
              <span className="hero-card-label">ACESSO OFICIAL</span>
              <strong>DBC: BlackDz VIP</strong>
              <p>{VIP_ROLE_NAME}</p>
              <div className="hero-tier-row"><span>💎</span><span>⚡</span><span>🐉</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="container stats-grid">
          <div><strong>1</strong><span>V.I.P oficial</span></div>
          <div><strong>{money(VIP_PRICE_CENTS)}</strong><span>Valor configurável</span></div>
          <div><strong>Discord</strong><span>Conta vinculada</span></div>
          <div><strong>Staff</strong><span>Confirmação manual</span></div>
        </div>
      </section>

      <section className="section container single-product-section">
        <div className="section-heading">
          <div><span className="eyebrow">V.I.P OFICIAL</span><h2>Um acesso. Benefícios exclusivos.</h2></div>
          <p>Sem cobrança automática. Você realiza o pagamento, envia os dados para conferência e acompanha o pedido pela sua área V.I.P.</p>
        </div>
        <article className="vip-product-card featured">
          <div className="vip-product-top"><span className="plan-icon giant">💎</span><span className="featured-tag">V.I.P</span></div>
          <h3>V.I.P - DBC: BlackDz Expanded</h3>
          <p className="vip-product-description">Ajude diretamente o desenvolvimento do projeto e tenha acesso à área exclusiva da comunidade.</p>
          <div className="plan-price"><strong>{money(VIP_PRICE_CENTS)}</strong></div>
          <ul className="benefit-list">
            <li>Cargo exclusivo <strong>V.I.P - DBC: BlackDz Expanded</strong></li>
            <li>Acesso aos canais V.I.P da BlackDz Community</li>
            <li>Conteúdos, novidades e spoilers exclusivos</li>
            <li>Participação mais próxima do desenvolvimento</li>
            <li>Pedido acompanhado pelo site até a aprovação</li>
          </ul>
          <Link href="/checkout/vip" className="btn btn-primary btn-wide">Quero ser V.I.P</Link>
        </article>
      </section>

      <section className="section container feature-section">
        <div className="feature-card"><span className="feature-number">01</span><h3>Entre com Discord</h3><p>Assim o sistema sabe exatamente em qual conta liberar o cargo.</p></div>
        <div className="feature-card"><span className="feature-number">02</span><h3>Envie o pagamento</h3><p>Informe o nome do titular que pagou e, se quiser, anexe o comprovante.</p></div>
        <div className="feature-card"><span className="feature-number">03</span><h3>A staff confere</h3><p>O pedido chega no Discord com botões para confirmar ou recusar. Só depois da conferência o cargo é liberado.</p></div>
      </section>
    </>
  );
}
