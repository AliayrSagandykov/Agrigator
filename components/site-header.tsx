import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { LangSwitcher } from "@/components/lang-switcher";
import { NavSearch } from "@/components/nav-search";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { getT, getLocale } from "@/lib/locale";
import type { PublicUser } from "@/lib/auth";

export function SiteHeader({ user, favCount = 0 }: { user: PublicUser | null; favCount?: number }) {
  const t = getT();
  const locale = getLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold">
          <GraduationCap className="text-primary" size={24} />
          <span className="hidden sm:inline">
            Agri<span className="brand-grad">gator</span>
          </span>
        </Link>

        {user ? (
          /* ── Залогинен: поиск + меню профиля ── */
          <>
            <div className="flex flex-1 justify-center">
              <NavSearch placeholder={t.nav.searchPlaceholder} />
            </div>
            <UserMenu
              user={{ name: user.name, email: user.email, avatarColor: user.avatarColor, photo: user.photo }}
              labels={{
                accountSettings: t.nav.accountSettings,
                theme: t.nav.theme,
                light: t.nav.light,
                dark: t.nav.dark,
                logout: t.nav.logout,
              }}
            />
          </>
        ) : (
          /* ── Гость: маркетинговая навигация ── */
          <>
            <nav className="ml-2 hidden items-center gap-1 text-sm md:flex">
              <NavLink href="/catalog">{t.nav.tutors}</NavLink>
              <NavLink href="/onboarding">{t.nav.match}</NavLink>
              <NavLink href="/for-tutors">{t.nav.forTutors}</NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-1">
              <LangSwitcher current={locale} />
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">{t.nav.register}</Button>
              </Link>
              <MobileNav user={user} favCount={favCount} labels={t.nav} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </Link>
  );
}
