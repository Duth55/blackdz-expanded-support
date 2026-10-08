import "server-only";
import { neon } from "@neondatabase/serverless";

export type VipOrderStatus = "pending" | "approved" | "rejected";

export type VipOrder = {
  id: string;
  discord_user_id: string;
  discord_username: string;
  payer_name: string;
  payment_method: string;
  amount_cents: number;
  note: string | null;
  proof_name: string | null;
  proof_url: string | null;
  status: VipOrderStatus;
  reviewer_discord_id: string | null;
  rejection_reason: string | null;
  discord_message_id: string | null;
  discord_channel_id: string | null;
  created_at: string;
  reviewed_at: string | null;
  updated_at: string;
};

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

let schemaReady: Promise<void> | null = null;

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurado.");
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema() {
  if (!hasDatabase()) return;
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      global_name TEXT,
      avatar TEXT,
      email TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS vip_orders (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      discord_username TEXT NOT NULL,
      payer_name TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'PIX',
      amount_cents INTEGER NOT NULL,
      note TEXT,
      proof_name TEXT,
      proof_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_discord_id TEXT,
      rejection_reason TEXT,
      discord_message_id TEXT,
      discord_channel_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT vip_orders_status_check CHECK (status IN ('pending','approved','rejected'))
    )`;
    await sql`CREATE INDEX IF NOT EXISTS vip_orders_user_idx ON vip_orders(discord_user_id, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS vip_orders_status_idx ON vip_orders(status, created_at ASC)`;
    await sql`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_discord_id TEXT,
      action TEXT NOT NULL,
      target TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
  })();
  return schemaReady;
}

export async function upsertDiscordUser(user: {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  email?: string | null;
}) {
  if (!hasDatabase()) return;
  await ensureSchema();
  const sql = db();
  await sql`INSERT INTO users (discord_id,username,global_name,avatar,email)
    VALUES (${user.id},${user.username},${user.globalName || null},${user.avatar || null},${user.email || null})
    ON CONFLICT (discord_id) DO UPDATE SET
      username=EXCLUDED.username,
      global_name=EXCLUDED.global_name,
      avatar=EXCLUDED.avatar,
      email=EXCLUDED.email,
      updated_at=NOW()`;
}

export async function createVipOrder(order: {
  id: string;
  discordUserId: string;
  discordUsername: string;
  payerName: string;
  paymentMethod: string;
  amountCents: number;
  note?: string | null;
  proofName?: string | null;
}) {
  await ensureSchema();
  const sql = db();
  const rows = await sql`INSERT INTO vip_orders (
    id,discord_user_id,discord_username,payer_name,payment_method,amount_cents,note,proof_name
  ) VALUES (
    ${order.id},${order.discordUserId},${order.discordUsername},${order.payerName},${order.paymentMethod},${order.amountCents},${order.note || null},${order.proofName || null}
  ) RETURNING *`;
  return rows[0] as VipOrder;
}

export async function deleteVipOrder(id: string) {
  await ensureSchema();
  const sql = db();
  await sql`DELETE FROM vip_orders WHERE id=${id} AND status='pending'`;
}

export async function attachDiscordReviewMessage(id: string, data: {
  messageId: string;
  channelId: string;
  proofUrl?: string | null;
}) {
  await ensureSchema();
  const sql = db();
  await sql`UPDATE vip_orders SET
    discord_message_id=${data.messageId},
    discord_channel_id=${data.channelId},
    proof_url=${data.proofUrl || null},
    updated_at=NOW()
    WHERE id=${id}`;
}

export async function getVipOrder(id: string): Promise<VipOrder | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT * FROM vip_orders WHERE id=${id} LIMIT 1`;
  return (rows[0] as VipOrder) || null;
}

export async function getUserOrders(discordUserId: string, limit = 20): Promise<VipOrder[]> {
  if (!hasDatabase()) return [];
  await ensureSchema();
  const sql = db();
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
  const rows = await sql`SELECT * FROM vip_orders WHERE discord_user_id=${discordUserId} ORDER BY created_at DESC LIMIT ${safeLimit}`;
  return rows as VipOrder[];
}

export async function getPendingOrderForUser(discordUserId: string): Promise<VipOrder | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT * FROM vip_orders WHERE discord_user_id=${discordUserId} AND status='pending' ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as VipOrder) || null;
}

export async function listVipOrders(limit = 100): Promise<VipOrder[]> {
  if (!hasDatabase()) return [];
  await ensureSchema();
  const sql = db();
  const safeLimit = Math.max(1, Math.min(250, Number(limit) || 100));
  const rows = await sql`SELECT * FROM vip_orders ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC LIMIT ${safeLimit}`;
  return rows as VipOrder[];
}

export async function updateVipOrderReview(id: string, data: {
  status: "approved" | "rejected";
  reviewerDiscordId: string;
  rejectionReason?: string | null;
}) {
  await ensureSchema();
  const sql = db();
  const rows = await sql`UPDATE vip_orders SET
    status=${data.status},
    reviewer_discord_id=${data.reviewerDiscordId},
    rejection_reason=${data.rejectionReason || null},
    reviewed_at=NOW(),
    updated_at=NOW()
    WHERE id=${id} AND status='pending'
    RETURNING *`;
  return (rows[0] as VipOrder) || null;
}

export async function reopenVipOrderAfterFailedApproval(id: string, reviewerDiscordId: string) {
  await ensureSchema();
  const sql = db();
  const rows = await sql`UPDATE vip_orders SET
    status='pending',
    reviewer_discord_id=NULL,
    reviewed_at=NULL,
    updated_at=NOW()
    WHERE id=${id} AND status='approved' AND reviewer_discord_id=${reviewerDiscordId}
    RETURNING *`;
  return (rows[0] as VipOrder) || null;
}

export async function audit(actorDiscordId: string | null, action: string, target: string | null, data: unknown = {}) {
  if (!hasDatabase()) return;
  await ensureSchema();
  const sql = db();
  const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await sql`INSERT INTO audit_logs (id,actor_discord_id,action,target,data)
    VALUES (${id},${actorDiscordId},${action},${target},${JSON.stringify(data)}::jsonb)`;
}
