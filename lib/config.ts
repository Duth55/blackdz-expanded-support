export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "1519101675703369778";
export const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID || "1345387246282608751";

// Mantemos como padrão o antigo cargo VIP do projeto. Se você renomeou/criou outro,
// defina DISCORD_VIP_ROLE_ID na Vercel sem precisar editar o código.
export const VIP_ROLE_ID = process.env.DISCORD_VIP_ROLE_ID || "1557153493339611157";
export const VIP_ROLE_NAME = "V.I.P - DBC: BlackDz Expanded";

export const VIP_PRICE_CENTS = Number(process.env.VIP_PRICE_CENTS || "1990");
export const PAYMENT_METHOD_LABEL = process.env.PAYMENT_METHOD_LABEL || "PIX";
export const PAYMENT_PIX_KEY = process.env.PAYMENT_PIX_KEY || "";
export const PAYMENT_RECEIVER_LABEL = process.env.PAYMENT_RECEIVER_LABEL || "DBC: BlackDz Expanded";
export const VIP_REVIEW_CHANNEL_ID = process.env.VIP_REVIEW_CHANNEL_ID || "1552417366976102420";

export const DEFAULT_REVIEWER_ROLE_IDS = [
  "1548390558051995729",
  "1519109934686539938",
  "1519109735666684037",
  "1519109652632174804",
  "1548390384340697178",
  "1519109613025366088",
  "1519109509400887446",
];

export function reviewerRoleIds() {
  const raw = process.env.DISCORD_REVIEWER_ROLE_IDS?.trim();
  return raw ? raw.split(",").map((x: string) => x.trim()).filter(Boolean) : DEFAULT_REVIEWER_ROLE_IDS;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
