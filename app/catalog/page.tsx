import { getTutorCards } from "@/lib/tutors";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteKeys } from "@/lib/queries";
import { getT } from "@/lib/locale";
import { TutorCard } from "@/components/tutor-card";
import { ALL_EXAMS, FORMATS } from "@/lib/constants";

export const metadata = { title: "Тюторы — Agrigator" };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { exam?: string; format?: string; q?: string; sort?: string; verified?: string };
}) {
  const [all, user] = await Promise.all([getTutorCards(), getCurrentUser()]);
  const favs = user ? await getFavoriteKeys(user.id) : new Set<string>();
  const tr = getT();
  const fmtLabel: Record<string, string> = { online: tr.catalog.online, offline: tr.catalog.offline, hybrid: tr.catalog.hybrid };
  const { exam, format, q, sort, verified } = searchParams;
  const query = (q ?? "").toLowerCase().trim();

  // Формат: «онлайн» включает гибрид, «оффлайн» включает гибрид.
  const formatMatch = (tf: string) => {
    if (!format) return true;
    if (format === "online") return tf === "online" || tf === "hybrid";
    if (format === "offline") return tf === "offline" || tf === "hybrid";
    return tf === format;
  };

  const filtered = all.filter((t) => {
    if (exam && !t.exams.includes(exam)) return false;
    if (!formatMatch(t.format)) return false;
    if (verified === "1" && !t.aiVerified) return false;
    if (query) {
      const hay = `${t.name} ${t.subjects} ${t.exams.join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const tutors = [...filtered];
  if (sort === "delta") tutors.sort((a, b) => b.metrics.delta - a.metrics.delta);
  else if (sort === "retention") tutors.sort((a, b) => b.metrics.retention - a.metrics.retention);
  else if (sort === "price_asc") tutors.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") tutors.sort((a, b) => b.price - a.price);
  // default — порядок getTutorCards (реклама + рейтинг)

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold">{tr.catalog.title}</h1>
      <p className="mt-1 text-muted-foreground">{tr.catalog.subtitle}</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Select name="exam" label={tr.catalog.exam} defaultValue={exam}>
          <option value="">{tr.catalog.examAll}</option>
          {ALL_EXAMS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </Select>
        <Select name="format" label={tr.catalog.format} defaultValue={format}>
          <option value="">{tr.catalog.formatAny}</option>
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{fmtLabel[f.value]}</option>
          ))}
        </Select>
        <Select name="sort" label={tr.catalog.sort} defaultValue={sort}>
          <option value="">{tr.catalog.sortRecommended}</option>
          <option value="delta">{tr.catalog.sortDelta}</option>
          <option value="retention">{tr.catalog.sortRetention}</option>
          <option value="price_asc">{tr.catalog.sortCheaper}</option>
          <option value="price_desc">{tr.catalog.sortPricier}</option>
        </Select>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium">{tr.catalog.search}</label>
          <input
            name="q"
            defaultValue={q}
            placeholder={tr.catalog.searchPh}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input type="checkbox" name="verified" value="1" defaultChecked={verified === "1"} />
          {tr.catalog.onlyVerified}
        </label>
        <button className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
          {tr.catalog.apply}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">{tr.catalog.found} {tutors.length}</p>

      {tutors.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          {tr.catalog.empty}
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
