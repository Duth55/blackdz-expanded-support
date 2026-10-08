import { redirect } from "next/navigation";
import { ManualCheckoutForm } from "@/components/manual-checkout-form";
import { getSession } from "@/lib/session";
import { getPendingOrderForUser, hasDatabase } from "@/lib/db";
import { PAYMENT_METHOD_LABEL, PAYMENT_PIX_KEY, PAYMENT_RECEIVER_LABEL, VIP_PRICE_CENTS, money } from "@/lib/config";
import { hasVipRole, isGuildMember } from "@/lib/discord";

export default async function VipCheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/api/auth/discord/start?returnTo=/checkout/vip");

  const pending = hasDatabase() ? await getPendingOrderForUser(session.id) : null;
  const inGuild = await isGuildMember(session.id).catch(() => false);
  const alreadyVip = inGuild ? await hasVipRole(session.id).catch(() => false) : false;

  return (
    <div className="container page-shell checkout-page">
      <section className="checkout-summary">
        <span className="eyebrow">COMPRA MANUAL</span>
        <div className="plan-icon giant">💎</div>
        <h1>DBC: BlackDz VIP</h1>
        <div className="checkout-price"><strong>{money(VIP_PRICE_CENTS)}</strong></div>
        <p>Faça o pagamento e envie os dados para a staff conferir. Nenhuma cobrança automática será feita pelo site.</p>
        <ul className="benefit-list">
          <li>Cargo V.I.P exclusivo</li>
          <li>Canais exclusivos liberados</li>
          <li>Conteúdos e benefícios da área V.I.P</li>
          <li>Apoio direto ao DBC: BlackDz Expanded</li>
        </ul>
      </section>

      <section className="checkout-panel">
        {!hasDatabase() ? (
          <div className="notice error"><strong>Banco não configurado.</strong><p>Adicione DATABASE_URL na Vercel antes de receber pedidos.</p></div>
        ) : !inGuild ? (
          <div className="notice warning"><strong>Você ainda não está na BlackDz Community.</strong><p>Entre no servidor com essa mesma conta do Discord antes de enviar o pedido, pois o cargo precisa ser entregue nela.</p></div>
        ) : alreadyVip ? (
          <div className="success-panel"><span>✅</span><h2>Você já possui o V.I.P!</h2><p>O cargo já está ativo na sua conta do Discord.</p><a className="btn btn-secondary" href="/dashboard">Abrir minha área V.I.P</a></div>
        ) : pending ? (
          <div className="pending-panel"><span>⏳</span><h2>Você já possui um pedido em análise.</h2><p>Não é necessário enviar outro pagamento. Acompanhe o pedido atual enquanto a staff realiza a conferência.</p><a className="btn btn-primary" href={`/pedido/${pending.id}`}>Acompanhar {pending.id}</a></div>
        ) : (
          <ManualCheckoutForm
            priceLabel={money(VIP_PRICE_CENTS)}
            paymentMethod={PAYMENT_METHOD_LABEL}
            pixKey={PAYMENT_PIX_KEY}
            receiverLabel={PAYMENT_RECEIVER_LABEL}
            defaultPayerName={session.globalName || session.username}
          />
        )}
      </section>
    </div>
  );
}
