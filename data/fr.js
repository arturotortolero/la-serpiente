/* Données en français (France). Même structure que data/es.js.

   RÈGLE (important) : on travaille le SON /s/, pas la lettre.
   - Un « s » entre deux voyelles se prononce /z/ (maison, rose, oiseau, fraise…) → INTERDIT
     comme mot avec S ; et interdit aussi comme distracteur, pour ne pas troubler l'enfant.
   - Un « s » final muet (chats, tapis…) ne compte pas : on n'utilise que les finales où /s/ s'entend
     (bus, ours, tennis, cactus, ananas, maïs, dix, tasse, glace…).
   - /s/ s'écrit aussi c (devant e/i), ç, ss, sc, x : c'est pourquoi chaque mot avec S a `hl`,
     la lettre (ou le groupe de lettres) à mettre en couleur : poiSSon, Citron, garÇon, diX.
   - `syl` (optionnel) : syllabe pour le jeu des syllabes (sa/se/si/so/su) ; seulement quand le début
     du mot SE PRONONCE ainsi (pas soupe /su/, ni singe /sɛ̃/).
   - `id` → audio optionnel : audio/fr/<id>.mp3 (sans accents).
*/
window.LANGS = window.LANGS || {};
window.LANGS.fr = {
  code: 'fr',
  name: 'Français',
  voiceLang: 'fr-FR',
  audioDir: 'fr',

  /* Contrôle de développement : renvoie un message si le mot enfreint la règle. */
  check(w) {
    const V = 'aeiouyéèêëàâîïôûù', isV = ch => !!ch && V.includes(ch);
    if (w.hasS) {
      if (!w.hl || !w.word.toLowerCase().includes(w.hl)) return 'manque `hl` valide';
      const i = w.word.toLowerCase().indexOf(w.hl);
      if (w.hl === 's' && isV(w.word[i - 1]) && isV(w.word[i + 1])) return 's entre voyelles = /z/';
    } else if (/[sçx]|c[eiéèy]/i.test(w.word)) {
      return 'le distracteur contient une lettre qui peut sonner /s/ ou /z/';
    }
    return '';
  },

  ui: {
    appTitle: 'Le Serpent',
    warmup: 'Le serpent',
    listen: 'Écoute et répète',
    train: 'Il y a un S ?',
    syllables: 'Syllabes',
    soon: 'bientôt',
    pos_inicio: 'Au début',
    pos_medio: 'Au milieu',
    pos_final: 'À la fin',
    pos_mezclado: 'Mélangé',
    pos_repaso: 'Réviser',
    withS: 'avec S',
    withoutS: 'sans S',
    stop: 'Arrêter',
    micDenied: 'Impossible d’utiliser le micro. Vérifiez l’autorisation du navigateur.',
    micUnavailable: 'Le micro nécessite HTTPS ou localhost.',
    warmupDone: 'Quel long serpent !',
    celebrate: 'Bravo !',
    play: 'Jouer',
    session: 'Séance du jour',
    album: 'Mes autocollants',
    prizes: 'Récompenses',
    newSticker: 'Nouvel autocollant !',
    prizeLabel: 'Récompense !',
    traceHint: 'Fais « ssss » en suivant le chemin du S avec ton doigt',
    restHint: 'Beau travail. C’est peut-être le moment de faire une pause 🧸',
    adultPanel: 'Espace adulte',
    mostAgain: 'Les mots les plus souvent à refaire',
    noneYet: 'Aucun pour le moment',
    roundSize: 'Mots par manche',
    voice: 'Voix',
    voiceAuto: 'Automatique (la plus naturelle)',
    speed: 'Vitesse',
    tryVoice: 'Essayer',
    noVoices: 'Cet appareil n’a pas de voix françaises. Installez-en une dans les réglages du système.',
    recordVoices: 'Enregistrer les voix',
    recorded: 'enregistrés',
    noStorage: 'Impossible d’enregistrer dans ce navigateur.',
    positions: 'Positions',
    words: 'Mots',
    noS: 'Sans S',
    reset: 'Effacer la progression',
    resetConfirm: 'Effacer les étoiles et la progression ?',
    sessionsDone: 'séances',
    close: 'Fermer'
  },

  syllables: [
    { id: 'sa', text: 'SA', say: 'sa', color: '#8ecbff' },
    { id: 'se', text: 'SE', say: 'se', color: '#9be3a4' },
    { id: 'si', text: 'SI', say: 'si', color: '#ffe58a' },
    { id: 'so', text: 'SO', say: 'so', color: '#ff9b9b' },
    { id: 'su', text: 'SU', say: 'su', color: '#ffb3dc' }
  ],

  words: [
    // ---- S au début ----
    { id: 'soleil', word: 'soleil', emoji: '☀️', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'sac', word: 'sac', emoji: '🎒', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'sable', word: 'sable', emoji: '🏖️', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'serpent', word: 'serpent', emoji: '🐍', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'singe', word: 'singe', emoji: '🐒', position: 'inicio', hasS: true, hl: 's' },
    { id: 'sapin', word: 'sapin', emoji: '🎄', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'savon', word: 'savon', emoji: '🧼', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'salade', word: 'salade', emoji: '🥗', position: 'inicio', hasS: true, hl: 's', syl: 'sa' },
    { id: 'soupe', word: 'soupe', emoji: '🍲', position: 'inicio', hasS: true, hl: 's' },
    { id: 'souris', word: 'souris', emoji: '🐭', position: 'inicio', hasS: true, hl: 's' },
    { id: 'sept', word: 'sept', emoji: '7️⃣', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'six', word: 'six', emoji: '6️⃣', position: 'inicio', hasS: true, hl: 's', syl: 'si' },
    { id: 'sirene', word: 'sirène', emoji: '🧜‍♀️', position: 'inicio', hasS: true, hl: 's', syl: 'si' },
    { id: 'sel', word: 'sel', emoji: '🧂', position: 'inicio', hasS: true, hl: 's', syl: 'se' },
    { id: 'sucette', word: 'sucette', emoji: '🍭', position: 'inicio', hasS: true, hl: 's', syl: 'su' },
    { id: 'sandale', word: 'sandale', emoji: '🩴', position: 'inicio', hasS: true, hl: 's' },
    { id: 'saucisse', word: 'saucisse', emoji: '🌭', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'sorciere', word: 'sorcière', emoji: '🧙‍♀️', position: 'inicio', hasS: true, hl: 's', syl: 'so' },
    { id: 'citron', word: 'citron', emoji: '🍋', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cerise', word: 'cerise', emoji: '🍒', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cinq', word: 'cinq', emoji: '5️⃣', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'cirque', word: 'cirque', emoji: '🎪', position: 'inicio', hasS: true, hl: 'c' },
    { id: 'ciseaux', word: 'ciseaux', emoji: '✂️', position: 'inicio', hasS: true, hl: 'c' },

    // ---- S au milieu ----
    { id: 'poisson', word: 'poisson', emoji: '🐟', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'chaussure', word: 'chaussure', emoji: '👟', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'chaussette', word: 'chaussette', emoji: '🧦', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'escargot', word: 'escargot', emoji: '🐌', position: 'medio', hasS: true, hl: 's' },
    { id: 'masque', word: 'masque', emoji: '🎭', position: 'medio', hasS: true, hl: 's' },
    { id: 'casque', word: 'casque', emoji: '🪖', position: 'medio', hasS: true, hl: 's' },
    { id: 'pasteque', word: 'pastèque', emoji: '🍉', position: 'medio', hasS: true, hl: 's' },
    { id: 'biscuit', word: 'biscuit', emoji: '🍪', position: 'medio', hasS: true, hl: 's' },
    { id: 'herisson', word: 'hérisson', emoji: '🦔', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'dessin', word: 'dessin', emoji: '🎨', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'poussin', word: 'poussin', emoji: '🐥', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'assiette', word: 'assiette', emoji: '🍽️', position: 'medio', hasS: true, hl: 'ss' },
    { id: 'moustique', word: 'moustique', emoji: '🦟', position: 'medio', hasS: true, hl: 's' },
    { id: 'garcon', word: 'garçon', emoji: '👦', position: 'medio', hasS: true, hl: 'ç' },
    { id: 'glacon', word: 'glaçon', emoji: '🧊', position: 'medio', hasS: true, hl: 'ç' },

    // ---- S à la fin ----
    { id: 'bus', word: 'bus', emoji: '🚌', position: 'final', hasS: true, hl: 's' },
    { id: 'ours', word: 'ours', emoji: '🐻', position: 'final', hasS: true, hl: 's' },
    { id: 'tennis', word: 'tennis', emoji: '🎾', position: 'final', hasS: true, hl: 's' },
    { id: 'cactus', word: 'cactus', emoji: '🌵', position: 'final', hasS: true, hl: 's' },
    { id: 'ananas', word: 'ananas', emoji: '🍍', position: 'final', hasS: true, hl: 's' },
    { id: 'mais', word: 'maïs', emoji: '🌽', position: 'final', hasS: true, hl: 's' },
    { id: 'dix', word: 'dix', emoji: '🔟', position: 'final', hasS: true, hl: 'x' },
    { id: 'tasse', word: 'tasse', emoji: '☕', position: 'final', hasS: true, hl: 'ss' },
    { id: 'glace', word: 'glace', emoji: '🍦', position: 'final', hasS: true, hl: 'c' },
    { id: 'police', word: 'police', emoji: '🚓', position: 'final', hasS: true, hl: 'c' },
    { id: 'brosse', word: 'brosse', emoji: '🪥', position: 'final', hasS: true, hl: 'ss' },

    // ---- Sans S (distracteurs) : aucun son /s/ ni lettre s ----
    { id: 'lune', word: 'lune', emoji: '🌙', position: null, hasS: false },
    { id: 'chat', word: 'chat', emoji: '🐱', position: null, hasS: false },
    { id: 'chien', word: 'chien', emoji: '🐶', position: null, hasS: false },
    { id: 'arbre', word: 'arbre', emoji: '🌳', position: null, hasS: false },
    { id: 'voiture', word: 'voiture', emoji: '🚗', position: null, hasS: false },
    { id: 'train', word: 'train', emoji: '🚂', position: null, hasS: false },
    { id: 'poire', word: 'poire', emoji: '🍐', position: null, hasS: false },
    { id: 'pomme', word: 'pomme', emoji: '🍎', position: null, hasS: false },
    { id: 'lapin', word: 'lapin', emoji: '🐰', position: null, hasS: false },
    { id: 'girafe', word: 'girafe', emoji: '🦒', position: null, hasS: false },
    { id: 'abeille', word: 'abeille', emoji: '🐝', position: null, hasS: false },
    { id: 'montagne', word: 'montagne', emoji: '⛰️', position: null, hasS: false },
    { id: 'orange', word: 'orange', emoji: '🍊', position: null, hasS: false },
    { id: 'livre', word: 'livre', emoji: '📖', position: null, hasS: false },
    { id: 'nuage', word: 'nuage', emoji: '☁️', position: null, hasS: false },
    { id: 'main', word: 'main', emoji: '✋', position: null, hasS: false },
    { id: 'canard', word: 'canard', emoji: '🦆', position: null, hasS: false },
    { id: 'fromage', word: 'fromage', emoji: '🧀', position: null, hasS: false },
    { id: 'bateau', word: 'bateau', emoji: '⛵', position: null, hasS: false },
    { id: 'banane', word: 'banane', emoji: '🍌', position: null, hasS: false },
    { id: 'lit', word: 'lit', emoji: '🛏️', position: null, hasS: false },
    { id: 'fleur', word: 'fleur', emoji: '🌸', position: null, hasS: false },
    { id: 'pied', word: 'pied', emoji: '🦶', position: null, hasS: false }
  ]
};
