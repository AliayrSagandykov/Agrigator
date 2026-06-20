import { getTutorCards } from "@/lib/tutors";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteKeys } from "@/lib/queries";
import { TutorCard } from "@/components/tutor-card";
import { ALL_EXAMS, FORMATS } from "@/lib/constants";

export const metadata = { title: "Тюторы — Agrigator" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { exam?: string; format?: string; q?: string };
}) {
  const [all, user] = await Promise.all([getTutorCards(), getCurrentUser()]);
  const favs = user ? await getFavoriteKeys(user.id) : new Set<string>();
  const { exam, format, q } = searchParams;
  const query = (q ?? "").toLowerCase().trim();

  const tutors = all.filter((t) => {
    if (exam && !t.exams.includes(exam)) return false;
    if (format && t.format !== format) return false;
    if (query) {
      const hay = `${t.name} ${t.subjects} ${t.exams.join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">Тюторы</h1>
      <p className="mt-1 text-muted-foreground">
        Отсортированы по верифицированным метрикам. Не тысяча — только релевантное.
      </p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Select name="exam" label="Экзамен" defaultValue={exam}>
          <option value="">Все</option>
          {ALL_EXAMS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </Select>
        <Select name="format" label="Формат" defaultValue={format}>
          <option value="">Любой</option>
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </Select>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium">Поиск</label>
          <input
            name="q"
            defaultValue={q}
            placeholder="Имя, предмет…"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
          Применить
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">Найдено: {tutors.length}</p>

      {tutors.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Под фильтры никто не подошёл. Сбросьте часть условий.
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} isFav={favs.has(`tutor:${t.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Select({
  name,
  label,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </div>
  );
}
