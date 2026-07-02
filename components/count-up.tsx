"use client";
import { useEffect, useRef, useState } from "react";

// Счётчик, который «накручивается» при попадании в вьюпорт.
export function CountUp({
  to,
  suffix = "",
  prefix = "",
  duration = 1400,
  locale,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  locale?: string;
}) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setVal(to);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Страховка: если rAF заторможен (фоновая вкладка) — доставим финал таймером.
      setTimeout(() => setVal(to), duration + 400);
    };

    // Уже во вьюпорте при маунте (напр. герой вверху страницы) — стартуем сразу,
    // не полагаясь на IntersectionObserver (он молчит в неотрисованных вкладках).
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      run();
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const text = locale ? val.toLocaleString(locale) : String(val);
  return (
    <span ref={ref}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
