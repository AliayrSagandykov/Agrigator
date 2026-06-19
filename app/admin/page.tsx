import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { payments } from "@/lib/payments";
import { getPendingPayments, getSubmittedResults, getLeads, getAdminCounts } from "@/lib/queries";
import { parseJson, formatTenge, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricStat } from "@/components/metric-stat";
import { ConfirmPaymentButton } from "@/components/admin/confirm-payment-button";
import { VerifyResultForm } from "@/components/admin/verify-result-form";

export const metadata = { title: "Оператор — Agrigator" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [pending, submitted, leads, counts] = await Promise.all([
    getPendingPayments(),
    getSubmittedResults(),
    getLeads(),
    getAdminCounts(),
  ]);

  const { tutors: tutorCount, students: studentCount, bookings: bookingCount, lessons: lessonCount } = counts;

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Оператор</h1>
        <Badge variant={payments.mode === "auto" ? "success" : "secondary"}>
          режим оплат: {payments.mode}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricStat value={String(tutorCount)} label="тьюторов" />
        <MetricStat value={String(studentCount)} label="учеников" />
        <MetricStat value={String(bookingCount)} label="броней" />
        <MetricStat value={String(lessonCount)} label="уроков" />
      </div>

      {/* Подтверждение оплат (manual режим) */}
      <Section title="Оплаты к подтверждению" hint="Поступление видно в Kaspi Pay → подтверди вручную (в auto это делает вебхук).">
        {pending.length === 0 ? (
          <Empty>Нет ожидающих оплат.</Empty>
        ) : (
          pending.map((p) => (
            <Row key={p.id}>
              <div>
                <div className="font-medium">{p.studentName} → {p.tutorName}</div>
                <div className="text-sm text-muted-foreground">{formatTenge(p.amount)} · бронь #{p.bookingId.slice(0, 6)} · {formatDateTime(p.createdAt)}</div>
              </div>
              <ConfirmPaymentButton bookingId={p.bookingId} />
            </Row>
          ))
        )}
      </Section>

      {/* Верификация результатов */}
      <Section title="Результаты к верификации" hint="Прочитай score report и введи финальный балл. Дельту посчитает система.">
        {submitted.length === 0 ? (
          <Empty>Нет результатов на проверке.</Empty>
        ) : (
          submitted.map((r) => (
            <Row key={r.id}>
              <div>
                <div className="font-medium">{r.studentName} · {r.exam}</div>
                <div className="text-sm text-muted-foreground">
                  тютор {r.tutorName} · baseline {r.baseline ?? "—"}
                  {r.reportUrl && <> · <a href={r.reportUrl} target="_blank" className="text-primary hover:underline">report</a></>}
                </div>
              </div>
              <VerifyResultForm resultId={r.id} baseline={r.baseline} />
            </Row>
          ))
        )}
      </Section>

      {/* Лиды парсера */}
      <Section title="Лиды парсера" hint="Объявления из Instagram/OLX/Telegram — кандидаты в каталог.">
        {leads.length === 0 ? (
          <Empty>Лидов нет.</Empty>
        ) : (
          leads.map((l) => {
            const parsed = parseJson<Record<string, unknown>>(l.parsedJson, {});
            return (
              <Row key={l.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{l.source}</Badge>
                    <span className="font-medium">{String(parsed.title ?? "Лид")}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{l.rawText}</div>
                </div>
                <Badge variant={l.status === "new" ? "secondary" : "success"}>{l.status}</Badge>
              </Row>
            );
          })
        )}
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">{children}</CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{children}</p>;
}
