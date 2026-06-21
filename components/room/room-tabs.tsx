"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface RoomTab {
  id: string;
  label: string;
  badge?: number;
  content: React.ReactNode;
}

// Переключатель разделов кабинета. Контент рендерится на сервере и передаётся
// как ReactNode — данные не утекают на клиент, переключение мгновенное.
export function RoomTabs({ tabs }: { tabs: RoomTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
              active === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary">
                {t.badge}
              </span>
            ) : null}
            {active === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
      <div className="py-5">{current?.content}</div>
    </div>
  );
}
