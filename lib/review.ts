import "server-only";
import { addVipRole, isAuthorizedReviewer, sendBuyerDm, updateReviewMessage } from "@/lib/discord";
import { audit, getVipOrder, reopenVipOrderAfterFailedApproval, updateVipOrderReview } from "@/lib/db";

export async function reviewVipOrder(input: {
  orderId: string;
  action: "approve" | "reject";
  actorDiscordId: string;
  reason?: string | null;
  skipReviewerCheck?: boolean;
}) {
  const order = await getVipOrder(input.orderId);
  if (!order) throw new Error("Pedido não encontrado.");
  if (order.status !== "pending") {
    return { order, alreadyReviewed: true };
  }

  if (!input.skipReviewerCheck && !(await isAuthorizedReviewer(input.actorDiscordId))) {
    throw new Error("Você não possui permissão para analisar pedidos V.I.P.");
  }

  if (input.action === "approve") {
    // Primeiro fecha o pedido de forma atômica. Assim dois membros da staff não
    // conseguem aprovar/recusar o mesmo pedido ao mesmo tempo.
    const updated = await updateVipOrderReview(order.id, {
      status: "approved",
      reviewerDiscordId: input.actorDiscordId,
    });
    if (!updated) {
      const latest = await getVipOrder(order.id);
      if (!latest) throw new Error("Pedido não encontrado.");
      return { order: latest, alreadyReviewed: true };
    }
    try {
      await addVipRole(updated.discord_user_id);
    } catch (error) {
      // Se o Discord falhar, reabre o pedido para não marcar como aprovado sem cargo.
      await reopenVipOrderAfterFailedApproval(updated.id, input.actorDiscordId).catch(() => {});
      throw error;
    }
    await audit(input.actorDiscordId, "vip_order_approved", order.id, { discordUserId: order.discord_user_id });
    await updateReviewMessage(updated).catch(() => {});
    await sendBuyerDm(updated.discord_user_id, { approved: true, orderId: updated.id });
    return { order: updated, alreadyReviewed: false };
  }

  const reason = (input.reason || "Pagamento não confirmado pela staff.").trim().slice(0, 500);
  const updated = await updateVipOrderReview(order.id, {
    status: "rejected",
    reviewerDiscordId: input.actorDiscordId,
    rejectionReason: reason,
  });
  if (!updated) {
    const latest = await getVipOrder(order.id);
    if (!latest) throw new Error("Pedido não encontrado.");
    return { order: latest, alreadyReviewed: true };
  }
  await audit(input.actorDiscordId, "vip_order_rejected", order.id, { reason });
  await updateReviewMessage(updated).catch(() => {});
  await sendBuyerDm(updated.discord_user_id, { approved: false, orderId: updated.id, reason });
  return { order: updated, alreadyReviewed: false };
}
