import "server-only";
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import { DEFAULT_PLANS } from "@/lib/config";

export type Plan = {
  slug: string;
  name: string;
  role_id: string;
  price_cents: number;
  description: string;
  benefits: string[];
  badge: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
  picpay_plan_id: string | null;
};

export type Subscription = {
  id: string;
  discord_user_id: string;
  plan_slug: string;
  provider: string;
  provider_subscription_id: string | null;
  merchant_subscription_id: string | null;
  status: string;
  started_at: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan_name?: string;
  role_id?: string;
  price_cents?: number;
};

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

let schemaReady: Promise<void> | null = null;

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurado.");
  return neon(process.env.DATABASE_URL);
}

async function ensureSchema() {
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
    await sql`CREATE TABLE IF NOT EXISTS plans (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role_id TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      description TEXT NOT NULL,
      benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
      badge TEXT NOT NULL DEFAULT '💎',
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      picpay_plan_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL REFERENCES users(discord_id) ON DELETE CASCADE,
      plan_slug TEXT NOT NULL REFERENCES plans(slug),
      provider TEXT NOT NULL DEFAULT 'manual',
      provider_subscription_id TEXT,
      merchant_subscription_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      current_period_end TIMESTAMPTZ,
      cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions(discord_user_id, created_at DESC)`;
    await sql`CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
      charge_id TEXT UNIQUE,
      provider TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_cents INTEGER,
      paid_at TIMESTAMPTZ,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      event_type TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_discord_id TEXT,
      action TEXT NOT NULL,
      target TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    for (let i = 0; i < DEFAULT_PLANS.length; i++) {
      const p = DEFAULT_PLANS[i];
      await sql`INSERT INTO plans (slug,name,role_id,price_cents,description,benefits,badge,featured,sort_order)
        VALUES (${p.slug}, ${p.name}, ${p.roleId}, ${p.priceCents}, ${p.description}, ${JSON.stringify(p.benefits)}::jsonb, ${p.badge}, ${p.featured}, ${i})
        ON CONFLICT (slug) DO UPDATE SET
          name=EXCLUDED.name,
          role_id=EXCLUDED.role_id,
          description=EXCLUDED.description,
          benefits=EXCLUDED.benefits,
          badge=EXCLUDED.badge,
          featured=EXCLUDED.featured,
          sort_order=EXCLUDED.sort_order,
          updated_at=NOW()`;
    }
  })();
  return schemaReady;
}

function fallbackPlans(): Plan[] {
  return DEFAULT_PLANS.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    role_id: p.roleId,
    price_cents: p.priceCents,
    description: p.description,
    benefits: [...p.benefits],
    badge: p.badge,
    featured: p.featured,
    active: true,
    sort_order: i,
    picpay_plan_id: null,
  }));
}

export async function getPlans(includeInactive = false): Promise<Plan[]> {
  if (!hasDatabase()) return fallbackPlans();
  await ensureSchema();
  const sql = db();
  const rows = includeInactive
    ? await sql`SELECT * FROM plans ORDER BY sort_order, price_cents`
    : await sql`SELECT * FROM plans WHERE active = TRUE ORDER BY sort_order, price_cents`;
  return rows.map((r: any) => ({ ...r, benefits: Array.isArray(r.benefits) ? r.benefits : [] })) as Plan[];
}

export async function getPlan(slug: string) {
  const plans = await getPlans(true);
  return plans.find((p) => p.slug === slug) || null;
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

export async function getLatestSubscription(discordUserId: string): Promise<Subscription | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*, p.name AS plan_name, p.role_id, p.price_cents
    FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug
    WHERE s.discord_user_id=${discordUserId}
    ORDER BY s.created_at DESC LIMIT 1`;
  return (rows[0] as Subscription) || null;
}

export async function getActiveSubscription(discordUserId: string): Promise<Subscription | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*, p.name AS plan_name, p.role_id, p.price_cents
    FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug
    WHERE s.discord_user_id=${discordUserId} AND s.status='active'
    ORDER BY s.created_at DESC LIMIT 1`;
  return (rows[0] as Subscription) || null;
}

export async function getOpenSubscription(discordUserId: string): Promise<Subscription | null> {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*, p.name AS plan_name, p.role_id, p.price_cents
    FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug
    WHERE s.discord_user_id=${discordUserId} AND s.status IN ('active','pending')
    ORDER BY s.created_at DESC LIMIT 1`;
  return (rows[0] as Subscription) || null;
}

export async function createSubscriptionRecord(input: {
  discordUserId: string;
  planSlug: string;
  provider: string;
  providerSubscriptionId?: string | null;
  merchantSubscriptionId?: string | null;
  status?: string;
  currentPeriodEnd?: string | null;
  metadata?: unknown;
}) {
  await ensureSchema();
  const sql = db();
  const id = crypto.randomUUID();
  await sql`INSERT INTO subscriptions
    (id,discord_user_id,plan_slug,provider,provider_subscription_id,merchant_subscription_id,status,current_period_end,metadata)
    VALUES (${id},${input.discordUserId},${input.planSlug},${input.provider},${input.providerSubscriptionId || null},${input.merchantSubscriptionId || null},${input.status || "active"},${input.currentPeriodEnd || null},${JSON.stringify(input.metadata || {})}::jsonb)`;
  return id;
}

export async function updateSubscriptionStatus(id: string, status: string, currentPeriodEnd?: string | null) {
  await ensureSchema();
  const sql = db();
  await sql`UPDATE subscriptions SET status=${status}, current_period_end=COALESCE(${currentPeriodEnd || null}, current_period_end), updated_at=NOW() WHERE id=${id}`;
}

export async function setProviderSubscription(id: string, providerSubscriptionId: string, merchantSubscriptionId: string, metadata: unknown, currentPeriodEnd?: string | null, status = "pending") {
  await ensureSchema();
  const sql = db();
  await sql`UPDATE subscriptions SET provider_subscription_id=${providerSubscriptionId}, merchant_subscription_id=${merchantSubscriptionId}, metadata=${JSON.stringify(metadata || {})}::jsonb, current_period_end=${currentPeriodEnd || null}, status=${status}, updated_at=NOW() WHERE id=${id}`;
}

export async function recordPayment(input: {
  subscriptionId?: string | null;
  chargeId?: string | null;
  provider: string;
  status: string;
  amountCents?: number | null;
  paidAt?: string | null;
  payload?: unknown;
}) {
  await ensureSchema();
  const sql = db();
  const id = crypto.randomUUID();
  if (input.chargeId) {
    await sql`INSERT INTO payments (id,subscription_id,charge_id,provider,status,amount_cents,paid_at,payload)
      VALUES (${id},${input.subscriptionId || null},${input.chargeId},${input.provider},${input.status},${input.amountCents || null},${input.paidAt || null},${JSON.stringify(input.payload || {})}::jsonb)
      ON CONFLICT (charge_id) DO UPDATE SET status=EXCLUDED.status, amount_cents=COALESCE(EXCLUDED.amount_cents,payments.amount_cents), paid_at=COALESCE(EXCLUDED.paid_at,payments.paid_at), payload=EXCLUDED.payload, updated_at=NOW()`;
  } else {
    await sql`INSERT INTO payments (id,subscription_id,provider,status,amount_cents,paid_at,payload)
      VALUES (${id},${input.subscriptionId || null},${input.provider},${input.status},${input.amountCents || null},${input.paidAt || null},${JSON.stringify(input.payload || {})}::jsonb)`;
  }
}

export async function findSubscriptionByChargeId(chargeId: string) {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*,pl.role_id,pl.name AS plan_name FROM subscriptions s JOIN payments p ON p.subscription_id=s.id JOIN plans pl ON pl.slug=s.plan_slug WHERE p.charge_id=${chargeId} LIMIT 1`;
  return (rows[0] as Subscription) || null;
}

export async function insertWebhookEvent(id: string, eventType: string | null, payload: unknown) {
  await ensureSchema();
  const sql = db();
  const rows = await sql`INSERT INTO webhook_events (id,event_type,payload) VALUES (${id},${eventType},${JSON.stringify(payload)}::jsonb) ON CONFLICT (id) DO NOTHING RETURNING id`;
  return rows.length > 0;
}

export async function listAdminData() {
  if (!hasDatabase()) return { users: [], subscriptions: [], payments: [], logs: [] };
  await ensureSchema();
  const sql = db();
  const [users, subscriptions, payments, logs] = await Promise.all([
    sql`SELECT * FROM users ORDER BY updated_at DESC LIMIT 100`,
    sql`SELECT s.*,p.name AS plan_name,p.role_id,p.price_cents,u.username,u.global_name FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug JOIN users u ON u.discord_id=s.discord_user_id ORDER BY s.created_at DESC LIMIT 100`,
    sql`SELECT * FROM payments ORDER BY created_at DESC LIMIT 100`,
    sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50`,
  ]);
  return { users, subscriptions, payments, logs };
}

export async function adminMetrics() {
  if (!hasDatabase()) return { users: 0, active: 0, mrrCents: 0, payments: 0 };
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT
    (SELECT COUNT(*)::int FROM users) AS users,
    (SELECT COUNT(*)::int FROM subscriptions WHERE status='active') AS active,
    (SELECT COALESCE(SUM(p.price_cents),0)::int FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug WHERE s.status='active') AS mrr_cents,
    (SELECT COUNT(*)::int FROM payments WHERE status IN ('CAPTURED','AUTHORIZED','PAID','SUCCESS')) AS payments`;
  const r: any = rows[0] || {};
  return { users: Number(r.users || 0), active: Number(r.active || 0), mrrCents: Number(r.mrr_cents || 0), payments: Number(r.payments || 0) };
}

export async function updatePlanAdmin(input: { slug: string; priceCents: number; active: boolean; picpayPlanId?: string | null }) {
  await ensureSchema();
  const sql = db();
  await sql`UPDATE plans SET price_cents=${input.priceCents}, active=${input.active}, picpay_plan_id=${input.picpayPlanId || null}, updated_at=NOW() WHERE slug=${input.slug}`;
}

export async function setPicPayPlanId(slug: string, picpayPlanId: string) {
  await ensureSchema();
  const sql = db();
  await sql`UPDATE plans SET picpay_plan_id=${picpayPlanId}, updated_at=NOW() WHERE slug=${slug}`;
}

export async function audit(actorDiscordId: string | null, action: string, target: string | null, data: unknown = {}) {
  if (!hasDatabase()) return;
  await ensureSchema();
  const sql = db();
  await sql`INSERT INTO audit_logs (id,actor_discord_id,action,target,data) VALUES (${crypto.randomUUID()},${actorDiscordId},${action},${target},${JSON.stringify(data)}::jsonb)`;
}

export async function listSyncablePicPaySubscriptions() {
  if (!hasDatabase()) return [] as Subscription[];
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*,p.role_id,p.name AS plan_name FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug WHERE s.status IN ('active','pending') AND s.provider='picpay' AND s.provider_subscription_id IS NOT NULL LIMIT 500`;
  return rows as Subscription[];
}

export async function cancelOpenSubscriptions(discordUserId: string) {
  if (!hasDatabase()) return;
  await ensureSchema();
  const sql = db();
  await sql`UPDATE subscriptions SET status='canceled', updated_at=NOW() WHERE discord_user_id=${discordUserId} AND status IN ('active','pending')`;
}

export async function findSubscriptionByProviderId(providerSubscriptionId: string) {
  if (!hasDatabase()) return null;
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*,p.role_id,p.name AS plan_name FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug WHERE s.provider_subscription_id=${providerSubscriptionId} LIMIT 1`;
  return (rows[0] as Subscription) || null;
}

export async function listExpiredActiveSubscriptions() {
  if (!hasDatabase()) return [] as Subscription[];
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT s.*,p.role_id,p.name AS plan_name FROM subscriptions s JOIN plans p ON p.slug=s.plan_slug WHERE s.status='active' AND s.current_period_end IS NOT NULL AND s.current_period_end < NOW() LIMIT 500`;
  return rows as Subscription[];
}
