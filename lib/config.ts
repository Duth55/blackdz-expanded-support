export const SUPPORT_ROLES = {
  supporter: {
    name: "💎 Apoiador Patreon",
    roleId: "1557153494467878962",
  },
  plus: {
    name: "🌟 Patreon+",
    roleId: "1557153493339611157",
  },
  vip: {
    name: "👑 Patreon VIP",
    roleId: "1557153489019215965",
  },
} as const;

export const DEFAULT_PLANS = [
  {
    slug: "supporter",
    name: "Apoiador",
    discordRoleName: SUPPORT_ROLES.supporter.name,
    roleId: SUPPORT_ROLES.supporter.roleId,
    priceCents: 990,
    description: "Apoie o desenvolvimento e entre para a área exclusiva da comunidade.",
    benefits: [
      "Cargo exclusivo no Discord",
      "Acesso aos canais de apoiadores",
      "Devlogs e spoilers antecipados",
      "Participação em enquetes exclusivas",
    ],
    badge: "💎",
    featured: false,
  },
  {
    slug: "plus",
    name: "Apoiador+",
    discordRoleName: SUPPORT_ROLES.plus.name,
    roleId: SUPPORT_ROLES.plus.roleId,
    priceCents: 1990,
    description: "Para quem quer apoiar mais e acompanhar o projeto ainda mais de perto.",
    benefits: [
      "Tudo do plano Apoiador",
      "Cargo Patreon+ no Discord",
      "Prévia de recursos em desenvolvimento",
      "Prioridade em votações da comunidade",
      "Nome na página de apoiadores",
    ],
    badge: "🌟",
    featured: true,
  },
  {
    slug: "vip",
    name: "Apoiador VIP",
    discordRoleName: SUPPORT_ROLES.vip.name,
    roleId: SUPPORT_ROLES.vip.roleId,
    priceCents: 3990,
    description: "O nível máximo de apoio ao DBC: BlackDz Expanded.",
    benefits: [
      "Tudo do plano Apoiador+",
      "Cargo Patreon VIP no Discord",
      "Canal VIP exclusivo",
      "Destaque especial nos créditos",
      "Contato prioritário para feedback do projeto",
    ],
    badge: "👑",
    featured: false,
  },
] as const;

export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "1519101675703369778";
export const OWNER_DISCORD_ID = process.env.OWNER_DISCORD_ID || "1345387246282608751";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
