// ============================================================
// Store — клиент REST API (данные в SQLite на сервере).
// Чтение — синхронно из кэша, мутации — async-запросы к /api.
// ============================================================
window.Store = (function () {
  const TOKEN_KEY = 'agrigator_token';
  const THEME_KEY = 'agrigator_theme';
  const RECENT_KEY = 'agrigator_recent';

  let token = localStorage.getItem(TOKEN_KEY) || '';
  const cache = { courses: [], tutors: [], reviews: [], users: [], leads: [], me: null };
  let offline = false;

  // ---------- транспорт ----------
  async function api(path, method, body) {
    try {
      const res = await fetch('/api' + path, {
        method: method || 'GET',
        headers: Object.assign(
          { 'Content-Type': 'application/json' },
          token ? { Authorization: 'Bearer ' + token } : {}
        ),
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || 'Ошибка сервера (' + res.status + ')' };
      return data;
    } catch (e) {
      return { error: 'Нет связи с сервером. Запустите: node server.js' };
    }
  }

  async function bootstrap() {
    const data = await api('/bootstrap');
    if (data.error) { offline = true; return; }
    offline = false;
    Object.assign(cache, data);
  }
  const ready = (location.protocol === 'file:')
    ? Promise.resolve(offline = true)
    : bootstrap();

  const uid = prefix => prefix + '_' + Math.random().toString(36).slice(2, 9);

  // ---------- auth ----------
  function currentUser() { return cache.me; }

  async function login(email, password) {
    const res = await api('/auth/login', 'POST', { email, password });
    if (res.error) return res;
    token = res.token;
    localStorage.setItem(TOKEN_KEY, token);
    await bootstrap(); // подтянуть админ-данные (users, leads)
    return { user: cache.me };
  }

  async function register(name, email, password) {
    const res = await api('/auth/register', 'POST', { name, email, password });
    if (res.error) return res;
    token = res.token;
    localStorage.setItem(TOKEN_KEY, token);
    await bootstrap();
    return { user: cache.me };
  }

  function logout() {
    api('/auth/logout', 'POST'); // в фоне
    token = '';
    localStorage.removeItem(TOKEN_KEY);
    cache.me = null;
    cache.users = [];
    cache.leads = [];
  }

  function isAdmin() { return !!cache.me && cache.me.role === 'admin'; }
  function isPro() { return !!cache.me && (cache.me.plan === 'pro' || cache.me.role === 'admin'); }

  async function updateUser(id, patch) {
    const res = await api('/users/' + id, 'PATCH', patch);
    if (res.error) return res;
    if (cache.me && cache.me.id === id) cache.me = res.user;
    const i = cache.users.findIndex(u => u.id === id);
    if (i >= 0) cache.users[i] = Object.assign(cache.users[i], res.user);
    return res.user;
  }

  // ---------- items ----------
  function courses() { return cache.courses; }
  function tutors() { return cache.tutors; }
  function allItems() { return cache.courses.concat(cache.tutors); }

  function getItem(type, id) {
    const list = type === 'course' ? cache.courses : cache.tutors;
    return list.find(x => x.id === id) || null;
  }

  async function upsertItem(item) {
    const res = await api('/items', 'POST', item);
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    const list = item.type === 'course' ? cache.courses : cache.tutors;
    const i = list.findIndex(x => x.id === item.id);
    if (i >= 0) list[i] = res.item; else list.unshift(res.item);
    return res.item;
  }

  async function removeItem(type, id) {
    const res = await api('/items/' + type + '/' + id, 'DELETE');
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    const key = type === 'course' ? 'courses' : 'tutors';
    cache[key] = cache[key].filter(x => x.id !== id);
    cache.reviews = cache.reviews.filter(r => !(r.targetType === type && r.targetId === id));
    return res;
  }

  // ---------- reviews ----------
  function reviewsFor(type, id) {
    return cache.reviews
      .filter(r => r.targetType === type && r.targetId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async function addReview(type, id, rating, text, scores) {
    const res = await api('/reviews', 'POST', {
      targetType: type, targetId: id, rating, text,
      beforeScore: scores && scores.before || '', afterScore: scores && scores.after || ''
    });
    if (res.error) return res;
    cache.reviews.unshift(res.review);
    const item = getItem(type, id);
    if (item && res.rating != null) item.rating = res.rating;
    return res;
  }

  async function removeReview(id) {
    const res = await api('/reviews/' + id, 'DELETE');
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    cache.reviews = cache.reviews.filter(r => r.id !== id);
    const item = getItem(res.targetType, res.targetId);
    if (item && res.rating != null) item.rating = res.rating;
    return res;
  }

  // ---------- favorites / compare ----------
  function favKey(type, id) { return type + ':' + id; }

  function isFav(type, id) {
    return !!cache.me && cache.me.favorites.includes(favKey(type, id));
  }

  async function toggleFav(type, id) {
    if (!cache.me) return { error: 'Войдите, чтобы добавлять в избранное' };
    const res = await api('/favorites/toggle', 'POST', { key: favKey(type, id) });
    if (res.error) return res;
    cache.me.favorites = res.favorites;
    return res;
  }

  let compareList = JSON.parse(sessionStorage.getItem('agrigator_compare') || '[]');

  function compareItems() {
    return compareList
      .map(k => { const [type, id] = k.split(':'); return getItem(type, id); })
      .filter(Boolean);
  }

  function inCompare(type, id) { return compareList.includes(favKey(type, id)); }

  function toggleCompare(type, id) {
    const key = favKey(type, id);
    const i = compareList.indexOf(key);
    if (i >= 0) compareList.splice(i, 1);
    else {
      if (compareList.length >= 3) return { error: 'Сравнивать можно максимум 3 позиции' };
      compareList.push(key);
    }
    sessionStorage.setItem('agrigator_compare', JSON.stringify(compareList));
    return { added: i < 0, count: compareList.length };
  }

  function compareCount() { return compareList.length; }

  // ---------- bookings / leads / reports ----------
  async function addBooking(booking) {
    const res = await api('/bookings', 'POST', booking);
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    if (cache.me) cache.me.bookings.push(res.booking);
    return res.booking;
  }

  function leads() { return cache.leads; }

  async function addLead(lead) {
    const res = await api('/leads', 'POST', lead);
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    cache.leads.unshift(res.lead);
    return res.lead;
  }

  async function updateLead(id, patch) {
    const res = await api('/leads/' + id, 'PATCH', patch);
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    const i = cache.leads.findIndex(l => l.id === id);
    if (i >= 0) cache.leads[i] = res.lead;
    return res.lead;
  }

  async function addReport(report) {
    const res = await api('/me/reports', 'POST', report);
    if (res.error) { UI.toast(res.error, 'error'); return null; }
    if (cache.me) cache.me.reports.unshift(res.report);
    return res.report;
  }

  async function addVerifiedExam(rec) {
    const res = await api('/me/verified', 'POST', rec);
    if (res.error) return null;
    if (cache.me) cache.me.verifiedExams.unshift(res.record);
    return res.record;
  }

  // ---------- недавно просмотренные (локально, для каждого браузера) ----------
  function trackView(type, id) {
    const key = favKey(type, id);
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    const next = [key].concat(recent.filter(k => k !== key)).slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  function recentItems() {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
      .map(k => { const [type, id] = k.split(':'); return getItem(type, id); })
      .filter(Boolean);
  }

  // ---------- theme ----------
  function theme() { return localStorage.getItem(THEME_KEY) || 'light'; }
  function setTheme(t) { localStorage.setItem(THEME_KEY, t); document.documentElement.dataset.theme = t; }

  // ---------- admin ----------
  function users() { return cache.users; }
  function allReviews() { return cache.reviews.slice().sort((a, b) => b.date.localeCompare(a.date)); }

  async function removeUser(id) {
    const res = await api('/users/' + id, 'DELETE');
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    cache.users = cache.users.filter(u => u.id !== id);
    return res;
  }

  async function resetDb() {
    const res = await api('/admin/reset', 'POST');
    if (res.error) { UI.toast(res.error, 'error'); return res; }
    await bootstrap();
    return res;
  }

  async function exportDb() {
    const res = await api('/admin/export');
    if (res.error) { UI.toast(res.error, 'error'); return null; }
    return JSON.stringify(res, null, 2);
  }

  return {
    ready, uid,
    isOffline: () => offline,
    currentUser, login, register, logout, isAdmin, isPro, updateUser,
    courses, tutors, allItems, getItem, upsertItem, removeItem,
    reviewsFor, addReview, removeReview,
    isFav, toggleFav,
    compareItems, inCompare, toggleCompare, compareCount,
    addBooking, leads, addLead, updateLead, addReport, addVerifiedExam,
    trackView, recentItems,
    theme, setTheme,
    users, allReviews, removeUser, resetDb, exportDb
  };
})();
