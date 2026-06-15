// ============================================================
// Админ-панель: дашборд, CRUD, парсер объявлений, модерация
// ============================================================
window.Views = window.Views || {};

(function () {
  const $ = sel => document.querySelector(sel);
  const app = () => document.getElementById('app');

  const TABS = [
    ['dashboard', '📊 Дашборд'],
    ['courses', '📚 Курсы'],
    ['tutors', '🧑‍🏫 Репетиторы'],
    ['reviews', '💬 Отзывы'],
    ['users', '👥 Пользователи'],
    ['parser', '🕷️ Парсер объявлений'],
    ['settings', '⚙️ Настройки']
  ];

  Views.admin = function (params) {
    if (!Store.isAdmin()) {
      app().innerHTML = '<div class="container section"><div class="empty-state">⛔ Доступ только для администраторов.<br><br><a class="btn btn-primary" href="#/login">Войти как админ</a></div></div>';
      return;
    }
    const tab = params.tab || 'dashboard';
    app().innerHTML =
      '<div class="container section">' +
      '<h1>👑 Админ-панель</h1>' +
      '<div class="admin-tabs">' +
      TABS.map(([id, label]) =>
        '<a class="admin-tab' + (tab === id ? ' active' : '') + '" href="#/admin/' + id + '">' + label + '</a>').join('') +
      '</div>' +
      '<div id="adminBody"></div>' +
      '</div>';
    const renderers = {
      dashboard: renderDashboard, courses: () => renderItems('course'),
      tutors: () => renderItems('tutor'), reviews: renderReviews,
      users: renderUsers, parser: renderParser, settings: renderSettings
    };
    (renderers[tab] || renderDashboard)();
    // открыть форму редактирования по ?edit=
    if (params.edit && (tab === 'courses' || tab === 'tutors')) {
      const type = tab === 'courses' ? 'course' : 'tutor';
      const item = Store.getItem(type, params.edit);
      if (item) openItemForm(type, item);
    }
  };

  // ---------------- ДАШБОРД ----------------
  function renderDashboard() {
    const courses = Store.courses(), tutors = Store.tutors();
    const reviews = Store.allReviews(), users = Store.users(), leads = Store.leads();
    const proUsers = users.filter(u => u.plan === 'pro').length;
    const sponsored = Store.allItems().filter(x => x.sponsored).length;
    const mrr = proUsers * 4990;

    $('#adminBody').innerHTML =
      '<div class="stat-grid">' +
      stat('📚 Курсов', courses.length) +
      stat('🧑‍🏫 Репетиторов', tutors.length) +
      stat('👥 Пользователей', users.length) +
      stat('⭐ Pro-подписок', proUsers) +
      stat('💰 MRR (демо)', mrr.toLocaleString('ru-RU') + ' ₸') +
      stat('💬 Отзывов', reviews.length) +
      stat('🕷️ Лидов из парсера', leads.filter(l => l.status === 'new').length + ' новых') +
      stat('📣 Рекламных слотов', sponsored) +
      '</div>' +
      '<div class="card section-card"><h2>Последние лиды парсера</h2>' +
      (leads.slice(0, 3).map(l =>
        '<div class="report-row"><div><b>' + UI.esc(l.parsed.title) + '</b>' +
        '<div class="muted small">' + UI.esc(l.source) + ' · ' + l.foundAt + ' · ' + UI.esc(l.status) + '</div></div>' +
        '<a class="btn btn-ghost small-btn" href="#/admin/parser">Открыть</a></div>').join('') || '<p class="muted">Пусто</p>') +
      '</div>';
  }

  function stat(label, value) {
    return '<div class="card stat-card"><div class="stat-value">' + value + '</div><div class="muted">' + label + '</div></div>';
  }

  // ---------------- CRUD КУРСОВ / РЕПЕТИТОРОВ ----------------
  function renderItems(type) {
    const items = type === 'course' ? Store.courses() : Store.tutors();
    $('#adminBody').innerHTML =
      '<div class="admin-bar">' +
      '<button class="btn btn-primary" id="addItem">＋ Добавить ' + (type === 'course' ? 'курс' : 'репетитора') + '</button>' +
      '</div>' +
      '<div class="card table-wrap"><table class="admin-table">' +
      '<tr><th>Название</th><th>Экзамены</th><th>Цена</th><th>Рейтинг</th><th>Реклама</th><th>AI-verified</th><th></th></tr>' +
      items.map(x =>
        '<tr>' +
        '<td><a href="#/' + type + '/' + x.id + '"><b>' + UI.esc(x.title || x.name) + '</b></a>' +
        (x.source === 'parser' ? ' <span class="chip chip-new small">из парсера</span>' : '') + '</td>' +
        '<td>' + x.exams.join(', ') + '</td>' +
        '<td>' + UI.fmtPrice(x.price) + '/' + x.priceUnit + '</td>' +
        '<td>★ ' + x.rating + '</td>' +
        '<td><button class="toggle' + (x.sponsored ? ' on' : '') + '" data-ad="' + x.id + '" title="Рекламный слот"><span></span></button></td>' +
        '<td><button class="toggle' + (x.aiVerified ? ' on' : '') + '" data-ver="' + x.id + '" title="AI-верификация результатов"><span></span></button></td>' +
        '<td class="row-actions">' +
        '<button class="btn btn-ghost small-btn" data-edit="' + x.id + '">✏️</button>' +
        '<button class="btn btn-danger small-btn" data-del="' + x.id + '">🗑</button>' +
        '</td></tr>').join('') +
      '</table></div>';

    $('#addItem').onclick = () => openItemForm(type, null);
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openItemForm(type, Store.getItem(type, b.dataset.edit)));
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const item = Store.getItem(type, b.dataset.del);
      if (confirm('Удалить «' + (item.title || item.name) + '» вместе с отзывами?')) {
        await Store.removeItem(type, b.dataset.del);
        UI.toast('Удалено', 'success');
        renderItems(type);
      }
    });
    document.querySelectorAll('[data-ad]').forEach(b => b.onclick = async () => {
      const item = Store.getItem(type, b.dataset.ad);
      item.sponsored = !item.sponsored;
      await Store.upsertItem(item);
      UI.toast(item.sponsored ? '📣 Рекламный слот включён' : 'Реклама отключена', 'success');
      renderItems(type);
    });
    document.querySelectorAll('[data-ver]').forEach(b => b.onclick = async () => {
      const item = Store.getItem(type, b.dataset.ver);
      item.aiVerified = !item.aiVerified;
      await Store.upsertItem(item);
      UI.toast(item.aiVerified ? '🤖 Бейдж AI-verified выдан' : 'Бейдж снят', 'success');
      renderItems(type);
    });
  }

  function openItemForm(type, item, prefill) {
    const isNew = !item;
    const isCourse = type === 'course';
    const x = item || Object.assign(isCourse
      ? {
        id: Store.uid('c'), type: 'course', title: '', provider: '', exams: ['IELTS'], price: 50000,
        priceUnit: 'мес', format: 'online', city: 'Онлайн', duration: '2 месяца', groupSize: 'до 10 человек',
        level: '', rating: 4.5, students: 0, sponsored: false, aiVerified: false, emoji: '📘', gradient: 'g3',
        description: '', features: [], schedule: '', scoreStats: null, trial: true, trialFree: true,
        videoUrl: '', bookingUrl: '', contacts: {}, source: 'manual', moneyBack: false
      }
      : {
        id: Store.uid('t'), type: 'tutor', name: '', exams: ['IELTS'], subjects: '', price: 10000,
        priceUnit: 'час', format: 'online', city: 'Онлайн', experience: 1, rating: 4.5, students: 0,
        sponsored: false, aiVerified: false, photo: '', gradient: 'g2', online: true, responseTime: '~1 час',
        ownScores: [], education: '', languages: ['Русский'], bio: '', achievements: [],
        scoreStats: null, trial: true, trialFree: true, videoUrl: '', bookingUrl: '', contacts: {}, source: 'manual'
      }, prefill || {});

    const c = x.contacts || {};
    UI.modal(
      '<h3>' + (isNew ? '＋ Новый ' : '✏️ Редактировать ') + (isCourse ? 'курс' : 'репетитора') + '</h3>' +
      '<div class="form-label">' + (isCourse ? 'Название' : 'Имя') + '</div>' +
      '<input class="input" id="iTitle" value="' + UI.esc(x.title || x.name || '') + '">' +
      (isCourse
        ? '<div class="form-label">Школа / провайдер</div><input class="input" id="iProvider" value="' + UI.esc(x.provider) + '">'
        : '<div class="form-label">Предметы</div><input class="input" id="iProvider" value="' + UI.esc(x.subjects) + '">') +
      '<div class="form-label">Экзамены (через запятую: ' + SEED.exams.join(', ') + ')</div>' +
      '<input class="input" id="iExams" value="' + UI.esc(x.exams.join(', ')) + '">' +
      '<div class="price-row">' +
      '<div><div class="form-label">Цена, ₸</div><input class="input" id="iPrice" type="number" value="' + x.price + '"></div>' +
      '<div><div class="form-label">За</div><select class="input" id="iPriceUnit">' +
      ['мес', 'час', 'курс'].map(v => '<option' + (x.priceUnit === v ? ' selected' : '') + '>' + v + '</option>').join('') +
      '</select></div></div>' +
      '<div class="price-row">' +
      '<div><div class="form-label">Формат</div><select class="input" id="iFormat">' +
      ['online', 'offline', 'hybrid'].map(v => '<option value="' + v + '"' + (x.format === v ? ' selected' : '') + '>' + UI.FORMAT_LABEL[v] + '</option>').join('') +
      '</select></div>' +
      '<div><div class="form-label">Город</div><select class="input" id="iCity">' +
      SEED.cities.map(v => '<option' + (x.city === v ? ' selected' : '') + '>' + v + '</option>').join('') +
      '</select></div></div>' +
      '<div class="form-label">Описание</div>' +
      '<textarea class="input" id="iDesc" rows="3">' + UI.esc(x.description || x.bio || '') + '</textarea>' +
      '<div class="form-label">Ссылка для планирования звонка (Calendly и т.п.)</div>' +
      '<input class="input" id="iBooking" value="' + UI.esc(x.bookingUrl || '') + '">' +
      '<div class="form-label">Видео-презентация (embed-ссылка YouTube)</div>' +
      '<input class="input" id="iVideo" value="' + UI.esc(x.videoUrl || '') + '">' +
      '<div class="price-row">' +
      '<div><div class="form-label">Instagram</div><input class="input" id="iInsta" value="' + UI.esc(c.instagram || '') + '"></div>' +
      '<div><div class="form-label">Telegram</div><input class="input" id="iTg" value="' + UI.esc(c.telegram || '') + '"></div>' +
      '</div>' +
      '<div class="price-row">' +
      '<div><div class="form-label">WhatsApp (только цифры)</div><input class="input" id="iWa" value="' + UI.esc(c.whatsapp || '') + '"></div>' +
      '<div><div class="form-label">Телефон</div><input class="input" id="iPhone" value="' + UI.esc(c.phone || '') + '"></div>' +
      '</div>' +
      '<label class="check"><input type="checkbox" id="iTrial"' + (x.trial ? ' checked' : '') + '> Есть пробный урок</label>' +
      '<label class="check"><input type="checkbox" id="iTrialFree"' + (x.trialFree ? ' checked' : '') + '> Пробный бесплатный</label>' +
      '<label class="check"><input type="checkbox" id="iSponsored"' + (x.sponsored ? ' checked' : '') + '> 📣 Рекламный слот</label>' +
      '<label class="check"><input type="checkbox" id="iVerified"' + (x.aiVerified ? ' checked' : '') + '> 🤖 AI-verified</label>' +
      '<button class="btn btn-primary btn-block" id="iSave">Сохранить</button>',
      {
        onMount() {
          document.getElementById('iSave').onclick = async () => {
            const get = id => document.getElementById(id).value.trim();
            const title = get('iTitle');
            if (!title) { UI.toast('Укажите название', 'error'); return; }
            if (isCourse) { x.title = title; x.provider = get('iProvider'); x.description = get('iDesc'); }
            else { x.name = title; x.subjects = get('iProvider'); x.bio = get('iDesc'); }
            x.exams = get('iExams').split(',').map(s => s.trim()).filter(Boolean);
            x.price = +get('iPrice') || 0;
            x.priceUnit = document.getElementById('iPriceUnit').value;
            x.format = document.getElementById('iFormat').value;
            x.city = document.getElementById('iCity').value;
            x.bookingUrl = get('iBooking');
            x.videoUrl = get('iVideo');
            x.contacts = Object.assign({}, x.contacts, {
              instagram: get('iInsta'), telegram: get('iTg'), whatsapp: get('iWa'), phone: get('iPhone')
            });
            x.trial = document.getElementById('iTrial').checked;
            x.trialFree = document.getElementById('iTrialFree').checked;
            x.sponsored = document.getElementById('iSponsored').checked;
            x.aiVerified = document.getElementById('iVerified').checked;
            const saved = await Store.upsertItem(x);
            if (saved && saved.error) return;
            UI.closeModal();
            UI.toast(isNew ? 'Добавлено в каталог' : 'Сохранено', 'success');
            renderItems(type);
          };
        }
      }
    );
  }

  // ---------------- ОТЗЫВЫ ----------------
  function renderReviews() {
    const reviews = Store.allReviews();
    $('#adminBody').innerHTML =
      '<div class="card table-wrap"><table class="admin-table">' +
      '<tr><th>Дата</th><th>Автор</th><th>Объект</th><th>★</th><th>Текст</th><th></th></tr>' +
      reviews.map(r => {
        const target = Store.getItem(r.targetType, r.targetId);
        return '<tr><td class="muted">' + r.date + '</td>' +
          '<td><b>' + UI.esc(r.userName) + '</b>' + (r.verified ? ' ✓' : '') + '</td>' +
          '<td>' + (target ? '<a href="#/' + r.targetType + '/' + r.targetId + '">' + UI.esc(target.title || target.name) + '</a>' : '—') + '</td>' +
          '<td>' + r.rating + '</td>' +
          '<td class="review-cell">' + UI.esc(r.text) + '</td>' +
          '<td><button class="btn btn-danger small-btn" data-delrev="' + r.id + '">🗑</button></td></tr>';
      }).join('') +
      '</table></div>';
    document.querySelectorAll('[data-delrev]').forEach(b => b.onclick = async () => {
      await Store.removeReview(b.dataset.delrev);
      UI.toast('Отзыв удалён', 'success');
      renderReviews();
    });
  }

  // ---------------- ПОЛЬЗОВАТЕЛИ ----------------
  function renderUsers() {
    const me = Store.currentUser();
    $('#adminBody').innerHTML =
      '<div class="card table-wrap"><table class="admin-table">' +
      '<tr><th>Имя</th><th>Email</th><th>Роль</th><th>План</th><th></th></tr>' +
      Store.users().map(u =>
        '<tr><td><b>' + UI.esc(u.name) + '</b>' + (u.id === me.id ? ' <span class="muted">(вы)</span>' : '') + '</td>' +
        '<td>' + UI.esc(u.email) + '</td>' +
        '<td><select class="input slim" data-role="' + u.id + '"' + (u.id === me.id ? ' disabled' : '') + '>' +
        '<option value="user"' + (u.role === 'user' ? ' selected' : '') + '>user</option>' +
        '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>admin</option></select></td>' +
        '<td><select class="input slim" data-plan="' + u.id + '">' +
        '<option value="free"' + (u.plan === 'free' ? ' selected' : '') + '>free</option>' +
        '<option value="pro"' + (u.plan === 'pro' ? ' selected' : '') + '>pro</option></select></td>' +
        '<td>' + (u.id !== me.id ? '<button class="btn btn-danger small-btn" data-deluser="' + u.id + '">🗑</button>' : '') + '</td></tr>').join('') +
      '</table></div>';

    document.querySelectorAll('[data-role]').forEach(s => s.onchange = async () => {
      await Store.updateUser(s.dataset.role, { role: s.value });
      UI.toast('Роль обновлена', 'success');
    });
    document.querySelectorAll('[data-plan]').forEach(s => s.onchange = async () => {
      await Store.updateUser(s.dataset.plan, {
        plan: s.value,
        planUntil: s.value === 'pro' ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : null
      });
      UI.toast('План обновлён', 'success');
    });
    document.querySelectorAll('[data-deluser]').forEach(b => b.onclick = async () => {
      if (confirm('Удалить пользователя?')) {
        await Store.removeUser(b.dataset.deluser);
        UI.toast('Пользователь удалён', 'success');
        renderUsers();
      }
    });
  }

  // ---------------- ПАРСЕР ОБЪЯВЛЕНИЙ ----------------
  function renderParser() {
    const leads = Store.leads();
    $('#adminBody').innerHTML =
      '<div class="parser-grid">' +
      '<div class="card section-card">' +
      '<h2>🕷️ Импорт объявления</h2>' +
      '<p class="muted">Вставьте ссылку или текст объявления из Instagram / OLX / Telegram — ИИ распарсит его в карточку каталога. Так в начале рос Facebook: вручную и парсером собирал первых пользователей.</p>' +
      '<div class="form-label">Ссылка на объявление</div>' +
      '<input class="input" id="pUrl" placeholder="https://instagram.com/p/…">' +
      '<div class="form-label">Или текст объявления</div>' +
      '<textarea class="input" id="pText" rows="4" placeholder="🔥 Набор в группу IELTS! Преподаватель Band 8.5, 50 000 тг/мес, пробный бесплатно. Директ: @ielts_pro"></textarea>' +
      '<button class="btn btn-primary btn-block" id="pRun">🤖 Распарсить</button>' +
      '<div id="pPipeline"></div>' +
      '</div>' +

      '<div class="card section-card">' +
      '<div class="section-head"><h2>Найденные лиды (' + leads.length + ')</h2>' +
      '<button class="btn btn-accent" id="pAuto">🔄 Автопоиск объявлений</button></div>' +
      '<div id="leadsList">' + leads.map(leadHtml).join('') + '</div>' +
      '</div>' +
      '</div>';

    $('#pRun').onclick = runParser;
    $('#pAuto').onclick = autoSearch;
    bindLeadButtons();
  }

  function leadHtml(l) {
    return '<div class="lead-card" data-lead="' + l.id + '">' +
      '<div class="lead-head"><span class="chip">' + UI.esc(l.source) + '</span>' +
      '<span class="muted small">' + l.foundAt + '</span>' +
      '<span class="chip ' + (l.status === 'imported' ? 'chip-verified' : l.status === 'rejected' ? 'chip-ad' : 'chip-new') + ' small">' +
      (l.status === 'imported' ? '✓ импортирован' : l.status === 'rejected' ? 'отклонён' : 'новый') + '</span></div>' +
      '<p class="lead-text">' + UI.esc(l.rawText) + '</p>' +
      '<div class="lead-parsed muted small">🤖 Распознано: <b>' + UI.esc(l.parsed.title) + '</b> · ' + UI.esc(l.parsed.exam) + ' · ' + UI.fmtPrice(l.parsed.price) + '</div>' +
      (l.status === 'new'
        ? '<div class="lead-actions">' +
          '<button class="btn btn-primary small-btn" data-import="' + l.id + '">＋ Импортировать в каталог</button>' +
          '<button class="btn btn-ghost small-btn" data-reject="' + l.id + '">Отклонить</button></div>'
        : '') +
      '</div>';
  }

  function bindLeadButtons() {
    document.querySelectorAll('[data-import]').forEach(b => b.onclick = async () => {
      const lead = Store.leads().find(l => l.id === b.dataset.import);
      if (!lead) return;
      openItemForm('course', null, {
        title: lead.parsed.title,
        provider: lead.parsed.instagram ? '@' + lead.parsed.instagram : lead.source,
        exams: [lead.parsed.exam],
        price: lead.parsed.price,
        format: lead.parsed.format || 'online',
        description: lead.rawText,
        source: 'parser',
        contacts: {
          instagram: lead.parsed.instagram || '',
          telegram: lead.parsed.telegram || '',
          phone: lead.parsed.phone || ''
        }
      });
      await Store.updateLead(lead.id, { status: 'imported' });
    });
    document.querySelectorAll('[data-reject]').forEach(b => b.onclick = async () => {
      await Store.updateLead(b.dataset.reject, { status: 'rejected' });
      UI.toast('Лид отклонён', 'info');
      renderParser();
    });
  }

  function runParser() {
    const url = $('#pUrl').value.trim();
    const text = $('#pText').value.trim();
    if (!url && !text) { UI.toast('Вставьте ссылку или текст объявления', 'error'); return; }
    const pipe = $('#pPipeline');
    const steps = ['🌐 Получение объявления…', '🤖 ИИ извлекает данные (экзамен, цена, контакты)…', '🧹 Очистка и нормализация…'];
    pipe.innerHTML = '';
    $('#pRun').disabled = true;
    let i = 0;
    const t = setInterval(async () => {
      if (!document.contains(pipe)) { clearInterval(t); return; }
      if (i > 0) pipe.children[i - 1].innerHTML += ' <b class="ok-text">✓</b>';
      if (i >= steps.length) {
        clearInterval(t);
        $('#pRun').disabled = false;
        const parsed = parseAdText(text || url);
        await Store.addLead({
          source: url.includes('instagram') ? 'Instagram' : url.includes('olx') ? 'OLX' : url.includes('t.me') ? 'Telegram' : 'Вручную',
          url: url || '',
          rawText: text || ('Объявление по ссылке: ' + url),
          parsed
        });
        UI.toast('Объявление распарсено → лид создан', 'success');
        renderParser();
        return;
      }
      pipe.insertAdjacentHTML('beforeend', '<div class="pipe-step">' + steps[i] + '</div>');
      i++;
    }, 800);
  }

  // наивный «ИИ»-парсер текста объявления: экзамен, цена, контакты
  function parseAdText(text) {
    const lower = text.toLowerCase();
    const exam = SEED.exams.find(e => lower.includes(e.toLowerCase())) || 'IELTS';
    const priceMatch = text.replace(/\s/g, '').match(/(\d{4,6})(?=тг|₸|тенге|\/мес|вмесяц)/i) || text.match(/(\d{2,3})\s?000/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/\D/g, ''), 10) : 50000;
    const insta = (text.match(/@([a-z0-9_.]{3,30})/i) || [])[1] || '';
    const phone = (text.match(/\+?7[\s\d\-()]{9,15}/) || [])[0] || '';
    return {
      title: exam + ' — из объявления',
      exam,
      price: price < 1000 ? price * 1000 : price,
      format: lower.includes('оффлайн') || lower.includes('очно') ? 'offline' : 'online',
      instagram: insta, phone
    };
  }

  const AUTO_LEADS = [
    { source: 'Instagram', rawText: '⚡ SAT за 3 месяца на 1450+! Группа 4 человека, препод с 1560. 95 000 тг/мес. Старт 15-го. Директ: @sat_boost_kz', parsed: { title: 'SAT 1450+ за 3 месяца', exam: 'SAT', price: 95000, format: 'online', instagram: 'sat_boost_kz' } },
    { source: 'Telegram', rawText: 'Репетитор IB Chemistry HL. Выпускница UCL, оценка 7. Помогаю с IA и EE. 12000 тг/час. @ib_chem_pro', parsed: { title: 'Репетитор IB Chemistry HL (UCL)', exam: 'IB', price: 12000, format: 'online', telegram: 'ib_chem_pro' } },
    { source: 'OLX', rawText: 'Подготовка к ЕНТ по истории Казахстана. 110+ гарантия. Оффлайн Астана. 30 000 в месяц. Тел +7 701 222 33 44', parsed: { title: 'ЕНТ история Казахстана', exam: 'ЕНТ', price: 30000, format: 'offline', phone: '+7 701 222 33 44' } },
    { source: 'Instagram', rawText: '🇬🇧 A-Level Economics с экзаменатором CIE. Онлайн, мини-группы. 80 000 тг/мес. Пробный бесплатно! @alevel_econ', parsed: { title: 'A-Level Economics (экзаменатор CIE)', exam: 'A-Level', price: 80000, format: 'online', instagram: 'alevel_econ' } }
  ];

  function autoSearch() {
    const btn = $('#pAuto');
    btn.disabled = true;
    btn.textContent = '🔄 Сканирую Instagram, OLX, Telegram…';
    setTimeout(async () => {
      const pick = AUTO_LEADS[Math.floor(Math.random() * AUTO_LEADS.length)];
      await Store.addLead(JSON.parse(JSON.stringify(pick)));
      UI.toast('Найдено новое объявление (' + pick.source + ')', 'success');
      renderParser();
    }, 1500);
  }

  // ---------------- НАСТРОЙКИ ----------------
  function renderSettings() {
    $('#adminBody').innerHTML =
      '<div class="card section-card"><h2>⚙️ Данные платформы</h2>' +
      '<p class="muted">Все данные хранятся в SQL-базе на сервере (SQLite, файл agrigator.db).</p>' +
      '<div class="settings-actions">' +
      '<button class="btn btn-ghost" id="sExport">⬇️ Экспорт базы (JSON)</button>' +
      '<button class="btn btn-danger" id="sReset">♻️ Сбросить к демо-данным</button>' +
      '</div></div>';

    $('#sExport').onclick = async () => {
      const json = await Store.exportDb();
      if (!json) return;
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'agrigator-db.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $('#sReset').onclick = async () => {
      if (confirm('Сбросить все данные к исходным демо-данным? Ваши изменения и аккаунты пропадут.')) {
        await Store.resetDb();
        UI.toast('База сброшена к демо-данным', 'success');
        location.hash = '#/';
        location.reload();
      }
    };
  }
})();
