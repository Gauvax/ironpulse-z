// IronPulse Z — Moteur 3D WebGL Three.js (Shaders Cel-Shading Anime, Éclairage Dynamique 3D, Métronome de Tempo Biomécanique 3-1-1 & Audio Tactique/Cinétique)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  // Association de chaque exercice du répertoire à son mouvement biomécanique 3D et son équipement 3D
  const EXERCISE_TO_3D_MOVE = {
    'ex-bench-press': { move: 'bench-press', equip: 'barbell', label: 'Développé Couché Barre 3D', focus: 'Pectoraux • Triceps • Deltoïdes ant.' },
    'ex-incline-db-press': { move: 'bench-press', equip: 'dumbbell', label: 'Développé Incliné Haltères 3D', focus: 'Haut des Pectoraux • Épaules' },
    'ex-incline-dumbbell': { move: 'bench-press', equip: 'dumbbell', label: 'Développé Incliné Haltères 3D', focus: 'Haut des Pectoraux • Épaules' },
    'ex-cable-fly': { move: 'lateral-raise', equip: 'dumbbell', label: 'Écartés Pectoraux 3D', focus: 'Isolation Pectoraux' },
    'ex-dips': { move: 'dips', equip: 'dip-bars', label: 'Dips Barres Parallèles 3D', focus: 'Pectoraux inf. • Triceps' },
    'ex-pushups': { move: 'bench-press', equip: 'bodyweight', label: 'Pompes Explosives 3D', focus: 'Pectoraux • Gainage' },
    'ex-pullups': { move: 'pullup', equip: 'pullup-bar', label: 'Tractions Pronation 3D', focus: 'Grand Dorsal • Biceps' },
    'ex-lat-pulldown': { move: 'pullup', equip: 'pullup-bar', label: 'Tirage Vertical Poitrine 3D', focus: 'Grand Dorsal • Trapèzes' },
    'ex-barbell-row': { move: 'row', equip: 'barbell', label: 'Rowing Barre Buste Penché 3D', focus: 'Épaisseur du Dos • Lombaires' },
    'ex-seated-cable-row': { move: 'row', equip: 'dumbbell', label: 'Tirage Horizontal Poulie 3D', focus: 'Rhomboïdes • Grand Dorsal' },
    'ex-seated-row': { move: 'row', equip: 'dumbbell', label: 'Tirage Horizontal 3D', focus: 'Rhomboïdes • Grand Dorsal' },
    'ex-squat': { move: 'squat', equip: 'barbell', label: 'Back Squat Olympique 3D', focus: 'Quadriceps • Fessiers • Gainage' },
    'ex-leg-press': { move: 'squat', equip: 'barbell', label: 'Flexion Jambes Lourde 3D', focus: 'Quadriceps • Fessiers' },
    'ex-rdl': { move: 'deadlift', equip: 'barbell', label: 'Soulevé de Terre Roumain 3D', focus: 'Ischio-jambiers • Fessiers • Dos' },
    'ex-romanian-deadlift': { move: 'deadlift', equip: 'barbell', label: 'Soulevé de Terre Roumain 3D', focus: 'Ischio-jambiers • Fessiers • Dos' },
    'ex-walking-lunges': { move: 'squat', equip: 'dumbbell', label: 'Fentes Dynamiques Haltères 3D', focus: 'Quadriceps • Fessiers' },
    'ex-leg-curl': { move: 'deadlift', equip: 'dumbbell', label: 'Travail Chaîne Postérieure 3D', focus: 'Ischio-jambiers' },
    'ex-calf-raise': { move: 'squat', equip: 'barbell', label: 'Extension Mollets Debout 3D', focus: 'Triceps Sural (Mollets)' },
    'ex-ohp': { move: 'overhead-press', equip: 'barbell', label: 'Développé Militaire Debout 3D', focus: 'Deltoïdes • Triceps • Gainage' },
    'ex-overhead-press': { move: 'overhead-press', equip: 'barbell', label: 'Développé Militaire Debout 3D', focus: 'Deltoïdes • Triceps • Gainage' },
    'ex-lateral-raise': { move: 'lateral-raise', equip: 'dumbbell', label: 'Élévations Latérales 3D', focus: 'Faisceau Moyen Deltoïde' },
    'ex-face-pull': { move: 'row', equip: 'dumbbell', label: 'Face Pull & Coiffe 3D', focus: 'Deltoïde Postérieur • Trapèzes' },
    'ex-barbell-curl': { move: 'bicep-curl', equip: 'barbell', label: 'Curl Biceps Barre 3D', focus: 'Biceps Brachial' },
    'ex-hammer-curl': { move: 'bicep-curl', equip: 'dumbbell', label: 'Curl Marteau Haltères 3D', focus: 'Brachial • Avant-bras' },
    'ex-triceps-pushdown': { move: 'bicep-curl', equip: 'barbell', label: 'Extension Triceps Poulie 3D', focus: 'Triceps Brachial' },
    'ex-tricep-pushdown': { move: 'bicep-curl', equip: 'barbell', label: 'Extension Triceps Poulie 3D', focus: 'Triceps Brachial' },
    'ex-skull-crusher': { move: 'bench-press', equip: 'barbell', label: 'Barre au Front Triceps 3D', focus: 'Longue Portion Triceps' },
    'ex-plank': { move: 'dips', equip: 'dip-bars', label: 'Gainage Isométrique Ki 3D', focus: 'Transverse • Grand Droit' },
    'ex-hanging-leg-raise': { move: 'pullup', equip: 'pullup-bar', label: 'Relevé de Jambes Suspendu 3D', focus: 'Abdominaux • Psoas' },
    'ex-cable-crunch': { move: 'bicep-curl', equip: 'dumbbell', label: 'Crunch Dynamique 3D', focus: 'Grand Droit Abdominaux' }
  };

  // Liste des mouvements disponibles dans le sélecteur d'aperçu 3D du Héros
  const PREVIEW_MOVES = [
    { id: 'idle-combat', label: '⚡ Posture Martiale', icon: '🔥' },
    { id: 'squat', label: '🏋️ Squat 3D', icon: '🏔️' },
    { id: 'bench-press', label: '💪 Développé Couché', icon: '⚔️' },
    { id: 'deadlift', label: '🔥 Soulevé de Terre', icon: '🐉' },
    { id: 'overhead-press', label: '👑 Développé Militaire', icon: '⚡' },
    { id: 'pullup', label: '🧗 Tractions 3D', icon: '🛡️' },
    { id: 'bicep-curl', label: '💪 Curl Biceps 3D', icon: '💥' },
    { id: 'lateral-raise', label: '🦅 Élévations 3D', icon: '✨' }
  ];

  // Cadences du Métronome de Tempo Biomécanique (Excentrique - Pause Bas - Concentrique - Pause Haut)
  const TEMPO_PRESETS = [
    {
      id: '3-1-1',
      label: '3-1-1 Hypertrophie',
      desc: '3s Descente contrôlée • 1s Pause bas • 1s Poussée explosive',
      ecc: 3.0,
      pauseBot: 1.0,
      conc: 1.0,
      pauseTop: 0.65
    },
    {
      id: '2-0-1',
      label: '2-0-1 Force Explosive',
      desc: '2s Descente • 0s Pause • 1s Explosion maximale',
      ecc: 2.0,
      pauseBot: 0.15,
      conc: 0.9,
      pauseTop: 0.55
    },
    {
      id: '4-2-1',
      label: '4-2-1 Contrôle Strict',
      desc: '4s Descente lente • 2s Pause isométrique • 1s Montée',
      ecc: 4.0,
      pauseBot: 2.0,
      conc: 1.1,
      pauseTop: 0.7
    }
  ];

  function resolveMoveForExercise(exerciseId) {
    if (!exerciseId || exerciseId === 'idle' || exerciseId === 'idle-combat') {
      return { move: 'idle-combat', equip: 'none', label: 'Posture Martiale de l\'Ordre 3D', focus: 'Concentration Cinétique & Posture' };
    }
    if (EXERCISE_TO_3D_MOVE[exerciseId]) {
      return EXERCISE_TO_3D_MOVE[exerciseId];
    }
    const ex = ns.Storage ? ns.Storage.getExerciseById(exerciseId) : null;
    if (ex) {
      const mg = (ex.muscleGroup || '').toLowerCase();
      if (mg.includes('pector')) return { move: 'bench-press', equip: 'barbell', label: ex.name + ' (3D)', focus: 'Pectoraux • Triceps' };
      if (mg.includes('dos')) return { move: 'row', equip: 'barbell', label: ex.name + ' (3D)', focus: 'Grand Dorsal • Trapèzes' };
      if (mg.includes('jambe')) return { move: 'squat', equip: 'barbell', label: ex.name + ' (3D)', focus: 'Quadriceps • Fessiers' };
      if (mg.includes('épaul') || mg.includes('epaul')) return { move: 'overhead-press', equip: 'barbell', label: ex.name + ' (3D)', focus: 'Deltoïdes' };
      if (mg.includes('bras')) return { move: 'bicep-curl', equip: 'dumbbell', label: ex.name + ' (3D)', focus: 'Biceps • Triceps' };
      if (mg.includes('abdo')) return { move: 'pullup', equip: 'pullup-bar', label: ex.name + ' (3D)', focus: 'Sangle Abdominale' };
    }
    return { move: 'squat', equip: 'barbell', label: 'Mouvement Athlétique 3D', focus: 'Force Globale' };
  }

  // État global du moteur 3D & du Métronome de Tempo
  const state3D = {
    activePreviewMove: 'idle-combat',
    autoRotate: true,
    yaw: 0.32,
    pitch: 0.08,
    zoom: 1.0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    powerBurstUntil: 0,
    tempoPresetId: '3-1-1',
    audioTempoEnabled: false,
    tempoStartSec: performance.now() / 1000,
    lastAudioCueKey: '',
    rafId: null,
    smoothedSkeleton: null,
    lastMoveId: 'idle-combat'
  };

  // ============================================================================
  // SYNTHÉTISEUR AUDIO SHONEN (HUD TACTIQUE, MÉTRONOME TEMPO & SURCHARGE CINÉTIQUE)
  // ============================================================================
  let sharedAudioCtx = null;
  function getAudioCtx() {
    if (!sharedAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  }

  function playSynthTone(freqStart, freqEnd, durationSec, waveType, gainPeak) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = waveType || 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(freqStart, now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + durationSec);
      }
      gain.gain.setValueAtTime(gainPeak || 0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.01);
    } catch (e) {
      // Ignorer si l'audio est restreint par le navigateur
    }
  }

  function triggerTempoAudioCue(cueType, secDigit) {
    if (ns.Audio && ns.Audio.hapticTempoTick) {
      ns.Audio.hapticTempoTick(cueType === 'ecc-tick' ? 'ecc' : cueType, secDigit);
    }
    if (!state3D.audioTempoEnabled) return;
    if (cueType === 'ecc-tick') {
      // Bip HUD Tactique précis sur chaque seconde de descente (3... 2... 1...)
      const freq = secDigit === 1 ? 740 : 620;
      playSynthTone(freq, freq, 0.055, 'triangle', 0.08);
    } else if (cueType === 'pause-bot') {
      // Verrouillage isométrique en bas
      playSynthTone(440, 520, 0.09, 'sine', 0.1);
    } else if (cueType === 'conc-go') {
      // Impulsion explosive Cinétique (Poussée / Tirage !)
      playSynthTone(523.25, 1046.5, 0.16, 'sawtooth', 0.09);
      setTimeout(() => playSynthTone(783.99, 1318.5, 0.12, 'triangle', 0.08), 45);
    }
  }

  function triggerScreenShake(durationMs, intensity) {
    if (typeof window === 'undefined') return;
    const dur = durationMs || 340;
    const force = intensity || 3.8;
    const target = document.querySelector('.app-shell-framed') || document.getElementById('app-root') || document.body;
    if (!target) return;
    const start = performance.now();
    function step() {
      const elapsed = performance.now() - start;
      if (elapsed < dur) {
        const factor = (1 - elapsed / dur) * force;
        const ox = (Math.random() - 0.5) * factor * 2;
        const oy = (Math.random() - 0.5) * factor * 2;
        target.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
        requestAnimationFrame(step);
      } else {
        target.style.transform = '';
      }
    }
    requestAnimationFrame(step);
  }

  function playPowerBurstSound() {
    if (ns.Audio && ns.Audio.triggerHaptic) {
      ns.Audio.triggerHaptic([40, 25, 75, 30, 130]);
    }
    const state = ns.Storage ? ns.Storage.getState() : null;
    if (state && state.profile && state.profile.soundEnabled === false && !state3D.audioTempoEnabled) return;
    // Son d'Éveil Cinétique / Surcharge d'Aura à la validation d'une série
    playSynthTone(220, 880, 0.28, 'sawtooth', 0.11);
    setTimeout(() => playSynthTone(587.33, 1174.66, 0.25, 'triangle', 0.1), 80);
  }

  // ============================================================================
  // CALCUL DU TEMPO BIOMÉCANIQUE EXACT (EXCENTRIQUE -> PAUSE -> CONCENTRIQUE)
  // ============================================================================
  function computeTempoPhase(tSec, moveId) {
    if (moveId === 'idle-combat') {
      const wave = (Math.sin(tSec * 2.2) + 1) * 0.5;
      return {
        repT: wave,
        phaseCode: 'IDLE',
        phaseTitle: '⚡ Posture Martiale — Concentration Cinétique',
        countdownText: '360°',
        barPct: Math.round(wave * 100),
        barColor: '#F59E0B',
        repCount: 0
      };
    }

    const preset = TEMPO_PRESETS.find((p) => p.id === state3D.tempoPresetId) || TEMPO_PRESETS[0];
    const cycleDur = preset.ecc + preset.pauseBot + preset.conc + preset.pauseTop;
    const elapsed = Math.max(0, tSec - state3D.tempoStartSec);
    const repCount = Math.floor(elapsed / cycleDur) + 1;
    const inCycle = elapsed % cycleDur;

    // Dans notre modèle 3D :
    // repT = 0 -> Position initiale (ex: debout en haut du squat ou bras tendus au développé couché)
    // repT = 1 -> Point d'inflexion / contraction ou bas du mouvement selon l'exercice
    // Pour harmoniser tous les mouvements avec le Tempo :
    // Phase 1 (Excentrique : preset.ecc s) : passage progressif de 0 -> 1 (ou descente maîtrisée)
    // Phase 2 (Pause Bas : preset.pauseBot s) : maintien à 1 (point d'étirement / bas)
    // Phase 3 (Concentrique : preset.conc s) : explosion de 1 -> 0 (ou montée puissante)
    // Phase 4 (Verrouillage Haut : preset.pauseTop s) : maintien à 0 (haut du mouvement)

    let phaseFactor = 0; // 0 = haut/repos, 1 = plein effort/bas
    let phaseCode = 'ECC';
    let phaseTitle = '';
    let countdownText = '';
    let barPct = 0;
    let barColor = '#38BDF8';

    if (inCycle < preset.ecc) {
      // Phase Excentrique (Descente contrôlée)
      const p = inCycle / preset.ecc;
      phaseFactor = 0.5 - 0.5 * Math.cos(p * Math.PI); // Smooth ease-in-out 0 -> 1
      const remSec = Math.ceil(preset.ecc - inCycle);
      phaseCode = 'ECC';
      phaseTitle = `⬇ EXCENTRIQUE CONTRÔLÉ (${remSec}s)`;
      countdownText = `${remSec}s`;
      barPct = Math.round(p * 100);
      barColor = '#38BDF8'; // Cyan

      const cueKey = `${repCount}-ecc-${remSec}`;
      if (state3D.lastAudioCueKey !== cueKey) {
        state3D.lastAudioCueKey = cueKey;
        triggerTempoAudioCue('ecc-tick', remSec);
      }
    } else if (inCycle < preset.ecc + preset.pauseBot) {
      // Phase Pause Isométrique
      const p = (inCycle - preset.ecc) / Math.max(0.05, preset.pauseBot);
      phaseFactor = 1.0;
      phaseCode = 'PAUSE';
      phaseTitle = `⏸ PAUSE ISOMÉTRIQUE — GAINAGE MAX`;
      countdownText = 'HOLD';
      barPct = Math.round(p * 100);
      barColor = '#F59E0B'; // Ambre

      const cueKey = `${repCount}-pause`;
      if (state3D.lastAudioCueKey !== cueKey) {
        state3D.lastAudioCueKey = cueKey;
        triggerTempoAudioCue('pause-bot', 0);
      }
    } else if (inCycle < preset.ecc + preset.pauseBot + preset.conc) {
      // Phase Concentrique Explosive
      const p = (inCycle - preset.ecc - preset.pauseBot) / preset.conc;
      phaseFactor = 1.0 - Math.pow(p, 0.72); // Explosion rapide 1 -> 0
      phaseCode = 'CONC';
      phaseTitle = `💥 EXPLOSION CONCENTRIQUE (POUSSEZ !)`;
      countdownText = 'GO !';
      barPct = Math.round(p * 100);
      barColor = '#10B981'; // Émeraude

      const cueKey = `${repCount}-conc`;
      if (state3D.lastAudioCueKey !== cueKey) {
        state3D.lastAudioCueKey = cueKey;
        triggerTempoAudioCue('conc-go', 0);
      }
    } else {
      // Phase Verrouillage Haut / Respiration
      const p = (inCycle - preset.ecc - preset.pauseBot - preset.conc) / preset.pauseTop;
      phaseFactor = 0.0;
      phaseCode = 'TOP';
      phaseTitle = `🌬️ VERROUILLAGE & INSPIRATION (BRACING)`;
      countdownText = `Rép #${repCount}`;
      barPct = Math.round((1 - p) * 100);
      barColor = '#A855F7'; // Violet
    }

    return {
      repT: phaseFactor,
      isConcentric: phaseCode === 'CONC',
      phaseCode,
      phaseTitle,
      countdownText,
      barPct,
      barColor,
      repCount,
      preset
    };
  }

  // ============================================================================
  // MATHÉMATIQUES 3D & CINÉMATIQUE ARTICULÉE DU STRIKER CINÉTIQUE
  // ============================================================================
  function vec3(x, y, z) {
    return { x, y, z };
  }
  function add3(a, b) {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }
  function sub3(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }
  function scale3(a, s) {
    return { x: a.x * s, y: a.y * s, z: a.z * s };
  }
  function lerp3(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
  }
  function dot3(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  function cross3(a, b) {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }
  function norm3(a) {
    const len = Math.hypot(a.x, a.y, a.z) || 1;
    return { x: a.x / len, y: a.y / len, z: a.z / len };
  }

  function computeSkeleton3D(moveId, tSec, hero) {
    const tempo = computeTempoPhase(tSec, moveId);
    const repT = tempo.repT;

    // Hypertrophie dynamique & morphologie RPG du joueur
    const attrs = hero?.attributes || [];
    const strVal = attrs.find((a) => a.code === 'FOR')?.value || 55;
    const vitVal = attrs.find((a) => a.code === 'VIT')?.value || 55;
    const puiVal = attrs.find((a) => a.code === 'PUI')?.value || 55;

    const morphId = hero?.morphologyObj?.id || hero?.appearance?.morphology || 'athletic-vtaper';
    let morphScaleU = 1.0;
    let morphScaleB = 1.0;
    let morphScaleL = 1.0;
    if (morphId === 'colossal-titan') {
      morphScaleU = 1.22;
      morphScaleB = 1.25;
      morphScaleL = 1.18;
    } else if (morphId === 'agile-stalker') {
      morphScaleU = 0.90;
      morphScaleB = 0.88;
      morphScaleL = 0.92;
    }

    const upperScale = (0.94 + (strVal / 100) * 0.24) * morphScaleU;
    const backScale = (0.94 + (vitVal / 100) * 0.24) * morphScaleB;
    const legScale = (0.94 + (puiVal / 100) * 0.24) * morphScaleL;

    const pump = moveId === 'idle-combat' ? 0.03 * Math.sin(tSec * 3) : (tempo.phaseCode === 'CONC' ? 0.11 : 0.06 * repT);

    // Squelette par défaut (Debout de plein pied)
    let j = {
      pelvis: vec3(0, -0.06, 0),
      waist: vec3(0, 0.10, 0),
      chest: vec3(0, 0.36, 0.01),
      neck: vec3(0, 0.54, 0.01),
      head: vec3(0, 0.70, 0.02),

      shoulderL: vec3(-0.21 * upperScale, 0.46, 0),
      shoulderR: vec3(0.21 * upperScale, 0.46, 0),
      elbowL: vec3(-0.24 * upperScale, 0.18, 0.02),
      elbowR: vec3(0.24 * upperScale, 0.18, 0.02),
      wristL: vec3(-0.24 * upperScale, -0.10, 0.04),
      wristR: vec3(0.24 * upperScale, -0.10, 0.04),

      hipL: vec3(-0.10, -0.08, 0),
      hipR: vec3(0.10, -0.08, 0),
      kneeL: vec3(-0.11, -0.46, 0.02),
      kneeR: vec3(0.11, -0.46, 0.02),
      ankleL: vec3(-0.11, -0.82, 0.01),
      ankleR: vec3(0.11, -0.82, 0.01),
      toeL: vec3(-0.11, -0.86, 0.13),
      toeR: vec3(0.11, -0.86, 0.13),

      upperScale: upperScale + pump,
      backScale: backScale + pump,
      legScale: legScale + pump,
      repT,
      tempo,
      phaseLabel: tempo.phaseTitle,
      activeTargetZone: 'all'
    };

    if (moveId === 'idle-combat') {
      const breath = Math.sin(tSec * 2.4) * 0.018;
      j.pelvis.y += breath * 0.4;
      j.waist.y += breath * 0.6;
      j.chest.y += breath * 0.9;
      j.neck.y += breath * 0.9;
      j.head.y += breath * 0.9;
      j.shoulderL.y += breath * 0.8;
      j.shoulderR.y += breath * 0.8;
      j.elbowL = vec3(-0.24 * upperScale, 0.18 + breath * 0.6, 0.02);
      j.elbowR = vec3(0.24 * upperScale, 0.18 + breath * 0.6, 0.02);
      j.wristL = vec3(-0.24 * upperScale, -0.10 + breath * 0.4, 0.04);
      j.wristR = vec3(0.24 * upperScale, -0.10 + breath * 0.4, 0.04);
      j.activeTargetZone = 'core';
    } else if (moveId === 'squat') {
      const drop = repT * 0.42;
      const forwardLean = repT * 0.14;
      j.pelvis = vec3(0, -0.06 - drop, -repT * 0.14);
      j.waist = vec3(0, 0.08 - drop, -repT * 0.08);
      j.chest = vec3(0, 0.38 - drop * 0.92, forwardLean);
      j.neck = vec3(0, 0.60 - drop * 0.90, forwardLean + 0.03);
      j.head = vec3(0, 0.76 - drop * 0.90, forwardLean + 0.06);

      const shY = 0.50 - drop * 0.92;
      j.shoulderL = vec3(-0.31 * upperScale, shY, forwardLean);
      j.shoulderR = vec3(0.31 * upperScale, shY, forwardLean);
      j.elbowL = vec3(-0.46, shY - 0.20, forwardLean - 0.06);
      j.elbowR = vec3(0.46, shY - 0.20, forwardLean - 0.06);
      j.wristL = vec3(-0.48, shY + 0.02, forwardLean - 0.02);
      j.wristR = vec3(0.48, shY + 0.02, forwardLean - 0.02);

      j.hipL = vec3(-0.17, -0.08 - drop, -repT * 0.14);
      j.hipR = vec3(0.17, -0.08 - drop, -repT * 0.14);
      j.kneeL = vec3(-0.28 - repT * 0.06, -0.52 - drop * 0.18, 0.10 + repT * 0.22);
      j.kneeR = vec3(0.28 + repT * 0.06, -0.52 - drop * 0.18, 0.10 + repT * 0.22);
      j.activeTargetZone = 'legs';
    } else if (moveId === 'bench-press') {
      // Sur le banc : repT=1 = barre sur la poitrine (bas), repT=0 = bras tendus (haut)
      const pressH = (1 - repT) * 0.38;
      const benchY = -0.18;
      j.pelvis = vec3(0, benchY, 0.25);
      j.waist = vec3(0, benchY + 0.04, 0.05);
      j.chest = vec3(0, benchY + 0.08, -0.20);
      j.neck = vec3(0, benchY + 0.06, -0.40);
      j.head = vec3(0, benchY + 0.07, -0.54);

      j.shoulderL = vec3(-0.30 * upperScale, benchY + 0.06, -0.22);
      j.shoulderR = vec3(0.30 * upperScale, benchY + 0.06, -0.22);

      j.elbowL = vec3(-0.46 + (1 - repT) * 0.10, benchY - 0.04 + pressH * 0.55, -0.16);
      j.elbowR = vec3(0.46 - (1 - repT) * 0.10, benchY - 0.04 + pressH * 0.55, -0.16);

      j.wristL = vec3(-0.38, benchY + 0.16 + pressH, -0.18);
      j.wristR = vec3(0.38, benchY + 0.16 + pressH, -0.18);

      j.hipL = vec3(-0.16, benchY, 0.26);
      j.hipR = vec3(0.16, benchY, 0.26);
      j.kneeL = vec3(-0.26, benchY + 0.02, 0.62);
      j.kneeR = vec3(0.26, benchY + 0.02, 0.62);
      j.ankleL = vec3(-0.26, -0.88, 0.58);
      j.ankleR = vec3(0.26, -0.88, 0.58);
      j.toeL = vec3(-0.28, -0.92, 0.72);
      j.toeR = vec3(0.28, -0.92, 0.72);
      j.activeTargetZone = 'chest';
    } else if (moveId === 'deadlift') {
      // repT=0 = debout verrouillé en haut, repT=1 = penché en bas (étirement ischios)
      const hinge = repT;
      j.pelvis = vec3(0, -0.08 - hinge * 0.20, -hinge * 0.22);
      j.waist = vec3(0, 0.06 - hinge * 0.22, -hinge * 0.10);
      j.chest = vec3(0, 0.36 - hinge * 0.32, hinge * 0.18);
      j.neck = vec3(0, 0.58 - hinge * 0.36, hinge * 0.32);
      j.head = vec3(0, 0.74 - hinge * 0.36, hinge * 0.40);

      j.shoulderL = vec3(-0.31 * upperScale, 0.48 - hinge * 0.34, hinge * 0.20);
      j.shoulderR = vec3(0.31 * upperScale, 0.48 - hinge * 0.34, hinge * 0.20);

      const barY = -0.12 - hinge * 0.44;
      j.elbowL = vec3(-0.34, barY + 0.26, 0.18);
      j.elbowR = vec3(0.34, barY + 0.26, 0.18);
      j.wristL = vec3(-0.32, barY, 0.20);
      j.wristR = vec3(0.32, barY, 0.20);

      j.hipL = vec3(-0.16, j.pelvis.y, j.pelvis.z);
      j.hipR = vec3(0.16, j.pelvis.y, j.pelvis.z);
      j.kneeL = vec3(-0.20, -0.52 - hinge * 0.08, 0.10 + hinge * 0.08);
      j.kneeR = vec3(0.20, -0.52 - hinge * 0.08, 0.10 + hinge * 0.08);
      j.activeTargetZone = 'back';
    } else if (moveId === 'overhead-press') {
      // repT=1 = barre aux clavicules, repT=0 = bras tendus au-dessus de la tête
      const lift = (1 - repT) * 0.48;
      j.shoulderL = vec3(-0.32 * upperScale, 0.49 + (1 - repT) * 0.04, 0.01);
      j.shoulderR = vec3(0.32 * upperScale, 0.49 + (1 - repT) * 0.04, 0.01);
      j.elbowL = vec3(-0.44 + (1 - repT) * 0.08, 0.28 + lift * 0.78, 0.12 - (1 - repT) * 0.08);
      j.elbowR = vec3(0.44 - (1 - repT) * 0.08, 0.28 + lift * 0.78, 0.12 - (1 - repT) * 0.08);
      j.wristL = vec3(-0.36 + (1 - repT) * 0.04, 0.56 + lift, 0.14 - (1 - repT) * 0.10);
      j.wristR = vec3(0.36 - (1 - repT) * 0.04, 0.56 + lift, 0.14 - (1 - repT) * 0.10);
      j.activeTargetZone = 'shoulders';
    } else if (moveId === 'pullup') {
      // repT=1 = suspendu en bas (étirement), repT=0 = menton au-dessus de la barre
      const pullY = (1 - repT) * 0.38 - 0.14;
      const barY = 0.98;
      j.pelvis.y += pullY;
      j.waist.y += pullY;
      j.chest.y += pullY;
      j.neck.y += pullY;
      j.head.y += pullY;
      j.shoulderL.y += pullY;
      j.shoulderR.y += pullY;

      j.wristL = vec3(-0.42, barY, 0.02);
      j.wristR = vec3(0.42, barY, 0.02);
      j.elbowL = vec3(-0.48, 0.62 + pullY * 0.35, -0.04);
      j.elbowR = vec3(0.48, 0.62 + pullY * 0.35, -0.04);

      j.hipL.y += pullY;
      j.hipR.y += pullY;
      j.kneeL = vec3(-0.18, -0.50 + pullY, 0.04);
      j.kneeR = vec3(0.18, -0.50 + pullY, 0.04);
      j.ankleL = vec3(-0.18, -0.82 + pullY, -0.14);
      j.ankleR = vec3(0.18, -0.82 + pullY, -0.14);
      j.toeL = vec3(-0.18, -0.88 + pullY, -0.06);
      j.toeR = vec3(0.18, -0.88 + pullY, -0.06);
      j.activeTargetZone = 'back';
    } else if (moveId === 'row') {
      const pull = 1 - repT;
      j.pelvis = vec3(0, -0.10, -0.18);
      j.waist = vec3(0, 0.02, -0.06);
      j.chest = vec3(0, 0.24, 0.18);
      j.neck = vec3(0, 0.42, 0.34);
      j.head = vec3(0, 0.56, 0.44);

      j.shoulderL = vec3(-0.31 * upperScale, 0.32, 0.20);
      j.shoulderR = vec3(0.31 * upperScale, 0.32, 0.20);

      j.elbowL = vec3(-0.38, 0.06 + pull * 0.28, 0.22 - pull * 0.24);
      j.elbowR = vec3(0.38, 0.06 + pull * 0.28, 0.22 - pull * 0.24);
      j.wristL = vec3(-0.34, -0.22 + pull * 0.28, 0.26 - pull * 0.16);
      j.wristR = vec3(0.34, -0.22 + pull * 0.28, 0.26 - pull * 0.16);

      j.hipL = vec3(-0.16, -0.10, -0.18);
      j.hipR = vec3(0.16, -0.10, -0.18);
      j.kneeL = vec3(-0.21, -0.52, 0.06);
      j.kneeR = vec3(0.21, -0.52, 0.06);
      j.activeTargetZone = 'back';
    } else if (moveId === 'bicep-curl') {
      const curl = 1 - repT;
      j.elbowL = vec3(-0.36 * upperScale, 0.15, 0.06);
      j.elbowR = vec3(0.36 * upperScale, 0.15, 0.06);
      const angle = -1.25 + curl * 2.15;
      const fLen = 0.29;
      j.wristL = vec3(-0.35 * upperScale, j.elbowL.y + Math.sin(angle) * fLen, j.elbowL.z + Math.cos(angle) * fLen);
      j.wristR = vec3(0.35 * upperScale, j.elbowR.y + Math.sin(angle) * fLen, j.elbowR.z + Math.cos(angle) * fLen);
      j.activeTargetZone = 'arms';
    } else if (moveId === 'lateral-raise') {
      const raise = 1 - repT;
      const spreadX = 0.22 + raise * 0.42;
      const armY = 0.08 + raise * 0.44;
      j.elbowL = vec3(-(0.28 + raise * 0.22), 0.22 + raise * 0.28, 0.06);
      j.elbowR = vec3(0.28 + raise * 0.22, 0.22 + raise * 0.28, 0.06);
      j.wristL = vec3(-spreadX, armY, 0.10);
      j.wristR = vec3(spreadX, armY, 0.10);
      j.activeTargetZone = 'shoulders';
    } else if (moveId === 'dips') {
      const dipDrop = repT * 0.28;
      j.pelvis.y += 0.12 - dipDrop;
      j.waist.y += 0.12 - dipDrop;
      j.chest.y += 0.12 - dipDrop;
      j.neck.y += 0.12 - dipDrop;
      j.head.y += 0.12 - dipDrop;
      j.shoulderL.y += 0.12 - dipDrop;
      j.shoulderR.y += 0.12 - dipDrop;

      j.wristL = vec3(-0.38, 0.16, 0.04);
      j.wristR = vec3(0.38, 0.16, 0.04);
      j.elbowL = vec3(-0.42, 0.34 - dipDrop * 0.45, -0.14);
      j.elbowR = vec3(0.42, 0.34 - dipDrop * 0.45, -0.14);

      j.hipL = vec3(-0.15, j.pelvis.y - 0.02, -0.04);
      j.hipR = vec3(0.15, j.pelvis.y - 0.02, -0.04);
      j.kneeL = vec3(-0.16, j.hipL.y - 0.38, 0.02);
      j.kneeR = vec3(0.16, j.hipR.y - 0.38, 0.02);
      j.ankleL = vec3(-0.16, j.kneeL.y - 0.32, -0.18);
      j.ankleR = vec3(0.16, j.kneeR.y - 0.32, -0.18);
      j.toeL = vec3(-0.16, j.ankleL.y - 0.06, -0.10);
      j.toeR = vec3(0.16, j.ankleR.y - 0.06, -0.10);
      j.activeTargetZone = 'chest';
    }

    return j;
  }

  // ============================================================================
  // MOTEUR WEBGL THREE.JS (SHADERS CEL-SHADING ANIME + OUTLINE + LUMIÈRES 3D)
  // ============================================================================
  let threeCtx = null;

  function initThreeEngine() {
    if (threeCtx) return threeCtx;
    const THREE = window.THREE;
    if (!THREE) return null;

    try {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(320, 272, false);

      // Gestion résiliente des pertes de contexte WebGL (mise en veille mobile)
      renderer.domElement.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        console.warn('[IronPulse 3D] Contexte WebGL mis en veille temporaire.');
      }, false);
      renderer.domElement.addEventListener('webglcontextrestored', () => {
        console.info('[IronPulse 3D] Contexte WebGL restauré avec succès.');
        toonGradientMap.needsUpdate = true;
      }, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 320 / 272, 0.1, 50);

      // Gradient Map 4 tons Cel-Shading Anime (Style Shonen Fighter / Toon Shader)
      const gradData = new Uint8Array([90, 155, 220, 255]);
      const toonGradientMap = new THREE.DataTexture(gradData, 4, 1, THREE.LuminanceFormat);
      toonGradientMap.minFilter = THREE.NearestFilter;
      toonGradientMap.magFilter = THREE.NearestFilter;
      toonGradientMap.needsUpdate = true;

      // Éclairage dynamique 3D
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.72);
      hemiLight.position.set(0, 3, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.05);
      dirLight.position.set(2.2, 3.6, 3.2);
      scene.add(dirLight);

      const auraPointLight = new THREE.PointLight(0xf59e0b, 1.4, 6);
      auraPointLight.position.set(0, 0.3, -0.9);
      scene.add(auraPointLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.55);
      rimLight.position.set(-2.5, 1.5, -2.5);
      scene.add(rimLight);

      // Éclairage de visage adouci (Rétro-ingénierie Arc System Works / Guilty Gear)
      const faceLight = new THREE.DirectionalLight(0xfff8ee, 0.42);
      faceLight.position.set(0, 0.72, 2.6);
      scene.add(faceLight);

      // Groupe racine qui tourne avec la caméra orbitale (Yaw / Pitch)
      const worldRoot = new THREE.Group();
      scene.add(worldRoot);

      // Matériau contour d'encre noire Anime (Inverted Hull BackSide)
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x090d16,
        side: THREE.BackSide
      });

      const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1);
      const sphGeo = new THREE.SphereGeometry(1, 18, 16);
      const coneGeo = new THREE.ConeGeometry(1, 1, 14);
      coneGeo.translate(0, 0.5, 0); // Base du cône à l'origine

      const capsulesPool = [];
      const spheresPool = [];
      const conesPool = [];

      function getOrCreateCapsule(idx) {
        while (capsulesPool.length <= idx) {
          const group = new THREE.Group();
          const mat = new THREE.MeshToonMaterial({
            color: 0xeda06b,
            gradientMap: toonGradientMap
          });
          const mesh = new THREE.Mesh(cylGeo, mat);
          const outline = new THREE.Mesh(cylGeo, outlineMat);
          outline.scale.set(1.035, 1.008, 1.035);
          group.add(mesh);
          group.add(outline);
          worldRoot.add(group);
          capsulesPool.push({ group, mesh, outline, mat });
        }
        return capsulesPool[idx];
      }

      function getOrCreateSphere(idx) {
        while (spheresPool.length <= idx) {
          const group = new THREE.Group();
          const mat = new THREE.MeshToonMaterial({
            color: 0xeda06b,
            gradientMap: toonGradientMap
          });
          const mesh = new THREE.Mesh(sphGeo, mat);
          const outline = new THREE.Mesh(sphGeo, outlineMat);
          outline.scale.set(1.035, 1.035, 1.035);
          group.add(mesh);
          group.add(outline);
          worldRoot.add(group);
          spheresPool.push({ group, mesh, outline, mat });
        }
        return spheresPool[idx];
      }

      function getOrCreateCone(idx) {
        while (conesPool.length <= idx) {
          const group = new THREE.Group();
          const mat = new THREE.MeshToonMaterial({
            color: 0x0f172a,
            gradientMap: toonGradientMap
          });
          const mesh = new THREE.Mesh(coneGeo, mat);
          const outline = new THREE.Mesh(coneGeo, outlineMat);
          outline.scale.set(1.05, 1.015, 1.05);
          group.add(mesh);
          group.add(outline);
          worldRoot.add(group);
          conesPool.push({ group, mesh, outline, mat });
        }
        return conesPool[idx];
      }

      // --- TEXTURE D'OMBRE DE CONTACT SOL PROCÉDURALE (Soft Contact Blob) ---
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 60);
      grad.addColorStop(0, 'rgba(6, 10, 18, 0.92)');
      grad.addColorStop(0.35, 'rgba(6, 10, 18, 0.58)');
      grad.addColorStop(0.75, 'rgba(6, 10, 18, 0.16)');
      grad.addColorStop(1, 'rgba(6, 10, 18, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowPlaneGeo = new THREE.PlaneGeometry(1, 1);
      shadowPlaneGeo.rotateX(-Math.PI / 2);

      function createShadowMesh(baseOpacity) {
        const mat = new THREE.MeshBasicMaterial({
          map: shadowTexture,
          transparent: true,
          opacity: baseOpacity || 0.65,
          depthWrite: false
        });
        const mesh = new THREE.Mesh(shadowPlaneGeo, mat);
        mesh.renderOrder = 1;
        worldRoot.add(mesh);
        return { mesh, mat };
      }

      const footShadowL = createShadowMesh(0.75);
      const footShadowR = createShadowMesh(0.75);
      const pelvisShadow = createShadowMesh(0.55);

      threeCtx = {
        THREE,
        renderer,
        scene,
        camera,
        worldRoot,
        auraPointLight,
        rimLight,
        capsulesPool,
        spheresPool,
        conesPool,
        footShadowL,
        footShadowR,
        pelvisShadow,
        getOrCreateCapsule,
        getOrCreateSphere,
        getOrCreateCone,
        upVec: new THREE.Vector3(0, 1, 0),
        tmpV1: new THREE.Vector3(),
        tmpV2: new THREE.Vector3(),
        tmpDir: new THREE.Vector3(),
        faceLight,
        loadedGltf: null,
        loadGltfModel(url, onLoaded, onError) {
          if (!THREE.GLTFLoader) {
            if (onError) onError(new Error('GLTFLoader indisponible'));
            return;
          }
          const loader = new THREE.GLTFLoader();
          loader.load(
            url,
            (gltf) => {
              if (threeCtx && threeCtx.loadedGltf && threeCtx.loadedGltf.scene) {
                worldRoot.remove(threeCtx.loadedGltf.scene);
              }
              if (threeCtx) threeCtx.loadedGltf = gltf;
              worldRoot.add(gltf.scene);
              if (onLoaded) onLoaded(gltf);
            },
            undefined,
            onError
          );
        },
        dispose() {
          try {
            cylGeo.dispose();
            sphGeo.dispose();
            coneGeo.dispose();
            outlineMat.dispose();
            toonGradientMap.dispose();
            shadowTexture.dispose();
            shadowPlaneGeo.dispose();
            capsulesPool.forEach((p) => { if (p.mat) p.mat.dispose(); });
            spheresPool.forEach((p) => { if (p.mat) p.mat.dispose(); });
            conesPool.forEach((p) => { if (p.mat) p.mat.dispose(); });
            renderer.dispose();
            threeCtx = null;
          } catch (err) {
            console.warn('[IronPulse 3D] Dispose WebGL :', err);
          }
        }
      };
      return threeCtx;
    } catch (e) {
      console.warn('Initialisation WebGL Three.js indisponible, bascule sur le moteur 3D logiciel :', e);
      return null;
    }
  }

  // Projection 3D logicielle (utilisée pour les superpositions d'éclairs / anneaux au sol et en fallback hors-ligne)
  function rotatePoint(p, yaw, pitch) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const x1 = p.x * cy + p.z * sy;
    const z1 = -p.x * sy + p.z * cy;
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const y2 = p.y * cp - z1 * sp;
    const z2 = p.y * sp + z1 * cp;
    return { x: x1, y: y2, z: z2 };
  }

  function projectPoint(p, yaw, pitch, width, height, scaleFactor) {
    const r = rotatePoint(p, yaw, pitch);
    const camDist = 4.35;
    const fov = 3.25 * scaleFactor;
    const zDepth = camDist - r.z;
    const persp = fov / Math.max(0.8, zDepth);
    return {
      sx: width * 0.5 + r.x * persp * (width * 0.44),
      sy: height * 0.54 - r.y * persp * (width * 0.44),
      z: r.z,
      persp: persp * (width * 0.44),
      world: r
    };
  }

  function hexToRgb(hex) {
    const clean = String(hex || '#F59E0B').replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function shadeHex(hex, factor) {
    const { r, g, b } = hexToRgb(hex);
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    if (factor >= 1) {
      const boost = (factor - 1) * 165;
      return `rgb(${clamp(r + boost)}, ${clamp(g + boost)}, ${clamp(b + boost)})`;
    }
    return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
  }

  // ============================================================================
  // RENDU HYBRIDE : WEBGL THREE.JS (CEL-SHADING ANIME) + HUD BIOMÉCANIQUE & KI
  // ============================================================================
  function renderHero3DCanvas(canvas, hero, moveConfig) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || 260;
    const cssH = canvas.clientHeight || 272;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const tSec = performance.now() / 1000;
    const isBurst = performance.now() < state3D.powerBurstUntil;

    const app = hero?.appearance || {};
    const auraId = app.auraStyle || app.auraColor || 'crimson';
    const aura = (ns.RPG?.AURA_STYLES || []).find((a) => a.id === auraId) || hero?.auraObj || {
      primary: '#F43F5E',
      secondary: '#FEF08A',
      glow: 'rgba(244, 63, 94, 0.75)'
    };
    const hair = hero?.hairObj || { id: 'obsidian', hex: '#0F172A', stroke: '#475569' };
    const armor = hero?.armorObj || { start: '#334155', mid: '#1E293B', end: '#090D16', sash: '#E11D48' };
    const sashColor = armor.sash || '#E11D48';

    const moveId = moveConfig?.move || state3D.activePreviewMove || 'idle-combat';
    const equipType =
      moveConfig?.equip ||
      (moveId === 'squat' || moveId === 'bench-press' || moveId === 'deadlift' || moveId === 'overhead-press' || moveId === 'row'
        ? 'barbell'
        : moveId === 'bicep-curl' || moveId === 'lateral-raise'
        ? 'dumbbell'
        : moveId === 'pullup'
        ? 'pullup-bar'
        : moveId === 'dips'
        ? 'dip-bars'
        : 'none');

    const yaw = state3D.autoRotate && !state3D.isDragging
      ? (moveId === 'bench-press' ? 0.68 + Math.sin(tSec * 0.55) * 0.42 : Math.sin(tSec * 0.6) * 0.52)
      : state3D.yaw;
    const pitch = state3D.pitch;
    const zoom = state3D.zoom;

    const rawSk = computeSkeleton3D(moveId, tSec, hero);
    // Interpolation cinématique douce (Lerp) pour éliminer tout saut brutal entre exercices
    let sk = rawSk;
    if (state3D.smoothedSkeleton && state3D.lastMoveId !== moveId) {
      const lerpKeys = ['pelvis', 'waist', 'chest', 'neck', 'head', 'shoulderL', 'shoulderR', 'elbowL', 'elbowR', 'wristL', 'wristR', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'toeL', 'toeR'];
      sk = { ...rawSk };
      lerpKeys.forEach((k) => {
        if (state3D.smoothedSkeleton[k] && rawSk[k]) {
          sk[k] = lerp3(state3D.smoothedSkeleton[k], rawSk[k], 0.22);
        }
      });
      // Vérifier si la transition est presque complète
      const distHead = sub3(sk.head, rawSk.head).length ? sub3(sk.head, rawSk.head).length() : 0;
      if (distHead < 0.015) {
        state3D.lastMoveId = moveId;
      }
    } else {
      state3D.lastMoveId = moveId;
    }
    state3D.smoothedSkeleton = sk;

    // 1. ARRIÈRE-PLAN : HALO KI VOLUMÉTRIQUE & GRILLE 3D SALLE DE GRAVITÉ AU SOL
    const floorY = -0.99;
    ctx.save();
    const torsoProj = projectPoint(sk.chest, yaw, pitch, cssW, cssH, zoom);
    const auraRadius = (isBurst ? 140 : 102 + sk.repT * 20) * zoom;
    const auraGrad = ctx.createRadialGradient(
      torsoProj.sx,
      torsoProj.sy,
      8,
      torsoProj.sx,
      torsoProj.sy,
      auraRadius
    );
    auraGrad.addColorStop(0, isBurst ? '#FEF08A' : aura.secondary + 'BB');
    auraGrad.addColorStop(0.45, aura.primary + '66');
    auraGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(torsoProj.sx, torsoProj.sy, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    for (let rIdx = 1; rIdx <= 2; rIdx++) {
      const rad = rIdx * 0.52;
      ctx.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2 + (rIdx === 1 ? tSec * 0.4 : -tSec * 0.3);
        const pt = projectPoint(vec3(Math.cos(a) * rad, floorY, Math.sin(a) * rad), yaw, pitch, cssW, cssH, zoom);
        if (i === 0) ctx.moveTo(pt.sx, pt.sy);
        else ctx.lineTo(pt.sx, pt.sy);
      }
      ctx.strokeStyle = rIdx === 1 ? aura.primary + 'BB' : aura.secondary + '55';
      ctx.lineWidth = rIdx === 1 ? 1.8 : 1.1;
      ctx.setLineDash(rIdx === 1 ? [6, 4] : []);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // ========================================================================
    // CONSTRUCTION DES PRIMITIVES 3D DU PERSONNAGE & DE SON ÉQUIPEMENT
    // ========================================================================
    const primitives = [];
    const gl = initThreeEngine();
    let glCapIdx = 0;
    let glSphIdx = 0;
    let glConeIdx = 0;

    function pushCapsule(pA, pB, rA, rB, baseHex, outlineHex, highlightZone, isConeSpike) {
      const isGlowing = Boolean(highlightZone && sk.activeTargetZone === highlightZone && (sk.repT > 0.45 || sk.tempo.phaseCode === 'CONC'));

      if (gl) {
        const { tmpV1, tmpV2, tmpDir, upVec } = gl;
        tmpV1.set(pA.x, pA.y, pA.z);
        tmpV2.set(pB.x, pB.y, pB.z);
        tmpDir.subVectors(tmpV2, tmpV1);
        const len = tmpDir.length();
        if (len > 0.0005) {
          tmpDir.normalize();
          if (isConeSpike) {
            const item = gl.getOrCreateCone(glConeIdx++);
            item.group.visible = true;
            item.group.position.copy(tmpV1);
            item.group.quaternion.setFromUnitVectors(upVec, tmpDir);
            item.mesh.scale.set(rA, len, rA * 0.88);
            item.outline.scale.set(rA * 1.14, len * 1.03, rA * 1.02);
            item.mat.color.set(baseHex);
            item.mat.emissive.set(isBurst ? '#F59E0B' : '#000000');
            item.mat.emissiveIntensity = isBurst ? 0.35 : 0;
          } else {
            const item = gl.getOrCreateCapsule(glCapIdx++);
            item.group.visible = true;
            item.group.position.copy(tmpV1).addScaledVector(tmpDir, len * 0.5);
            item.group.quaternion.setFromUnitVectors(upVec, tmpDir);
            const avgR = (rA + rB) * 0.5;
            item.mesh.scale.set(avgR, len, avgR);
            item.outline.scale.set(avgR * 1.035, len * 1.01, avgR * 1.035);
            item.mat.color.set(baseHex);
            item.mat.emissive.set(isGlowing ? aura.primary : (isBurst ? '#F59E0B' : '#000000'));
            item.mat.emissiveIntensity = isGlowing ? 0.42 : (isBurst ? 0.25 : 0);

            // Sphères d'articulation aux extrémités pour un galbe organique sans couture
            const capStart = gl.getOrCreateSphere(glSphIdx++);
            capStart.group.visible = true;
            capStart.group.position.copy(tmpV1);
            capStart.mesh.scale.set(rA, rA, rA);
            capStart.outline.scale.set(rA * 1.035, rA * 1.035, rA * 1.035);
            capStart.mat.color.set(baseHex);
            capStart.mat.emissive.set(isGlowing ? aura.primary : '#000000');
            capStart.mat.emissiveIntensity = isGlowing ? 0.38 : 0;

            const capEnd = gl.getOrCreateSphere(glSphIdx++);
            capEnd.group.visible = true;
            capEnd.group.position.copy(tmpV2);
            capEnd.mesh.scale.set(rB, rB, rB);
            capEnd.outline.scale.set(rB * 1.035, rB * 1.035, rB * 1.035);
            capEnd.mat.color.set(baseHex);
            capEnd.mat.emissive.set(isGlowing ? aura.primary : '#000000');
            capEnd.mat.emissiveIntensity = isGlowing ? 0.38 : 0;
          }
        }
      }

      // Conserver aussi dans primitives pour le fallback hors-ligne
      const a = projectPoint(pA, yaw, pitch, cssW, cssH, zoom);
      const b = projectPoint(pB, yaw, pitch, cssW, cssH, zoom);
      primitives.push({
        type: 'capsule',
        z: (a.z + b.z) * 0.5,
        a,
        b,
        rA: rA * a.persp,
        rB: rB * b.persp,
        baseHex,
        outlineHex: outlineHex || '#1E293B',
        glow: isGlowing
      });
    }

    function pushSphere(pCenter, radius, baseHex, outlineHex, highlightZone, scaleVec) {
      const isGlowing = Boolean(highlightZone && sk.activeTargetZone === highlightZone && (sk.repT > 0.45 || sk.tempo.phaseCode === 'CONC'));

      if (gl) {
        const item = gl.getOrCreateSphere(glSphIdx++);
        item.group.visible = true;
        item.group.position.set(pCenter.x, pCenter.y, pCenter.z);
        const sx = scaleVec ? radius * scaleVec.x : radius;
        const sy = scaleVec ? radius * scaleVec.y : radius;
        const sz = scaleVec ? radius * scaleVec.z : radius;
        item.mesh.scale.set(sx, sy, sz);
        item.outline.scale.set(sx * 1.035, sy * 1.035, sz * 1.035);
        item.mat.color.set(baseHex);
        item.mat.emissive.set(isGlowing ? aura.primary : '#000000');
        item.mat.emissiveIntensity = isGlowing ? 0.42 : 0;
      }

      const c = projectPoint(pCenter, yaw, pitch, cssW, cssH, zoom);
      primitives.push({
        type: 'sphere',
        z: c.z,
        c,
        r: radius * c.persp,
        baseHex,
        outlineHex: outlineHex || '#1E293B',
        glow: isGlowing
      });
    }

    const skinBase = hero?.skinObj?.hex || '#EDA06B';
    const skinMuscle = hero?.skinObj?.shade || '#E08A53';
    const skinOutline = hero?.skinObj?.shadow || '#6B3112';
    const isFemale = (hero?.genderObj?.id || hero?.appearance?.gender) === 'female';
    const eyeHex = hero?.eyeObj?.hex || '#06B6D4';
    const eyeGlowHex = hero?.eyeObj?.glow || '#67E8F9';
    const hairstyleId = hero?.hairStyleObj?.id || hero?.appearance?.hairstyle || 'spiky-striker';
    const morphId = hero?.morphologyObj?.id || hero?.appearance?.morphology || 'athletic-vtaper';
    const outfitId = hero?.outfitObj?.id || hero?.appearance?.outfit || 'techwear-dogi';
    const jawId = hero?.jawTypeObj?.id || hero?.appearance?.jawType || 'v-sharp';
    const powerEquipments = hero?.powerEquipments || hero?.appearance?.powerEquipments || [];
    const dogiHex = armor.start || '#334155';
    const dogiDark = armor.mid || '#1E293B';

    // --- ÉQUIPEMENTS D'ENTRAÎNEMENT 3D DANS LA SCÈNE ---
    if (moveId === 'bench-press' && equipType !== 'bodyweight') {
      const bY = -0.26;
      pushCapsule(vec3(0, bY, -0.66), vec3(0, bY, 0.30), 0.16, 0.16, '#1E293B', '#475569');
      pushCapsule(vec3(0, bY, -0.52), vec3(0, floorY, -0.52), 0.05, 0.06, '#475569', '#0F172A');
      pushCapsule(vec3(0, bY, 0.22), vec3(0, floorY, 0.22), 0.05, 0.06, '#475569', '#0F172A');
      pushCapsule(vec3(-0.56, floorY, -0.32), vec3(-0.56, 0.35, -0.32), 0.04, 0.04, '#334155', '#0F172A');
      pushCapsule(vec3(0.56, floorY, -0.32), vec3(0.56, 0.35, -0.32), 0.04, 0.04, '#334155', '#0F172A');
    }

    if (equipType === 'pullup-bar') {
      pushCapsule(vec3(-0.72, floorY, 0), vec3(-0.72, 1.04, 0), 0.045, 0.045, '#334155', '#0F172A');
      pushCapsule(vec3(0.72, floorY, 0), vec3(0.72, 1.04, 0), 0.045, 0.045, '#334155', '#0F172A');
      pushCapsule(vec3(-0.76, 0.99, 0.02), vec3(0.76, 0.99, 0.02), 0.032, 0.032, '#94A3B8', '#0F172A');
    }

    if (equipType === 'dip-bars') {
      pushCapsule(vec3(-0.38, floorY, -0.25), vec3(-0.38, 0.15, -0.25), 0.04, 0.04, '#334155', '#0F172A');
      pushCapsule(vec3(0.38, floorY, -0.25), vec3(0.38, 0.15, -0.25), 0.04, 0.04, '#334155', '#0F172A');
      pushCapsule(vec3(-0.38, 0.15, -0.28), vec3(-0.38, 0.15, 0.25), 0.032, 0.032, '#94A3B8', '#0F172A');
      pushCapsule(vec3(0.38, 0.15, -0.28), vec3(0.38, 0.15, 0.25), 0.032, 0.032, '#94A3B8', '#0F172A');
    }

    // --- JAMBES : PANTALON ATHLÉTIQUE TAPERED / JOGGERS FIT 3D & SNEAKERS BLANCHES ---
    const eqIds = (hero?.relicsStatus || []).filter((r) => r.equipped).map((r) => r.id);
    const hasBootsRelic = eqIds.includes('relic-boots');
    const hasBeltRelic = eqIds.includes('relic-belt');
    const hasGauntletsRelic = eqIds.includes('relic-gauntlets');
    const hasPauldronsRelic = eqIds.includes('relic-pauldrons');
    const hasCrownRelic = eqIds.includes('relic-crown');
    const hasBladeRelic = eqIds.includes('relic-blade');

    const lScale = sk.legScale;
    const isBakiCombat = outfitId === 'outfit-baki-trunks' || morphId === 'ogre-hanma';
    const isBoxerIppo = outfitId === 'outfit-boxer-trunks' || morphId === 'iron-puncher';
    const isZWarrior = outfitId === 'outfit-z-warrior';
    const isBareChest = isBakiCombat || isBoxerIppo;

    let pantsHex = '#141A26';
    let pantsDark = '#0B0F17';
    if (isBakiCombat) {
      pantsHex = '#DC2626';
      pantsDark = '#991B1B';
    } else if (isBoxerIppo) {
      pantsHex = '#2563EB';
      pantsDark = '#1D4ED8';
    } else if (isZWarrior) {
      pantsHex = '#EA580C';
      pantsDark = '#C2410C';
    } else if (outfitId === 'stringer-cargo') {
      pantsHex = '#182030';
      pantsDark = '#0B0F19';
    } else if (outfitId === 'cyber-pulse') {
      pantsHex = '#0F172A';
      pantsDark = '#020617';
    }

    if (isBakiCombat) {
      // Short de combat court MMA (Baki style)
      const midThighL = lerp3(sk.hipL, sk.kneeL, 0.68);
      const midThighR = lerp3(sk.hipR, sk.kneeR, 0.68);
      pushCapsule(sk.hipL, midThighL, 0.092 * lScale, 0.080 * lScale, pantsHex, pantsDark, 'legs');
      pushCapsule(sk.hipR, midThighR, 0.092 * lScale, 0.080 * lScale, pantsHex, pantsDark, 'legs');
      // Cuisses inférieures et genoux nus ultra-définis
      pushCapsule(midThighL, sk.kneeL, 0.076 * lScale, 0.070 * lScale, skinBase, skinOutline, 'legs');
      pushCapsule(midThighR, sk.kneeR, 0.076 * lScale, 0.070 * lScale, skinBase, skinOutline, 'legs');
      // Mollets nus avec striations
      pushCapsule(sk.kneeL, sk.ankleL, 0.072 * lScale, 0.052 * lScale, skinBase, skinOutline, 'legs');
      pushCapsule(sk.kneeR, sk.ankleR, 0.072 * lScale, 0.052 * lScale, skinBase, skinOutline, 'legs');
      // Chevillères de Muay Thai rouges
      pushCapsule(lerp3(sk.kneeL, sk.ankleL, 0.85), sk.ankleL, 0.058 * lScale, 0.052 * lScale, '#DC2626', '#991B1B');
      pushCapsule(lerp3(sk.kneeR, sk.ankleR, 0.85), sk.ankleR, 0.058 * lScale, 0.052 * lScale, '#DC2626', '#991B1B');
    } else {
      // Cuisses athlétiques fuselées (Slim-fit athletic joggers ou Dogi)
      pushCapsule(sk.hipL, sk.kneeL, 0.088 * lScale, 0.076 * lScale, pantsHex, pantsDark, 'legs');
      pushCapsule(sk.hipR, sk.kneeR, 0.088 * lScale, 0.076 * lScale, pantsHex, pantsDark, 'legs');

      // Poches Cargo 3D si tenue Techwear Cargo
      if (outfitId === 'stringer-cargo') {
        pushSphere(lerp3(sk.hipL, sk.kneeL, 0.48), 0.048 * lScale, '#0B0F19', '#334155');
        pushSphere(lerp3(sk.hipR, sk.kneeR, 0.48), 0.048 * lScale, '#0B0F19', '#334155');
      }

      // Mollets fuselés avec revers chevilles (Tapered jogger calves & cuffs)
      const cuffL = lerp3(sk.kneeL, sk.ankleL, 0.88);
      const cuffR = lerp3(sk.kneeR, sk.ankleR, 0.88);
      pushCapsule(sk.kneeL, cuffL, 0.076 * lScale, 0.058 * lScale, pantsDark, '#0B0F17', 'legs');
      pushCapsule(sk.kneeR, cuffR, 0.076 * lScale, 0.058 * lScale, pantsDark, '#0B0F17', 'legs');
      pushCapsule(cuffL, sk.ankleL, 0.056 * lScale, 0.052 * lScale, '#090D15', '#1E293B', 'legs');
      pushCapsule(cuffR, sk.ankleR, 0.056 * lScale, 0.052 * lScale, '#090D15', '#1E293B', 'legs');
    }

    // Genouillères de Force 7mm en Néoprène
    if (powerEquipments.includes('knee-sleeves')) {
      pushCapsule(lerp3(sk.hipL, sk.kneeL, 0.82), lerp3(sk.kneeL, sk.ankleL, 0.20), 0.098 * lScale, 0.092 * lScale, '#0B0F19', aura.primary);
      pushCapsule(lerp3(sk.hipR, sk.kneeR, 0.82), lerp3(sk.kneeR, sk.ankleR, 0.20), 0.098 * lScale, 0.092 * lScale, '#0B0F19', aura.primary);
    }

    // --- SNEAKERS DE TRAINING BLANCHES MODÈLE AAA ---
    const shoeWhite = hasBootsRelic ? aura.secondary : '#FFFFFF';
    const shoeMid = '#F1F5F9';
    const shoeSole = '#E2E8F0';

    // Semelle intermédiaire & Semelle extérieure blanches
    pushCapsule(sk.ankleL, sk.toeL, 0.056, 0.048, shoeWhite, shoeSole);
    pushCapsule(sk.ankleR, sk.toeR, 0.056, 0.048, shoeWhite, shoeSole);
    // Empeigne & languette de sneaker blanche
    pushCapsule(add3(sk.ankleL, vec3(0, 0.022, 0.02)), add3(sk.toeL, vec3(0, 0.014, 0.02)), 0.050, 0.044, shoeMid, '#CBD5E1');
    pushCapsule(add3(sk.ankleR, vec3(0, 0.022, 0.02)), add3(sk.toeR, vec3(0, 0.014, 0.02)), 0.050, 0.044, shoeMid, '#CBD5E1');
    // Bout avant (Toe cap) blanc
    pushSphere(sk.toeL, 0.044, shoeWhite, shoeSole);
    pushSphere(sk.toeR, 0.044, shoeWhite, shoeSole);

    // Bassin & Ceinture athlétique intégrée
    pushCapsule(sk.hipL, sk.hipR, 0.088, 0.088, pantsDark, '#0B0F17');
    pushCapsule(
      add3(sk.waist, vec3(-0.13, -0.04, 0)),
      add3(sk.waist, vec3(0.13, -0.04, 0)),
      0.066,
      0.066,
      pantsHex,
      hasBeltRelic ? '#F59E0B' : '#0B0F17'
    );

    // Ceinture de Force Powerlifting à Levier Acier (Équipement Pro)
    if (powerEquipments.includes('lever-belt')) {
      pushCapsule(
        add3(sk.waist, vec3(-0.14, -0.03, 0)),
        add3(sk.waist, vec3(0.14, -0.03, 0)),
        0.076,
        0.076,
        '#0B0F19',
        '#334155'
      );
      pushSphere(add3(sk.waist, vec3(0, -0.03, 0.12)), 0.028, '#E2E8F0', '#0B0F19');
    }

    if (hasBladeRelic && moveId === 'idle-combat') {
      pushCapsule(
        add3(sk.chest, vec3(0.24, 0.42, -0.16)),
        add3(sk.waist, vec3(-0.22, -0.28, -0.16)),
        0.028,
        0.016,
        aura.primary,
        '#FEF08A'
      );
    }

    // --- MANTEAU DU MONARQUE DES OMBRES (SOLO LEVELING) & QUEUE-DE-PIE REBELLE (PERSONA 5) ---
    const isMonarchTrench = outfitId === 'outfit-monarch-trench' || outfitId === 'shadow-monarch';
    const isPhantomThief = outfitId === 'outfit-phantom-thief' || outfitId === 'persona-rebel';
    if (isMonarchTrench || isPhantomThief) {
      const coatBase = isPhantomThief ? '#0B0F19' : '#070A10';
      const coatLining = isPhantomThief ? '#DC2626' : '#7C3AED';
      const swayL = Math.sin(tSec * 3.2) * 0.022;
      const swayR = Math.sin(tSec * 3.2 + 0.5) * 0.022;

      // Pan gauche du manteau descendant jusqu'à mi-mollet
      pushCapsule(
        add3(sk.waist, vec3(-0.11 * sk.upperScale, -0.04, -0.05)),
        add3(lerp3(sk.kneeL, sk.ankleL, 0.45), vec3(-0.06 * lScale + swayL, 0, -0.08)),
        0.085 * sk.upperScale,
        0.065 * lScale,
        coatBase,
        coatLining
      );
      // Pan droit du manteau descendant jusqu'à mi-mollet
      pushCapsule(
        add3(sk.waist, vec3(0.11 * sk.upperScale, -0.04, -0.05)),
        add3(lerp3(sk.kneeR, sk.ankleR, 0.45), vec3(0.06 * lScale + swayR, 0, -0.08)),
        0.085 * sk.upperScale,
        0.065 * lScale,
        coatBase,
        coatLining
      );
      // Pan arrière central avec découpe stylisée
      pushCapsule(
        add3(sk.waist, vec3(0, -0.05, -0.07)),
        add3(lerp3(sk.kneeL, sk.kneeR, 0.5), vec3(0, -0.08, -0.11)),
        0.075 * sk.upperScale,
        0.055 * lScale,
        coatBase,
        coatLining
      );

      // Col relevé haute tension Manga RPG (High popped collar)
      pushCapsule(
        add3(sk.neck, vec3(-0.07 * sk.upperScale, -0.01, -0.02)),
        add3(sk.neck, vec3(-0.09 * sk.upperScale, 0.095, -0.04)),
        0.028 * sk.upperScale,
        0.016 * sk.upperScale,
        coatBase,
        coatLining
      );
      pushCapsule(
        add3(sk.neck, vec3(0.07 * sk.upperScale, -0.01, -0.02)),
        add3(sk.neck, vec3(0.09 * sk.upperScale, 0.095, -0.04)),
        0.028 * sk.upperScale,
        0.016 * sk.upperScale,
        coatBase,
        coatLining
      );
    }

    // --- TORSE : T-SHIRT DE PERFORMANCE NOIR FIT OU TORSE NU MARTIAL STRIÉ (BAKI / IPPO / Pro) ---
    const uScale = isFemale ? sk.upperScale * 0.92 : sk.upperScale;
    let teeHex = outfitId === 'stringer-cargo' ? '#182030' : (outfitId === 'cyber-pulse' ? '#0F172A' : '#141924');
    let teeDark = outfitId === 'stringer-cargo' ? '#0B0F19' : (outfitId === 'cyber-pulse' ? '#020617' : '#0B0E15');
    if (isBareChest) {
      teeHex = skinBase;
      teeDark = skinMuscle;
    } else if (isZWarrior) {
      teeHex = '#1E3A8A';
      teeDark = '#0F172A';
    }

    // Buste gainé dans le t-shirt de compression ou torse nu
    const waistRadius = isFemale ? 0.105 * uScale : 0.118 * uScale;
    pushCapsule(sk.waist, sk.chest, waistRadius, 0.165 * uScale, teeHex, teeDark, 'core');

    // Dorsaux sculptés (V-Taper athlétique ou Cobra Baki)
    const latL = lerp3(sk.waist, sk.shoulderL, 0.68);
    const latR = lerp3(sk.waist, sk.shoulderR, 0.68);
    const backWidth = isBakiCombat ? sk.backScale * 1.35 : sk.backScale;
    pushCapsule(sk.waist, latL, 0.082 * uScale, 0.112 * backWidth, teeHex, teeDark, 'back');
    pushCapsule(sk.waist, latR, 0.082 * uScale, 0.112 * backWidth, teeHex, teeDark, 'back');

    // DOS DU DÉMON (STYLE BAKI HANMA) - SILLONS DORSRAUX & TRAPÈZES COBRA
    const hasDemonBack = isBakiCombat || powerEquipments.includes('equip-demon-back');
    if (hasDemonBack) {
      // Trapèzes cobra colossaux sur le dos
      pushSphere(lerp3(sk.shoulderL, sk.neck, 0.45), 0.112 * uScale, '#7F1D1D', '#EF4444', 'back');
      pushSphere(lerp3(sk.shoulderR, sk.neck, 0.45), 0.112 * uScale, '#7F1D1D', '#EF4444', 'back');
      // Sillons dorsaux démoniaques irradiants
      for (let d = 0; d < 3; d++) {
        const dY = 0.05 - d * 0.055;
        pushCapsule(
          add3(sk.chest, vec3(-0.075 * uScale, dY, -0.09)),
          add3(sk.waist, vec3(-0.025 * uScale, dY - 0.045, -0.08)),
          0.016 * uScale,
          0.010 * uScale,
          '#7F1D1D',
          '#EF4444'
        );
        pushCapsule(
          add3(sk.chest, vec3(0.075 * uScale, dY, -0.09)),
          add3(sk.waist, vec3(0.025 * uScale, dY - 0.045, -0.08)),
          0.016 * uScale,
          0.010 * uScale,
          '#7F1D1D',
          '#EF4444'
        );
      }
    } else if (morphId === 'colossal-titan' || isBoxerIppo) {
      // Trapèzes massifs de boxeur (Dempsey Roll) ou Titan
      pushSphere(lerp3(sk.shoulderL, sk.neck, 0.45), 0.098 * uScale, teeDark, '#0B0F19', 'back');
      pushSphere(lerp3(sk.shoulderR, sk.neck, 0.45), 0.098 * uScale, teeDark, '#0B0F19', 'back');
    }

    const torsoUp = norm3(sub3(sk.neck, sk.waist));
    const torsoRight = vec3(1, 0, 0);
    const torsoFwd = norm3(cross3(torsoRight, torsoUp));

    const pecCenter = add3(sk.chest, scale3(torsoFwd, 0.075 * uScale));
    const pecLPos = add3(pecCenter, vec3(-0.075 * uScale, 0.015, 0));
    const pecRPos = add3(pecCenter, vec3(0.075 * uScale, 0.015, 0));

    // Galbe pectoral (Torse nu strié ou sous t-shirt)
    pushSphere(pecLPos, 0.088 * uScale, teeHex, teeDark, 'chest', { x: 1.05, y: 0.90, z: 0.76 });
    pushSphere(pecRPos, 0.088 * uScale, teeHex, teeDark, 'chest', { x: 1.05, y: 0.90, z: 0.76 });

    // ABDOMINAUX 8-PACK & DENTELÉS EN DENTS DE REQUIN (BAKI / IPPO)
    if (isBareChest) {
      for (let ab = 0; ab < 4; ab++) {
        const abY = -0.045 + ab * 0.052;
        const abL = add3(sk.waist, vec3(-0.036 * uScale, abY, 0.092 * uScale));
        const abR = add3(sk.waist, vec3(0.036 * uScale, abY, 0.092 * uScale));
        pushSphere(abL, 0.024 * uScale, skinMuscle, skinOutline);
        pushSphere(abR, 0.024 * uScale, skinMuscle, skinOutline);
      }
      // Dentelés en dents de requin (Serratus anterior)
      for (let s = 0; s < 3; s++) {
        const sY = 0.01 + s * 0.042;
        pushCapsule(
          add3(sk.waist, vec3(-0.092 * uScale, sY, 0.05)),
          add3(sk.waist, vec3(-0.052 * uScale, sY - 0.012, 0.08)),
          0.014 * uScale,
          0.009 * uScale,
          skinMuscle,
          skinOutline
        );
        pushCapsule(
          add3(sk.waist, vec3(0.092 * uScale, sY, 0.05)),
          add3(sk.waist, vec3(0.052 * uScale, sY - 0.012, 0.08)),
          0.014 * uScale,
          0.009 * uScale,
          skinMuscle,
          skinOutline
        );
      }
    } else if (isZWarrior) {
      // Veste de Tenue Athlétique Pro croisée sur le torse
      pushCapsule(
        add3(sk.shoulderL, vec3(0.015, 0.015, 0.02)),
        add3(sk.waist, vec3(0.035, 0, 0.07)),
        0.042 * uScale,
        0.028 * uScale,
        '#EA580C',
        '#C2410C'
      );
      pushCapsule(
        add3(sk.shoulderR, vec3(-0.015, 0.015, 0.02)),
        add3(sk.waist, vec3(-0.035, 0, 0.07)),
        0.042 * uScale,
        0.028 * uScale,
        '#EA580C',
        '#C2410C'
      );
    } else {
      // Logo / Blason minimaliste blanc sur le torse gauche
      const crestPos = add3(pecLPos, vec3(-0.018 * uScale, 0.012, 0.068 * uScale));
      pushSphere(crestPos, 0.014 * uScale, '#FFFFFF', '#CBD5E1');
      pushCapsule(
        add3(crestPos, vec3(-0.012 * uScale, 0, 0)),
        add3(crestPos, vec3(0.012 * uScale, 0, 0)),
        0.007 * uScale,
        0.007 * uScale,
        '#FFFFFF',
        '#E2E8F0'
      );

      // Col rond ras-du-cou du t-shirt
      pushCapsule(
        add3(sk.neck, vec3(-0.052, -0.015, 0)),
        add3(sk.neck, vec3(0.052, -0.015, 0)),
        0.056 * uScale,
        0.056 * uScale,
        '#090D15',
        '#1E293B'
      );
    }

    // Cou athlétique en ton chair
    pushCapsule(sk.chest, sk.neck, 0.075 * uScale, 0.062 * uScale, skinBase, skinOutline);
    pushCapsule(sk.neck, sk.head, 0.062 * uScale, 0.056 * uScale, skinBase, skinOutline);

    // --- BRAS : MANCHES COURTES DE T-SHIRT & AVANT-BRAS ATHLÉTIQUES ---
    // Épaules (Deltoïdes) gainées ou nues si torse nu
    const shoulderColor = isBareChest ? skinBase : (isZWarrior ? '#1E3A8A' : teeHex);
    const shoulderDark = isBareChest ? skinMuscle : (isZWarrior ? '#0F172A' : (hasPauldronsRelic ? aura.secondary : teeDark));
    pushSphere(sk.shoulderL, 0.086 * uScale, shoulderColor, shoulderDark, 'shoulders');
    pushSphere(sk.shoulderR, 0.086 * uScale, shoulderColor, shoulderDark, 'shoulders');

    // Manches courtes du t-shirt (ou bras nus)
    const midArmL = lerp3(sk.shoulderL, sk.elbowL, 0.46);
    const midArmR = lerp3(sk.shoulderR, sk.elbowR, 0.46);
    const armTopColor = isBareChest ? skinBase : (isZWarrior ? '#1E3A8A' : teeHex);
    const armTopDark = isBareChest ? skinMuscle : (isZWarrior ? '#0F172A' : teeDark);
    pushCapsule(sk.shoulderL, midArmL, 0.082 * uScale, 0.075 * uScale, armTopColor, armTopDark, 'arms');
    pushCapsule(sk.shoulderR, midArmR, 0.082 * uScale, 0.075 * uScale, armTopColor, armTopDark, 'arms');

    // Bas de biceps & coudes nus en ton chair
    const bicepPump = sk.activeTargetZone === 'arms' ? 1 + (1 - sk.repT) * 0.24 : 1.0;
    pushCapsule(midArmL, sk.elbowL, 0.072 * uScale * bicepPump, 0.064 * uScale, skinBase, skinOutline, 'arms');
    pushCapsule(midArmR, sk.elbowR, 0.072 * uScale * bicepPump, 0.064 * uScale, skinBase, skinOutline, 'arms');

    // Avant-bras athlétiques musculaires
    pushCapsule(sk.elbowL, sk.wristL, 0.064 * uScale, 0.050 * uScale, skinBase, skinOutline, 'arms');
    pushCapsule(sk.elbowR, sk.wristR, 0.064 * uScale, 0.050 * uScale, skinBase, skinOutline, 'arms');

    // BANDAGES DE BOXE ANGLAISE (STYLE IPPO DEMPSEY ROLL)
    const hasBoxerWraps = isBoxerIppo || powerEquipments.includes('equip-boxer-wraps');
    if (hasBoxerWraps) {
      pushCapsule(lerp3(sk.elbowL, sk.wristL, 0.76), sk.wristL, 0.058 * uScale, 0.056 * uScale, '#FFFFFF', '#CBD5E1');
      pushCapsule(lerp3(sk.elbowR, sk.wristR, 0.76), sk.wristR, 0.058 * uScale, 0.056 * uScale, '#FFFFFF', '#CBD5E1');
    } else if (isZWarrior) {
      // Poignets lestés bleu nuit Sayan
      pushCapsule(lerp3(sk.elbowL, sk.wristL, 0.78), sk.wristL, 0.058 * uScale, 0.056 * uScale, '#1E3A8A', '#0F172A');
      pushCapsule(lerp3(sk.elbowR, sk.wristR, 0.78), sk.wristR, 0.058 * uScale, 0.056 * uScale, '#1E3A8A', '#0F172A');
    }

    // Mains athlétiques avec paume et doigts stylisés (ou Gants Rouges Style Urbain)
    const isRedGloves = isPhantomThief || powerEquipments.includes('phantom-gloves');
    const handBase = isRedGloves ? '#DC2626' : skinBase;
    const handStroke = isRedGloves ? '#7F1D1D' : skinOutline;
    pushSphere(sk.wristL, 0.046 * uScale, handBase, handStroke);
    pushSphere(sk.wristR, 0.046 * uScale, handBase, handStroke);
    pushCapsule(sk.wristL, add3(sk.wristL, vec3(0, -0.055, 0.015)), 0.032 * uScale, 0.020 * uScale, handBase, handStroke);
    pushCapsule(sk.wristR, add3(sk.wristR, vec3(0, -0.055, 0.015)), 0.032 * uScale, 0.020 * uScale, handBase, handStroke);

    // DAGUES JUMELLES DU MONARQUE DES OMBRES (SOLO LEVELING)
    const hasShadowDaggers = isMonarchTrench || powerEquipments.includes('shadow-daggers');
    if (hasShadowDaggers && equipType === 'none') {
      // Dague gauche (Prise inversée d'assassin de rang S)
      const dL_hilt = sk.wristL;
      const dL_tip = add3(sk.wristL, vec3(-0.05, -0.24, 0.12));
      pushCapsule(dL_hilt, dL_tip, 0.020, 0.006, '#070A10', '#06B6D4');
      pushSphere(dL_tip, 0.012, '#06B6D4', '#7C3AED', null, null, true);

      // Dague droite (Prise inversée d'assassin de rang S)
      const dR_hilt = sk.wristR;
      const dR_tip = add3(sk.wristR, vec3(0.05, -0.24, 0.12));
      pushCapsule(dR_hilt, dR_tip, 0.020, 0.006, '#070A10', '#06B6D4');
      pushSphere(dR_tip, 0.012, '#06B6D4', '#7C3AED', null, null, true);
    }

    // Smartwatch / Tracker de fitness au poignet gauche (Style connecté pro)
    const watchPos = lerp3(sk.elbowL, sk.wristL, 0.88);
    pushCapsule(watchPos, sk.wristL, 0.054 * uScale, 0.054 * uScale, '#0B0F19', '#1E293B');
    pushSphere(add3(sk.wristL, vec3(-0.046 * uScale, 0.012, 0.015)), 0.016, aura.secondary, '#FFFFFF');

    // Protège-Poignets de Force (Bandes de serrage cinétiques)
    if (powerEquipments.includes('wrist-wraps')) {
      pushCapsule(lerp3(sk.elbowL, sk.wristL, 0.82), sk.wristL, 0.068 * uScale, 0.064 * uScale, '#0B0F19', '#E11D48');
      pushCapsule(lerp3(sk.elbowR, sk.wristR, 0.82), sk.wristR, 0.068 * uScale, 0.064 * uScale, '#0B0F19', '#E11D48');
    }

    // Sangles de tirage cinétiques
    if (powerEquipments.includes('lifting-straps')) {
      pushCapsule(sk.wristL, add3(sk.wristL, vec3(-0.02, -0.16, 0.04)), 0.024, 0.016, '#F59E0B', '#0B0F19');
      pushCapsule(sk.wristR, add3(sk.wristR, vec3(0.02, -0.16, 0.04)), 0.024, 0.016, '#F59E0B', '#0B0F19');
    }

    // --- TÊTE & VISAGE HUMAIN PROPORTIONNÉ AAA ---
    const headScale = jawId === 'chiseled-square' ? { x: 1.02, y: 1.04, z: 1.01 } : (jawId === 'streamlined-oval' ? { x: 0.94, y: 1.06, z: 0.96 } : { x: 0.98, y: 1.04, z: 0.98 });
    // Crâne réaliste proportionné (rayon 0.090)
    pushSphere(sk.head, 0.090, skinBase, skinOutline, null, headScale);

    // Mâchoire et menton athlétique
    pushSphere(add3(sk.head, vec3(0, -0.055, 0.038)), 0.030, skinMuscle, skinOutline);
    // Oreilles réalistes sculptées
    pushSphere(add3(sk.head, vec3(-0.082, 0.004, -0.008)), 0.020, skinMuscle, skinOutline);
    pushSphere(add3(sk.head, vec3(0.082, 0.004, -0.008)), 0.020, skinMuscle, skinOutline);

    // Arête et bout du nez
    pushCapsule(
      add3(sk.head, vec3(0, 0.016, 0.076)),
      add3(sk.head, vec3(0, -0.012, 0.086)),
      0.012,
      0.016,
      skinMuscle,
      skinOutline
    );

    // Lèvres sculptées
    pushCapsule(
      add3(sk.head, vec3(-0.018, -0.034, 0.074)),
      add3(sk.head, vec3(0.018, -0.034, 0.074)),
      0.008,
      0.008,
      skinOutline,
      '#0B0F19'
    );

    // Yeux réalistes (Blanc de l'œil sclère + Iris sombre + Spéculaire)
    const eyeL = add3(sk.head, vec3(-0.030, 0.012, 0.074));
    const eyeR = add3(sk.head, vec3(0.030, 0.012, 0.074));
    pushSphere(eyeL, 0.014, '#FFFFFF', '#94A3B8');
    pushSphere(eyeR, 0.014, '#FFFFFF', '#94A3B8');
    pushSphere(add3(eyeL, vec3(0, 0, 0.008)), 0.009, eyeHex, '#0B0F19');
    pushSphere(add3(eyeR, vec3(0, 0, 0.008)), 0.009, eyeHex, '#0B0F19');
    pushSphere(add3(eyeL, vec3(0.002, 0.002, 0.013)), 0.003, '#FFFFFF', '#FFFFFF');
    pushSphere(add3(eyeR, vec3(0.002, 0.002, 0.013)), 0.003, '#FFFFFF', '#FFFFFF');

    // Sourcils naturels sculptés
    pushCapsule(add3(sk.head, vec3(-0.042, 0.026, 0.070)), add3(sk.head, vec3(-0.016, 0.029, 0.074)), 0.006, 0.005, '#0B0F19', '#0B0F19');
    pushCapsule(add3(sk.head, vec3(0.016, 0.029, 0.074)), add3(sk.head, vec3(0.042, 0.026, 0.070)), 0.005, 0.006, '#0B0F19', '#0B0F19');

    // Marquage facial 3D (Cicatrice de guerre, Runes de Mana, Masque Style Urbain ou Yeux Édition Nocturne)
    const warMarkingId = hero?.warMarkingObj?.id || app.warMarking;
    if (warMarkingId === 'phantom-mask' || isPhantomThief) {
      // Masque Style Urbain Voleur Fantôme blanc aux pointes acérées
      const maskCenter = add3(sk.head, vec3(0, 0.012, 0.080));
      pushCapsule(
        add3(maskCenter, vec3(-0.052, 0.008, 0)),
        add3(maskCenter, vec3(0.052, 0.008, 0)),
        0.016,
        0.016,
        '#FFFFFF',
        '#0B0F19'
      );
      // Ailes de masque pointues vers les tempes
      pushCapsule(add3(maskCenter, vec3(-0.045, 0.008, 0)), add3(maskCenter, vec3(-0.076, 0.028, -0.018)), 0.012, 0.004, '#FFFFFF', '#0B0F19');
      pushCapsule(add3(maskCenter, vec3(0.045, 0.008, 0)), add3(maskCenter, vec3(0.076, 0.028, -0.018)), 0.012, 0.004, '#FFFFFF', '#0B0F19');
    } else if (warMarkingId === 'eye-scar') {
      pushCapsule(
        add3(sk.head, vec3(0.030, 0.032, 0.076)),
        add3(sk.head, vec3(0.032, -0.012, 0.076)),
        0.005,
        0.004,
        skinOutline,
        '#FEF08A'
      );
    } else if (warMarkingId === 'mana-runes') {
      pushSphere(add3(sk.head, vec3(-0.030, -0.010, 0.076)), 0.006, eyeGlowHex, eyeHex);
      pushSphere(add3(sk.head, vec3(0.030, -0.010, 0.076)), 0.006, eyeGlowHex, eyeHex);
    }

    // Volutes de fumée de Mana émanant des yeux 3D (Style Édition Nocturne Athlète Apex)
    const isMonarchEyes = warMarkingId === 'shadow-monarch-eyes' || isMonarchTrench;
    if (isMonarchEyes || (hero?.manaEyeSmoke !== false && app.manaEyeSmoke !== false && isBurst)) {
      const smokeCount = isMonarchEyes ? 3 : 2;
      for (let s = 1; s <= smokeCount; s++) {
        const drift = Math.sin(tSec * 4.8 + s * 1.5) * 0.012;
        const smokeL = add3(eyeL, vec3(-0.012 - s * 0.011 + drift, s * 0.018, -s * 0.008));
        const smokeR = add3(eyeR, vec3(0.012 + s * 0.011 - drift, s * 0.018, -s * 0.008));
        pushSphere(smokeL, 0.008 + s * 0.004, '#06B6D4', '#7C3AED', null, null, true);
        pushSphere(smokeR, 0.008 + s * 0.004, '#06B6D4', '#7C3AED', null, null, true);
      }
    }

    if (hasCrownRelic) {
      pushCapsule(
        add3(sk.head, vec3(-0.065, 0.095, 0.06)),
        add3(sk.head, vec3(0.065, 0.095, 0.06)),
        0.020,
        0.020,
        '#F59E0B',
        '#FEF08A'
      );
    }

    // --- COIFFURE ATHLÉTIQUE TAPER FADE & BUZZCUT PROPORTIONNÉE ---
    const hairTint = isBurst ? '#FACC15' : (hair.hex || '#0B0F19');
    const hairStroke = hair.stroke || '#020617';

    // Calotte crânienne ajustée au millimètre (Buzzcut clean fade)
    pushSphere(add3(sk.head, vec3(0, 0.012, -0.006)), 0.092, hairTint, hairStroke);
    // Dégradé tempes et favoris
    pushCapsule(add3(sk.head, vec3(-0.065, 0.040, 0.035)), add3(sk.head, vec3(-0.075, 0.008, 0.008)), 0.015, 0.010, hairTint, hairStroke);
    pushCapsule(add3(sk.head, vec3(0.065, 0.040, 0.035)), add3(sk.head, vec3(0.075, 0.008, 0.008)), 0.015, 0.010, hairTint, hairStroke);
    // Ligne frontale nette (Hairline)
    pushCapsule(add3(sk.head, vec3(-0.052, 0.048, 0.052)), add3(sk.head, vec3(0.052, 0.048, 0.052)), 0.014, 0.014, hairTint, hairStroke);

    // Mèches volumétriques si coiffures stylisées (Édition Nocturne & Style Urbain)
    if (hairstyleId === 'solo-undercut' || hairstyleId === 'cyber-undercut') {
      pushSphere(add3(sk.head, vec3(0, 0.055, -0.01)), 0.088, hairTint, hairStroke);
      // Mèche acérée tombant sur le front façon Athlète Apex
      pushCapsule(add3(sk.head, vec3(0.01, 0.055, 0.03)), add3(sk.head, vec3(-0.035, 0.022, 0.088)), 0.024, 0.006, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(-0.02, 0.058, 0.02)), add3(sk.head, vec3(-0.065, 0.038, 0.072)), 0.022, 0.006, hairTint, hairStroke);
    } else if (hairstyleId === 'persona-joker') {
      pushSphere(add3(sk.head, vec3(0, 0.058, -0.015)), 0.094, hairTint, hairStroke);
      // Mèches rebelles texturées ébouriffées façon Joker
      pushCapsule(add3(sk.head, vec3(-0.04, 0.06, 0.02)), add3(sk.head, vec3(-0.072, 0.085, 0.055)), 0.024, 0.006, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(0.04, 0.06, 0.02)), add3(sk.head, vec3(0.072, 0.085, 0.055)), 0.024, 0.006, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(0, 0.072, 0.025)), add3(sk.head, vec3(-0.015, 0.105, 0.045)), 0.022, 0.005, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(0, 0.05, -0.06)), add3(sk.head, vec3(0, 0.072, -0.11)), 0.026, 0.008, hairTint, hairStroke);
    } else if (hairstyleId === 'stellar-flow' || hairstyleId === 'long-warrior') {
      pushSphere(add3(sk.head, vec3(0, 0.055, -0.02)), 0.092, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(-0.05, 0.02, -0.06)), add3(sk.head, vec3(-0.08, -0.15, -0.12)), 0.032, 0.018, hairTint, hairStroke);
      pushCapsule(add3(sk.head, vec3(0.05, 0.02, -0.06)), add3(sk.head, vec3(0.08, -0.15, -0.12)), 0.032, 0.018, hairTint, hairStroke);
    }

    // --- BARRE OLYMPIQUE 3D & DISQUES DE FONTE / HALTÈRES 3D DANS LES MAINS ---
    if (equipType === 'barbell') {
      const handDir = norm3(sub3(sk.wristR, sk.wristL));
      const barCenter = lerp3(sk.wristL, sk.wristR, 0.5);
      const barEndL = add3(barCenter, scale3(handDir, -0.84));
      const barEndR = add3(barCenter, scale3(handDir, 0.84));
      pushCapsule(barEndL, barEndR, 0.024, 0.024, '#CBD5E1', '#0F172A');

      const plateOffsets = [0.62, 0.69, 0.75];
      const plateRadii = [0.21, 0.18, 0.14];
      const plateColors = [aura.primary, '#1E293B', '#F59E0B'];
      plateOffsets.forEach((off, idx) => {
        const pL1 = add3(barCenter, scale3(handDir, -off));
        const pL2 = add3(barCenter, scale3(handDir, -(off + 0.04)));
        const pR1 = add3(barCenter, scale3(handDir, off));
        const pR2 = add3(barCenter, scale3(handDir, off + 0.04));
        pushCapsule(pL1, pL2, plateRadii[idx], plateRadii[idx], plateColors[idx], '#0F172A');
        pushCapsule(pR1, pR2, plateRadii[idx], plateRadii[idx], plateColors[idx], '#0F172A');
      });
    } else if (equipType === 'dumbbell') {
      [sk.wristL, sk.wristR].forEach((wPos) => {
        const dL = add3(wPos, vec3(-0.11, 0, 0));
        const dR = add3(wPos, vec3(0.11, 0, 0));
        pushCapsule(dL, dR, 0.022, 0.022, '#CBD5E1', '#0F172A');
        pushSphere(dL, 0.072, '#1E293B', aura.primary);
        pushSphere(dR, 0.072, '#1E293B', aura.primary);
      });
    }

    // Pierres en lévitation 3D
    for (let i = 0; i < 6; i++) {
      const orbitA = tSec * 1.4 + (i * Math.PI) / 3;
      const orbitR = 0.62 + (i % 2) * 0.16;
      const rockY = -0.75 + ((tSec * 0.55 + i * 0.27) % 1.45);
      const rockPos = vec3(Math.cos(orbitA) * orbitR, rockY, Math.sin(orbitA) * orbitR);
      pushSphere(rockPos, 0.026, i % 2 === 0 ? aura.secondary : aura.primary, '#0F172A');
    }

    // ========================================================================
    // RENDU THREE.JS WEBGL (SI DISPONIBLE) OU FALLBACK CEL-SHADING LOGICIEL
    // ========================================================================
    if (gl) {
      const customGlbUrl = app.customModelGlb || hero?.appearance?.customModelGlb || null;
      if (customGlbUrl && gl.currentGlbUrl !== customGlbUrl) {
        gl.currentGlbUrl = customGlbUrl;
        gl.loadGltfModel(
          customGlbUrl,
          (gltf) => {
            gltf.scene.position.set(0, -0.98, 0);
            gltf.scene.scale.set(0.95, 0.95, 0.95);
          },
          (err) => {
            console.warn('[IronPulse GLTF] Erreur de chargement :', err);
          }
        );
      } else if (!customGlbUrl && gl.currentGlbUrl) {
        if (gl.loadedGltf && gl.loadedGltf.scene) {
          gl.worldRoot.remove(gl.loadedGltf.scene);
          gl.loadedGltf = null;
        }
        gl.currentGlbUrl = null;
      }

      const isExternalGlbActive = Boolean(customGlbUrl && gl.loadedGltf && gl.loadedGltf.scene);

      for (let i = isExternalGlbActive ? 0 : glCapIdx; i < gl.capsulesPool.length; i++) gl.capsulesPool[i].group.visible = false;
      for (let i = isExternalGlbActive ? 0 : glSphIdx; i < gl.spheresPool.length; i++) gl.spheresPool[i].group.visible = false;
      for (let i = isExternalGlbActive ? 0 : glConeIdx; i < gl.conesPool.length; i++) gl.conesPool[i].group.visible = false;

      if (gl.renderer.domElement.width !== Math.round(cssW * dpr) || gl.renderer.domElement.height !== Math.round(cssH * dpr)) {
        gl.renderer.setSize(cssW, cssH, false);
      }
      gl.camera.aspect = cssW / Math.max(1, cssH);
      gl.camera.position.set(0, -0.06, 3.15 / Math.max(0.5, zoom));
      gl.camera.lookAt(0, -0.10, 0);
      gl.camera.updateProjectionMatrix();

      gl.worldRoot.rotation.set(pitch, yaw, 0, 'XYZ');
      gl.auraPointLight.color.set(isBurst ? '#FEF08A' : aura.primary);
      gl.auraPointLight.intensity = isBurst ? 2.4 : (sk.tempo.phaseCode === 'CONC' ? 1.85 : 1.25);
      gl.rimLight.color.set(aura.secondary);

      // --- OMBRES DE CONTACT SOL DYNAMIQUES (Soft Blob) ---
      if (gl.footShadowL && gl.footShadowR && gl.pelvisShadow) {
        const floorY = -0.99;
        const shadowY = floorY + 0.005; // -0.985
        const posFootL = {
          x: (sk.ankleL.x + sk.toeL.x) * 0.5,
          y: (sk.ankleL.y + sk.toeL.y) * 0.5,
          z: (sk.ankleL.z + sk.toeL.z) * 0.5
        };
        const posFootR = {
          x: (sk.ankleR.x + sk.toeR.x) * 0.5,
          y: (sk.ankleR.y + sk.toeR.y) * 0.5,
          z: (sk.ankleR.z + sk.toeR.z) * 0.5
        };

        const altL = Math.max(0, posFootL.y - floorY);
        const altR = Math.max(0, posFootR.y - floorY);
        const altPelvis = Math.max(0, sk.pelvis.y - floorY);

        const scaleL = (0.24 + altL * 0.18) * sk.legScale;
        gl.footShadowL.mesh.position.set(posFootL.x, shadowY, posFootL.z);
        gl.footShadowL.mesh.scale.set(scaleL * 0.85, 1, scaleL * 1.35);
        gl.footShadowL.mat.opacity = Math.max(0.05, 0.78 - altL * 1.1);

        const scaleR = (0.24 + altR * 0.18) * sk.legScale;
        gl.footShadowR.mesh.position.set(posFootR.x, shadowY, posFootR.z);
        gl.footShadowR.mesh.scale.set(scaleR * 0.85, 1, scaleR * 1.35);
        gl.footShadowR.mat.opacity = Math.max(0.05, 0.78 - altR * 1.1);

        const pelvisDrop = moveId === 'squat' ? sk.repT * 0.15 : 0;
        const scalePelvis = (0.55 + pelvisDrop + altPelvis * 0.15) * sk.upperScale;
        gl.pelvisShadow.mesh.position.set(sk.pelvis.x * 0.5, shadowY - 0.002, sk.pelvis.z * 0.5);
        gl.pelvisShadow.mesh.scale.set(scalePelvis * 1.1, 1, scalePelvis * 0.95);
        gl.pelvisShadow.mat.opacity = Math.max(0.08, (0.52 + pelvisDrop * 0.8) - altPelvis * 0.45);
      }

      gl.renderer.render(gl.scene, gl.camera);
      ctx.drawImage(gl.renderer.domElement, 0, 0, cssW, cssH);
    } else {
      // Fallback hors-ligne : Painter's Z-Sort Cel-Shading
      primitives.sort((a, b) => a.z - b.z);
      primitives.forEach((prim) => {
        if (prim.type === 'sphere') {
          const { sx, sy } = prim.c;
          const r = Math.max(2, prim.r);
          const grad = ctx.createRadialGradient(sx - r * 0.32, sy - r * 0.32, r * 0.1, sx, sy, r);
          if (prim.glow) {
            grad.addColorStop(0, '#FEF08A');
            grad.addColorStop(0.55, prim.baseHex);
            grad.addColorStop(1, aura.primary);
          } else {
            grad.addColorStop(0, shadeHex(prim.baseHex, 1.22));
            grad.addColorStop(0.62, prim.baseHex);
            grad.addColorStop(1, shadeHex(prim.baseHex, 0.68));
          }
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = prim.glow ? aura.secondary : prim.outlineHex;
          ctx.stroke();
        } else if (prim.type === 'capsule') {
          const { a, b, rA, rB } = prim;
          const dx = b.sx - a.sx;
          const dy = b.sy - a.sy;
          const len = Math.hypot(dx, dy);
          const nx = len > 0.001 ? -dy / len : 0;
          const ny = len > 0.001 ? dx / len : 1;
          const angle = Math.atan2(dy, dx);

          ctx.beginPath();
          ctx.arc(a.sx, a.sy, Math.max(1.5, rA), angle + Math.PI * 0.5, angle + Math.PI * 1.5);
          ctx.arc(b.sx, b.sy, Math.max(1.5, rB), angle - Math.PI * 0.5, angle + Math.PI * 0.5);
          ctx.closePath();

          const midX = (a.sx + b.sx) * 0.5;
          const midY = (a.sy + b.sy) * 0.5;
          const maxR = Math.max(4, rA, rB);
          const grad = ctx.createLinearGradient(
            midX - nx * maxR,
            midY - ny * maxR,
            midX + nx * maxR,
            midY + ny * maxR
          );
          if (prim.glow) {
            grad.addColorStop(0, '#FEF08A');
            grad.addColorStop(0.5, prim.baseHex);
            grad.addColorStop(1, aura.primary);
          } else {
            grad.addColorStop(0, shadeHex(prim.baseHex, 1.22));
            grad.addColorStop(0.55, prim.baseHex);
            grad.addColorStop(1, shadeHex(prim.baseHex, 0.66));
          }
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 1.45;
          ctx.strokeStyle = prim.glow ? aura.secondary : prim.outlineHex;
          ctx.stroke();
        }
      });
    }

    // Traits du visage si la tête fait face à la caméra (Fallback 2D)
    const headFront = rotatePoint(vec3(0, 0, 1), yaw, pitch);
    if (!gl && headFront.z > 0.15) {
      const eyeL = projectPoint(add3(sk.head, vec3(-0.030, 0.012, 0.076)), yaw, pitch, cssW, cssH, zoom);
      const eyeR = projectPoint(add3(sk.head, vec3(0.030, 0.012, 0.076)), yaw, pitch, cssW, cssH, zoom);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(eyeL.sx - 4, eyeL.sy - 2);
      ctx.lineTo(eyeL.sx + 2, eyeL.sy);
      ctx.moveTo(eyeR.sx + 4, eyeR.sy - 2);
      ctx.lineTo(eyeR.sx - 2, eyeR.sy);
      ctx.stroke();

      ctx.fillStyle = isBurst || hair.id !== 'obsidian' ? aura.secondary : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(eyeL.sx, eyeL.sy + 1, 2.1, 0, Math.PI * 2);
      ctx.arc(eyeR.sx, eyeR.sy + 1, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Éclairs d'Aura Cinétique 3D autour du personnage si activés
    if (app.lightningSparks !== false && app.sparksEnabled !== false) {
      ctx.strokeStyle = isBurst ? '#FEF08A' : aura.secondary;
      ctx.lineWidth = isBurst ? 2.6 : 1.7;
      ctx.beginPath();
      const sparkSeed = Math.floor(tSec * 9);
      const side = sparkSeed % 2 === 0 ? -1 : 1;
      const pS1 = projectPoint(vec3(side * 0.48, 0.45, 0.15), yaw, pitch, cssW, cssH, zoom);
      const pS2 = projectPoint(vec3(side * 0.36, 0.18, 0.25), yaw, pitch, cssW, cssH, zoom);
      const pS3 = projectPoint(vec3(side * 0.52, -0.05, 0.12), yaw, pitch, cssW, cssH, zoom);
      const pS4 = projectPoint(vec3(side * 0.38, -0.38, 0.22), yaw, pitch, cssW, cssH, zoom);
      ctx.moveTo(pS1.sx, pS1.sy);
      ctx.lineTo(pS2.sx, pS2.sy);
      ctx.lineTo(pS3.sx, pS3.sy);
      ctx.lineTo(pS4.sx, pS4.sy);
      ctx.stroke();
    }

    // Mise à jour en direct du HUD Métronome de Tempo & Phase Biomécanique
    const wrapper = canvas.parentElement;
    if (wrapper) {
      const phaseEl = wrapper.querySelector('.hero3d-phase-badge');
      if (phaseEl) {
        phaseEl.textContent = isBurst ? '💥 ÉVEIL CINÉTIQUE — SÉRIE VALIDÉE !' : sk.phaseLabel;
        phaseEl.style.color = isBurst ? '#FEF08A' : sk.tempo.barColor;
      }
      const countEl = wrapper.querySelector('.hero3d-tempo-countdown');
      if (countEl) {
        countEl.textContent = isBurst ? 'PULSE MAX' : sk.tempo.countdownText;
      }
      const barEl = wrapper.querySelector('.hero3d-tempo-bar');
      if (barEl) {
        barEl.style.width = `${isBurst ? 100 : sk.tempo.barPct}%`;
        barEl.style.backgroundColor = isBurst ? '#FACC15' : sk.tempo.barColor;
      }
    }

    // --- ONDE DE CHOC SHŌNEN TEMPS RÉEL (SHOCKWAVE BURST) ---
    if (isBurst) {
      const remainingMs = Math.max(0, state3D.powerBurstUntil - performance.now());
      const burstProgress = 1 - (remainingMs / 2200);
      if (burstProgress < 1) {
        const ringRadius = burstProgress * (cssW * 0.55);
        const ringAlpha = Math.max(0, (1 - burstProgress) * 0.85);
        const rgb = hexToRgb(aura.secondary || '#FACC15');
        ctx.save();
        ctx.beginPath();
        ctx.arc(cssW * 0.5, cssH * 0.52, ringRadius, 0, Math.PI * 2);
        ctx.lineWidth = Math.max(1, (1 - burstProgress) * 4.2);
        ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${ringAlpha})`;
        ctx.shadowColor = aura.primary || '#F43F5E';
        ctx.shadowBlur = 16;
        ctx.stroke();

        const innerProgress = (burstProgress * 1.45) % 1;
        const innerR = innerProgress * (cssW * 0.35);
        const innerAlpha = Math.max(0, (1 - innerProgress) * 0.6);
        ctx.beginPath();
        ctx.arc(cssW * 0.5, cssH * 0.52, innerR, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(255, 255, 255, ${innerAlpha})`;
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ============================================================================
  // INTERACTIVITÉ TACTILE & SOURIS (ROTATION 360° DU MODÈLE 3D)
  // ============================================================================
  function bindCanvasInteractions(canvas) {
    if (!canvas || canvas.dataset.bound3d === 'true') return;
    canvas.dataset.bound3d = 'true';

    const onDown = (clientX, clientY) => {
      state3D.isDragging = true;
      state3D.autoRotate = false;
      state3D.lastX = clientX;
      state3D.lastY = clientY;
    };

    const onMove = (clientX, clientY) => {
      if (!state3D.isDragging) return;
      const dx = clientX - state3D.lastX;
      const dy = clientY - state3D.lastY;
      state3D.lastX = clientX;
      state3D.lastY = clientY;
      state3D.yaw += dx * 0.014;
      state3D.pitch = Math.max(-0.55, Math.min(0.65, state3D.pitch + dy * 0.01));
    };

    const handleWindowMove = (e) => onMove(e.clientX, e.clientY);
    const handleWindowUp = () => {
      state3D.isDragging = false;
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };

    canvas.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      onDown(e.clientX, e.clientY);
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
    });

    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          e.stopPropagation();
          onDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
    canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1 && state3D.isDragging) {
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
    canvas.addEventListener('touchend', () => {
      state3D.isDragging = false;
    });
  }

  function renderAllVisibleCanvases() {
    const canvases = document.querySelectorAll('.ironpulse-3d-canvas');
    if (canvases.length > 0 && ns.RPG) {
      const hero = ns.RPG.getHeroProfile();
      canvases.forEach((cv) => {
        bindCanvasInteractions(cv);
        const exId = cv.dataset.exerciseId || '';
        const moveOverride = cv.dataset.moveId || '';
        const moveConfig = exId
          ? resolveMoveForExercise(exId)
          : moveOverride
          ? { move: moveOverride, label: moveOverride, focus: '' }
          : { move: state3D.activePreviewMove };
        renderHero3DCanvas(cv, hero, moveConfig);
      });
    }
  }

  function startLoop() {
    if (state3D.rafId) return;
    function tick() {
      const canvases = document.querySelectorAll('.ironpulse-3d-canvas');
      if (canvases.length > 0) {
        renderAllVisibleCanvases();
      }
      state3D.rafId = requestAnimationFrame(tick);
    }
    state3D.rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (state3D.rafId) {
      cancelAnimationFrame(state3D.rafId);
      state3D.rafId = null;
    }
  }

  // Génère le bloc HTML de la scène 3D interactive (Three.js WebGL + Métronome Tempo 3-1-1 + Audio Tactique)
  function renderHero3DStageHTML(options) {
    const opts = options || {};
    const rawExId = opts.exerciseId || '';
    const exerciseId = rawExId === 'idle' || rawExId === 'idle-combat' ? '' : rawExId;
    const moveId = opts.moveId || (exerciseId ? '' : state3D.activePreviewMove);
    const heightClass = opts.compact ? 'h-[240px]' : 'h-[330px]';
    const heightPx = opts.compact ? '240px' : '330px';
    const showMoveSelector = !!(opts.showMoveSelector || opts.showExerciseSelector);
    const moveMeta = exerciseId ? resolveMoveForExercise(exerciseId) : null;
    const isWebGLActive = Boolean(window.THREE);
    const isArena = !!(opts.arenaMode || opts.transparent);

    const tempoControlsHtml = isArena ? '' : `
      <div class="flex items-center justify-between gap-1 pt-1.5">
        <div class="flex items-center gap-1 overflow-x-auto no-scrollbar">
          ${TEMPO_PRESETS.map((tp) => {
            const active = state3D.tempoPresetId === tp.id;
            return `
              <button
                onclick="event.stopPropagation(); IronPulse.Hero3D.setTempoPreset('${tp.id}')"
                class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold whitespace-nowrap border transition ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white'
                }"
                title="${tp.desc}"
              >
                ⏱ ${tp.label}
              </button>
            `;
          }).join('')}
        </div>
        <button
          onclick="event.stopPropagation(); IronPulse.Hero3D.toggleAudioTempo()"
          class="px-2 py-0.5 rounded-lg text-[9px] font-extrabold whitespace-nowrap border shrink-0 transition ${
            state3D.audioTempoEnabled
              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white'
          }"
          title="Activer/Couper les bips tactiques du métronome 3-1-1 et les sons d'Aura"
        >
          ${state3D.audioTempoEnabled ? '🔊 Audio Tactique ON' : '🔇 Audio OFF'}
        </button>
      </div>
    `;

    const selectorHtml = (showMoveSelector && !isArena)
      ? `
      <div class="flex gap-1 overflow-x-auto no-scrollbar pt-1.5">
        ${PREVIEW_MOVES.map((m) => {
          const active = state3D.activePreviewMove === m.id;
          return `
            <button
              onclick="event.stopPropagation(); IronPulse.Hero3D.setPreviewMove('${m.id}')"
              class="px-2 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap border transition ${
                active
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white'
              }"
            >
              ${m.label}
            </button>
          `;
        }).join('')}
      </div>
    `
      : '';

    return `
      <div class="w-full h-full select-none">
        <div class="shonen-portrait-stage relative w-full h-full mx-auto">
          <div class="shonen-portrait-frame relative w-full h-full ${isArena ? 'bg-transparent border-0 shadow-none' : 'rounded-2xl overflow-hidden border border-white/10 bg-[#070A11] shadow-2xl'} ${heightClass}" style="height: ${heightPx}; background: ${isArena ? 'transparent !important' : '#070A11'}; border: ${isArena ? 'none !important' : ''};">
            <canvas
              class="ironpulse-3d-canvas w-full h-full block cursor-pointer"
              data-exercise-id="${exerciseId}"
              data-move-id="${moveId}"
              title="Glissez avec la souris ou le doigt pour faire pivoter le personnage en 3D à 360°"
            ></canvas>

            <!-- Contrôles Caméra 3D Studio (Three.js WebGL + Rotation 360° & Angles) -->
            <div class="absolute ${isArena ? 'bottom-2 left-2 right-2 justify-center' : 'top-2.5 left-2.5 right-2.5 justify-between'} flex items-center pointer-events-none z-20">
              ${isArena ? '' : `
              <span class="px-2.5 py-1 rounded-full bg-slate-950/80 border border-white/10 text-[9px] font-black uppercase tracking-wider text-slate-300 backdrop-blur-md">
                ${isWebGLActive ? '⚡ THREE.JS WEBGL • STUDIO 3D' : '⚡ MOTEUR 3D • 360°'}
              </span>`}
              <div class="flex items-center gap-1.5 pointer-events-auto">
                <button
                  onclick="event.stopPropagation(); IronPulse.Hero3D.setAngle(0, 0.08)"
                  class="px-2 py-0.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/30 text-[10px] font-bold text-slate-200 backdrop-blur-md transition shadow"
                  title="Vue de Face"
                >Face</button>
                <button
                  onclick="event.stopPropagation(); IronPulse.Hero3D.setAngle(1.25, 0.1)"
                  class="px-2 py-0.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/30 text-[10px] font-bold text-slate-200 backdrop-blur-md transition shadow"
                  title="Vue de Profil (Idéal pour vérifier la posture)"
                >Profil</button>
                <button
                  onclick="event.stopPropagation(); IronPulse.Hero3D.setAngle(3.14, 0.08)"
                  class="px-2 py-0.5 rounded-lg bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/30 text-[10px] font-bold text-slate-200 backdrop-blur-md transition shadow"
                  title="Vue du Dos"
                >Dos</button>
                <button
                  onclick="event.stopPropagation(); IronPulse.Hero3D.toggleAutoRotate()"
                  class="px-2 py-0.5 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/50 text-[10px] font-black text-cyan-300 backdrop-blur-md transition shadow"
                  title="Rotation automatique 360°"
                >↻ 360°</button>
              </div>
            </div>

            ${isArena ? '' : `
            <!-- Bandeau inférieur : Métronome de Tempo Biomécanique 3-1-1 & Jauge de Phase en direct -->
            <div class="absolute bottom-1.5 left-1.5 right-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 backdrop-blur-sm pointer-events-none space-y-1">
              <div class="flex items-center justify-between gap-1">
                <span class="hero3d-phase-badge text-[9px] font-extrabold text-emerald-300 truncate">
                  ${moveMeta ? moveMeta.label : '🔥 Glissez pour tourner le Héros 3D à 360°'}
                </span>
                <span class="hero3d-tempo-countdown px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[9px] font-black font-mono text-amber-300 shrink-0">
                  Tempo ${state3D.tempoPresetId}
                </span>
              </div>
              <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="hero3d-tempo-bar h-full rounded-full transition-all duration-75" style="width: 50%; background-color: #10B981;"></div>
              </div>
            </div>`}
          </div>
        </div>
        ${tempoControlsHtml}
        ${selectorHtml}
      </div>
    `;
  }

  ns.Hero3D = {
    PREVIEW_MOVES,
    TEMPO_PRESETS,
    resolveMoveForExercise,
    computeTempoPhase,
    computeSkeleton3D,
    renderHero3DCanvas,
    renderHero3DStageHTML,
    renderStageHTML: renderHero3DStageHTML,
    renderNow: renderAllVisibleCanvases,
    startLoop,
    stopLoop,
    setPreviewMove(moveId) {
      state3D.activePreviewMove = moveId;
      state3D.tempoStartSec = performance.now() / 1000;
      if (ns.App && ns.App.refresh) ns.App.refresh();
    },
    setTempoPreset(presetId) {
      state3D.tempoPresetId = presetId;
      state3D.tempoStartSec = performance.now() / 1000;
      if (state3D.audioTempoEnabled) {
        playSynthTone(660, 880, 0.08, 'triangle', 0.08);
      }
      if (ns.App && ns.App.refresh) ns.App.refresh();
    },
    toggleAudioTempo() {
      state3D.audioTempoEnabled = !state3D.audioTempoEnabled;
      if (state3D.audioTempoEnabled) {
        getAudioCtx();
        playSynthTone(587.33, 880, 0.12, 'triangle', 0.1);
      }
      if (ns.App && ns.App.refresh) ns.App.refresh();
    },
    setAngle(yaw, pitch) {
      state3D.autoRotate = false;
      state3D.yaw = yaw;
      state3D.pitch = pitch;
      renderAllVisibleCanvases();
    },
    toggleAutoRotate() {
      state3D.autoRotate = !state3D.autoRotate;
      renderAllVisibleCanvases();
    },
    triggerPowerBurst() {
      state3D.powerBurstUntil = performance.now() + 2200;
      playPowerBurstSound();
      triggerScreenShake(380, 4.2);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 25, 75, 30, 130]);
        } catch (_) {}
      }
      renderAllVisibleCanvases();
    },
    triggerScreenShake(durationMs, intensity) {
      triggerScreenShake(durationMs, intensity);
    },
    dispose() {
      if (threeCtx && threeCtx.dispose) {
        threeCtx.dispose();
      }
    }
  };
})(window.IronPulse);
