import type { Metadata } from "next";
import "./globals.css";
import { getSession } from "@/lib/session";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "BlackDz Expanded Support",
  description: "Apoie o desenvolvimento do DBC: BlackDz Expanded e desbloqueie benefícios na comunidade.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="pt-BR">
      <body>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <Nav session={session} />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <strong>DBC: BlackDz Expanded</strong>
              <p>Projeto independente da comunidade. Não afiliado à Mojang, Microsoft, Toei Animation ou Patreon.</p>
            </div>
            <div className="footer-links">
              <a href="/termos">Termos</a>
              <a href="/privacidade">Privacidade</a>
              <a href={process.env.NEXT_PUBLIC_CURSEFORGE_URL || "https://www.curseforge.com/minecraft/mc-mods/dbc-blackdz-expanded"} target="_blank" rel="noreferrer">CurseForge</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
