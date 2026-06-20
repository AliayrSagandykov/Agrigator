"use client";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n";

export function LangSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  function set(l: Locale) {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="relative">
      <label className="inline-flex h-9 items-center gap-1 rounded-lg px-2 hover:bg-muted">
        <Languages size={16} className="text-muted-foreground" />
        <select
          aria-label="Язык / Тіл / Language"
          value={current}
          onChange={(e) => set(e.target.value as Locale)}
          className="cursor-pointer appearance-none bg-transparent text-sm font-medium focus:outline-none"
        >
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
