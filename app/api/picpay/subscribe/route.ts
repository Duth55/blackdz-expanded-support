import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createPicPaySubscription } from "@/lib/picpay";
import { createSubscriptionRecord, getOpenSubscription, getPlan, hasDatabase, recordPayment, setProviderSubscription, updateSubscriptionStatus, audit } from "@/lib/db";

function cleanDigits(value: unknown) { return String(value || "").replace(/\D/g, ""); }

export async function POST(request: NextRequest) {
  if ((process.env.PAYMENTS_MODE || "demo") !== "picpay") return NextResponse.json({ error: "Pagamentos reais ainda não estão ativados." }, { status: 403 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login com Discord." }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: "DATABASE_URL não configurado." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const plan = await getPlan(String(body.planSlug || ""));
  if (!plan || !plan.active || !plan.picpay_plan_id) return NextResponse.json({ error: "Plano não está pronto para cobrança no PicPay." }, { status: 400 });
  const open = await getOpenSubscription(session.id);
  if (open) return NextResponse.json({ error: "Você já possui uma assinatura ativa ou aguardando confirmação. Cancele-a antes de criar outra." }, { status: 409 });

  const customer = body.customer || {};
  const temporaryCardToken = String(body.temporaryCardToken || "");
  const cpf = cleanDigits(customer.document);
  const areaCode = cleanDigits(customer.phone?.areaCode);
  const phone = cleanDigits(customer.phone?.number);
  if (!temporaryCardToken || !customer.name || !customer.email || cpf.length !== 11 || areaCode.length !== 2 || phone.length < 8) {
    return NextResponse.json({ error: "Dados do pagamento incompletos ou inválidos." }, { status: 400 });
  }

  const localId = await createSubscriptionRecord({
    discordUserId: session.id,
    planSlug: plan.slug,
    provider: "picpay",
    status: "pending",
    metadata: { stage: "creating" },
  });
  const merchantSubscriptionId = crypto.randomUUID();

  try {
    const provider = await createPicPaySubscription({
      planId: plan.picpay_plan_id,
      temporaryCardToken,
      merchantSubscriptionId,
      customer: {
        name: String(customer.name).trim(),
        email: String(customer.email).trim(),
        documentType: "CPF",
        document: cpf,
        phone: { countryCode: "55", areaCode, number: phone, type: "MOBILE" },
      },
    });

    await setProviderSubscription(localId, provider.id, merchantSubscriptionId, provider, provider.nextBillingDate || null);
    for (const chargeId of provider.charges || []) {
      await recordPayment({ subscriptionId: localId, chargeId, provider: "picpay", status: "CREATED", payload: provider });
    }

    // Não libera o cargo na criação: a assinatura fica pendente até uma cobrança
    // ser confirmada pelo webhook/rotina de sincronização do PicPay.
    await audit(session.id, "subscription_created_pending", localId, { providerSubscriptionId: provider.id, plan: plan.slug });
    return NextResponse.json({ ok: true, subscriptionId: localId, pending: true });
  } catch (error) {
    await updateSubscriptionStatus(localId, "failed");
    await audit(session.id, "subscription_create_failed", localId, { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "O PicPay não conseguiu criar a assinatura. Confira os dados e tente novamente." }, { status: 502 });
  }
}
