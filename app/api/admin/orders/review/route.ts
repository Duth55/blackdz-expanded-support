import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";
import { reviewVipOrder } from "@/lib/review";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login com Discord." }, { status: 401 });
  if (session.id !== OWNER_DISCORD_ID) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const orderId = String(body.orderId || "").trim();
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
  const reason = String(body.reason || "").trim();
  if (!orderId || !action) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  try {
    const result = await reviewVipOrder({ orderId, action, actorDiscordId: session.id, reason, skipReviewerCheck: true });
    return NextResponse.json({ ok: true, message: result.alreadyReviewed ? "Pedido já havia sido analisado." : action === "approve" ? "Pagamento confirmado e V.I.P liberado." : "Pedido recusado." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na análise." }, { status: 400 });
  }
}
