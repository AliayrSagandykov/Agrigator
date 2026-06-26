import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { toPublicUser } from "@/lib/auth";
import { getFavoriteKeys } from "@/lib/queries";
import { getLocale, getT } from "@/lib/locale";
import type { Dict } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
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
  const locale = getLocale();
  const t = getT();

  // Сайдбар кабинета не исчезает на всех страницах залогиненного студента.
  const showSidebar = !!user && user.role === "student";

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader user={user ? toPublicUser(user) : null} favCount={favCount} />
        {showSidebar ? (
          <div className="flex flex-1 flex-col lg:flex-row">
            <DashboardSidebar labels={t.dash.sidebar} studentName={user.name} />
            <main className="min-w-0 flex-1">{children}</main>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
        <Footer t={t} />
        <Analytics />
      </body>
    </html>
  );
}

function Footer({ t }: { t: Dict }) {
  return (
    <footer className="border-t border-border">
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        <div>
          <div className="font-bold">
            🎓 Agri<span className="brand-grad">gator</span>
          </div>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t.footer.tagline}</p>
        </div>
        <FooterCol title={t.footer.exams} links={[["IELTS", "/catalog?exam=IELTS"], ["SAT", "/catalog?exam=SAT"], ["ЕНТ", "/catalog?exam=ЕНТ"], ["TOEFL", "/catalog?exam=TOEFL"]]} />
        <FooterCol title={t.footer.platform} links={[[t.nav.tutors, "/catalog"], [t.nav.forTutors, "/for-tutors"], [t.nav.contacts, "/contacts"], [t.footer.support, "/contacts#donate"]]} />
        <FooterCol title={t.footer.account} links={[[t.nav.login, "/login"], [t.nav.register, "/register"]]} />
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        {t.footer.rights}
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
