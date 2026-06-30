"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: {
        url: string;
        prefill?: { name?: string; email?: string };
      }) => void;
    };
  }
}

interface Labels {
  book: string;
  booked: string;
  bookedNote: string;
}

// Открывает Calendly во встроенном поповере и ловит событие реальной записи
// (`calendly.event_scheduled`) — работает на бесплатном Calendly, без вебхуков.
export function CalendlyBooking({
  url,
  tutorId,
  student,
  labels,
}: {
  url: string;
  tutorId: string;
  student: { name: string; email: string } | null;
  labels: Labels;
}) {
  const router = useRouter();
  const [booked, setBooked] = useState(false);
  const widgetLoading = useRef<Promise<void> | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as { event?: string; payload?: { event?: { uri?: string } } };
      if (data?.event !== "calendly.event_scheduled") return;
      setBooked(true);
      if (student) {
        const eventUri = data.payload?.event?.uri ?? "";
        fetch("/api/trial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tutorId, action: "scheduled", eventUri }),
        })
          .then(() => router.refresh())
          .catch(() => {});
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tutorId, student, router]);

  function ensureWidget(): Promise<void> {
    if (window.Calendly) return Promise.resolve();
    if (widgetLoading.current) return widgetLoading.current;
    widgetLoading.current = new Promise<void>((resolve) => {
      if (!document.getElementById("calendly-css")) {
        const link = document.createElement("link");
        link.id = "calendly-css";
        link.rel = "stylesheet";
        link.href = "https://assets.calendly.com/assets/external/widget.css";
        document.head.appendChild(link);
      }
      const s = document.createElement("script");
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      s.onload = () => resolve();
      document.body.appendChild(s);
    });
    return widgetLoading.current;
  }

  async function open() {
    // Гость / тьютор смотрит профиль — не трекаем, просто открываем Calendly.
    if (!student) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    // Отметим «открыл» (сигнал «заходил, но мог не записаться»).
    fetch("/api/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, action: "open" }),
    }).catch(() => {});

    await ensureWidget();
    window.Calendly?.initPopupWidget({
      url,
      prefill: { name: student.name, email: student.email },
    });
  }

  if (booked) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-center">
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
          <Check size={16} /> {labels.booked}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{labels.bookedNote}</p>
      </div>
    );
  }

  return (
    <Button type="button" onClick={open} className="w-full cursor-pointer" size="lg">
      <CalendarClock size={18} /> {labels.book}
    </Button>
  );
}
