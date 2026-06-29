// ============================================================
// Agrigator — сидинг Postgres/Supabase демо-данными (node-postgres).
// Запуск: npm run db:seed   (берёт DATABASE_URL из .env.local)
// ============================================================
import { Client } from "pg";
import crypto from "crypto";

// Node 20.12+: подгрузить переменные окружения из .env.local (затем .env),
// но НЕ перетирать уже заданный inline (DATABASE_URL=... npm run db:seed).
const proc = process as unknown as { loadEnvFile?: (path?: string) => void };
if (!process.env.DATABASE_URL) {
  try { proc.loadEnvFile?.(".env.local"); } catch {}
  try { proc.loadEnvFile?.(".env"); } catch {}
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL не задан (положи его в .env.local).");
  process.exit(1);
}
const isLocal = /localhost|127\.0\.0\.1/.test(url);

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
const J = (v: unknown) => JSON.stringify(v);

const TUTORS = [
  { id: "t1", name: "Айгерим Сапарова", email: "aigerim@agrigator.kz", exams: ["IELTS"], subjects: ["IELTS: все секции", "упор на Writing"], price: 12000, format: "online", city: "Онлайн", experience: 6, rating: 5.0, sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=47", gradient: "g1", responseTime: "~30 минут", avatarColor: "#7c3aed", ownScores: [{ exam: "IELTS", score: "8.5", verified: true }], methodology: "КИМЭП, MA TESOL; CELTA", languages: ["Казахский", "Русский", "Английский"], bio: "Готовлю к IELTS 6 лет. Мои студенты в среднем растут на +1.4 балла за 2 месяца. Сама сдала IELTS на 8.5 (подтверждено верификацией Agrigator).", achievements: ["Топ-1 тютор платформы 2025", "40+ студентов с Band 7.5+"], stat: { metric: "IELTS Band", before: 5.9, after: 7.3, sample: 145, passRate: 92 }, lessons: 870, retention: 78, trial: true, trialFree: true, videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw", contacts: { instagram: "aigerim.ielts", telegram: "aigerim_ielts", whatsapp: "77011110001", phone: "+7 701 111 00 01", email: "aigerim@agrigator.kz" } },
  { id: "t2", name: "Данияр Ермеков", email: "daniyar@agrigator.kz", exams: ["SAT"], subjects: ["SAT Math", "Reading & Writing"], price: 15000, format: "hybrid", city: "Алматы", experience: 5, rating: 4.9, sponsored: true, aiVerified: true, photo: "https://i.pravatar.cc/240?img=12", gradient: "g2", responseTime: "~1 час", avatarColor: "#0ea5e9", ownScores: [{ exam: "SAT", score: "1580", verified: true }], methodology: "Nazarbayev University, BSc Mathematics", languages: ["Казахский", "Русский", "Английский"], bio: "Сдал SAT на 1580 (800 Math). Учу решать Digital SAT быстро и без паники: стратегии, тайм-менеджмент, разбор ловушек College Board.", achievements: ["25 студентов с 1500+", "Автор телеграм-канала о SAT на 18k подписчиков"], stat: { metric: "SAT Score", before: 1210, after: 1490, sample: 98, passRate: 85 }, lessons: 540, retention: 73, trial: true, trialFree: false, videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ", contacts: { instagram: "daniyar.sat", telegram: "daniyar_sat", whatsapp: "77011110002", phone: "+7 701 111 00 02", email: "daniyar@agrigator.kz" } },
  { id: "t3", name: "Алия Нурланқызы", email: "aliya@agrigator.kz", exams: ["IELTS", "TOEFL"], subjects: ["IELTS / TOEFL", "Speaking-клубы"], price: 10000, format: "online", city: "Онлайн", experience: 4, rating: 4.8, sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=44", gradient: "g3", responseTime: "~2 часа", avatarColor: "#16a34a", ownScores: [{ exam: "IELTS", score: "8.0", verified: true }, { exam: "TOEFL", score: "114", verified: true }], methodology: "ЕНУ им. Гумилёва, иностранная филология", languages: ["Казахский", "Русский", "Английский", "Турецкий"], bio: "Двойная специализация IELTS + TOEFL. Помогу выбрать, какой экзамен сдавать, и подготовиться без лишнего стресса.", achievements: ["Speaking-клуб 2 раза в неделю бесплатно для учеников", "95% достигают цели с первой попытки"], stat: { metric: "IELTS Band", before: 5.6, after: 7.0, sample: 117, passRate: 88 }, lessons: 620, retention: 81, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "aliya.english", telegram: "aliya_english", whatsapp: "77011110003", phone: "+7 701 111 00 03", email: "aliya@agrigator.kz" } },
  { id: "t4", name: "Мария Ким", email: "maria@agrigator.kz", exams: ["IB"], subjects: ["IB Math AA/AI (HL/SL)", "IA mentorship"], price: 14000, format: "online", city: "Онлайн", experience: 7, rating: 4.9, sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=32", gradient: "g4", responseTime: "~45 минут", avatarColor: "#f59e0b", ownScores: [{ exam: "IB", score: "43/45", verified: false }], methodology: "University of Toronto, BSc Mathematics; экс-преподаватель IB-школы", languages: ["Русский", "Английский", "Корейский"], bio: "7 лет преподаю IB Math, из них 4 года — в аккредитованной IB-школе. Знаю критерии оценивания изнутри.", achievements: ["Экс-преподаватель IB World School", "Средний рост студентов: +2 IB grade"], stat: { metric: "IB Grade", before: 4.0, after: 6.2, sample: 76, passRate: 91 }, lessons: 410, retention: 84, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "maria.ibmath", telegram: "maria_ibmath", whatsapp: "77011110004", phone: "+7 701 111 00 04", email: "maria@agrigator.kz" } },
  { id: "t5", name: "Тимур Абенов", email: "timur@agrigator.kz", exams: ["A-Level", "AP"], subjects: ["A-Level / AP Physics", "Math"], price: 13000, format: "hybrid", city: "Астана", experience: 8, rating: 4.7, sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=59", gradient: "g5", responseTime: "~3 часа", avatarColor: "#ef4444", ownScores: [{ exam: "A-Level", score: "A*A*A", verified: true }], methodology: "Imperial College London, MSc Physics", languages: ["Казахский", "Русский", "Английский"], bio: "Выпускник Imperial College. Готовлю к A-Level и AP по физике и математике 8 лет. Объясняю сложное простыми словами.", achievements: ["12 студентов поступили в UK Top-10", "Собственный задачник по Mechanics"], stat: { metric: "% A*/A", before: 25, after: 80, sample: 84, passRate: 80 }, lessons: 460, retention: 70, trial: true, trialFree: false, videoUrl: "", contacts: { instagram: "timur.physics", telegram: "timur_physics", whatsapp: "77011110005", phone: "+7 701 111 00 05", email: "timur@agrigator.kz" } },
  { id: "t6", name: "Жанна Тулегенова", email: "zhanna@agrigator.kz", exams: ["ЕНТ"], subjects: ["ЕНТ: математика", "матграмотность"], price: 6000, format: "online", city: "Онлайн", experience: 10, rating: 4.8, sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=49", gradient: "g6", responseTime: "~1 час", avatarColor: "#7c3aed", ownScores: [], methodology: "КазНПУ им. Абая, учитель математики высшей категории", languages: ["Казахский", "Русский"], bio: "Школьный учитель с 10-летним стажем. Готовлю к ЕНТ системно: диагностика, закрытие пробелов, еженедельные пробники.", achievements: ["Средний балл учеников по математике: 34/40", "Грант-холдеры каждый год"], stat: { metric: "Балл ЕНТ", before: 70, after: 112, sample: 210, passRate: 90 }, lessons: 1300, retention: 86, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "zhanna.ent", telegram: "zhanna_ent", whatsapp: "77011110006", phone: "+7 701 111 00 06", email: "zhanna@agrigator.kz" } },
  { id: "t7", name: "Александр Ли", email: "alex@agrigator.kz", exams: ["SAT"], subjects: ["SAT Math"], price: 12000, format: "online", city: "Онлайн", experience: 4, rating: 4.6, sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=11", gradient: "g1", responseTime: "~20 минут", avatarColor: "#0ea5e9", ownScores: [{ exam: "SAT", score: "800 Math", verified: true }], methodology: "КБТУ, Computer Science", languages: ["Русский", "Английский"], bio: "Math 800 на SAT. Специализируюсь только на математике SAT — глубоко, быстро, по системе.", achievements: ["800/800 SAT Math (verified)", "Средний рост по Math: +160 баллов"], stat: { metric: "SAT Math", before: 590, after: 750, sample: 66, passRate: 86 }, lessons: 320, retention: 75, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "alex.satmath", telegram: "alex_satmath", whatsapp: "77011110007", phone: "+7 701 111 00 07", email: "alex@agrigator.kz" } },
  { id: "t8", name: "Камила Досжан", email: "kamila@agrigator.kz", exams: ["NUET"], subjects: ["NUET: Critical Thinking", "Math"], price: 8000, format: "online", city: "Онлайн", experience: 3, rating: 4.7, sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=45", gradient: "g2", responseTime: "~2 часа", avatarColor: "#16a34a", ownScores: [{ exam: "NUET", score: "174/180", verified: false }], methodology: "Nazarbayev University, Economics (3 курс)", languages: ["Казахский", "Русский", "Английский"], bio: "Студентка NU, сдала NUET на 174/180. Объясняю Critical Thinking на реальных прошлогодних задачах.", achievements: ["174/180 собственный результат", "70% учеников проходят на грант NU"], stat: { metric: "NUET Score", before: 98, after: 149, sample: 40, passRate: 70 }, lessons: 180, retention: 68, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "kamila.nuet", telegram: "kamila_nuet", whatsapp: "77011110008", phone: "+7 701 111 00 08", email: "kamila@agrigator.kz" } },
  { id: "t10", name: "Sophie Anderson", email: "sophie@agrigator.kz", exams: ["IELTS"], subjects: ["IELTS Speaking (native speaker)"], price: 20000, format: "online", city: "Онлайн", experience: 5, rating: 4.9, sponsored: true, aiVerified: false, photo: "https://i.pravatar.cc/240?img=24", gradient: "g4", responseTime: "~1 час", avatarColor: "#ef4444", ownScores: [], methodology: "University of Edinburgh; CELTA, экс-экзаменатор IELTS", languages: ["Английский"], bio: "Native speaker from the UK, former IELTS examiner. I help students break the Band 7 barrier in Speaking with examiner-level feedback.", achievements: ["Экс-экзаменатор IELTS Speaking", "90% студентов получают 7.0+ по Speaking"], stat: { metric: "Speaking Band", before: 6.0, after: 7.4, sample: 88, passRate: 90 }, lessons: 300, retention: 76, trial: true, trialFree: false, videoUrl: "", contacts: { instagram: "sophie.ielts", telegram: "sophie_ielts", whatsapp: "77011110010", phone: "+7 701 111 00 10", email: "sophie@agrigator.kz" } },
];

const COURSES = [
  { id: "c1", title: "IELTS Intensive 7.5+", provider: "BilimHub", exams: ["IELTS"], price: 85000, priceUnit: "мес", format: "hybrid", city: "Алматы", duration: "2 месяца", groupSize: "до 8 человек", level: "Upper-Intermediate+", rating: 4.9, students: 1240, sponsored: true, aiVerified: true, emoji: "🇬🇧", gradient: "g1", description: "Интенсивная подготовка к IELTS с фокусом на Writing и Speaking.", features: ["Ежедневные мок-тесты", "Личный куратор", "Гарантия результата или возврат денег"], schedule: "Пн–Пт 19:00–21:00", scoreStats: { metric: "IELTS Band", before: 5.8, after: 7.2, sampleSize: 312, passRate: 91 }, trial: true, trialFree: true, videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw", contacts: { instagram: "bilimhub.kz", telegram: "bilimhub", whatsapp: "77071234501", phone: "+7 707 123 45 01", email: "hello@bilimhub.kz" }, moneyBack: true },
  { id: "c2", title: "SAT 1500+ Bootcamp", provider: "Almaty Prep Academy", exams: ["SAT"], price: 120000, priceUnit: "мес", format: "offline", city: "Алматы", duration: "3 месяца", groupSize: "до 6 человек", level: "Advanced", rating: 4.8, students: 860, sponsored: true, aiVerified: true, emoji: "📐", gradient: "g2", description: "Буткемп для тех, кто целится в топ-университеты США.", features: ["Digital SAT тренажёры", "Эссе-менторство", "College counseling в подарок"], schedule: "Вт/Чт/Сб 15:00–18:00", scoreStats: { metric: "SAT Score", before: 1180, after: 1510, sampleSize: 204, passRate: 88 }, trial: true, trialFree: false, videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ", contacts: { instagram: "almatyprep", telegram: "almatyprep", whatsapp: "77071234502", phone: "+7 707 123 45 02", email: "info@almatyprep.kz" }, moneyBack: true },
  { id: "c3", title: "IELTS с нуля: 5.5 → 6.5", provider: "EduWay", exams: ["IELTS"], price: 45000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "3 месяца", groupSize: "до 12 человек", level: "Pre-Intermediate", rating: 4.6, students: 2100, sponsored: false, aiVerified: true, emoji: "✈️", gradient: "g3", description: "Курс для тех, кто начинает подготовку с нуля.", features: ["Записи всех уроков", "Домашки с проверкой", "Telegram-сообщество"], schedule: "Пн/Ср/Пт 20:00–21:30", scoreStats: { metric: "IELTS Band", before: 4.9, after: 6.4, sampleSize: 540, passRate: 84 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "eduway.kz", telegram: "eduwaykz", whatsapp: "77071234503", phone: "+7 707 123 45 03", email: "team@eduway.kz" }, moneyBack: false },
  { id: "c4", title: "SAT Math Mastery", provider: "Tarqyn School", exams: ["SAT"], price: 60000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "2 месяца", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.7, students: 530, sponsored: false, aiVerified: false, emoji: "🧮", gradient: "g4", description: "Только математическая секция SAT. Цель — 750+ по Math.", features: ["Банк из 3000+ задач", "Еженедельные мини-моки", "Разбор ошибок 1-на-1"], schedule: "Вт/Чт 19:00–20:30", scoreStats: { metric: "SAT Math", before: 580, after: 760, sampleSize: 150, passRate: 86 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "tarqyn.school", telegram: "tarqyn", whatsapp: "77071234504", phone: "+7 707 123 45 04", email: "hi@tarqyn.kz" }, moneyBack: false },
  { id: "c5", title: "IB Math AA/AI HL Support", provider: "IB Masters", exams: ["IB"], price: 95000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "весь учебный год", groupSize: "до 5 человек", level: "HL", rating: 4.9, students: 310, sponsored: false, aiVerified: true, emoji: "🎯", gradient: "g5", description: "Сопровождение по IB Math (AA/AI, HL и SL).", features: ["Преподаватели — IB examiners", "Помощь с IA", "Past papers с разбором"], schedule: "Гибкое расписание", scoreStats: { metric: "IB Grade", before: 4.1, after: 6.3, sampleSize: 96, passRate: 93 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "ib.masters", telegram: "ibmasters", whatsapp: "77071234505", phone: "+7 707 123 45 05", email: "care@ibmasters.kz" }, moneyBack: true },
  { id: "c6", title: "A-Level Physics (CIE/Edexcel)", provider: "Cambridge Route", exams: ["A-Level"], price: 90000, priceUnit: "мес", format: "hybrid", city: "Астана", duration: "6 месяцев", groupSize: "до 6 человек", level: "AS/A2", rating: 4.8, students: 240, sponsored: false, aiVerified: false, emoji: "⚛️", gradient: "g6", description: "Полная подготовка к A-Level Physics. Цель — A*/A.", features: ["Past papers с 2015 года", "Лабораторный практикум", "Предикт-оценка"], schedule: "Сб/Вс 11:00–13:00", scoreStats: { metric: "% A*/A", before: 22, after: 78, sampleSize: 88, passRate: 78 }, trial: true, trialFree: false, videoUrl: "", contacts: { instagram: "cambridge.route", telegram: "cambridgeroute", whatsapp: "77071234506", phone: "+7 707 123 45 06", email: "office@cambridgeroute.kz" }, moneyBack: false },
  { id: "c7", title: "TOEFL iBT 100+", provider: "LinguaPro", exams: ["TOEFL"], price: 70000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "2 месяца", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.5, students: 670, sponsored: false, aiVerified: true, emoji: "🗽", gradient: "g1", description: "Подготовка к TOEFL iBT с симуляциями экзамена.", features: ["Симулятор интерфейса ETS", "Шаблоны для Writing"], schedule: "Пн/Ср 19:30–21:00", scoreStats: { metric: "TOEFL Score", before: 78, after: 103, sampleSize: 178, passRate: 82 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "linguapro.kz", telegram: "linguapro", whatsapp: "77071234507", phone: "+7 707 123 45 07", email: "go@linguapro.kz" }, moneyBack: false },
  { id: "c8", title: "ЕНТ Интенсив: математика + физика", provider: "Daryn Centre", exams: ["ЕНТ"], price: 35000, priceUnit: "мес", format: "offline", city: "Шымкент", duration: "4 месяца", groupSize: "до 15 человек", level: "11 класс", rating: 4.4, students: 1800, sponsored: false, aiVerified: false, emoji: "🇰🇿", gradient: "g2", description: "Системная подготовка к ЕНТ по профильным предметам.", features: ["Пробное ЕНТ каждую неделю", "Рейтинг группы", "Родительские отчёты"], schedule: "Пн–Сб 16:00–18:00", scoreStats: { metric: "Балл ЕНТ", before: 72, after: 116, sampleSize: 640, passRate: 89 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "daryn.centre", telegram: "daryncentre", whatsapp: "77071234508", phone: "+7 707 123 45 08", email: "info@daryn.kz" }, moneyBack: false },
  { id: "c9", title: "NUET Preparation Pro", provider: "NU Track", exams: ["NUET"], price: 55000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "5 месяцев", groupSize: "до 12 человек", level: "11–12 класс", rating: 4.7, students: 420, sponsored: true, aiVerified: true, emoji: "🏛️", gradient: "g3", description: "Подготовка к NUET: Critical Thinking и Math.", features: ["Преподаватели — выпускники NU", "База NUET-style задач", "Mock days раз в месяц"], schedule: "Вт/Чт/Сб 18:00–19:30", scoreStats: { metric: "NUET Score", before: 95, after: 152, sampleSize: 130, passRate: 74 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "nu.track", telegram: "nutrack", whatsapp: "77071234509", phone: "+7 707 123 45 09", email: "hello@nutrack.kz" }, moneyBack: true },
  { id: "c11", title: "A-Level Mathematics", provider: "Cambridge Route", exams: ["A-Level"], price: 90000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "6 месяцев", groupSize: "до 8 человек", level: "AS/A2", rating: 4.6, students: 280, sponsored: false, aiVerified: false, emoji: "📊", gradient: "g5", description: "Pure Math, Mechanics и Statistics для CIE и Edexcel.", features: ["Конспекты по всем темам", "Топик-тесты", "Past papers marathon"], schedule: "Пн/Ср/Пт 18:00–19:30", scoreStats: { metric: "% A*/A", before: 30, after: 81, sampleSize: 102, passRate: 81 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "cambridge.route", telegram: "cambridgeroute", whatsapp: "77071234506", phone: "+7 707 123 45 06", email: "office@cambridgeroute.kz" }, moneyBack: false },
  { id: "c12", title: "AP Calculus BC", provider: "APex School", exams: ["AP"], price: 80000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "4 месяца", groupSize: "до 8 человек", level: "AP", rating: 4.5, students: 150, sponsored: false, aiVerified: false, emoji: "∫", gradient: "g6", description: "Подготовка к AP Calculus BC на 5 баллов.", features: ["FRQ-разборы", "AP Classroom интеграция", "Предикт скора"], schedule: "Вт/Чт 20:00–21:30", scoreStats: { metric: "% на 4–5", before: 35, after: 87, sampleSize: 54, passRate: 87 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "apex.school", telegram: "apexschool", whatsapp: "77071234512", phone: "+7 707 123 45 12", email: "team@apexschool.kz" }, moneyBack: false },
  { id: "c13", title: "IELTS Weekend Group", provider: "EduWay", exams: ["IELTS"], price: 38000, priceUnit: "мес", format: "offline", city: "Астана", duration: "3 месяца", groupSize: "до 14 человек", level: "Intermediate", rating: 4.3, students: 940, sponsored: false, aiVerified: false, emoji: "📅", gradient: "g1", description: "Бюджетная группа выходного дня.", features: ["Занятия только Сб/Вс", "Онлайн-платформа", "Мини-моки раз в 2 недели"], schedule: "Сб/Вс 12:00–15:00", scoreStats: { metric: "IELTS Band", before: 5.4, after: 6.5, sampleSize: 260, passRate: 79 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "eduway.kz", telegram: "eduwaykz", whatsapp: "77071234503", phone: "+7 707 123 45 03", email: "team@eduway.kz" }, moneyBack: false },
  { id: "c15", title: "SAT Verbal Sprint", provider: "Almaty Prep Academy", exams: ["SAT"], price: 65000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "6 недель", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.5, students: 380, sponsored: false, aiVerified: true, emoji: "📚", gradient: "g3", description: "Спринт по Reading & Writing секции Digital SAT.", features: ["Vocabulary system", "Grammar bootcamp", "2 полных мока"], schedule: "Пн/Ср/Пт 17:00–18:30", scoreStats: { metric: "SAT R&W", before: 560, after: 710, sampleSize: 118, passRate: 80 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "almatyprep", telegram: "almatyprep", whatsapp: "77071234502", phone: "+7 707 123 45 02", email: "info@almatyprep.kz" }, moneyBack: false },
  { id: "c16", title: "IB Extended Essay Mentorship", provider: "IB Masters", exams: ["IB"], price: 70000, priceUnit: "курс", format: "online", city: "Онлайн", duration: "8 недель", groupSize: "1-на-1", level: "DP1/DP2", rating: 4.9, students: 85, sponsored: false, aiVerified: false, emoji: "✍️", gradient: "g4", description: "Индивидуальное менторство по Extended Essay.", features: ["Ментор — IB examiner", "6 индивидуальных сессий", "Дедлайн-трекер"], schedule: "Индивидуально", scoreStats: { metric: "% A/B по EE", before: 28, after: 84, sampleSize: 47, passRate: 84 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "ib.masters", telegram: "ibmasters", whatsapp: "77071234505", phone: "+7 707 123 45 05", email: "care@ibmasters.kz" }, moneyBack: true },
];

const REVIEWS = [
  { targetType: "course", targetId: "c1", authorName: "Дана С.", rating: 5, verified: true, beforeScore: "6.0", afterScore: "7.5", note: "За 2 месяца подняла с 6.0 до 7.5!" },
  { targetType: "course", targetId: "c1", authorName: "Арман Т.", rating: 5, verified: true, beforeScore: "5.5", afterScore: "7.0", note: "Куратор отвечает даже ночью, моки каждую субботу." },
  { targetType: "course", targetId: "c2", authorName: "Бекзат Н.", rating: 5, verified: true, beforeScore: "1230", afterScore: "1540", note: "1540 на майском SAT! Адаптивные тренажёры — топ." },
  { targetType: "course", targetId: "c3", authorName: "Нурлан А.", rating: 5, verified: true, beforeScore: "4.5", afterScore: "6.5", note: "Начинал почти с нуля. Очень комфортный темп." },
  { targetType: "course", targetId: "c5", authorName: "Tomiris", rating: 5, verified: true, beforeScore: "4", afterScore: "7", note: "IA вытянули с 11 до 19 баллов." },
  { targetType: "course", targetId: "c8", authorName: "Айбек Д.", rating: 4, verified: true, beforeScore: "78", afterScore: "118", note: "118 на пробном республиканском!" },
  { targetType: "course", targetId: "c9", authorName: "Диас О.", rating: 5, verified: true, beforeScore: "101", afterScore: "156", note: "Прошёл на грант NU. Mock days — лучшее." },
  { targetType: "tutor", targetId: "t1", authorName: "Жанель Б.", rating: 5, verified: true, beforeScore: "6.5", afterScore: "8.0", note: "Айгерим — лучшая. Writing с 6.0 до 7.5 за 6 недель." },
  { targetType: "tutor", targetId: "t1", authorName: "Олжас К.", rating: 5, verified: true, beforeScore: "", afterScore: "", note: "Очень структурно, без воды. Стоит каждого тенге." },
  { targetType: "tutor", targetId: "t2", authorName: "Алишер С.", rating: 5, verified: true, beforeScore: "1280", afterScore: "1520", note: "1520! Данияр объясняет ловушки College Board." },
  { targetType: "tutor", targetId: "t3", authorName: "Аружан Т.", rating: 5, verified: true, beforeScore: "5.5", afterScore: "7.0", note: "Speaking-клубы — огонь." },
  { targetType: "tutor", targetId: "t4", authorName: "Daniel P.", rating: 5, verified: true, beforeScore: "", afterScore: "", note: "Maria saved my IA. Got 19/20." },
  { targetType: "tutor", targetId: "t6", authorName: "Гульнара (мама ученика)", rating: 5, verified: true, beforeScore: "64", afterScore: "109", note: "Сын поднял математику с 24 до 36 баллов." },
  { targetType: "tutor", targetId: "t7", authorName: "Тамерлан Е.", rating: 5, verified: true, beforeScore: "620", afterScore: "780", note: "Math 780. Александр разбирает любую задачу." },
  { targetType: "tutor", targetId: "t10", authorName: "Асель М.", rating: 5, verified: true, beforeScore: "6.0", afterScore: "7.5", note: "Speaking 7.5 после 6.0!" },
];

const LEADS = [
  { source: "Instagram", url: "https://instagram.com/p/demo1", rawText: "🔥 Набор в группу IELTS! Гарантия 7.0+ 💪 Band 8.5. Онлайн 3 раза в неделю. 50 000 тг/мес. @ielts_pro_almaty", parsed: { title: "IELTS группа 7.0+", exam: "IELTS", price: 50000, format: "online", instagram: "ielts_pro_almaty" } },
  { source: "OLX", url: "https://olx.kz/obyavlenie/demo2", rawText: "Репетитор по SAT Math. Студент NU, результат 790. 8000 тг/час, онлайн. Тел: +7 700 555 44 33", parsed: { title: "Репетитор SAT Math (NU)", exam: "SAT", price: 8000, format: "online", phone: "+7 700 555 44 33" } },
  { source: "Telegram", url: "https://t.me/edu_ads_kz/4521", rawText: "Группа подготовки к NUET. Critical Thinking + Math. Старт 1 июля. 45000 в месяц. @nuet_start", parsed: { title: "NUET группа, старт 1 июля", exam: "NUET", price: 45000, format: "online", telegram: "nuet_start" } },
];

async function main() {
  const client = new Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
  await client.connect();
  console.log("🌱 Очистка и сидинг…");

  await client.query(
    `truncate "Consent","Message","ProgressPt","Submission","RoomItem","Pair",
              "RetentionSignal","Review","Result","Lesson","Payment","Booking",
              "StudentGoal","Favorite","Session","TutorProfile","Course","Lead","User"
     restart identity cascade`,
  );

  for (const c of COURSES) {
    await client.query(
      `insert into "Course" (id,title,provider,"examsJson",price,"priceUnit",format,city,duration,"groupSize",level,rating,students,sponsored,"aiVerified",emoji,gradient,description,"featuresJson",schedule,"scoreStatsJson",trial,"trialFree","videoUrl","contactsJson","moneyBack")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
      [c.id, c.title, c.provider, J(c.exams), c.price, c.priceUnit, c.format, c.city, c.duration, c.groupSize, c.level, c.rating, c.students, c.sponsored, c.aiVerified, c.emoji, c.gradient, c.description, J(c.features), c.schedule, J(c.scoreStats), c.trial, c.trialFree, c.videoUrl, J(c.contacts), c.moneyBack],
    );
  }

  for (const t of TUTORS) {
    await client.query(`insert into "User" (id,role,name,email,"passwordHash","avatarColor") values ($1,'tutor',$2,$3,$4,$5)`,
      [t.id, t.name, t.email, hashPassword("tutor123"), t.avatarColor]);
    await client.query(
      `insert into "TutorProfile" ("userId","subjectsJson","examsJson",price,"priceUnit",format,city,experience,bio,methodology,photo,gradient,"responseTime","videoUrl",verified,"aiVerified",sponsored,"ownScoresJson","achievementsJson","languagesJson","contactsJson","statMetric","statBefore","statAfter","statSample","statPassRate","statLessons","statRetention",trial,"trialFree",rating,source)
       values ($1,$2,$3,$4,'час',$5,$6,$7,$8,$9,$10,$11,$12,$13,true,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,'manual')`,
      [t.id, J(t.subjects), J(t.exams), t.price, t.format, t.city, t.experience, t.bio, t.methodology, t.photo, t.gradient, t.responseTime, t.videoUrl, t.aiVerified, t.sponsored, J(t.ownScores), J(t.achievements), J(t.languages), J(t.contacts), t.stat.metric, t.stat.before, t.stat.after, t.stat.sample, t.stat.passRate, t.lessons, t.retention, t.trial, t.trialFree, t.rating],
    );
  }

  await client.query(`insert into "User" (id,role,name,email,"passwordHash",plan,"avatarColor") values ('u1','admin','Администратор','admin@agrigator.kz',$1,'pro','#7c3aed')`, [hashPassword("admin123")]);
  await client.query(`insert into "User" (id,role,name,email,"passwordHash","avatarColor") values ('u2','student','Аймер','user@demo.kz',$1,'#0ea5e9')`, [hashPassword("demo123")]);
  await client.query(`insert into "User" (id,role,name,email,"passwordHash",plan,"avatarColor") values ('u3','student','Pro Студент','pro@demo.kz',$1,'pro','#16a34a')`, [hashPassword("demo123")]);

  // Часовые пояса (UX v3 §5): по умолчанию Алматы, пара тьюторов в других зонах
  // — чтобы матч по поясу было видно на демо.
  await client.query(`update "User" set timezone = 'Asia/Almaty' where timezone is null`);
  await client.query(`update "User" set timezone = 'Europe/London' where id = 't10'`);
  await client.query(`update "User" set timezone = 'Europe/Moscow' where id = 'u3'`);

  await client.query(`insert into "StudentGoal" ("userId",exam,deadline,pace,style,"baselineScore","baselineSource",language) values ('u2','IELTS','3-6m','slow','soft','5.5','official','ru')`);
  await client.query(`insert into "Favorite" ("userId",key) values ('u2','tutor:t1'),('u2','course:c1')`);

  // Полный пройденный пайплайн: бронь → урок → (демо для дашбордов)
  const past = new Date(Date.now() - 7 * 864e5);
  await client.query(`insert into "Booking" (id,"studentId","tutorId","slotAt",kind,status,"meetLink") values ('demo-b1','u2','t1',$1,'trial','completed','https://meet.jit.si/agrigator-demo-b1')`, [past]);
  await client.query(`insert into "Payment" ("bookingId",amount,status,provider,"confirmedAt") values ('demo-b1',12000,'confirmed','kaspi_manual',$1)`, [past]);
  await client.query(`insert into "Lesson" ("bookingId","studentId","tutorId","happenedAt","sequenceNo",topic) values ('demo-b1','u2','t1',$1,1,'Разбор Writing Task 2: структура и связки')`, [past]);

  // Кабинет пары u2↔t1 (UX v3 §2): автосоздаётся при подтверждении первой брони.
  // Здесь — демо-наполнение для дашбордов и витрины раздела.
  const d = (days: number) => new Date(Date.now() - days * 864e5);
  await client.query(`insert into "Pair" (id,"studentId","tutorId",subject,status) values ('demo-pair-1','u2','t1','IELTS','active')`);
  await client.query(
    `insert into "RoomItem" (id,"pairId",type,title,body,"createdById",status,"createdAt") values
     ('demo-mat-1','demo-pair-1','material','Шаблоны Writing Task 2','Структура эссе: intro → 2 body → conclusion. Банк связок и примеров.','t1','open',$1),
     ('demo-mat-2','demo-pair-1','material','Speaking Part 2: 60 cue cards','Актуальные карточки на этот сезон с опорными идеями.','t1','open',$2)`,
    [d(6), d(4)],
  );
  // Домашка: одна проверенная (с разбором), одна открытая с дедлайном.
  await client.query(`insert into "RoomItem" (id,"pairId",type,title,body,"dueAt","createdById",status,"createdAt") values ('demo-hw-1','demo-pair-1','homework','Эссе: technology in education','Напиши Task 2 (250+ слов). Тема: преимущества и риски технологий в обучении.',$1,'t1','done',$2)`, [d(5), d(6)]);
  await client.query(`insert into "Submission" (id,"homeworkId","studentId",body,"reviewState","reviewNote","submittedAt") values ('demo-sub-1','demo-hw-1','u2','Прикрепляю эссе на 270 слов. Старалась с linking words.','reviewed','Сильная структура и аргументы. Поработай над разнообразием связок и точностью лексики — это твой путь к Band 7.',$1)`, [d(5)]);
  await client.query(`insert into "RoomItem" (id,"pairId",type,title,body,"dueAt","createdById",status,"createdAt") values ('demo-hw-2','demo-pair-1','homework','Listening: Cambridge 18, Test 2','Сделай секции 3–4, выпиши незнакомые слова, отметь ошибки.',$1,'t1','open',$2)`, [new Date(Date.now() + 3 * 864e5), d(1)]);
  // Траектория баллов: входная диагностика → пробники.
  await client.query(
    `insert into "ProgressPt" ("pairId",source,score,label,"takenAt") values
     ('demo-pair-1','diagnostic',5.5,'входная диагностика',$1),
     ('demo-pair-1','mock',6.0,'Cambridge 17, Test 1',$2),
     ('demo-pair-1','mock',6.5,'Cambridge 18, Test 1',$3)`,
    [d(30), d(14), d(3)],
  );
  await client.query(
    `insert into "Message" ("pairId","authorId",body,"createdAt") values
     ('demo-pair-1','t1','Аймер, привет! Загрузила шаблоны Writing — посмотри до следующего урока.',$1),
     ('demo-pair-1','u2','Спасибо большое! Гляну сегодня вечером 🙌',$2)`,
    [d(2), new Date(Date.now() - 2 * 864e5 + 3600e3)],
  );

  for (const r of REVIEWS) {
    await client.query(
      `insert into "Review" ("authorName","byRole","targetType","targetId",rating,note,verified,"beforeScore","afterScore")
       values ($1,'student',$2,$3,$4,$5,$6,$7,$8)`,
      [r.authorName, r.targetType, r.targetId, r.rating, r.note, r.verified, r.beforeScore, r.afterScore],
    );
  }

  for (const l of LEADS) {
    await client.query(`insert into "Lead" (source,url,"rawText","parsedJson",status) values ($1,$2,$3,$4,'new')`,
      [l.source, l.url, l.rawText, J(l.parsed)]);
  }

  // Реальные верифицированные результаты (UX v3 §9–10: «no fake deltas»):
  // живая база, из которой система сама считает дельту/доходимость на дашборде.
  // Каждый результат = отдельный выпускник + бросившие учитываются в risk-adjust.
  const COHORTS = [
    { tutor: "t1", exam: "IELTS", base: 5.5, deltas: [1.0, 1.5, 1.0, 2.0, 1.5, 0.5, 1.5], dropped: 1 },
    { tutor: "t2", exam: "SAT", base: 1200, deltas: [180, 140, 220, 160, 200], dropped: 1 },
    { tutor: "t6", exam: "ЕНТ", base: 70, deltas: [30, 42, 38], dropped: 0 },
  ];
  let alum = 0;
  for (const c of COHORTS) {
    for (const d of c.deltas) {
      const sid = `alum${++alum}`;
      await client.query(`insert into "User" (id,role,name,email,"passwordHash",timezone) values ($1,'student',$2,$3,$4,'Asia/Almaty')`,
        [sid, `Выпускник ${alum}`, `${sid}@demo.kz`, hashPassword("demo123")]);
      await client.query(
        `insert into "Result" ("studentId","tutorId",exam,baseline,"finalScore",delta,status,dropped,"verifiedAt")
         values ($1,$2,$3,$4,$5,$6,'delta_set',false,now())`,
        [sid, c.tutor, c.exam, c.base, c.base + d, d],
      );
    }
    for (let i = 0; i < c.dropped; i++) {
      const sid = `alum${++alum}`;
      await client.query(`insert into "User" (id,role,name,email,"passwordHash",timezone) values ($1,'student',$2,$3,$4,'Asia/Almaty')`,
        [sid, `Выпускник ${alum}`, `${sid}@demo.kz`, hashPassword("demo123")]);
      await client.query(
        `insert into "Result" ("studentId","tutorId",exam,baseline,status,dropped)
         values ($1,$2,$3,$4,'delta_set',true)`,
        [sid, c.tutor, c.exam, c.base],
      );
    }
  }

  console.log(`✅ Засеяно: ${TUTORS.length} тюторов, ${COURSES.length} курсов, ${REVIEWS.length} отзывов, ${LEADS.length} лидов, ${alum} выпускников с результатами.`);
  console.log("   Демо-входы: admin@agrigator.kz/admin123 · user@demo.kz/demo123 · aigerim@agrigator.kz/tutor123");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
