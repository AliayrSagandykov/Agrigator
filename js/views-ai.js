// ============================================================
// AI-фичи: подбор программы, ассистент звонков, верификация
// ============================================================
window.Views = window.Views || {};

(function () {
  const $ = sel => document.querySelector(sel);
  const app = () => document.getElementById('app');

  // ---------------- AI-ПОДБОР (мэтчинг) ----------------
  const matchState = { step: 0, exam: null, target: null, budget: null, format: null, style: null };

  Views.match = function () {
    Object.assign(matchState, { step: 0, exam: null, target: null, budget: null, format: null, style: null });
    renderMatchStep();
  };

  const matchSteps = [
    { key: 'exam', title: 'К какому экзамену готовимся?', options: SEED.exams.map(e => ({ v: e, label: e })) },
    {
      key: 'target', title: 'Какая цель?',
      options: [
        { v: 'max', label: '🏆 Максимальный балл (топ-вузы)' },
        { v: 'solid', label: '🎯 Уверенный проходной балл' },
        { v: 'base', label: '🌱 Начать с нуля и понять формат' }
      ]
    },
    {
      key: 'budget', title: 'Бюджет в месяц?',
      options: [
        { v: 50000, label: 'До 50 000 ₸' },
        { v: 90000, label: 'До 90 000 ₸' },
        { v: 999999, label: 'Бюджет не главное' }
      ]
    },
    {
      key: 'format', title: 'Какой формат удобнее?',
      options: [
        { v: 'online', label: '💻 Онлайн' },
        { v: 'offline', label: '🏫 Оффлайн' },
        { v: 'any', label: '🤷 Не важно' }
      ]
    },
    {
      key: 'style', title: 'Как вам комфортнее учиться?',
      options: [
        { v: 'group', label: '👥 В группе (курс)' },
        { v: 'solo', label: '🧑‍🏫 Один на один (репетитор)' },
        { v: 'any', label: '✨ Покажите лучшее из обоих' }
      ]
    }
  ];

  function renderMatchStep() {
    const s = matchState;
    if (s.step >= matchSteps.length) { renderMatchResults(); return; }
    const step = matchSteps[s.step];
    app().innerHTML =
      '<div class="container section match-wrap">' +
      '<div class="card match-card">' +
      '<div class="match-progress"><div class="match-progress-fill" style="width:' + (s.step / matchSteps.length * 100) + '%"></div></div>' +
      '<div class="muted small">Шаг ' + (s.step + 1) + ' из ' + matchSteps.length + '</div>' +
      '<h1>🎯 ' + step.title + '</h1>' +
      '<div class="match-options">' +
      step.options.map(o => '<button class="match-opt" data-val="' + o.v + '">' + o.label + '</button>').join('') +
      '</div>' +
      (s.step > 0 ? '<button class="btn btn-ghost" id="matchBack">← Назад</button>' : '') +
      '</div></div>';

    document.querySelectorAll('.match-opt').forEach(b => b.onclick = () => {
      s[step.key] = isNaN(+b.dataset.val) ? b.dataset.val : +b.dataset.val;
      s.step++;
      renderMatchStep();
    });
    const back = $('#matchBack');
    if (back) back.onclick = () => { s.step--; renderMatchStep(); };
  }

  function scoreItem(x) {
    const s = matchState;
    let score = 0;
    const reasons = [];
    if (x.exams.includes(s.exam)) { score += 45; reasons.push('Готовит к ' + s.exam); } else return null;
    if (x.price <= s.budget) { score += 18; reasons.push('Вписывается в бюджет'); }
    else { score -= 10; }
    if (s.format === 'any' || x.format === s.format || x.format === 'hybrid') {
      score += 12; if (s.format !== 'any') reasons.push('Подходит формат: ' + UI.FORMAT_LABEL[x.format]);
    }
    if (s.style === 'group' && x.type === 'course') { score += 10; reasons.push('Групповой курс — как вы хотели'); }
    if (s.style === 'solo' && x.type === 'tutor') { score += 10; reasons.push('Занятия 1-на-1'); }
    if (s.target === 'max' && x.rating >= 4.8) { score += 8; reasons.push('Топ-рейтинг для амбициозной цели'); }
    if (s.target === 'base' && x.trialFree) { score += 6; reasons.push('Бесплатный пробный — мягкий старт'); }
    score += x.rating * 2;
    if (x.aiVerified) { score += 4; reasons.push('Результаты подтверждены ИИ'); }
    if (x.sponsored) score += 2;
    return { item: x, score: Math.min(99, Math.round(score)), reasons: reasons.slice(0, 3) };
  }

  function renderMatchResults() {
    const matches = Store.allItems()
      .map(scoreItem)
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    app().innerHTML =
      '<div class="container section">' +
      '<div class="center"><span class="chip chip-new">AI-подбор</span>' +
      '<h1>Ваши мэтчи по ' + UI.esc(matchState.exam) + '</h1>' +
      '<p class="muted">ИИ проранжировал каталог под ваши ответы</p></div>' +
      (matches.length
        ? '<div class="match-results">' + matches.map(m =>
          '<div class="match-result-row card">' +
          '<div class="match-score"><b>' + m.score + '%</b><span class="muted small">match</span></div>' +
          '<div class="match-result-body">' + UI.itemCard(m.item) + '</div>' +
          '<div class="match-reasons">' + m.reasons.map(r => '<div class="mini-insight ok">✓ ' + UI.esc(r) + '</div>').join('') + '</div>' +
          '</div>').join('') + '</div>'
        : '<div class="empty-state">По ' + UI.esc(matchState.exam) + ' пока нет программ. Загляните позже!</div>') +
      '<div class="center"><button class="btn btn-ghost" id="matchAgain">Пройти подбор заново</button></div>' +
      '</div>';

    $('#matchAgain').onclick = Views.match;
  }

  // ---------------- AI-АССИСТЕНТ ЗВОНКОВ (демо) ----------------
  const CALL_SCRIPT = [
    { t: 0, who: 'tutor', name: 'Айгерим', text: 'Окей, давай разберём Speaking Part 2. Опиши место, которое тебе запомнилось из путешествий.' },
    { t: 1, who: 'student', name: 'Студент', text: 'Last summer I have visited Istanbul with my family…' },
    { t: 2, who: 'ai', insight: true, kind: 'warn', text: 'Грамматика: «I have visited» + «last summer» — ошибка. С указанием времени нужен Past Simple: «I visited».' },
    { t: 3, who: 'tutor', name: 'Айгерим', text: 'Хорошее начало! Заметила маленькую ошибку со временем — какое время используем с «last summer»?' },
    { t: 4, who: 'student', name: 'Студент', text: 'Ah, Past Simple! Last summer I visited Istanbul. The city was amazing, especially the… эм… как сказать «закат»?' },
    { t: 5, who: 'ai', insight: true, kind: 'info', text: 'Словарный запас: пауза при поиске слова «sunset». Добавил в персональный список для повторения.' },
    { t: 6, who: 'tutor', name: 'Айгерим', text: 'Sunset! Try to paraphrase next time — например, «when the sun was going down».' },
    { t: 7, who: 'student', name: 'Студент', text: 'The sunset over the Bosphorus was breathtaking. We spent the whole evening near the bridge, and I took dozens of photos.' },
    { t: 8, who: 'ai', insight: true, kind: 'ok', text: 'Отлично: «breathtaking», «dozens of» — лексика уровня Band 7+. Fluency выросла: 92 слова/мин против 78 в начале урока.' },
    { t: 9, who: 'tutor', name: 'Айгерим', text: 'Beautiful! А теперь добавь, почему это место запомнилось именно тебе.' },
    { t: 10, who: 'student', name: 'Студент', text: 'I think… it was the first time when I felt completely free. If I will go there again, I will visit the islands.' },
    { t: 11, who: 'ai', insight: true, kind: 'warn', text: 'Грамматика: «If I will go» — в условных предложениях First Conditional после if будущее время не используется: «If I go there again…». Эта ошибка встречается у студента 3-й раз за неделю.' },
    { t: 12, who: 'tutor', name: 'Айгерим', text: 'Запомни: после if — настоящее время. «If I go there again, I will visit the islands». Повтори, пожалуйста.' },
    { t: 13, who: 'student', name: 'Студент', text: 'If I go there again, I will visit the islands!' },
    { t: 14, who: 'ai', insight: true, kind: 'ok', text: 'Самокоррекция принята ✓. Условные предложения добавлены в домашнее задание с приоритетом «высокий».' },
    { t: 15, who: 'tutor', name: 'Айгерим', text: 'Отлично поработали! На сегодня всё — AI-ассистент сейчас пришлёт отчёт.' }
  ];

  let callTimer = null;

  Views.aiCall = function (params) {
    clearInterval(callTimer);
    let withItem = null;
    if (params.with) {
      const [type, id] = params.with.split(':');
      withItem = Store.getItem(type, id);
    }

    app().innerHTML =
      '<div class="container section">' +
      '<div class="center"><span class="chip chip-new">Демо в реальном времени</span>' +
      '<h1>🤖 AI-ассистент на звонке</h1>' +
      '<p class="muted">ИИ «сидит» на уроке' + (withItem ? ' (' + UI.esc(withItem.title || withItem.name) + ')' : '') + ', учится вместе со студентом и даёт обратную связь прямо во время занятия</p></div>' +

      '<div class="call-layout">' +
      '<div class="call-main card">' +
      '<div class="call-videos">' +
      '<div class="video-tile g1"><span class="video-initials">АС</span><span class="video-name">Айгерим (репетитор)</span><span class="live-dot">● LIVE</span></div>' +
      '<div class="video-tile g3"><span class="video-initials">СТ</span><span class="video-name">Студент</span></div>' +
      '<div class="video-tile ai-tile"><span class="video-initials">🤖</span><span class="video-name">Agrigator AI</span><span class="ai-listening" id="aiListening">слушает…</span></div>' +
      '</div>' +
      '<div class="call-controls">' +
      '<button class="btn btn-primary" id="startCall">▶ Запустить демо-звонок</button>' +
      '<span class="muted small" id="callStatus">Урок: IELTS Speaking Part 2</span>' +
      '</div>' +
      '<div class="transcript" id="transcript"><p class="muted center">Нажмите «Запустить демо-звонок» — транскрипт и AI-аналитика появятся здесь</p></div>' +
      '</div>' +

      '<aside class="call-side card">' +
      '<h3>🧠 AI-инсайты <span class="live-dot" id="insightLive" style="display:none">● LIVE</span></h3>' +
      '<div id="insights" class="insights-list"><p class="muted small">ИИ начнёт отмечать ошибки и сильные стороны во время звонка</p></div>' +
      '<div class="ai-meters">' +
      meter('Грамматика', 'mGrammar', 55) + meter('Словарный запас', 'mVocab', 62) +
      meter('Беглость речи', 'mFluency', 48) + meter('Произношение', 'mPron', 70) +
      '</div>' +
      '</aside>' +
      '</div>' +

      '<div id="callReport"></div>' +
      '</div>';

    $('#startCall').onclick = startCallDemo;
  };

  function meter(label, id, val) {
    return '<div class="meter-row"><span>' + label + '</span>' +
      '<div class="meter"><div class="meter-fill" id="' + id + '" style="width:' + val + '%"></div></div>' +
      '<b id="' + id + 'Val">' + val + '%</b></div>';
  }

  function startCallDemo() {
    const btn = $('#startCall');
    btn.disabled = true;
    btn.textContent = '⏺ Идёт звонок…';
    $('#transcript').innerHTML = '';
    $('#insights').innerHTML = '';
    $('#insightLive').style.display = '';
    const meters = { mGrammar: 55, mVocab: 62, mFluency: 48, mPron: 70 };

    let i = 0;
    callTimer = setInterval(() => {
      if (!document.getElementById('transcript')) { clearInterval(callTimer); return; }
      if (i >= CALL_SCRIPT.length) { clearInterval(callTimer); finishCall(); return; }
      const line = CALL_SCRIPT[i++];
      if (line.insight) {
        const cls = line.kind === 'warn' ? '' : line.kind === 'ok' ? ' ok' : ' neutral';
        $('#insights').insertAdjacentHTML('beforeend',
          '<div class="mini-insight' + cls + ' pop">' + (line.kind === 'warn' ? '⚠️ ' : line.kind === 'ok' ? '✅ ' : '💡 ') + UI.esc(line.text) + '</div>');
        $('#insights').scrollTop = $('#insights').scrollHeight;
        // двигаем метрики
        const delta = line.kind === 'ok' ? 6 : 2;
        ['mGrammar', 'mVocab', 'mFluency', 'mPron'].forEach(m => {
          meters[m] = Math.min(95, meters[m] + Math.round(Math.random() * delta));
          const el = document.getElementById(m);
          if (el) { el.style.width = meters[m] + '%'; document.getElementById(m + 'Val').textContent = meters[m] + '%'; }
        });
      } else {
        $('#transcript').insertAdjacentHTML('beforeend',
          '<div class="tr-line tr-' + line.who + '"><b>' + UI.esc(line.name) + ':</b> ' + UI.esc(line.text) + '</div>');
        $('#transcript').scrollTop = $('#transcript').scrollHeight;
      }
    }, 1400);
  }

  function finishCall() {
    $('#aiListening').textContent = 'отчёт готов ✓';
    $('#insightLive').style.display = 'none';
    const status = $('#callStatus');
    if (status) status.textContent = 'Звонок завершён · 32 мин';
    const btn = $('#startCall');
    btn.textContent = '✓ Звонок завершён';

    const reportHtml =
      '<div class="card section-card report-card pop">' +
      '<h2>📋 AI-отчёт по занятию</h2>' +
      '<div class="report-grid">' +
      '<div><h3>💪 Сильные стороны</h3><ul class="feature-list">' +
      '<li>✔ Лексика Band 7+: «breathtaking», «dozens of»</li>' +
      '<li>✔ Fluency выросла с 78 до 92 слов/мин за урок</li>' +
      '<li>✔ Быстрая самокоррекция после подсказки</li></ul></div>' +
      '<div><h3>⚠️ Над чем работать</h3><ul class="feature-list">' +
      '<li>✖ Past Simple vs Present Perfect с маркерами времени</li>' +
      '<li>✖ First Conditional — «if + will» (3-й раз за неделю)</li>' +
      '<li>✖ Паузы при поиске слов — тренировать парафраз</li></ul></div>' +
      '</div>' +
      '<h3>🎯 Рекомендации ИИ</h3>' +
      '<ul class="feature-list">' +
      '<li>💡 15 минут в день — упражнения на условные предложения (приоритет: высокий)</li>' +
      '<li>💡 Shadowing-практика 3 раза в неделю для беглости</li>' +
      '<li>💡 Прогноз при текущем темпе: <b>Band 7.0 через 5 недель</b></li>' +
      '</ul>' +
      '<div class="report-actions">' +
      '<button class="btn btn-primary" id="saveReport">💾 Сохранить отчёт в профиль</button>' +
      '<button class="btn btn-ghost" id="againCall">↻ Запустить демо ещё раз</button>' +
      '</div></div>';

    $('#callReport').innerHTML = reportHtml;
    $('#callReport').scrollIntoView({ behavior: 'smooth' });

    $('#saveReport').onclick = async () => {
      if (!Store.currentUser()) { UI.toast('Войдите, чтобы сохранять отчёты', 'error'); location.hash = '#/login'; return; }
      if (!Store.isPro()) {
        UI.toast('AI-отчёты доступны по подписке Pro', 'error');
        location.hash = '#/pricing';
        return;
      }
      const saved = await Store.addReport({ title: 'IELTS Speaking Part 2 — урок с Айгерим', headline: 'Прогноз: Band 7.0 через 5 недель' });
      if (saved) UI.toast('Отчёт сохранён в профиль', 'success');
    };
    $('#againCall').onclick = () => { Views.aiCall({}); };
  }

  // ---------------- AI-ВЕРИФИКАЦИЯ РЕЗУЛЬТАТОВ ----------------
  Views.verify = function () {
    app().innerHTML =
      '<div class="container section">' +
      '<div class="center"><span class="chip chip-new">AI-верификация</span>' +
      '<h1>🛡️ Подтверждение результатов IELTS / SAT</h1>' +
      '<p class="muted">Загрузите официальный score report — ИИ проверит его подлинность и добавит бейдж «✓ verified» в ваш профиль и отзывы.<br>Так же мы проверяем результаты «до/после» всех курсов и репетиторов на платформе.</p></div>' +

      '<div class="verify-layout">' +
      '<div class="card section-card">' +
      '<h2>Как это работает</h2>' +
      '<ol class="steps-list">' +
      '<li><b>Загрузка.</b> Скан или фото официального score report (IELTS TRF, College Board PDF)</li>' +
      '<li><b>OCR + анализ.</b> ИИ извлекает данные: имя, дату, баллы, номер сертификата</li>' +
      '<li><b>Сверка.</b> Проверка по официальным базам верификации (IELTS Verification, College Board)</li>' +
      '<li><b>Анти-фрод.</b> Детекция следов редактирования изображения</li>' +
      '<li><b>Бейдж.</b> «✓ AI-verified» в профиле, отзывах и статистике «до/после»</li>' +
      '</ol>' +
      '</div>' +

      '<div class="card section-card">' +
      '<h2>Проверить мой результат</h2>' +
      '<div class="form-label">Экзамен</div>' +
      '<select class="input" id="vExam"><option>IELTS</option><option>SAT</option><option>TOEFL</option><option>GMAT</option><option>NUET</option></select>' +
      '<div class="form-label">Заявленный балл</div>' +
      '<input class="input" id="vScore" placeholder="Например: 7.5 или 1480">' +
      '<div class="form-label">Score report (файл)</div>' +
      '<label class="upload-zone" id="uploadZone">📄 Нажмите, чтобы выбрать файл<input type="file" id="vFile" hidden></label>' +
      '<button class="btn btn-primary btn-block" id="vStart">🤖 Запустить AI-проверку</button>' +
      '<div id="vPipeline"></div>' +
      '</div>' +
      '</div></div>';

    $('#vFile').onchange = e => {
      const f = e.target.files[0];
      if (f) $('#uploadZone').innerHTML = '✅ ' + UI.esc(f.name);
    };
    $('#uploadZone').onclick = () => $('#vFile').click();

    $('#vStart').onclick = () => {
      const score = $('#vScore').value.trim();
      if (!score) { UI.toast('Укажите заявленный балл', 'error'); return; }
      const exam = $('#vExam').value;
      const steps = [
        '📥 Загрузка документа…',
        '🔍 OCR: извлечение данных из score report…',
        '🌐 Сверка с базой верификации ' + (exam === 'SAT' ? 'College Board' : exam) + '…',
        '🕵️ Анти-фрод анализ изображения…'
      ];
      const pipe = $('#vPipeline');
      pipe.innerHTML = '';
      $('#vStart').disabled = true;
      let i = 0;
      const t = setInterval(async () => {
        if (!document.contains(pipe)) { clearInterval(t); return; }
        if (i > 0) pipe.children[i - 1].innerHTML += ' <b class="ok-text">✓</b>';
        if (i >= steps.length) {
          clearInterval(t);
          pipe.insertAdjacentHTML('beforeend',
            '<div class="verify-result pop">🛡️ <b>' + UI.esc(exam) + ' ' + UI.esc(score) + ' — подтверждено!</b>' +
            '<div class="muted small">Совпадение с официальной базой: 99.2% · следов редактирования не обнаружено</div></div>');
          const u = Store.currentUser();
          if (u) {
            const saved = await Store.addVerifiedExam({ exam, score, date: new Date().toISOString().slice(0, 10) });
            if (saved) UI.toast('Бейдж «✓ verified» добавлен в профиль', 'success');
          } else {
            UI.toast('Войдите, чтобы сохранить бейдж в профиль', 'info');
          }
          $('#vStart').disabled = false;
          return;
        }
        pipe.insertAdjacentHTML('beforeend', '<div class="pipe-step">' + steps[i] + '</div>');
        i++;
      }, 900);
    };
  };
})();
