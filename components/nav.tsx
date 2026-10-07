import Link from "next/link";
import { Brand } from "@/components/brand";
import type { SessionUser } from "@/lib/session";
import { OWNER_DISCORD_ID } from "@/lib/config";

export function Nav({ session }: { session: SessionUser | null }) {
  const isAdmin = session?.id === OWNER_DISCORD_ID;
  return (
    <header className="site-header">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Navegação principal">
          <Link href="/apoie">Apoie</Link>
          {session && <Link href="/dashboard">Minha conta</Link>}
          {isAdmin && <Link href="/admin">Admin</Link>}
          {session ? (
            <Link href="/api/auth/logout" className="btn btn-ghost btn-small">Sair</Link>
          ) : (
            <Link href="/api/auth/discord/start" className="btn btn-discord btn-small">Entrar com Discord</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
