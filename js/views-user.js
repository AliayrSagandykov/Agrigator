// ============================================================
// Аккаунты: вход, регистрация, профиль, тарифы, избранное
// ============================================================
window.Views = window.Views || {};

(function () {
  const $ = sel => document.querySelector(sel);
  const app = () => document.getElementById('app');

  // ---------------- ВХОД ----------------
  Views.login = function () {
    app().innerHTML =
      '<div class="container section auth-wrap">' +
      '<div class="card auth-card">' +
      '<h1>Вход</h1>' +
      '<form id="loginForm">' +
      '<div class="form-label">Email</div>' +
      '<input class="input" id="loginEmail" type="email" placeholder="you@example.com" required>' +
      '<div class="form-label">Пароль</div>' +
      '<input class="input" id="loginPass" type="password" placeholder="••••••" required>' +
      '<button class="btn btn-primary btn-block" type="submit">Войти</button>' +
      '</form>' +
      '<p class="muted">Нет аккаунта? <a href="#/register">Зарегистрироваться</a></p>' +
      '<div class="demo-creds">' +
      '<div class="filter-title">Демо-доступы</div>' +
      '<div class="cred-row" data-cred="admin@agrigator.kz:admin123">👑 Админ: <b>admin@agrigator.kz</b> / admin123</div>' +
      '<div class="cred-row" data-cred="user@demo.kz:demo123">👤 Юзер (free): <b>user@demo.kz</b> / demo123</div>' +
      '<div class="cred-row" data-cred="pro@demo.kz:demo123">⭐ Юзер (Pro): <b>pro@demo.kz</b> / demo123</div>' +
      '<p class="muted small">Нажмите на строку, чтобы подставить данные</p>' +
      '</div>' +
      '</div></div>';

    document.querySelectorAll('.cred-row').forEach(r => r.onclick = () => {
      const [email, pass] = r.dataset.cred.split(':');
      $('#loginEmail').value = email;
      $('#loginPass').value = pass;
    });

    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      const res = await Store.login($('#loginEmail').value, $('#loginPass').value);
      if (res.error) { UI.toast(res.error, 'error'); return; }
      UI.toast('С возвращением, ' + res.user.name + '!', 'success');
      App.renderHeader();
      location.hash = res.user.role === 'admin' ? '#/admin' : '#/profile';
    };
  };

  // ---------------- РЕГИСТРАЦИЯ ----------------
  Views.register = function () {
    app().innerHTML =
      '<div class="container section auth-wrap">' +
      '<div class="card auth-card">' +
      '<h1>Регистрация</h1>' +
      '<form id="regForm">' +
      '<div class="form-label">Имя</div>' +
      '<input class="input" id="regName" placeholder="Как к вам обращаться" required>' +
      '<div class="form-label">Email</div>' +
      '<input class="input" id="regEmail" type="email" placeholder="you@example.com" required>' +
      '<div class="form-label">Пароль (мин. 6 символов)</div>' +
      '<input class="input" id="regPass" type="password" placeholder="••••••" required>' +
      '<button class="btn btn-primary btn-block" type="submit">Создать аккаунт</button>' +
      '</form>' +
      '<p class="muted">Уже есть аккаунт? <a href="#/login">Войти</a></p>' +
      '</div></div>';

    $('#regForm').onsubmit = async e => {
      e.preventDefault();
      const res = await Store.register($('#regName').value, $('#regEmail').value, $('#regPass').value);
      if (res.error) { UI.toast(res.error, 'error'); return; }
      UI.toast('Аккаунт создан! Добро пожаловать 🎉', 'success');
      App.renderHeader();
      location.hash = '#/profile';
    };
  };

  // ---------------- ПРОФИЛЬ ----------------
  Views.profile = function () {
    const u = Store.currentUser();
    if (!u) { location.hash = '#/login'; return; }
    const favs = u.favorites
      .map(k => { const [type, id] = k.split(':'); return Store.getItem(type, id); })
      .filter(Boolean);

    app().innerHTML =
      '<div class="container section">' +
      '<div class="profile-head card">' +
      UI.avatar(u.name, null, 84, u.avatarColor) +
      '<div class="profile-info">' +
      '<h1>' + UI.esc(u.name) + '</h1>' +
      '<div class="muted">' + UI.esc(u.email) + ' · с нами с ' + u.createdAt + '</div>' +
      '<div class="card-top-row">' +
      (u.role === 'admin' ? '<span class="chip chip-admin">👑 Администратор</span>' : '<span class="chip">👤 Пользователь</span>') +
      (Store.isPro()
        ? '<span class="chip chip-pro">⭐ Pro' + (u.planUntil ? ' до ' + u.planUntil : '') + '</span>'
        : '<a class="chip chip-upsell" href="#/pricing">🔒 Free — открыть Pro</a>') +
      u.verifiedExams.map(v => '<span class="chip chip-score">🛡️ ' + UI.esc(v.exam) + ' ' + UI.esc(v.score) + ' ✓</span>').join('') +
      '</div></div>' +
      '<div class="profile-actions">' +
      (u.role === 'admin' ? '<a class="btn btn-accent" href="#/admin">Админ-панель</a>' : '') +
      '<button class="btn btn-ghost" id="editProfile">✏️ Редактировать</button>' +
      '<button class="btn btn-ghost" id="logoutBtn">Выйти</button>' +
      '</div></div>' +

      '<div class="profile-grid">' +

      '<div class="card section-card"><h2>📅 Мои записи</h2>' +
      (u.bookings.length
        ? '<div class="bookings-list">' + u.bookings.slice().reverse().map(b =>
          '<div class="booking-row">' +
          '<span>' + (b.kind === 'trial' ? '🎓 Пробный урок' : '📞 Звонок') + '</span>' +
          '<a href="#/' + b.targetType + '/' + b.targetId + '"><b>' + UI.esc(b.targetName) + '</b></a>' +
          '<span class="muted">' + b.day + ' в ' + b.time + '</span>' +
          '</div>').join('') + '</div>'
        : '<p class="muted">Пока нет записей. Найдите курс и нажмите «Запланировать звонок».</p>') +
      '</div>' +

      '<div class="card section-card"><h2>🤖 Мои AI-отчёты с занятий</h2>' +
      (u.reports.length
        ? u.reports.map(r =>
          '<div class="report-row">' +
          '<div><b>' + UI.esc(r.title) + '</b><div class="muted small">' + r.date + '</div></div>' +
          '<span class="chip chip-score">' + UI.esc(r.headline) + '</span>' +
          '</div>').join('')
        : '<p class="muted">Отчётов пока нет. <a href="#/ai-call">Попробуйте демо AI-ассистента</a> — отчёт сохранится сюда.</p>') +
      '</div>' +

      '<div class="card section-card"><h2>🛡️ Подтверждённые экзамены</h2>' +
      (u.verifiedExams.length
        ? u.verifiedExams.map(v =>
          '<div class="report-row"><div><b>' + UI.esc(v.exam) + ': ' + UI.esc(v.score) + '</b><div class="muted small">' + v.date + '</div></div><span class="chip chip-verified">✓ AI-verified</span></div>').join('')
        : '<p class="muted">Подтвердите свой результат через <a href="#/verify">AI-верификацию</a> — бейдж появится в профиле и отзывах.</p>') +
      '</div>' +

      '</div>' +

      '<div class="section">' +
      '<div class="section-head"><h2>❤️ Избранное (' + favs.length + ')</h2></div>' +
      (favs.length
        ? '<div class="cards-grid">' + favs.map(UI.itemCard).join('') + '</div>'
        : '<div class="empty-state">Добавляйте курсы и репетиторов в избранное кнопкой 🤍</div>') +
      '</div>' +
      '</div>';

    $('#logoutBtn').onclick = () => {
      Store.logout();
      App.renderHeader();
      UI.toast('Вы вышли из аккаунта', 'info');
      location.hash = '#/';
    };
    $('#editProfile').onclick = () => {
      UI.modal(
        '<h3>✏️ Редактировать профиль</h3>' +
        '<div class="form-label">Имя</div>' +
        '<input class="input" id="pfName" value="' + UI.esc(u.name) + '">' +
        '<div class="form-label">Новый пароль (пусто — не менять)</div>' +
        '<input class="input" id="pfPass" type="password" placeholder="••••••">' +
        '<button class="btn btn-primary btn-block" id="pfSave">Сохранить</button>',
        {
          onMount() {
            document.getElementById('pfSave').onclick = async () => {
              const patch = { name: document.getElementById('pfName').value.trim() || u.name };
              const pass = document.getElementById('pfPass').value;
              if (pass) {
                if (pass.length < 6) { UI.toast('Пароль — минимум 6 символов', 'error'); return; }
                patch.password = pass;
              }
              await Store.updateUser(u.id, patch);
              UI.closeModal();
              UI.toast('Профиль обновлён', 'success');
              App.renderHeader();
              Views.profile();
            };
          }
        }
      );
    };
  };

  // ---------------- ИЗБРАННОЕ ----------------
  Views.favorites = function () {
    const u = Store.currentUser();
    if (!u) { location.hash = '#/login'; return; }
    const favs = u.favorites
      .map(k => { const [type, id] = k.split(':'); return Store.getItem(type, id); })
      .filter(Boolean);
    app().innerHTML =
      '<div class="container section"><h1>❤️ Избранное</h1>' +
      (favs.length
        ? '<div class="cards-grid">' + favs.map(UI.itemCard).join('') + '</div>'
        : '<div class="empty-state">Пусто. Добавляйте карточки кнопкой 🤍<br><br><a class="btn btn-primary" href="#/catalog">В каталог</a></div>') +
      '</div>';
  };

  // ---------------- ТАРИФЫ ----------------
  Views.pricing = function () {
    const u = Store.currentUser();
    const pro = Store.isPro();
    app().innerHTML =
      '<div class="container section">' +
      '<h1 class="center">Тарифы</h1>' +
      '<p class="muted center">Критические данные — реальные результаты «до/после», прямые контакты и AI-отчёты — доступны по подписке</p>' +
      '<div class="pricing-grid">' +

      '<div class="card plan-card">' +
      '<h3>Free</h3><div class="plan-price">0 ₸</div>' +
      '<ul class="feature-list">' +
      '<li>✔ Поиск и фильтры по каталогу</li>' +
      '<li>✔ Отзывы и рейтинги</li>' +
      '<li>✔ Запись на пробные уроки</li>' +
      '<li>✔ AI-подбор программы</li>' +
      '<li class="off">✖ Результаты «до/после»</li>' +
      '<li class="off">✖ Прямые контакты репетиторов</li>' +
      '<li class="off">✖ AI-отчёты со звонков</li>' +
      '</ul>' +
      '<button class="btn btn-ghost btn-block" disabled>' + (!pro && u ? 'Ваш текущий план' : 'Базовый план') + '</button>' +
      '</div>' +

      '<div class="card plan-card featured">' +
      '<div class="plan-badge">Популярный</div>' +
      '<h3>Pro</h3><div class="plan-price">4 990 ₸<span class="muted">/мес</span></div>' +
      '<ul class="feature-list">' +
      '<li>✔ Всё из Free</li>' +
      '<li>✔ 📈 Реальная статистика «до/после» с выборками</li>' +
      '<li>✔ 📲 Прямые контакты (Instagram, Telegram, WhatsApp, телефон)</li>' +
      '<li>✔ 🤖 Безлимитные AI-отчёты с занятий</li>' +
      '<li>✔ 🛡️ AI-верификация ваших результатов</li>' +
      '<li>✔ ⚖️ Полное сравнение программ</li>' +
      '</ul>' +
      (pro
        ? '<button class="btn btn-primary btn-block" disabled>⭐ У вас уже Pro</button>'
        : '<button class="btn btn-primary btn-block" id="buyPro">Оформить Pro</button>') +
      '</div>' +

      '<div class="card plan-card">' +
      '<h3>Team / Школы</h3><div class="plan-price">от 49 000 ₸<span class="muted">/мес</span></div>' +
      '<ul class="feature-list">' +
      '<li>✔ Всё из Pro для 10+ аккаунтов</li>' +
      '<li>✔ Размещение курсов в каталоге</li>' +
      '<li>✔ Рекламные слоты на главной</li>' +
      '<li>✔ API парсера лидов</li>' +
      '<li>✔ Персональный менеджер</li>' +
      '</ul>' +
      '<button class="btn btn-ghost btn-block" id="teamContact">Связаться с нами</button>' +
      '</div>' +
      '</div></div>';

    const buy = $('#buyPro');
    if (buy) buy.onclick = () => {
      if (!u) { UI.toast('Сначала войдите в аккаунт', 'error'); location.hash = '#/login'; return; }
      UI.modal(
        '<h3>💳 Оплата Pro — 4 990 ₸/мес</h3>' +
        '<p class="muted small">Демо-режим: реального списания не будет</p>' +
        '<div class="form-label">Номер карты</div>' +
        '<input class="input" id="cardNum" placeholder="4400 4300 1234 5678" maxlength="19">' +
        '<div class="price-row">' +
        '<input class="input" id="cardExp" placeholder="MM/ГГ" maxlength="5">' +
        '<input class="input" id="cardCvv" placeholder="CVV" maxlength="3" type="password">' +
        '</div>' +
        '<button class="btn btn-primary btn-block" id="payBtn">Оплатить 4 990 ₸</button>',
        {
          onMount() {
            document.getElementById('payBtn').onclick = () => {
              const btn = document.getElementById('payBtn');
              btn.disabled = true;
              btn.textContent = 'Обработка платежа…';
              setTimeout(async () => {
                const until = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
                await Store.updateUser(u.id, { plan: 'pro', planUntil: until });
                UI.closeModal();
                UI.toast('⭐ Pro активирован до ' + until + '!', 'success');
                App.renderHeader();
                Views.pricing();
              }, 1200);
            };
          }
        }
      );
    };
    $('#teamContact').onclick = () => UI.toast('Заявка отправлена! Менеджер свяжется с вами (демо)', 'success');
  };
})();
