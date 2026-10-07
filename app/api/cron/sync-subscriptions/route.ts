import { NextRequest, NextResponse } from "next/server";
import { getPicPaySubscription } from "@/lib/picpay";
import { listSyncablePicPaySubscriptions, listExpiredActiveSubscriptions, recordPayment, updateSubscriptionStatus, audit } from "@/lib/db";
import { clearSupportRoles, syncSupportRole } from "@/lib/discord";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const results: any[] = [];

  for (const sub of await listExpiredActiveSubscriptions()) {
    if (sub.provider === "picpay") continue;
    await updateSubscriptionStatus(sub.id, "expired");
    try { await clearSupportRoles(sub.discord_user_id); } catch {}
    results.push({ id: sub.id, status: "expired" });
  }

  for (const sub of await listSyncablePicPaySubscriptions()) {
    try {
      const remote = await getPicPaySubscription(sub.provider_subscription_id!);
      for (const charge of remote.charges || []) {
        await recordPayment({
          subscriptionId: sub.id,
          chargeId: charge.id,
          provider: "picpay",
          status: String(charge.status || "UNKNOWN").toUpperCase(),
          amountCents: charge.amount || null,
          paidAt: charge.chargedAt || null,
          payload: charge,
        });
      }
      const goodStatuses = new Set(["AUTHORIZED", "CAPTURED", "PAID", "SUCCESS", "APPROVED"]);
      const hasSuccessfulCharge = (remote.charges || []).some((charge) => goodStatuses.has(String(charge.status || "").toUpperCase()));
      if (remote.isActive === false) {
        await updateSubscriptionStatus(sub.id, "canceled", remote.endDate || null);
        try { await clearSupportRoles(sub.discord_user_id); } catch {}
        results.push({ id: sub.id, status: "canceled" });
      } else if (hasSuccessfulCharge) {
        await updateSubscriptionStatus(sub.id, "active", remote.endDate || null);
        if (sub.role_id) {
          try { await syncSupportRole(sub.discord_user_id, sub.role_id); } catch {}
        }
        results.push({ id: sub.id, status: "active" });
      } else {
        // Continua pendente até existir uma cobrança confirmada.
        if (sub.status !== "pending") await updateSubscriptionStatus(sub.id, "pending");
        try { await clearSupportRoles(sub.discord_user_id); } catch {}
        results.push({ id: sub.id, status: "pending" });
      }
    } catch (error) {
      await audit(null, "cron_picpay_sync_failed", sub.id, { error: error instanceof Error ? error.message : String(error) });
      results.push({ id: sub.id, status: "error" });
    }
  }

  return NextResponse.json({ ok: true, synced: results.length, results });
}
