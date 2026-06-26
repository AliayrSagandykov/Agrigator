import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Repeat,
  GraduationCap,
  Globe,
  Languages,
  Calculator,
  PenTool,
  Landmark,
  BookOpen,
  FlaskConical,
  Sigma,
  Briefcase,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeltaChart } from "@/components/delta-chart";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/reveal";
import { CountUp } from "@/components/count-up";
import { getTutorCards } from "@/lib/tutors";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/locale";
import { formatPrice } from "@/lib/utils";

// Метаданные экзаменов-категорий: иконка, дуотон-градиент и целевой ориентир.
// Значения цели локале-нейтральны (числа/буквы), порядок — приоритет показа.
const CATEGORY_META: { exam: string; Icon: LucideIcon; gradient: string; goal: string }[] = [
  { exam: "IELTS", Icon: Globe, gradient: "from-violet-500 to-indigo-500", goal: "Band 7.5+" },
  { exam: "SAT", Icon: Calculator, gradient: "from-sky-500 to-cyan-500", goal: "1500+" },
  { exam: "TOEFL", Icon: Languages, gradient: "from-emerald-500 to-teal-500", goal: "100+ iBT" },
  { exam: "ЕНТ", Icon: GraduationCap, gradient: "from-amber-500 to-orange-500", goal: "120+" },
  { exam: "NUET", Icon: Landmark, gradient: "from-rose-500 to-pink-500", goal: "170+" },
  { exam: "IB", Icon: BookOpen, gradient: "from-fuchsia-500 to-purple-500", goal: "40 / 45" },
  { exam: "A-Level", Icon: FlaskConical, gradient: "from-blue-500 to-violet-500", goal: "A*/A" },
  { exam: "AP", Icon: Sigma, gradient: "from-cyan-500 to-blue-500", goal: "5 / 5" },
  { exam: "GMAT", Icon: Briefcase, gradient: "from-indigo-500 to-blue-500", goal: "700+" },
  { exam: "GRE", Icon: BrainCircuit, gradient: "from-teal-500 to-emerald-500", goal: "165+" },
  { exam: "ACT", Icon: PenTool, gradient: "from-orange-500 to-rose-500", goal: "32+" },
];

export default async function HomePage() {
  // Залогиненный пользователь не видит лендинг — сразу в свой кабинет.
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "tutor" ? "/tutor" : user.role === "admin" ? "/admin" : "/dashboard");
  }

  const tr = getT();
  const tutors = await getTutorCards();

  // Реальные метрики для строки доверия и категорий — из данных, не из воздуха.
  const proof = tutors.filter((t) => t.aiVerified && t.metrics.sample > 30).slice(0, 3);
  const totalStudents = tutors.reduce((s, t) => s + t.metrics.sample, 0);
  const examSet = new Set(tutors.flatMap((t) => t.exams));
  const avgRetention = tutors.length
    ? Math.round(tutors.reduce((s, t) => s + t.metrics.retention, 0) / tutors.length)
    : 0;
  const avgRating = tutors.length
    ? (tutors.reduce((s, t) => s + t.rating, 0) / tutors.length).toFixed(1)
    : "5.0";

  // Категории показываем только с живыми тюторами, по убыванию количества.
  const examCount = new Map<string, number>();
  tutors.forEach((t) => t.exams.forEach((e) => examCount.set(e, (examCount.get(e) ?? 0) + 1)));
  const categories = CATEGORY_META.map((c) => ({ ...c, count: examCount.get(c.exam) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const popular = categories.slice(0, 5).map((c) => c.exam);

  return (
    <div>
      {/* ───────── HERO: поиск как главный CTA ───────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="animate-float-slow absolute left-1/2 top-[-14rem] h-[34rem] w-[60rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/30 via-violet-400/20 to-sky-400/25 blur-3xl" />
          <div className="animate-float-slow absolute -left-32 top-24 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl [animation-delay:-6s]" />
          <div className="animate-float-slow absolute -right-24 top-10 h-80 w-80 rounded-full bg-sky-400/25 blur-3xl [animation-delay:-3s]" />
          <div className="absolute inset-0 hero-grid" />
        </div>

        <div className="container py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <ShieldCheck size={14} className="text-success" /> {tr.home.badge}
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">
              {tr.home.heroLead} <span className="brand-grad-anim">{tr.home.heroHL}</span>
              {tr.home.heroTail}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {tr.home.subtitle}
            </p>

            {/* Поисковая строка → каталог */}
            <form
              action="/catalog"
              method="get"
              className="mx-auto mt-9 flex w-full max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-xl shadow-primary/5 transition-shadow focus-within:border-primary/50 focus-within:shadow-2xl focus-within:shadow-primary/15"
            >
              <label htmlFor="hero-q" className="sr-only">
                {tr.catalog.search}
              </label>
              <div className="flex flex-1 items-center gap-2 pl-3">
                <Search size={18} className="shrink-0 text-muted-foreground" />
                <input
                  id="hero-q"
                  name="q"
                  placeholder={tr.home.searchPlaceholder}
                  className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0 cursor-pointer">
                {tr.home.searchBtn}
              </Button>
            </form>

            {/* Популярные экзамены — быстрые чипы */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">{tr.home.popularLabel}</span>
              {popular.map((e) => (
                <Link
                  key={e}
                  href={`/catalog?exam=${encodeURIComponent(e)}`}
                  className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary"
                >
                  {e}
                </Link>
              ))}
            </div>

            {/* Соц-доказательство: аватары + рейтинг */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <div className="flex -space-x-3">
                {tutors.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-full ring-2 ring-background transition-transform hover:z-10 hover:-translate-y-1"
                  >
                    <Avatar name={t.name} photo={t.photo} color={t.avatarColor} size={36} />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star size={15} className="fill-amber-400 text-amber-400" /> {avgRating}
                </span>{" "}
                · {tr.home.trustNote}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── БЕГУЩАЯ СТРОКА ЭКЗАМЕНОВ ───────── */}
      <section className="border-b border-border bg-muted/20 py-5">
        <div className="marquee-mask overflow-hidden">
          <div className="flex w-max items-center gap-3 animate-marquee hover:[animation-play-state:paused]">
            {[...CATEGORY_META, ...CATEGORY_META].map((c, i) => (
              <div
                key={i}
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${c.gradient} text-white`}
                >
                  <c.Icon size={13} strokeWidth={2.4} />
                </span>
                <span className="text-sm font-semibold">{c.exam}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── СТАТИСТИКА (строка доверия) ───────── */}
      <section className="border-b border-border bg-muted/30">
        <Reveal>
          <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            <Stat to={tutors.length} suffix="+" label={tr.home.statTutors} />
            <Stat to={totalStudents} suffix="+" locale="ru-RU" label={tr.home.statStudents} />
            <Stat to={examSet.size} label={tr.home.statExams} />
            <Stat to={avgRetention} suffix="%" label={tr.home.statRetention} />
          </div>
        </Reveal>
      </section>

      {/* ───────── КАТЕГОРИИ: все экзамены в одном месте ───────── */}
      <section className="container py-16 md:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{tr.home.examsTitle}</h2>
            <p className="mt-3 text-muted-foreground">{tr.home.examsSub}</p>
          </div>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.exam} delay={i * 55} className="h-full">
              <Link
                href={`/catalog?exam=${encodeURIComponent(c.exam)}`}
                className="lift group flex h-full cursor-pointer flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <c.Icon size={22} strokeWidth={2.2} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold tracking-tight">{c.exam}</h3>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {c.goal}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {c.count} {tr.home.tutorsWord}
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-primary transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 text-center">
            <Link href="/catalog">
              <Button variant="outline" size="lg" className="group cursor-pointer">
                {tr.home.allTutors}{" "}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ───────── PROOF: верифицированные результаты тюторов ───────── */}
      {proof.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="container py-16 md:py-20">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  <Sparkles size={13} /> {tr.home.badge}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{tr.home.proofTitle}</h2>
                <p className="mt-3 text-muted-foreground">{tr.home.proofSub}</p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {proof.map((t, i) => (
                <Reveal key={t.id} delay={i * 90} className="h-full">
                  <Card className="lift group h-full overflow-hidden p-0 hover:border-primary/40 hover:shadow-xl">
                    <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-sky-500" />
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.name} photo={t.photo} color={t.avatarColor} size={48} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold">
                            {t.name}
                            <ShieldCheck size={15} className="shrink-0 text-success" />
                          </div>
                          <div className="truncate text-sm text-muted-foreground">{t.exams.join(", ")}</div>
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

                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm font-medium">{formatPrice(t.price, t.priceUnit)}</span>
                        <Link
                          href={`/tutors/${t.id}`}
                          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          {tr.home.proofLink} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── WHY: почему именно Agrigator ───────── */}
      <section className="container py-16 md:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{tr.home.whyTitle}</h2>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Reveal delay={0} className="h-full">
            <Why icon={<TrendingUp size={22} />} gradient="from-emerald-500 to-teal-500" title={tr.home.why1Title}>
              {tr.home.why1Body}
            </Why>
          </Reveal>
          <Reveal delay={90} className="h-full">
            <Why icon={<Repeat size={22} />} gradient="from-violet-500 to-indigo-500" title={tr.home.why2Title}>
              {tr.home.why2Body}
            </Why>
          </Reveal>
          <Reveal delay={180} className="h-full">
            <Why icon={<ShieldCheck size={22} />} gradient="from-sky-500 to-cyan-500" title={tr.home.why3Title}>
              {tr.home.why3Body}
            </Why>
          </Reveal>
        </div>
      </section>

      {/* ───────── CTA-баннер ───────── */}
      <section className="container pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-violet-600 px-6 py-14 text-center shadow-xl md:py-20">
            <div className="animate-float-slow pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="animate-float-slow pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl [animation-delay:-5s]" />
            <div className="pointer-events-none absolute inset-0 hero-grid opacity-20" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{tr.home.ctaTitle}</h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/85 md:text-lg">{tr.home.ctaSub}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register?role=student" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="group w-full cursor-pointer bg-white text-primary hover:bg-white/90"
                  >
                    {tr.home.ctaFind}{" "}
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link href="/for-tutors" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full cursor-pointer border-white/40 bg-transparent text-white hover:bg-white/10"
                  >
                    <GraduationCap size={18} /> {tr.home.ctaTutor}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function Stat({
  to,
  suffix,
  locale,
  label,
}: {
  to: number;
  suffix?: string;
  locale?: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="brand-grad text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
        <CountUp to={to} suffix={suffix} locale={locale} />
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Why({
  icon,
  gradient,
  title,
  children,
}: {
  icon: React.ReactNode;
  gradient: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
