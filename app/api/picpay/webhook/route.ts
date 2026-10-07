import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { findSubscriptionByChargeId, insertWebhookEvent, recordPayment, updateSubscriptionStatus, audit } from "@/lib/db";
import { clearSupportRoles, syncSupportRole } from "@/lib/discord";

const GOOD = new Set(["AUTHORIZED", "CAPTURED", "PAID", "SUCCESS", "APPROVED"]);
const TERMINAL_BAD = new Set(["CANCELED", "CANCELLED", "CHARGEBACK"]);

export async function POST(request: NextRequest) {
  const expected = process.env.PICPAY_WEBHOOK_TOKEN;
  const received = request.headers.get("authorization") || "";
  if (!expected || (received !== expected && received !== `Bearer ${expected}`)) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as any;
  if (!payload) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  const eventType = request.headers.get("event-type") || request.headers.get("event_type") || payload.type || null;
  const status = String(payload?.data?.status || payload?.status || payload?.data?.transactions?.[0]?.status || "UNKNOWN").toUpperCase();
  const chargeId = String(payload?.id || payload?.data?.chargeId || "");
  const eventKey = crypto.createHash("sha256").update(`${chargeId}|${status}|${payload?.eventDate || ""}|${JSON.stringify(payload).slice(0, 200)}`).digest("hex");
  const isNew = await insertWebhookEvent(eventKey, eventType, payload);
  if (!isNew) return NextResponse.json({ ok: true, duplicate: true });

  if (chargeId) {
    const sub = await findSubscriptionByChargeId(chargeId);
    await recordPayment({
      subscriptionId: sub?.id || null,
      chargeId,
      provider: "picpay",
      status,
      amountCents: Number(payload?.data?.amount || payload?.amount || 0) || null,
      paidAt: GOOD.has(status) ? (payload?.eventDate || new Date().toISOString()) : null,
      payload,
    });

    if (sub && GOOD.has(status)) {
      await updateSubscriptionStatus(sub.id, "active");
      if (sub.role_id) {
        try { await syncSupportRole(sub.discord_user_id, sub.role_id); } catch (error) {
          await audit(null, "webhook_role_sync_failed", sub.discord_user_id, { error: error instanceof Error ? error.message : String(error) });
        }
      }
    } else if (sub && TERMINAL_BAD.has(status)) {
      // Em recorrência, falhas comuns podem ser retentadas. Só estados terminais removem acesso aqui.
      await updateSubscriptionStatus(sub.id, "canceled");
      try { await clearSupportRoles(sub.discord_user_id); } catch {}
    }
  }

  return NextResponse.json({ ok: true });
}
