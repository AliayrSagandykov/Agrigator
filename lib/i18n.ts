// ============================================================
// i18n: словари RU / KK / EN. Плоско-вложенный объект; ru — источник,
// kk и en типизированы как Dict, поэтому TS требует полного покрытия ключей.
// Модуль без серверных зависимостей — можно импортить и в клиенте.
// ============================================================

export const LOCALES = ["ru", "kk", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_LABELS: Record<Locale, string> = { ru: "RU", kk: "ҚАЗ", en: "EN" };

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

const ru = {
  nav: {
    tutors: "Тюторы", match: "Подбор", forTutors: "Тьюторам", login: "Войти",
    register: "Регистрация", logout: "Выйти", favorites: "Избранное", dashboard: "Кабинет", menu: "Меню",
  },
  footer: {
    tagline: "Агрегатор тюторов для подготовки к экзаменам. Выбор по верифицированным результатам. Данные демонстрационные.",
    exams: "Экзамены", platform: "Платформа", account: "Аккаунт", aiMatch: "AI-подбор",
    rights: "© 2026 Agrigator · Демо-проект",
  },
  home: {
    badge: "Результаты проверены извне",
    heroLead: "Выбирай тютора по", heroHL: "реальным результатам", heroTail: ", а не по чужому логотипу",
    subtitle: "Верифицированная дельта баллов, удержание учеников, бронь и оплата — в одном месте. Цифрам неоткуда врать: их ставит система.",
    ctaFind: "Я ищу тютора", ctaTutor: "Я тютор",
    proofTitle: "Доказательства, а не обещания",
    proofSub: "Каждый график «до/после» построен по верифицированным результатам учеников.",
    proofLink: "Профиль тютора",
    why1Title: "Дельта, а не звёздочки",
    why1Body: "Главный сигнал — насколько вырос балл ученика. Baseline ставит диагностика или официальный прошлый результат, финал — score report. Тютор число не вводит.",
    why2Title: "Удержание как правда",
    why2Body: "Возвращаются ли ученики — видно из переброней. А ушёл «потому что сдал» или «потому что не подошёл» — уточняем одним тапом.",
    why3Title: "Всё через платформу",
    why3Body: "Бронь, авто-ссылка на урок и оплата в эскроу. Оставаться в приложении удобнее, чем уходить в личку.",
  },
  forTutors: {
    heroLead: "Твой портфель результатов, который ", heroHL: "нельзя купить", heroTail: "",
    subtitle: "Регистрация бесплатна навсегда. Платформа берёт на себя бронь, ссылку на урок и оплату — а твои метрики растут сами с каждым результатом ученика.",
    cta: "Создать профиль тьютора",
    b1Title: "Метрики вместо саморекламы",
    b1Body: "Средняя дельта, число уроков и удержание считает система. Не нужно доказывать словами — цифры говорят сами.",
    b2Title: "Лёгкая верификация на входе",
    b2Body: "Подтверждение личности и (по желанию) свой балл. Главная верификация идёт потом — из реальных результатов учеников.",
    b3Title: "Оплата и эскроу",
    b3Body: "Деньги держатся в эскроу до урока и падают тебе после. Никаких «забыл перевести».",
    b4Title: "Логистика — на платформе",
    b4Body: "Принятая бронь = слот в календаре и авто-ссылка на урок. Ты не тратишь время на переписку о времени.",
  },
  catalog: {
    title: "Тюторы",
    subtitle: "Отсортированы по верифицированным метрикам. Не тысяча — только релевантное.",
    exam: "Экзамен", format: "Формат", sort: "Сортировка", search: "Поиск", searchPh: "Имя, предмет…",
    examAll: "Все", formatAny: "Любой", online: "Онлайн", offline: "Оффлайн", hybrid: "Гибрид",
    sortRecommended: "Рекомендуемые", sortDelta: "По дельте", sortRetention: "По удержанию",
    sortCheaper: "Дешевле", sortPricier: "Дороже",
    onlyVerified: "Только верифиц.", apply: "Применить", found: "Найдено:",
    empty: "Под фильтры никто не подошёл. Сбросьте часть условий.",
  },
  card: {
    newTutor: "🌱 Новый тютор, мало уроков — метрики пока копятся",
    verifiedStudents: "верифиц. учеников", retention: "удержание", match: "совпадение", ad: "Реклама",
  },
  chart: { before: "до", after: "после", sample: "выборка", students: "учеников", toResult: "к результату" },
  metric: { avgDelta: "средняя дельта", lessons: "уроков", retention: "удержание" },
};

export type Dict = typeof ru;

const kk: Dict = {
  nav: {
    tutors: "Тьюторлар", match: "Таңдау", forTutors: "Тьюторларға", login: "Кіру",
    register: "Тіркелу", logout: "Шығу", favorites: "Таңдаулылар", dashboard: "Кабинет", menu: "Мәзір",
  },
  footer: {
    tagline: "Емтиханға дайындық тьюторларының агрегаторы. Таңдау — верификацияланған нәтижелер бойынша. Деректер демонстрациялық.",
    exams: "Емтихандар", platform: "Платформа", account: "Аккаунт", aiMatch: "AI-таңдау",
    rights: "© 2026 Agrigator · Демо-жоба",
  },
  home: {
    badge: "Нәтижелер сырттай тексерілген",
    heroLead: "Тьюторды", heroHL: "нақты нәтижелер", heroTail: " бойынша таңда, бөтен логотип бойынша емес",
    subtitle: "Верификацияланған балл өсімі, оқушылардың қайта оралуы, брондау мен төлем — бір жерде. Сандардың өтірік айтуына жөн жоқ: оларды жүйе қояды.",
    ctaFind: "Тьютор іздеймін", ctaTutor: "Мен тьютормын",
    proofTitle: "Уәде емес, дәлел",
    proofSub: "Әр «дейін/кейін» графигі оқушылардың верификацияланған нәтижелері бойынша құрылған.",
    proofLink: "Тьютор профилі",
    why1Title: "Жұлдызша емес, өсім",
    why1Body: "Басты сигнал — оқушының баллы қаншаға өскені. Baseline-ді диагностика не өткен ресми нәтиже қояды, финалды — score report. Тьютор санды енгізбейді.",
    why2Title: "Қайта оралу — шындық",
    why2Body: "Оқушылар қайта оралама — қайта брондаудан көрінеді. Ал «тапсырғандықтан» кетті ме, әлде «ұнамағандықтан» ба — бір түртумен анықтаймыз.",
    why3Title: "Бәрі платформа арқылы",
    why3Body: "Брондау, сабаққа авто-сілтеме және эскроу-төлем. Қосымшада қалу — жеке хабарламаға кетуден ыңғайлы.",
  },
  forTutors: {
    heroLead: "", heroHL: "Сатып алуға болмайтын", heroTail: " нәтижелер портфолиоң",
    subtitle: "Тіркелу мәңгі тегін. Платформа брондауды, сабақ сілтемесін және төлемді өзіне алады — ал метрикаларың әр оқушы нәтижесімен өзі өседі.",
    cta: "Тьютор профилін жасау",
    b1Title: "Жарнаманың орнына метрика",
    b1Body: "Орташа өсім, сабақ саны және қайта оралу — жүйе санайды. Сөзбен дәлелдеудің қажеті жоқ — сандар өзі айтады.",
    b2Title: "Кірерде жеңіл верификация",
    b2Body: "Жеке басты растау және (қаласаң) өз баллың. Басты верификация кейін келеді — оқушылардың нақты нәтижелерінен.",
    b3Title: "Төлем және эскроу",
    b3Body: "Ақша сабаққа дейін эскроуда тұрады, кейін саған түседі. «Аударуды ұмыттым» дегендей жоқ.",
    b4Title: "Логистика — платформада",
    b4Body: "Қабылданған бронь = күнтізбедегі слот және сабаққа авто-сілтеме. Уақыт туралы жазысуға уақыт жұмсамайсың.",
  },
  catalog: {
    title: "Тьюторлар",
    subtitle: "Верификацияланған метрикалар бойынша сұрыпталған. Мыңдап емес — тек өзекті.",
    exam: "Емтихан", format: "Формат", sort: "Сұрыптау", search: "Іздеу", searchPh: "Аты, пәні…",
    examAll: "Барлығы", formatAny: "Кез келген", online: "Онлайн", offline: "Оффлайн", hybrid: "Гибрид",
    sortRecommended: "Ұсынылған", sortDelta: "Өсім бойынша", sortRetention: "Қайта оралу бойынша",
    sortCheaper: "Арзанырақ", sortPricier: "Қымбатырақ",
    onlyVerified: "Тек верификацияланған", apply: "Қолдану", found: "Табылды:",
    empty: "Сүзгілерге ешкім сай келмеді. Кейбір шарттарды алып тастаңыз.",
  },
  card: {
    newTutor: "🌱 Жаңа тьютор, сабақ аз — метрикалар әлі жиналуда",
    verifiedStudents: "верификацияланған оқушы", retention: "қайта оралу", match: "сәйкестік", ad: "Жарнама",
  },
  chart: { before: "дейін", after: "кейін", sample: "таңдама", students: "оқушы", toResult: "нәтижеге" },
  metric: { avgDelta: "орташа өсім", lessons: "сабақ", retention: "қайта оралу" },
};

const en: Dict = {
  nav: {
    tutors: "Tutors", match: "Match", forTutors: "For tutors", login: "Log in",
    register: "Sign up", logout: "Log out", favorites: "Favorites", dashboard: "Dashboard", menu: "Menu",
  },
  footer: {
    tagline: "A tutor marketplace for exam prep. Choose by verified results. Demo data.",
    exams: "Exams", platform: "Platform", account: "Account", aiMatch: "AI match",
    rights: "© 2026 Agrigator · Demo project",
  },
  home: {
    badge: "Results verified externally",
    heroLead: "Choose a tutor by", heroHL: "real results", heroTail: ", not someone else's logo",
    subtitle: "Verified score gains, student retention, booking and payment — all in one place. The numbers can't lie: the system sets them.",
    ctaFind: "I'm looking for a tutor", ctaTutor: "I'm a tutor",
    proofTitle: "Proof, not promises",
    proofSub: "Every before/after chart is built from students' verified results.",
    proofLink: "Tutor profile",
    why1Title: "Delta, not stars",
    why1Body: "The main signal is how much a student's score grew. Baseline comes from a diagnostic or a past official score, the final from the score report. The tutor never types the number.",
    why2Title: "Retention as truth",
    why2Body: "Whether students come back is visible from rebookings. And whether they left 'because they passed' or 'because it wasn't a fit' — we ask with one tap.",
    why3Title: "Everything through the platform",
    why3Body: "Booking, an auto lesson link, and escrow payment. Staying in the app is easier than moving to DMs.",
  },
  forTutors: {
    heroLead: "Your results portfolio that ", heroHL: "can't be bought", heroTail: "",
    subtitle: "Registration is free forever. The platform handles booking, the lesson link and payment — and your metrics grow on their own with every student result.",
    cta: "Create a tutor profile",
    b1Title: "Metrics instead of self-promotion",
    b1Body: "Average delta, lesson count and retention are computed by the system. No need to prove it with words — the numbers speak.",
    b2Title: "Light verification on entry",
    b2Body: "Identity confirmation and (optionally) your own score. The main verification comes later — from real student results.",
    b3Title: "Payment and escrow",
    b3Body: "Money is held in escrow until the lesson and lands with you after. No more 'forgot to transfer'.",
    b4Title: "Logistics on the platform",
    b4Body: "An accepted booking = a calendar slot and an auto lesson link. You don't waste time messaging about timing.",
  },
  catalog: {
    title: "Tutors",
    subtitle: "Sorted by verified metrics. Not a thousand — only the relevant.",
    exam: "Exam", format: "Format", sort: "Sort", search: "Search", searchPh: "Name, subject…",
    examAll: "All", formatAny: "Any", online: "Online", offline: "Offline", hybrid: "Hybrid",
    sortRecommended: "Recommended", sortDelta: "By delta", sortRetention: "By retention",
    sortCheaper: "Cheaper", sortPricier: "Pricier",
    onlyVerified: "Verified only", apply: "Apply", found: "Found:",
    empty: "Nobody matched the filters. Loosen some conditions.",
  },
  card: {
    newTutor: "🌱 New tutor, few lessons — metrics still building",
    verifiedStudents: "verified students", retention: "retention", match: "match", ad: "Ad",
  },
  chart: { before: "before", after: "after", sample: "sample", students: "students", toResult: "improvement" },
  metric: { avgDelta: "avg. delta", lessons: "lessons", retention: "retention" },
};

export const dictionaries: Record<Locale, Dict> = { ru, kk, en };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? ru;
}
