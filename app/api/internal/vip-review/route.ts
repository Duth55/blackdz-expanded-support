import { NextResponse } from "next/server";
import { reviewVipOrder } from "@/lib/review";

export async function POST(request: Request) {
  const expected = process.env.VIP_REVIEW_SECRET;
  const received = request.headers.get("x-vip-review-secret");
  if (!expected || !received || received !== expected) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const orderId = String(body.orderId || "").trim();
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
  const actorDiscordId = String(body.actorDiscordId || "").trim();
  const reason = String(body.reason || "").trim();
  if (!orderId || !action || !actorDiscordId) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  try {
    const result = await reviewVipOrder({ orderId, action, actorDiscordId, reason });
    return NextResponse.json({
      ok: true,
      status: result.order.status,
      message: result.alreadyReviewed
        ? `Esse pedido já está ${result.order.status === "approved" ? "aprovado" : "recusado"}.`
        : action === "approve" ? "Pagamento confirmado e V.I.P liberado." : "Pedido recusado.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na análise." }, { status: 400 });
  }
}
