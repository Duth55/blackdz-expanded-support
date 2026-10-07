import "server-only";
import { DISCORD_GUILD_ID, SUPPORT_ROLES } from "@/lib/config";

const API = "https://discord.com/api/v10";

function botToken() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN não configurado.");
  return token;
}

async function discordBotFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok && response.status !== 204) {
    const text = await response.text().catch(() => "");
    throw new Error(`Discord API ${response.status}: ${text || response.statusText}`);
  }
  return response;
}

export async function getGuildMember(userId: string) {
  const response = await discordBotFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}`);
  return response.json() as Promise<{ roles: string[]; user?: { id: string; username: string } }>;
}

export async function addRole(userId: string, roleId: string) {
  await discordBotFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
  });
}

export async function removeRole(userId: string, roleId: string) {
  await discordBotFetch(`/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
  });
}

export async function clearSupportRoles(userId: string) {
  const member = await getGuildMember(userId);
  const roleIds = Object.values(SUPPORT_ROLES).map((r) => r.roleId);
  await Promise.all(
    roleIds.filter((id) => member.roles.includes(id)).map((id) => removeRole(userId, id)),
  );
}

export async function syncSupportRole(userId: string, roleId: string) {
  const member = await getGuildMember(userId);
  const supportRoleIds = Object.values(SUPPORT_ROLES).map((r) => r.roleId);
  for (const id of supportRoleIds) {
    if (id !== roleId && member.roles.includes(id)) await removeRole(userId, id);
  }
  if (!member.roles.includes(roleId)) await addRole(userId, roleId);
}
