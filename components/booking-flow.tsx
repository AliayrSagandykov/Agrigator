"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, Video, CreditCard, CalendarClock } from "lucide-react";
import { cn, formatTenge } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Slot {
  iso: string;
  label: string;
}
interface BookingResult {
  booking: { id: string; meetLink: string; slotAt: string };
  amount: number;
  free: boolean;
  payUrl: string;
  paymentMode: string;
}

export function BookingFlow({
  tutorId,
  tutorName,
  price,
  trialFree,
  slots,
}: {
  tutorId: string;
  tutorName: string;
  price: number;
  trialFree: boolean;
  slots: Slot[];
}) {
  const [selected, setSelected] = useState<Slot | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (!selected) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId, slotAt: selected.iso, kind: "trial" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Не удалось забронировать");
      return;
    }
    setResult(data);
  }

  if (result) {
    return (
      <Card>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-success-foreground">
              <Check size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Слот забронирован</h2>
              <p className="text-sm text-muted-foreground">
                Пробный урок с {tutorName}, {selected?.label}
              </p>
            </div>
          </div>

          <InfoRow icon={<Video size={16} />} title="Ссылка на урок (сгенерирована автоматически)">
            <a href={result.booking.meetLink} target="_blank" className="break-all text-primary hover:underline">
              {result.booking.meetLink}
            </a>
          </InfoRow>

          {result.free ? (
            <InfoRow icon={<CalendarClock size={16} />} title="Оплата">
              Бесплатный пробный — оплата не нужна.
            </InfoRow>
          ) : (
            <InfoRow icon={<CreditCard size={16} />} title={`Оплата ${formatTenge(result.amount)} в эскроу`}>
              <a href={result.payUrl} target="_blank" className="text-primary hover:underline">
                Оплатить через Kaspi →
              </a>
              <p className="mt-1 text-xs text-muted-foreground">
                Деньги держатся в эскроу до урока.{" "}
                {result.paymentMode === "manual"
                  ? "Оператор подтвердит поступление вручную."
                  : "Подтверждение придёт автоматически после оплаты."}
              </p>
            </InfoRow>
          )}

          <Link href="/dashboard">
            <Button className="w-full">Перейти в кабинет</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold">Выбери слот</h2>
        <p className="text-sm text-muted-foreground">Свободное время {tutorName}.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((s) => (
          <button
            key={s.iso}
            onClick={() => setSelected(s)}
            className={cn(
              "rounded-lg border p-3 text-sm transition-colors",
              selected?.iso === s.iso
                ? "border-primary bg-accent font-medium"
                : "border-border hover:border-primary/50",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selected && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Дата</span>
              <span className="font-medium">{selected.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Формат</span>
              <span className="font-medium">Пробный урок · онлайн</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Цена</span>
              <span className="font-medium">{trialFree ? "Бесплатно" : formatTenge(price)}</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={confirm} disabled={loading}>
              {loading ? "Бронируем…" : trialFree ? "Подтвердить бронь" : "Подтвердить и оплатить"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon} {title}
      </div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
