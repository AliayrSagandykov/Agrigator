"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Search, Sparkles, Heart, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar, isFocusedRoute } from "@/components/sidebar-frame";
import type { Dict } from "@/lib/i18n";

// Боковая навигация кабинета студента. Визуально наследует лендинг:
// дуотон-градиентные иконки-плитки, акцентная подсветка активного пункта.
// На десктопе — полноразмерная панель у левого края (как в Render).
type Item = {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  gradient: string;
  active: (p: string) => boolean;
};

export function DashboardSidebar({
  labels,
  studentName,
}: {
  labels: Dict["dash"]["sidebar"];
  studentName: string;
}) {
  const pathname = usePathname();

  // На онбординге сайдбар скрыт — заполнение профиля идёт фокусным экраном.
  if (isFocusedRoute(pathname)) return null;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: labels.menu,
      items: [
        { key: "overview", label: labels.overview, href: "/dashboard", Icon: LayoutDashboard, gradient: "from-violet-500 to-indigo-500", active: (p) => p === "/dashboard" },
        { key: "find", label: labels.findTutor, href: "/catalog", Icon: Search, gradient: "from-sky-500 to-cyan-500", active: (p) => p.startsWith("/catalog") },
        { key: "match", label: labels.aiMatch, href: "/onboarding", Icon: Sparkles, gradient: "from-fuchsia-500 to-purple-500", active: (p) => p.startsWith("/onboarding") || p.startsWith("/match") },
      ],
    },
    {
      title: labels.learning,
      items: [
        { key: "favorites", label: labels.favorites, href: "/favorites", Icon: Heart, gradient: "from-rose-500 to-pink-500", active: (p) => p.startsWith("/favorites") },
        { key: "diagnostic", label: labels.diagnostic, href: "/diagnostic", Icon: Target, gradient: "from-amber-500 to-orange-500", active: (p) => p.startsWith("/diagnostic") },
        { key: "progress", label: labels.progress, href: "/dashboard#progress", Icon: TrendingUp, gradient: "from-emerald-500 to-teal-500", active: () => false },
      ],
    },
  ];

  const flat = groups.flatMap((g) => g.items);

  return (
    <>
      {/* Мобайл: горизонтальная лента-чипы */}
      <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-3 lg:hidden">
        {flat.map((it) => {
          const active = it.active(pathname);
          return (
            <Link
              key={it.key}
              href={it.href}
              className={cn(
                "group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                active ? "border-primary/40 bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br text-white", it.gradient)}>
                <it.Icon size={13} strokeWidth={2.4} />
              </span>
              {it.label}
            </Link>
          );
        })}
      </div>

      {/* Десктоп: полноразмерная сворачиваемая боковая панель */}
      <CollapsibleSidebar>
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-primary/10 via-violet-500/10 to-sky-500/10 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-600 text-sm font-bold text-white shadow-md">
              {studentName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{studentName}</div>
              <div className="text-xs text-muted-foreground">{labels.role}</div>
            </div>
          </div>

          <nav className="mt-4 space-y-5">
            {groups.map((g) => (
              <div key={g.title}>
                <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.title}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {g.items.map((it) => {
                    const active = it.active(pathname);
                    return (
                      <li key={it.key}>
                        <Link
                          href={it.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                            active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110",
                              it.gradient,
                            )}
                          >
                            <it.Icon size={16} strokeWidth={2.2} />
                          </span>
                          {it.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
      </CollapsibleSidebar>
    </>
  );
}
