import "server-only";
import {
  DISCORD_GUILD_ID,
  OWNER_DISCORD_ID,
  VIP_REVIEW_CHANNEL_ID,
  VIP_ROLE_ID,
  VIP_ROLE_NAME,
  reviewerRoleIds,
  siteUrl,
  money,
} from "@/lib/config";
import type { VipOrder } from "@/lib/db";

const API = "https://discord.com/api/v10";

function botToken() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado.");
  return token;
}

async function discordFetch(path: string, init: RequestInit = {}, json = true) {
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bot ${botToken()}`);
  if (json && init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok && response.status !== 204) {
    const text = await response.text().catch(() => "");
    const error = new Error(`Discord API ${response.status}: ${text || response.statusText}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response;
}

export async function getGuildMember(userId: string) {
  const response = await discordFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}`);
  return response.json() as Promise<{ roles: string[]; user?: { id: string; username: string } }>;
}

export async function isGuildMember(userId: string) {
  try {
    await getGuildMember(userId);
    return true;
  } catch (error) {
    if ((error as Error & { status?: number }).status === 404) return false;
    throw error;
  }
}

export async function hasVipRole(userId: string) {
  try {
    const member = await getGuildMember(userId);
    return member.roles.includes(VIP_ROLE_ID);
  } catch (error) {
    if ((error as Error & { status?: number }).status === 404) return false;
    throw error;
  }
}

export async function addVipRole(userId: string) {
  await discordFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${VIP_ROLE_ID}`, { method: "PUT" });
}

export async function isAuthorizedReviewer(userId: string) {
  if (userId === OWNER_DISCORD_ID) return true;
  try {
    const member = await getGuildMember(userId);
    const allowed = reviewerRoleIds();
    return member.roles.some((roleId) => allowed.includes(roleId));
  } catch {
    return false;
  }
}

function orderEmbed(order: VipOrder, status: "pending" | "approved" | "rejected" = order.status, reason?: string | null) {
  const colors = { pending: 0xf59e0b, approved: 0x22c55e, rejected: 0xef4444 };
  const titles = {
    pending: "💳 NOVO PEDIDO V.I.P — AGUARDANDO ANÁLISE",
    approved: "✅ PAGAMENTO CONFIRMADO — V.I.P LIBERADO",
    rejected: "❌ PEDIDO RECUSADO",
  };
  const fields = [
    { name: "Pedido", value: `\`${order.id}\``, inline: true },
    { name: "Valor esperado", value: money(order.amount_cents), inline: true },
    { name: "Forma informada", value: order.payment_method, inline: true },
    { name: "Usuário", value: `<@${order.discord_user_id}>\n\`${order.discord_user_id}\``, inline: false },
    { name: "Nome de quem efetuou o pagamento", value: order.payer_name.slice(0, 1024), inline: false },
    { name: "Observação", value: (order.note || "Nenhuma").slice(0, 1024), inline: false },
  ];
  if (status === "rejected") fields.push({ name: "Motivo da recusa", value: (reason || order.rejection_reason || "Não informado").slice(0, 1024), inline: false });
  return {
    title: titles[status],
    description: status === "pending"
      ? "Confira o recebimento **na conta/carteira de pagamento** antes de aprovar. O comprovante sozinho não deve ser usado como única confirmação."
      : status === "approved"
        ? `O cargo **${VIP_ROLE_NAME}** foi liberado para o comprador.`
        : "O pedido foi encerrado sem liberar o cargo V.I.P.",
    color: colors[status],
    fields,
    footer: { text: "DBC: BlackDz VIP • Verificação manual" },
    timestamp: new Date().toISOString(),
  };
}

export async function sendOrderForReview(order: VipOrder, proof?: File | null) {
  const payload = {
    embeds: [orderEmbed(order, "pending")],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 3, label: "Confirmar pagamento", emoji: { name: "✅" }, custom_id: `vip_order_approve:${order.id}` },
          { type: 2, style: 4, label: "Recusar", emoji: { name: "❌" }, custom_id: `vip_order_reject:${order.id}` },
          { type: 2, style: 5, label: "Abrir pedido", emoji: { name: "🔎" }, url: `${siteUrl()}/pedido/${order.id}` },
        ],
      },
    ],
    allowed_mentions: { parse: [] },
  };

  let response: Response;
  if (proof && proof.size > 0) {
    const body = new FormData();
    body.append("payload_json", JSON.stringify(payload));
    body.append("files[0]", proof, order.proof_name || proof.name || "comprovante");
    response = await discordFetch(`/channels/${VIP_REVIEW_CHANNEL_ID}/messages`, { method: "POST", body }, false);
  } else {
    response = await discordFetch(`/channels/${VIP_REVIEW_CHANNEL_ID}/messages`, { method: "POST", body: JSON.stringify(payload) });
  }

  const message = await response.json() as { id: string; attachments?: Array<{ url: string }> };
  return { messageId: message.id, channelId: VIP_REVIEW_CHANNEL_ID, proofUrl: message.attachments?.[0]?.url || null };
}

export async function updateReviewMessage(order: VipOrder) {
  if (!order.discord_message_id || !order.discord_channel_id) return;
  const payload = {
    embeds: [orderEmbed(order, order.status, order.rejection_reason)],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: order.status === "approved" ? 3 : 4,
            label: order.status === "approved" ? "Pagamento confirmado" : "Pedido recusado",
            emoji: { name: order.status === "approved" ? "✅" : "❌" },
            custom_id: `vip_order_closed:${order.id}`,
            disabled: true,
          },
          { type: 2, style: 5, label: "Abrir pedido", emoji: { name: "🔎" }, url: `${siteUrl()}/pedido/${order.id}` },
        ],
      },
    ],
  };
  await discordFetch(`/channels/${order.discord_channel_id}/messages/${order.discord_message_id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function sendBuyerDm(userId: string, data: { approved: boolean; orderId: string; reason?: string | null }) {
  try {
    const channelResponse = await discordFetch("/users/@me/channels", {
      method: "POST",
      body: JSON.stringify({ recipient_id: userId }),
    });
    const channel = await channelResponse.json() as { id: string };
    const description = data.approved
      ? `Seu pagamento do pedido **${data.orderId}** foi confirmado e o cargo **${VIP_ROLE_NAME}** foi liberado no servidor.`
      : `Seu pedido **${data.orderId}** foi recusado.${data.reason ? `\n\n**Motivo:** ${data.reason}` : ""}`;
    await discordFetch(`/channels/${channel.id}/messages`, {
      method: "POST",
      body: JSON.stringify({
        embeds: [{
          title: data.approved ? "✅ V.I.P ATIVADO COM SUCESSO!" : "❌ Pedido V.I.P recusado",
          description,
          color: data.approved ? 0x22c55e : 0xef4444,
          footer: { text: "DBC: BlackDz VIP" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });
  } catch {
    // DMs podem estar fechadas. Isso não deve desfazer uma aprovação/recusa válida.
  }
}
