import "server-only";
import { unstable_cache } from "next/cache";
import { query, one } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { TutorProfile } from "@/lib/types";

// ============================================================
// View-model тютора для витрины (каталог/матч/профиль).
// Метрики карточек — из кэша (cold-start); живые метрики дашборда
// считаются из Lesson/Result в lib/metrics.ts.
// ============================================================

export interface OwnScore {
  exam: string;
  score: string;
  verified: boolean;
}

export interface Contacts {
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
}

export interface TutorMetrics {
  metric: string;
  before: number;
  after: number;
  delta: number;
  sample: number;
  passRate: number;
  lessons: number;
  retention: number;
}

export interface TutorVM {
  id: string; // userId
  name: string;
  avatarColor: string | null;
  timezone: string | null;
  photo: string | null;
  gradient: string;
  subjects: string;
  exams: string[];
  price: number;
  priceUnit: string;
  format: string;
  city: string;
  experience: number;
  bio: string;
  methodology: string;
  responseTime: string;
  videoUrl: string;
  bookingUrl: string;
  verified: boolean;
  aiVerified: boolean;
  sponsored: boolean;
  trial: boolean;
  trialFree: boolean;
  ownScores: OwnScore[];
  achievements: string[];
  languages: string[];
  rating: number;
  metrics: TutorMetrics;
  contacts: Contacts;
}

// Строка JOIN-а профиля с именем/цветом/поясом пользователя.
type ProfileRow = TutorProfile & {
  userName: string;
  userAvatarColor: string | null;
  userTimezone: string | null;
};

const SELECT_TUTOR = `
  select p.*, u.name as "userName", u."avatarColor" as "userAvatarColor", u.timezone as "userTimezone"
  from "TutorProfile" p
  join "User" u on u.id = p."userId"
`;

export function toTutorVM(p: ProfileRow): TutorVM {
  const delta = Math.round((p.statAfter - p.statBefore) * 10) / 10;
  return {
    id: p.userId,
    name: p.userName,
    avatarColor: p.userAvatarColor,
    timezone: p.userTimezone,
    photo: p.photo,
    gradient: p.gradient,
    subjects: parseJson<string[]>(p.subjectsJson, []).join(", "),
    exams: parseJson<string[]>(p.examsJson, []),
    price: p.price,
    priceUnit: p.priceUnit,
    format: p.format,
    city: p.city,
    experience: p.experience,
    bio: p.bio,
    methodology: p.methodology,
    responseTime: p.responseTime,
    videoUrl: p.videoUrl,
    bookingUrl: p.bookingUrl,
    verified: p.verified,
    aiVerified: p.aiVerified,
    sponsored: p.sponsored,
    trial: p.trial,
    trialFree: p.trialFree,
    ownScores: parseJson<OwnScore[]>(p.ownScoresJson, []),
    achievements: parseJson<string[]>(p.achievementsJson, []),
    languages: parseJson<string[]>(p.languagesJson, []),
    rating: p.rating,
    metrics: {
      metric: p.statMetric,
      before: p.statBefore,
      after: p.statAfter,
      delta,
      sample: p.statSample,
      passRate: p.statPassRate,
      lessons: p.statLessons,
      retention: p.statRetention,
    },
    contacts: parseJson<Contacts>(p.contactsJson, {}),
  };
}

// Список тюторов одинаков для всех → кэшируем между запросами в Next Data Cache.
// Большинство заходов на /catalog, / и / профиль обслуживаются из кэша (0 round-trip
// до Токио вместо ~160 мс). Инвалидация — revalidateTag("tutors") при правках.
export const getTutorCards = unstable_cache(
  async (): Promise<TutorVM[]> => {
    const rows = await query<ProfileRow>(
      `${SELECT_TUTOR} order by p.sponsored desc, p.rating desc`,
    );
    return rows.map(toTutorVM);
  },
  ["tutor-cards"],
  { revalidate: 120, tags: ["tutors"] },
);

export const getTutorByUserId = unstable_cache(
  async (userId: string): Promise<TutorVM | null> => {
    const row = await one<ProfileRow>(`${SELECT_TUTOR} where p."userId" = $1`, [userId]);
    return row ? toTutorVM(row) : null;
  },
  ["tutor-by-id"],
  { revalidate: 120, tags: ["tutors"] },
);

/** Тюторы из избранного пользователя (ключ "tutor:<userId>"). */
export async function getFavoriteTutors(userId: string): Promise<TutorVM[]> {
  const rows = await query<ProfileRow>(
    `${SELECT_TUTOR}
     where ('tutor:' || p."userId") in (select key from "Favorite" where "userId" = $1)
     order by p.rating desc`,
    [userId],
  );
  return rows.map(toTutorVM);
}
