"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";

const NAMES: Record<Locale, { short: string; full: string }> = {
  ru: { short: "RU", full: "Русский" },
  kk: { short: "ҚАЗ", full: "Қазақша" },
  en: { short: "EN", full: "English" },
};

export function LangSwitcher({ current }: { current: Locale }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function set(l: Locale) {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Язык / Тіл / Language"
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Globe size={16} className="text-muted-foreground" />
        <span className="tabular-nums">{NAMES[current].short}</span>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="animate-pop-in absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {LOCALES.map((l) => {
            const active = l === current;
            return (
              <button
                key={l}
                role="option"
                aria-selected={active}
                onClick={() => set(l)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-9 text-xs font-semibold text-muted-foreground">{NAMES[l].short}</span>
                  <span className="font-medium">{NAMES[l].full}</span>
                </span>
                {active && <Check size={15} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
