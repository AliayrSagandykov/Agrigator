"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Inbox, CalendarClock, Users, TrendingUp, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSidebar, isFocusedRoute } from "@/components/sidebar-frame";
import type { Dict } from "@/lib/i18n";

// Боковая навигация кабинета тьютора. Тот же визуальный язык, что у студента
// (дуотон-градиентные иконки, акцент активного пункта), но пункты — про работу
// тьютора: входящие брони, расписание, ученики, портфель результатов.
type Item = {
  key: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  gradient: string;
  active: (p: string) => boolean;
};

export function TutorSidebar({
  labels,
  tutorName,
}: {
  labels: Dict["tutorDash"]["sidebar"];
  tutorName: string;
}) {
  const pathname = usePathname();

  // На онбординге/матч-тесте сайдбар скрыт — заполнение идёт фокусным экраном.
  if (isFocusedRoute(pathname)) return null;

  const groups: { title: string; items: Item[] }[] = [
    {
      title: labels.menu,
      items: [
        { key: "overview", label: labels.overview, href: "/tutor", Icon: LayoutDashboard, gradient: "from-violet-500 to-indigo-500", active: (p) => p === "/tutor" },
        { key: "inbox", label: labels.inbox, href: "/tutor/inbox", Icon: Inbox, gradient: "from-sky-500 to-cyan-500", active: (p) => p.startsWith("/tutor/inbox") },
        { key: "schedule", label: labels.schedule, href: "/tutor/schedule", Icon: CalendarClock, gradient: "from-fuchsia-500 to-purple-500", active: (p) => p.startsWith("/tutor/schedule") },
      ],
    },
    {
      title: labels.work,
      items: [
        { key: "students", label: labels.students, href: "/tutor#rooms", Icon: Users, gradient: "from-rose-500 to-pink-500", active: () => false },
        { key: "portfolio", label: labels.portfolio, href: "/tutor#portfolio", Icon: TrendingUp, gradient: "from-emerald-500 to-teal-500", active: () => false },
        { key: "profile", label: labels.profile, href: "/tutor/onboarding", Icon: UserCog, gradient: "from-amber-500 to-orange-500", active: (p) => p.startsWith("/tutor/onboarding") },
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
              {tutorName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{tutorName}</div>
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
