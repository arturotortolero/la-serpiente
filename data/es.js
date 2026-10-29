/* Datos en español (España). Para añadir un idioma: copiar este archivo a
   data/ca.js o data/fr.js, traducir `ui`, `syllables` y `words`, y añadir
   el <script> en index.html. La app lo activa sola.

   Regla de pronunciación (es-ES): NADA de C+e/i ni Z (cereza, cinco, lápiz...),
   porque suenan /θ/. También vale para los distractores sin S.

   `id`      → nombre del audio opcional: audio/es/<id>.mp3 (sin tildes ni ñ).
   `position`→ "inicio" | "medio" | "final" | null (null = distractor sin S).
*/
window.LANGS = window.LANGS || {};
window.LANGS.es = {
  code: 'es',
  name: 'Español',
  voiceLang: 'es-ES',
  audioDir: 'es',

  ui: {
    appTitle: 'La Serpiente',
    warmup: 'La serpiente',
    listen: 'Escucha y repite',
    train: '¿Tiene S?',
    syllables: 'Sílabas',
    soon: 'pronto',
    pos_inicio: 'Al inicio',
    pos_medio: 'En medio',
    pos_final: 'Al final',
    pos_mezclado: 'Mezclado',
    withS: 'con S',
    withoutS: 'sin S',
    yourTurn: '¡Ahora tú!',
    stop: 'Parar',
    micDenied: 'No puedo usar el micrófono. Mira el permiso del navegador.',
    micUnavailable: 'El micrófono necesita HTTPS o localhost.',
    warmupDone: '¡Qué serpiente tan larga!',
    celebrate: '¡Muy bien!',
    play: 'Jugar',
    adultPanel: 'Panel del adulto',
    mostAgain: 'Las que más veces han salido en «Otra vez»',
    noneYet: 'Todavía no hay ninguna',
    positions: 'Posiciones',
    words: 'Palabras',
    noS: 'Sin S',
    reset: 'Borrar progreso',
    resetConfirm: '¿Borrar estrellas y progreso?',
    close: 'Cerrar'
  },

  // Texto que se pronuncia (`say`) puede ajustarse si la voz sintética lo lee mal.
  syllables: [
    { id: 'sa', text: 'SA', say: 'sa', color: '#8ecbff' },
    { id: 'se', text: 'SE', say: 'se', color: '#9be3a4' },
    { id: 'si', text: 'SI', say: 'si', color: '#ffe58a' },
    { id: 'so', text: 'SO', say: 'so', color: '#ff9b9b' },
    { id: 'su', text: 'SU', say: 'su', color: '#ffb3dc' }
  ],

  words: [
    // ---- S al inicio ----
    { id: 'sol', word: 'sol', emoji: '☀️', position: 'inicio', hasS: true },
    { id: 'sal', word: 'sal', emoji: '🧂', position: 'inicio', hasS: true },
    { id: 'sopa', word: 'sopa', emoji: '🍲', position: 'inicio', hasS: true },
    { id: 'seis', word: 'seis', emoji: '6️⃣', position: 'inicio', hasS: true },
    { id: 'siete', word: 'siete', emoji: '7️⃣', position: 'inicio', hasS: true },
    { id: 'serpiente', word: 'serpiente', emoji: '🐍', position: 'inicio', hasS: true },
    { id: 'sandia', word: 'sandía', emoji: '🍉', position: 'inicio', hasS: true },
    { id: 'sirena', word: 'sirena', emoji: '🧜‍♀️', position: 'inicio', hasS: true },
    { id: 'sofa', word: 'sofá', emoji: '🛋️', position: 'inicio', hasS: true },
    { id: 'semaforo', word: 'semáforo', emoji: '🚦', position: 'inicio', hasS: true },
    { id: 'suma', word: 'suma', emoji: '➕', position: 'inicio', hasS: true },
    { id: 'seta', word: 'seta', emoji: '🍄', position: 'inicio', hasS: true },
    { id: 'silla', word: 'silla', emoji: '🪑', position: 'inicio', hasS: true },
    { id: 'sapo', word: 'sapo', emoji: '🐸', position: 'inicio', hasS: true },
    { id: 'sombrero', word: 'sombrero', emoji: '🎩', position: 'inicio', hasS: true },
    { id: 'sobre', word: 'sobre', emoji: '✉️', position: 'inicio', hasS: true },
    { id: 'sarten', word: 'sartén', emoji: '🍳', position: 'inicio', hasS: true },

    // ---- S en medio ----
    { id: 'oso', word: 'oso', emoji: '🐻', position: 'medio', hasS: true },
    { id: 'casa', word: 'casa', emoji: '🏠', position: 'medio', hasS: true },
    { id: 'vaso', word: 'vaso', emoji: '🥛', position: 'medio', hasS: true },
    { id: 'beso', word: 'beso', emoji: '😘', position: 'medio', hasS: true },
    { id: 'queso', word: 'queso', emoji: '🧀', position: 'medio', hasS: true },
    { id: 'mosca', word: 'mosca', emoji: '🪰', position: 'medio', hasS: true },
    { id: 'fresa', word: 'fresa', emoji: '🍓', position: 'medio', hasS: true },
    { id: 'castillo', word: 'castillo', emoji: '🏰', position: 'medio', hasS: true },
    { id: 'pescado', word: 'pescado', emoji: '🐟', position: 'medio', hasS: true },
    { id: 'esponja', word: 'esponja', emoji: '🧽', position: 'medio', hasS: true },
    { id: 'escalera', word: 'escalera', emoji: '🪜', position: 'medio', hasS: true },
    { id: 'pastel', word: 'pastel', emoji: '🎂', position: 'medio', hasS: true },
    { id: 'espada', word: 'espada', emoji: '🗡️', position: 'medio', hasS: true },
    { id: 'estrella', word: 'estrella', emoji: '⭐', position: 'medio', hasS: true },
    { id: 'mosquito', word: 'mosquito', emoji: '🦟', position: 'medio', hasS: true },
    { id: 'hospital', word: 'hospital', emoji: '🏥', position: 'medio', hasS: true },
    { id: 'fantasma', word: 'fantasma', emoji: '👻', position: 'medio', hasS: true },
    { id: 'mascara', word: 'máscara', emoji: '🎭', position: 'medio', hasS: true },
    { id: 'vestido', word: 'vestido', emoji: '👗', position: 'medio', hasS: true },
    { id: 'gusano', word: 'gusano', emoji: '🐛', position: 'medio', hasS: true },
    { id: 'camiseta', word: 'camiseta', emoji: '👕', position: 'medio', hasS: true },

    // ---- S al final ----
    { id: 'dos', word: 'dos', emoji: '2️⃣', position: 'final', hasS: true },
    { id: 'tres', word: 'tres', emoji: '3️⃣', position: 'final', hasS: true },
    { id: 'autobus', word: 'autobús', emoji: '🚌', position: 'final', hasS: true },
    { id: 'cactus', word: 'cactus', emoji: '🌵', position: 'final', hasS: true },
    { id: 'tenis', word: 'tenis', emoji: '🎾', position: 'final', hasS: true },
    { id: 'gafas', word: 'gafas', emoji: '👓', position: 'final', hasS: true },
    { id: 'tijeras', word: 'tijeras', emoji: '✂️', position: 'final', hasS: true },
    { id: 'ojos', word: 'ojos', emoji: '👀', position: 'final', hasS: true },
    { id: 'gatos', word: 'gatos', emoji: '🐱🐱', position: 'final', hasS: true },
    { id: 'patos', word: 'patos', emoji: '🦆🦆', position: 'final', hasS: true },
    { id: 'globos', word: 'globos', emoji: '🎈🎈', position: 'final', hasS: true },
    { id: 'flores', word: 'flores', emoji: '🌸🌸', position: 'final', hasS: true },

    // ---- Sin S (distractores) ----
    { id: 'luna', word: 'luna', emoji: '🌙', position: null, hasS: false },
    { id: 'gato', word: 'gato', emoji: '🐱', position: null, hasS: false },
    { id: 'perro', word: 'perro', emoji: '🐶', position: null, hasS: false },
    { id: 'arbol', word: 'árbol', emoji: '🌳', position: null, hasS: false },
    { id: 'coche', word: 'coche', emoji: '🚗', position: null, hasS: false },
    { id: 'tren', word: 'tren', emoji: '🚂', position: null, hasS: false },
    { id: 'pera', word: 'pera', emoji: '🍐', position: null, hasS: false },
    { id: 'uva', word: 'uva', emoji: '🍇', position: null, hasS: false },
    { id: 'pina', word: 'piña', emoji: '🍍', position: null, hasS: false },
    { id: 'conejo', word: 'conejo', emoji: '🐰', position: null, hasS: false },
    { id: 'jirafa', word: 'jirafa', emoji: '🦒', position: null, hasS: false },
    { id: 'abeja', word: 'abeja', emoji: '🐝', position: null, hasS: false },
    { id: 'montana', word: 'montaña', emoji: '⛰️', position: null, hasS: false },
    { id: 'naranja', word: 'naranja', emoji: '🍊', position: null, hasS: false },
    { id: 'helado', word: 'helado', emoji: '🍦', position: null, hasS: false },
    { id: 'libro', word: 'libro', emoji: '📖', position: null, hasS: false },
    { id: 'nube', word: 'nube', emoji: '☁️', position: null, hasS: false },
    { id: 'raton', word: 'ratón', emoji: '🐭', position: null, hasS: false },
    { id: 'mano', word: 'mano', emoji: '✋', position: null, hasS: false },
    { id: 'pato', word: 'pato', emoji: '🦆', position: null, hasS: false }
  ]
};
