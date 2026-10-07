import "server-only";

let tokenCache: { token: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurado.`);
  return value;
}

function authUrl() {
  if (process.env.PICPAY_AUTH_URL) return process.env.PICPAY_AUTH_URL;
  return process.env.PICPAY_ENV === "production"
    ? "https://ecommerce-api.svcp.picpay.com/oauth2/token"
    : "https://ecommerce-api.svcp.ppay.me/oauth2/token";
}

function recurrencyBase() {
  if (process.env.PICPAY_RECURRENCY_BASE_URL) return process.env.PICPAY_RECURRENCY_BASE_URL.replace(/\/$/, "");
  if (process.env.PICPAY_ENV === "production") {
    throw new Error("PICPAY_RECURRENCY_BASE_URL deve ser configurado para produção.");
  }
  return "https://ecommerce-api.svcp.ppay.me/recurrency/sandbox/v1";
}

export async function getPicPayAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 20_000) return tokenCache.token;
  if (tokenPromise) return tokenPromise;
  tokenPromise = (async () => {
    const response = await fetch(authUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: required("PICPAY_CLIENT_ID"),
        client_secret: required("PICPAY_CLIENT_SECRET"),
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      throw new Error(`Falha ao autenticar no PicPay (${response.status}): ${JSON.stringify(data)}`);
    }
    tokenCache = { token: data.access_token as string, expiresAt: Date.now() + 4 * 60_000 };
    return tokenCache.token;
  })();
  try {
    return await tokenPromise;
  } finally {
    tokenPromise = null;
  }
}

async function picpayFetch(path: string, init: RequestInit = {}) {
  const token = await getPicPayAccessToken();
  const response = await fetch(`${recurrencyBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`PicPay ${response.status}: ${text || response.statusText}`);
  }
  return data;
}

export type PicPayCustomer = {
  name: string;
  email: string;
  documentType: "CPF" | "CNPJ" | "PASSPORT";
  document: string;
  phone: {
    countryCode: string;
    areaCode: string;
    number: string;
    type: "MOBILE";
  };
};

export async function createPicPaySubscription(input: {
  customer: PicPayCustomer;
  temporaryCardToken: string;
  planId: string;
  merchantSubscriptionId: string;
}) {
  return picpayFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customer,
      credit: { temporaryCardToken: input.temporaryCardToken },
      planId: input.planId,
      merchantSubscriptionId: input.merchantSubscriptionId,
    }),
  }) as Promise<{
    id: string;
    merchantSubscriptionId: string;
    planId: string;
    nextBillingDate?: string;
    failedAttempts?: number;
    charges?: string[];
  }>;
}

export async function getPicPaySubscription(subscriptionId: string) {
  return picpayFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "GET" }) as Promise<{
    name?: string;
    email?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    isActive?: boolean;
    charges?: Array<{ id: string; status: string; chargedAt?: string; amount?: number }>;
    plan?: { id: string; billingCycle?: string; amount?: number };
  }>;
}

export async function cancelPicPaySubscription(subscriptionId: string) {
  await picpayFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { method: "POST" });
}

export async function createPicPayPlan(input: {
  amount: number;
  tag: string;
}) {
  return picpayFetch("/plans", {
    method: "POST",
    body: JSON.stringify({
      billingCycle: "MONTHLY",
      amount: input.amount,
      totalBillingCycles: Number(process.env.PICPAY_TOTAL_BILLING_CYCLES || "120"),
      initialGraceCycles: 0,
      tag: input.tag,
    }),
  }) as Promise<{ id: string; amount: number; enabled: boolean; tag: string }>;
}
