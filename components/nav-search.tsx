"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

// Поиск в навбаре для залогиненных (как в Render). Ctrl/⌘+K — фокус, Enter — в каталог.
export function NavSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = ref.current?.value.trim() ?? "";
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex h-10 w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm transition-colors focus-within:border-primary/50 focus-within:bg-background"
    >
      <Search size={16} className="shrink-0 text-muted-foreground" />
      <input
        ref={ref}
        name="q"
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-full w-full bg-transparent outline-none placeholder:text-muted-foreground"
      />
      <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
        Ctrl K
      </kbd>
    </form>
  );
}
