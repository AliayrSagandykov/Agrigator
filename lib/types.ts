// Строки таблиц (camelCase = имена колонок в Postgres). Заменяют типы Prisma.

export interface User {
  id: string;
  role: string; // 'student' | 'tutor' | 'admin'
  name: string;
  email: string;
  phone: string | null;
  parentPhone: string | null;
  passwordHash: string;
  plan: string; // 'free' | 'pro'
  planUntil: Date | null;
  avatarColor: string | null;
  photo: string | null;
  timezone: string | null;
  languagesJson: string;
  verifiedScore: string | null;
  identityVerified: boolean;
  createdAt: Date;
}

export interface TutorProfile {
  id: string;
  userId: string;
  subjectsJson: string;
  examsJson: string;
  price: number;
  priceUnit: string;
  format: string;
  city: string;
  experience: number;
  bio: string;
  methodology: string;
  photo: string | null;
  gradient: string;
  responseTime: string;
  videoUrl: string;
  bookingUrl: string;
  calendarId: string | null;
  verified: boolean;
  aiVerified: boolean;
  sponsored: boolean;
  ownScoresJson: string;
  achievementsJson: string;
  languagesJson: string;
  contactsJson: string;
  statMetric: string;
  statBefore: number;
  statAfter: number;
  statSample: number;
  statPassRate: number;
  statLessons: number;
  statRetention: number;
  trial: boolean;
  trialFree: boolean;
  source: string;
  rating: number;
  availabilityJson: string;
  teachBandsJson: string;
  matchPrefsJson: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  examsJson: string;
  price: number;
  priceUnit: string;
  format: string;
  city: string;
  duration: string;
  groupSize: string;
  level: string;
  rating: number;
  students: number;
  sponsored: boolean;
  aiVerified: boolean;
  emoji: string;
  gradient: string;
  description: string;
  featuresJson: string;
  schedule: string;
  scoreStatsJson: string;
  trial: boolean;
  trialFree: boolean;
  videoUrl: string;
  bookingUrl: string;
  contactsJson: string;
  moneyBack: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentGoal {
  id: string;
  userId: string;
  exam: string;
  deadline: string;
  pace: string;
  style: string;
  baselineScore: string | null;
  baselineSource: string | null;
  targetScore: string | null;
  cadence: string | null;
  approachJson: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  slotAt: Date;
  kind: string;
  status: string;
  meetLink: string;
  note: string;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  status: string;
  provider: string;
  externalRef: string | null;
  payUrl: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  releasedAt: Date | null;
}

export interface Lesson {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  happenedAt: Date;
  sequenceNo: number;
  topic: string;
  joinedAt: Date | null;
  durationMin: number | null;
  createdAt: Date;
}

export interface Result {
  id: string;
  studentId: string;
  tutorId: string;
  exam: string;
  baseline: number | null;
  finalScore: number | null;
  delta: number | null;
  status: string;
  reportUrl: string;
  dropped: boolean;
  createdAt: Date;
  verifiedAt: Date | null;
}

export interface Pair {
  id: string;
  studentId: string;
  tutorId: string;
  subject: string;
  status: string; // 'active' | 'paused' | 'ended'
  createdAt: Date;
}

export interface RoomItem {
  id: string;
  pairId: string;
  type: string; // 'material' | 'homework'
  title: string;
  body: string;
  fileUrl: string;
  dueAt: Date | null;
  status: string; // homework: 'open' | 'done'
  createdById: string | null;
  createdAt: Date;
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  fileUrl: string;
  body: string;
  submittedAt: Date;
  reviewState: string; // 'submitted' | 'reviewed'
  reviewNote: string;
}

export interface ProgressPt {
  id: string;
  pairId: string;
  source: string; // 'diagnostic' | 'mock' | 'official'
  score: number;
  label: string;
  takenAt: Date;
}

export interface Message {
  id: string;
  pairId: string;
  authorId: string | null;
  body: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string | null;
  authorId: string | null;
  authorName: string;
  byRole: string;
  targetType: string;
  targetId: string;
  rating: number;
  note: string;
  beforeScore: string;
  afterScore: string;
  verified: boolean;
  createdAt: Date;
}

export interface RetentionSignal {
  id: string;
  studentId: string;
  tutorId: string;
  reason: string;
  createdAt: Date;
}

export interface Lead {
  id: string;
  source: string;
  url: string;
  status: string;
  rawText: string;
  parsedJson: string;
  foundAt: Date;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}
