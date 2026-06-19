// ============================================================
// Agrigator — сидинг демо-данными (cold-start: свои верифиц. тюторы).
// Запуск: npm run db:seed   (или npm run db:reset для полного пере-сева)
// ============================================================
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}

const J = (v: unknown) => JSON.stringify(v);

// ── Тюторы (верифицированные результаты — ядро доверия) ──
const TUTORS = [
  {
    id: "t1", name: "Айгерим Сапарова", email: "aigerim@agrigator.kz",
    exams: ["IELTS"], subjects: ["IELTS: все секции", "упор на Writing"],
    price: 12000, format: "online", city: "Онлайн", experience: 6, rating: 5.0,
    sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=47", gradient: "g1",
    responseTime: "~30 минут", avatarColor: "#7c3aed",
    ownScores: [{ exam: "IELTS", score: "8.5", verified: true }],
    methodology: "КИМЭП, MA TESOL; CELTA",
    languages: ["Казахский", "Русский", "Английский"],
    bio: "Готовлю к IELTS 6 лет. Мои студенты в среднем растут на +1.4 балла за 2 месяца. Сама сдала IELTS на 8.5 (подтверждено верификацией Agrigator).",
    achievements: ["Топ-1 тютор платформы 2025", "40+ студентов с Band 7.5+"],
    stat: { metric: "IELTS Band", before: 5.9, after: 7.3, sample: 145, passRate: 92 },
    lessons: 870, retention: 78, trial: true, trialFree: true,
    videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
    contacts: { instagram: "aigerim.ielts", telegram: "aigerim_ielts", whatsapp: "77011110001", phone: "+7 701 111 00 01", email: "aigerim@agrigator.kz" },
  },
  {
    id: "t2", name: "Данияр Ермеков", email: "daniyar@agrigator.kz",
    exams: ["SAT"], subjects: ["SAT Math", "Reading & Writing"],
    price: 15000, format: "hybrid", city: "Алматы", experience: 5, rating: 4.9,
    sponsored: true, aiVerified: true, photo: "https://i.pravatar.cc/240?img=12", gradient: "g2",
    responseTime: "~1 час", avatarColor: "#0ea5e9",
    ownScores: [{ exam: "SAT", score: "1580", verified: true }],
    methodology: "Nazarbayev University, BSc Mathematics",
    languages: ["Казахский", "Русский", "Английский"],
    bio: "Сдал SAT на 1580 (800 Math). Учу решать Digital SAT быстро и без паники: стратегии, тайм-менеджмент, разбор ловушек College Board.",
    achievements: ["25 студентов с 1500+", "Автор телеграм-канала о SAT на 18k подписчиков"],
    stat: { metric: "SAT Score", before: 1210, after: 1490, sample: 98, passRate: 85 },
    lessons: 540, retention: 73, trial: true, trialFree: false,
    videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    contacts: { instagram: "daniyar.sat", telegram: "daniyar_sat", whatsapp: "77011110002", phone: "+7 701 111 00 02", email: "daniyar@agrigator.kz" },
  },
  {
    id: "t3", name: "Алия Нурланқызы", email: "aliya@agrigator.kz",
    exams: ["IELTS", "TOEFL"], subjects: ["IELTS / TOEFL", "Speaking-клубы"],
    price: 10000, format: "online", city: "Онлайн", experience: 4, rating: 4.8,
    sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=44", gradient: "g3",
    responseTime: "~2 часа", avatarColor: "#16a34a",
    ownScores: [{ exam: "IELTS", score: "8.0", verified: true }, { exam: "TOEFL", score: "114", verified: true }],
    methodology: "ЕНУ им. Гумилёва, иностранная филология",
    languages: ["Казахский", "Русский", "Английский", "Турецкий"],
    bio: "Двойная специализация IELTS + TOEFL. Помогу выбрать, какой экзамен сдавать, и подготовиться без лишнего стресса.",
    achievements: ["Speaking-клуб 2 раза в неделю бесплатно для учеников", "95% достигают цели с первой попытки"],
    stat: { metric: "IELTS Band", before: 5.6, after: 7.0, sample: 117, passRate: 88 },
    lessons: 620, retention: 81, trial: true, trialFree: true, videoUrl: "",
    contacts: { instagram: "aliya.english", telegram: "aliya_english", whatsapp: "77011110003", phone: "+7 701 111 00 03", email: "aliya@agrigator.kz" },
  },
  {
    id: "t4", name: "Мария Ким", email: "maria@agrigator.kz",
    exams: ["IB"], subjects: ["IB Math AA/AI (HL/SL)", "IA mentorship"],
    price: 14000, format: "online", city: "Онлайн", experience: 7, rating: 4.9,
    sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=32", gradient: "g4",
    responseTime: "~45 минут", avatarColor: "#f59e0b",
    ownScores: [{ exam: "IB", score: "43/45", verified: false }],
    methodology: "University of Toronto, BSc Mathematics; экс-преподаватель IB-школы",
    languages: ["Русский", "Английский", "Корейский"],
    bio: "7 лет преподаю IB Math, из них 4 года — в аккредитованной IB-школе. Знаю критерии оценивания изнутри.",
    achievements: ["Экс-преподаватель IB World School", "Средний рост студентов: +2 IB grade"],
    stat: { metric: "IB Grade", before: 4.0, after: 6.2, sample: 76, passRate: 91 },
    lessons: 410, retention: 84, trial: true, trialFree: true, videoUrl: "",
    contacts: { instagram: "maria.ibmath", telegram: "maria_ibmath", whatsapp: "77011110004", phone: "+7 701 111 00 04", email: "maria@agrigator.kz" },
  },
  {
    id: "t5", name: "Тимур Абенов", email: "timur@agrigator.kz",
    exams: ["A-Level", "AP"], subjects: ["A-Level / AP Physics", "Math"],
    price: 13000, format: "hybrid", city: "Астана", experience: 8, rating: 4.7,
    sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=59", gradient: "g5",
    responseTime: "~3 часа", avatarColor: "#ef4444",
    ownScores: [{ exam: "A-Level", score: "A*A*A", verified: true }],
    methodology: "Imperial College London, MSc Physics",
    languages: ["Казахский", "Русский", "Английский"],
    bio: "Выпускник Imperial College. Готовлю к A-Level и AP по физике и математике 8 лет. Объясняю сложное простыми словами.",
    achievements: ["12 студентов поступили в UK Top-10", "Собственный задачник по Mechanics"],
    stat: { metric: "% A*/A", before: 25, after: 80, sample: 84, passRate: 80 },
    lessons: 460, retention: 70, trial: true, trialFree: false, videoUrl: "",
    contacts: { instagram: "timur.physics", telegram: "timur_physics", whatsapp: "77011110005", phone: "+7 701 111 00 05", email: "timur@agrigator.kz" },
  },
  {
    id: "t6", name: "Жанна Тулегенова", email: "zhanna@agrigator.kz",
    exams: ["ЕНТ"], subjects: ["ЕНТ: математика", "матграмотность"],
    price: 6000, format: "online", city: "Онлайн", experience: 10, rating: 4.8,
    sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=49", gradient: "g6",
    responseTime: "~1 час", avatarColor: "#7c3aed",
    ownScores: [],
    methodology: "КазНПУ им. Абая, учитель математики высшей категории",
    languages: ["Казахский", "Русский"],
    bio: "Школьный учитель с 10-летним стажем. Готовлю к ЕНТ системно: диагностика, закрытие пробелов, еженедельные пробники.",
    achievements: ["Средний балл учеников по математике: 34/40", "Грант-холдеры каждый год"],
    stat: { metric: "Балл ЕНТ", before: 70, after: 112, sample: 210, passRate: 90 },
    lessons: 1300, retention: 86, trial: true, trialFree: true, videoUrl: "",
    contacts: { instagram: "zhanna.ent", telegram: "zhanna_ent", whatsapp: "77011110006", phone: "+7 701 111 00 06", email: "zhanna@agrigator.kz" },
  },
  {
    id: "t7", name: "Александр Ли", email: "alex@agrigator.kz",
    exams: ["SAT", "ACT"], subjects: ["SAT/ACT Math"],
    price: 12000, format: "online", city: "Онлайн", experience: 4, rating: 4.6,
    sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=11", gradient: "g1",
    responseTime: "~20 минут", avatarColor: "#0ea5e9",
    ownScores: [{ exam: "SAT", score: "800 Math", verified: true }],
    methodology: "КБТУ, Computer Science",
    languages: ["Русский", "Английский"],
    bio: "Math 800 на SAT. Специализируюсь только на математике SAT и ACT — глубоко, быстро, по системе.",
    achievements: ["800/800 SAT Math (verified)", "Средний рост по Math: +160 баллов"],
    stat: { metric: "SAT Math", before: 590, after: 750, sample: 66, passRate: 86 },
    lessons: 320, retention: 75, trial: true, trialFree: true, videoUrl: "",
    contacts: { instagram: "alex.satmath", telegram: "alex_satmath", whatsapp: "77011110007", phone: "+7 701 111 00 07", email: "alex@agrigator.kz" },
  },
  {
    id: "t8", name: "Камила Досжан", email: "kamila@agrigator.kz",
    exams: ["NUET"], subjects: ["NUET: Critical Thinking", "Math"],
    price: 8000, format: "online", city: "Онлайн", experience: 3, rating: 4.7,
    sponsored: false, aiVerified: false, photo: "https://i.pravatar.cc/240?img=45", gradient: "g2",
    responseTime: "~2 часа", avatarColor: "#16a34a",
    ownScores: [{ exam: "NUET", score: "174/180", verified: false }],
    methodology: "Nazarbayev University, Economics (3 курс)",
    languages: ["Казахский", "Русский", "Английский"],
    bio: "Студентка NU, сдала NUET на 174/180. Объясняю Critical Thinking на реальных прошлогодних задачах.",
    achievements: ["174/180 собственный результат", "70% учеников проходят на грант NU"],
    stat: { metric: "NUET Score", before: 98, after: 149, sample: 40, passRate: 70 },
    lessons: 180, retention: 68, trial: true, trialFree: true, videoUrl: "",
    contacts: { instagram: "kamila.nuet", telegram: "kamila_nuet", whatsapp: "77011110008", phone: "+7 701 111 00 08", email: "kamila@agrigator.kz" },
  },
  {
    id: "t9", name: "Ерлан Мухтаров", email: "erlan@agrigator.kz",
    exams: ["GMAT", "GRE"], subjects: ["GMAT / GRE Quant + Verbal"],
    price: 18000, format: "online", city: "Онлайн", experience: 9, rating: 4.9,
    sponsored: false, aiVerified: true, photo: "https://i.pravatar.cc/240?img=68", gradient: "g3",
    responseTime: "~4 часа", avatarColor: "#f59e0b",
    ownScores: [{ exam: "GMAT", score: "760", verified: true }],
    methodology: "INSEAD MBA; экс-консультант Big3",
    languages: ["Русский", "Английский"],
    bio: "GMAT 760, MBA INSEAD. Готовлю взрослых профессионалов к GMAT/GRE и помогаю со стратегией поступления.",
    achievements: ["Студенты поступали в INSEAD, LBS, Wharton", "Средний рост GMAT: +140"],
    stat: { metric: "GMAT Score", before: 560, after: 700, sample: 38, passRate: 84 },
    lessons: 210, retention: 72, trial: false, trialFree: false, videoUrl: "",
    contacts: { instagram: "erlan.gmat", telegram: "erlan_gmat", whatsapp: "77011110009", phone: "+7 701 111 00 09", email: "erlan@agrigator.kz" },
  },
  {
    id: "t10", name: "Sophie Anderson", email: "sophie@agrigator.kz",
    exams: ["IELTS"], subjects: ["IELTS Speaking (native speaker)"],
    price: 20000, format: "online", city: "Онлайн", experience: 5, rating: 4.9,
    sponsored: true, aiVerified: false, photo: "https://i.pravatar.cc/240?img=24", gradient: "g4",
    responseTime: "~1 час", avatarColor: "#ef4444",
    ownScores: [],
    methodology: "University of Edinburgh; CELTA, экс-экзаменатор IELTS",
    languages: ["Английский"],
    bio: "Native speaker from the UK, former IELTS examiner. I help students break the Band 7 barrier in Speaking with examiner-level feedback.",
    achievements: ["Экс-экзаменатор IELTS Speaking", "90% студентов получают 7.0+ по Speaking"],
    stat: { metric: "Speaking Band", before: 6.0, after: 7.4, sample: 88, passRate: 90 },
    lessons: 300, retention: 76, trial: true, trialFree: false, videoUrl: "",
    contacts: { instagram: "sophie.ielts", telegram: "sophie_ielts", whatsapp: "77011110010", phone: "+7 701 111 00 10", email: "sophie@agrigator.kz" },
  },
];

// ── Курсы (вторичная сущность каталога) ──
const COURSES = [
  { id: "c1", title: "IELTS Intensive 7.5+", provider: "BilimHub", exams: ["IELTS"], price: 85000, priceUnit: "мес", format: "hybrid", city: "Алматы", duration: "2 месяца", groupSize: "до 8 человек", level: "Upper-Intermediate+", rating: 4.9, students: 1240, sponsored: true, aiVerified: true, emoji: "🇬🇧", gradient: "g1", description: "Интенсивная подготовка к IELTS с фокусом на Writing и Speaking. Ежедневные мок-тесты, личный куратор.", features: ["Ежедневные мок-тесты", "Личный куратор", "Гарантия результата или возврат денег"], schedule: "Пн–Пт 19:00–21:00", scoreStats: { metric: "IELTS Band", before: 5.8, after: 7.2, sampleSize: 312, passRate: 91 }, trial: true, trialFree: true, videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw", contacts: { instagram: "bilimhub.kz", telegram: "bilimhub", whatsapp: "77071234501", phone: "+7 707 123 45 01", email: "hello@bilimhub.kz" }, moneyBack: true },
  { id: "c2", title: "SAT 1500+ Bootcamp", provider: "Almaty Prep Academy", exams: ["SAT"], price: 120000, priceUnit: "мес", format: "offline", city: "Алматы", duration: "3 месяца", groupSize: "до 6 человек", level: "Advanced", rating: 4.8, students: 860, sponsored: true, aiVerified: true, emoji: "📐", gradient: "g2", description: "Буткемп для тех, кто целится в топ-университеты США. Digital SAT формат, адаптивные тренажёры.", features: ["Digital SAT тренажёры", "Эссе-менторство", "College counseling в подарок"], schedule: "Вт/Чт/Сб 15:00–18:00", scoreStats: { metric: "SAT Score", before: 1180, after: 1510, sampleSize: 204, passRate: 88 }, trial: true, trialFree: false, videoUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ", contacts: { instagram: "almatyprep", telegram: "almatyprep", whatsapp: "77071234502", phone: "+7 707 123 45 02", email: "info@almatyprep.kz" }, moneyBack: true },
  { id: "c3", title: "IELTS с нуля: 5.5 → 6.5", provider: "EduWay", exams: ["IELTS"], price: 45000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "3 месяца", groupSize: "до 12 человек", level: "Pre-Intermediate", rating: 4.6, students: 2100, sponsored: false, aiVerified: true, emoji: "✈️", gradient: "g3", description: "Курс для тех, кто начинает подготовку с нуля. Плавный вход в формат экзамена.", features: ["Записи всех уроков", "Домашки с проверкой", "Telegram-сообщество"], schedule: "Пн/Ср/Пт 20:00–21:30", scoreStats: { metric: "IELTS Band", before: 4.9, after: 6.4, sampleSize: 540, passRate: 84 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "eduway.kz", telegram: "eduwaykz", whatsapp: "77071234503", phone: "+7 707 123 45 03", email: "team@eduway.kz" }, moneyBack: false },
  { id: "c4", title: "SAT Math Mastery", provider: "Tarqyn School", exams: ["SAT"], price: 60000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "2 месяца", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.7, students: 530, sponsored: false, aiVerified: false, emoji: "🧮", gradient: "g4", description: "Только математическая секция SAT: от Heart of Algebra до Advanced Math. Цель — 750+ по Math.", features: ["Банк из 3000+ задач", "Еженедельные мини-моки", "Разбор ошибок 1-на-1"], schedule: "Вт/Чт 19:00–20:30", scoreStats: { metric: "SAT Math", before: 580, after: 760, sampleSize: 150, passRate: 86 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "tarqyn.school", telegram: "tarqyn", whatsapp: "77071234504", phone: "+7 707 123 45 04", email: "hi@tarqyn.kz" }, moneyBack: false },
  { id: "c5", title: "IB Math AA/AI HL Support", provider: "IB Masters", exams: ["IB"], price: 95000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "весь учебный год", groupSize: "до 5 человек", level: "HL", rating: 4.9, students: 310, sponsored: false, aiVerified: true, emoji: "🎯", gradient: "g5", description: "Сопровождение по IB Math (AA/AI, HL и SL). Подготовка к IA и финальным экзаменам.", features: ["Преподаватели — IB examiners", "Помощь с IA", "Past papers с разбором"], schedule: "Гибкое расписание", scoreStats: { metric: "IB Grade", before: 4.1, after: 6.3, sampleSize: 96, passRate: 93 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "ib.masters", telegram: "ibmasters", whatsapp: "77071234505", phone: "+7 707 123 45 05", email: "care@ibmasters.kz" }, moneyBack: true },
  { id: "c6", title: "A-Level Physics (CIE/Edexcel)", provider: "Cambridge Route", exams: ["A-Level"], price: 90000, priceUnit: "мес", format: "hybrid", city: "Астана", duration: "6 месяцев", groupSize: "до 6 человек", level: "AS/A2", rating: 4.8, students: 240, sponsored: false, aiVerified: false, emoji: "⚛️", gradient: "g6", description: "Полная подготовка к A-Level Physics: теория, лабораторные навыки, past papers. Цель — A*/A.", features: ["Past papers с 2015 года", "Лабораторный практикум", "Предикт-оценка"], schedule: "Сб/Вс 11:00–13:00", scoreStats: { metric: "% A*/A", before: 22, after: 78, sampleSize: 88, passRate: 78 }, trial: true, trialFree: false, videoUrl: "", contacts: { instagram: "cambridge.route", telegram: "cambridgeroute", whatsapp: "77071234506", phone: "+7 707 123 45 06", email: "office@cambridgeroute.kz" }, moneyBack: false },
  { id: "c7", title: "TOEFL iBT 100+", provider: "LinguaPro", exams: ["TOEFL"], price: 70000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "2 месяца", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.5, students: 670, sponsored: false, aiVerified: true, emoji: "🗽", gradient: "g1", description: "Подготовка к TOEFL iBT с симуляциями реального интерфейса экзамена.", features: ["Симулятор интерфейса ETS", "Шаблоны для Writing"], schedule: "Пн/Ср 19:30–21:00", scoreStats: { metric: "TOEFL Score", before: 78, after: 103, sampleSize: 178, passRate: 82 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "linguapro.kz", telegram: "linguapro", whatsapp: "77071234507", phone: "+7 707 123 45 07", email: "go@linguapro.kz" }, moneyBack: false },
  { id: "c8", title: "ЕНТ Интенсив: математика + физика", provider: "Daryn Centre", exams: ["ЕНТ"], price: 35000, priceUnit: "мес", format: "offline", city: "Шымкент", duration: "4 месяца", groupSize: "до 15 человек", level: "11 класс", rating: 4.4, students: 1800, sponsored: false, aiVerified: false, emoji: "🇰🇿", gradient: "g2", description: "Системная подготовка к ЕНТ по профильным предметам. Еженедельные пробные тестирования.", features: ["Пробное ЕНТ каждую неделю", "Рейтинг группы", "Родительские отчёты"], schedule: "Пн–Сб 16:00–18:00", scoreStats: { metric: "Балл ЕНТ", before: 72, after: 116, sampleSize: 640, passRate: 89 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "daryn.centre", telegram: "daryncentre", whatsapp: "77071234508", phone: "+7 707 123 45 08", email: "info@daryn.kz" }, moneyBack: false },
  { id: "c9", title: "NUET Preparation Pro", provider: "NU Track", exams: ["NUET"], price: 55000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "5 месяцев", groupSize: "до 12 человек", level: "11–12 класс", rating: 4.7, students: 420, sponsored: true, aiVerified: true, emoji: "🏛️", gradient: "g3", description: "Подготовка к NUET: Critical Thinking и Math. Преподаватели — выпускники NU.", features: ["Преподаватели — выпускники NU", "База NUET-style задач", "Mock days раз в месяц"], schedule: "Вт/Чт/Сб 18:00–19:30", scoreStats: { metric: "NUET Score", before: 95, after: 152, sampleSize: 130, passRate: 74 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "nu.track", telegram: "nutrack", whatsapp: "77071234509", phone: "+7 707 123 45 09", email: "hello@nutrack.kz" }, moneyBack: true },
  { id: "c10", title: "GMAT 700+ для MBA", provider: "MBA Lab", exams: ["GMAT"], price: 150000, priceUnit: "курс", format: "online", city: "Онлайн", duration: "10 недель", groupSize: "до 6 человек", level: "Advanced", rating: 4.8, students: 190, sponsored: false, aiVerified: true, emoji: "💼", gradient: "g4", description: "Подготовка к GMAT Focus Edition. Data Insights, Quant, Verbal.", features: ["Официальные моки GMAC", "Стратегия тайм-менеджмента"], schedule: "Сб/Вс 10:00–12:00", scoreStats: { metric: "GMAT Score", before: 540, after: 695, sampleSize: 64, passRate: 81 }, trial: false, trialFree: false, videoUrl: "", contacts: { instagram: "mba.lab", telegram: "mbalab", whatsapp: "77071234510", phone: "+7 707 123 45 10", email: "apply@mbalab.kz" }, moneyBack: false },
  { id: "c11", title: "A-Level Mathematics", provider: "Cambridge Route", exams: ["A-Level"], price: 90000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "6 месяцев", groupSize: "до 8 человек", level: "AS/A2", rating: 4.6, students: 280, sponsored: false, aiVerified: false, emoji: "📊", gradient: "g5", description: "Pure Math, Mechanics и Statistics для CIE и Edexcel.", features: ["Конспекты по всем темам", "Топик-тесты", "Past papers marathon"], schedule: "Пн/Ср/Пт 18:00–19:30", scoreStats: { metric: "% A*/A", before: 30, after: 81, sampleSize: 102, passRate: 81 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "cambridge.route", telegram: "cambridgeroute", whatsapp: "77071234506", phone: "+7 707 123 45 06", email: "office@cambridgeroute.kz" }, moneyBack: false },
  { id: "c12", title: "AP Calculus BC", provider: "APex School", exams: ["AP"], price: 80000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "4 месяца", groupSize: "до 8 человек", level: "AP", rating: 4.5, students: 150, sponsored: false, aiVerified: false, emoji: "∫", gradient: "g6", description: "Подготовка к AP Calculus BC на 5 баллов. FRQ-практика и разбор стратегий.", features: ["FRQ-разборы", "AP Classroom интеграция", "Предикт скора"], schedule: "Вт/Чт 20:00–21:30", scoreStats: { metric: "% на 4–5", before: 35, after: 87, sampleSize: 54, passRate: 87 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "apex.school", telegram: "apexschool", whatsapp: "77071234512", phone: "+7 707 123 45 12", email: "team@apexschool.kz" }, moneyBack: false },
  { id: "c13", title: "IELTS Weekend Group", provider: "EduWay", exams: ["IELTS"], price: 38000, priceUnit: "мес", format: "offline", city: "Астана", duration: "3 месяца", groupSize: "до 14 человек", level: "Intermediate", rating: 4.3, students: 940, sponsored: false, aiVerified: false, emoji: "📅", gradient: "g1", description: "Бюджетная группа выходного дня. Полное покрытие всех четырёх секций.", features: ["Занятия только Сб/Вс", "Онлайн-платформа", "Мини-моки раз в 2 недели"], schedule: "Сб/Вс 12:00–15:00", scoreStats: { metric: "IELTS Band", before: 5.4, after: 6.5, sampleSize: 260, passRate: 79 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "eduway.kz", telegram: "eduwaykz", whatsapp: "77071234503", phone: "+7 707 123 45 03", email: "team@eduway.kz" }, moneyBack: false },
  { id: "c14", title: "GRE Quant 165+", provider: "MBA Lab", exams: ["GRE"], price: 130000, priceUnit: "курс", format: "online", city: "Онлайн", duration: "8 недель", groupSize: "до 8 человек", level: "Advanced", rating: 4.6, students: 110, sponsored: false, aiVerified: false, emoji: "🧠", gradient: "g2", description: "Quant-секция GRE для магистратуры и PhD. Глубокая проработка Data Interpretation.", features: ["ETS official guides", "Адаптивные домашки"], schedule: "Пн/Чт 19:00–21:00", scoreStats: { metric: "GRE Quant", before: 152, after: 166, sampleSize: 42, passRate: 83 }, trial: false, trialFree: false, videoUrl: "", contacts: { instagram: "mba.lab", telegram: "mbalab", whatsapp: "77071234510", phone: "+7 707 123 45 10", email: "apply@mbalab.kz" }, moneyBack: false },
  { id: "c15", title: "SAT Verbal Sprint", provider: "Almaty Prep Academy", exams: ["SAT"], price: 65000, priceUnit: "мес", format: "online", city: "Онлайн", duration: "6 недель", groupSize: "до 10 человек", level: "Intermediate+", rating: 4.5, students: 380, sponsored: false, aiVerified: true, emoji: "📚", gradient: "g3", description: "Спринт по Reading & Writing секции Digital SAT.", features: ["Vocabulary system", "Grammar bootcamp", "2 полных мока"], schedule: "Пн/Ср/Пт 17:00–18:30", scoreStats: { metric: "SAT R&W", before: 560, after: 710, sampleSize: 118, passRate: 80 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "almatyprep", telegram: "almatyprep", whatsapp: "77071234502", phone: "+7 707 123 45 02", email: "info@almatyprep.kz" }, moneyBack: false },
  { id: "c16", title: "IB Extended Essay Mentorship", provider: "IB Masters", exams: ["IB"], price: 70000, priceUnit: "курс", format: "online", city: "Онлайн", duration: "8 недель", groupSize: "1-на-1", level: "DP1/DP2", rating: 4.9, students: 85, sponsored: false, aiVerified: false, emoji: "✍️", gradient: "g4", description: "Индивидуальное менторство по Extended Essay: тема, research design, драфты.", features: ["Ментор — IB examiner", "6 индивидуальных сессий", "Дедлайн-трекер"], schedule: "Индивидуально", scoreStats: { metric: "% A/B по EE", before: 28, after: 84, sampleSize: 47, passRate: 84 }, trial: true, trialFree: true, videoUrl: "", contacts: { instagram: "ib.masters", telegram: "ibmasters", whatsapp: "77071234505", phone: "+7 707 123 45 05", email: "care@ibmasters.kz" }, moneyBack: true },
];

const REVIEWS = [
  { targetType: "course", targetId: "c1", authorName: "Дана С.", rating: 5, verified: true, beforeScore: "6.0", afterScore: "7.5", note: "За 2 месяца подняла с 6.0 до 7.5! Видно прогресс по каждому критерию." },
  { targetType: "course", targetId: "c1", authorName: "Арман Т.", rating: 5, verified: true, beforeScore: "5.5", afterScore: "7.0", note: "Куратор отвечает даже ночью, моки каждую субботу. Writing разобрали до косточек." },
  { targetType: "course", targetId: "c2", authorName: "Бекзат Н.", rating: 5, verified: true, beforeScore: "1230", afterScore: "1540", note: "1540 на майском SAT! Адаптивные тренажёры — топ." },
  { targetType: "course", targetId: "c3", authorName: "Нурлан А.", rating: 5, verified: true, beforeScore: "4.5", afterScore: "6.5", note: "Начинал почти с нуля. Очень комфортный темп." },
  { targetType: "course", targetId: "c5", authorName: "Tomiris", rating: 5, verified: true, beforeScore: "4", afterScore: "7", note: "IA вытянули с 11 до 19 баллов." },
  { targetType: "course", targetId: "c8", authorName: "Айбек Д.", rating: 4, verified: true, beforeScore: "78", afterScore: "118", note: "118 на пробном республиканском!" },
  { targetType: "course", targetId: "c9", authorName: "Диас О.", rating: 5, verified: true, beforeScore: "101", afterScore: "156", note: "Прошёл на грант NU. Mock days — лучшее, что было." },
  { targetType: "tutor", targetId: "t1", authorName: "Жанель Б.", rating: 5, verified: true, beforeScore: "6.5", afterScore: "8.0", note: "Айгерим — лучшая. Writing с 6.0 до 7.5 за 6 недель." },
  { targetType: "tutor", targetId: "t1", authorName: "Олжас К.", rating: 5, verified: true, beforeScore: "", afterScore: "", note: "Очень структурно, без воды. Стоит каждого тенге." },
  { targetType: "tutor", targetId: "t2", authorName: "Алишер С.", rating: 5, verified: true, beforeScore: "1280", afterScore: "1520", note: "1520! Данияр объясняет ловушки College Board так, что видишь их за километр." },
  { targetType: "tutor", targetId: "t3", authorName: "Аружан Т.", rating: 5, verified: true, beforeScore: "5.5", afterScore: "7.0", note: "Speaking-клубы — огонь. Перестала бояться говорить уже после третьей недели." },
  { targetType: "tutor", targetId: "t4", authorName: "Daniel P.", rating: 5, verified: true, beforeScore: "", afterScore: "", note: "Maria saved my IA. Got 19/20." },
  { targetType: "tutor", targetId: "t6", authorName: "Гульнара (мама ученика)", rating: 5, verified: true, beforeScore: "64", afterScore: "109", note: "Сын поднял математику с 24 до 36 баллов." },
  { targetType: "tutor", targetId: "t7", authorName: "Тамерлан Е.", rating: 5, verified: true, beforeScore: "620", afterScore: "780", note: "Math 780. Александр разбирает любую задачу." },
  { targetType: "tutor", targetId: "t9", authorName: "Рустам Б.", rating: 5, verified: true, beforeScore: "590", afterScore: "720", note: "GMAT 720 с третьей попытки. Жёстко, но работает." },
  { targetType: "tutor", targetId: "t10", authorName: "Асель М.", rating: 5, verified: true, beforeScore: "6.0", afterScore: "7.5", note: "Speaking 7.5 после 6.0! Sophie даёт фидбек как настоящий экзаменатор." },
];

const LEADS = [
  { source: "Instagram", url: "https://instagram.com/p/demo1", rawText: "🔥 Набор в группу IELTS! Гарантия 7.0+ 💪 Преподаватель с Band 8.5. Онлайн 3 раза в неделю. 50 000 тг/мес. Пробный бесплатно! @ielts_pro_almaty", parsed: { title: "IELTS группа 7.0+", exam: "IELTS", price: 50000, format: "online", instagram: "ielts_pro_almaty" } },
  { source: "OLX", url: "https://olx.kz/obyavlenie/demo2", rawText: "Репетитор по SAT Math. Студент NU, собственный результат 790. 8000 тг/час, онлайн. Первое занятие — диагностика бесплатно. Тел: +7 700 555 44 33", parsed: { title: "Репетитор SAT Math (NU)", exam: "SAT", price: 8000, format: "online", phone: "+7 700 555 44 33" } },
  { source: "Telegram", url: "https://t.me/edu_ads_kz/4521", rawText: "Группа подготовки к NUET. Critical Thinking + Math. Старт 1 июля. 45000 в месяц, мест мало! @nuet_start", parsed: { title: "NUET группа, старт 1 июля", exam: "NUET", price: 45000, format: "online", telegram: "nuet_start" } },
];

async function main() {
  console.log("🌱 Очистка и сидинг…");
  // Порядок с учётом внешних ключей.
  await prisma.retentionSignal.deleteMany();
  await prisma.review.deleteMany();
  await prisma.result.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.studentGoal.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.session.deleteMany();
  await prisma.tutorProfile.deleteMany();
  await prisma.course.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // Курсы
  for (const c of COURSES) {
    await prisma.course.create({
      data: {
        id: c.id, title: c.title, provider: c.provider, examsJson: J(c.exams),
        price: c.price, priceUnit: c.priceUnit, format: c.format, city: c.city,
        duration: c.duration, groupSize: c.groupSize, level: c.level, rating: c.rating,
        students: c.students, sponsored: c.sponsored, aiVerified: c.aiVerified,
        emoji: c.emoji, gradient: c.gradient, description: c.description,
        featuresJson: J(c.features), schedule: c.schedule, scoreStatsJson: J(c.scoreStats),
        trial: c.trial, trialFree: c.trialFree, videoUrl: c.videoUrl,
        contactsJson: J(c.contacts), moneyBack: c.moneyBack,
      },
    });
  }

  // Тюторы (User + TutorProfile с фиксированными id, чтобы отзывы совпали)
  for (const t of TUTORS) {
    await prisma.user.create({
      data: {
        id: t.id, role: "tutor", name: t.name, email: t.email,
        passwordHash: hashPassword("tutor123"), avatarColor: t.avatarColor,
        tutorProfile: {
          create: {
            subjectsJson: J(t.subjects), examsJson: J(t.exams), price: t.price,
            priceUnit: "час", format: t.format, city: t.city, experience: t.experience,
            bio: t.bio, methodology: t.methodology, photo: t.photo, gradient: t.gradient,
            responseTime: t.responseTime, videoUrl: t.videoUrl,
            verified: true, aiVerified: t.aiVerified, sponsored: t.sponsored,
            ownScoresJson: J(t.ownScores), achievementsJson: J(t.achievements),
            languagesJson: J(t.languages), contactsJson: J(t.contacts),
            statMetric: t.stat.metric, statBefore: t.stat.before, statAfter: t.stat.after,
            statSample: t.stat.sample, statPassRate: t.stat.passRate,
            statLessons: t.lessons, statRetention: t.retention,
            trial: t.trial, trialFree: t.trialFree, rating: t.rating, source: "manual",
          },
        },
      },
    });
  }

  // Демо-пользователи
  const admin = await prisma.user.create({
    data: { id: "u1", role: "admin", name: "Администратор", email: "admin@agrigator.kz", passwordHash: hashPassword("admin123"), plan: "pro", avatarColor: "#7c3aed" },
  });
  const student = await prisma.user.create({
    data: { id: "u2", role: "student", name: "Аймер", email: "user@demo.kz", passwordHash: hashPassword("demo123"), avatarColor: "#0ea5e9" },
  });
  const proStudent = await prisma.user.create({
    data: { id: "u3", role: "student", name: "Pro Студент", email: "pro@demo.kz", passwordHash: hashPassword("demo123"), plan: "pro", avatarColor: "#16a34a" },
  });

  // Матч-вектор демо-студента
  await prisma.studentGoal.create({
    data: { userId: student.id, exam: "IELTS", deadline: "3-6m", pace: "slow", style: "soft", baselineScore: "5.5", baselineSource: "official" },
  });
  await prisma.favorite.createMany({ data: [
    { userId: student.id, key: "tutor:t1" },
    { userId: student.id, key: "course:c1" },
  ]});

  // Полный пройденный пайплайн: бронь → урок → верифиц. результат (для дашбордов).
  const past = new Date(Date.now() - 7 * 864e5);
  const booking = await prisma.booking.create({
    data: { id: "demo-b1", studentId: student.id, tutorId: "t1", slotAt: past, kind: "trial", status: "completed", meetLink: "https://meet.jit.si/agrigator-demo-b1" },
  });
  await prisma.payment.create({
    data: { bookingId: booking.id, amount: 12000, status: "confirmed", provider: "kaspi_manual", confirmedAt: past },
  });
  await prisma.lesson.create({
    data: { bookingId: booking.id, studentId: student.id, tutorId: "t1", happenedAt: past, sequenceNo: 1 },
  });

  // Отзывы
  for (const r of REVIEWS) {
    await prisma.review.create({
      data: {
        authorName: r.authorName, byRole: "student", targetType: r.targetType,
        targetId: r.targetId, rating: r.rating, note: r.note, verified: r.verified,
        beforeScore: r.beforeScore, afterScore: r.afterScore,
      },
    });
  }

  // Лиды парсера
  for (const l of LEADS) {
    await prisma.lead.create({
      data: { source: l.source, url: l.url, rawText: l.rawText, parsedJson: J(l.parsed), status: "new" },
    });
  }

  console.log(`✅ Засеяно: ${TUTORS.length} тюторов, ${COURSES.length} курсов, ${REVIEWS.length} отзывов, ${LEADS.length} лидов.`);
  console.log("   Демо-входы: admin@agrigator.kz/admin123 · user@demo.kz/demo123 · aigerim@agrigator.kz/tutor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
