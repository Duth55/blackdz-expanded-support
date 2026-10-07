import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";
import { audit, updatePlanAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.id !== OWNER_DISCORD_ID) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const slug = String(body.slug || "");
  const priceCents = Number(body.priceCents);
  if (!slug || !Number.isInteger(priceCents) || priceCents < 100) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  await updatePlanAdmin({ slug, priceCents, active: Boolean(body.active), picpayPlanId: body.picpayPlanId || null });
  await audit(session.id, "plan_updated", slug, { priceCents, active: Boolean(body.active), picpayPlanId: body.picpayPlanId || null });
  return NextResponse.json({ ok: true, message: "Plano atualizado." });
}
