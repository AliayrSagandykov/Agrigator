import "server-only";
import { prisma } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import type { TutorProfile, User } from "@prisma/client";

// ============================================================
// View-model тютора для витрины (каталог/матч/профиль).
// Метрики карточек берутся из кэша (cold-start); живые метрики
// для дашборда — в lib/metrics.ts (считаются из Lesson/Result).
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

type ProfileWithUser = TutorProfile & { user: User };

export function toTutorVM(p: ProfileWithUser): TutorVM {
  const delta = Math.round((p.statAfter - p.statBefore) * 10) / 10;
  return {
    id: p.userId,
    name: p.user.name,
    avatarColor: p.user.avatarColor,
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

export async function getTutorCards(): Promise<TutorVM[]> {
  const profiles = await prisma.tutorProfile.findMany({
    include: { user: true },
    orderBy: [{ sponsored: "desc" }, { rating: "desc" }],
  });
  return profiles.map(toTutorVM);
}

export async function getTutorByUserId(userId: string): Promise<TutorVM | null> {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  return profile ? toTutorVM(profile) : null;
}

/** subjects-строка для карточки берётся из subjectsJson напрямую (без join по bio). */
export function tutorSubjectsLine(p: ProfileWithUser): string {
  const subjects = parseJson<string[]>(p.subjectsJson, []);
  return subjects.join(" · ");
}
