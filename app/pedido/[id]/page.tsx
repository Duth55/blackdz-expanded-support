import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getVipOrder } from "@/lib/db";
import { money, OWNER_DISCORD_ID, VIP_ROLE_NAME } from "@/lib/config";
import { isAuthorizedReviewer } from "@/lib/discord";
import { OrderStatus } from "@/components/order-status";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/api/auth/discord/start?returnTo=${encodeURIComponent(`/pedido/${id}`)}`);
  const order = await getVipOrder(id);
  if (!order) notFound();
  const staffAccess = session.id === OWNER_DISCORD_ID || await isAuthorizedReviewer(session.id);
  if (order.discord_user_id !== session.id && !staffAccess) notFound();

  return (
    <div className="container page-shell order-page">
      <section className={`order-result-card ${order.status}`}>
        <div className="order-result-icon">{order.status === "approved" ? "✅" : order.status === "rejected" ? "❌" : "⏳"}</div>
        <span className="eyebrow">PEDIDO {order.id}</span>
        <h1>{order.status === "approved" ? "V.I.P liberado!" : order.status === "rejected" ? "Pedido recusado" : "Pagamento em análise"}</h1>
        <OrderStatus status={order.status} />
        {order.status === "pending" && <p>A staff recebeu seu pedido e vai conferir o pagamento. Se estiver tudo certo, o cargo será liberado automaticamente. <strong>Aguarde!</strong></p>}
        {order.status === "approved" && <p>Seu pagamento foi confirmado e o cargo <strong>{VIP_ROLE_NAME}</strong> foi adicionado. Novos canais V.I.P foram liberados para você no servidor.</p>}
        {order.status === "rejected" && <p>O pedido foi recusado pela staff. Confira o motivo abaixo e, se necessário, fale com a equipe antes de enviar outro pedido.</p>}
      </section>

      <section className="order-details-card">
        <div><span>Valor</span><strong>{money(order.amount_cents)}</strong></div>
        <div><span>Forma informada</span><strong>{order.payment_method}</strong></div>
        <div><span>Nome do pagador</span><strong>{order.payer_name}</strong></div>
        <div><span>Enviado em</span><strong>{new Date(order.created_at).toLocaleString("pt-BR")}</strong></div>
        {order.proof_url && <div className="span-full"><span>Comprovante</span><a href={order.proof_url} target="_blank" rel="noreferrer">Abrir comprovante enviado</a></div>}
        {order.rejection_reason && <div className="span-full rejection-reason"><span>Motivo da recusa</span><strong>{order.rejection_reason}</strong></div>}
      </section>

      <div className="center-actions"><Link href="/dashboard" className="btn btn-secondary">Voltar para minha área</Link>{order.status === "rejected" && <Link href="/checkout/vip" className="btn btn-primary">Enviar novo pedido</Link>}</div>
    </div>
  );
}
