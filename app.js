/* La Serpiente — práctica de la S. Sin dependencias, sin build. */
(() => {
'use strict';

const APP_VERSION = '2.0'; // súbelo en cada cambio: se ve en el panel del adulto

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
const defaults = () => ({
  lang: 'es', stars: 0,
  again: {},          // veces que se marcó 🔁 (estadística del panel)
  hard: {},           // palabras pendientes de repasar (se quitan al marcar ✅)
  stickers: {},       // pegatinas ganadas: una palabra dicha bien (✅) la primera vez
  prizes: [], sessions: 0,
  offWords: {}, offPos: {},
  voice: '', rate: 0.85, roundSize: 8
});
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

/* Voces grabadas por la familia, guardadas en este dispositivo (IndexedDB). */
const Clips = {
  db: null,
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('serpiente-audio', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('clips');
        r.onsuccess = () => { this.db = r.result; res(true); };
        r.onerror = () => res(false);
      } catch (e) { res(false); }
    });
  },
  store(mode) { return this.db.transaction('clips', mode).objectStore('clips'); },
  all() {
    return new Promise(res => {
      const out = [];
      if (!this.db) return res(out);
      const rq = this.store('readonly').openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { out.push([c.key, c.value]); c.continue(); } else res(out); };
      rq.onerror = () => res(out);
    });
  },
  put(key, blob) { return new Promise(res => { if (!this.db) return res(false); const r = this.store('readwrite').put(blob, key); r.onsuccess = () => res(true); r.onerror = () => res(false); }); },
  del(key) { return new Promise(res => { if (!this.db) return res(false); const r = this.store('readwrite').delete(key); r.onsuccess = () => res(true); r.onerror = () => res(false); }); }
};

const Sound = {
  clips: new Map(),   // id -> URL del audio grabado
  async loadClips() {
    this.clips.forEach(u => URL.revokeObjectURL(u));
    this.clips.clear();
    if (!Clips.db && !(await Clips.open())) return;
    (await Clips.all()).forEach(([k, blob]) => {
      if (k.startsWith(L.code + ':')) this.clips.set(k.slice(L.code.length + 1), URL.createObjectURL(blob));
    });
  },
  setClip(id, blob) {
    const old = this.clips.get(id); if (old) URL.revokeObjectURL(old);
    this.clips.set(id, URL.createObjectURL(blob));
  },
  dropClip(id) {
    const old = this.clips.get(id); if (old) URL.revokeObjectURL(old);
    this.clips.delete(id);
  },

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

  /* Prioridad: grabación de la familia → audio/<idioma>/<id>.mp3 → voz sintética (o `fallback`). */
  say(id, text, fallback) {
    this.stop();
    const fall = () => (fallback ? fallback() : this.speak(text));
    const clip = this.clips.get(id);
    if (clip) {
      const a = new Audio(clip);
      this.current = a;
      a.onerror = () => { if (this.current === a) fall(); };
      a.play().catch(() => {});
      return;
    }
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

  /* Pitido muy suave (recoger una estrella del camino). */
  blip(freq = 700) {
    const c = getCtx();
    if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime;
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + 0.3);
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
/* Pegatina nueva en el álbum */
function stickerPop(emoji) {
  const d = document.createElement('div');
  d.className = 'sticker-pop';
  d.innerHTML = `<div class="sp-emoji">${emoji}</div><div class="sp-text">${t('newSticker')}</div>`;
  fx.appendChild(d);
  Sound.chime();
  setTimeout(() => d.remove(), 1500);
}

/* Aviso amable de descanso: tras 3 rondas en ~25 minutos. Solo informa. */
const recentRounds = [];
function noteRound() {
  const now = Date.now();
  recentRounds.push(now);
  while (recentRounds.length && now - recentRounds[0] > 25 * 60 * 1000) recentRounds.shift();
  if (recentRounds.length >= 3) { recentRounds.length = 0; return true; }
  return false;
}

function celebrate({ stars = 0, onAgain, rest = false, prize = null }) {
  confetti(36);
  Sound.chime();
  const o = document.createElement('div');
  o.className = 'overlay';
  o.innerHTML = `<div class="panel">
    <div class="trophy">🏆</div>
    <h2>${t('celebrate')}</h2>
    <div class="stars-earned">${'⭐'.repeat(Math.min(stars, 10))}</div>
    ${prize ? `<div class="prize">${t('prizeLabel')} <span>${prize}</span></div>` : ''}
    ${rest ? `<p class="rest">${t('restHint')}</p>` : ''}
    <div class="row">
      <button class="btn round c-sky" data-a="home" aria-label="Inicio">🏠</button>
      <button class="btn round c-green" data-a="again" aria-label="Otra vez">🔁</button>
    </div></div>`;
  document.body.appendChild(o);
  $('[data-a=home]', o).onclick = () => { o.remove(); go(screenHome); };
  $('[data-a=again]', o).onclick = () => { o.remove(); onAgain(); };
}

/* Fin de una ronda: dentro de una sesión avisa a la sesión; fuera, celebra. */
function finishRound(opts, stars, onAgain) {
  if (opts && opts.onFinish) { opts.onFinish(stars); return; }
  celebrate({ stars, onAgain, rest: noteRound() });
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
const dots = s => `<span class="dots">${Array.from({ length: s.n }, (_, i) => `<i class="${i < s.i ? 'done' : i === s.i ? 'now' : ''}"></i>`).join('')}</span>`;
const topbar = (title, session) => `<header class="topbar">
  <button class="btn icon c-sky" data-act="home" aria-label="Inicio">🏠</button>
  <h1>${session ? dots(session) : title}</h1>
  <div class="stars">⭐ <span class="star-count">${store.stars}</span></div></header>`;
const bindHome = () => { $('[data-act=home]').onclick = () => go(screenHome); };

const POSITIONS = ['inicio', 'medio', 'final'];
const roundSize = () => store.roundSize || 8;
function posIcon(p) {
  if (p === 'repaso') return '<span class="ico">🔁</span>';
  const on = p === 'mezclado' ? [1, 1, 1] : POSITIONS.map(x => +(x === p));
  return `<span class="slots">${on.map(v => `<i class="${v ? 'on' : ''}">${v ? 'S' : ''}</i>`).join('')}</span>`;
}
const sWords = () => L.words.filter(w => w.hasS);
const stickerCount = () => sWords().filter(w => store.stickers[wkey(w)]).length;

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
      <button class="btn c-lemon wide" data-go="session"><span class="ico">🌟</span>${t('session')}</button>
      <button class="btn c-green" data-go="warmup"><span class="ico">🐍</span>${t('warmup')}</button>
      <button class="btn c-sky" data-go="listen"><span class="ico">🗣️</span>${t('listen')}</button>
      <button class="btn c-peach" data-go="train"><span class="ico">🚂</span>${t('train')}</button>
      <button class="btn c-pink" data-go="syllables"><span class="ico">🔤</span>${t('syllables')}</button>
      <button class="btn c-lilac wide" data-go="album"><span class="ico">📒</span>${t('album')} <b>${stickerCount()}/${sWords().length}</b></button>
    </div>
    <button class="gear" aria-label="${t('adultPanel')}">⚙️</button>
  </div>`;
  const screens = {
    session: runSession,
    warmup: () => screenWarmup(),
    listen: screenListenSetup,
    train: screenTrainSetup,
    syllables: () => screenSyllables(),
    album: screenAlbum
  };
  $$('[data-go]').forEach(b => { b.onclick = () => { getCtx(); go(screens[b.dataset.go]); }; });
  $$('[data-lang]').forEach(b => {
    b.onclick = () => {
      const d = langData(b.dataset.lang);
      if (!d) return;
      store.lang = b.dataset.lang; save(); L = d; Sound.pickVoice();
      Sound.probe(audioIds()); Sound.loadClips();
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
const audioIds = () => ['sss', ...L.syllables.map(x => x.id), ...L.words.map(w => w.id)];

/* ====================== 1. La serpiente: trazar la S ====================== */
/* El niño sigue con el dedo el camino de una S grande mientras hace «sssss».
   No se mide el sonido: el adulto escucha. El dedo marca el ritmo del soplo. */
const S_PATH = 'M 235 90 C 235 20, 65 20, 65 105 C 65 190, 235 205, 235 295 C 235 380, 65 380, 65 310';

function screenWarmup(opts = {}) {
  app.innerHTML = topbar(t('warmup'), opts.session) + `<main class="trace-main">
    <svg id="trace" viewBox="0 0 300 400" aria-label="S">
      <path id="track" class="track" d="${S_PATH}"/>
      <path id="prog" class="prog" d="${S_PATH}"/>
      <g id="starsG"></g>
      <g id="head" class="shead"><circle r="24"/>
        <circle cx="-8" cy="-6" r="6" fill="#fff"/><circle cx="8" cy="-6" r="6" fill="#fff"/>
        <circle cx="-8" cy="-6" r="2.5" fill="#3b3a4a"/><circle cx="8" cy="-6" r="2.5" fill="#3b3a4a"/>
        <path d="M -8 10 Q 0 16 8 10" stroke="#3b3a4a" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    </svg>
    <button class="btn round c-sky" id="hear" aria-label="Escuchar">🔊</button>
    <p class="hint">${t('traceHint')}</p></main>`;
  bindHome();

  const svg = $('#trace'), track = $('#track'), prog = $('#prog'), head = $('#head'), starsG = $('#starsG');
  const len = track.getTotalLength(), N = 300;
  prog.style.strokeDasharray = len;
  prog.style.strokeDashoffset = len;
  const pts = Array.from({ length: N + 1 }, (_, i) => { const p = track.getPointAtLength(len * i / N); return { x: p.x, y: p.y }; });
  const stars = [0.25, 0.5, 0.75, 1].map(m => {
    const idx = Math.round(m * N), p = pts[idx];
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    el.setAttribute('x', p.x); el.setAttribute('y', p.y + 11);
    el.setAttribute('text-anchor', 'middle'); el.setAttribute('font-size', '32');
    el.textContent = '⭐'; starsG.appendChild(el);
    return { idx, el, got: false };
  });

  let pos = 0, dragging = false, done = false, alive = true;
  cleanup = () => { alive = false; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const toSvg = e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  function render() {
    const p = pts[pos];
    head.setAttribute('transform', `translate(${p.x},${p.y})`);
    prog.style.strokeDashoffset = len * (1 - pos / N);
    stars.forEach((s, i) => {
      if (!s.got && pos >= s.idx - 2) { s.got = true; s.el.classList.add('got'); if (i < 3) Sound.blip(600 + i * 150); }
    });
  }
  render();

  svg.addEventListener('pointerdown', e => {
    if (done) return;
    if (dist(toSvg(e), pts[pos]) < 70) { dragging = true; svg.setPointerCapture(e.pointerId); head.classList.add('grab'); }
  });
  svg.addEventListener('pointermove', e => {
    if (!dragging || done) return;
    const q = toSvg(e);
    let best = pos, bd = Infinity;
    for (let i = pos; i <= Math.min(N, pos + 40); i++) { const d = dist(q, pts[i]); if (d < bd) { bd = d; best = i; } }
    if (bd < 75 && best > pos) { pos = best; render(); }
    if (pos >= N) finish();
  });
  const release = () => { dragging = false; head.classList.remove('grab'); };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);

  function finish() {
    done = true; release();
    Sound.chime();
    addStar(head.querySelector('circle'));
    setTimeout(() => { if (alive) finishRound(opts, 1, () => go(screenWarmup)); }, 700);
  }
  $('#hear').onclick = () => Sound.hiss();
}

/* ====================== 2. Escucha y repite ====================== */
const hardWords = () => pool(w => w.hasS && store.hard[wkey(w)] > 0)
  .sort((a, b) => store.hard[wkey(b)] - store.hard[wkey(a)]);

function screenListenSetup() {
  const opts = [...POSITIONS, 'mezclado'];
  const has = p => pool(w => w.hasS && (p === 'mezclado' || w.position === p)).length > 0;
  const hard = hardWords().length;
  app.innerHTML = topbar(t('listen')) + `<main><div class="pos-grid">${opts.map((p, i) =>
    `<button class="btn ${['c-green', 'c-sky', 'c-peach', 'c-lilac'][i]}" data-pos="${p}" ${has(p) ? '' : 'disabled'}>${posIcon(p)}<span>${t('pos_' + p)}</span></button>`).join('')}
    <button class="btn c-lemon wide" data-pos="repaso" ${hard ? '' : 'disabled'}>${posIcon('repaso')}<span>${t('pos_repaso')} ${hard ? `<b>${hard}</b>` : ''}</span></button>
  </div></main>`;
  bindHome();
  $$('[data-pos]').forEach(b => { b.onclick = () => go(screenListen, b.dataset.pos); });
}

function buildListenQueue(pos, size, hardFirst) {
  if (pos === 'repaso') return hardWords().slice(0, size);
  let q;
  if (pos !== 'mezclado') {
    q = shuffle(pool(w => w.hasS && w.position === pos));
  } else {
    // reparte entre las posiciones activas
    const groups = POSITIONS.map(p => shuffle(pool(w => w.hasS && w.position === p))).filter(g => g.length);
    q = [];
    for (let i = 0; groups.some(g => g.length); i++) { const g = groups[i % groups.length]; if (g.length) q.push(g.shift()); }
  }
  if (hardFirst) {
    const h = hardWords().filter(w => pos === 'mezclado' || w.position === pos).slice(0, 2);
    q = [...h, ...q.filter(w => !h.includes(w))];
  }
  return q.slice(0, size);
}

function screenListen(pos, opts = {}) {
  const size = opts.count || roundSize();
  const queue = buildListenQueue(pos, size, opts.hardFirst);
  if (!queue.length) { if (opts.onFinish) opts.onFinish(0); else go(screenHome); return; }
  const retried = new Set();
  let idx = 0, earned = 0, locked = false, alive = true;
  cleanup = () => { alive = false; };

  app.innerHTML = topbar(t('listen'), opts.session) + `<main class="listen-main">
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
    if (!alive) return;
    idx++;
    if (idx >= queue.length) {
      $('#bar').style.width = '100%';
      finishRound(opts, earned, () => go(screenListen, pos));
      return;
    }
    showCard();
  }

  $('#say').onclick = () => Sound.word(queue[idx]);
  card.onclick = () => Sound.word(queue[idx]);
  $('#ok').onclick = e => {
    if (locked) return;
    locked = true; earned++;
    const w = queue[idx], k = wkey(w), isNew = !store.stickers[k];
    store.stickers[k] = true;
    delete store.hard[k];
    addStar(e.currentTarget);
    if (isNew) stickerPop(w.emoji); else Sound.chime();
    setTimeout(next, isNew ? 1500 : 650);
  };
  $('#again').onclick = () => {
    if (locked) return;
    locked = true;
    const w = queue[idx], k = wkey(w);
    store.again[k] = (store.again[k] || 0) + 1;
    store.hard[k] = Math.min(3, (store.hard[k] || 0) + 1);
    save();
    if (!retried.has(w.id)) { retried.add(w.id); queue.push(w); } // una segunda oportunidad al final
    next();
  };

  showCard();
}

/* ====================== 3. ¿Tiene S? (los vagones) ====================== */
function screenTrainSetup() {
  const opts = [...POSITIONS, 'mezclado'];
  app.innerHTML = topbar(t('train')) + `<main><div class="pos-grid">${opts.map((p, i) => {
    const ok = pool(w => w.hasS && (p === 'mezclado' || w.position === p)).length > 0 && pool(w => !w.hasS).length > 0;
    return `<button class="btn ${['c-green', 'c-sky', 'c-peach', 'c-lilac'][i]}" data-pos="${p}" ${ok ? '' : 'disabled'}>${posIcon(p)}<span>${t('pos_' + p)}</span></button>`;
  }).join('')}</div></main>`;
  bindHome();
  $$('[data-pos]').forEach(b => { b.onclick = () => go(screenTrain, b.dataset.pos); });
}

function screenTrain(level, opts = {}) {
  const total = opts.count || roundSize();
  const withS = shuffle(pool(w => w.hasS && (level === 'mezclado' || w.position === level)));
  const without = shuffle(pool(w => !w.hasS));
  const nS = Math.min(Math.ceil(total / 2), withS.length), nD = Math.min(Math.floor(total / 2), without.length);
  const queue = shuffle([...withS.slice(0, nS), ...without.slice(0, nD)]);
  if (!queue.length) { if (opts.onFinish) opts.onFinish(0); else go(screenHome); return; }
  let idx = 0, earned = 0, tries = 0, busy = false, selected = false, alive = true;
  cleanup = () => { alive = false; };

  app.innerHTML = topbar(t('train'), opts.session) + `<div class="train-stage" id="stage">
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
    setTimeout(() => { if (alive) Sound.word(w); }, 300);
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
      if (!alive) return;
      wagon.classList.remove('bounce'); void wagon.offsetWidth; wagon.classList.add('bounce');
      await sleep(450);
      if (!alive) return;
      idx++;
      if (idx >= queue.length) { finishRound(opts, earned, () => go(screenTrain, level)); return; }
      showCard();
    } else {
      // vuelve a su sitio, sin sonido de error, y se repite la palabra
      tries++;
      card.style.transition = 'transform .3s'; card.style.transform = 'none';
      wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
      setTimeout(() => { if (alive) Sound.word(w); }, 350);
      await sleep(450);
      busy = false;
    }
  }

  // Arrastrar la tarjeta, o tocar la tarjeta y luego el vagón, o tocar el vagón directamente
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
  card.addEventListener('pointerup', e => {
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
  });
  card.addEventListener('pointercancel', () => { drag = null; card.style.transition = 'transform .3s'; card.style.transform = 'none'; });
  wagons.forEach(wg => { wg.onclick = () => { if (!busy) answer(wg); }; });
  $('#say').onclick = () => Sound.word(queue[idx]);

  showCard();
}

/* ====================== 4. Sílabas ====================== */
function screenSyllables(opts = {}) {
  const sylOf = w => L.syllables.find(s => w.word.toLowerCase().startsWith(s.id));
  const candidates = () => pool(w => w.hasS && w.position === 'inicio' && sylOf(w));
  let mode = 'free', queue = [], idx = 0, earned = 0, tries = 0, busy = false, alive = true;
  cleanup = () => { alive = false; };

  app.innerHTML = topbar(t('syllables'), opts.session) + `<main class="syl-main">
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
    setTimeout(() => { if (alive) Sound.word(w); }, 250);
  }
  function startGame() {
    queue = shuffle(candidates()).slice(0, opts.count || roundSize());
    if (!queue.length) { if (opts.onFinish) opts.onFinish(0); return; }
    mode = 'game'; idx = 0; earned = 0;
    playBtn.hidden = true; showWord();
  }
  playBtn.onclick = startGame;
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
        if (!alive) return;
        card.classList.remove('bounce');
        idx++;
        if (idx >= queue.length) { finishRound(opts, earned, () => go(screenSyllables)); return; }
        showWord();
      } else {
        tries++;
        b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        setTimeout(() => { if (alive) Sound.word(w); }, 350);
      }
    };
  });
  if (opts.autoplay) startGame();
}

/* ====================== Sesión de hoy ====================== */
const PRIZES = ['🦄', '🐲', '🚀', '🎠', '🧸', '🦖', '🐙', '🦋', '🌈', '🎸', '🍭', '🛸', '🐳', '🦁', '🐧', '🎁', '🎪', '🚒', '🐢', '🦊'];

function runSession() {
  const steps = [
    ['🐍', o => screenWarmup(o)],
    ['🗣️', o => screenListen('mezclado', { ...o, count: 5, hardFirst: true })],
    ['🚂', o => screenTrain('mezclado', { ...o, count: 6 })],
    ['🔤', o => screenSyllables({ ...o, count: 4, autoplay: true })]
  ];
  const n = steps.length;
  let i = 0, total = 0;

  const interlude = (icon, cb) => go(() => {
    app.innerHTML = `${topbar('', { i, n })}<main><div class="interlude">${icon}</div></main>`;
    bindHome();
    const timer = setTimeout(cb, 1100);
    cleanup = () => clearTimeout(timer);
  });
  const play = () => {
    const [icon, fn] = steps[i];
    interlude(icon, () => go(() => fn({
      session: { i, n },
      onFinish: stars => { total += stars; i++; i < n ? play() : end(); }
    })));
  };
  const end = () => {
    store.sessions++;
    const free = PRIZES.filter(p => !store.prizes.includes(p));
    const prize = free.length ? free[Math.floor(Math.random() * free.length)] : null;
    if (prize) store.prizes.push(prize);
    save();
    go(screenHome);
    celebrate({ stars: total, prize, rest: true, onAgain: runSession });
  };
  play();
}

/* ====================== Álbum de pegatinas ====================== */
function screenAlbum() {
  const words = sWords(), got = stickerCount();
  const tile = w => {
    const has = store.stickers[wkey(w)];
    return `<button class="tile ${has ? '' : 'locked'}" data-id="${w.id}" aria-label="${has ? w.word : '?'}">${w.emoji}</button>`;
  };
  const prizes = PRIZES.map(p => store.prizes.includes(p)
    ? `<div class="tile">${p}</div>` : '<div class="tile locked">❓</div>').join('');
  app.innerHTML = topbar(t('album')) + `<main class="album-main">
    <div class="album-count">⭐ ${got}/${words.length}</div>
    ${POSITIONS.map(p => words.some(w => w.position === p)
      ? `<div class="album-h">${posIcon(p)}</div><div class="album-grid">${words.filter(w => w.position === p).map(tile).join('')}</div>` : '').join('')}
    <div class="album-h">🎁 ${t('prizes')}</div><div class="album-grid">${prizes}</div>
  </main>`;
  bindHome();
  $$('.tile[data-id]').forEach(b => {
    b.onclick = () => {
      const w = L.words.find(x => x.id === b.dataset.id);
      if (store.stickers[wkey(w)]) Sound.word(w);
      b.classList.remove('bounce', 'shake'); void b.offsetWidth;
      b.classList.add(store.stickers[wkey(w)] ? 'bounce' : 'shake');
    };
  });
}

/* ====================== Grabar voces (panel del adulto) ====================== */
function screenVoices() {
  const items = [
    { id: 'sss', label: 'sssss', emoji: '🐍' },
    ...L.syllables.map(s => ({ id: s.id, label: s.text, emoji: s.text })),
    ...L.words.map(w => ({ id: w.id, label: w.word, emoji: w.emoji }))
  ];
  let i = 0, rec = null, chunks = [], recording = false, maxTimer = 0;
  const has = it => Sound.clips.has(it.id);

  app.innerHTML = topbar(t('recordVoices')) + `<main class="voices-main">
    <div class="count" id="vcount"></div>
    <div class="card" id="vcard"><div class="emoji"></div><div class="word"></div></div>
    <p class="hint" id="vhint"></p>
    <div class="row">
      <button class="btn round c-lilac" id="vprev" aria-label="Anterior">⏮</button>
      <button class="btn round c-pink" id="vrec" aria-label="Grabar">⏺</button>
      <button class="btn round c-lemon" id="vplay" aria-label="Oír">▶️</button>
      <button class="btn round c-peach" id="vdel" aria-label="Borrar">🗑</button>
      <button class="btn round c-lilac" id="vnext" aria-label="Siguiente">⏭</button>
    </div>
    <div class="chips vchips" id="vchips"></div></main>`;
  bindHome();
  const recBtn = $('#vrec'), hint = $('#vhint');

  function stopRec(silent) {
    clearTimeout(maxTimer);
    if (rec && rec.state === 'recording') { if (silent) rec.onstop = null; rec.stop(); }
    recording = false; recBtn.classList.remove('rec'); recBtn.textContent = '⏺';
  }
  cleanup = () => { stopRec(true); releaseMic(); };

  function draw() {
    const it = items[i];
    $('#vcard .emoji').textContent = it.emoji;
    $('#vcard .word').textContent = it.label;
    $('#vplay').disabled = !has(it); $('#vdel').disabled = !has(it);
    $('#vcount').textContent = `${items.filter(has).length}/${items.length} ${t('recorded')}`;
    $('#vchips').innerHTML = items.map((x, k) => `<button class="chip ${k === i ? 'on' : ''}" data-k="${k}">${has(x) ? '✔ ' : ''}${x.label}</button>`).join('');
    $$('#vchips [data-k]').forEach(b => { b.onclick = () => { stopRec(true); i = +b.dataset.k; hint.textContent = ''; draw(); }; });
  }
  async function startRec() {
    if (typeof MediaRecorder === 'undefined') { hint.textContent = t('micUnavailable'); return; }
    let stream;
    try { stream = await getMic(); } catch (e) { hint.textContent = micError(e); return; }
    if (!Clips.db && !(await Clips.open())) { hint.textContent = t('noStorage'); return; }
    const it = items[i];
    const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(m => MediaRecorder.isTypeSupported(m));
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
      if (!blob.size) return;
      await Clips.put(`${L.code}:${it.id}`, blob);
      Sound.setClip(it.id, blob);
      draw();
      Sound.say(it.id, it.label);
    };
    rec.start();
    recording = true; recBtn.classList.add('rec'); recBtn.textContent = '⏹'; hint.textContent = '';
    maxTimer = setTimeout(() => stopRec(), 6000);
  }
  recBtn.onclick = () => { getCtx(); Sound.stop(); recording ? stopRec() : startRec(); };
  $('#vplay').onclick = () => { const it = items[i]; if (has(it)) Sound.say(it.id, it.label); };
  $('#vdel').onclick = async () => {
    const it = items[i];
    await Clips.del(`${L.code}:${it.id}`); Sound.dropClip(it.id); draw();
  };
  $('#vprev').onclick = () => { stopRec(true); i = (i + items.length - 1) % items.length; hint.textContent = ''; draw(); };
  $('#vnext').onclick = () => { stopRec(true); i = (i + 1) % items.length; hint.textContent = ''; draw(); };
  $('#vcard').onclick = () => { const it = items[i]; Sound.say(it.id, it.label); };
  draw();
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
      <h3>${t('roundSize')}</h3>
      <div class="chips">${[5, 8, 10].map(n => `<button class="chip ${roundSize() === n ? 'on' : ''}" data-size="${n}">${n}</button>`).join('')}</div>
      <h3>${t('voice')}</h3>
      <div class="row" style="justify-content:flex-start">
        <select id="voiceSel" class="sel"><option value="">${t('voiceAuto')}</option>${Sound.voices().map(v => `<option value="${v.voiceURI}" ${v.voiceURI === store.voice ? 'selected' : ''}>${v.name} (${v.lang})</option>`).join('')}</select>
        <select id="rateSel" class="sel">${[0.7, 0.8, 0.85, 0.95, 1].map(r => `<option value="${r}" ${r === store.rate ? 'selected' : ''}>${t('speed')} ${r}</option>`).join('')}</select>
        <button class="btn c-lemon" id="tryVoice">🔊 ${t('tryVoice')}</button>
      </div>
      ${Sound.voices().length ? '' : `<p class="hint">${t('noVoices')}</p>`}
      <div><button class="btn c-pink" data-a="voices">🎙️ ${t('recordVoices')} <small>(${Sound.clips.size})</small></button></div>
      <h3>${t('positions')}</h3>
      <div class="chips">${POSITIONS.map(p => `<button class="chip ${posOn(p) ? 'on' : 'off'}" data-p="${p}">${t('pos_' + p)}</button>`).join('')}</div>
      <h3>${t('words')}</h3>
      ${POSITIONS.map(p => `<div class="chips">${L.words.filter(w => w.position === p).map(chip).join('')}</div>`).join('')}
      <h3>${t('noS')}</h3>
      <div class="chips">${L.words.filter(w => !w.hasS).map(chip).join('')}</div>
      <div><button class="btn c-red" data-a="reset">${t('reset')}</button></div>
      <p class="hint">v${APP_VERSION} · ${store.sessions} ${t('sessionsDone')}</p></div>`;
    $$('[data-size]', o).forEach(b => b.onclick = () => { store.roundSize = +b.dataset.size; save(); draw(); });
    $('#voiceSel', o).onchange = e => { store.voice = e.target.value; save(); Sound.pickVoice(); Sound.speak(L.words[0].word); };
    $('#rateSel', o).onchange = e => { store.rate = +e.target.value; save(); Sound.speak(L.words[0].word); };
    $('#tryVoice', o).onclick = () => Sound.speak(L.words[0].word);
    $('[data-a=voices]', o).onclick = () => { o.remove(); go(screenVoices); };
    $$('[data-p]', o).forEach(b => b.onclick = () => {
      const k = `${L.code}:${b.dataset.p}`; store.offPos[k] = !store.offPos[k]; save(); draw();
    });
    $$('[data-w]', o).forEach(b => b.onclick = () => {
      const k = `${L.code}:${b.dataset.w}`; store.offWords[k] = !store.offWords[k]; save(); draw();
    });
    $('[data-a=close]', o).onclick = () => { o.remove(); go(screenHome); };
    $('[data-a=reset]', o).onclick = () => {
      if (!confirm(t('resetConfirm'))) return;
      const { lang, voice, rate, roundSize: rs } = store;
      store = { ...defaults(), lang, voice, rate, roundSize: rs }; save(); draw();
    };
    o.scrollTop = keep;
  };
  draw();
  document.body.appendChild(o);
}

/* ====================== arranque ====================== */
Sound.probe(audioIds());
Sound.loadClips();
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
