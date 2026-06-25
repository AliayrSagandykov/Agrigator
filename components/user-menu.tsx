"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Monitor, LogOut, ChevronRight, Sun, Moon, Check } from "lucide-react";
import { Avatar } from "@/components/avatar";

interface Labels {
  accountSettings: string;
  theme: string;
  light: string;
  dark: string;
  logout: string;
}

// Меню профиля по клику на аватар (как в Render): имя/почта, настройки,
// тема (вложенное меню) и выход.
export function UserMenu({
  user,
  labels,
}: {
  user: { name: string; email: string; avatarColor: string | null; photo?: string | null };
  labels: Labels;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (localStorage.getItem("agr-theme") as "light" | "dark") || "light";
    setTheme(stored);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSubmenu(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSubmenu(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function setThemeMode(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem("agr-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  async function logout() {
    setOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user.name}
        className="flex cursor-pointer items-center rounded-full ring-offset-2 ring-offset-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar name={user.name} photo={user.photo} color={user.avatarColor} size={32} />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 top-12 z-50 w-64 rounded-xl border border-border bg-card p-1.5 shadow-xl"
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={user.name} photo={user.photo} color={user.avatarColor} size={36} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="my-1 border-t border-border" />

          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            <Settings size={16} className="text-muted-foreground" /> {labels.accountSettings}
          </Link>

          {/* Тема — вложенное меню (раскрывается влево, чтобы не уйти за край) */}
          <div
            className="relative"
            onMouseEnter={() => setSubmenu(true)}
            onMouseLeave={() => setSubmenu(false)}
          >
            <button
              role="menuitem"
              onClick={() => setSubmenu((v) => !v)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Monitor size={16} className="text-muted-foreground" />
              <span className="flex-1 text-left">{labels.theme}</span>
              <ChevronRight size={15} className="text-muted-foreground" />
            </button>

            {submenu && (
              <div className="animate-pop-in absolute right-full top-0 z-50 mr-1 w-40 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                <ThemeOption
                  icon={<Sun size={16} />}
                  label={labels.light}
                  active={theme === "light"}
                  onClick={() => setThemeMode("light")}
                />
                <ThemeOption
                  icon={<Moon size={16} />}
                  label={labels.dark}
                  active={theme === "dark"}
                  onClick={() => setThemeMode("dark")}
                />
              </div>
            )}
          </div>

          <div className="my-1 border-t border-border" />

          <button
            role="menuitem"
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted"
          >
            <LogOut size={16} className="text-muted-foreground" /> {labels.logout}
          </button>
        </div>
      )}
    </div>
  );
}

function ThemeOption({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
      }`}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {label}
      </span>
      {active && <Check size={15} className="text-primary" />}
    </button>
  );
}
