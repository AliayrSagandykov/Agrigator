// ============================================================
// Agrigator — бэкенд: Node http + SQLite (node:sqlite, без зависимостей)
// Запуск:  node server.js   →  http://localhost:8765
// ============================================================
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8765;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'agrigator.db');

// ---------- база ----------
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  plan TEXT NOT NULL DEFAULT 'free',
  plan_until TEXT,
  avatar_color TEXT,
  favorites TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- course | tutor
  data TEXT NOT NULL,          -- полный JSON карточки
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  before_score TEXT DEFAULT '',
  after_score TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  kind TEXT NOT NULL,
  target_type TEXT, target_id TEXT, target_name TEXT,
  day TEXT, time TEXT, note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT, url TEXT, found_at TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  raw_text TEXT, parsed TEXT
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  title TEXT, headline TEXT, date TEXT
);
CREATE TABLE IF NOT EXISTS verified_exams (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  exam TEXT, score TEXT, date TEXT
);
`);

// ---------- утилиты ----------
const uid = p => p + '_' + crypto.randomBytes(5).toString('hex');
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function checkPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(pw, salt, 64));
}

// ---------- сидинг из js/data.js ----------
function loadSeed() {
  const code = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const sandbox = {};
  new Function('window', code)(sandbox);
  return sandbox.SEED;
}

function seedDb() {
  const SEED = loadSeed();
  const insItem = db.prepare('INSERT INTO items (id, type, data, updated_at) VALUES (?, ?, ?, ?)');
  SEED.courses.concat(SEED.tutors).forEach(x => insItem.run(x.id, x.type, JSON.stringify(x), now()));
  const insRev = db.prepare(`INSERT INTO reviews (id, target_type, target_id, user_id, user_name, rating, text, verified, date, before_score, after_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  SEED.reviews.forEach(r => insRev.run(r.id, r.targetType, r.targetId, null, r.userName, r.rating, r.text, r.verified ? 1 : 0, r.date, r.beforeScore || '', r.afterScore || ''));
  const insUser = db.prepare(`INSERT INTO users (id, name, email, password, role, plan, plan_until, avatar_color, favorites, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  SEED.users.forEach(u => insUser.run(u.id, u.name, u.email, hashPassword(u.password), u.role, u.plan, u.planUntil, u.avatarColor, JSON.stringify(u.favorites || []), u.createdAt));
  const insLead = db.prepare('INSERT INTO leads (id, source, url, found_at, status, raw_text, parsed) VALUES (?, ?, ?, ?, ?, ?, ?)');
  SEED.leads.forEach(l => insLead.run(l.id, l.source, l.url, l.foundAt, l.status, l.rawText, JSON.stringify(l.parsed)));
  SEED.users.find(u => u.id === 'u3') && db.prepare('INSERT INTO verified_exams (id, user_id, exam, score, date) VALUES (?, ?, ?, ?, ?)')
    .run(uid('ve'), 'u3', 'IELTS', '7.0', '2026-03-10');
  console.log('База засеяна демо-данными:', SEED.courses.length, 'курсов,', SEED.tutors.length, 'репетиторов');
}

function resetDb() {
  ['sessions', 'verified_exams', 'reports', 'leads', 'bookings', 'reviews', 'items', 'users'].forEach(t => db.exec('DELETE FROM ' + t));
  seedDb();
}

if (!db.prepare('SELECT COUNT(*) AS n FROM items').get().n) seedDb();

// ---------- мапперы строк ----------
const itemFromRow = r => JSON.parse(r.data);
const reviewFromRow = r => ({
  id: r.id, targetType: r.target_type, targetId: r.target_id, userId: r.user_id,
  userName: r.user_name, rating: r.rating, text: r.text, verified: !!r.verified,
  date: r.date, beforeScore: r.before_score, afterScore: r.after_score
});
const bookingFromRow = r => ({
  id: r.id, kind: r.kind, targetType: r.target_type, targetId: r.target_id,
  targetName: r.target_name, day: r.day, time: r.time, note: r.note, createdAt: r.created_at
});
const leadFromRow = r => ({
  id: r.id, source: r.source, url: r.url, foundAt: r.found_at,
  status: r.status, rawText: r.raw_text, parsed: JSON.parse(r.parsed || '{}')
});
function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, plan: u.plan,
    planUntil: u.plan_until, avatarColor: u.avatar_color,
    favorites: JSON.parse(u.favorites || '[]'), createdAt: u.created_at
  };
}
function meUser(u) {
  const pu = publicUser(u);
  pu.bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at').all(u.id).map(bookingFromRow);
  pu.reports = db.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC').all(u.id)
    .map(r => ({ id: r.id, title: r.title, headline: r.headline, date: r.date }));
  pu.verifiedExams = db.prepare('SELECT * FROM verified_exams WHERE user_id = ? ORDER BY date DESC').all(u.id)
    .map(v => ({ exam: v.exam, score: v.score, date: v.date }));
  return pu;
}

function getAuthUser(req) {
  const m = (req.headers.authorization || '').match(/^Bearer (\w+)$/);
  if (!m) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(m[1]);
  if (!s) return null;
  return db.prepare('SELECT * FROM users WHERE id = ?').get(s.user_id) || null;
}

function recalcRating(targetType, targetId) {
  const rows = db.prepare('SELECT rating FROM reviews WHERE target_type = ? AND target_id = ?').all(targetType, targetId);
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(targetId);
  if (!row) return null;
  const item = itemFromRow(row);
  if (rows.length) item.rating = Math.round(rows.reduce((s, r) => s + r.rating, 0) / rows.length * 10) / 10;
  db.prepare('UPDATE items SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(item), now(), targetId);
  return item.rating;
}

// ---------- http helpers ----------
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
const err = (res, code, message) => send(res, code, { error: message });

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

// ---------- API ----------
async function handleApi(req, res, pathname) {
  const user = getAuthUser(req);
  const admin = user && user.role === 'admin';
  const method = req.method;
  const route = method + ' ' + pathname;
  let m;

  // --- бутстрап: всё, что нужно фронту при загрузке ---
  if (route === 'GET /api/bootstrap') {
    const items = db.prepare('SELECT * FROM items').all().map(itemFromRow);
    return send(res, 200, {
      courses: items.filter(x => x.type === 'course'),
      tutors: items.filter(x => x.type === 'tutor'),
      reviews: db.prepare('SELECT * FROM reviews ORDER BY date DESC').all().map(reviewFromRow),
      me: user ? meUser(user) : null,
      users: admin ? db.prepare('SELECT * FROM users').all().map(publicUser) : [],
      leads: admin ? db.prepare('SELECT * FROM leads ORDER BY found_at DESC').all().map(leadFromRow) : []
    });
  }

  // --- auth ---
  if (route === 'POST /api/auth/register') {
    const { name, email, password } = await readBody(req);
    if (!name || !String(name).trim()) return err(res, 400, 'Укажите имя');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email || '').trim())) return err(res, 400, 'Некорректный email');
    if (!password || password.length < 6) return err(res, 400, 'Пароль — минимум 6 символов');
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase().trim()))
      return err(res, 409, 'Этот email уже зарегистрирован');
    const colors = ['#7c3aed', '#0ea5e9', '#16a34a', '#f59e0b', '#ef4444', '#ec4899'];
    const id = uid('u');
    db.prepare(`INSERT INTO users (id, name, email, password, role, plan, plan_until, avatar_color, favorites, created_at)
      VALUES (?, ?, ?, ?, 'user', 'free', NULL, ?, '[]', ?)`)
      .run(id, String(name).trim(), String(email).toLowerCase().trim(), hashPassword(password),
        colors[Math.floor(Math.random() * colors.length)], today());
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, id, now());
    return send(res, 201, { token, user: meUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id)) });
  }

  if (route === 'POST /api/auth/login') {
    const { email, password } = await readBody(req);
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase().trim());
    if (!u) return err(res, 404, 'Пользователь с таким email не найден');
    if (!checkPassword(password || '', u.password)) return err(res, 401, 'Неверный пароль');
    const token = crypto.randomBytes(24).toString('hex');
    db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, u.id, now());
    return send(res, 200, { token, user: meUser(u) });
  }

  if (route === 'POST /api/auth/logout') {
    const t = (req.headers.authorization || '').match(/^Bearer (\w+)$/);
    if (t) db.prepare('DELETE FROM sessions WHERE token = ?').run(t[1]);
    return send(res, 200, { ok: true });
  }

  // --- пользователи ---
  if (route === 'GET /api/users') {
    if (!admin) return err(res, 403, 'Только для админа');
    return send(res, 200, db.prepare('SELECT * FROM users').all().map(publicUser));
  }

  if ((m = pathname.match(/^\/api\/users\/([\w-]+)$/)) && method === 'PATCH') {
    if (!user) return err(res, 401, 'Войдите в аккаунт');
    const targetId = m[1];
    if (!admin && user.id !== targetId) return err(res, 403, 'Можно менять только свой профиль');
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
    if (!target) return err(res, 404, 'Пользователь не найден');
    const patch = await readBody(req);
    const allowed = admin ? ['name', 'password', 'plan', 'planUntil', 'role', 'favorites'] : ['name', 'password', 'plan', 'planUntil', 'favorites'];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (!(key in patch)) continue;
      let col = { planUntil: 'plan_until' }[key] || key;
      let val = patch[key];
      if (key === 'password') {
        if (!val || val.length < 6) return err(res, 400, 'Пароль — минимум 6 символов');
        val = hashPassword(val);
      }
      if (key === 'plan' && !['free', 'pro'].includes(val)) return err(res, 400, 'Неверный план');
      if (key === 'role' && !['user', 'admin'].includes(val)) return err(res, 400, 'Неверная роль');
      if (key === 'favorites') val = JSON.stringify(val);
      sets.push(col + ' = ?');
      vals.push(val);
    }
    if (sets.length) {
      vals.push(targetId);
      db.prepare('UPDATE users SET ' + sets.join(', ') + ' WHERE id = ?').run(...vals);
    }
    return send(res, 200, { user: meUser(db.prepare('SELECT * FROM users WHERE id = ?').get(targetId)) });
  }

  if ((m = pathname.match(/^\/api\/users\/([\w-]+)$/)) && method === 'DELETE') {
    if (!admin) return err(res, 403, 'Только для админа');
    if (m[1] === user.id) return err(res, 400, 'Нельзя удалить себя');
    db.prepare('DELETE FROM users WHERE id = ?').run(m[1]);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(m[1]);
    return send(res, 200, { ok: true });
  }

  // --- избранное ---
  if (route === 'POST /api/favorites/toggle') {
    if (!user) return err(res, 401, 'Войдите, чтобы добавлять в избранное');
    const { key } = await readBody(req);
    const favs = JSON.parse(user.favorites || '[]');
    const i = favs.indexOf(key);
    if (i >= 0) favs.splice(i, 1); else favs.push(key);
    db.prepare('UPDATE users SET favorites = ? WHERE id = ?').run(JSON.stringify(favs), user.id);
    return send(res, 200, { added: i < 0, favorites: favs });
  }

  // --- курсы / репетиторы ---
  if (route === 'POST /api/items') {
    if (!admin) return err(res, 403, 'Только для админа');
    const item = await readBody(req);
    if (!item.id || !['course', 'tutor'].includes(item.type)) return err(res, 400, 'Некорректная карточка');
    if (!(item.title || item.name)) return err(res, 400, 'Укажите название');
    const exists = db.prepare('SELECT id FROM items WHERE id = ?').get(item.id);
    if (exists) db.prepare('UPDATE items SET data = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(item), now(), item.id);
    else db.prepare('INSERT INTO items (id, type, data, updated_at) VALUES (?, ?, ?, ?)').run(item.id, item.type, JSON.stringify(item), now());
    return send(res, exists ? 200 : 201, { item });
  }

  if ((m = pathname.match(/^\/api\/items\/(course|tutor)\/([\w-]+)$/)) && method === 'DELETE') {
    if (!admin) return err(res, 403, 'Только для админа');
    db.prepare('DELETE FROM items WHERE id = ? AND type = ?').run(m[2], m[1]);
    db.prepare('DELETE FROM reviews WHERE target_type = ? AND target_id = ?').run(m[1], m[2]);
    return send(res, 200, { ok: true });
  }

  // --- отзывы ---
  if (route === 'POST /api/reviews') {
    if (!user) return err(res, 401, 'Войдите, чтобы оставить отзыв');
    const b = await readBody(req);
    if (!b.text || b.text.trim().length < 5) return err(res, 400, 'Напишите хотя бы пару слов');
    const rating = Math.min(5, Math.max(1, parseInt(b.rating, 10) || 5));
    if (!db.prepare('SELECT id FROM items WHERE id = ?').get(b.targetId)) return err(res, 404, 'Карточка не найдена');
    const review = {
      id: uid('r'), targetType: b.targetType, targetId: b.targetId, userId: user.id,
      userName: user.name, rating, text: b.text.trim(), verified: false, date: today(),
      beforeScore: b.beforeScore || '', afterScore: b.afterScore || ''
    };
    db.prepare(`INSERT INTO reviews (id, target_type, target_id, user_id, user_name, rating, text, verified, date, before_score, after_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`)
      .run(review.id, review.targetType, review.targetId, user.id, user.name, rating, review.text, review.date, review.beforeScore, review.afterScore);
    const newRating = recalcRating(review.targetType, review.targetId);
    return send(res, 201, { review, rating: newRating });
  }

  if ((m = pathname.match(/^\/api\/reviews\/([\w-]+)$/)) && method === 'DELETE') {
    if (!admin) return err(res, 403, 'Только для админа');
    const r = db.prepare('SELECT * FROM reviews WHERE id = ?').get(m[1]);
    if (!r) return err(res, 404, 'Отзыв не найден');
    db.prepare('DELETE FROM reviews WHERE id = ?').run(m[1]);
    const newRating = recalcRating(r.target_type, r.target_id);
    return send(res, 200, { ok: true, targetType: r.target_type, targetId: r.target_id, rating: newRating });
  }

  // --- записи на уроки/звонки (можно без аккаунта) ---
  if (route === 'POST /api/bookings') {
    const b = await readBody(req);
    const booking = {
      id: uid('b'), kind: b.kind === 'trial' ? 'trial' : 'call',
      targetType: b.targetType, targetId: b.targetId, targetName: b.targetName,
      day: b.day, time: b.time, note: b.note || '', createdAt: now()
    };
    db.prepare(`INSERT INTO bookings (id, user_id, kind, target_type, target_id, target_name, day, time, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(booking.id, user ? user.id : null, booking.kind, booking.targetType, booking.targetId,
        booking.targetName, booking.day, booking.time, booking.note, booking.createdAt);
    return send(res, 201, { booking });
  }

  // --- лиды парсера ---
  if (route === 'POST /api/leads') {
    if (!admin) return err(res, 403, 'Только для админа');
    const b = await readBody(req);
    const lead = {
      id: uid('l'), source: b.source || 'Вручную', url: b.url || '',
      foundAt: today(), status: 'new', rawText: b.rawText || '', parsed: b.parsed || {}
    };
    db.prepare('INSERT INTO leads (id, source, url, found_at, status, raw_text, parsed) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(lead.id, lead.source, lead.url, lead.foundAt, lead.status, lead.rawText, JSON.stringify(lead.parsed));
    return send(res, 201, { lead });
  }

  if ((m = pathname.match(/^\/api\/leads\/([\w-]+)$/)) && method === 'PATCH') {
    if (!admin) return err(res, 403, 'Только для админа');
    const b = await readBody(req);
    if (b.status && ['new', 'imported', 'rejected'].includes(b.status))
      db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(b.status, m[1]);
    const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(m[1]);
    return row ? send(res, 200, { lead: leadFromRow(row) }) : err(res, 404, 'Лид не найден');
  }

  // --- AI-отчёты и верификация ---
  if (route === 'POST /api/me/reports') {
    if (!user) return err(res, 401, 'Войдите в аккаунт');
    const b = await readBody(req);
    const report = { id: uid('rep'), title: b.title || 'AI-отчёт', headline: b.headline || '', date: today() };
    db.prepare('INSERT INTO reports (id, user_id, title, headline, date) VALUES (?, ?, ?, ?, ?)')
      .run(report.id, user.id, report.title, report.headline, report.date);
    return send(res, 201, { report });
  }

  if (route === 'POST /api/me/verified') {
    if (!user) return err(res, 401, 'Войдите в аккаунт');
    const b = await readBody(req);
    const rec = { exam: b.exam || '', score: b.score || '', date: today() };
    db.prepare('INSERT INTO verified_exams (id, user_id, exam, score, date) VALUES (?, ?, ?, ?, ?)')
      .run(uid('ve'), user.id, rec.exam, rec.score, rec.date);
    return send(res, 201, { record: rec });
  }

  // --- админ: сервисные ---
  if (route === 'POST /api/admin/reset') {
    if (!admin) return err(res, 403, 'Только для админа');
    resetDb();
    return send(res, 200, { ok: true });
  }

  if (route === 'GET /api/admin/export') {
    if (!admin) return err(res, 403, 'Только для админа');
    const dump = {};
    ['users', 'items', 'reviews', 'bookings', 'leads', 'reports', 'verified_exams'].forEach(t => {
      dump[t] = db.prepare('SELECT * FROM ' + t).all();
    });
    dump.users.forEach(u => delete u.password);
    return send(res, 200, dump);
  }

  return err(res, 404, 'Неизвестный API-маршрут: ' + route);
}

// ---------- статика ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

function serveStatic(req, res, pathname) {
  let filePath = path.normalize(path.join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (e, data) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

// ---------- сервер ----------
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  try {
    if (pathname.startsWith('/api/')) await handleApi(req, res, pathname);
    else serveStatic(req, res, pathname);
  } catch (e) {
    console.error(req.method, pathname, e);
    if (!res.headersSent) err(res, 500, 'Внутренняя ошибка сервера');
  }
});

server.listen(PORT, () => {
  console.log('Agrigator запущен: http://localhost:' + PORT);
  console.log('SQL-база: ' + DB_FILE);
});
