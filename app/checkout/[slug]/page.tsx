import { notFound, redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getPlan } from "@/lib/db";
import { getSession } from "@/lib/session";
import { money } from "@/lib/config";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = await getPlan(slug);
  if (!plan || !plan.active) notFound();
  const session = await getSession();
  if (!session) redirect(`/api/auth/discord/start?returnTo=${encodeURIComponent(`/checkout/${slug}`)}`);

  const paymentsMode = process.env.PAYMENTS_MODE || "demo";
  const configured = Boolean(
    process.env.PICPAY_CLIENT_ID &&
    process.env.PICPAY_CLIENT_SECRET &&
    plan.picpay_plan_id &&
    process.env.NEXT_PUBLIC_PICPAY_MERCHANT_CREDENTIAL &&
    process.env.NEXT_PUBLIC_PICPAY_TRANSPARENT_TOKEN
  );

  return (
    <div className="container page-shell checkout-page">
      <section className="checkout-summary">
        <span className="eyebrow">CHECKOUT</span>
        <div className="plan-icon giant">{plan.badge}</div>
        <h1>{plan.name}</h1>
        <div className="checkout-price"><strong>{money(plan.price_cents)}</strong><span>/mês</span></div>
        <p>{plan.description}</p>
        <ul className="benefit-list">{plan.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
        <div className="discord-role-box"><span>Cargo vinculado</span><strong>{plan.role_id}</strong></div>
      </section>
      <section className="checkout-panel">
        <CheckoutForm
          planSlug={plan.slug}
          planName={plan.name}
          priceLabel={money(plan.price_cents)}
          paymentsMode={paymentsMode}
          configured={configured}
          defaultEmail={session.email}
          defaultName={session.globalName || session.username}
        />
      </section>
    </div>
  );
}
