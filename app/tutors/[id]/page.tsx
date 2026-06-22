import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck, Lock, Star } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTutorByUserId } from "@/lib/tutors";
import { computeTutorMetrics } from "@/lib/metrics";
import { getReviewsFor, getFavoriteKeys } from "@/lib/queries";
import { Avatar } from "@/components/avatar";
import { FavoriteButton } from "@/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeltaChart } from "@/components/delta-chart";
import { MetricRow } from "@/components/metric-stat";
import { formatDelta, formatPrice, formatLabel } from "@/lib/utils";
import { getT } from "@/lib/locale";

export default async function TutorProfilePage({ params }: { params: { id: string } }) {
  const tutor = await getTutorByUserId(params.id);
  if (!tutor) notFound();

  const [user, metrics, reviews] = await Promise.all([
    getCurrentUser(),
    computeTutorMetrics(params.id),
    getReviewsFor("tutor", params.id),
  ]);

  const L = getT().profile;
  const canSeeContacts = user?.plan === "pro" || user?.role === "admin";
  const isFav = user ? (await getFavoriteKeys(user.id)).has(`tutor:${params.id}`) : false;

  return (
    <div className="container py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* MAIN */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar name={tutor.name} photo={tutor.photo} color={tutor.avatarColor} size={80} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{tutor.name}</h1>
                {tutor.verified && <ShieldCheck className="text-success" size={20} />}
                <FavoriteButton itemKey={`tutor:${tutor.id}`} initial={isFav} className="ml-auto border border-border" size={20} />
              </div>
              <p className="text-muted-foreground">{tutor.subjects}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {tutor.exams.map((e) => (
                  <Badge key={e} variant="secondary">{e}</Badge>
                ))}
                {tutor.aiVerified && (
                  <Badge variant="success"><BadgeCheck size={12} /> {L.resultsVerified}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Верифицированный график «до/после» */}
          <Card>
            <CardContent>
              <h2 className="mb-3 font-semibold">{L.studentResults}</h2>
              {tutor.metrics.sample > 0 ? (
                <DeltaChart
                  metric={tutor.metrics.metric}
                  before={tutor.metrics.before}
                  after={tutor.metrics.after}
                  sample={tutor.metrics.sample}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{L.metricsBuilding}</p>
              )}
              <div className="mt-5">
                <MetricRow
                  delta={formatDelta(metrics.delta)}
                  lessons={metrics.lessons}
                  retention={metrics.retention}
                  isLive={metrics.isLive}
                />
              </div>
            </CardContent>
          </Card>

          {/* О тюторе */}
          <section>
            <h2 className="font-semibold">{L.aboutTutor}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tutor.bio}</p>
            {tutor.methodology && (
              <p className="mt-3 text-sm"><span className="font-medium">{L.eduMethod}</span> {tutor.methodology}</p>
            )}
            {tutor.ownScores.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tutor.ownScores.map((s, i) => (
                  <Badge key={i} variant="outline">
                    {s.exam}: {s.score} {s.verified && <BadgeCheck size={12} className="text-success" />}
                  </Badge>
                ))}
              </div>
            )}
            {tutor.achievements.length > 0 && (
              <ul className="mt-4 space-y-1.5 text-sm">
                {tutor.achievements.map((a, i) => (
                  <li key={i} className="flex gap-2"><span className="text-success">✓</span> {a}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Отзывы — внизу, слабый сигнал */}
          <section>
            <h2 className="font-semibold">{L.reviews} <span className="text-muted-foreground">({reviews.length})</span></h2>
            <div className="mt-3 space-y-3">
              {reviews.length === 0 && <p className="text-sm text-muted-foreground">{L.noReviews}</p>}
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.authorName}</span>
                      <span className="flex items-center gap-0.5 text-sm text-amber-500">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} size={13} fill="currentColor" />
                        ))}
                      </span>
                    </div>
                    {r.beforeScore && r.afterScore && (
                      <div className="mt-1 text-xs text-success">
                        {r.beforeScore} → {r.afterScore} {r.verified && `· ${L.verifiedReview}`}
                      </div>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4">
          <Card className="lg:sticky lg:top-20">
            <CardContent className="space-y-4">
              <div>
                <div className="text-2xl font-bold">{formatPrice(tutor.price, tutor.priceUnit)}</div>
                <div className="text-sm text-muted-foreground">{L.responsePre}{tutor.responseTime}</div>
              </div>

              <Link href={`/book/${tutor.id}`} className="block">
                <Button className="w-full" size="lg">
                  {tutor.trialFree ? L.bookFreeTrial : L.bookTrial}
                </Button>
              </Link>

              <dl className="space-y-1.5 text-sm">
                <Row label={L.format} value={formatLabel(tutor.format)} />
                <Row label={L.city} value={tutor.city} />
                <Row label={L.experience} value={`${tutor.experience} ${L.years}`} />
                {tutor.languages.length > 0 && <Row label={L.languages} value={tutor.languages.join(", ")} />}
              </dl>

              {/* Контакты — Pro-фича (слабый замок, главный путь — бронь) */}
              <div className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                  <Lock size={14} /> {L.directContacts}
                </div>
                {canSeeContacts ? (
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    {tutor.contacts.telegram && <div>Telegram: @{tutor.contacts.telegram}</div>}
                    {tutor.contacts.whatsapp && <div>WhatsApp: {tutor.contacts.whatsapp}</div>}
                    {tutor.contacts.phone && <div>{L.phoneShort} {tutor.contacts.phone}</div>}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{L.proContacts}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
