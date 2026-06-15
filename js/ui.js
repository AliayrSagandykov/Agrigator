// ============================================================
// UI — общие компоненты и хелперы
// ============================================================
window.UI = (function () {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtPrice(n) {
    return Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₸';
  }

  function stars(rating) {
    const full = Math.round(rating);
    let html = '<span class="stars" title="' + rating + ' из 5">';
    for (let i = 1; i <= 5; i++) html += '<span class="' + (i <= full ? 'star on' : 'star') + '">★</span>';
    return html + '</span>';
  }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
  }

  function avatar(name, photo, size, color) {
    const s = size || 48;
    const bg = color || 'var(--accent)';
    const img = photo
      ? '<img src="' + esc(photo) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.style.display=\'none\'">'
      : '';
    return '<span class="avatar" style="width:' + s + 'px;height:' + s + 'px;background:' + bg + ';font-size:' + Math.round(s / 2.6) + 'px">' +
      '<span class="avatar-initials">' + esc(initials(name)) + '</span>' + img + '</span>';
  }

  const FORMAT_LABEL = { online: 'Онлайн', offline: 'Оффлайн', hybrid: 'Гибрид' };

  function examChips(exams) {
    return exams.map(e => '<a class="chip chip-exam" href="#/catalog?exam=' + encodeURIComponent(e) + '">' + esc(e) + '</a>').join('');
  }

  // ---------- toast ----------
  function toast(msg, type) {
    const root = document.getElementById('toastRoot');
    const el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'info');
    el.innerHTML = (type === 'error' ? '⚠️ ' : type === 'success' ? '✅ ' : 'ℹ️ ') + esc(msg);
    root.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3500);
  }

  // ---------- modal ----------
  function modal(html, opts) {
    const root = document.getElementById('modalRoot');
    root.innerHTML =
      '<div class="modal-overlay" id="modalOverlay">' +
      '<div class="modal-box">' +
      '<button class="modal-close" id="modalClose">✕</button>' +
      html +
      '</div></div>';
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose').onclick = closeModal;
    document.getElementById('modalOverlay').addEventListener('click', e => {
      if (e.target.id === 'modalOverlay') closeModal();
    });
    if (opts && opts.onMount) opts.onMount();
  }

  function closeModal() {
    document.getElementById('modalRoot').innerHTML = '';
    document.body.style.overflow = '';
  }

  // ---------- premium lock ----------
  function premiumLock(title, fakeContent) {
    return '<div class="premium-lock">' +
      '<div class="premium-lock-blur">' + fakeContent + '</div>' +
      '<div class="premium-lock-overlay">' +
      '<div class="premium-lock-icon">🔒</div>' +
      '<div class="premium-lock-title">' + esc(title) + '</div>' +
      '<p class="muted">Реальная статистика результатов, контакты и AI-отчёты доступны по подписке Pro</p>' +
      '<a href="#/pricing" class="btn btn-primary">Открыть Pro</a>' +
      '</div></div>';
  }

  // ---------- score stats block ----------
  function scoreStatsHtml(item) {
    const s = item.scoreStats;
    if (!s) return '';
    const inner =
      '<div class="score-stats">' +
      '<div class="score-row"><span class="score-label">До курса</span>' +
      '<div class="score-bar"><div class="score-fill before" style="width:45%"></div></div>' +
      '<span class="score-val">' + esc(s.before) + '</span></div>' +
      '<div class="score-row"><span class="score-label">После</span>' +
      '<div class="score-bar"><div class="score-fill after" style="width:88%"></div></div>' +
      '<span class="score-val strong">' + esc(s.after) + '</span></div>' +
      '<div class="score-meta">' +
      '<span>📊 Метрика: <b>' + esc(s.metric) + '</b></span>' +
      '<span>👥 Выборка: <b>' + s.sampleSize + ' студентов</b></span>' +
      '<span>🎯 Достигли цели: <b>' + s.passRate + '%</b></span>' +
      '</div>' +
      (item.aiVerified ? '<div class="ai-verified-note">🤖 Данные подтверждены AI-верификацией по официальным score reports (до/после)</div>' : '') +
      '</div>';
    if (Store.isPro()) return inner;
    return premiumLock('Реальные результаты студентов', inner);
  }

  // ---------- contacts block ----------
  function contactsHtml(item) {
    const c = item.contacts;
    if (!c) return '';
    const inner =
      '<div class="contacts-grid">' +
      (c.instagram ? '<a class="contact-link" target="_blank" rel="noopener" href="https://instagram.com/' + esc(c.instagram) + '">📸 Instagram <b>@' + esc(c.instagram) + '</b></a>' : '') +
      (c.telegram ? '<a class="contact-link" target="_blank" rel="noopener" href="https://t.me/' + esc(c.telegram) + '">✈️ Telegram <b>@' + esc(c.telegram) + '</b></a>' : '') +
      (c.whatsapp ? '<a class="contact-link" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.whatsapp) + '">💬 WhatsApp <b>написать</b></a>' : '') +
      (c.phone ? '<a class="contact-link" href="tel:' + esc(c.phone.replace(/\s/g, '')) + '">📞 <b>' + esc(c.phone) + '</b></a>' : '') +
      (c.email ? '<a class="contact-link" href="mailto:' + esc(c.email) + '">📧 <b>' + esc(c.email) + '</b></a>' : '') +
      '</div>';
    if (Store.isPro()) return inner;
    return premiumLock('Прямые контакты', inner);
  }

  // ---------- cards ----------
  function cardActions(item) {
    const fav = Store.isFav(item.type, item.id);
    const cmp = Store.inCompare(item.type, item.id);
    return '<div class="card-actions">' +
      '<button class="icon-btn ' + (fav ? 'active' : '') + '" data-fav="' + item.type + ':' + item.id + '" title="В избранное">' + (fav ? '❤️' : '🤍') + '</button>' +
      '<button class="icon-btn ' + (cmp ? 'active' : '') + '" data-cmp="' + item.type + ':' + item.id + '" title="Сравнить">⚖️</button>' +
      '</div>';
  }

  function courseCard(c) {
    return '<article class="card item-card' + (c.sponsored ? ' sponsored' : '') + '">' +
      (c.sponsored ? '<div class="ad-ribbon">Реклама</div>' : '') +
      '<a class="card-cover ' + c.gradient + '" href="#/course/' + c.id + '"><span class="cover-emoji">' + c.emoji + '</span></a>' +
      '<div class="card-body">' +
      '<div class="card-top-row">' + examChips(c.exams) +
      (c.aiVerified ? '<span class="chip chip-verified" title="Результаты подтверждены ИИ">🤖 AI-verified</span>' : '') +
      '</div>' +
      '<a class="card-title" href="#/course/' + c.id + '">' + esc(c.title) + '</a>' +
      '<div class="card-provider">' + esc(c.provider) + ' · ' + esc(c.city) + ' · ' + FORMAT_LABEL[c.format] + '</div>' +
      '<div class="card-rating">' + stars(c.rating) + '<b>' + c.rating + '</b><span class="muted">· ' + Store.reviewsFor('course', c.id).length + ' отзывов · ' + c.students + ' студентов</span></div>' +
      '<div class="card-bottom">' +
      '<div class="card-price">' + fmtPrice(c.price) + '<span class="muted">/' + esc(c.priceUnit) + '</span></div>' +
      (c.trial ? '<span class="chip chip-trial">' + (c.trialFree ? 'Бесплатный пробный' : 'Пробный урок') + '</span>' : '') +
      '</div>' +
      cardActions(c) +
      '</div></article>';
  }

  function tutorCard(t) {
    return '<article class="card item-card tutor-card' + (t.sponsored ? ' sponsored' : '') + '">' +
      (t.sponsored ? '<div class="ad-ribbon">Реклама</div>' : '') +
      '<div class="card-body">' +
      '<div class="tutor-head">' +
      '<a href="#/tutor/' + t.id + '" class="tutor-photo-wrap">' + avatar(t.name, t.photo, 64) +
      (t.online ? '<span class="online-dot" title="Сейчас онлайн"></span>' : '') + '</a>' +
      '<div>' +
      '<a class="card-title" href="#/tutor/' + t.id + '">' + esc(t.name) + '</a>' +
      '<div class="card-provider">' + esc(t.subjects) + '</div>' +
      '<div class="card-rating">' + stars(t.rating) + '<b>' + t.rating + '</b><span class="muted">· ' + t.students + ' учеников</span></div>' +
      '</div></div>' +
      '<div class="card-top-row">' + examChips(t.exams) +
      (t.aiVerified ? '<span class="chip chip-verified">🤖 AI-verified</span>' : '') +
      t.ownScores.map(s => '<span class="chip chip-score">' + esc(s.exam) + ' ' + esc(s.score) + (s.verified ? ' ✓' : '') + '</span>').join('') +
      '</div>' +
      '<div class="tutor-meta muted">⏱ Отвечает ' + esc(t.responseTime) + ' · 🎓 Опыт ' + t.experience + ' лет</div>' +
      '<div class="card-bottom">' +
      '<div class="card-price">' + fmtPrice(t.price) + '<span class="muted">/' + esc(t.priceUnit) + '</span></div>' +
      (t.trial ? '<span class="chip chip-trial">' + (t.trialFree ? 'Бесплатный пробный' : 'Пробный урок') + '</span>' : '') +
      '</div>' +
      cardActions(t) +
      '</div></article>';
  }

  function itemCard(item) {
    return item.type === 'course' ? courseCard(item) : tutorCard(item);
  }

  // делегирование кликов по ❤️ и ⚖️ на всём документе
  document.addEventListener('click', async e => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const [type, id] = favBtn.dataset.fav.split(':');
      const res = await Store.toggleFav(type, id);
      if (res.error) { toast(res.error, 'error'); location.hash = '#/login'; return; }
      favBtn.innerHTML = res.added ? '❤️' : '🤍';
      favBtn.classList.toggle('active', res.added);
      toast(res.added ? 'Добавлено в избранное' : 'Убрано из избранного', 'success');
      App.renderHeader();
      return;
    }
    const cmpBtn = e.target.closest('[data-cmp]');
    if (cmpBtn) {
      const [type, id] = cmpBtn.dataset.cmp.split(':');
      const res = Store.toggleCompare(type, id);
      if (res.error) { toast(res.error, 'error'); return; }
      cmpBtn.classList.toggle('active', res.added);
      toast(res.added ? 'Добавлено к сравнению (' + res.count + '/3)' : 'Убрано из сравнения', 'success');
      App.renderHeader();
    }
  });

  // ---------- booking modal (планирование звонка) ----------
  function openBooking(item, kind) {
    const isTrial = kind === 'trial';
    const days = [];
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now.getTime() + i * 86400000);
      days.push(d);
    }
    const slots = ['10:00', '12:00', '15:00', '17:00', '19:00'];
    const dayBtns = days.map((d, i) =>
      '<button class="slot-btn day-btn' + (i === 0 ? ' selected' : '') + '" data-day="' + d.toISOString().slice(0, 10) + '">' +
      d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }) + '</button>').join('');
    const slotBtns = slots.map((s, i) =>
      '<button class="slot-btn time-btn' + (i === 1 ? ' selected' : '') + '" data-time="' + s + '">' + s + '</button>').join('');

    modal(
      '<h3>' + (isTrial ? '🎓 Запись на пробный урок' : '📞 Планирование звонка') + '</h3>' +
      '<p class="muted">' + esc(item.title || item.name) + (isTrial && item.trialFree ? ' · пробный урок бесплатный' : '') + '</p>' +
      '<div class="form-label">Выберите день</div>' +
      '<div class="slot-grid">' + dayBtns + '</div>' +
      '<div class="form-label">Время (GMT+5)</div>' +
      '<div class="slot-grid">' + slotBtns + '</div>' +
      '<div class="form-label">Комментарий (необязательно)</div>' +
      '<textarea id="bookNote" class="input" rows="2" placeholder="Например: хочу обсудить подготовку к IELTS на 7.0"></textarea>' +
      '<button class="btn btn-primary btn-block" id="bookConfirm">Подтвердить</button>' +
      '<p class="muted small">Ссылка организатора: <a href="' + esc(item.bookingUrl) + '" target="_blank" rel="noopener">' + esc(item.bookingUrl) + '</a></p>',
      {
        onMount() {
          document.querySelectorAll('.day-btn').forEach(b => b.onclick = () => {
            document.querySelectorAll('.day-btn').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
          });
          document.querySelectorAll('.time-btn').forEach(b => b.onclick = () => {
            document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
          });
          document.getElementById('bookConfirm').onclick = async () => {
            const day = document.querySelector('.day-btn.selected').dataset.day;
            const time = document.querySelector('.time-btn.selected').dataset.time;
            await Store.addBooking({
              kind: isTrial ? 'trial' : 'call',
              targetType: item.type, targetId: item.id,
              targetName: item.title || item.name,
              day, time,
              note: document.getElementById('bookNote').value
            });
            closeModal();
            toast((isTrial ? 'Пробный урок' : 'Звонок') + ' запланирован на ' + day + ' в ' + time, 'success');
            if (!Store.currentUser()) toast('Войдите в аккаунт, чтобы видеть свои записи в профиле', 'info');
          };
        }
      }
    );
  }

  // ---------- video modal ----------
  function openVideo(item) {
    if (!item.videoUrl) { toast('У этой карточки пока нет видео-презентации', 'info'); return; }
    modal(
      '<h3>🎬 Видео-презентация</h3>' +
      '<p class="muted">' + esc(item.title || item.name) + '</p>' +
      '<div class="video-frame"><iframe src="' + esc(item.videoUrl) + '" allowfullscreen allow="accelerometer; autoplay; encrypted-media"></iframe></div>'
    );
  }

  return {
    esc, fmtPrice, stars, avatar, initials, examChips,
    FORMAT_LABEL,
    toast, modal, closeModal,
    premiumLock, scoreStatsHtml, contactsHtml,
    courseCard, tutorCard, itemCard,
    openBooking, openVideo
  };
})();
