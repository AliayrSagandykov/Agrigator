import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { payments } from "@/lib/payments";
import { getPendingPayments, getSubmittedResults, getLeads, getAdminCounts, getTutorsWithEscrow, getAdminTutors } from "@/lib/queries";
import { parseJson, formatTenge, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricStat } from "@/components/metric-stat";
import { ConfirmPaymentButton } from "@/components/admin/confirm-payment-button";
import { VerifyResultForm } from "@/components/admin/verify-result-form";
import { PayoutButton } from "@/components/admin/payout-button";
import { LeadActions } from "@/components/admin/lead-actions";
import { TutorActions } from "@/components/admin/tutor-actions";
import { getT } from "@/lib/locale";

export const metadata = { title: "Оператор — Agrigator" };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const L = getT().admin;
  const [pending, submitted, escrow, leads, adminTutors, counts] = await Promise.all([
    getPendingPayments(),
    getSubmittedResults(),
    getTutorsWithEscrow(),
    getLeads(),
    getAdminTutors(),
    getAdminCounts(),
  ]);

  const { tutors: tutorCount, students: studentCount, bookings: bookingCount, lessons: lessonCount } = counts;

  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{L.title}</h1>
        <Badge variant={payments.mode === "auto" ? "success" : "secondary"}>
          {L.payMode} {payments.mode}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricStat value={String(tutorCount)} label={L.tutors} />
        <MetricStat value={String(studentCount)} label={L.students} />
        <MetricStat value={String(bookingCount)} label={L.bookings} />
        <MetricStat value={String(lessonCount)} label={L.lessons} />
      </div>

      {/* Подтверждение оплат (manual режим) */}
      <Section title={L.payTitle} hint={L.payHint}>
        {pending.length === 0 ? (
          <Empty>{L.noPending}</Empty>
        ) : (
          pending.map((p) => (
            <Row key={p.id}>
              <div>
                <div className="font-medium">{p.studentName} → {p.tutorName}</div>
                <div className="text-sm text-muted-foreground">{formatTenge(p.amount)} · {L.bookingShort}{p.bookingId.slice(0, 6)} · {formatDateTime(p.createdAt)}</div>
              </div>
              <ConfirmPaymentButton bookingId={p.bookingId} labels={L} />
            </Row>
          ))
        )}
      </Section>

      {/* Верификация результатов */}
      <Section title={L.resTitle} hint={L.resHint}>
        {submitted.length === 0 ? (
          <Empty>{L.noResults}</Empty>
        ) : (
          submitted.map((r) => (
            <Row key={r.id}>
              <div>
                <div className="font-medium">{r.studentName} · {r.exam}</div>
                <div className="text-sm text-muted-foreground">
                  {L.tutorWord} {r.tutorName} · baseline {r.baseline ?? "—"}
                  {r.reportUrl && <> · <a href={r.reportUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">report</a></>}
                </div>
              </div>
              <VerifyResultForm resultId={r.id} baseline={r.baseline} labels={L} />
            </Row>
          ))
        )}
      </Section>

      {/* Выплаты тьюторам */}
      <Section title={L.payoutTitle} hint={L.payoutHint}>
        {escrow.length === 0 ? (
          <Empty>{L.noPayouts}</Empty>
        ) : (
          escrow.map((e) => (
            <Row key={e.tutorId}>
              <div>
                <div className="font-medium">{e.tutorName}</div>
                <div className="text-sm text-muted-foreground">{L.inEscrow} {formatTenge(e.amount)}</div>
              </div>
              <PayoutButton tutorId={e.tutorId} labels={L} />
            </Row>
          ))
        )}
      </Section>

      {/* Лиды парсера */}
      <Section title={L.leadsTitle} hint={L.leadsHint}>
        {leads.length === 0 ? (
          <Empty>{L.noLeads}</Empty>
        ) : (
          leads.map((l) => {
            const parsed = parseJson<Record<string, unknown>>(l.parsedJson, {});
            return (
              <Row key={l.id}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{l.source}</Badge>
                    <span className="font-medium">{String(parsed.title ?? L.leadWord)}</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{l.rawText}</div>
                </div>
                {l.status === "new" ? (
                  <LeadActions id={l.id} labels={L} />
                ) : (
                  <Badge variant={l.status === "imported" ? "success" : "secondary"}>{l.status}</Badge>
                )}
              </Row>
            );
          })
        )}
      </Section>

      {/* Управление карточками тьюторов */}
      <Section title={L.tutorsMgmtTitle} hint={L.tutorsMgmtHint}>
        {adminTutors.map((t) => (
          <Row key={t.userId}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                {t.source === "parser" && <Badge variant="outline">{L.fromLead}</Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                {parseJson<string[]>(t.examsJson, []).join(", ") || "—"} · {L.sampleWord} {t.statSample}
              </div>
            </div>
            <TutorActions userId={t.userId} sponsored={t.sponsored} aiVerified={t.aiVerified} labels={L} />
          </Row>
        ))}
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
