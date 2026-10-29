/* Dades en català. Mateixa estructura que data/es.js.

   REGLA (important): es treballa el SO /s/, no la lletra.
   - Una «s» entre dues vocals sona /z/ (casa, rosa, camisa, tisores…) → PROHIBIDA, tant com a
     paraula amb S com a distractor.
   - Davant de consonant sonora (b, d, g, v, l, m, n, r) també sona /z/ (esmorzar, disbarat). Aquí
     només hi ha «s» davant de c, t, f, q, p… que sonen /s/ (escola, castell, disfressa).
   - /s/ també s'escriu ss entre vocals (bossa, tassa), c davant e/i (cirera, ceba), ç (cançó, braç).
     Per això cada paraula amb S té `hl`: la lletra (o grup) que cal ressaltar.
   - La «s» final sempre se sent: gos, dos, tres, gats, flors… (a diferència del francès).
   - `syl` (opcional): síl·laba per al joc de síl·labes (sa/se/si/so/su).
   - `id` → àudio opcional: audio/ca/<id>.mp3 (sense accents ni ç).
*/
window.LANGS = window.LANGS || {};
window.LANGS.ca = {
  code: 'ca',
  name: 'Català',
  voiceLang: 'ca-ES',
  audioDir: 'ca',

  /* Control de desenvolupament: retorna un missatge si la paraula infringeix la regla. */
  check(w) {
    const V = 'aeiouàèéíòóúïü', isV = ch => !!ch && V.includes(ch);
    if (w.hasS) {
      const low = w.word.toLowerCase();
      if (!w.hl || !low.includes(w.hl)) return 'falta un `hl` vàlid';
      if (w.hl === 's') {
        const i = low.indexOf('s'), prev = low[i - 1], next = low[i + 1];
        if (isV(prev) && isV(next)) return 's entre vocals = /z/';
        if (next && 'bdgvlmnr'.includes(next)) return 's davant consonant sonora = /z/';
      }
    } else if (/[sçzx]|c[eiéèíy]/i.test(w.word)) {
      return 'el distractor conté una lletra que pot sonar /s/ o /z/';
    }
    return '';
  },

  ui: {
    appTitle: 'La Serp',
    warmup: 'La serp',
    listen: 'Escolta i repeteix',
    train: 'Té S?',
    syllables: 'Síl·labes',
    soon: 'aviat',
    pos_inicio: 'Al principi',
    pos_medio: 'Al mig',
    pos_final: 'Al final',
    pos_mezclado: 'Barrejat',
    pos_repaso: 'Repassar',
    withS: 'amb S',
    withoutS: 'sense S',
    stop: 'Para',
    micDenied: 'No puc fer servir el micròfon. Mira el permís del navegador.',
    micUnavailable: 'El micròfon necessita HTTPS o localhost.',
    warmupDone: 'Quina serp més llarga!',
    celebrate: 'Molt bé!',
    play: 'Jugar',
    session: 'Sessió d’avui',
    album: 'Els meus cromos',
    prizes: 'Premis',
    newSticker: 'Cromo nou!',
    prizeLabel: 'Premi!',
    traceHint: 'Fes «ssss» mentre segueixes el camí de la S amb el dit',
    restHint: 'Bona feina. Potser és un bon moment per descansar 🧸',
    adultPanel: 'Panell de l’adult',
    mostAgain: 'Les paraules que més cops s’han repetit',
    noneYet: 'Encara no n’hi ha cap',
    roundSize: 'Paraules per ronda',
    voice: 'Veu',
    voiceAuto: 'Automàtica (la més natural)',
    speed: 'Velocitat',
    tryVoice: 'Provar',
    noVoices: 'Aquest dispositiu no té veus en català. Instal·la’n una als ajustos del sistema o grava les veus pròpies.',
    exportVoices: 'Desar còpia',
    importVoices: 'Carregar còpia',
    pendingOnly: 'Només pendents',
    allItems: 'Totes',
    voiceInUse: 'Veu en ús',
    noVoiceInUse: 'cap en català (es fa servir la per defecte del dispositiu)',
    recordVoices: 'Gravar veus',
    recorded: 'gravades',
    noStorage: 'No es poden desar gravacions en aquest navegador.',
    positions: 'Posicions',
    words: 'Paraules',
    noS: 'Sense S',
    reset: 'Esborrar el progrés',
    resetConfirm: 'Vols esborrar les estrelles i el progrés?',
    sessionsDone: 'sessions',
    close: 'Tancar'
  },

  syllables: [
    { id: 'sa', text: 'SA', say: 'sa', color: '#8ecbff' },
    { id: 'se', text: 'SE', say: 'se', color: '#9be3a4' },
    { id: 'si', text: 'SI', say: 'si', color: '#ffe58a' },
    { id: 'so', text: 'SO', say: 'so', color: '#ff9b9b' },
    { id: 'su', text: 'SU', say: 'su', color: '#ffb3dc' }
  ],

  words: [
    // ---- S al principi ----
    { id: 'sol', word: 'sol', emoji: '☀️', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'sal', word: 'sal', emoji: '🧂', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'sopa', word: 'sopa', emoji: '🍲', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'sis', word: 'sis', emoji: '6️⃣', position: 'inicio', hasS: true, hl: 's', syl: 'si' },
    { id: 'set', word: 'set', emoji: '7️⃣', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'serp', word: 'serp', emoji: '🐍', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'sindria', word: 'síndria', emoji: '🍉', position: 'inicio', hasS: true, hl: 's', syl: 'si' },
    { id: 'sirena', word: 'sirena', emoji: '🧜‍♀️', position: 'inicio', hasS: true, hl: 's', syl: 'si' },
    { id: 'sofa', word: 'sofà', emoji: '🛋️', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'semafor', word: 'semàfor', emoji: '🚦', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'suma', word: 'suma', emoji: '➕', position: 'inicio', hasS: true, hl: 's', syl: 'su' },
    { id: 'sabata', word: 'sabata', emoji: '👟', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'sabo', word: 'sabó', emoji: '🧼', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'suc', word: 'suc', emoji: '🧃', position: 'inicio', hasS: true, hl: 's', syl: 'su' },
    { id: 'serra', word: 'serra', emoji: '🪚', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'sardina', word: 'sardina', emoji: '🐟', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'sargantana', word: 'sargantana', emoji: '🦎', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'cirera', word: 'cirera', emoji: '🍒', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'ceba', word: 'ceba', emoji: '🧅', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cinc', word: 'cinc', emoji: '5️⃣', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'circ', word: 'circ', emoji: '🎪', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cigne', word: 'cigne', emoji: '🦢', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cistella', word: 'cistella', emoji: '🧺', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cervol', word: 'cérvol', emoji: '🦌', position: 'inicio', hasS: true, hl: 'c' },

    // ---- S al mig ----
    { id: 'escola', word: 'escola', emoji: '🏫', position: 'medio', hasS: true, hl: 's' },
    { id: 'castell', word: 'castell', emoji: '🏰', position: 'medio', hasS: true, hl: 's' },
    { id: 'estrella', word: 'estrella', emoji: '⭐', position: 'medio', hasS: true, hl: 's' },
    { id: 'mosca', word: 'mosca', emoji: '🪰', position: 'medio', hasS: true, hl: 's' },
    { id: 'mosquit', word: 'mosquit', emoji: '🦟', position: 'medio', hasS: true, hl: 's' },
    { id: 'pasta', word: 'pasta', emoji: '🍝', position: 'medio', hasS: true, hl: 's' },
    { id: 'pastis', word: 'pastís', emoji: '🎂', position: 'medio', hasS: true, hl: 's' },
    { id: 'vestit', word: 'vestit', emoji: '👗', position: 'medio', hasS: true, hl: 's' },
    { id: 'disfressa', word: 'disfressa', emoji: '🎭', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'bossa', word: 'bossa', emoji: '👜', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'tassa', word: 'tassa', emoji: '☕', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'canco', word: 'cançó', emoji: '🎵', position: 'medio', hasS: true, hl: 'ç' },
    { id: 'pastanaga', word: 'pastanaga', emoji: '🥕', position: 'medio', hasS: true, hl: 's' },
    { id: 'escala', word: 'escala', emoji: '🪜', position: 'medio', hasS: true, hl: 's' },
    { id: 'festa', word: 'festa', emoji: '🎉', position: 'medio', hasS: true, hl: 's' },
    { id: 'llesca', word: 'llesca', emoji: '🍞', position: 'medio', hasS: true, hl: 's' },
    { id: 'disc', word: 'disc', emoji: '💿', position: 'medio', hasS: true, hl: 's' },
    { id: 'pesca', word: 'pesca', emoji: '🎣', position: 'medio', hasS: true, hl: 's' },

    // ---- S al final ----
    { id: 'gos', word: 'gos', emoji: '🐶', position: 'final', hasS: true, hl: 's' },
    { id: 'dos', word: 'dos', emoji: '2️⃣', position: 'final', hasS: true, hl: 's' },
    { id: 'tres', word: 'tres', emoji: '3️⃣', position: 'final', hasS: true, hl: 's' },
    { id: 'bus', word: 'bus', emoji: '🚌', position: 'final', hasS: true, hl: 's' },
    { id: 'cactus', word: 'cactus', emoji: '🌵', position: 'final', hasS: true, hl: 's' },
    { id: 'tennis', word: 'tennis', emoji: '🎾', position: 'final', hasS: true, hl: 's' },
    { id: 'brac', word: 'braç', emoji: '💪', position: 'final', hasS: true, hl: 'ç' },
    { id: 'peus', word: 'peus', emoji: '🦶🦶', position: 'final', hasS: true, hl: 's' },
    { id: 'gats', word: 'gats', emoji: '🐱🐱', position: 'final', hasS: true, hl: 's' },
    { id: 'ulls', word: 'ulls', emoji: '👀', position: 'final', hasS: true, hl: 's' },
    { id: 'flors', word: 'flors', emoji: '🌸🌸', position: 'final', hasS: true, hl: 's' },
    { id: 'globus', word: 'globus', emoji: '🎈', position: 'final', hasS: true, hl: 's' },
    { id: 'ulleres', word: 'ulleres', emoji: '👓', position: 'final', hasS: true, hl: 's' },

    // ---- Sense S (distractors): cap so /s/ ni /z/ ----
    { id: 'lluna', word: 'lluna', emoji: '🌙', position: null, hasS: false },
    { id: 'gat', word: 'gat', emoji: '🐱', position: null, hasS: false },
    { id: 'arbre', word: 'arbre', emoji: '🌳', position: null, hasS: false },
    { id: 'camio', word: 'camió', emoji: '🚚', position: null, hasS: false },
    { id: 'tren', word: 'tren', emoji: '🚂', position: null, hasS: false },
    { id: 'pera', word: 'pera', emoji: '🍐', position: null, hasS: false },
    { id: 'raim', word: 'raïm', emoji: '🍇', position: null, hasS: false },
    { id: 'pinya', word: 'pinya', emoji: '🍍', position: null, hasS: false },
    { id: 'conill', word: 'conill', emoji: '🐰', position: null, hasS: false },
    { id: 'girafa', word: 'girafa', emoji: '🦒', position: null, hasS: false },
    { id: 'abella', word: 'abella', emoji: '🐝', position: null, hasS: false },
    { id: 'muntanya', word: 'muntanya', emoji: '⛰️', position: null, hasS: false },
    { id: 'taronja', word: 'taronja', emoji: '🍊', position: null, hasS: false },
    { id: 'gelat', word: 'gelat', emoji: '🍦', position: null, hasS: false },
    { id: 'llibre', word: 'llibre', emoji: '📖', position: null, hasS: false },
    { id: 'nuvol', word: 'núvol', emoji: '☁️', position: null, hasS: false },
    { id: 'ratoli', word: 'ratolí', emoji: '🐭', position: null, hasS: false },
    { id: 'ma', word: 'mà', emoji: '✋', position: null, hasS: false },
    { id: 'anec', word: 'ànec', emoji: '🦆', position: null, hasS: false },
    { id: 'formatge', word: 'formatge', emoji: '🧀', position: null, hasS: false },
    { id: 'barca', word: 'barca', emoji: '⛵', position: null, hasS: false },
    { id: 'platan', word: 'plàtan', emoji: '🍌', position: null, hasS: false },
    { id: 'llit', word: 'llit', emoji: '🛏️', position: null, hasS: false },
    { id: 'flor', word: 'flor', emoji: '🌸', position: null, hasS: false },
    { id: 'cadira', word: 'cadira', emoji: '🪑', position: null, hasS: false },
    { id: 'pilota', word: 'pilota', emoji: '⚽', position: null, hasS: false }
  ]
};
