// ============================================================
// Публичные страницы: главная, каталог, детальные, сравнение
// ============================================================
window.Views = window.Views || {};

(function () {
  const $ = sel => document.querySelector(sel);
  const app = () => document.getElementById('app');

  // ---------------- ГЛАВНАЯ ----------------
  Views.home = function () {
    const sponsored = Store.allItems().filter(x => x.sponsored);
    const topCourses = Store.courses().slice().sort((a, b) => b.rating - a.rating).slice(0, 6);
    const topTutors = Store.tutors().slice().sort((a, b) => b.rating - a.rating).slice(0, 6);
    const recent = Store.recentItems();
    const totalStudents = Store.allItems().reduce((s, x) => s + x.students, 0);

    app().innerHTML =
      '<section class="hero">' +
      '<div class="container">' +
      '<h1>Найди свой курс или репетитора<br>для <span class="grad-text" id="heroExam">IELTS</span></h1>' +
      '<p class="hero-sub">Агрегатор подготовки к международным экзаменам с AI-подбором, AI-ассистентом на занятиях и проверенными результатами «до/после»</p>' +
      '<form class="hero-search" id="heroSearch">' +
      '<input class="input" id="heroQuery" placeholder="Например: IELTS 7.0, SAT Math, репетитор IB…">' +
      '<button class="btn btn-primary" type="submit">Найти</button>' +
      '</form>' +
      '<div class="hero-chips">' + SEED.exams.map(e =>
        '<a class="chip chip-exam big" href="#/catalog?exam=' + encodeURIComponent(e) + '">' + e + '</a>').join('') +
      '</div>' +
      '<div class="hero-stats">' +
      '<div><b>' + Store.courses().length + '</b><span>курсов</span></div>' +
      '<div><b>' + Store.tutors().length + '</b><span>репетиторов</span></div>' +
      '<div><b>' + totalStudents.toLocaleString('ru-RU') + '</b><span>студентов</span></div>' +
      '<div><b>91%</b><span>достигают цели</span></div>' +
      '</div>' +
      '</div></section>' +

      '<section class="container section">' +
      '<div class="ai-banner">' +
      '<div class="ai-banner-text">' +
      '<span class="chip chip-new">Главная фича</span>' +
      '<h2>🤖 AI-ассистент сидит на звонке вместе с тобой</h2>' +
      '<p>Наш ИИ подключается к онлайн-уроку, «учится» вместе со студентом в реальном времени, отмечает ошибки и сильные стороны — и сразу после звонка присылает детальный отчёт с рекомендациями.</p>' +
      '<a class="btn btn-light" href="#/ai-call">Посмотреть живое демо →</a>' +
      '</div>' +
      '<div class="ai-banner-cards">' +
      '<div class="mini-insight">⚠️ Путает Past Perfect и Past Simple</div>' +
      '<div class="mini-insight ok">✅ Speaking fluency выросла на 12%</div>' +
      '<div class="mini-insight">💡 Рекомендация: 15 мин/день shadowing</div>' +
      '</div>' +
      '</div></section>' +

      (sponsored.length ?
        '<section class="container section">' +
        '<div class="section-head"><h2>Спонсорские предложения</h2><span class="chip chip-ad">Реклама</span></div>' +
        '<div class="cards-grid">' + sponsored.map(UI.itemCard).join('') + '</div>' +
        '</section>' : '') +

      '<section class="container section">' +
      '<div class="section-head"><h2>Топ курсов</h2><a href="#/catalog?type=course" class="link">Все курсы →</a></div>' +
      '<div class="cards-grid">' + topCourses.map(UI.courseCard).join('') + '</div>' +
      '</section>' +

      '<section class="container section">' +
      '<div class="section-head"><h2>Топ репетиторов</h2><a href="#/catalog?type=tutor" class="link">Все репетиторы →</a></div>' +
      '<div class="cards-grid">' + topTutors.map(UI.tutorCard).join('') + '</div>' +
      '</section>' +

      '<section class="container section">' +
      '<div class="features-grid">' +
      '<a class="feature-card" href="#/match"><div class="feature-icon">🎯</div><h3>AI-подбор программы</h3><p>Ответь на 5 вопросов — ИИ найдёт твой мэтч среди курсов и репетиторов</p></a>' +
      '<a class="feature-card" href="#/verify"><div class="feature-icon">🛡️</div><h3>AI-верификация результатов</h3><p>Подтверждаем IELTS/SAT score reports преподавателей и студентов</p></a>' +
      '<a class="feature-card" href="#/ai-call"><div class="feature-icon">📞</div><h3>AI на звонках</h3><p>Ассистент учится вместе со студентом и даёт обратную связь</p></a>' +
      '<a class="feature-card" href="#/pricing"><div class="feature-icon">📊</div><h3>Pro-аналитика</h3><p>Реальные результаты «до/после», контакты и отчёты — по подписке</p></a>' +
      '</div></section>' +

      (recent.length ?
        '<section class="container section">' +
        '<div class="section-head"><h2>Вы недавно смотрели</h2></div>' +
        '<div class="cards-grid">' + recent.slice(0, 3).map(UI.itemCard).join('') + '</div>' +
        '</section>' : '');

    // ротация экзаменов в заголовке
    const exams = ['IELTS', 'SAT', 'IB', 'A-Level', 'NUET', 'TOEFL', 'ЕНТ'];
    let i = 0;
    const heroExam = $('#heroExam');
    const timer = setInterval(() => {
      if (!document.contains(heroExam)) { clearInterval(timer); return; }
      i = (i + 1) % exams.length;
      heroExam.textContent = exams[i];
    }, 2000);

    $('#heroSearch').onsubmit = e => {
      e.preventDefault();
      location.hash = '#/catalog?q=' + encodeURIComponent($('#heroQuery').value);
    };
  };

  // ---------------- КАТАЛОГ ----------------
  const catalogState = {
    q: '', type: 'all', exams: [], format: 'any', city: 'any',
    priceMin: '', priceMax: '', minRating: 0,
    trialOnly: false, verifiedOnly: false, sort: 'recommended', shown: 9
  };

  Views.catalog = function (params) {
    // параметры из URL перекрывают состояние
    if (params.exam) { catalogState.exams = [params.exam]; }
    if (params.q !== undefined) { catalogState.q = params.q; }
    if (params.type) { catalogState.type = params.type; }
    catalogState.shown = 9;
    renderCatalog();
  };

  function applyFilters() {
    let items = Store.allItems();
    const s = catalogState;
    if (s.type !== 'all') items = items.filter(x => x.type === s.type);
    if (s.exams.length) items = items.filter(x => x.exams.some(e => s.exams.includes(e)));
    if (s.format !== 'any') items = items.filter(x => x.format === s.format);
    if (s.city !== 'any') items = items.filter(x => x.city === s.city);
    if (s.priceMin !== '') items = items.filter(x => x.price >= +s.priceMin);
    if (s.priceMax !== '') items = items.filter(x => x.price <= +s.priceMax);
    if (s.minRating) items = items.filter(x => x.rating >= s.minRating);
    if (s.trialOnly) items = items.filter(x => x.trial);
    if (s.verifiedOnly) items = items.filter(x => x.aiVerified);
    if (s.q.trim()) {
      const q = s.q.trim().toLowerCase();
      items = items.filter(x =>
        (x.title || x.name).toLowerCase().includes(q) ||
        (x.provider || x.subjects || '').toLowerCase().includes(q) ||
        x.exams.join(' ').toLowerCase().includes(q) ||
        (x.description || x.bio || '').toLowerCase().includes(q));
    }
    const sorters = {
      recommended: (a, b) => (b.sponsored - a.sponsored) || (b.rating - a.rating) || (b.students - a.students),
      rating: (a, b) => b.rating - a.rating,
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      popular: (a, b) => b.students - a.students
    };
    return items.sort(sorters[s.sort] || sorters.recommended);
  }

  function renderCatalog() {
    const s = catalogState;
    const items = applyFilters();
    const visible = items.slice(0, s.shown);

    app().innerHTML =
      '<div class="container section">' +
      '<div class="breadcrumbs"><a href="#/">Главная</a> / Каталог</div>' +
      '<h1>Каталог курсов и репетиторов</h1>' +
      '<div class="catalog-layout">' +

      '<aside class="filters card">' +
      '<div class="filter-group">' +
      '<input class="input" id="fQ" placeholder="🔍 Поиск…" value="' + UI.esc(s.q) + '">' +
      '</div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Тип</div>' +
      '<div class="seg">' +
      segBtn('type', 'all', 'Все') + segBtn('type', 'course', 'Курсы') + segBtn('type', 'tutor', 'Репетиторы') +
      '</div></div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Экзамен</div>' +
      SEED.exams.map(e =>
        '<label class="check"><input type="checkbox" data-exam="' + e + '"' + (s.exams.includes(e) ? ' checked' : '') + '> ' + e + '</label>'
      ).join('') +
      '</div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Формат</div>' +
      '<select class="input" id="fFormat">' +
      opt('any', 'Любой', s.format) + opt('online', 'Онлайн', s.format) +
      opt('offline', 'Оффлайн', s.format) + opt('hybrid', 'Гибрид', s.format) +
      '</select></div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Город</div>' +
      '<select class="input" id="fCity">' + opt('any', 'Любой', s.city) +
      SEED.cities.map(c => opt(c, c, s.city)).join('') +
      '</select></div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Цена, ₸</div>' +
      '<div class="price-row">' +
      '<input class="input" id="fPriceMin" type="number" placeholder="от" value="' + s.priceMin + '">' +
      '<input class="input" id="fPriceMax" type="number" placeholder="до" value="' + s.priceMax + '">' +
      '</div></div>' +
      '<div class="filter-group">' +
      '<div class="filter-title">Рейтинг от: <b id="ratingVal">' + (s.minRating || '—') + '</b></div>' +
      '<input type="range" id="fRating" min="0" max="5" step="0.5" value="' + s.minRating + '">' +
      '</div>' +
      '<div class="filter-group">' +
      '<label class="check"><input type="checkbox" id="fTrial"' + (s.trialOnly ? ' checked' : '') + '> С пробным уроком</label>' +
      '<label class="check"><input type="checkbox" id="fVerified"' + (s.verifiedOnly ? ' checked' : '') + '> 🤖 Только AI-verified</label>' +
      '</div>' +
      '<button class="btn btn-ghost btn-block" id="fReset">Сбросить фильтры</button>' +
      '</aside>' +

      '<div class="catalog-results">' +
      '<div class="results-bar">' +
      '<span class="muted">Найдено: <b>' + items.length + '</b></span>' +
      '<select class="input sort-select" id="fSort">' +
      opt('recommended', 'Рекомендуемые', s.sort) +
      opt('rating', 'По рейтингу', s.sort) +
      opt('priceAsc', 'Дешевле', s.sort) +
      opt('priceDesc', 'Дороже', s.sort) +
      opt('popular', 'Популярные', s.sort) +
      '</select></div>' +
      (visible.length
        ? '<div class="cards-grid">' + visible.map(UI.itemCard).join('') + '</div>'
        : '<div class="empty-state">😕 Ничего не нашлось. Попробуйте смягчить фильтры.</div>') +
      (items.length > s.shown
        ? '<button class="btn btn-ghost btn-block" id="loadMore">Показать ещё (' + (items.length - s.shown) + ')</button>'
        : '') +
      '</div></div></div>';

    bindCatalog();
  }

  function segBtn(field, val, label) {
    const active = catalogState[field] === val;
    return '<button class="seg-btn' + (active ? ' active' : '') + '" data-seg="' + field + ':' + val + '">' + label + '</button>';
  }

  function opt(val, label, cur) {
    return '<option value="' + val + '"' + (String(cur) === String(val) ? ' selected' : '') + '>' + label + '</option>';
  }

  function bindCatalog() {
    const s = catalogState;
    let qTimer;
    $('#fQ').oninput = e => { clearTimeout(qTimer); qTimer = setTimeout(() => { s.q = e.target.value; s.shown = 9; renderCatalog(); }, 300); };
    document.querySelectorAll('[data-seg]').forEach(b => b.onclick = () => {
      const [field, val] = b.dataset.seg.split(':');
      s[field] = val; s.shown = 9; renderCatalog();
    });
    document.querySelectorAll('[data-exam]').forEach(cb => cb.onchange = () => {
      const e = cb.dataset.exam;
      if (cb.checked) s.exams.push(e); else s.exams = s.exams.filter(x => x !== e);
      s.shown = 9; renderCatalog();
    });
    $('#fFormat').onchange = e => { s.format = e.target.value; renderCatalog(); };
    $('#fCity').onchange = e => { s.city = e.target.value; renderCatalog(); };
    $('#fPriceMin').onchange = e => { s.priceMin = e.target.value; renderCatalog(); };
    $('#fPriceMax').onchange = e => { s.priceMax = e.target.value; renderCatalog(); };
    $('#fRating').oninput = e => { s.minRating = +e.target.value; $('#ratingVal').textContent = s.minRating || '—'; };
    $('#fRating').onchange = () => renderCatalog();
    $('#fTrial').onchange = e => { s.trialOnly = e.target.checked; renderCatalog(); };
    $('#fVerified').onchange = e => { s.verifiedOnly = e.target.checked; renderCatalog(); };
    $('#fSort').onchange = e => { s.sort = e.target.value; renderCatalog(); };
    $('#fReset').onclick = () => {
      Object.assign(s, { q: '', type: 'all', exams: [], format: 'any', city: 'any', priceMin: '', priceMax: '', minRating: 0, trialOnly: false, verifiedOnly: false, sort: 'recommended', shown: 9 });
      renderCatalog();
    };
    const more = $('#loadMore');
    if (more) more.onclick = () => { s.shown += 9; renderCatalog(); };
  }

  // ---------------- ДЕТАЛЬНЫЕ СТРАНИЦЫ ----------------
  Views.course = function (params) { renderDetail('course', params.id); };
  Views.tutor = function (params) { renderDetail('tutor', params.id); };

  function renderDetail(type, id) {
    const item = Store.getItem(type, id);
    if (!item) { app().innerHTML = '<div class="container section"><div class="empty-state">Не найдено. <a href="#/catalog">В каталог</a></div></div>'; return; }
    Store.trackView(type, id);
    const isCourse = type === 'course';
    const reviews = Store.reviewsFor(type, id);
    const user = Store.currentUser();

    app().innerHTML =
      '<div class="container section">' +
      '<div class="breadcrumbs"><a href="#/">Главная</a> / <a href="#/catalog?type=' + type + '">' + (isCourse ? 'Курсы' : 'Репетиторы') + '</a> / ' + UI.esc(item.title || item.name) + '</div>' +

      '<div class="detail-layout">' +
      '<div class="detail-main">' +

      '<div class="card detail-head">' +
      (item.sponsored ? '<div class="ad-ribbon">Реклама</div>' : '') +
      '<div class="detail-head-row">' +
      (isCourse
        ? '<div class="detail-cover ' + item.gradient + '"><span>' + item.emoji + '</span></div>'
        : '<div class="tutor-photo-wrap big">' + UI.avatar(item.name, item.photo, 110) + (item.online ? '<span class="online-dot big" title="Сейчас онлайн"></span>' : '') + '</div>') +
      '<div class="detail-title-block">' +
      '<h1>' + UI.esc(item.title || item.name) + '</h1>' +
      '<div class="muted">' + (isCourse ? UI.esc(item.provider) : UI.esc(item.subjects)) + ' · ' + UI.esc(item.city) + ' · ' + UI.FORMAT_LABEL[item.format] + '</div>' +
      '<div class="card-rating">' + UI.stars(item.rating) + '<b>' + item.rating + '</b><span class="muted">· ' + reviews.length + ' отзывов · ' + item.students + ' студентов</span></div>' +
      '<div class="card-top-row">' + UI.examChips(item.exams) +
      (item.aiVerified ? '<span class="chip chip-verified">🤖 Результаты подтверждены ИИ</span>' : '') +
      (item.moneyBack ? '<span class="chip chip-trial">💸 Гарантия возврата</span>' : '') +
      (!isCourse ? item.ownScores.map(sc => '<span class="chip chip-score">' + UI.esc(sc.exam) + ' ' + UI.esc(sc.score) + (sc.verified ? ' ✓' : '') + '</span>').join('') : '') +
      '</div>' +
      '</div></div>' +
      '</div>' +

      '<div class="card section-card"><h2>' + (isCourse ? 'О курсе' : 'О репетиторе') + '</h2>' +
      '<p>' + UI.esc(item.description || item.bio) + '</p>' +
      (isCourse
        ? '<div class="props-grid">' +
          prop('⏳ Длительность', item.duration) + prop('👥 Группа', item.groupSize) +
          prop('📶 Уровень', item.level) + prop('🗓 Расписание', item.schedule) +
          '</div>'
        : '<div class="props-grid">' +
          prop('🎓 Опыт', item.experience + ' лет') + prop('🏫 Образование', item.education) +
          prop('🗣 Языки', item.languages.join(', ')) + prop('⏱ Отвечает', item.responseTime) +
          '</div>') +
      ((item.features || item.achievements || []).length
        ? '<h3>' + (isCourse ? 'Что внутри' : 'Достижения') + '</h3><ul class="feature-list">' +
          (item.features || item.achievements).map(f => '<li>✔ ' + UI.esc(f) + '</li>').join('') + '</ul>'
        : '') +
      '</div>' +

      '<div class="card section-card"><h2>📈 Результаты студентов «до / после»</h2>' +
      UI.scoreStatsHtml(item) + '</div>' +

      '<div class="card section-card"><h2>📲 Прямые контакты</h2>' + UI.contactsHtml(item) + '</div>' +

      '<div class="card section-card ai-callout">' +
      '<h2>🤖 AI-ассистент на занятиях</h2>' +
      '<p>Подключите AI-ассистента Agrigator к занятиям ' + (isCourse ? 'этого курса' : 'с этим репетитором') + ': он будет слушать урок, отслеживать прогресс и присылать отчёт после каждого звонка.</p>' +
      '<a class="btn btn-primary" href="#/ai-call?with=' + type + ':' + id + '">Демо живого звонка с ИИ →</a>' +
      '</div>' +

      '<div class="card section-card"><h2>💬 Отзывы (' + reviews.length + ')</h2>' +
      (user
        ? '<form class="review-form" id="reviewForm">' +
          '<div class="form-label">Ваша оценка</div>' +
          '<div class="rate-pick" id="ratePick">' + [1, 2, 3, 4, 5].map(n => '<span class="rate-star" data-n="' + n + '">★</span>').join('') + '</div>' +
          '<textarea class="input" id="reviewText" rows="3" placeholder="Поделитесь опытом… Можно указать баллы до/после."></textarea>' +
          '<div class="price-row">' +
          '<input class="input" id="revBefore" placeholder="Балл до (необязательно)">' +
          '<input class="input" id="revAfter" placeholder="Балл после">' +
          '</div>' +
          '<button class="btn btn-primary" type="submit">Опубликовать отзыв</button>' +
          '</form>'
        : '<p class="muted"><a href="#/login">Войдите</a>, чтобы оставить отзыв.</p>') +
      '<div class="reviews-list">' +
      (reviews.length ? reviews.map(reviewHtml).join('') : '<p class="muted">Пока нет отзывов — будьте первым!</p>') +
      '</div></div>' +

      '</div>' +

      '<aside class="detail-side">' +
      '<div class="card side-card">' +
      '<div class="side-price">' + UI.fmtPrice(item.price) + '<span class="muted">/' + UI.esc(item.priceUnit) + '</span></div>' +
      (item.trial ? '<button class="btn btn-primary btn-block" id="btnTrial">🎓 ' + (item.trialFree ? 'Бесплатный пробный урок' : 'Записаться на пробный урок') + '</button>' : '') +
      '<button class="btn btn-accent btn-block" id="btnCall">📞 Запланировать звонок</button>' +
      (item.videoUrl ? '<button class="btn btn-ghost btn-block" id="btnVideo">🎬 Видео-презентация</button>' : '') +
      '<div class="side-actions">' +
      '<button class="icon-btn big ' + (Store.isFav(type, id) ? 'active' : '') + '" data-fav="' + type + ':' + id + '">' + (Store.isFav(type, id) ? '❤️' : '🤍') + ' Избранное</button>' +
      '<button class="icon-btn big ' + (Store.inCompare(type, id) ? 'active' : '') + '" data-cmp="' + type + ':' + id + '">⚖️ Сравнить</button>' +
      '</div>' +
      '<div class="muted small side-note">🛡️ Безопасная запись через Agrigator.' + (item.moneyBack ? ' Действует гарантия возврата средств.' : '') + '</div>' +
      '</div>' +
      (Store.isAdmin()
        ? '<div class="card side-card"><div class="filter-title">Админ</div>' +
          '<a class="btn btn-ghost btn-block" href="#/admin/' + (isCourse ? 'courses' : 'tutors') + '?edit=' + id + '">✏️ Редактировать</a></div>'
        : '') +
      '</aside>' +
      '</div></div>';

    const trial = $('#btnTrial');
    if (trial) trial.onclick = () => UI.openBooking(item, 'trial');
    $('#btnCall').onclick = () => UI.openBooking(item, 'call');
    const vid = $('#btnVideo');
    if (vid) vid.onclick = () => UI.openVideo(item);

    if (user) bindReviewForm(type, id);
  }

  function prop(label, value) {
    return '<div class="prop"><span class="muted">' + label + '</span><b>' + UI.esc(value) + '</b></div>';
  }

  function reviewHtml(r) {
    return '<div class="review">' +
      '<div class="review-head">' + UI.avatar(r.userName, null, 36, '#64748b') +
      '<div><b>' + UI.esc(r.userName) + '</b>' +
      (r.verified ? ' <span class="chip chip-verified small">✓ Проверенный студент</span>' : '') +
      '<div class="muted small">' + r.date + '</div></div>' +
      '<div class="review-stars">' + UI.stars(r.rating) + '</div></div>' +
      (r.beforeScore && r.afterScore ? '<div class="review-scores">Результат: <b>' + UI.esc(r.beforeScore) + '</b> → <b class="grad-text">' + UI.esc(r.afterScore) + '</b></div>' : '') +
      '<p>' + UI.esc(r.text) + '</p>' +
      (Store.isAdmin() ? '<button class="btn btn-danger small-btn" data-delreview="' + r.id + '">Удалить (админ)</button>' : '') +
      '</div>';
  }

  function bindReviewForm(type, id) {
    let picked = 5;
    const stars = document.querySelectorAll('.rate-star');
    function paint() { stars.forEach(s => s.classList.toggle('on', +s.dataset.n <= picked)); }
    paint();
    stars.forEach(s => s.onclick = () => { picked = +s.dataset.n; paint(); });
    $('#reviewForm').onsubmit = async e => {
      e.preventDefault();
      const text = $('#reviewText').value;
      if (text.trim().length < 5) { UI.toast('Напишите хотя бы пару слов', 'error'); return; }
      const res = await Store.addReview(type, id, picked, text, { before: $('#revBefore').value, after: $('#revAfter').value });
      if (res.error) { UI.toast(res.error, 'error'); return; }
      UI.toast('Отзыв опубликован', 'success');
      renderDetail(type, id);
    };
    document.querySelectorAll('[data-delreview]').forEach(b => b.onclick = async () => {
      await Store.removeReview(b.dataset.delreview);
      UI.toast('Отзыв удалён', 'success');
      renderDetail(type, id);
    });
  }

  // ---------------- СРАВНЕНИЕ ----------------
  Views.compare = function () {
    const items = Store.compareItems();
    if (!items.length) {
      app().innerHTML = '<div class="container section"><h1>Сравнение</h1><div class="empty-state">Добавьте карточки к сравнению кнопкой ⚖️ — максимум 3.<br><br><a class="btn btn-primary" href="#/catalog">В каталог</a></div></div>';
      return;
    }
    const pro = Store.isPro();
    function row(label, fn) {
      return '<tr><td class="cmp-label">' + label + '</td>' + items.map(x => '<td>' + fn(x) + '</td>').join('') + '</tr>';
    }
    app().innerHTML =
      '<div class="container section"><h1>⚖️ Сравнение (' + items.length + ')</h1>' +
      '<div class="card table-wrap"><table class="cmp-table">' +
      '<tr><td></td>' + items.map(x =>
        '<td class="cmp-head"><a href="#/' + x.type + '/' + x.id + '"><b>' + UI.esc(x.title || x.name) + '</b></a>' +
        '<div class="muted small">' + (x.type === 'course' ? UI.esc(x.provider) : 'Репетитор') + '</div>' +
        '<button class="btn btn-ghost small-btn" data-cmp="' + x.type + ':' + x.id + '">Убрать</button></td>').join('') + '</tr>' +
      row('Цена', x => '<b>' + UI.fmtPrice(x.price) + '</b>/' + x.priceUnit) +
      row('Рейтинг', x => UI.stars(x.rating) + ' ' + x.rating) +
      row('Экзамены', x => x.exams.join(', ')) +
      row('Формат', x => UI.FORMAT_LABEL[x.format] + ' · ' + UI.esc(x.city)) +
      row('Студентов', x => x.students) +
      row('Пробный урок', x => x.trial ? (x.trialFree ? '✅ Бесплатный' : '✅ Платный') : '—') +
      row('AI-verified', x => x.aiVerified ? '🤖 Да' : '—') +
      row('Результат «до → после»', x => {
        if (!x.scoreStats) return '—';
        if (!pro) return '<span class="locked-cell">🔒 <a href="#/pricing">Pro</a></span>';
        return '<b>' + x.scoreStats.before + ' → ' + x.scoreStats.after + '</b><div class="muted small">' + x.scoreStats.metric + ', ' + x.scoreStats.sampleSize + ' студ.</div>';
      }) +
      row('Достигают цели', x => {
        if (!x.scoreStats) return '—';
        return pro ? '<b>' + x.scoreStats.passRate + '%</b>' : '<span class="locked-cell">🔒 <a href="#/pricing">Pro</a></span>';
      }) +
      '</table></div>' +
      (!pro ? '<div class="card section-card cmp-upsell">🔒 Строки с реальными результатами доступны по подписке <a href="#/pricing"><b>Pro</b></a></div>' : '') +
      '</div>';

    // глобальный обработчик уберёт позицию из списка, после чего перерисуем таблицу
    document.querySelectorAll('[data-cmp]').forEach(b => {
      b.addEventListener('click', () => setTimeout(Views.compare, 50));
    });
  };
})();
