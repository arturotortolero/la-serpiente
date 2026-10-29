/* La Serpiente — práctica de la S. Sin dependencias, sin build. */
(() => {
'use strict';

const APP_VERSION = '1.3'; // súbelo en cada cambio: se ve en el panel del adulto

/* ====================== utilidades ====================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};
const highlight = word => word.replace(/s/gi, m => `<b class="s">${m}</b>`);

/* ====================== idiomas ====================== */
const LANG_LIST = [
  { code: 'es', label: 'ES' },
  { code: 'ca', label: 'CA' },
  { code: 'fr', label: 'FR' }
];
const langData = code => (window.LANGS || {})[code];

/* ====================== progreso (localStorage) ====================== */
const KEY = 'serpiente.v1';
const defaults = () => ({ lang: 'es', stars: 0, again: {}, offWords: {}, offPos: {}, voice: '', rate: 0.85 });
let store = defaults();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) store = { ...store, ...JSON.parse(raw) };
} catch (e) { /* sin almacenamiento: seguimos en memoria */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };

let L = langData(store.lang) || langData('es');
const t = k => L.ui[k] || k;

/* Palabras disponibles según el panel del adulto */
const wkey = w => `${L.code}:${w.id}`;
const posOn = p => !store.offPos[`${L.code}:${p}`];
const isOn = w => !store.offWords[wkey(w)] && (w.position === null || posOn(w.position));
const pool = fn => L.words.filter(w => isOn(w) && fn(w));

/* Aviso de desarrollo: palabras que romperían la regla /θ/ del español peninsular */
if (L.code === 'es') {
  L.words.filter(w => /c[eiéí]|z/i.test(w.word)).forEach(w => console.warn('Palabra con /θ/:', w.word));
}

/* ====================== audio: voz y efectos ====================== */
let actx = null;
function getCtx() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!actx && C) actx = new C();
  if (actx && actx.state === 'suspended') actx.resume();
  return actx;
}

const Sound = {
  voice: null,
  current: null,
  missing: new Set(),

  /* Voces del idioma, las más naturales primero (neuronales / mejoradas / en la nube suenan menos robóticas). */
  voices() {
    if (!('speechSynthesis' in window)) return [];
    const want = L.voiceLang.toLowerCase();
    const norm = v => v.lang.replace('_', '-').toLowerCase();
    const score = v => {
      let n = 0;
      if (norm(v) === want) n += 10; else if (!norm(v).startsWith(want.slice(0, 2))) return -1;
      if (/natural|neural|online|premium|enhanced|mejorad|siri/i.test(v.name)) n += 20;
      if (/google|microsoft/i.test(v.name)) n += 6;
      if (/m[oó]nica|marisol|jorge|elvira|alvaro|álvaro|lucia|lucía|paulina|diego/i.test(v.name)) n += 4;
      if (/compact|espeak/i.test(v.name + v.voiceURI)) n -= 8;
      return n;
    };
    return speechSynthesis.getVoices().map(v => [score(v), v]).filter(x => x[0] >= 0)
      .sort((a, b) => b[0] - a[0]).map(x => x[1]);
  },

  pickVoice() {
    const vs = this.voices();
    this.voice = vs.find(v => v.voiceURI === store.voice) || vs[0] || null;
  },

  stop() {
    if ('speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
    if (this.current) { this.current.pause(); this.current = null; }
  },

  /* iOS solo deja hablar a la voz sintética tras un gesto del usuario: la "desbloqueamos" en el primer toque. */
  unlock() {
    getCtx();
    if (this.unlocked || !('speechSynthesis' in window)) return;
    this.unlocked = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  },

  /* Comprueba qué mp3 existen (en segundo plano) para decidir en el acto, dentro del gesto, entre mp3 y voz. */
  probe(ids) {
    if (!/^https?:$/.test(location.protocol)) return;
    this.probed = false;
    Promise.all(ids.map(id => {
      const path = `audio/${L.audioDir}/${id}.mp3`;
      return fetch(path, { method: 'HEAD' })
        .then(r => { (r.ok ? this.found : this.missing).add(path); })
        .catch(() => { this.missing.add(path); });
    })).then(() => { this.probed = true; });
  },
  found: new Set(),

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = L.voiceLang;
    if (this.voice) u.voice = this.voice;
    u.rate = store.rate || 0.85;
    speechSynthesis.speak(u);
  },

  /* Si existe audio/<idioma>/<id>.mp3 se usa; si no, voz sintética (o `fallback`). */
  say(id, text, fallback) {
    this.stop();
    const fall = () => (fallback ? fallback() : this.speak(text));
    const path = `audio/${L.audioDir}/${id}.mp3`;
    if (this.missing.has(path) || (!this.found.has(path) && this.probed)) return fall();
    const a = new Audio(path);
    this.current = a;
    a.onerror = () => { this.missing.add(path); if (this.current === a) fall(); };
    a.play().catch(() => {});
  },

  probed: false,
  word(w) { this.say(w.id, w.word); },
  syllable(s) { this.say(s.id, s.say); },

  /* "sssss": ruido filtrado, sin depender de que la voz lo lea bien */
  hiss() {
    this.say('sss', 'sssss', () => {
      const c = getCtx();
      if (!c) return;
      const dur = 2.2, rate = c.sampleRate;
      const buf = c.createBuffer(1, Math.floor(dur * rate), rate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000;
      const g = c.createGain();
      const now = c.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.35, now + 0.25);
      g.gain.setValueAtTime(0.35, now + dur - 0.5);
      g.gain.linearRampToValueAtTime(0, now + dur);
      src.connect(hp); hp.connect(g); g.connect(c.destination);
      src.start();
    });
  },

  /* Campanita suave de acierto; para los fallos no hay sonido. */
  chime() {
    const c = getCtx();
    if (!c) return;
    [660, 880].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      const t0 = c.currentTime + i * 0.12;
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + 0.45);
    });
  }
};
document.addEventListener('pointerdown', () => Sound.unlock(), { once: true, capture: true });
if ('speechSynthesis' in window) {
  Sound.pickVoice();
  speechSynthesis.onvoiceschanged = () => Sound.pickVoice();
}

/* ====================== micrófono ====================== */
let micStream = null;
async function getMic() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic-api');
  if (micStream && micStream.active) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  return micStream;
}
function releaseMic() {
  if (micStream) { micStream.getTracks().forEach(tr => tr.stop()); micStream = null; }
}
const micError = e => (e && e.message === 'no-mic-api' ? t('micUnavailable') : t('micDenied'));
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseMic(); });

/* ====================== efectos visuales ====================== */
const fx = $('#fx');
function confetti(n = 30) {
  const items = ['⭐', '🎉', '✨', '🐍', '🍓', '🎈', '🌟'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'fall';
    s.textContent = items[i % items.length];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    s.style.animationDelay = Math.random() * 0.8 + 's';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 5500);
  }
}
function updateStars() { $$('.star-count').forEach(e => { e.textContent = store.stars; }); }
function addStar(fromEl) {
  store.stars++; save(); updateStars();
  if (fromEl) {
    const r = fromEl.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'flystar'; s.textContent = '⭐';
    s.style.left = r.left + r.width / 2 + 'px';
    s.style.top = r.top + r.height / 2 + 'px';
    fx.appendChild(s);
    setTimeout(() => s.remove(), 1000);
  }
}
function celebrate({ stars = 0, onAgain }) {
  confetti(36);
  Sound.chime();
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="panel">
    <div class="trophy">🏆</div>
    <h2>${t('celebrate')}</h2>
    <div class="stars-earned">${'⭐'.repeat(Math.min(stars, 10))}</div>
    <div class="row">
      <button class="btn round c-sky" data-a="home" aria-label="Inicio">🏠</button>
      <button class="btn round c-green" data-a="again" aria-label="Otra vez">🔁</button>
    </div></div>`;
  document.body.appendChild(o);
  $('[data-a=home]', o).onclick = () => { o.remove(); go(screenHome); };
  $('[data-a=again]', o).onclick = () => { o.remove(); onAgain(); };
}

/* ====================== navegación ====================== */
const app = $('#app');
let cleanup = null;
function go(fn, ...args) {
  if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
  Sound.stop();
  $$('.overlay').forEach(o => o.remove());
  fx.innerHTML = '';
  app.innerHTML = '';
  window.scrollTo(0, 0);
  fn(...args);
}
const topbar = title => `<header class="topbar">
  <button class="btn icon c-sky" data-act="home" aria-label="Inicio">🏠</button>
  <h1>${title}</h1>
  <div class="stars">⭐ <span class="star-count">${store.stars}</span></div></header>`;
const bindHome = () => { $('[data-act=home]').onclick = () => go(screenHome); };

const POSITIONS = ['inicio', 'medio', 'final'];
function posIcon(p) {
  const on = p === 'mezclado' ? [1, 1, 1] : POSITIONS.map(x => +(x === p));
  return `<span class="slots">${on.map(v => `<i class="${v ? 'on' : ''}">${v ? 'S' : ''}</i>`).join('')}</span>`;
}

/* ====================== 0. Inicio ====================== */
function screenHome() {
  releaseMic();
  app.innerHTML = `<div class="home">
    <div class="home-top">
      <div class="langs">${LANG_LIST.map(l => {
        const ok = !!langData(l.code);
        return `<button class="chip ${l.code === L.code ? 'on' : ''}" data-lang="${l.code}" ${ok ? '' : 'disabled'}>${l.label}${ok ? '' : `<small>${t('soon')}</small>`}</button>`;
      }).join('')}</div>
      <div class="stars big">⭐ <span class="star-count">${store.stars}</span></div>
    </div>
    <h1 class="logo">${t('appTitle')}</h1>
    <div class="menu">
      <button class="btn c-green" data-go="warmup"><span class="ico">🐍</span>${t('warmup')}</button>
      <button class="btn c-sky" data-go="listen"><span class="ico">🗣️</span>${t('listen')}</button>
      <button class="btn c-peach" data-go="train"><span class="ico">🚂</span>${t('train')}</button>
      <button class="btn c-pink" data-go="syllables"><span class="ico">🔤</span>${t('syllables')}</button>
    </div>
    <button class="gear" aria-label="${t('adultPanel')}">⚙️</button>
  </div>`;
  const screens = { warmup: screenWarmup, listen: screenListenSetup, train: screenTrainSetup, syllables: screenSyllables };
  $$('[data-go]').forEach(b => { b.onclick = () => { getCtx(); go(screens[b.dataset.go]); }; });
  $$('[data-lang]').forEach(b => {
    b.onclick = () => {
      const d = langData(b.dataset.lang);
      if (!d) return;
      store.lang = b.dataset.lang; save(); L = d; Sound.pickVoice();
      Sound.probe(['sss', ...L.syllables.map(x => x.id), ...L.words.map(w => w.id)]);
      go(screenHome);
    };
  });
  // Pulsación larga (~1 s) para abrir el panel del adulto
  const gear = $('.gear');
  let timer = 0;
  const cancel = () => clearTimeout(timer);
  gear.addEventListener('pointerdown', () => { timer = setTimeout(openAdultPanel, 900); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => gear.addEventListener(ev, cancel));
  gear.addEventListener('contextmenu', e => e.preventDefault());
}

/* ====================== 1. Calentamiento ====================== */
function screenWarmup() {
  const MAX = 14, FULL = 3.5, THRESH = 0.25; // FULL: segundos de sonido para llenar la serpiente
  app.innerHTML = topbar(t('warmup')) + `<main>
    <div class="snake" id="snake"><div class="head"><span class="tongue"></span></div>
      ${Array.from({ length: MAX }, (_, i) => `<div class="seg" style="--i:${i}"></div>`).join('')}</div>
    <div class="meter"><i id="fill"></i></div>
    <div class="row">
      <button class="btn round c-sky" id="hear" aria-label="Escuchar">🔊</button>
      <button class="btn pill c-pink" id="mic">🎤 ${t('yourTurn')}</button>
    </div>
    <p class="msg" id="msg"></p></main>`;
  bindHome();
  const segs = $$('.seg'), fill = $('#fill'), msg = $('#msg'), micBtn = $('#mic');
  const setLen = n => segs.forEach((s, i) => s.classList.toggle('on', i < n));
  setLen(2);

  let running = false, starting = false, raf = 0, acc = 0, last = 0, smooth = 0, src = null, analyser = null;
  const idleLabel = `🎤 ${t('yourTurn')}`;

  function stop() {
    running = false; cancelAnimationFrame(raf);
    if (src) { try { src.disconnect(); } catch (e) {} src = null; }
    micBtn.classList.remove('listening'); micBtn.textContent = idleLabel;
    fill.style.width = '0%';
  }
  cleanup = () => { stop(); releaseMic(); };

  async function start() {
    if (starting) return;
    starting = true;
    getCtx();
    try {
      const stream = await getMic();
      src = actx.createMediaStreamSource(stream);
      analyser = actx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
    } catch (e) { msg.textContent = micError(e); starting = false; return; }
    starting = false;
    msg.textContent = '';
    running = true; acc = 0; smooth = 0; last = performance.now();
    setLen(2);
    micBtn.classList.add('listening'); micBtn.textContent = `⏹ ${t('stop')}`;
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      if (!running) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const d = (buf[i] - 128) / 128; sum += d * d; }
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 8);
      smooth += (level - smooth) * 0.3;
      fill.style.width = Math.round(smooth * 100) + '%';
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      if (level > THRESH) acc += dt;
      setLen(2 + Math.floor(Math.min(acc / FULL, 1) * (MAX - 2)));
      if (acc >= FULL) {
        stop(); setLen(MAX); msg.textContent = t('warmupDone');
        addStar(micBtn); confetti(18); Sound.chime();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
  }
  micBtn.onclick = () => (running ? stop() : start());
  $('#hear').onclick = () => { stop(); Sound.hiss(); };
}

/* ====================== 2. Escucha y repite ====================== */
function screenListenSetup() {
  const opts = [...POSITIONS, 'mezclado'];
  const has = p => pool(w => w.hasS && (p === 'mezclado' || w.position === p)).length > 0;
  app.innerHTML = topbar(t('listen')) + `<main><div class="pos-grid">${opts.map((p, i) =>
    `<button class="btn ${['c-green', 'c-sky', 'c-peach', 'c-lilac'][i]}" data-pos="${p}" ${has(p) ? '' : 'disabled'}>${posIcon(p)}<span>${t('pos_' + p)}</span></button>`).join('')}
  </div></main>`;
  bindHome();
  $$('[data-pos]').forEach(b => { b.onclick = () => go(screenListen, b.dataset.pos); });
}

function buildListenQueue(pos) {
  if (pos !== 'mezclado') return shuffle(pool(w => w.hasS && w.position === pos)).slice(0, 8);
  // mezclado: reparte entre las posiciones activas
  const groups = POSITIONS.map(p => shuffle(pool(w => w.hasS && w.position === p))).filter(g => g.length);
  const q = [];
  for (let i = 0; q.length < 8 && groups.some(g => g.length); i++) {
    const g = groups[i % groups.length];
    if (g.length) q.push(g.shift());
  }
  return shuffle(q);
}

function screenListen(pos) {
  const queue = buildListenQueue(pos);
  if (!queue.length) { go(screenHome); return; }
  const retried = new Set();
  let idx = 0, earned = 0, locked = false;

  app.innerHTML = topbar(t('listen')) + `<main class="listen-main">
    <div class="stage">
      <div class="card" id="card"><div class="emoji"></div><div class="word"></div></div>
      <div class="progress"><i id="bar"></i></div>
    </div>
    <div class="stage">
      <button class="btn round big-say c-sky" id="say" aria-label="Escuchar">🔊</button>
      <div class="row">
        <button class="btn round c-green" id="ok" aria-label="Bien">✅</button>
        <button class="btn round c-peach" id="again" aria-label="Otra vez">🔁</button>
      </div>
    </div></main>`;
  bindHome();
  const card = $('#card');

  function showCard() {
    const w = queue[idx];
    $('.emoji', card).textContent = w.emoji;
    $('.word', card).innerHTML = highlight(w.word);
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    $('#bar').style.width = Math.round((idx / queue.length) * 100) + '%';
    locked = false;
    Sound.word(w);
  }
  function next() {
    idx++;
    if (idx >= queue.length) {
      $('#bar').style.width = '100%';
      celebrate({ stars: earned, onAgain: () => go(screenListen, pos) });
      return;
    }
    showCard();
  }

  $('#say').onclick = () => Sound.word(queue[idx]);
  card.onclick = () => Sound.word(queue[idx]);
  $('#ok').onclick = e => {
    if (locked) return;
    locked = true; earned++; addStar(e.currentTarget); Sound.chime();
    setTimeout(next, 650);
  };
  $('#again').onclick = () => {
    if (locked) return;
    locked = true;
    const w = queue[idx];
    store.again[wkey(w)] = (store.again[wkey(w)] || 0) + 1; save();
    if (!retried.has(w.id)) { retried.add(w.id); queue.push(w); } // una segunda oportunidad al final
    next();
  };

  showCard();
}

/* ====================== 3. ¿Tiene S? (los vagones) ====================== */
function screenTrainSetup() {
  app.innerHTML = topbar(t('train')) + `<main><div class="pos-grid">${POSITIONS.map((p, i) => {
    const ok = pool(w => w.hasS && w.position === p).length > 0 && pool(w => !w.hasS).length > 0;
    return `<button class="btn ${['c-green', 'c-sky', 'c-peach'][i]}" data-pos="${p}" ${ok ? '' : 'disabled'}>${posIcon(p)}<span>${t('pos_' + p)}</span></button>`;
  }).join('')}</div></main>`;
  bindHome();
  $$('[data-pos]').forEach(b => { b.onclick = () => go(screenTrain, b.dataset.pos); });
}

function screenTrain(level) {
  const withS = shuffle(pool(w => w.hasS && w.position === level));
  const without = shuffle(pool(w => !w.hasS));
  const n = Math.min(4, withS.length, without.length);
  const queue = shuffle([...withS.slice(0, n), ...without.slice(0, n)]);
  let idx = 0, earned = 0, tries = 0, busy = false, selected = false;

  app.innerHTML = topbar(t('train')) + `<div class="train-stage" id="stage">
    <div class="cardwrap" id="wrap">
      <div class="card" id="card"><div class="emoji"></div></div>
      <button class="btn round c-sky" id="say" aria-label="Escuchar">🔊</button>
    </div>
    <div class="train">
      <div class="engine">🚂</div>
      <button class="wagon yes" data-ans="yes"><span class="wicon">🐍</span>${t('withS')}<i class="wheel l"></i><i class="wheel r"></i></button>
      <button class="wagon no" data-ans="no"><span class="wicon">🤐</span>${t('withoutS')}<i class="wheel l"></i><i class="wheel r"></i></button>
    </div></div>`;
  bindHome();
  const stage = $('#stage'), wrap = $('#wrap'), card = $('#card'), wagons = $$('.wagon');

  function showCard() {
    const w = queue[idx];
    $('.emoji', card).textContent = w.emoji;
    card.style.transition = 'none'; card.style.transform = 'none'; card.style.opacity = '1';
    card.classList.remove('selected'); selected = false; stage.classList.remove('armed');
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    tries = 0; busy = false;
    setTimeout(() => Sound.word(w), 300);
  }

  async function answer(wagon) {
    if (busy) return;
    busy = true;
    const w = queue[idx];
    const ok = (wagon.dataset.ans === 'yes') === w.hasS;
    wagons.forEach(x => x.classList.remove('hover'));
    card.classList.remove('selected'); selected = false; stage.classList.remove('armed');
    if (ok) {
      // la tarjeta vuela al vagón
      card.style.transition = 'none'; card.style.transform = 'none'; void card.offsetWidth;
      const c = card.getBoundingClientRect(), r = wagon.getBoundingClientRect();
      const dx = r.left + r.width / 2 - (c.left + c.width / 2);
      const dy = r.top + r.height / 2 - (c.top + c.height / 2);
      card.style.transition = 'transform .45s ease-in, opacity .45s';
      card.style.transform = `translate(${dx}px, ${dy}px) scale(.2)`;
      card.style.opacity = '0';
      Sound.chime();
      if (tries === 0) { earned++; addStar(wagon); }
      await sleep(450);
      wagon.classList.remove('bounce'); void wagon.offsetWidth; wagon.classList.add('bounce');
      await sleep(450);
      idx++;
      if (idx >= queue.length) { celebrate({ stars: earned, onAgain: () => go(screenTrain, level) }); return; }
      showCard();
    } else {
      // vuelve a su sitio, sin sonido de error, y se repite la palabra
      tries++;
      card.style.transition = 'transform .3s'; card.style.transform = 'none';
      wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
      setTimeout(() => Sound.word(w), 350);
      await sleep(450);
      busy = false;
    }
  }

  // Arrastrar o tocar-y-tocar
  let drag = null;
  const wagonAt = (x, y) => wagons.find(wg => {
    const r = wg.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top - 20 && y <= r.bottom + 20;
  });
  card.addEventListener('pointerdown', e => {
    if (busy) return;
    card.setPointerCapture(e.pointerId);
    card.style.transition = 'none';
    drag = { x: e.clientX, y: e.clientY, moved: false };
  });
  card.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 8) drag.moved = true;
    if (drag.moved) {
      card.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
      const over = wagonAt(e.clientX, e.clientY);
      wagons.forEach(x => x.classList.toggle('hover', x === over));
    }
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    wagons.forEach(x => x.classList.remove('hover'));
    if (d.moved) {
      const target = wagonAt(e.clientX, e.clientY);
      if (target) answer(target);
      else { card.style.transition = 'transform .3s'; card.style.transform = 'none'; }
    } else {
      selected = !selected;
      card.classList.toggle('selected', selected);
      stage.classList.toggle('armed', selected);
      Sound.word(queue[idx]);
    }
  };
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', () => { drag = null; card.style.transition = 'transform .3s'; card.style.transform = 'none'; });
  wagons.forEach(wg => {
    wg.onclick = () => {
      if (!busy) answer(wg); // basta con tocar el vagón; arrastrar o tocar la tarjeta primero también vale
    };
  });
  $('#say').onclick = () => Sound.word(queue[idx]);

  if (!queue.length) { go(screenHome); return; }
  showCard();
}

/* ====================== 4. Sílabas ====================== */
function screenSyllables() {
  const sylOf = w => L.syllables.find(s => w.word.toLowerCase().startsWith(s.id));
  const candidates = () => pool(w => w.hasS && w.position === 'inicio' && sylOf(w));
  let mode = 'free', queue = [], idx = 0, earned = 0, tries = 0, busy = false;

  app.innerHTML = topbar(t('syllables')) + `<main class="syl-main">
    <div class="stage">
      <div class="card" id="card" style="min-height:140px"></div>
      <button class="btn pill c-lemon" id="playBtn" ${candidates().length ? '' : 'disabled'}>🎮 ${t('play')}</button>
    </div>
    <div class="syl-row">${L.syllables.map(s => `<button class="btn" data-syl="${s.id}" style="background:${s.color}">${s.text}</button>`).join('')}</div>
  </main>`;
  bindHome();
  const card = $('#card'), playBtn = $('#playBtn');

  const idle = () => { card.innerHTML = '<div class="emoji">👆</div>'; };
  idle();

  function showWord() {
    const w = queue[idx];
    card.innerHTML = `<div class="emoji">${w.emoji}</div>`;
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    tries = 0; busy = false;
    setTimeout(() => Sound.word(w), 250);
  }

  playBtn.onclick = () => {
    mode = 'game'; queue = shuffle(candidates()).slice(0, 8); idx = 0; earned = 0;
    playBtn.hidden = true; showWord();
  };
  card.onclick = () => { if (mode === 'game' && queue[idx]) Sound.word(queue[idx]); };

  $$('[data-syl]').forEach(b => {
    b.onclick = async () => {
      const s = L.syllables.find(x => x.id === b.dataset.syl);
      if (mode === 'free') { Sound.syllable(s); b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); return; }
      if (busy) return;
      const w = queue[idx];
      if (sylOf(w).id === s.id) {
        busy = true;
        Sound.chime();
        if (tries === 0) { earned++; addStar(b); }
        card.classList.add('bounce');
        await sleep(900);
        card.classList.remove('bounce');
        idx++;
        if (idx >= queue.length) {
          celebrate({ stars: earned, onAgain: () => go(screenSyllables) });
          return;
        }
        showWord();
      } else {
        tries++;
        b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        setTimeout(() => Sound.word(w), 350);
      }
    };
  });
}

/* ====================== Panel del adulto ====================== */
function openAdultPanel() {
  if ($('.adult')) return;
  const o = document.createElement('div');
  o.className = 'overlay adult';
  const draw = () => {
    const keep = o.scrollTop;
    const top = Object.entries(store.again)
      .filter(([k, n]) => k.startsWith(L.code + ':') && n > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 10)
      .map(([k, n]) => ({ w: L.words.find(x => `${L.code}:${x.id}` === k), n })).filter(x => x.w);
    const chip = w => `<button class="chip ${store.offWords[wkey(w)] ? 'off' : ''}" data-w="${w.id}">${w.emoji} ${w.word}</button>`;
    o.innerHTML = `<div class="inner">
      <div class="row" style="justify-content:space-between"><h2>${t('adultPanel')}</h2>
        <button class="btn c-sky" data-a="close">${t('close')}</button></div>
      <h3>${t('mostAgain')}</h3>
      ${top.length ? `<ol>${top.map(x => `<li>${x.w.emoji} ${x.w.word} — <b>${x.n}</b></li>`).join('')}</ol>` : `<p>${t('noneYet')}</p>`}
      <h3>${t('voice')}</h3>
      <div class="row" style="justify-content:flex-start">
        <select id="voiceSel" class="sel"><option value="">${t('voiceAuto')}</option>${Sound.voices().map(v => `<option value="${v.voiceURI}" ${v.voiceURI === store.voice ? 'selected' : ''}>${v.name} (${v.lang})</option>`).join('')}</select>
        <select id="rateSel" class="sel">${[0.7, 0.8, 0.85, 0.95, 1].map(r => `<option value="${r}" ${r === store.rate ? 'selected' : ''}>${t('speed')} ${r}</option>`).join('')}</select>
        <button class="btn c-lemon" id="tryVoice">🔊 ${t('tryVoice')}</button>
      </div>
      ${Sound.voices().length ? '' : `<p class="hint">${t('noVoices')}</p>`}
      <h3>${t('positions')}</h3>
      <div class="chips">${POSITIONS.map(p => `<button class="chip ${posOn(p) ? 'on' : 'off'}" data-p="${p}">${t('pos_' + p)}</button>`).join('')}</div>
      <h3>${t('words')}</h3>
      ${POSITIONS.map(p => `<div class="chips">${L.words.filter(w => w.position === p).map(chip).join('')}</div>`).join('')}
      <h3>${t('noS')}</h3>
      <div class="chips">${L.words.filter(w => !w.hasS).map(chip).join('')}</div>
      <div><button class="btn c-red" data-a="reset">${t('reset')}</button></div>
      <p class="hint">v${APP_VERSION}</p></div>`;
    $('#voiceSel', o).onchange = e => { store.voice = e.target.value; save(); Sound.pickVoice(); Sound.speak(L.words[0].word); };
    $('#rateSel', o).onchange = e => { store.rate = +e.target.value; save(); Sound.speak(L.words[0].word); };
    $('#tryVoice', o).onclick = () => Sound.speak(L.words[0].word);
    $$('[data-p]', o).forEach(b => b.onclick = () => {
      const k = `${L.code}:${b.dataset.p}`; store.offPos[k] = !store.offPos[k]; save(); draw();
    });
    $$('[data-w]', o).forEach(b => b.onclick = () => {
      const k = `${L.code}:${b.dataset.w}`; store.offWords[k] = !store.offWords[k]; save(); draw();
    });
    $('[data-a=close]', o).onclick = () => { o.remove(); go(screenHome); };
    $('[data-a=reset]', o).onclick = () => {
      if (!confirm(t('resetConfirm'))) return;
      const { lang, voice, rate } = store; store = { ...defaults(), lang, voice, rate }; save(); draw();
    };
    o.scrollTop = keep;
  };
  draw();
  document.body.appendChild(o);
}

/* ====================== arranque ====================== */
Sound.probe(['sss', ...L.syllables.map(x => x.id), ...L.words.map(w => w.id)]);
screenHome();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // Cuando se instala una versión nueva, recarga una vez para usarla
  let reloaded = false, hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded) { reloaded = true; location.reload(); }
    hadController = true;
  });
}
})();
