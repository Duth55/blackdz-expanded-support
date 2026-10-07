import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createSubscriptionRecord, getActiveSubscription, getPlan, hasDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  if ((process.env.PAYMENTS_MODE || "demo") !== "demo") return NextResponse.json({ error: "Modo demo desativado." }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login com Discord." }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: "Configure DATABASE_URL para testar assinaturas." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const plan = await getPlan(String(body.planSlug || ""));
  if (!plan || !plan.active) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const active = await getActiveSubscription(session.id);
  if (active) return NextResponse.json({ error: "Você já possui uma assinatura ativa." }, { status: 409 });
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await createSubscriptionRecord({
    discordUserId: session.id,
    planSlug: plan.slug,
    provider: "demo",
    status: "active",
    currentPeriodEnd: end,
    metadata: { demo: true, roleGranted: false },
  });
  return NextResponse.json({ ok: true, message: "Assinatura de teste criada." });
}
