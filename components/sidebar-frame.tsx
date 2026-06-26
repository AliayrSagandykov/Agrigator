"use client";
import { useEffect, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Каркас боковой панели: сворачивание (заводить/выводить) + фокус-режим.
// Используется и студенческим, и тьюторским сайдбаром.
// ============================================================

// Роуты онбординга — сайдбар скрыт, чтобы заполнение профиля было первым
// и единственным, что видит человек после регистрации.
const FOCUS_ROUTES = ["/onboarding", "/tutor/onboarding", "/tutor/match"];

export function isFocusedRoute(pathname: string): boolean {
  return FOCUS_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

const STORAGE_KEY = "agr-sidebar-collapsed";

/** Десктопная сворачиваемая обёртка. На мобайле сайдбар рисует ленту-чипы сам. */
export function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "1"); } catch {}
  }, []);

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label="Показать панель"
        title="Показать панель"
        className="fixed left-2 top-[4.5rem] z-30 hidden h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <PanelLeft size={15} />
      </button>
    );
  }

  return (
    <aside className="hidden border-r border-border bg-card/40 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-64 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-y-auto">
      <div className="relative p-3">
        <button
          type="button"
          onClick={toggle}
          aria-label="Свернуть панель"
          title="Свернуть панель"
          className={cn(
            "absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
          )}
        >
          <PanelLeftClose size={14} />
        </button>
        {children}
      </div>
    </aside>
  );
}
