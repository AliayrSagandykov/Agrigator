"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// День недели = JS getDay(): 0=Вс..6=Сб.
const DAYS = [
  { d: 1, label: "Пн" }, { d: 2, label: "Вт" }, { d: 3, label: "Ср" },
  { d: 4, label: "Чт" }, { d: 5, label: "Пт" }, { d: 6, label: "Сб" }, { d: 0, label: "Вс" },
];
const TIMES = [10, 12, 14, 16, 18, 20];

export function AvailabilityForm({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Set<string>>(new Set(initial));
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  function toggle(key: string) {
    setSaved(false);
    setSlots((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function save() {
    setLoading(true);
    await fetch("/api/tutor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: Array.from(slots) }),
    });
    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="w-12"></th>
              {TIMES.map((t) => (
                <th key={t} className="font-medium text-muted-foreground">{t}:00</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(({ d, label }) => (
              <tr key={d}>
                <td className="text-right text-muted-foreground">{label}</td>
                {TIMES.map((t) => {
                  const key = `${d}-${t}`;
                  const on = slots.has(key);
                  return (
                    <td key={t}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className={cn(
                          "h-9 w-full rounded-md border text-xs transition-colors",
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50",
                        )}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={loading}>
          {loading ? "Сохраняем…" : "Сохранить расписание"}
        </Button>
        {saved && <span className="text-sm text-success">Сохранено ✓</span>}
        <span className="text-sm text-muted-foreground">Выбрано слотов: {slots.size}</span>
      </div>
    </div>
  );
}
