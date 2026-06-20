import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { toPublicUser } from "@/lib/auth";
import { getFavoriteKeys } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { Analytics } from "@/components/analytics";

export const metadata: Metadata = {
  title: "Agrigator — тюторы с верифицированными результатами",
  description:
    "Выбирай тютора по реальным результатам, а не по чужому логотипу. Верифицированная дельта, удержание, бронь и оплата через платформу.",
  appleWebApp: { capable: true, title: "Agrigator" },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

const themeScript = `try{var t=localStorage.getItem('agr-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const favCount = user && user.role === "student" ? (await getFavoriteKeys(user.id)).size : 0;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader user={user ? toPublicUser(user) : null} favCount={favCount} />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="font-bold">
            🎓 Agri<span className="brand-grad">gator</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Агрегатор тюторов для подготовки к экзаменам. Выбор по верифицированным
            результатам. Данные демонстрационные.
          </p>
        </div>
        <FooterCol title="Экзамены" links={[["SAT", "/catalog?exam=SAT"], ["IELTS", "/catalog?exam=IELTS"], ["ЕНТ", "/catalog?exam=ЕНТ"], ["НМТ", "/catalog?exam=НМТ"]]} />
        <FooterCol title="Платформа" links={[["Тюторы", "/catalog"], ["AI-подбор", "/onboarding"], ["Тьюторам", "/for-tutors"]]} />
        <FooterCol title="Аккаунт" links={[["Войти", "/login"], ["Регистрация", "/register"], ["Кабинет", "/dashboard"]]} />
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © 2026 Agrigator · Демо-проект
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <ul className="space-y-1.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
