import crypto from "crypto";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createVipOrder, deleteVipOrder, getPendingOrderForUser, attachDiscordReviewMessage } from "@/lib/db";
import { PAYMENT_METHOD_LABEL, VIP_PRICE_CENTS } from "@/lib/config";
import { hasVipRole, isGuildMember, sendOrderForReview } from "@/lib/discord";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const MAX_PROOF_SIZE = 3 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, max: number) {
  return String(value || "").trim().replace(/\u0000/g, "").slice(0, max);
}

function orderId() {
  return `BDZ-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Faça login com Discord." }, { status: 401 });

  if (!(await isGuildMember(session.id))) {
    return NextResponse.json({ error: "Entre na BlackDz Community com essa conta antes de enviar o pedido." }, { status: 400 });
  }
  if (await hasVipRole(session.id)) {
    return NextResponse.json({ error: "Sua conta já possui o cargo V.I.P." }, { status: 409 });
  }
  const pending = await getPendingOrderForUser(session.id);
  if (pending) return NextResponse.json({ error: `Você já possui o pedido ${pending.id} em análise.`, orderId: pending.id }, { status: 409 });

  const form = await request.formData();
  const payerName = cleanText(form.get("payerName"), 120);
  const paymentSource = cleanText(form.get("paymentSource"), 80);
  const note = cleanText(form.get("note"), 500);
  const confirmedPayment = cleanText(form.get("confirmedPayment"), 10) === "yes";
  if (payerName.length < 3) return NextResponse.json({ error: "Informe o nome do titular que efetuou o pagamento." }, { status: 400 });
  if (!confirmedPayment) return NextResponse.json({ error: "Confirme que o pagamento já foi efetuado." }, { status: 400 });

  const proofEntry = form.get("proof");
  let proof: File | null = null;
  if (proofEntry instanceof File && proofEntry.size > 0) {
    if (proofEntry.size > MAX_PROOF_SIZE) return NextResponse.json({ error: "O comprovante deve ter no máximo 3 MB." }, { status: 413 });
    if (!ALLOWED_TYPES.has(proofEntry.type)) return NextResponse.json({ error: "Envie o comprovante em PNG, JPG, WEBP ou PDF." }, { status: 415 });
    proof = proofEntry;
  }

  const id = orderId();
  const paymentMethod = paymentSource ? `${PAYMENT_METHOD_LABEL} • ${paymentSource}` : PAYMENT_METHOD_LABEL;
  const created = await createVipOrder({
    id,
    discordUserId: session.id,
    discordUsername: session.globalName || session.username,
    payerName,
    paymentMethod,
    amountCents: VIP_PRICE_CENTS,
    note: note || null,
    proofName: proof?.name || null,
  });

  try {
    const message = await sendOrderForReview(created, proof);
    await attachDiscordReviewMessage(id, message);
  } catch (error) {
    await deleteVipOrder(id).catch(() => {});
    console.error("[VIP ORDER DISCORD]", error);
    return NextResponse.json({ error: "Não consegui enviar o pedido para a staff no Discord. Tente novamente em alguns instantes." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, orderId: id });
}
