// ============================================================
// App — роутер и шапка
// ============================================================
window.App = (function () {

  // ---------- шапка ----------
  function renderHeader() {
    const u = Store.currentUser();
    const favCount = u ? u.favorites.length : 0;
    const cmpCount = Store.compareCount();
    document.getElementById('siteHeader').innerHTML =
      '<div class="container header-inner">' +
      '<a class="logo" href="#/">🎓 Agri<span class="grad-text">gator</span></a>' +
      '<nav class="main-nav">' +
      '<a href="#/catalog">Каталог</a>' +
      '<a href="#/match">AI-подбор</a>' +
      '<a href="#/ai-call">AI-ассистент</a>' +
      '<a href="#/verify">Верификация</a>' +
      '<a href="#/pricing">Pro</a>' +
      '</nav>' +
      '<div class="header-actions">' +
      '<button class="icon-btn" id="themeToggle" title="Сменить тему">' + (Store.theme() === 'dark' ? '☀️' : '🌙') + '</button>' +
      '<a class="icon-btn" href="#/compare" title="Сравнение">⚖️' + (cmpCount ? '<span class="count-badge">' + cmpCount + '</span>' : '') + '</a>' +
      '<a class="icon-btn" href="#/favorites" title="Избранное">❤️' + (favCount ? '<span class="count-badge">' + favCount + '</span>' : '') + '</a>' +
      (u
        ? '<a class="header-user" href="#/profile" title="' + UI.esc(u.email) + '">' +
          UI.avatar(u.name, null, 34, u.avatarColor) +
          '<span class="header-user-name">' + UI.esc(u.name.split(' ')[0]) + (Store.isPro() ? ' ⭐' : '') + '</span></a>' +
          (u.role === 'admin' ? '<a class="btn btn-accent slim-btn" href="#/admin">Админ</a>' : '')
        : '<a class="btn btn-ghost slim-btn" href="#/login">Войти</a>' +
          '<a class="btn btn-primary slim-btn" href="#/register">Регистрация</a>') +
      '</div></div>';

    document.getElementById('themeToggle').onclick = () => {
      Store.setTheme(Store.theme() === 'dark' ? 'light' : 'dark');
      renderHeader();
    };
  }

  // ---------- роутер ----------
  // маршруты: '#/segment/param?query'
  const routes = {
    '': () => Views.home(),
    'catalog': p => Views.catalog(p),
    'course': p => Views.course(p),
    'tutor': p => Views.tutor(p),
    'compare': () => Views.compare(),
    'match': () => Views.match(),
    'ai-call': p => Views.aiCall(p),
    'verify': () => Views.verify(),
    'pricing': () => Views.pricing(),
    'login': () => Views.login(),
    'register': () => Views.register(),
    'profile': () => Views.profile(),
    'favorites': () => Views.favorites(),
    'admin': p => Views.admin(p)
  };

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, queryStr] = raw.split('?');
    const segments = path.split('/').filter(Boolean);
    const params = {};
    if (queryStr) {
      queryStr.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { segments, params };
  }

  function route() {
    const { segments, params } = parseHash();
    const name = segments[0] || '';
    // вторые сегменты: /course/c1 → id, /admin/courses → tab
    if (name === 'course' || name === 'tutor') params.id = segments[1];
    if (name === 'admin') params.tab = segments[1];
    const view = routes[name] || routes[''];
    window.scrollTo(0, 0);
    view(params);
    renderHeader(); // обновить счётчики/тему
  }

  // ---------- запуск ----------
  document.documentElement.dataset.theme = Store.theme();
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', async () => {
    await Store.ready; // ждём данные из SQL-базы на сервере
    if (Store.isOffline()) {
      document.getElementById('app').innerHTML =
        '<div class="container section"><div class="empty-state">' +
        '🔌 <b>Нет связи с сервером.</b><br><br>' +
        'Сайт теперь работает с SQL-базой, поэтому его нужно открывать через сервер:<br><br>' +
        '<code>cd ~/Documents/Agrigator && node server.js</code><br><br>' +
        'и зайти на <a href="http://localhost:8765">http://localhost:8765</a>' +
        '</div></div>';
      renderHeader();
      return;
    }
    renderHeader();
    route();
  });

  return { renderHeader, route };
})();
