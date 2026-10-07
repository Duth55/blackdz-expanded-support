import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";
import { audit, cancelOpenSubscriptions, createSubscriptionRecord, getOpenSubscription, getPlan, hasDatabase, upsertDiscordUser } from "@/lib/db";
import { clearSupportRoles, getGuildMember, syncSupportRole } from "@/lib/discord";
import { cancelPicPaySubscription } from "@/lib/picpay";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.id !== OWNER_DISCORD_ID) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!hasDatabase()) return NextResponse.json({ error: "DATABASE_URL não configurado." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const userId = String(body.discordUserId || "");
  if (!/^\d{16,22}$/.test(userId)) return NextResponse.json({ error: "ID do Discord inválido." }, { status: 400 });

  if (action === "revoke") {
    const existing = await getOpenSubscription(userId);
    if (existing?.provider === "picpay" && existing.provider_subscription_id) {
      await cancelPicPaySubscription(existing.provider_subscription_id);
    }
    await cancelOpenSubscriptions(userId);
    await clearSupportRoles(userId);
    await audit(session.id, "manual_revoke", userId, {});
    return NextResponse.json({ ok: true, message: "Assinatura e cargos removidos." });
  }

  const plan = await getPlan(String(body.planSlug || ""));
  if (!plan) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const member = await getGuildMember(userId).catch(() => null);
  if (!member?.user) return NextResponse.json({ error: "Esse usuário não foi encontrado na BlackDz Community." }, { status: 404 });
  await upsertDiscordUser({ id: userId, username: member.user.username, globalName: null, avatar: null, email: null });

  if (action === "sync") {
    await syncSupportRole(userId, plan.role_id);
    await audit(session.id, "manual_role_sync", userId, { plan: plan.slug });
    return NextResponse.json({ ok: true, message: "Cargo sincronizado." });
  }

  if (action !== "grant") return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  const days = Math.max(1, Math.min(3650, Number(body.days || 30)));
  const existing = await getOpenSubscription(userId);
  if (existing?.provider === "picpay" && existing.provider_subscription_id) {
    await cancelPicPaySubscription(existing.provider_subscription_id);
  }
  await cancelOpenSubscriptions(userId);
  const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const id = await createSubscriptionRecord({ discordUserId: userId, planSlug: plan.slug, provider: "manual", status: "active", currentPeriodEnd: end, metadata: { grantedBy: session.id } });
  await syncSupportRole(userId, plan.role_id);
  await audit(session.id, "manual_grant", userId, { subscriptionId: id, plan: plan.slug, days });
  return NextResponse.json({ ok: true, message: "Assinatura concedida e cargo aplicado." });
}
