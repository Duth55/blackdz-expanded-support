export const VIP_ROLES = {
  supporter: {
    name: "💎 Apoiador",
    roleId: "1557153494467878962",
  },
  plus: {
    name: "🌟 VIP",
    roleId: "1557153493339611157",
  },
  vip: {
    name: "👑 VIP+",
    roleId: "1557153489019215965",
  },
} as const;

// Alias mantido para compatibilidade interna com versões anteriores do projeto.
export const SUPPORT_ROLES = VIP_ROLES;

export const DEFAULT_PLANS = [
  {
    slug: "supporter",
    name: "Apoiador",
    discordRoleName: VIP_ROLES.supporter.name,
    roleId: VIP_ROLES.supporter.roleId,
    priceCents: 990,
    description: "A porta de entrada para quem quer fortalecer o projeto e fazer parte da área exclusiva da comunidade.",
    benefits: [
      "Cargo 💎 Apoiador no Discord",
      "Acesso aos canais exclusivos de apoiadores",
      "Devlogs e spoilers antecipados",
      "Participação em votações exclusivas",
    ],
    badge: "💎",
    featured: false,
  },
  {
    slug: "plus",
    name: "VIP",
    discordRoleName: VIP_ROLES.plus.name,
    roleId: VIP_ROLES.plus.roleId,
    priceCents: 1990,
    description: "Para quem quer ficar ainda mais perto do desenvolvimento e aproveitar uma experiência VIP na BlackDz Community.",
    benefits: [
      "Tudo do plano Apoiador",
      "Cargo 🌟 VIP no Discord",
      "Prévias de recursos em desenvolvimento",
      "Acesso a conteúdos e votações VIP",
      "Destaque na área de membros",
    ],
    badge: "🌟",
    featured: true,
  },
  {
    slug: "vip",
    name: "VIP+",
    discordRoleName: VIP_ROLES.vip.name,
    roleId: VIP_ROLES.vip.roleId,
    priceCents: 3990,
    description: "O nível máximo do DBC: BlackDz VIP para quem quer apoiar mais e receber os benefícios mais exclusivos.",
    benefits: [
      "Tudo do plano VIP",
      "Cargo 👑 VIP+ no Discord",
      "Canal VIP+ exclusivo",
      "Prioridade em novidades e testes quando disponíveis",
      "Destaque especial nos créditos do projeto",
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
