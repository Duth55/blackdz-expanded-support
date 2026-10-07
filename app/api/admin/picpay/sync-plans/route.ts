import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";
import { audit, getPlans, setPicPayPlanId } from "@/lib/db";
import { createPicPayPlan } from "@/lib/picpay";

export async function POST() {
  const session = await getSession();
  if (!session || session.id !== OWNER_DISCORD_ID) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const plans = await getPlans(true);
  const created: Array<{ slug: string; id: string }> = [];
  for (const plan of plans) {
    if (plan.picpay_plan_id || !plan.active) continue;
    const provider = await createPicPayPlan({ amount: plan.price_cents, tag: `blackdz-${plan.slug}` });
    await setPicPayPlanId(plan.slug, provider.id);
    created.push({ slug: plan.slug, id: provider.id });
  }
  await audit(session.id, "picpay_plans_synced", null, { created });
  return NextResponse.json({ ok: true, created, message: created.length ? `${created.length} plano(s) criado(s) no PicPay.` : "Todos os planos já possuem ID do PicPay." });
}
