import Link from "next/link";
import { GraduationCap, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { Avatar } from "@/components/avatar";
import { MobileNav } from "@/components/mobile-nav";
import { LangSwitcher } from "@/components/lang-switcher";
import { Button } from "@/components/ui/button";
import { getT, getLocale } from "@/lib/locale";
import type { PublicUser } from "@/lib/auth";

export function SiteHeader({ user, favCount = 0 }: { user: PublicUser | null; favCount?: number }) {
  const t = getT();
  const locale = getLocale();
  const dashboardHref =
    user?.role === "tutor" ? "/tutor" : user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="text-primary" size={24} />
          <span>
            Agri<span className="brand-grad">gator</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex">
          <NavLink href="/">{t.nav.home}</NavLink>
          <NavLink href="/catalog">{t.nav.tutors}</NavLink>
          <NavLink href="/for-tutors">{t.nav.forTutors}</NavLink>
          <NavLink href="/contacts">{t.nav.contacts}</NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <LangSwitcher current={locale} />
          <ThemeToggle />
          {user ? (
            <>
              {user.role === "student" && (
                <Link
                  href="/favorites"
                  aria-label={t.nav.favorites}
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <Heart size={18} className={favCount ? "text-rose-500" : ""} fill={favCount ? "currentColor" : "none"} />
                  {favCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {favCount}
                    </span>
                  )}
                </Link>
              )}
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted"
              >
                <Avatar name={user.name} color={user.avatarColor} size={32} />
                <span className="hidden text-sm font-medium sm:inline">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
              <LogoutButton label={t.nav.logout} />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t.nav.login}
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm">{t.nav.register}</Button>
              </Link>
            </>
          )}
          <MobileNav user={user} favCount={favCount} labels={t.nav} />
        </div>
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
