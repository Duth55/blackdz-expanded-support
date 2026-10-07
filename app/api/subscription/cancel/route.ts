import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOpenSubscription, updateSubscriptionStatus, audit } from "@/lib/db";
import { cancelPicPaySubscription } from "@/lib/picpay";
import { clearSupportRoles } from "@/lib/discord";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const sub = await getOpenSubscription(session.id);
  if (!sub) return NextResponse.json({ error: "Nenhuma assinatura ativa ou pendente." }, { status: 404 });

  try {
    if (sub.provider === "picpay" && sub.provider_subscription_id) await cancelPicPaySubscription(sub.provider_subscription_id);
    await updateSubscriptionStatus(sub.id, "canceled");
    if (sub.provider !== "demo") { try { await clearSupportRoles(session.id); } catch {} }
    await audit(session.id, "subscription_canceled", sub.id, { provider: sub.provider });
    return NextResponse.json({ ok: true, message: "Assinatura cancelada." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao cancelar." }, { status: 502 });
  }
}
