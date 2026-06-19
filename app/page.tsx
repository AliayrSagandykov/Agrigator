import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, TrendingUp, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeltaChart } from "@/components/delta-chart";
import { Avatar } from "@/components/avatar";
import { getTutorCards } from "@/lib/tutors";

export default async function HomePage() {
  const tutors = await getTutorCards();
  const proof = tutors.filter((t) => t.aiVerified && t.metrics.sample > 30).slice(0, 3);

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck size={14} className="text-success" /> Результаты проверены извне
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Выбирай тютора по <span className="brand-grad">реальным результатам</span>,
              а не по чужому логотипу
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Верифицированная дельта баллов, удержание учеников, бронь и оплата — в одном
              месте. Цифрам неоткуда врать: их ставит система.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/onboarding">
                <Button size="lg" className="w-full sm:w-auto">
                  Я ищу тютора <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/for-tutors">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <GraduationCap size={18} /> Я тютор
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="container py-14">
        <h2 className="text-center text-2xl font-bold">Доказательства, а не обещания</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Каждый график «до/после» построен по верифицированным результатам учеников.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {proof.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.name} photo={t.photo} color={t.avatarColor} size={48} />
                <div>
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-sm text-muted-foreground">{t.exams.join(", ")}</div>
                </div>
              </div>
              <div className="mt-4">
                <DeltaChart
                  metric={t.metrics.metric}
                  before={t.metrics.before}
                  after={t.metrics.after}
                  sample={t.metrics.sample}
                />
              </div>
              <Link
                href={`/tutors/${t.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Профиль тютора <ArrowRight size={14} />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="border-t border-border bg-muted/30">
        <div className="container grid gap-6 py-14 md:grid-cols-3">
          <Why icon={<TrendingUp className="text-success" />} title="Дельта, а не звёздочки">
            Главный сигнал — насколько вырос балл ученика. Baseline ставит диагностика или
            официальный прошлый результат, финал — score report. Тютор число не вводит.
          </Why>
          <Why icon={<Repeat className="text-primary" />} title="Удержание как правда">
            Возвращаются ли ученики — видно из переброней. А ушёл «потому что сдал» или
            «потому что не подошёл» — уточняем одним тапом.
          </Why>
          <Why icon={<ShieldCheck className="text-success" />} title="Всё через платформу">
            Бронь, авто-ссылка на урок и оплата в эскроу. Оставаться в приложении удобнее,
            чем уходить в личку.
          </Why>
        </div>
      </section>
    </div>
  );
}

function Why({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">{icon}</div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
