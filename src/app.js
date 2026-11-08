// IronPulse � Contr�leur Principal d'Interface Mobile (7 �crans + Chronom�tre + Modales)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  const ui = {
    currentTab: 'home', // 'home' | 'rpg' | 'exercises' | 'programs' | 'workout' | 'history' | 'progress' | 'profile'
    frameMode: (typeof window !== 'undefined' && window.innerWidth <= 500) ? 'full' : 'framed', // 'framed' | 'full'
    heroDisplayMode: 'art', // 'art' (Manga HD Plein Pied) | '3d' (Studio 3D 360�)
    // Assistant Premi�re Utilisation (Questionnaire Biom�trique + Avatar 3D + Tutoriel)
    onboardingOpen: false,
    onboardingStep: 1, // 1: Biom�trie (�ge/Taille/Poids) | 2: Objectif & Niveau | 3: Guerrier 3D | 4: Tutoriel App | 5: Synth�se & D�part
    tutorialSlideIdx: 0,
    // Visite guid�e interactive en direct sur les onglets de l'application
    guidedTourActive: false,
    guidedTourStep: 0,
    // Sous-onglet RPG H�ros
    rpgSubTab: 'hero', // 'hero' | 'customize' | 'quests' | 'relics' | 'guild'
    activeWorkout3DExerciseIdx: 0,
    // Filtres R�pertoire d'exercices
    exerciseSearch: '',
    selectedMuscle: 'all',
    selectedEquipment: 'Tous',
    // Filtres Programmes
    programSubTab: 'predefined', // 'predefined' | 'custom'
    filterGoal: 'all',
    filterLevel: 'all',
    // Sous-onglet Progression & IA
    progressSubTab: 'charts', // 'charts' | 'ai'
    selectedChartExerciseId: 'ex-bench-press',
    selectedChartMetric: 'best1RM', // 'best1RM' | 'maxWeight' | 'volume'
    aiLoading: false,
    aiCustomQuestion: '',
    geminiTesting: false,
    geminiTestResult: null,
    showApiKey: false,
    // Minuteur de repos en direct
    restTimer: {
      active: false,
      remaining: 0,
      total: 90,
      exerciseName: ''
    },
    // Modale active
    modal: null // { type: 'exercise-detail' | 'create-session' | 'create-exercise' | 'add-workout-exercise' | 'workout-summary', data: ... }
  };

  let workoutElapsedInterval = null;
  let restCountdownInterval = null;

  // Petit synth�tiseur Web Audio pour le bip de fin de repos (sans fichier audio externe)
  function playTimerBeep() {
    const state = ns.Storage.getState();
    if (!state.profile.soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.43);
    } catch (e) {
      // Ignorer si l'autoplay audio est bloqu�
    }
  }

  function formatDurationClock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${String(mins % 60).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatFullDate(isoStr) {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  }

  function startRestTimer(seconds, exerciseName) {
    const dur = Number(seconds) || ns.Storage.getState().profile.defaultRestSeconds || 90;
    ui.restTimer = {
      active: true,
      remaining: dur,
      total: dur,
      exerciseName: exerciseName || 'Repos'
    };
    if (restCountdownInterval) clearInterval(restCountdownInterval);
    restCountdownInterval = setInterval(() => {
      if (!ui.restTimer.active) return;
      ui.restTimer.remaining -= 1;
      if (ui.restTimer.remaining <= 0) {
        ui.restTimer.active = false;
        ui.restTimer.remaining = 0;
        clearInterval(restCountdownInterval);
        playTimerBeep();
      }
      updateRestTimerDOM();
    }, 1000);
    updateRestTimerDOM();
  }

  function adjustRestTimer(deltaSeconds) {
    if (!ui.restTimer.active) return;
    ui.restTimer.remaining = Math.max(5, ui.restTimer.remaining + deltaSeconds);
    ui.restTimer.total = Math.max(ui.restTimer.total, ui.restTimer.remaining);
    updateRestTimerDOM();
  }

  function stopRestTimer() {
    ui.restTimer.active = false;
    ui.restTimer.remaining = 0;
    if (restCountdownInterval) clearInterval(restCountdownInterval);
    updateRestTimerDOM();
  }

  function updateRestTimerDOM() {
    const container = document.getElementById('rest-timer-bar');
    if (!container) return;
    if (!ui.restTimer.active) {
      container.innerHTML = '';
      container.className = 'hidden';
      return;
    }
    const pct = Math.min(100, Math.max(0, Math.round((ui.restTimer.remaining / ui.restTimer.total) * 100)));
    container.className = 'px-3 pb-2 z-30 animate-slide-up';
    container.innerHTML = `
      <div class="bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              ?
            </div>
            <div class="min-w-0">
              <div class="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">Temps de repos</div>
              <div class="text-xs text-slate-300 truncate">${escapeHtml(ui.restTimer.exerciseName)}</div>
            </div>
          </div>
          <div class="text-2xl font-extrabold font-mono text-white tabular-nums">
            ${formatDurationClock(ui.restTimer.remaining)}
          </div>
        </div>
        <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
          <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button onclick="IronPulse.App.adjustRest(-15)" class="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 active:scale-95 transition">
            -15 sec
          </button>
          <button onclick="IronPulse.App.adjustRest(15)" class="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 active:scale-95 transition">
            +15 sec
          </button>
          <button onclick="IronPulse.App.skipRest()" class="py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-bold text-emerald-300 active:scale-95 transition">
            Passer ?
          </button>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // D�marrer une s�ance � partir d'un mod�le (programme pr�d�fini, s�ance perso, ou s�ance libre)
  function startWorkoutFromTemplate(sessionTemplate, programId) {
    const state = ns.Storage.getState();

    const exercisesBlocks = (sessionTemplate.exercises || []).map((item) => {
      const ex = ns.Storage.getExerciseById(item.exerciseId);
      const lastPerf = ns.Storage.getLastPerformanceForExercise(item.exerciseId);
      const count = Number(item.targetSets) || 3;
      const defaultReps = parseInt(String(item.targetReps || '10').split('-')[0], 10) || 10;
      const restSec = Number(item.restSeconds) || ex.defaultRest || state.profile.defaultRestSeconds || 90;

      const sets = [];
      for (let i = 0; i < count; i++) {
        const prevSet = lastPerf && lastPerf.sets[i] ? lastPerf.sets[i] : (lastPerf && lastPerf.sets[0] ? lastPerf.sets[0] : null);
        sets.push({
          weight: prevSet ? prevSet.weight : 20,
          reps: prevSet ? prevSet.reps : defaultReps,
          rpe: 8,
          restSeconds: restSec,
          completed: false
        });
      }

      return {
        exerciseId: item.exerciseId,
        targetReps: item.targetReps || '8-12',
        restSeconds: restSec,
        note: item.note || '',
        sets
      };
    });

    state.activeWorkout = {
      id: 'live-' + Date.now(),
      name: sessionTemplate.name || 'S�ance libre',
      programId: programId || null,
      startedAt: Date.now(),
      notes: '',
      exercises: exercisesBlocks
    };

    ns.Storage.saveState();
    ui.activeWorkout3DExerciseIdx = 0;
    ui.currentTab = 'workout';
    render();
  }

  function startEmptyWorkout() {
    startWorkoutFromTemplate(
      {
        name: 'S�ance Libre Personnalis�e',
        exercises: [
          { exerciseId: 'ex-bench-press', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: '' },
          { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: '' }
        ]
      },
      null
    );
  }

  // Formatage markdown l�ger pour les r�ponses du Coach IA
  function renderSimpleMarkdown(mdText) {
    const lines = String(mdText || '').split('\n');
    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<div class="h-2"></div>';
        let formatted = escapeHtml(trimmed)
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em class="text-slate-300">$1</em>');

        if (trimmed.startsWith('### ')) {
          return `<h4 class="text-sm font-bold text-emerald-400 mt-2 mb-1">${formatted.replace(/^###\s+/, '')}</h4>`;
        }
        if (trimmed.startsWith('## ')) {
          return `<h3 class="text-base font-bold text-emerald-400 mt-2 mb-1">${formatted.replace(/^##\s+/, '')}</h3>`;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return `<div class="flex items-start gap-2 text-xs text-slate-200 leading-relaxed mb-1.5"><span class="text-emerald-400 font-bold mt-0.5">�</span><span>${formatted.replace(/^[-*]\s+/, '')}</span></div>`;
        }
        if (trimmed.startsWith('> ')) {
          return `<div class="border-l-2 border-amber-500/60 pl-2.5 py-1 my-1.5 text-[11px] text-amber-200/90 bg-amber-500/10 rounded-r-lg">${formatted.replace(/^>\s+/, '')}</div>`;
        }
        return `<p class="text-xs text-slate-200 leading-relaxed mb-1.5">${formatted}</p>`;
      })
      .join('');
  }

  // ============================================================================
  // RENDU �CRAN 1 : QG DU H�ROS � AIR & FOCUS (CHARTE GRAPHIQUE �PUR�E & SHONEN APEX)
  // ============================================================================
  function renderHomeScreen() {
    const state = ns.Storage.getState();
    const { profile, history, activeWorkout } = state;
    const hero = ns.RPG ? ns.RPG.getHeroProfile() : null;

    const activeProg =
      ns.Data.PREDEFINED_PROGRAMS.find((p) => p.id === profile.activeProgramId) ||
      ns.Data.PREDEFINED_PROGRAMS[1];

    const nextSession = activeProg.sessions[history.length % activeProg.sessions.length] || activeProg.sessions[0];

    if (!hero) {
      return `<div class="p-4 text-xs text-slate-400">Initialisation du Syst�me RPG...</div>`;
    }

    const relics = hero.relicsStatus || [];
    const is3DMode = ui.heroDisplayMode === '3d';

    // 6 Emplacements de reliques standardis�s (Design �pur� sans troncature)
    const relicSlotsConfig = [
      { id: 'relic-crown', defaultIcon: '??', label: 'Casque', fallbackName: 'Casque de Ma�tre' },
      { id: 'relic-gauntlets', defaultIcon: '??', label: 'Bandages', fallbackName: 'Bandages de Puissance' },
      { id: 'relic-belt', defaultIcon: '??', label: 'Ceinture', fallbackName: 'Ceinture de Force' },
      { id: 'relic-boots', defaultIcon: '??', label: 'Bottes', fallbackName: 'Bottes d�Ancrage' },
      { id: 'relic-pauldrons', defaultIcon: '??', label: 'Amulette', fallbackName: 'Amulette Runique' },
      { id: 'relic-blade', defaultIcon: '??', label: 'Anneau', fallbackName: 'Anneau de Puissance' }
    ];

    const renderRelicSlot = (slotCfg) => {
      const matched = relics.find((r) => r.id === slotCfg.id) || relics.find((r) => r.slot === slotCfg.label);
      const isEquipped = matched ? !!matched.equipped : false;
      const isUnlocked = matched ? !!matched.unlocked : false;
      const icon = matched && matched.icon ? matched.icon : slotCfg.defaultIcon;
      const name = matched ? matched.name : slotCfg.fallbackName;
      const bonus = matched && matched.bonusLabel ? matched.bonusLabel : '+10% Puissance';

      return `
        <button
          onclick="${isUnlocked ? `IronPulse.App.toggleEquipRelic('${matched ? matched.id : slotCfg.id}')` : `IronPulse.App.openRpgSubTab('relics')`}"
          class="relic-glow-slot group relative ${isEquipped ? 'equipped' : ''}"
          title="${escapeHtml(name)} � ${escapeHtml(bonus)}"
        >
          <span class="text-xl sm:text-2xl leading-none filter drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]">${isUnlocked ? icon : '??'}</span>
          ${isEquipped ? `<span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06B6D4]"></span>` : ''}
        </button>
      `;
    };

    // 6 Attributs Radiaux Biom�caniques (Dials circulaires SVG - Image 2)
    const attributesConfig = [
      { code: 'STR', label: 'Force', val: 78, icon: '??', color: '#06B6D4' },
      { code: 'VIT', label: 'Sant�', val: 72, icon: '??', color: '#10B981' },
      { code: 'PWR', label: 'Impact', val: 84, icon: '?', color: '#F59E0B' },
      { code: 'END', label: 'Endur.', val: 75, icon: '???', color: '#6366F1' },
      { code: 'AGI', label: 'Vitesse', val: 69, icon: '??', color: '#EC4899' },
      { code: 'INT', label: 'Tactique', val: 61, icon: '??', color: '#38BDF8' }
    ];

    // Calcul de l'XP de qu�te
    const questEstimatedXp = 120 + nextSession.exercises.length * 3 * 18 + 180;

    return `
      <div class="space-y-4 pb-6 animate-slide-up">
        <!-- CARTE CENTRALE STUDIO AIR & FOCUS (HUD DYNAMIQUE + AVATAR PLEIN PIED + STATS) -->
        <div class="relative overflow-hidden bg-[#070B14]/95 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] space-y-4">
          <!-- Fond Studio Vignet� avec Ligne N�on Cyan -->
          <div class="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-[#04060A] pointer-events-none"></div>

          <!-- TOP BARRE DYNAMIQUE : AVATAR CIRCULAIRE + CP + OR & STREAK -->
          <div class="relative z-10 flex items-center justify-between gap-2 px-1 pt-1">
            <!-- Profil Gauche : Avatar & Niveau -->
            <div class="flex items-center gap-2.5">
              <div class="relative cursor-pointer" onclick="IronPulse.App.openRpgSubTab('hero')">
                <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.6)] bg-slate-900">
                  <img src="./src/assets/hero-anime-original.svg" alt="Avatar" class="w-full h-full object-cover object-top scale-125" />
                </div>
                <span class="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black font-mono border border-white/50 shadow">
                  LV.${hero.level}
                </span>
              </div>
              <div class="min-w-0">
                <h1 class="text-sm font-black text-white tracking-wide uppercase font-mono truncate">${escapeHtml(hero.heroName)}</h1>
                <div class="text-[10px] font-extrabold text-cyan-300 flex items-center gap-1">
                  <span>${hero.classObj.icon}</span>
                  <span class="truncate">${escapeHtml(hero.classObj.name)}</span>
                </div>
              </div>
            </div>

            <!-- Centre : Badge Titre & Combat Power N�on Cyan -->
            <div class="text-center px-1">
              <div class="text-[9px] font-black uppercase tracking-widest text-slate-400">IRONPULSE Z</div>
              <div class="px-2.5 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.35)] text-cyan-300 font-black text-xs font-mono tracking-wider">
                CP : ${hero.combatPower.toLocaleString('fr-FR')}
              </div>
            </div>

            <!-- Droite : Or & Streak Fire 14j -->
            <div class="text-right flex flex-col items-end shrink-0">
              <div class="text-xs font-black text-amber-300 flex items-center gap-1 font-mono">
                <span>??</span> ${hero.gold.toLocaleString('fr-FR')}
              </div>
              <div class="text-[10px] font-black text-orange-400 flex items-center gap-1 uppercase tracking-wider">
                <span>??</span> ${hero.streakDays} JOURS
              </div>
            </div>
          </div>

          <!-- JAUGES DOUBLES HORIZONTALES HP & SP (IMAGE 2) -->
          <div class="relative z-10 grid grid-cols-2 gap-3 px-1">
            <!-- Jauge HP (Rouge / Rose N�on) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[10px] font-black">
                <span class="text-rose-400 flex items-center gap-1">?? HP</span>
                <span class="text-slate-200 font-mono">${hero.hpMax} / ${hero.hpMax}</span>
              </div>
              <div class="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden border border-rose-500/30 p-[1px]">
                <div class="h-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" style="width: 100%"></div>
              </div>
            </div>

            <!-- Jauge SP / Ki (Cyan N�on) -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[10px] font-black">
                <span class="text-cyan-400 flex items-center gap-1">? SP</span>
                <span class="text-slate-200 font-mono">${hero.mpMax} / ${hero.mpMax}</span>
              </div>
              <div class="w-full h-2 bg-slate-900/90 rounded-full overflow-hidden border border-cyan-500/30 p-[1px]">
                <div class="h-full rounded-full bg-gradient-to-r from-cyan-600 via-teal-400 to-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]" style="width: 95%"></div>
              </div>
            </div>
          </div>

          <!-- SC�NE CENTRALE D�GAG�E : GUERRIER SHONEN PLEIN PIED (AIR & FOCUS SANS ENCOMBREMENT) -->
          <div class="relative w-full rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#050811] shadow-2xl min-h-[410px] flex flex-col justify-between">
            <!-- Fond d'ambiance avec ligne de lumi�re cyan horizontale -->
            <div class="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/40 via-transparent to-[#04060A] pointer-events-none"></div>
            <div class="absolute top-1/3 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"></div>

            <!-- En-t�te de sc�ne : Mode Actif & Switcher HD / 3D -->
            <div class="relative z-10 flex items-center justify-between p-2.5">
              <span class="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-cyan-500/30 text-[9px] font-black uppercase tracking-wider text-cyan-300 backdrop-blur-md">
                ${is3DMode ? '? MOTEUR 3D � 360�' : '?? APEX SHONEN � HD'}
              </span>
              <button
                onclick="IronPulse.App.setHeroDisplayMode('${is3DMode ? 'art' : '3d'}')"
                class="px-3 py-1 rounded-full text-[10px] font-black border transition backdrop-blur-md shadow-lg ${
                  is3DMode
                    ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/60 hover:bg-cyan-500/35'
                    : 'bg-amber-500/25 text-amber-200 border-amber-400/60 hover:bg-amber-500/35'
                }"
                title="Basculer entre Illustration Shonen HD et Vue 3D Interactive"
              >
                ${is3DMode ? '?? Vue Manga HD' : '? Passer en 3D 360�'}
              </button>
            </div>

            <!-- Contenu Visuel Central : Plein Pied & Auras -->
            <div class="relative z-0 flex-1 flex items-center justify-center p-1">
              ${
                is3DMode
                  ? `
                <!-- Vue 3D WebGL Three.js avec contr�les discrets -->
                <div class="w-full h-[360px] relative">
                  <canvas
                    class="ironpulse-3d-canvas w-full h-full block cursor-pointer"
                    title="Glissez avec la souris ou le doigt pour faire pivoter le h�ros en 3D"
                  ></canvas>
                  <div class="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 pointer-events-auto">
                    <button onclick="IronPulse.Hero3D.setAngle(0, 0.08)" class="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-200 backdrop-blur-md">Face</button>
                    <button onclick="IronPulse.Hero3D.setAngle(1.25, 0.1)" class="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-200 backdrop-blur-md">Profil</button>
                    <button onclick="IronPulse.Hero3D.setAngle(3.14, 0.08)" class="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[10px] font-bold text-slate-200 backdrop-blur-md">Dos</button>
                    <button onclick="IronPulse.Hero3D.toggleAutoRotate()" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[10px] font-black text-cyan-300 backdrop-blur-md">? 360�</button>
                  </div>
                </div>
              `
                  : `
                <!-- Illustration Shonen Apex Plein Pied avec Aura Vivante -->
                <div class="relative w-full max-w-[340px] mx-auto flex flex-col items-center select-none py-1">
                  <!-- Anneau d'Aura Turquoise & Or Respirante -->
                  <div class="shonen-aura-ring-cyan"></div>
                  <img
                    src="./src/assets/hero-anime-original.svg"
                    alt="Guerrier Shonen Apex Plein Pied"
                    class="relative z-10 w-auto h-[370px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] filter contrast-105"
                  />
                  <!-- Indicateur d'Ancrage & Tempo 3-1-1 -->
                  <div class="relative z-10 -mt-2 px-3 py-1 rounded-full bg-slate-950/85 border border-cyan-500/30 text-[9px] font-black text-cyan-300 backdrop-blur-md flex items-center gap-2 shadow-lg">
                    <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>POSTURE MARTIALE � TEMPO 3-1-1 ACTIF</span>
                  </div>
                </div>
              `
              }
            </div>
          </div>

          <!-- DOCK HORIZONTAL DES 6 RELIQUES D'�QUIPEMENT (SANS TEXTE TRONQU� - IMAGE 2) -->
          <div class="relative z-10 pt-1">
            <div class="flex items-center justify-between mb-1.5 px-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-300">�quipements & Reliques de Fonte</span>
              <button onclick="IronPulse.App.openRpgSubTab('relics')" class="text-[10px] text-cyan-400 font-extrabold hover:underline">
                Inventaire ?
              </button>
            </div>
            <div class="grid grid-cols-6 gap-2">
              ${relicSlotsConfig.map(renderRelicSlot).join('')}
            </div>
          </div>

          <!-- BARRE DES 6 ATTRIBUTS RADIAUX (DIALS CIRCULAIRES SVG - IMAGE 2) -->
          <div class="relative z-10 grid grid-cols-6 gap-1.5 pt-2 border-t border-cyan-500/20">
            ${attributesConfig
              .map(
                (attr) => `
              <div onclick="IronPulse.App.openRpgSubTab('hero')" class="radial-dial-card flex flex-col items-center justify-center p-1.5 rounded-2xl bg-[#090D18]/90 border border-white/5 hover:border-cyan-500/40 transition cursor-pointer shadow-md">
                <div class="relative w-11 h-11 flex items-center justify-center" style="width:44px;height:44px;">
                  <svg width="44" height="44" style="width:44px;height:44px;" class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path class="text-slate-800" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path stroke="${attr.color}" stroke-dasharray="${attr.val}, 100" stroke-width="3" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-[11px] font-black font-mono text-white leading-none">${attr.val}</span>
                  </div>
                </div>
                <span class="text-[9px] font-black uppercase tracking-wider text-slate-300 mt-1">${attr.code}</span>
                <span class="text-[10px] leading-none mt-0.5">${attr.icon}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- BANNI�RE DONJON QUOTIDIEN (IMAGE 2 : LE DONJON QUOTIDIEN - �VEIL DU G�ANT) -->
        <div class="relative overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#090E1A] p-4 shadow-xl">
          <!-- Fond d�grad� sombre avec lueur cyan & or -->
          <div class="absolute inset-0 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-amber-950/20 pointer-events-none"></div>

          <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[9px] font-black uppercase tracking-wider text-cyan-300">
                  LE DONJON QUOTIDIEN
                </span>
                <span class="text-[10px] font-extrabold text-amber-300">
                  NIVEAU RECOMMAND� 11+
                </span>
              </div>
              <h2 class="text-sm sm:text-base font-black text-white tracking-wide">
                �VEIL DU G�ANT : ${escapeHtml(nextSession.name)}
              </h2>
              <p class="text-[11px] text-slate-300 mt-0.5">
                Campagne active : <span class="text-cyan-300 font-bold">${escapeHtml(activeProg.name)}</span> � ? ~${nextSession.estimatedMinutes} min � R�compense : <strong class="text-amber-300">+${questEstimatedXp} XP</strong>
              </p>
            </div>

            <button
              onclick="IronPulse.App.startProgramSession('${activeProg.id}', '${nextSession.id}')"
              class="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 transition flex items-center justify-center gap-2 shrink-0"
            >
              <span>ENTRER DANS LE COMBAT</span>
              <span>??</span>
            </button>
          </div>
        </div>

        <!-- ACC�S RAPIDE AUX PORTAILS RPG (DONJONS & BOSS, GUILDE & D�FIS D'AMIS, ARSENAL) -->
        <div class="grid grid-cols-3 gap-2">
          <button onclick="IronPulse.App.openRpgSubTab('quests')" class="bg-[#0B101D] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">??</div>
            <div class="text-xs font-extrabold text-white">Boss & Qu�tes</div>
            <div class="text-[10px] text-cyan-400">${hero.bossesStatus.filter((b) => b.defeated).length}/${hero.bossesStatus.length} Boss vaincus</div>
          </button>
          <button onclick="IronPulse.App.openRpgSubTab('guild')" class="bg-[#0B101D] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">???</div>
            <div class="text-xs font-extrabold text-white">Club & D�fis</div>
            <div class="text-[10px] text-amber-300">${hero.evaluatedChallenges.length} duels actifs</div>
          </button>
          <button onclick="IronPulse.App.openRpgSubTab('relics')" class="bg-[#0B101D] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">??</div>
            <div class="text-xs font-extrabold text-white">Reliques</div>
            <div class="text-[10px] text-indigo-300">${hero.relicsStatus.filter((r) => r.unlocked).length}/${hero.relicsStatus.length} ?veill?es</div>
          </button>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU ?CRAN 2 : R?PERTOIRE D'EXERCICES
  // ============================================================================
  function renderExercisesScreen() {
    const state = ns.Storage.getState();
    const query = ui.exerciseSearch.trim().toLowerCase();

    const filtered = state.exercises.filter((ex) => {
      const matchMuscle = ui.selectedMuscle === 'all' || ex.muscleGroup === ui.selectedMuscle;
      const matchEquip = ui.selectedEquipment === 'Tous' || ex.equipment === ui.selectedEquipment;
      const matchSearch =
        !query ||
        ex.name.toLowerCase().includes(query) ||
        ex.muscleGroup.toLowerCase().includes(query) ||
        (ex.primaryMuscles || []).some((m) => m.toLowerCase().includes(query));
      return matchMuscle && matchEquip && matchSearch;
    });

    const musclePills = ns.Data.MUSCLE_GROUPS.map((m) => {
      const active = ui.selectedMuscle === m.id;
      return `
        <button onclick="IronPulse.App.setExerciseMuscle('${m.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
          active
            ? 'bg-emerald-500 text-slate-950 shadow-sm'
            : 'bg-slate-800/90 text-slate-300 border border-slate-700/70 hover:bg-slate-700'
        }">
          ${escapeHtml(m.label)}
        </button>
      `;
    }).join('');

    const equipPills = ns.Data.EQUIPMENTS.map((eq) => {
      const active = ui.selectedEquipment === eq;
      return `
        <button onclick="IronPulse.App.setExerciseEquipment('${eq}')" class="px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition ${
          active
            ? 'bg-blue-500/25 text-blue-300 border border-blue-400/50'
            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
        }">
          ${escapeHtml(eq)}
        </button>
      `;
    }).join('');

    const cardsHtml =
      filtered.length === 0
        ? `
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
          Aucun exercice ne correspond � vos filtres.
        </div>
      `
        : filtered
            .map((ex) => {
              const lastPerf = ns.Storage.getLastPerformanceForExercise(ex.id);
              const bestSet =
                lastPerf && lastPerf.sets && lastPerf.sets.length
                  ? `${lastPerf.sets[0].weight} kg � ${lastPerf.sets[0].reps}`
                  : null;
              return `
              <div onclick="IronPulse.App.openExerciseModal('${ex.id}')" class="bg-[#151C28] hover:bg-slate-800/80 border border-slate-800 rounded-2xl p-3.5 cursor-pointer transition active:scale-[0.99]">
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div class="flex items-center gap-1.5 flex-wrap mb-1">
                      <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        ${escapeHtml(ex.muscleGroup)}
                      </span>
                      <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium">
                        ${escapeHtml(ex.equipment)}
                      </span>
                      <span class="px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-400 text-[10px]">
                        ${escapeHtml(ex.level)}
                      </span>
                    </div>
                    <h3 class="text-sm font-bold text-white">${escapeHtml(ex.name)}</h3>
                  </div>
                  <span class="text-slate-400 text-xs px-2 py-1 rounded-lg bg-slate-800/70 shrink-0">Fiche ?</span>
                </div>
                <p class="text-xs text-slate-400 line-clamp-2 mb-2">${escapeHtml(ex.description)}</p>
                <div class="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                  <span class="text-slate-300 truncate">?? <strong class="font-medium">${escapeHtml((ex.primaryMuscles || []).join(', '))}</strong></span>
                  ${
                    bestSet
                      ? `<span class="text-emerald-400 font-semibold shrink-0 ml-2">Dernier : ${bestSet}</span>`
                      : `<span class="text-slate-500 shrink-0 ml-2">Repos : ${ex.defaultRest}s</span>`
                  }
                </div>
              </div>
            `;
            })
            .join('');

    return `
      <div class="space-y-3.5 pb-6 animate-slide-up">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-extrabold text-white">R�pertoire d�exercices</h1>
            <p class="text-xs text-slate-400">${filtered.length} exercice(s) avec muscles cibl�s et consignes</p>
          </div>
          <button onclick="IronPulse.App.openCreateExerciseModal()" class="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition">
            + Cr�er
          </button>
        </div>

        <!-- Barre de recherche -->
        <div class="relative">
          <input
            type="text"
            value="${escapeHtml(ui.exerciseSearch)}"
            oninput="IronPulse.App.onExerciseSearch(this.value)"
            placeholder="Rechercher un exercice ou un muscle (ex: d�velopp�, dos, fessiers)..."
            class="w-full bg-[#151C28] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          ${
            ui.exerciseSearch
              ? `<button onclick="IronPulse.App.onExerciseSearch('')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs">?</button>`
              : ''
          }
        </div>

        <!-- Filtres Groupes Musculaires -->
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          ${musclePills}
        </div>

        <!-- Filtres �quipement -->
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          ${equipPills}
        </div>

        <!-- Liste des exercices -->
        <div class="space-y-2.5">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 3 : PROGRAMMES PR�D�FINIS & S�ANCES PERSONNALIS�ES
  // ============================================================================
  function renderProgramsScreen() {
    const state = ns.Storage.getState();
    const { profile, customSessions } = state;

    const subTabBar = `
      <div class="grid grid-cols-3 gap-1 bg-[#151C28] p-1 rounded-xl border border-slate-800">
        <button onclick="IronPulse.App.setProgramSubTab('predefined')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'predefined' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ?? Campagnes
        </button>
        <button onclick="IronPulse.App.setProgramSubTab('custom')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'custom' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ? Mes S�ances (${customSessions.length})
        </button>
        <button onclick="IronPulse.App.setProgramSubTab('periodization')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'periodization' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ?? P�riodisation
        </button>
      </div>
    `;

    if (ui.programSubTab === 'periodization') {
      const phases = ns.Data.PERIODIZATION_PHASES || [];
      const activePhaseId = profile.periodizationPhase || 'accumulation';
      const activeWeek = Number(profile.periodizationWeek) || 2;
      const activePhase = phases.find((p) => p.id === activePhaseId) || phases[0];

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          <div>
            <h1 class="text-lg font-extrabold text-white">Planificateur de P�riodisation</h1>
            <p class="text-xs text-slate-400">Structurez votre m�socycle en 4 phases scientifiques (AURA FIT)</p>
          </div>

          ${subTabBar}

          <!-- Carte Phase Active du M�socycle -->
          <div class="bg-gradient-to-br from-amber-950/40 via-[#151C28] to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  M�socycle Actif � Semaine ${activeWeek}
                </span>
                <h2 class="text-base font-extrabold text-white mt-1">${activePhase.icon} ${escapeHtml(activePhase.name)}</h2>
                <p class="text-xs text-emerald-300 font-semibold">${escapeHtml(activePhase.subtitle)} (${escapeHtml(activePhase.weeksRange)})</p>
              </div>
              <div class="text-right shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <div class="text-[9px] uppercase text-slate-400 font-bold">Intensit�</div>
                <div class="text-xs font-black text-amber-300">${escapeHtml(activePhase.intensityPct)}</div>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(activePhase.desc)}</p>

            <div class="grid grid-cols-3 gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-bold">Cible RPE</div>
                <div class="text-xs font-black text-white">${escapeHtml(activePhase.targetRpe)}</div>
              </div>
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-bold">S�ries / Muscle</div>
                <div class="text-xs font-black text-emerald-400">${escapeHtml(activePhase.setsPerMuscle)}</div>
              </div>
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-bold">R�p�titions</div>
                <div class="text-xs font-black text-amber-300">${escapeHtml(activePhase.repRange)}</div>
              </div>
            </div>

            <!-- S�lecteur de Semaine du M�socycle (1 � 7) -->
            <div>
              <div class="flex items-center justify-between text-[11px] mb-1.5">
                <span class="text-slate-300 font-bold">Semaine actuelle du cycle :</span>
                <span class="text-amber-300 font-extrabold">Semaine ${activeWeek} / 7</span>
              </div>
              <div class="grid grid-cols-7 gap-1">
                ${[1, 2, 3, 4, 5, 6, 7]
                  .map(
                    (w) => `
                  <button
                    onclick="IronPulse.App.setPeriodizationWeek(${w})"
                    class="py-1.5 rounded-lg text-xs font-black border transition ${
                      activeWeek === w
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }"
                  >
                    S${w}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>

          <!-- Les 4 Phases du M�socycle -->
          <div class="space-y-2.5">
            ${phases
              .map((ph) => {
                const isSelected = ph.id === activePhaseId;
                return `
                  <div
                    onclick="IronPulse.App.selectPeriodizationPhase('${ph.id}')"
                    class="cursor-pointer bg-[#151C28] border ${
                      isSelected ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 hover:border-slate-700'
                    } rounded-2xl p-3.5 space-y-2 transition"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="text-xl">${ph.icon}</span>
                        <div>
                          <div class="text-xs font-extrabold text-white">${escapeHtml(ph.name)}</div>
                          <div class="text-[10px] text-slate-400">${escapeHtml(ph.weeksRange)} � ${escapeHtml(ph.intensityPct)}</div>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }">
                        ${isSelected ? '? Phase Active' : 'Activer'}
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(ph.desc)}</p>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>
      `;
    }

    if (ui.programSubTab === 'custom') {
      const customHtml =
        customSessions.length === 0
          ? `
          <div class="bg-[#151C28] border border-dashed border-slate-700 rounded-2xl p-6 text-center">
            <p class="text-sm font-bold text-white mb-1">Aucune s�ance personnalis�e</p>
            <p class="text-xs text-slate-400 mb-4">Composez votre propre s�ance en choisissant vos exercices, s�ries, r�p�titions et temps de repos.</p>
            <button onclick="IronPulse.App.openCreateSessionModal()" class="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              + Cr�er ma premi�re s�ance
            </button>
          </div>
        `
          : customSessions
              .map((sess) => {
                return `
                <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase">S�ance Personnalis�e</span>
                      <h3 class="text-base font-bold text-white mt-1">${escapeHtml(sess.name)}</h3>
                      <p class="text-xs text-slate-400">${sess.exercises.length} exercices � ~${sess.estimatedMinutes || 45} min</p>
                    </div>
                    <button onclick="IronPulse.App.deleteCustomSession('${sess.id}')" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1" title="Supprimer">??</button>
                  </div>

                  <div class="space-y-1.5 bg-slate-900/70 rounded-xl p-2.5 border border-slate-800/80">
                    ${sess.exercises
                      .map((item, idx) => {
                        const ex = ns.Storage.getExerciseById(item.exerciseId);
                        return `
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-200 truncate"><span class="text-slate-500 mr-1">${idx + 1}.</span>${escapeHtml(ex.name)}</span>
                          <span class="text-emerald-400 font-semibold shrink-0 ml-2">${item.targetSets} � ${item.targetReps} (${item.restSeconds}s)</span>
                        </div>
                      `;
                      })
                      .join('')}
                  </div>

                  <button onclick="IronPulse.App.startCustomSession('${sess.id}')" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow active:scale-[0.99] transition">
                    ? Lancer cette s�ance maintenant
                  </button>
                </div>
              `;
              })
              .join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-extrabold text-white">Programmes & S�ances</h1>
              <p class="text-xs text-slate-400">Cr�ez et personnalisez vos propres entra�nements</p>
            </div>
            <button onclick="IronPulse.App.openCreateSessionModal()" class="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow">
              + Nouvelle s�ance
            </button>
          </div>
          ${subTabBar}
          <div class="space-y-3">
            ${customHtml}
          </div>
        </div>
      `;
    }

    // Programmes pr�d�finis filtr�s par Objectif et Niveau
    const filteredProgs = ns.Data.PREDEFINED_PROGRAMS.filter((p) => {
      const matchGoal = ui.filterGoal === 'all' || p.goal === ui.filterGoal;
      const matchLevel = ui.filterLevel === 'all' || p.level === ui.filterLevel;
      return matchGoal && matchLevel;
    });

    const progsHtml = filteredProgs
      .map((prog) => {
        const isActive = profile.activeProgramId === prog.id;
        const goalLabel = (ns.Data.GOALS.find((g) => g.id === prog.goal) || {}).label || prog.goal;
        const levelLabel = (ns.Data.LEVELS.find((l) => l.id === prog.level) || {}).label || prog.level;

        return `
        <div class="bg-[#151C28] border ${isActive ? 'border-emerald-500' : 'border-slate-800'} rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-1.5 flex-wrap mb-1">
                <span class="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase">${escapeHtml(goalLabel)}</span>
                <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">${escapeHtml(levelLabel)}</span>
                <span class="text-[11px] text-slate-400">� ${escapeHtml(prog.frequency)}</span>
              </div>
              <h3 class="text-base font-extrabold text-white">${escapeHtml(prog.name)}</h3>
            </div>
            ${
              isActive
                ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shrink-0">? Actif</span>`
                : `<button onclick="IronPulse.App.selectActiveProgram('${prog.id}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold shrink-0 transition">Choisir</button>`
            }
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(prog.description)}</p>

          <!-- S�ances incluses dans ce programme -->
          <div class="space-y-2 pt-1">
            ${prog.sessions
              .map(
                (s) => `
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <div class="text-xs font-bold text-white">${escapeHtml(s.name)}</div>
                    <div class="text-[11px] text-slate-400">${s.exercises.length} exercices � ~${s.estimatedMinutes} min</div>
                  </div>
                  <button onclick="IronPulse.App.startProgramSession('${prog.id}', '${s.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shrink-0 active:scale-95 transition">
                    ? D�marrer
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${s.exercises
                    .map((item) => {
                      const ex = ns.Storage.getExerciseById(item.exerciseId);
                      return `<span onclick="IronPulse.App.openExerciseModal('${ex.id}')" class="cursor-pointer px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-[10px] text-slate-300">${escapeHtml(ex.name)} (${item.targetSets}�${item.targetReps})</span>`;
                    })
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <div class="space-y-3.5 pb-6 animate-slide-up">
        <div>
          <h1 class="text-lg font-extrabold text-white">Programmes & S�ances</h1>
          <p class="text-xs text-slate-400">Choisissez un programme selon votre objectif et votre niveau</p>
        </div>

        ${subTabBar}

        <!-- Filtres Objectif & Niveau -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Objectif</label>
            <select onchange="IronPulse.App.setProgramGoalFilter(this.value)" class="w-full bg-[#151C28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
              <option value="all" ${ui.filterGoal === 'all' ? 'selected' : ''}>Tous les objectifs</option>
              ${ns.Data.GOALS.map((g) => `<option value="${g.id}" ${ui.filterGoal === g.id ? 'selected' : ''}>${escapeHtml(g.label)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Niveau</label>
            <select onchange="IronPulse.App.setProgramLevelFilter(this.value)" class="w-full bg-[#151C28] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
              <option value="all" ${ui.filterLevel === 'all' ? 'selected' : ''}>Tous les niveaux</option>
              ${ns.Data.LEVELS.map((l) => `<option value="${l.id}" ${ui.filterLevel === l.id ? 'selected' : ''}>${escapeHtml(l.label)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="space-y-3">
          ${progsHtml}
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 4 : S�ANCE EN COURS (LIVE WORKOUT TRACKER)
  // ============================================================================
  function renderWorkoutScreen() {
    const state = ns.Storage.getState();
    const workout = state.activeWorkout;

    if (!workout) {
      return `
        <div class="space-y-4 py-4 text-center animate-slide-up">
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-xl text-left">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-300">?? Salle de Gravit� 3D � �chauffement</span>
                <h2 class="text-sm font-extrabold text-white">Votre H�ros 3D est pr�t pour le Donjon</h2>
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">Temps R�el</span>
            </div>
            ${ns.Hero3D ? ns.Hero3D.renderHero3DStageHTML({ showMoveSelector: true, compact: true }) : ''}
          </div>
          <div>
            <h1 class="text-lg font-extrabold text-white">Aucune s�ance active</h1>
            <p class="text-xs text-slate-400 max-w-xs mx-auto mt-1">Lancez une s�ance pour que votre Guerrier 3D ex�cute chaque exercice avec vous en direct.</p>
          </div>
          <div class="space-y-2.5 max-w-xs mx-auto pt-1">
            <button onclick="IronPulse.App.navigate('programs')" class="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition">
              ?? Choisir une s�ance de Campagne
            </button>
            <button onclick="IronPulse.App.startEmptyWorkout()" class="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition">
              + D�marrer une Qu�te Libre (avec Coach 3D)
            </button>
          </div>
        </div>
      `;
    }

    const elapsedSec = Math.floor((Date.now() - workout.startedAt) / 1000);
    let totalCompletedSets = 0;
    let totalVolume = 0;

    workout.exercises.forEach((eb) => {
      eb.sets.forEach((s) => {
        if (s.completed) {
          totalCompletedSets += 1;
          totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
        }
      });
    });

    const exercisesCardsHtml = workout.exercises
      .map((exBlock, exIdx) => {
        const ex = ns.Storage.getExerciseById(exBlock.exerciseId);
        const lastPerf = ns.Storage.getLastPerformanceForExercise(exBlock.exerciseId);
        const lastPerfLabel =
          lastPerf && lastPerf.sets && lastPerf.sets.length
            ? `Derni�re s�ance : ${lastPerf.sets.map((s) => `${s.weight}�${s.reps}`).slice(0, 3).join(', ')} kg`
            : 'Premi�re saisie sur cet exercice';

        const setsRowsHtml = exBlock.sets
          .map((set, setIdx) => {
            const done = !!set.completed;
            const currentRpe = set.rpe || 8;
            return `
              <div class="space-y-1 py-1.5 px-1.5 sm:px-2 rounded-xl transition ${
                done ? 'bg-emerald-500/15 border border-emerald-500/40' : 'bg-slate-900/90 border border-slate-800/80'
              }">
                <div class="grid grid-cols-12 gap-1 sm:gap-1.5 items-center">
                  <!-- Num�ro S�rie -->
                  <div class="col-span-1 text-center text-xs font-extrabold ${done ? 'text-emerald-400' : 'text-slate-400'}">
                    ${setIdx + 1}
                  </div>

                  <!-- Charge (kg) -->
                  <div class="col-span-3">
                    <input
                      type="number"
                      step="0.5"
                      aria-label="Charge s�rie ${setIdx + 1}"
                      value="${set.weight}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'weight', this.value)"
                      class="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-1.5 px-1 text-center text-base sm:text-sm font-bold text-white outline-none"
                    />
                  </div>

                  <!-- R�p�titions -->
                  <div class="col-span-2">
                    <input
                      type="number"
                      step="1"
                      aria-label="R�p�titions s�rie ${setIdx + 1}"
                      value="${set.reps}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'reps', this.value)"
                      class="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-1.5 px-1 text-center text-base sm:text-sm font-bold text-white outline-none"
                    />
                  </div>

                  <!-- RPE (Effort per�u 6-10) -->
                  <div class="col-span-2">
                    <select
                      aria-label="RPE s�rie ${setIdx + 1}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'rpe', this.value)"
                      class="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-1.5 px-0.5 text-center text-base sm:text-xs font-semibold text-amber-300 outline-none"
                    >
                      ${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10]
                        .map((v) => `<option value="${v}" ${Number(currentRpe) === v ? 'selected' : ''}>${v}</option>`)
                        .join('')}
                    </select>
                  </div>

                  <!-- Repos (s) -->
                  <div class="col-span-2">
                    <input
                      type="number"
                      step="15"
                      aria-label="Repos s�rie ${setIdx + 1}"
                      value="${set.restSeconds || exBlock.restSeconds || 90}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'restSeconds', this.value)"
                      class="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-1.5 px-0.5 text-center text-base sm:text-xs font-medium text-slate-300 outline-none"
                    />
                  </div>

                  <!-- Bouton Valider S�rie + Supprimer -->
                  <div class="col-span-2 flex items-center justify-end gap-0.5">
                    <button
                      onclick="IronPulse.App.toggleSetCompleted(${exIdx}, ${setIdx})"
                      class="flex-1 py-1.5 px-1 rounded-lg font-extrabold text-xs transition active:scale-95 ${
                        done
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }"
                      title="Valider la s�rie et lancer le repos"
                    >
                      ${done ? '?' : 'OK'}
                    </button>
                    ${
                      exBlock.sets.length > 1
                        ? `<button onclick="IronPulse.App.removeWorkoutSet(${exIdx}, ${setIdx})" class="px-1 py-1.5 text-slate-500 hover:text-rose-400 text-xs" title="Supprimer s�rie">?</button>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Boutons rapides ergonomiques � une main (-2.5/+2.5 kg & -1/+1 rep) fa�on AURA FIT -->
                <div class="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-800/50 text-[10px]">
                  <div class="flex items-center gap-1">
                    <button onclick="IronPulse.App.nudgeWorkoutSet(${exIdx}, ${setIdx}, 'weight', -2.5)" class="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition">-2.5 kg</button>
                    <button onclick="IronPulse.App.nudgeWorkoutSet(${exIdx}, ${setIdx}, 'weight', 2.5)" class="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-emerald-300 font-bold active:scale-95 transition">+2.5 kg</button>
                  </div>
                  <div class="flex items-center gap-1">
                    <button onclick="IronPulse.App.nudgeWorkoutSet(${exIdx}, ${setIdx}, 'reps', -1)" class="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold active:scale-95 transition">-1 rep</button>
                    <button onclick="IronPulse.App.nudgeWorkoutSet(${exIdx}, ${setIdx}, 'reps', 1)" class="px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-amber-300 font-bold active:scale-95 transition">+1 rep</button>
                  </div>
                  <span class="text-slate-500 font-mono hidden sm:inline">1RM: ${ns.Storage.compute1RM(set.weight, set.reps)} kg</span>
                </div>
              </div>
            `;
          })
          .join('');

        return `
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase">${escapeHtml(ex.muscleGroup)}</span>
                  <span class="text-[11px] text-slate-400">Cible : ${escapeHtml(exBlock.targetReps || '8-12')} r�p.</span>
                  <button
                    onclick="IronPulse.App.setWorkout3DExercise(${exIdx})"
                    class="px-2 py-0.5 rounded-lg border text-[10px] font-extrabold transition ${
                      ui.activeWorkout3DExerciseIdx === exIdx
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-800/90 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                    }"
                  >
                    ?? ${ui.activeWorkout3DExerciseIdx === exIdx ? 'En cours en 3D' : 'Voir en 3D'}
                  </button>
                </div>
                <h3 onclick="IronPulse.App.openExerciseModal('${ex.id}')" class="text-sm font-extrabold text-white mt-0.5 cursor-pointer hover:text-emerald-400 transition truncate">
                  ${escapeHtml(ex.name)} <span class="text-xs font-normal text-slate-400">?</span>
                </h3>
                <div class="text-[11px] text-emerald-400/90 font-medium">${escapeHtml(lastPerfLabel)}</div>
              </div>
              <button onclick="IronPulse.App.removeWorkoutExercise(${exIdx})" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1" title="Retirer l'exercice">??</button>
            </div>

            <!-- En-t�te des colonnes -->
            <div class="grid grid-cols-12 gap-1 sm:gap-1.5 px-1.5 sm:px-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <div class="col-span-1 text-center">#</div>
              <div class="col-span-3 text-center">Charge</div>
              <div class="col-span-2 text-center">R�p.</div>
              <div class="col-span-2 text-center">RPE</div>
              <div class="col-span-2 text-center">Repos</div>
              <div class="col-span-2 text-right pr-1">Statut</div>
            </div>

            <!-- Liste des s�ries -->
            <div class="space-y-1.5">
              ${setsRowsHtml}
            </div>

            <!-- Ajouter une s�rie / Lancer repos manuel -->
            <div class="flex items-center justify-between gap-2 pt-1">
              <button onclick="IronPulse.App.addWorkoutSet(${exIdx})" class="flex-1 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-bold text-slate-200 active:scale-[0.99] transition">
                + Ajouter une s�rie
              </button>
              <button onclick="IronPulse.App.triggerManualRest(${exBlock.restSeconds || 90}, '${escapeHtml(ex.name)}')" class="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-emerald-300 active:scale-95 transition">
                ? Repos ${exBlock.restSeconds || 90}s
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    const active3DIdx = Math.min(
      Math.max(0, ui.activeWorkout3DExerciseIdx || 0),
      Math.max(0, workout.exercises.length - 1)
    );
    const activeExBlock3D = workout.exercises[active3DIdx] || workout.exercises[0];
    const activeEx3D = activeExBlock3D ? ns.Storage.getExerciseById(activeExBlock3D.exerciseId) : null;
    const activeMoveMeta = activeEx3D && ns.Hero3D ? ns.Hero3D.resolveMoveForExercise(activeEx3D.id) : null;

    const workout3DPills = workout.exercises
      .map((eb, idx) => {
        const exItem = ns.Storage.getExerciseById(eb.exerciseId);
        const isCurrent = idx === active3DIdx;
        return `
          <button
            onclick="IronPulse.App.setWorkout3DExercise(${idx})"
            class="px-2.5 py-1 rounded-xl text-[10px] font-extrabold whitespace-nowrap border transition ${
              isCurrent
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:text-white'
            }"
          >
            ${idx + 1}. ${escapeHtml(exItem.name)}
          </button>
        `;
      })
      .join('');

    return `
      <div class="space-y-3.5 pb-8 animate-slide-up">
        <!-- Barre sup�rieure de s�ance en direct -->
        <div class="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Entra�nement en direct</span>
              <input
                type="text"
                value="${escapeHtml(workout.name)}"
                onchange="IronPulse.App.updateWorkoutName(this.value)"
                class="block w-full bg-transparent text-base font-extrabold text-white border-b border-transparent focus:border-emerald-500 outline-none truncate"
              />
            </div>
            <div class="text-right shrink-0">
              <div id="live-workout-clock" class="text-lg font-extrabold font-mono text-emerald-400 tabular-nums">${formatDurationClock(elapsedSec)}</div>
              <div class="text-[10px] text-slate-400">Dur�e</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center mb-3">
            <div>
              <div class="text-[10px] text-slate-400">S�ries valid�es</div>
              <div class="text-sm font-bold text-white">${totalCompletedSets}</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">Tonnage actuel</div>
              <div class="text-sm font-bold text-emerald-400">${Math.round(totalVolume)} kg</div>
            </div>
            <div>
              <div class="text-[10px] text-slate-400">Exercices</div>
              <div class="text-sm font-bold text-white">${workout.exercises.length}</div>
            </div>
          </div>

          <div class="flex gap-2">
            <button onclick="IronPulse.App.finishActiveWorkout()" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg active:scale-[0.98] transition">
              ? Terminer & Enregistrer la s�ance
            </button>
            <button onclick="IronPulse.App.cancelActiveWorkout()" class="px-3 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition" title="Annuler la s�ance">
              Abandonner
            </button>
          </div>

          <div class="pt-2">
            <button
              onclick="IronPulse.App.openWarmupModal()"
              class="w-full py-2 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-between transition ${
                workout.warmupCompleted
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }"
            >
              <span>${workout.warmupCompleted ? '? �chauffement Dynamique Valid�' : '?? �chauffement Dynamique & Mont�e en Charge'}</span>
              <span class="text-[10px] font-black">${workout.warmupCompleted ? '+35 XP & +15 ?? acquis' : '+35 XP & +15 ??'}</span>
            </button>
          </div>
        </div>

        <!-- SC�NE HOLOGRAPHIQUE 3D EN DIRECT : LE H�ROS EFFECTUE LE M�ME MOUVEMENT QUE L'EXERCICE ACTIF -->
        ${
          activeEx3D && ns.Hero3D
            ? `
          <div class="shonen-arena-card relative overflow-hidden bg-[#151C28] border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
            <div class="relative z-10 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-300">?? Synchronisation 3D en Direct</span>
                <h2 class="text-sm font-extrabold text-white truncate">??? ${escapeHtml(activeEx3D.name)}</h2>
                <p class="text-[10px] text-emerald-400 truncate">?? ${escapeHtml(activeMoveMeta ? activeMoveMeta.focus : (activeEx3D.primaryMuscles || []).join(', '))}</p>
              </div>
              <span class="px-2 py-1 rounded-xl bg-slate-950/90 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 shrink-0">
                ${escapeHtml(activeExBlock3D.targetReps || '8-12')} r�p.
              </span>
            </div>

            <!-- S�lecteur d'exercice synchronis� en 3D -->
            <div class="relative z-10 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              ${workout3DPills}
            </div>

            <!-- Canvas 3D ex�cutant le mouvement biom�canique de l'exercice -->
            <div class="relative z-10">
              ${ns.Hero3D.renderHero3DStageHTML({ exerciseId: activeEx3D.id, compact: true })}
            </div>
          </div>
        `
            : ''
        }

        <!-- Cartes d'exercices -->
        <div class="space-y-3">
          ${exercisesCardsHtml}
        </div>

        <!-- Ajouter un exercice � la s�ance -->
        <button onclick="IronPulse.App.openAddExerciseToWorkoutModal()" class="w-full py-3.5 rounded-2xl bg-[#151C28] hover:bg-slate-800 border border-dashed border-emerald-500/50 text-emerald-400 font-bold text-xs transition">
          + Ajouter un exercice � la s�ance
        </button>

        <!-- Notes de s�ance -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-3.5">
          <label class="block text-xs font-bold text-slate-300 mb-1.5">Notes & Ressenti de la s�ance</label>
          <textarea
            rows="2"
            placeholder="Ex: Tr�s bonnes sensations aux pectoraux, penser � monter � 72.5 kg la semaine prochaine..."
            onchange="IronPulse.App.updateWorkoutNotes(this.value)"
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          >${escapeHtml(workout.notes || '')}</textarea>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 5 : HISTORIQUE DES S�ANCES
  // ============================================================================
  function renderHistoryScreen() {
    const state = ns.Storage.getState();
    const sorted = [...state.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const cardsHtml =
      sorted.length === 0
        ? `
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          Aucune s�ance termin�e dans l'historique.
        </div>
      `
        : sorted
            .map((w) => {
              const stats = ns.Storage.computeWorkoutStats(w);
              const exRows = (w.exercises || [])
                .map((eb) => {
                  const ex = ns.Storage.getExerciseById(eb.exerciseId);
                  const setsBadges = (eb.sets || [])
                    .filter((s) => s.completed !== false)
                    .map((s) => `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-mono">${s.weight}kg � ${s.reps}</span>`)
                    .join(' ');
                  return `
                  <div class="py-1.5 border-b border-slate-800/60 last:border-none">
                    <div class="text-xs font-bold text-slate-200 mb-1">${escapeHtml(ex.name)}</div>
                    <div class="flex flex-wrap gap-1">${setsBadges}</div>
                  </div>
                `;
                })
                .join('');

              return `
              <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="text-[11px] text-emerald-400 font-semibold">${formatFullDate(w.date)} � ? ${w.durationMinutes || 50} min</div>
                    <h3 class="text-sm font-extrabold text-white">${escapeHtml(w.name)}</h3>
                  </div>
                  <div class="flex items-center gap-1">
                    <button onclick="IronPulse.App.repeatHistoryWorkout('${w.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition">
                      ? Refaire
                    </button>
                    <button onclick="IronPulse.App.deleteHistoryWorkout('${w.id}')" class="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs" title="Supprimer">??</button>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800/70">
                  <div>
                    <div class="text-[10px] text-slate-400">Tonnage</div>
                    <div class="text-xs font-bold text-white">${stats.totalVolume} kg</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">S�ries</div>
                    <div class="text-xs font-bold text-white">${stats.completedSets}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">R�p�titions</div>
                    <div class="text-xs font-bold text-emerald-400">${stats.totalReps}</div>
                  </div>
                </div>

                <div class="space-y-1 pt-1">
                  ${exRows}
                </div>

                ${
                  w.notes
                    ? `<div class="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/70">?? � ${escapeHtml(w.notes)} �</div>`
                    : ''
                }
              </div>
            `;
            })
            .join('');

    return `
      <div class="space-y-3.5 pb-6 animate-slide-up">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-extrabold text-white">Historique des s�ances</h1>
            <p class="text-xs text-slate-400">${sorted.length} entra�nement(s) enregistr�(s)</p>
          </div>
          <button onclick="IronPulse.App.navigate('progress')" class="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            Voir Graphiques ?
          </button>
        </div>

        <div class="space-y-3">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 6 : PROGRESSION & ACCOMPAGNEMENT COACH IA
  // ============================================================================
  function renderProgressAndAIScreen() {
    const state = ns.Storage.getState();
    const analysis = ns.AICoach.analyzeTrainingData();

    const subTabBar = `
      <div class="grid grid-cols-3 gap-1 bg-[#151C28] p-1 rounded-xl border border-slate-800">
        <button onclick="IronPulse.App.setProgressSubTab('charts')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'charts' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ?? Graphiques & 1RM
        </button>
        <button onclick="IronPulse.App.setProgressSubTab('ai')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'ai' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ? Coach IA
        </button>
        <button onclick="IronPulse.App.setProgressSubTab('nutrition')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'nutrition' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ?? Nutrition
        </button>
      </div>
    `;

    if (ui.progressSubTab === 'nutrition') {
      const { profile } = state;
      const bio = computeBiometricSummary(profile);
      const gender = profile.gender === 'female' ? 'female' : 'male';

      return `
        <div class="space-y-4 pb-6 animate-slide-up">
          <div>
            <h1 class="text-lg font-extrabold text-white">Planificateur Nutrition & Macros</h1>
            <p class="text-xs text-slate-400">Calculateur BMR (Mifflin-St Jeor), TDEE & Macronutriments (AURA FIT)</p>
          </div>

          ${subTabBar}

          <!-- Param�tres rapides Genre / Poids / Objectif -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-white">? Param�tres M�taboliques</span>
              <span class="text-[11px] font-bold ${bio.bmiColor}">IMC ${bio.bmi} � ${bio.bmiLabel}</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                onclick="IronPulse.App.updateProfileField('gender', 'male')"
                class="py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                  gender === 'male'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }"
              >
                ? Homme (Mifflin +5)
              </button>
              <button
                onclick="IronPulse.App.updateProfileField('gender', 'female')"
                class="py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                  gender === 'female'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }"
              >
                ? Femme (Mifflin -161)
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div>
                <div class="text-[10px] uppercase text-slate-400 font-bold">BMR (Repos)</div>
                <div class="text-sm font-black text-white">${bio.bmr} <span class="text-[10px] font-normal text-slate-400">kcal</span></div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-slate-400 font-bold">TDEE (Maintien)</div>
                <div class="text-sm font-black text-slate-200">${bio.tdee} <span class="text-[10px] font-normal text-slate-400">kcal</span></div>
              </div>
              <div>
                <div class="text-[10px] uppercase text-amber-300 font-bold">Cible Objectif</div>
                <div class="text-sm font-black text-amber-400">${bio.targetCalories} <span class="text-[10px] font-normal">kcal</span></div>
              </div>
            </div>
          </div>

          <!-- R�partition des Macronutriments -->
          <div class="bg-[#151C28] border border-emerald-500/30 rounded-2xl p-4 space-y-3.5 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-extrabold text-white">?? R�partition Quotidienne des Macros</h2>
                <p class="text-[11px] text-slate-400">Calibr� pour ${bio.weightKg} kg (${escapeHtml(bio.goalNutritionLabel)})</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold">
                ?? ${bio.hydrationL} L d'eau/j
              </span>
            </div>

            <!-- Prot�ines -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-rose-300">?? Prot�ines (Construction musculaire � 2.0g/kg)</span>
                <span class="font-black text-white">${bio.proteinTargetG} g <span class="text-[10px] text-slate-400">(${bio.proteinKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-rose-500 h-full rounded-full" style="width: ${bio.proteinPct}%"></div>
              </div>
            </div>

            <!-- Glucides -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-amber-300">?? Glucides (�nergie & Glycog�ne Ki)</span>
                <span class="font-black text-white">${bio.carbsTargetG} g <span class="text-[10px] text-slate-400">(${bio.carbsKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-amber-400 h-full rounded-full" style="width: ${bio.carbsPct}%"></div>
              </div>
            </div>

            <!-- Lipides -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-emerald-300">?? Lipides (Syst�me hormonal � 1.0g/kg)</span>
                <span class="font-black text-white">${bio.fatTargetG} g <span class="text-[10px] text-slate-400">(${bio.fatKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: ${bio.fatPct}%"></div>
              </div>
            </div>

            <!-- Timing p�ri-entra�nement -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                <div class="font-extrabold text-amber-300 mb-0.5">? Pr�-S�ance (-1h30)</div>
                <div class="text-slate-300">~${Math.round(bio.carbsTargetG * 0.25)}g glucides digestes + ~${Math.round(bio.proteinTargetG * 0.2)}g prot�ines.</div>
              </div>
              <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                <div class="font-extrabold text-emerald-300 mb-0.5">?? Post-S�ance (+1h)</div>
                <div class="text-slate-300">~${Math.round(bio.proteinTargetG * 0.3)}g prot�ines + ~${Math.round(bio.carbsTargetG * 0.35)}g glucides.</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (ui.progressSubTab === 'charts') {
      const timeline = ns.Storage.getExerciseTimeline(ui.selectedChartExerciseId);
      const selectedEx = ns.Storage.getExerciseById(ui.selectedChartExerciseId);

      let latestStat = '�';
      let deltaStat = '�';
      if (timeline.length > 0) {
        const first = timeline[0];
        const last = timeline[timeline.length - 1];
        const unit = 'kg';
        latestStat = `${last[ui.selectedChartMetric]} ${unit}`;
        if (timeline.length > 1) {
          const diff = Math.round((last[ui.selectedChartMetric] - first[ui.selectedChartMetric]) * 10) / 10;
          deltaStat = `${diff >= 0 ? '+' : ''}${diff} ${unit}`;
        } else {
          deltaStat = '1 s�ance';
        }
      }

      return `
        <div class="space-y-4 pb-6 animate-slide-up">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-extrabold text-white">Progression & Analyse</h1>
              <p class="text-xs text-slate-400">Suivez l��volution de vos charges et volumes</p>
            </div>
            <button
            onclick="IronPulse.App.navigate('history')"
            class="px-2 py-1 rounded-lg text-xs font-bold transition ${
              ui.currentTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/70'
            }"
            title="Historique des séances"
          >
            📅
          </button>
          </div>

          ${subTabBar}

          <!-- Carte Graphique par Exercice -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-bold text-slate-300">Exercice analys� :</label>
              <select onchange="IronPulse.App.setChartExercise(this.value)" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none max-w-[210px]">
                ${state.exercises
                  .map((ex) => `<option value="${ex.id}" ${ex.id === ui.selectedChartExerciseId ? 'selected' : ''}>${escapeHtml(ex.name)}</option>`)
                  .join('')}
              </select>
            </div>

            <!-- Choix de la m�trique -->
            <div class="grid grid-cols-3 gap-1.5">
              <button onclick="IronPulse.App.setChartMetric('best1RM')" class="py-1.5 rounded-lg text-[11px] font-bold transition ${
                ui.selectedChartMetric === 'best1RM'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }">
                1RM Estim� (kg)
              </button>
              <button onclick="IronPulse.App.setChartMetric('maxWeight')" class="py-1.5 rounded-lg text-[11px] font-bold transition ${
                ui.selectedChartMetric === 'maxWeight'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }">
                Charge Max (kg)
              </button>
              <button onclick="IronPulse.App.setChartMetric('volume')" class="py-1.5 rounded-lg text-[11px] font-bold transition ${
                ui.selectedChartMetric === 'volume'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }">
                Tonnage (kg)
              </button>
            </div>

            <!-- R�sum� Chiffr� (Epley + Brzycki + Meilleure S�rie) -->
            <div class="grid grid-cols-4 gap-1.5 bg-slate-900/70 rounded-xl p-2.5 border border-slate-800/80 text-center">
              <div>
                <div class="text-[9px] text-slate-400">1RM Epley</div>
                <div class="text-xs font-extrabold text-white">${timeline.length ? `${timeline[timeline.length - 1].best1RM} kg` : '�'}</div>
              </div>
              <div>
                <div class="text-[9px] text-amber-300">1RM Brzycki</div>
                <div class="text-xs font-extrabold text-amber-300">${timeline.length ? `${timeline[timeline.length - 1].best1RMBrzycki || timeline[timeline.length - 1].best1RM} kg` : '�'}</div>
              </div>
              <div>
                <div class="text-[9px] text-slate-400">�volution</div>
                <div class="text-xs font-extrabold text-emerald-400">${deltaStat}</div>
              </div>
              <div>
                <div class="text-[9px] text-slate-400">Meilleure</div>
                <div class="text-[11px] font-bold text-slate-200 truncate">${timeline.length ? timeline[timeline.length - 1].bestSetStr : '�'}</div>
              </div>
            </div>

            <!-- Courbe SVG -->
            ${ns.Charts.renderExerciseChart(timeline, ui.selectedChartMetric)}
          </div>

          <!-- Graphique Tonnage des derni�res s�ances -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white">Tonnage par s�ance (7 derni�res)</h3>
              <span class="text-[11px] text-slate-400">Volume total d�plac�</span>
            </div>
            ${ns.Charts.renderWorkoutVolumeBars(state.history)}
          </div>

          <!-- R�partition par Groupe Musculaire -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div>
              <h3 class="text-sm font-bold text-white">�quilibre des groupes musculaires</h3>
              <p class="text-[11px] text-slate-400">Nombre de s�ries effectives enregistr�es</p>
            </div>
            <div>
              ${ns.Charts.renderMuscleBalanceBars(analysis.muscleBalance)}
            </div>
          </div>
        </div>
      `;
    }

    // Sous-onglet Coach IA
    const highlightsHtml =
      analysis.highlights.length === 0
        ? `<div class="text-xs text-slate-400">Continuez � enregistrer vos s�ances pour d�gager des tendances de progression.</div>`
        : analysis.highlights
            .map(
              (h) => `
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-bold text-white">${escapeHtml(h.exerciseName)}</div>
              <div class="text-[11px] text-slate-300 mt-0.5">${escapeHtml(h.comment)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Derni�re perf : ${escapeHtml(h.latestPerf)}</div>
            </div>
            <div class="text-right shrink-0">
              <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold">${escapeHtml(h.pct)}</span>
              <div class="text-[10px] text-emerald-400 font-semibold mt-1">${escapeHtml(h.metric)}</div>
            </div>
          </div>
        `
            )
            .join('');

    const adjustmentsHtml = analysis.adjustments
      .map((a) => {
        const badgeColors =
          a.type === 'caution' || a.type === 'recovery'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : a.type === 'balance'
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
        return `
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${badgeColors}">${escapeHtml(a.badge)}</span>
            </div>
            <div class="text-xs font-bold text-white pt-0.5">${escapeHtml(a.title)}</div>
            <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(a.detail)}</p>
          </div>
        `;
      })
      .join('');

    const chatLogs = state.aiConversationHistory || [];

    return `
      <div class="space-y-4 pb-6 animate-slide-up">
        <div>
          <h1 class="text-lg font-extrabold text-white">Accompagnement Coach IA</h1>
          <p class="text-xs text-slate-400">Analyse des progr�s & ajustements prudents personnalis�s</p>
        </div>

        ${subTabBar}

        <!-- Bandeau Prudence M�dicale Obligatoire -->
        <div class="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 flex items-start gap-2.5">
          <span class="text-amber-400 text-base shrink-0 mt-0.5">??</span>
          <div class="text-[11px] text-amber-100/90 leading-relaxed">
            <strong class="text-amber-300 font-bold">Prudence & Sant� :</strong> ${escapeHtml(ns.AICoach.MEDICAL_DISCLAIMER)}
          </div>
        </div>

        <!-- Synth�se des Progr�s D�tect�s -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-extrabold text-white">?? Progr�s mis en �vidence</h3>
            <span class="text-[11px] text-emerald-400 font-semibold">RPE moyen : ${analysis.avgGlobalRpe}/10</span>
          </div>
          <div class="space-y-2">
            ${highlightsHtml}
          </div>
        </div>

        <!-- Ajustements Prudents Propos�s -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div>
            <h3 class="text-sm font-extrabold text-white">?? Ajustements adapt�s � votre profil</h3>
            <p class="text-[11px] text-slate-400">Bas�s sur votre objectif, votre niveau et la gestion de la fatigue</p>
          </div>
          <div class="space-y-2">
            ${adjustmentsHtml}
          </div>
        </div>

        <!-- Consultation interactive du Coach IA (Moteur Local + Google Gemini 3.8 Flash) -->
        <div class="bg-gradient-to-b from-indigo-950/40 to-[#151C28] border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">?? Interroger le Coach IA</h3>
              <p class="text-[11px] text-slate-400">
                ${
                  state.profile.geminiApiKey
                    ? 'Connect� � Google AI Studio (' + (state.profile.geminiModel || 'gemini-2.5-flash') + ')'
                    : 'Moteur biom�canique local actif (Cl� Google AI Studio configurable dans Profil)'
                }
              </p>
            </div>
          </div>

          <!-- Questions rapides -->
          <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button onclick="IronPulse.App.askAI('Analyse mes derni�res s�ances et propose un plan pour ma prochaine semaine.')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              ?? Bilan de ma semaine
            </button>
            <button onclick="IronPulse.App.askAI('Je stagne au d�velopp� militaire, quel ajustement prudent conseilles-tu ?')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              ??? D�bloquer un plateau
            </button>
            <button onclick="IronPulse.App.askAI('Je ressens une l�g�re fatigue aux �paules, comment adapter ma s�ance avec prudence ?')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              ??? Fatigue aux �paules
            </button>
          </div>

          <!-- Formulaire question libre -->
          <div class="flex gap-2">
            <input
              id="ai-question-input"
              type="text"
              value="${escapeHtml(ui.aiCustomQuestion)}"
              oninput="IronPulse.App.setAICustomQuestion(this.value)"
              placeholder="Posez une question sur votre entra�nement ou r�cup�ration..."
              class="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
            />
            <button
              onclick="IronPulse.App.submitAIQuestion()"
              ${ui.aiLoading ? 'disabled' : ''}
              class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs shrink-0 transition"
            >
              ${ui.aiLoading ? '...' : 'Analyser'}
            </button>
          </div>

          <!-- R�ponses du Coach -->
          <div class="space-y-2.5 pt-1">
            ${
              ui.aiLoading
                ? `
                <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <div class="skeleton-box h-3 w-32"></div>
                    <div class="skeleton-box h-3 w-20"></div>
                  </div>
                  <div class="space-y-1.5 pt-1">
                    <div class="skeleton-box h-3.5 w-full"></div>
                    <div class="skeleton-box h-3.5 w-5/6"></div>
                    <div class="skeleton-box h-3.5 w-3/4"></div>
                  </div>
                </div>
              `
                : ''
            }
            ${
              chatLogs.length === 0 && !ui.aiLoading
                ? `<div class="text-[11px] text-slate-400 text-center py-2">Touchez un bouton rapide ci-dessus pour g�n�rer un bilan d�taill�.</div>`
                : chatLogs
                    .slice(0, 3)
                    .map(
                      (entry) => `
                  <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div class="flex items-center justify-between text-[10px] text-indigo-300 font-semibold">
                      <span>Demande : � ${escapeHtml(entry.question)} �</span>
                      <span>${entry.source && entry.source.startsWith('gemini') ? '? Google AI Studio (' + entry.source + ')' : '?? Analyse Locale'}</span>
                    </div>
                    ${entry.errorNote ? `<div class="text-[10px] text-amber-400">${escapeHtml(entry.errorNote)}</div>` : ''}
                    <div class="pt-1 border-t border-slate-800/80">
                      ${renderSimpleMarkdown(entry.answer)}
                    </div>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 7 : PROFIL & PARAM�TRES
  // ============================================================================
  function computeBiometricSummary(profile) {
    const age = Number(profile.age) || 25;
    const heightCm = Number(profile.heightCm) || 182;
    const weightKg = Number(profile.bodyWeightKg) || 78.5;
    const freq = Number(profile.weeklyTarget) || 4;
    const gender = profile.gender === 'female' ? 'female' : 'male';
    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? +(weightKg / (heightM * heightM)).toFixed(1) : 22.5;
    let bmiLabel = 'Athl�tique / Normal';
    let bmiColor = 'text-emerald-400';
    if (bmi < 18.5) {
      bmiLabel = 'Gabarit L�ger (Surplus conseill�)';
      bmiColor = 'text-sky-400';
    } else if (bmi >= 25 && bmi < 30) {
      bmiLabel = 'Gabarit Puissant / Massif';
      bmiColor = 'text-amber-400';
    } else if (bmi >= 30) {
      bmiLabel = 'Gabarit Titan (Priorit� Recomposition)';
      bmiColor = 'text-rose-400';
    }
    // Mifflin-St Jeor (Homme: +5 | Femme: -161) + multiplicateur selon fr�quence
    const genderOffset = gender === 'female' ? -161 : 5;
    const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset);
    const activityMult = freq <= 2 ? 1.375 : freq <= 4 ? 1.55 : 1.725;
    const tdee = Math.round(bmr * activityMult);

    const goal = (profile.goal || 'hypertrophy').toLowerCase();
    let calorieDelta = 280;
    let goalNutritionLabel = 'Surplus Hypertrophie (+280 kcal)';
    if (goal === 'fatloss') {
      calorieDelta = -400;
      goalNutritionLabel = 'D�ficit S�che (-400 kcal)';
    } else if (goal === 'strength') {
      calorieDelta = 200;
      goalNutritionLabel = 'Surplus Force (+200 kcal)';
    } else if (goal === 'fitness') {
      calorieDelta = 0;
      goalNutritionLabel = 'Maintien & Recomposition';
    }

    const targetCalories = Math.max(1400, tdee + calorieDelta);
    const proteinTargetG = Math.round(weightKg * 2.0);
    const fatTargetG = Math.round(weightKg * 1.0);
    const proteinKcal = proteinTargetG * 4;
    const fatKcal = fatTargetG * 9;
    const carbsKcal = Math.max(400, targetCalories - proteinKcal - fatKcal);
    const carbsTargetG = Math.round(carbsKcal / 4);
    const totalMacroKcal = proteinKcal + fatKcal + carbsKcal;
    const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
    const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);
    const fatPct = Math.max(10, 100 - proteinPct - carbsPct);
    const hydrationL = +(weightKg * 0.04).toFixed(1);

    return {
      age,
      heightCm,
      weightKg,
      freq,
      gender,
      bmi,
      bmiLabel,
      bmiColor,
      bmr,
      tdee,
      targetCalories,
      goalNutritionLabel,
      proteinTargetG,
      carbsTargetG,
      fatTargetG,
      proteinKcal,
      carbsKcal,
      fatKcal,
      proteinPct,
      carbsPct,
      fatPct,
      hydrationL
    };
  }

  function recommendProgramForProfile(profile) {
    const level = (profile.level || 'intermediate').toLowerCase();
    const goal = (profile.goal || 'hypertrophy').toLowerCase();
    const freq = Number(profile.weeklyTarget) || 4;

    if (goal === 'fatloss' || goal.includes('perte')) return 'prog-metabolic-fatloss';
    if (goal === 'strength' || goal.includes('force')) return 'prog-upper-lower-strength';
    if (level === 'beginner' || level.includes('d�butant') || goal === 'fitness' || freq <= 3) {
      return 'prog-fullbody-beginner';
    }
    return 'prog-ppl-hypertrophy';
  }

  function renderProfileScreen() {
    const state = ns.Storage.getState();
    const { profile } = state;
    const bio = computeBiometricSummary(profile);

    return `
      <div class="space-y-4 pb-6 animate-slide-up">
        <div class="flex items-center justify-between gap-2">
          <div>
            <h1 class="text-lg font-extrabold text-white">Profil & Calibration Tactique</h1>
            <p class="text-xs text-slate-400">Biom�trie (�ge, taille, poids), objectifs, Coach IA et Tutoriel</p>
          </div>
          <button
            onclick="IronPulse.App.openOnboardingWizard(1)"
            class="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-black text-amber-300 transition shrink-0"
          >
            ?? Assistant & Tuto
          </button>
        </div>

        <!-- Carte Tactique Biom�trique (IMC + Kcal + Prot�ines) -->
        <div class="shonen-card rounded-2xl p-3.5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-[#151C28] to-[#0B0F17]">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">?? Bilan Biom�trique Tactique</span>
            <span class="text-[10px] font-bold ${bio.bmiColor}">${bio.bmiLabel}</span>
          </div>
          <div class="grid grid-cols-4 gap-2 text-center">
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] text-slate-400 uppercase font-bold">IMC</div>
              <div class="text-sm font-black text-white">${bio.bmi}</div>
            </div>
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] text-slate-400 uppercase font-bold">Maintien</div>
              <div class="text-sm font-black text-amber-300">${bio.tdee} <span class="text-[9px] font-normal">kcal</span></div>
            </div>
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] text-slate-400 uppercase font-bold">Prot�ines</div>
              <div class="text-sm font-black text-emerald-300">${bio.proteinTargetG} <span class="text-[9px] font-normal">g/j</span></div>
            </div>
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] text-slate-400 uppercase font-bold">Gabarit</div>
              <div class="text-xs font-black text-indigo-300">${bio.heightCm}cm � ${bio.age}a</div>
            </div>
          </div>
        </div>

        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Pr�nom / Pseudo de Chasseur</label>
            <input
              type="text"
              value="${escapeHtml(profile.name)}"
              onchange="IronPulse.App.updateProfileField('name', this.value)"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">�ge (ans)</label>
              <input
                type="number"
                min="14"
                max="90"
                value="${profile.age || 26}"
                onchange="IronPulse.App.updateProfileField('age', Number(this.value))"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Taille (cm)</label>
              <input
                type="number"
                min="130"
                max="230"
                value="${profile.heightCm || 178}"
                onchange="IronPulse.App.updateProfileField('heightCm', Number(this.value))"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Poids (kg)</label>
              <input
                type="number"
                step="0.5"
                value="${profile.bodyWeightKg}"
                onchange="IronPulse.App.updateProfileField('bodyWeightKg', Number(this.value))"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Niveau de pratique</label>
              <select
                onchange="IronPulse.App.updateProfileField('level', this.value)"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                ${ns.Data.LEVELS.map((l) => `<option value="${l.id}" ${profile.level === l.id ? 'selected' : ''}>${escapeHtml(l.label)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Objectif principal</label>
              <select
                onchange="IronPulse.App.updateProfileField('goal', this.value)"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                ${ns.Data.GOALS.map((g) => `<option value="${g.id}" ${profile.goal === g.id ? 'selected' : ''}>${escapeHtml(g.label)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">S�ances cibles / sem.</label>
              <input
                type="number"
                min="1"
                max="7"
                value="${profile.weeklyTarget}"
                onchange="IronPulse.App.updateProfileField('weeklyTarget', Number(this.value))"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Repos par d�faut (s)</label>
              <input
                type="number"
                step="15"
                value="${profile.defaultRestSeconds}"
                onchange="IronPulse.App.updateProfileField('defaultRestSeconds', Number(this.value))"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <div class="text-xs font-bold text-white">Signal sonore de fin de repos & Bips Tactiques</div>
              <div class="text-[11px] text-slate-400">Effets audio Web Audio (bip de repos & surcharge d'aura)</div>
            </div>
            <input
              type="checkbox"
              ${profile.soundEnabled ? 'checked' : ''}
              onchange="IronPulse.App.updateProfileField('soundEnabled', this.checked)"
              class="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
        </div>

        <!-- Tutoriel Interactif & Visite Guid�e -->
        <div class="bg-[#151C28] border border-amber-500/30 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-amber-300">?? Tutoriel & Premi�re Utilisation</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Interactif</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Relancez � tout moment le questionnaire de personnalisation initiale, le tutoriel illustr� des fonctionnalit�s ou la visite guid�e pas-�-pas.
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              onclick="IronPulse.App.openOnboardingWizard(1)"
              class="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-extrabold text-amber-300 transition"
            >
              ?? Questionnaire & Tuto
            </button>
            <button
              onclick="IronPulse.App.startGuidedTour()"
              class="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-extrabold text-emerald-300 transition"
            >
              ?? Visite Guid�e des Onglets
            </button>
          </div>
        </div>

        <!-- Configuration Optionnelle Cl� API Google AI Studio / Gemini -->
        <div class="bg-[#151C28] border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">?</span>
              <span class="text-xs font-black uppercase tracking-wider text-white">Google AI Studio � Moteur Gemini</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
              ${profile.geminiModel || 'gemini-2.5-flash'}
            </span>
          </div>

          <p class="text-[11px] text-slate-300 leading-relaxed">
            Le Coach IA fonctionne imm�diatement hors-ligne gr�ce � son moteur biom�canique local. Pour d�bloquer la synth�se conversationnelle compl�te de Google DeepMind, configurez votre cl� API gratuite Google AI Studio.
          </p>

          <!-- S�lecteur de Mod�le -->
          <div class="space-y-1">
            <label class="block text-[10px] font-black uppercase text-slate-400">Mod�le Gemini</label>
            <select
              onchange="IronPulse.App.updateProfileField('geminiModel', this.value)"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="gemini-2.5-flash" ${(profile.geminiModel || 'gemini-2.5-flash') === 'gemini-2.5-flash' ? 'selected' : ''}>
                Gemini 2.5 Flash (Recommand� � Ultra-rapide & �quilibr�)
              </option>
              <option value="gemini-2.0-flash" ${profile.geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>
                Gemini 2.0 Flash (Raisonnement avanc�)
              </option>
              <option value="gemini-1.5-flash" ${profile.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>
                Gemini 1.5 Flash (Standard stable)
              </option>
            </select>
          </div>

          <!-- Saisie Cl� API avec bouton Masquer/Afficher -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-[10px] font-black uppercase text-slate-400">Cl� API Google AI Studio</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold underline flex items-center gap-1"
              >
                <span>?? Obtenir une cl� gratuite</span>
                <span>?</span>
              </a>
            </div>
            <div class="relative">
              <input
                type="${ui.showApiKey ? 'text' : 'password'}"
                placeholder="AIzaSy..."
                value="${escapeHtml(profile.geminiApiKey || '')}"
                oninput="IronPulse.App.updateProfileField('geminiApiKey', this.value)"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onclick="IronPulse.App.toggleShowApiKey()"
                class="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                title="${ui.showApiKey ? 'Masquer la cl�' : 'Afficher la cl�'}"
              >
                ${ui.showApiKey ? '??' : '???'}
              </button>
            </div>
            <p class="text-[9px] text-slate-500">
              ?? S�curit� locale : votre cl� est conserv�e uniquement dans votre navigateur (localStorage) et n'est jamais transmise � des tiers.
            </p>
          </div>

          <!-- Bouton de test et statut -->
          <div class="pt-1">
            <button
              type="button"
              onclick="IronPulse.App.testGeminiApiKey()"
              ${ui.geminiTesting ? 'disabled' : ''}
              class="w-full py-2.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-200 text-xs font-black transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>${ui.geminiTesting ? '?' : '?'}</span>
              <span>${ui.geminiTesting ? 'Test de connexion en cours...' : 'Tester la connexion Google AI Studio'}</span>
            </button>
            ${
              ui.geminiTestResult
                ? `
              <div class="mt-2 p-2.5 rounded-xl border text-xs font-semibold ${
                ui.geminiTestResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }">
                ${ui.geminiTestResult.success ? '?' : '??'} ${escapeHtml(ui.geminiTestResult.message)}
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Gestion des donn�es & Pr�r�glage AURA FIT (Mehdi) -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Donn�es, Export Antigravity & Profil Mehdi</h3>
            <span class="text-[10px] font-bold text-amber-300">AURA FIT � IRONPULSE Z</span>
          </div>
          <button
            onclick="IronPulse.App.loadMehdiProfile()"
            class="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-extrabold text-amber-300 transition flex items-center justify-center gap-2"
          >
            ? Charger le Profil Mehdi (AURA FIT � Rang B � 25 ans � 182 cm � 78.5 kg)
          </button>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="IronPulse.App.exportDataJson()" class="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition">
              ? Export JSON
            </button>
            <button onclick="IronPulse.App.exportAntigravityMarkdown()" class="py-2.5 px-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 transition">
              ?? Export MD
            </button>
            <button onclick="IronPulse.App.resetDemoData()" class="py-2.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition">
              ? Reset Visite
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button onclick="IronPulse.App.exportIronPulseBackup()" class="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-black text-emerald-300 transition flex items-center justify-center gap-1.5">
              <span>??</span> <span>Sauvegarde .ironpulse</span>
            </button>
            <label class="py-2.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-black text-cyan-300 transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>??</span> <span>Restaurer .ironpulse</span>
              <input type="file" accept=".ironpulse,.json" onchange="IronPulse.App.importIronPulseFile(event)" class="hidden" />
            </label>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU �CRAN 8 : H�ROS RPG (UNIVERS SHONEN AURA PULSE & GUILDE)
  // ============================================================================
  function renderRPGScreen() {
    if (!ns.RPG) return '<div class="text-xs text-slate-400">Chargement du Syst�me RPG...</div>';
    const hero = ns.RPG.getHeroProfile();

    const subTabs = [
      { id: 'hero', label: '?? Statut' },
      { id: 'talents', label: '? Talents' },
      { id: 'customize', label: '?? Studio' },
      { id: 'quests', label: '?? Donjons' },
      { id: 'relics', label: '?? Reliques' },
      { id: 'guild', label: '??? Guilde' }
    ];

    const subTabBar = `
      <div class="grid grid-cols-6 gap-1 bg-[#151C28] p-1 rounded-xl border border-slate-800">
        ${subTabs
          .map(
            (t) => `
          <button onclick="IronPulse.App.setRpgSubTab('${t.id}')" class="py-2 rounded-lg text-[9px] font-extrabold transition ${
            ui.rpgSubTab === t.id ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
          }">
            ${t.label}
          </button>
        `
          )
          .join('')}
      </div>
    `;

    // En-t�te commun du Chasseur (Fen�tre Syst�me)
    const heroHeader = `
      <div class="shonen-arena-card relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-[#151C28] to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div class="shonen-arena-bg" style="background-image: url('${hero.arenaBgUrl}');"></div>
        <div class="relative z-10 flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${ns.RPG.resolveAssetUrl(hero.classObj.artFile)}" alt="${escapeHtml(hero.classObj.name)}" class="w-12 h-12 rounded-2xl object-cover object-top border-2 border-amber-400/60 shrink-0 shadow-md" />
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded border text-[10px] font-black ${hero.rankObj.badgeBg}">RANG ${hero.rankObj.rank}</span>
                <span class="text-[11px] font-bold text-amber-300">� ${escapeHtml(hero.appearance?.battleTitle || hero.appearance?.customTitle || hero.rankObj.title)} �</span>
              </div>
              <h1 class="text-lg font-extrabold text-white truncate mt-0.5">${escapeHtml(hero.heroName)}</h1>
              <div class="text-xs text-emerald-400 font-semibold">${hero.classObj.icon} ${escapeHtml(hero.classObj.name)}</div>
            </div>
          </div>
          <div class="text-right shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <div class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Niveau</div>
            <div class="text-xl font-black text-emerald-400 leading-none mt-0.5">${hero.level}</div>
          </div>
        </div>

        <!-- Barre d'XP du Niveau Actuel -->
        <div class="relative z-10 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-300 font-semibold">Exp�rience d'�veil (Total : ${hero.totalXp} XP)</span>
            <span class="text-emerald-400 font-bold">${hero.xpInCurrentLevel} / ${hero.xpForNextLevel} XP (${hero.levelProgressPct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: ${hero.levelProgressPct}%"></div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 flex-wrap gap-1">
            <span>? CP : <strong class="text-white">${hero.combatPower}</strong></span>
            <span>?? HP : <strong class="text-rose-400">${hero.hpMax}</strong></span>
            <span>?? MP : <strong class="text-cyan-300">${hero.mpMax}</strong></span>
            <span>?? Or : <strong class="text-amber-300">${hero.gold}</strong></span>
            <span>?? S�rie : <strong class="text-orange-400">${hero.streakDays}j</strong></span>
          </div>
        </div>
      </div>
    `;

    // SOUS-ONGLET TALENTS SHONEN (ARBRE DE COMP�TENCES : TITAN, MOINE, OMBRE) - Densetsu Sc�nariste
    if (ui.rpgSubTab === 'talents') {
      const state = ns.Storage.getState();
      const tpAvailable = ns.RPG.getTalentPointsAvailable(state);
      const mults = ns.RPG.computeTalentMultipliers(state);
      const allocated = (state.rpg && state.rpg.talents && state.rpg.talents.allocated) || {};

      const talentPaths = [
        { key: 'PULL', def: ns.RPG.TALENT_PATHS.PULL },
        { key: 'PUSH', def: ns.RPG.TALENT_PATHS.PUSH },
        { key: 'CORE', def: ns.RPG.TALENT_PATHS.CORE }
      ];

      const pathsHtml = talentPaths
        .map(({ def }) => {
          const nodes = ns.RPG.TALENT_NODES.filter((n) => n.path === def.id);
          const nodesHtml = nodes
            .map((node) => {
              const currentRank = allocated[node.id] || 0;
              const isMax = currentRank >= node.maxRank;
              const isLocked = node.requires && !(allocated[node.requires] >= 1);
              const canUnlock = !isMax && !isLocked && tpAvailable >= node.costPerRank;

              return `
                <div class="bg-slate-900/90 border ${
                  isMax ? 'border-amber-500/50' : currentRank > 0 ? 'border-emerald-500/40' : 'border-slate-800'
                } rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">${node.icon}</span>
                      <div>
                        <div class="text-xs font-black text-white">${escapeHtml(node.name)}</div>
                        <div class="text-[10px] text-amber-300 font-semibold">Rang ${currentRank} / ${node.maxRank} (Palier ${node.tier})</div>
                      </div>
                    </div>
                    ${
                      isMax
                        ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">? Max</span>`
                        : isLocked
                        ? `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] font-bold">?? Pr�requis</span>`
                        : `<button onclick="IronPulse.App.unlockTalent('${node.id}')" ${canUnlock ? '' : 'disabled'} class="px-2.5 py-1 rounded-lg ${
                            canUnlock ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-500'
                          } text-[10px] transition active:scale-95">
                            ? �veiller (${node.costPerRank} TP)
                          </button>`
                    }
                  </div>
                  <p class="text-[11px] text-slate-300 leading-snug">${escapeHtml(node.description)}</p>
                </div>
              `;
            })
            .join('');

          return `
            <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-black text-white flex items-center gap-1.5">${def.icon} ${escapeHtml(def.name)}</h3>
                  <p class="text-[10px] text-slate-400 font-medium">${escapeHtml(def.subtitle)}</p>
                </div>
                <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-bold text-slate-300">${escapeHtml(def.theme)}</span>
              </div>
              <div class="space-y-2">
                ${nodesHtml}
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          ${heroHeader}
          ${subTabBar}

          <!-- Banni�re Points de Talents -->
          <div class="bg-gradient-to-r from-amber-950/40 via-[#151C28] to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-lg">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300">Points d��veil Shonen</span>
              <div class="text-xl font-black text-white flex items-center gap-2">
                <span>? ${tpAvailable} TP Disponibles</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">Gagnez 1 TP � chaque passage de niveau pour d�bloquer vos sp�cialisations</p>
            </div>
            <button onclick="IronPulse.App.resetTalents()" class="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-extrabold text-slate-300 transition shrink-0">
              ? R�initialiser
            </button>
          </div>

          <!-- Multiplicateurs Actifs -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2 text-[10px] font-black text-slate-300">
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300">FOR +${mults.statBonus.FOR}%</span>
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300">END +${mults.statBonus.END}%</span>
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300">XP Global +${Math.round(mults.globalXpBonus * 100)}%</span>
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-purple-300">Critiques +${Math.round(mults.critChance * 100)}%</span>
            <span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-rose-300">Boss +${Math.round(mults.bossDamageBonus * 100)}%</span>
          </div>

          <!-- Les 3 Voies de Talents -->
          <div class="space-y-3">
            ${pathsHtml}
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET STUDIO : PERSONNALISATION DU PERSONNAGE (3D / GAUVAX 16-BIT / ART HD) & BOUTIQUE OR
    if (ui.rpgSubTab === 'customize') {
      const app = hero.appearance || {};
      const currentMode = app.visualMode || 'model-3d';
      const activeAuraId = app.auraStyle || app.auraColor || 'gold';
      const sparksOn = app.lightningSparks !== false && app.sparksEnabled !== false;
      const activeTitle = app.battleTitle || app.customTitle || ns.RPG.CUSTOM_TITLES[0];

      const renderWardrobeSlotSection = (slotKey, slotTitle) => {
        const items = (hero.wardrobeStatus || []).filter((w) => w.slot === slotKey);
        return `
          <div class="space-y-1.5">
            <div class="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider">${slotTitle}</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${items
                .map((item) => {
                  return `
                  <div class="p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    item.equipped
                      ? 'bg-emerald-500/15 border-emerald-400 shadow'
                      : item.unlocked
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/80 border-slate-800/80'
                  }">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-base shrink-0">${item.icon}</span>
                      <div class="min-w-0">
                        <div class="text-xs font-extrabold text-white truncate">${escapeHtml(item.name)}</div>
                        <div class="text-[10px] text-slate-400 truncate">Niv. ${item.minLevel} requis � ${item.priceGold === 0 ? 'Gratuit' : `${item.priceGold} ??`}</div>
                      </div>
                    </div>
                    <button
                      onclick="IronPulse.App.buyOrEquipWardrobeItem('${item.id}')"
                      class="px-2.5 py-1.5 rounded-lg text-[10px] font-black shrink-0 transition ${
                        item.equipped
                          ? 'bg-emerald-500 text-slate-950'
                          : item.unlocked
                          ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                          : item.canAfford && item.levelMet
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }"
                    >
                      ${
                        item.equipped
                          ? '? �quip�'
                          : item.unlocked
                          ? '�quiper'
                          : !item.levelMet
                          ? `?? Niv.${item.minLevel}`
                          : `?? ${item.priceGold}`
                      }
                    </button>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        `;
      };

      const genderPills = (ns.RPG.GENDERS || []).map((g) => {
        const active = (app.gender || 'male') === g.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('gender', '${g.id}')" class="p-2.5 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-amber-500/20 border-amber-400 shadow-md text-amber-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="text-base">${g.icon}</span>
              <span class="text-xs font-black truncate">${escapeHtml(g.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const morphologyPills = (ns.RPG.MORPHOLOGIES || []).map((m) => {
        const active = (app.morphology || 'athletic-vtaper') === m.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('morphology', '${m.id}')" class="p-2.5 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-amber-500/20 border-amber-400 shadow-md text-amber-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="text-lg shrink-0">${m.icon}</span>
              <div class="min-w-0">
                <div class="text-[11px] font-black truncate">${escapeHtml(m.label)}</div>
                <div class="text-[9px] text-slate-400 truncate">${escapeHtml(m.desc || '')}</div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      const jawTypePills = (ns.RPG.JAW_TYPES || []).map((j) => {
        const active = (app.jawType || 'v-sharp') === j.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('jawType', '${j.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-amber-500/20 border-amber-400 shadow-md text-amber-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-1.5">
              <span class="text-sm shrink-0">${j.icon}</span>
              <div class="min-w-0">
                <div class="text-[11px] font-extrabold truncate">${escapeHtml(j.label)}</div>
                <div class="text-[9px] text-slate-400 truncate">${escapeHtml(j.desc || '')}</div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      const outfitPills = (ns.RPG.OUTFITS || []).map((o) => {
        const active = (app.outfit || 'techwear-dogi') === o.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('outfit', '${o.id}')" class="p-2.5 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-amber-500/20 border-amber-400 shadow-md text-amber-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="text-lg shrink-0">${o.icon}</span>
              <div class="min-w-0">
                <div class="text-[11px] font-black truncate">${escapeHtml(o.label)}</div>
                <div class="text-[9px] text-slate-400 truncate">${escapeHtml(o.desc || '')}</div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      const activePowerEquips = app.powerEquipments || [];
      const powerEquipmentPills = (ns.RPG.POWER_EQUIPMENTS || []).map((pe) => {
        const active = activePowerEquips.includes(pe.id);
        return `
          <button onclick="IronPulse.App.togglePowerEquipment('${pe.id}')" class="p-2.5 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-emerald-500/20 border-emerald-400 shadow-md text-emerald-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between gap-1">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-lg shrink-0">${pe.icon}</span>
                <div class="min-w-0">
                  <div class="text-[11px] font-black truncate">${escapeHtml(pe.label)}</div>
                  <div class="text-[9px] text-slate-400 truncate">${escapeHtml(pe.desc || '')}</div>
                </div>
              </div>
              <span class="px-1.5 py-0.5 rounded text-[9px] font-black shrink-0 ${active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}">
                ${active ? '�QUIP�' : '+ AJOUTER'}
              </span>
            </div>
          </button>
        `;
      }).join('');

      const skinPills = (ns.RPG.SKIN_TONES || []).map((s) => {
        const active = (app.skinTone || 'golden') === s.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('skinTone', '${s.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-amber-400 shadow-md' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0 border border-black/50" style="background: ${s.hex};"></span>
              <span class="text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'} truncate">${escapeHtml(s.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const hairstylePills = (ns.RPG.HAIRSTYLES || []).map((hs) => {
        const active = (app.hairstyle || 'spiky-striker') === hs.id || (app.hairstyle === 'spiky-dbz' && hs.id === 'spiky-striker');
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('hairstyle', '${hs.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-amber-400 shadow-md text-amber-300' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-1.5">
              <span class="text-sm shrink-0">${hs.icon}</span>
              <span class="text-[11px] font-bold truncate">${escapeHtml(hs.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const eyePills = (ns.RPG.EYE_COLORS || []).map((e) => {
        const active = (app.eyeColor || 'cyan-astral') === e.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('eyeColor', '${e.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-cyan-400 shadow-md' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0 border border-white/50" style="background: ${e.hex}; box-shadow: 0 0 8px ${e.glow};"></span>
              <span class="text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'} truncate">${escapeHtml(e.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const expressionPills = (ns.RPG.FACE_EXPRESSIONS || []).map((ex) => {
        const active = (app.expression || 'determined') === ex.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('expression', '${ex.id}')" class="p-2.5 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-amber-500/20 border-amber-400 shadow-md text-amber-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="text-base shrink-0">${ex.icon}</span>
              <div class="min-w-0">
                <div class="text-[11px] font-extrabold truncate">${escapeHtml(ex.label)}</div>
                <div class="text-[9px] text-slate-400 truncate">${escapeHtml(ex.desc || '')}</div>
              </div>
            </div>
          </button>
        `;
      }).join('');

      const markingPills = (ns.RPG.WAR_MARKINGS || []).map((m) => {
        const active = (app.warMarking || 'eye-scar') === m.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('warMarking', '${m.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-cyan-500/20 border-cyan-400 shadow-md text-cyan-200' : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
          }">
            <div class="flex items-center gap-1.5">
              <span class="text-sm shrink-0">${m.icon}</span>
              <span class="text-[11px] font-extrabold truncate">${escapeHtml(m.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const auraPills = ns.RPG.AURA_STYLES.map((a) => {
        const active = activeAuraId === a.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('auraStyle', '${a.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-amber-400 shadow-md' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0 border border-white/40" style="background: ${a.primary}; box-shadow: 0 0 8px ${a.primary};"></span>
              <span class="text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'} truncate">${escapeHtml(a.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const hairPills = ns.RPG.HAIR_COLORS.map((h) => {
        const active = app.hairColor === h.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('hairColor', '${h.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-emerald-400 shadow-md' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0" style="background: ${h.hex}; border: 2px solid ${h.stroke};"></span>
              <span class="text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'} truncate">${escapeHtml(h.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const armorPills = ns.RPG.ARMOR_TINTS.map((t) => {
        const active = app.armorTint === t.id;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('armorTint', '${t.id}')" class="p-2 rounded-xl border text-left transition active:scale-95 ${
            active ? 'bg-slate-800 border-emerald-400 shadow-md' : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center gap-2">
              <span class="w-4 h-4 rounded-full shrink-0 border border-white/30" style="background: linear-gradient(135deg, ${t.start}, ${t.sash || t.mid});"></span>
              <span class="text-[11px] font-bold ${active ? 'text-white' : 'text-slate-300'} truncate">${escapeHtml(t.label)}</span>
            </div>
          </button>
        `;
      }).join('');

      const titlePills = ns.RPG.CUSTOM_TITLES.map((title) => {
        const active = activeTitle === title;
        return `
          <button onclick="IronPulse.App.updateHeroAppearance('battleTitle', '${escapeHtml(title).replace(/'/g, "\\'")}')" class="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition ${
            active ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }">
            � ${escapeHtml(title)} �
          </button>
        `;
      }).join('');

      const classPortraits = ns.RPG.HERO_CLASSES.map((c) => {
        const active = c.id === hero.classObj.id;
        return `
          <div onclick="IronPulse.App.selectHeroClass('${c.id}')" class="cursor-pointer rounded-xl overflow-hidden border-2 transition active:scale-95 ${
            active ? 'border-amber-400 bg-amber-500/15 shadow-lg' : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
          }">
            <img src="${ns.RPG.resolveAssetUrl(c.artFile)}" alt="${escapeHtml(c.name)}" class="w-full h-32 object-cover object-center" />
            <div class="p-2">
              <div class="text-[11px] font-extrabold text-white truncate">${c.icon} ${escapeHtml(c.name)}</div>
              <div class="text-[9px] text-amber-300 truncate">${escapeHtml(c.title)}</div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          ${heroHeader}
          ${subTabBar}

          <!-- SC�NE D'APER�U EN DIRECT DU STRIKER PLEIN PIED TORSE NU -->
          <div class="shonen-arena-card relative overflow-hidden bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div class="shonen-arena-bg" style="background-image: url('${hero.arenaBgUrl}');"></div>
            <div class="relative z-10 flex items-center justify-between">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-amber-300 font-black">? Studio Striker Cin�tique (Plein Pied & Torse Nu)</span>
                <h2 class="text-sm font-extrabold text-white">Apparence & Aura Cin�tique</h2>
              </div>
              <button
                onclick="IronPulse.App.updateHeroAppearance('lightningSparks', ${!sparksOn})"
                class="px-2.5 py-1 rounded-xl border text-[10px] font-extrabold transition ${
                  sparksOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }"
              >
                ? �clairs d'Aura : ${sparksOn ? 'ACTIFS' : 'OFF'}
              </button>
            </div>

            <div class="relative z-10 flex justify-center py-1">
              <div class="w-full max-w-[235px]">
                ${ns.RPG.renderHeroAvatarSVG(hero)}
              </div>
            </div>
          </div>

          <!-- ARCH�TYPES MANGA RPG & SPORTS DE COMBAT (1-CLIC) -->
          <div class="bg-gradient-to-r from-red-950/60 via-slate-900 to-indigo-950/60 border-2 border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400 text-amber-300 text-[9px] font-black uppercase tracking-wider">? STYLES SPORTS & COMBAT MANGA</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white mt-1">Arch�types Sport & Arts Martiaux (1-Clic)</h3>
                <p class="text-[11px] text-slate-300">Activez en 1 clic l'apparence, l'aura et la morphologie de Baki, Ippo, Dragon Ball Z, ?dition Nocturne ou Persona.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              ${(ns.RPG.MANGA_ARCHETYPES || []).map((arch) => {
                const isActive = app.auraStyle === arch.appearance.auraStyle && app.outfit === arch.appearance.outfit;
                const badgeColor =
                  arch.id === 'baki-hanma'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : arch.id === 'hajime-ippo'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : arch.id === 'dbz-saiyan'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : arch.id === 'solo-leveling'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40';
                return `
                  <div class="p-3 rounded-xl border flex flex-col justify-between gap-2 transition ${
                    isActive
                      ? 'bg-indigo-950/80 border-amber-400 shadow-lg ring-1 ring-amber-400'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }">
                    <div>
                      <div class="flex items-center justify-between gap-1 mb-1">
                        <span class="text-lg">${arch.icon}</span>
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badgeColor}">${arch.badge}</span>
                      </div>
                      <div class="text-xs font-black text-white">${escapeHtml(arch.name)}</div>
                      <div class="text-[10px] text-amber-300 font-bold -mt-0.5">${escapeHtml(arch.subtitle)}</div>
                      <p class="text-[10px] text-slate-400 mt-1 line-clamp-3 leading-tight">${escapeHtml(arch.description)}</p>
                    </div>
                    <button
                      onclick="IronPulse.App.applyMangaArchetype('${arch.id}')"
                      class="w-full py-1.5 rounded-lg text-[10px] font-black transition active:scale-95 flex items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black shadow'
                      }"
                    >
                      ${isActive ? '? Arch�type Actif' : `? Activer ${escapeHtml(arch.name)}`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- BOUTIQUE & DRESSING 16-BIT AURA FIT (TENUES, ACCESSOIRES, D�CORS PAYABLES EN OR ??) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">??? Boutique & Dressing GAUVAX 16-Bit (AURA FIT)</h3>
                <p class="text-[11px] text-slate-400">D�bloquez tenues, accessoires et d�cors avec votre Or gagn� en s�ance</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black shrink-0">
                ?? ${hero.gold} Or
              </span>
            </div>

            ${renderWardrobeSlotSection('outfit', '?? Tenues (Outfit)')}
            ${renderWardrobeSlotSection('accessory', '?? Accessoires Signature')}
            ${renderWardrobeSlotSection('background', '?? D�cors de Salle 16-Bit')}
          </div>

          <!-- IMPORT & CR�ATION AVATAR 3D PROFESSIONNEL (GLTF / READY PLAYER ME) -->
          <div class="bg-gradient-to-r from-indigo-950/80 to-slate-900 border-2 border-indigo-500/60 rounded-2xl p-4 space-y-3 shadow-xl">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-[9px] font-black uppercase tracking-wider">PIPELINE 3D PRO � GLTF</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white mt-1">?? Importateur d'Avatar 3D R�aliste (GLB / Ready Player Me)</h3>
                <p class="text-[11px] text-slate-300">Chargez n'importe quel mod�le 3D polygonal textur� (Ready Player Me, Mixamo, scan 3D) ou collez son lien GLB.</p>
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="flex gap-2">
                <input
                  id="custom-glb-url-input"
                  type="url"
                  placeholder="Ex : https://models.readyplayer.me/64...glb"
                  value="${escapeHtml(app.customModelGlb || '')}"
                  class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-indigo-400 outline-none"
                />
                <button
                  onclick="IronPulse.App.applyCustomGlbModel()"
                  class="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs transition active:scale-95 shadow"
                >
                  ? Charger GLB
                </button>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Cr�ez gratuitement votre avatar r�aliste sur <a href="https://readyplayer.me" target="_blank" rel="noopener noreferrer" class="text-indigo-400 underline font-bold">Ready Player Me</a> puis collez son URL GLB.</span>
                ${app.customModelGlb ? `<button onclick="IronPulse.App.clearCustomGlbModel()" class="text-rose-400 hover:underline font-bold">R�initialiser (Mod�le Standard)</button>` : ''}
              </div>
            </div>
          </div>

          <!-- 1. SEXE & ARCH�TYPE MANGA -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">1. Sexe & Identit� Manga (3D & 2D)</h3>
              <p class="text-[11px] text-slate-400">Striker masculin ou Guerri�re Valkyrie avec tenue ajust�e</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${genderPills}
            </div>
          </div>

          <!-- 2. MORPHOLOGIE DU CORPS (5 PROPOSITIONS SHONEN & COMBAT) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">2. Morphologie & Musculature (V-Taper, Baki, Ippo, Titan, Valkyrie)</h3>
              <p class="text-[11px] text-slate-400">Impacte la carrure, les trap�zes, les striations et le rendu des sprites de combat</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${morphologyPills}
            </div>
          </div>

          <!-- 3. TEINT DE PEAU MANGA -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">3. Teint de Peau Manga</h3>
              <p class="text-[11px] text-slate-400">Modifie les shaders cel-shading 3D et le rendu vectoriel Shonen</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${skinPills}
            </div>
          </div>

          <!-- 4. COIFFURE & STYLE CAPILLAIRE (3 PROPOSITIONS + VARIANTES) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">4. Coupe de Cheveux Shonen (3 Propositions)</h3>
              <p class="text-[11px] text-slate-400">Pointes Striker, Cyber-Undercut, Flot Stellaire, Tresses Valkyrie, Court Tactique...</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${hairstylePills}
            </div>
          </div>

          <!-- 5. COULEUR DES CHEVEUX (TRANSFORMATION) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">5. Couleur des Cheveux (�veil Cin�tique)</h3>
              <p class="text-[11px] text-slate-400">Noir Onyx, Or Cin�tique, Argent Astral, Rouge Intensit?, Cyan Puls�, Am�thyste...</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${hairPills}
            </div>
          </div>

          <!-- 6. FORME DU VISAGE & M�CHOIRE (3 CHOIX) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">6. Forme du Visage & M�choire (3 Choix)</h3>
              <p class="text-[11px] text-slate-400">Structure angulaire manga, ciselage de la m�choire et proportion cr�nienne 3D</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${jawTypePills}
            </div>
          </div>

          <!-- 7. REGARD & COULEUR DES YEUX MANGA -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">7. Regard & Couleur des Yeux (Lueur d'Aura)</h3>
              <p class="text-[11px] text-slate-400">Iris luminescents avec reflets d'�nergie martiale</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${eyePills}
            </div>
            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-cyan-300">Volutes de Fum�e de Mana (Mana Smoke FX)</span>
                <p class="text-[10px] text-slate-400">�manation d'�nergie magique depuis les coins des yeux</p>
              </div>
              <button
                onclick="IronPulse.App.updateHeroAppearance('manaEyeSmoke', ${app.manaEyeSmoke === false})"
                class="px-2.5 py-1 rounded-xl border text-[10px] font-black transition ${
                  app.manaEyeSmoke !== false
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }"
              >
                ${app.manaEyeSmoke !== false ? '? ACTIF' : 'OFF'}
              </button>
            </div>
          </div>

          <!-- 8. EXPRESSION FACIALE SHONEN -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">8. Expression Faciale & Temp�rament</h3>
              <p class="text-[11px] text-slate-400">D�termin�, Regard du Monarque, Rage Berserker 1RM ou Sourire Confiant</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${expressionPills}
            </div>
          </div>

          <!-- 9. MARQUAGES DE GUERRE & CICATRICES -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">9. Marquages de Guerre & Cicatrices</h3>
              <p class="text-[11px] text-slate-400">Cicatrice oculaire biseaut�e, runes astrales, bandes de chasseur d�ombre</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${markingPills}
            </div>
          </div>

          <!-- 10. FLAMME D'AURA & �NERGIE D'�VEIL -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">10. Flamme d'Aura & �nergie d'�veil</h3>
              <p class="text-[11px] text-slate-400">Aura d'Or Solaire, Surcharge �carlate, Pulsation Azur, �ther Astral...</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${auraPills}
            </div>
          </div>

          <!-- 11. TENUE URBAINE & TECHWEAR (3 PROPOSITIONS) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">11. Tenue Urbaine & Fitness Techwear (3 Propositions)</h3>
              <p class="text-[11px] text-slate-400">Dogi de l'Ordre, Stringer Techwear & Cargo � sangles, ou Combinaison Cyber-Pulse</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${outfitPills}
            </div>
          </div>

          <!-- 12. �QUIPEMENTS DE FORCE & POWERLIFTING PRO -->
          <div class="bg-[#151C28] border border-emerald-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-emerald-300">12. �quipements de Force Professionnels</h3>
              <p class="text-[11px] text-slate-400">Ceinture � levier acier, genouill�res 7mm n�opr�ne, prot�ge-poignets et sangles grip</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${powerEquipmentPills}
            </div>
          </div>

          <!-- 13. COULEUR DE BASE & TEINTE D'ARMURE -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">13. Teinte d'Armure & Accents de Tenue</h3>
              <p class="text-[11px] text-slate-400">Couleurs des tissus, passepoils tactiques et ceinture nou�e</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${armorPills}
            </div>
          </div>

          <!-- 14. CLASSE & ARCH�TYPE DE PLEIN PIED -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">14. Arch�type & Illustration de Classe</h3>
              <p class="text-[11px] text-slate-400">Artworks HD pour le mode Portrait & Banni�re de Guilde</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${classPortraits}
            </div>
          </div>

          <!-- 15. TITRE DE COMBAT -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">15. Titre de Striker Cin�tique</h3>
              <p class="text-[11px] text-slate-400">Affich� sur le HUD tactique et dans le classement de Guilde</p>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${titlePills}
            </div>
          </div>

          <!-- 16. SAUVEGARDE & TRANSFERT CLOUD / FICHIER JSON -->
          <div class="bg-gradient-to-r from-emerald-950/40 via-[#151C28] to-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-emerald-300">?? Sauvegarde & Restauration du Chasseur</h3>
                <p class="text-[11px] text-slate-400">Exportez votre profil, vos 1RM et votre progression pour ne jamais rien perdre</p>
              </div>
              <span class="text-xl">???</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                onclick="IronPulse.App.exportBackup()"
                class="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span>??</span> Exporter (.json)
              </button>
              <label class="cursor-pointer py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95">
                <span>??</span> Importer (.json)
                <input type="file" accept=".json" class="hidden" onchange="IronPulse.App.onImportBackupFile(event)" />
              </label>
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 1 : STATUT & CLASSES
    if (ui.rpgSubTab === 'hero') {
      const attrsHtml = hero.attributes
        .map(
          (a) => `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-xs">
            <div>
              <span class="font-extrabold ${a.textColor} mr-1.5">[${a.code}]</span>
              <span class="font-bold text-white">${escapeHtml(a.name)}</span>
              <span class="text-[10px] text-slate-400 block">${escapeHtml(a.desc)}</span>
            </div>
            <span class="text-sm font-black text-white tabular-nums">${a.value} <span class="text-[10px] text-slate-500 font-normal">/ 99</span></span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="${a.color} h-full rounded-full transition-all duration-300" style="width: ${a.value}%"></div>
          </div>
        </div>
      `
        )
        .join('');

      const classesHtml = ns.RPG.HERO_CLASSES.map((c) => {
        const selected = c.id === hero.classObj.id;
        return `
          <div onclick="IronPulse.App.selectHeroClass('${c.id}')" class="cursor-pointer bg-slate-900/90 border ${
            selected ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
          } rounded-xl p-3 transition flex items-center gap-3">
            <img src="${ns.RPG.resolveAssetUrl(c.artFile)}" alt="${escapeHtml(c.name)}" class="w-16 h-16 rounded-xl object-cover object-top border border-slate-700 shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <div>
                  <div class="text-xs font-extrabold text-white">${c.icon} ${escapeHtml(c.name)}</div>
                  <div class="text-[10px] text-amber-300">${escapeHtml(c.title)}</div>
                </div>
                ${
                  selected
                    ? `<span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold shrink-0">�quip�e</span>`
                    : `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold shrink-0">Choisir</span>`
                }
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(c.desc)}</p>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          ${heroHeader}
          ${subTabBar}

          <!-- Aper�u Visuel de l'Avatar & �quipements actifs -->
          <div class="bg-[#151C28] border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
            <div class="w-36 shrink-0">
              ${ns.RPG.renderHeroAvatarSVG(hero, { compact: true })}
            </div>
            <div class="flex-1 space-y-2">
              <div class="text-xs font-extrabold text-white">Direction Artistique Shonen & �veil</div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Personnalisez l'illustration HD, la couleur d'Aura Ki, les �clairs et l'armure de votre <strong class="text-emerald-400">${escapeHtml(hero.classObj.name)}</strong>.
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button onclick="IronPulse.App.setRpgSubTab('customize')" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition">
                  ?? Studio Apparence
                </button>
                <button onclick="IronPulse.App.setRpgSubTab('relics')" class="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold transition">
                  ?? Reliques (${hero.relicsStatus.filter((r) => r.equipped).length})
                </button>
              </div>
            </div>
          </div>

          <!-- Attributs Biom�caniques du Chasseur -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-extrabold text-white">?? Attributs d'�veil (Li�s aux muscles)</h2>
                <p class="text-[11px] text-slate-400">Augmentent automatiquement selon vos s�ries et records 1RM</p>
              </div>
            </div>
            <div class="space-y-3 pt-1">
              ${attrsHtml}
            </div>
          </div>

          <!-- Choix de la Classe Shonen / Fantasy -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">?? Classe de Chasseur (Sp�cialisation)</h2>
              <p class="text-[11px] text-slate-400">Changez de classe � tout moment selon votre cycle d'entra�nement</p>
            </div>
            <div class="space-y-2">
              ${classesHtml}
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 2 : QU�TES DU SYST�ME & BOSS DE DONJON
    if (ui.rpgSubTab === 'quests') {
      const questsHtml = hero.weeklyQuests
        .map((q) => {
          const pct = Math.min(100, Math.round((q.current / q.target) * 100));
          return `
            <div class="bg-slate-900/90 border ${q.completed ? 'border-emerald-500/40' : 'border-slate-800'} rounded-xl p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="text-xs font-extrabold text-white">${escapeHtml(q.title)}</div>
                  <div class="text-[11px] text-slate-400">${escapeHtml(q.desc)}</div>
                </div>
                <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold shrink-0">
                  +${q.rewardXp} XP
                </span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-emerald-500 h-full rounded-full" style="width: ${pct}%"></div>
              </div>
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-300 font-semibold">${q.current} / ${q.target} ${escapeHtml(q.unit)}</span>
                <span class="${q.completed ? 'text-emerald-400 font-bold' : 'text-amber-300'}">${q.completed ? '? Accomplie' : 'En cours'}</span>
              </div>
            </div>
          `;
        })
        .join('');

      const bossesHtml = hero.bossesStatus
        .map(
          (b) => `
        <div class="rpg-card-interactive bg-slate-900/90 border ${b.defeated ? 'border-emerald-500/50 bg-emerald-950/60' : 'border-slate-800'} rounded-2xl overflow-hidden shadow-lg">
          <div class="relative h-32 w-full overflow-hidden">
            <img src="${b.artUrl}" alt="${escapeHtml(b.name)}" class="w-full h-full object-cover object-top" />
            <div class="shonen-boss-overlay"></div>
            <div class="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
              <span class="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/50 text-rose-200 text-[10px] font-black uppercase backdrop-blur-sm">
                ${escapeHtml(b.rank)}
              </span>
              <span class="px-2 py-0.5 rounded ${
                b.defeated ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500/20 text-amber-200 border border-amber-500/50 backdrop-blur-sm'
              } text-[10px] font-extrabold">
                ${b.defeated ? '? BOSS VAINCU' : `R�compense : +${b.rewardXp} XP`}
              </span>
            </div>
            <div class="absolute bottom-2 left-3 right-3">
              <div class="text-sm font-black text-white">${b.icon} ${escapeHtml(b.name)}</div>
              <div class="text-[11px] font-semibold text-amber-300">${escapeHtml(b.exerciseLabel)}</div>
            </div>
          </div>
          <div class="p-3 space-y-2">
            <p class="text-[11px] text-slate-300 leading-relaxed">${escapeHtml(b.lore)}</p>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="${b.defeated ? 'bg-emerald-400' : 'bg-rose-500'} h-full rounded-full" style="width: ${b.pct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-400">Votre record 1RM : <strong class="text-white">${b.currentBest} kg</strong></span>
              <span class="text-emerald-400 font-bold">PV Boss (Seuil 1RM) : ${b.target1RM} kg</span>
            </div>
          </div>
        </div>
      `
        )
        .join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          ${heroHeader}
          ${subTabBar}

          <!-- Qu�tes Hebdomadaires du Syst�me -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">?? Qu�tes Hebdomadaires du Syst�me</h2>
              <p class="text-[11px] text-slate-400">Valid�es automatiquement par vos s�ances des 7 derniers jours</p>
            </div>
            <div class="space-y-2">
              ${questsHtml}
            </div>
          </div>

          <!-- Boss de Donjon (Seuils 1RM) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">?? Boss de Donjon (Records 1RM)</h2>
              <p class="text-[11px] text-slate-400">Terrassez les Boss en franchissant des paliers de force (1RM estim�)</p>
            </div>
            <div class="space-y-2.5">
              ${bossesHtml}
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 3 : INVENTAIRE & RELIQUES
    if (ui.rpgSubTab === 'relics') {
      const relicsHtml = hero.relicsStatus
        .map((r) => {
          return `
            <div class="bg-slate-900/90 border ${
              r.equipped
                ? 'border-emerald-500 bg-emerald-500/10'
                : r.unlocked
                ? 'border-slate-700'
                : 'border-slate-800/60'
            } rounded-xl p-3 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    ${r.unlocked ? r.icon : '??'}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">${escapeHtml(r.slot)}</span>
                      <span class="text-[10px] text-amber-300 font-semibold">${escapeHtml(r.rarity)}</span>
                    </div>
                    <h3 class="text-xs font-extrabold text-white mt-0.5">${escapeHtml(r.name)}</h3>
                    <div class="text-[11px] text-emerald-400 font-semibold">${escapeHtml(r.bonusLabel)}</div>
                  </div>
                </div>
                <div>
                  ${
                    r.unlocked
                      ? `<button onclick="IronPulse.App.toggleEquipRelic('${r.id}')" class="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition ${
                          r.equipped
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }">
                          ${r.equipped ? '? �quip�' : '�quiper'}
                        </button>`
                      : `<span class="px-2 py-1 rounded bg-slate-800 text-slate-500 text-[10px] font-bold">Verrouill�</span>`
                  }
                </div>
              </div>
              <div class="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                Condition d'�veil : <strong class="text-slate-200">${escapeHtml(r.conditionDesc)}</strong>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          ${heroHeader}
          ${subTabBar}

          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-extrabold text-white">?? Arsenal & Reliques des Ombres</h2>
                <p class="text-[11px] text-slate-400">�quipez vos reliques d�bloqu�es pour cumuler jusqu'� +51% de bonus d'XP</p>
              </div>
            </div>
            <div class="space-y-2.5">
              ${relicsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 4 : SOCIAL, D�FIS D'AMIS & COMP�TITIONS DE CLUB (GUILDE)
    const challengesHtml = hero.evaluatedChallenges
      .map((ch) => {
        return `
          <div class="bg-slate-900/90 border ${ch.isWinning ? 'border-emerald-500/40' : 'border-slate-800'} rounded-xl p-3 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base">${ch.friendAvatar}</span>
                <div>
                  <div class="text-xs font-extrabold text-white">${escapeHtml(ch.title)}</div>
                  <div class="text-[11px] text-indigo-300">Contre ${escapeHtml(ch.friendName)} � Reste ${ch.daysLeft}j</div>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold shrink-0">
                +${ch.rewardXp} XP
              </span>
            </div>

            <!-- Barres comparatives Vous vs Ami -->
            <div class="space-y-1.5 bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
              <div>
                <div class="flex justify-between text-[11px] mb-0.5">
                  <span class="text-emerald-400 font-bold">Vous (${escapeHtml(hero.heroName)})</span>
                  <span class="text-white font-bold">${ch.userVal} / ${ch.targetValue} ${escapeHtml(ch.unit)}</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: ${ch.userPct}%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-[11px] mb-0.5">
                  <span class="text-rose-300 font-medium">${escapeHtml(ch.friendName)}</span>
                  <span class="text-slate-300">${ch.friendValue} / ${ch.targetValue} ${escapeHtml(ch.unit)}</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="bg-rose-500 h-full rounded-full" style="width: ${ch.friendPct}%"></div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between pt-0.5">
              <span class="text-[11px] font-semibold ${ch.isWinning ? 'text-emerald-400' : 'text-amber-300'}">
                ${ch.isWinning ? '?? Vous �tes en t�te du duel !' : '? Encore un effort pour passer devant !'}
              </span>
              ${
                ch.isClaimed
                  ? `<span class="text-[11px] font-bold text-emerald-400">? R�compense encaiss�e</span>`
                  : ch.isWinning
                  ? `<button onclick="IronPulse.App.claimChallengeReward('${ch.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-extrabold active:scale-95 transition">
                      R�clamer +${ch.rewardXp} XP
                    </button>`
                  : `<button onclick="IronPulse.App.navigate('workout')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold">
                      S'entra�ner ?
                    </button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    const leaderboardHtml = hero.leaderboard
      .map((m, idx) => {
        const medal = idx === 0 ? '??' : idx === 1 ? '??' : idx === 2 ? '??' : `#${idx + 1}`;
        return `
          <div class="flex items-center justify-between py-2 px-2.5 rounded-xl border ${
            m.isUser ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-slate-900/80 border-slate-800/80'
          }">
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-sm font-black w-5 text-center">${medal}</span>
              <span class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-sm shrink-0">${m.avatar}</span>
              <div class="min-w-0">
                <div class="text-xs font-extrabold ${m.isUser ? 'text-emerald-300' : 'text-white'} truncate">
                  ${escapeHtml(m.name)} <span class="text-[10px] text-amber-300">[Rang ${escapeHtml(m.rank)}]</span>
                </div>
                <div class="text-[10px] text-slate-400">Niv. ${m.level} � ${escapeHtml(m.heroClass)}</div>
              </div>
            </div>
            <div class="text-right shrink-0 ml-2">
              <div class="text-xs font-extrabold text-white">${(m.weeklyVolume / 1000).toFixed(1)} t</div>
              <div class="text-[10px] text-slate-400">Tonnage 7j</div>
            </div>
          </div>
        `;
      })
      .join('');

    const guildTotalVol = hero.leaderboard.reduce((acc, m) => acc + m.weeklyVolume, 0);
    const raidTargetVol = 65000;
    const raidPct = Math.min(100, Math.round((guildTotalVol / raidTargetVol) * 100));

    return `
      <div class="space-y-3.5 pb-6 animate-slide-up">
        ${heroHeader}
        ${subTabBar}

        <!-- Banni�re Club & Ligue Shonen (Hub Communautaire & Viral) -->
        <div class="bg-gradient-to-br from-indigo-950/60 via-[#151C28] to-[#151C28] border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-3">
              <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-indigo-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow">
                ?
              </span>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Club & Guilde Active</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">${escapeHtml(hero.guildTier || 'Ligue Or')}</span>
                </div>
                <h2 class="text-base font-black text-white leading-tight mt-0.5">${escapeHtml(hero.guildName)}</h2>
                <p class="text-[11px] text-slate-400 italic">� ${escapeHtml(hero.guildMotto)} �</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="IronPulse.App.openSwitchClubModal()" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition active:scale-95">
                ?? Changer
              </button>
              <button onclick="IronPulse.App.openCreateChallengeModal()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow transition active:scale-95">
                ?? D�fier un Ami
              </button>
              <button onclick="IronPulse.App.shareHunterChallenge('Rejoins mon Dojo')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] shadow transition active:scale-95" title="Partager sur WhatsApp / Instagram">
                ?? Partager
              </button>
            </div>
          </div>

          <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="font-bold text-amber-300">?? Boss de Raid de Guilde : Dragon de Fer</span>
              <span class="font-bold text-white">${(guildTotalVol / 1000).toFixed(1)} / ${(raidTargetVol / 1000).toFixed(0)} t (${raidPct}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style="width: ${raidPct}%"></div>
            </div>
            <div class="text-[11px] text-slate-400">
              Chaque s�rie valid�e par vous et les membres de votre club inflige des d�g�ts au Boss de Raid hebdomadaire.
            </div>
          </div>

          <!-- BOSS MONDIAL ASYNCHRONE CALAMIT� (1 000 000 PV) - Densetsu Sc�nariste -->
          ${(() => {
            const wb = ns.RPG.getWorldBossStatus ? ns.RPG.getWorldBossStatus() : null;
            if (!wb) return '';
            return `
            <div class="bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 border border-rose-500/40 rounded-xl p-3.5 space-y-2 shadow-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">${wb.config.icon}</span>
                  <div>
                    <div class="text-xs font-black text-rose-300 uppercase tracking-wider">${escapeHtml(wb.config.name)}</div>
                    <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(wb.config.title)}</div>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black">
                  ${wb.isDefeated ? '?? TERRASS�' : '?? ACTIF'}
                </span>
              </div>
              <div>
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-slate-300 font-bold">PV Collectifs Mondiaux :</span>
                  <span class="text-rose-400 font-black">${wb.remainingHp.toLocaleString()} / ${wb.config.maxHp.toLocaleString()} PV (${wb.hpPct}%)</span>
                </div>
                <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div class="bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-500" style="width: ${wb.hpPct}%"></div>
                </div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>?? Vos D�g�ts : <strong class="text-white">${wb.userDamage.toLocaleString()} PV</strong> (${wb.userContributionPct}%)</span>
                <span class="text-amber-300 font-bold">?? Paliers : 25% � 50% � 100%</span>
              </div>
            </div>
            `;
          })()}
        </div>

        <!-- 3 D�FIS HEBDOMADAIRES DU CLUB POUR SES ADH�RENTS -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">?? D�fis du Club pour les Adh�rents</h3>
              <p class="text-[11px] text-slate-400">Objectifs collectifs de la semaine lanc�s par l'administration du Dojo</p>
            </div>
            <span class="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
              Hebdo ?
            </span>
          </div>
          <div class="space-y-2.5">
            ${(hero.clubChallenges || [])
              .map((cc) => `
                <div class="bg-slate-900/90 border ${cc.isClaimed ? 'border-slate-800 opacity-75' : cc.progressPct >= 100 ? 'border-amber-400/60 bg-amber-500/5' : 'border-slate-800'} rounded-xl p-3 space-y-2">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2.5">
                      <span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">${cc.icon}</span>
                      <div>
                        <h4 class="text-xs font-bold text-white">${escapeHtml(cc.title)}</h4>
                        <p class="text-[10px] text-slate-400">${escapeHtml(cc.description)}</p>
                      </div>
                    </div>
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black shrink-0">
                      +${cc.rewardXp} XP � ??${cc.rewardGold}
                    </span>
                  </div>
                  <div>
                    <div class="flex justify-between text-[11px] mb-1">
                      <span class="text-slate-400">Progression du Club</span>
                      <span class="text-white font-bold">${cc.currentValue} / ${cc.targetValue} ${cc.unit} (${cc.progressPct}%)</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div class="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full" style="width: ${Math.min(100, cc.progressPct)}%"></div>
                    </div>
                  </div>
                  <div class="flex justify-end pt-1">
                    ${
                      cc.isClaimed
                        ? `<span class="text-[10px] font-bold text-emerald-400">? R�compense r�clam�e</span>`
                        : `<button onclick="IronPulse.App.claimClubChallenge('${cc.id}')" class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition active:scale-95 shadow">
                            R�clamer R�compense (+${cc.rewardXp} XP)
                          </button>`
                    }
                  </div>
                </div>
              `)
              .join('')}
          </div>
        </div>

        <!-- FIL D'ACTUALIT� EN DIRECT DES POTES DE FONTE -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">? Fil d'Activit� des Potes de Fonte</h3>
              <p class="text-[11px] text-slate-400">Flux en direct des s�ances et records valid�s par vos amis</p>
            </div>
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Flux actif"></span>
          </div>
          <div class="space-y-2">
            ${(hero.activityFeed || [])
              .map((act) => `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-base shrink-0">${act.avatar}</span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        <span class="font-extrabold text-white truncate">${escapeHtml(act.friendName)}</span>
                        <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-black">${act.tag}</span>
                      </div>
                      <p class="text-[10px] text-slate-300 truncate mt-0.5">${escapeHtml(act.action)}</p>
                    </div>
                  </div>
                  <span class="text-[9px] text-slate-500 shrink-0 ml-2 whitespace-nowrap">${act.timeAgo}</span>
                </div>
              `)
              .join('')}
          </div>
        </div>

        <!-- Duels & D�fis d'Amis en cours -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">?? D�fis d'Amis en Direct (${hero.evaluatedChallenges.length})</h3>
              <p class="text-[11px] text-slate-400">Affrontez vos amis sur le tonnage, le nombre de s�ries ou la r�gularit�</p>
            </div>
            <button onclick="IronPulse.App.shareHunterChallenge('D�fi de Fonte')" class="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold hover:bg-indigo-500/30">
              ?? Inviter un Ami
            </button>
          </div>
          <div class="space-y-2.5">
            ${challengesHtml}
          </div>
        </div>

        <!-- Classement Hebdomadaire du Club / Guilde (Ladder) -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">?? Classement Hebdomadaire du Club</h3>
              <p class="text-[11px] text-slate-400">Class� par tonnage total soulev� sur les 7 derniers jours</p>
            </div>
            <span class="text-[10px] text-amber-300 font-bold">Ligue Active ??</span>
          </div>
          <div class="space-y-1.5">
            ${leaderboardHtml}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU DES MODALES (D�TAIL EXERCICE, CR�ATION S�ANCE, R�CAPITULATIF, ETC.)
  // ============================================================================
  function renderModal() {
    if (!ui.modal) return '';
    const state = ns.Storage.getState();

    // 1. Modale Fiche D�taill�e d'un Exercice
    if (ui.modal.type === 'exercise-detail') {
      const ex = ns.Storage.getExerciseById(ui.modal.data.exerciseId);
      const timeline = ns.Storage.getExerciseTimeline(ex.id);
      const best1RM = timeline.length ? Math.max(...timeline.map((t) => t.best1RM)) : 0;

      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">${escapeHtml(ex.muscleGroup)}</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">${escapeHtml(ex.equipment)}</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">${escapeHtml(ex.level)}</span>
                </div>
                <h2 class="text-lg font-extrabold text-white">${escapeHtml(ex.name)}</h2>
              </div>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(ex.description)}</p>

            <!-- D�monstration Biom�canique 3D en direct par votre Striker -->
            ${
              ns.Hero3D
                ? `
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-extrabold text-amber-300 uppercase tracking-wider">?? D�monstration 3D Interactive (360�)</span>
                  <span class="text-slate-400">Glissez pour tourner</span>
                </div>
                ${ns.Hero3D.renderHero3DStageHTML({ exerciseId: ex.id, compact: true })}
              </div>
            `
                : ''
            }

            <!-- Muscles cibl�s -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Muscles principaux cibl�s</span>
                <div class="text-xs font-semibold text-white mt-0.5">${escapeHtml((ex.primaryMuscles || []).join(', '))}</div>
              </div>
              ${
                ex.secondaryMuscles && ex.secondaryMuscles.length
                  ? `
                <div class="pt-1.5 border-t border-slate-800">
                  <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Muscles secondaires / Synergistes</span>
                  <div class="text-xs text-slate-300 mt-0.5">${escapeHtml(ex.secondaryMuscles.join(', '))}</div>
                </div>
              `
                  : ''
              }
            </div>

            <!-- Consignes d'ex�cution -->
            <div class="space-y-2">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-200">?? Consignes d�ex�cution</h3>
              <div class="space-y-2">
                ${(ex.instructions || [])
                  .map(
                    (step, i) => `
                  <div class="flex items-start gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
                    <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">${i + 1}</span>
                    <span class="text-xs text-slate-200 leading-relaxed">${escapeHtml(step)}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            ${
              ex.tips
                ? `
              <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200">
                <strong class="text-amber-300">?? Conseil s�curit� & posture :</strong> ${escapeHtml(ex.tips)}
              </div>
            `
                : ''
            }

            ${
              best1RM > 0
                ? `
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span class="text-slate-300">Votre record 1RM estim� :</span>
                <span class="text-emerald-400 font-extrabold">${best1RM} kg (${timeline[timeline.length - 1].bestSetStr})</span>
              </div>
            `
                : ''
            }

            <div class="flex gap-2 pt-1">
              ${
                state.activeWorkout
                  ? `
                <button onclick="IronPulse.App.addExerciseToActiveWorkout('${ex.id}')" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                  + Ajouter � la s�ance en cours
                </button>
              `
                  : ''
              }
              <button onclick="IronPulse.App.closeModal()" class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
                Fermer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Modale Ajouter un exercice � la s�ance en cours
    if (ui.modal.type === 'add-workout-exercise') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[82vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Ajouter un exercice � la s�ance</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>
            <div class="space-y-2">
              ${state.exercises
                .map(
                  (ex) => `
                <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div>
                    <div class="text-xs font-bold text-white">${escapeHtml(ex.name)}</div>
                    <div class="text-[11px] text-slate-400">${escapeHtml(ex.muscleGroup)} � ${escapeHtml(ex.equipment)}</div>
                  </div>
                  <button onclick="IronPulse.App.addExerciseToActiveWorkout('${ex.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">
                    + Ajouter
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    // 3. Modale Cr�ation d'une S�ance Personnalis�e
    if (ui.modal.type === 'create-session') {
      const draft = ui.modal.data;
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3.5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Cr�er une s�ance personnalis�e</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom de la s�ance</label>
              <input
                type="text"
                value="${escapeHtml(draft.name)}"
                oninput="IronPulse.App.updateSessionDraftName(this.value)"
                placeholder="Ex: Pectoraux & Bras Sp�cial"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div class="space-y-2">
              <div class="text-xs font-bold text-slate-300">Exercices s�lectionn�s (${draft.exercises.length})</div>
              ${
                draft.exercises.length === 0
                  ? `<div class="text-xs text-slate-500 italic py-2">Ajoutez des exercices depuis la liste ci-dessous.</div>`
                  : draft.exercises
                      .map((item, idx) => {
                        const ex = ns.Storage.getExerciseById(item.exerciseId);
                        return `
                        <div class="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-white">${idx + 1}. ${escapeHtml(ex.name)}</span>
                            <button onclick="IronPulse.App.removeDraftExercise(${idx})" class="text-slate-400 hover:text-rose-400 text-xs">?</button>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <div>
                              <label class="block text-[10px] text-slate-400">S�ries</label>
                              <input type="number" min="1" max="10" value="${item.targetSets}" onchange="IronPulse.App.updateDraftExField(${idx}, 'targetSets', Number(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center" />
                            </div>
                            <div>
                              <label class="block text-[10px] text-slate-400">R�p�titions</label>
                              <input type="text" value="${escapeHtml(item.targetReps)}" onchange="IronPulse.App.updateDraftExField(${idx}, 'targetReps', this.value)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center" />
                            </div>
                            <div>
                              <label class="block text-[10px] text-slate-400">Repos (s)</label>
                              <input type="number" step="15" value="${item.restSeconds}" onchange="IronPulse.App.updateDraftExField(${idx}, 'restSeconds', Number(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center" />
                            </div>
                          </div>
                        </div>
                      `;
                      })
                      .join('')
              }
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Ajouter un exercice du r�pertoire :</label>
              <select onchange="if(this.value){IronPulse.App.addDraftExercise(this.value); this.value='';}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="">+ Choisir un exercice � ajouter...</option>
                ${state.exercises.map((ex) => `<option value="${ex.id}">${escapeHtml(ex.name)} (${escapeHtml(ex.muscleGroup)})</option>`).join('')}
              </select>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveCustomSessionDraft()" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                Enregistrer la s�ance
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Annuler
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Modale Cr�ation d'un Exercice Personnalis� dans le R�pertoire
    if (ui.modal.type === 'create-exercise') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Ajouter un exercice au r�pertoire</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom de l�exercice</label>
              <input id="new-ex-name" type="text" placeholder="Ex: Fentes bulgares aux halt�res" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Groupe musculaire</label>
                <select id="new-ex-muscle" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
                  ${ns.Data.MUSCLE_GROUPS.filter((m) => m.id !== 'all')
                    .map((m) => `<option value="${m.id}">${escapeHtml(m.label)}</option>`)
                    .join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">�quipement</label>
                <select id="new-ex-equip" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
                  ${ns.Data.EQUIPMENTS.filter((e) => e !== 'Tous')
                    .map((e) => `<option value="${e}">${escapeHtml(e)}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Muscles principaux cibl�s</label>
              <input id="new-ex-primary" type="text" placeholder="Ex: Quadriceps, Grands fessiers" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Description & Consignes d'ex�cution</label>
              <textarea id="new-ex-desc" rows="3" placeholder="D�crivez la posture et les �tapes cl�s d'ex�cution..." class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"></textarea>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveNewExercise()" class="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs">
                Ajouter au r�pertoire
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Annuler
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 5. Modale Lancer un D�fi � un Ami / Membre de Guilde
    if (ui.modal.type === 'create-challenge') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3.5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">?? Lancer un D�fi de Chasseur</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Adversaire / Ami du Club</label>
              <input id="chal-friend-name" type="text" placeholder="Ex: Mehdi (Berserker Niv. 10)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom du d�fi</label>
              <input id="chal-title" type="text" placeholder="Ex: Choc des Titans � Tonnage 7j" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Type d'�preuve</label>
                <select id="chal-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
                  <option value="volume7d">Tonnage 7 jours (kg)</option>
                  <option value="sets7d">S�ries valid�es (7j)</option>
                  <option value="workouts7d">Nombre de s�ances (7j)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Cible � atteindre</label>
                <input id="chal-target" type="number" value="15000" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveNewChallenge()" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                Envoyer le D�fi (+250 XP en jeu)
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Annuler
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 5bis. Modale Changement de Club / Guilde
    if (ui.modal.type === 'switch-club') {
      const hero = ns.RPG.getHeroProfile();
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-extrabold text-white">??? Choisir un Club / Guilde</h2>
                <p class="text-[11px] text-slate-400">Rejoignez un dojo pour participer aux raids et ligues collectives</p>
              </div>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>
            <div class="space-y-2.5">
              ${(hero.presetClubs || [])
                .map((club) => {
                  const isCurrent = hero.clubId === club.id || hero.guildName === club.name;
                  return `
                  <div class="bg-slate-900 border ${isCurrent ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800'} rounded-2xl p-3.5 space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-center gap-3">
                        <span class="text-2xl">${club.icon}</span>
                        <div>
                          <div class="flex items-center gap-1.5">
                            <h3 class="text-xs font-black text-white">${escapeHtml(club.name)}</h3>
                            <span class="px-1.5 py-0.5 rounded text-[9px] font-black border ${club.tierBadge}">${club.tier}</span>
                          </div>
                          <p class="text-[10px] text-slate-400 italic mt-0.5">� ${escapeHtml(club.motto)} �</p>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span>?? ${club.membersCount} adh�rents � Tonnage : <strong>${(club.baseTonnage / 1000).toFixed(0)}t</strong></span>
                      ${
                        isCurrent
                          ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">? Votre Club</span>`
                          : `<button onclick="IronPulse.App.selectClub('${club.id}')" class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition active:scale-95">Rejoindre</button>`
                      }
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
          </div>
        </div>
      `;
    }

    // 6. Modale �chauffement Dynamique Articulaire & Mont�e en Charge (DynamicWarmupModal AURA FIT)
    if (ui.modal.type === 'warmup-protocol') {
      const workout = state.activeWorkout;
      const firstExBlock = workout && workout.exercises && workout.exercises[0];
      const firstEx = firstExBlock ? ns.Storage.getExerciseById(firstExBlock.exerciseId) : null;
      const workingWeight = firstExBlock && firstExBlock.sets && firstExBlock.sets[0] ? Number(firstExBlock.sets[0].weight) || 60 : 60;
      const w50 = Math.max(10, Math.round((workingWeight * 0.5) / 2.5) * 2.5);
      const w70 = Math.max(15, Math.round((workingWeight * 0.7) / 2.5) * 2.5);
      const w85 = Math.max(20, Math.round((workingWeight * 0.85) / 2.5) * 2.5);

      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border-2 border-amber-500/60 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-4 shadow-2xl">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  ?? Protocole Pr�-Combat AURA FIT
                </span>
                <h2 class="text-base font-extrabold text-white mt-1">�chauffement Dynamique & Gammes</h2>
                <p class="text-[11px] text-slate-400">Pr�parez vos articulations et votre syst�me nerveux (+35 XP & +15 ??)</p>
              </div>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">?</button>
            </div>

            <!-- Phase 1 : Mobilit� Articulaire -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">1. Mobilit� Articulaire & Coiffe (3 min)</div>
              <div class="space-y-1.5 text-xs text-slate-200">
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>?? Rotations externes �paules & dislocates</span>
                  <span class="font-bold text-emerald-300">2 � 15 r�p.</span>
                </div>
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>?? Ouverture thoracique & hanches dynamiques</span>
                  <span class="font-bold text-emerald-300">60 sec</span>
                </div>
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>? Gainage d'activation abdos / fessiers</span>
                  <span class="font-bold text-emerald-300">45 sec</span>
                </div>
              </div>
            </div>

            <!-- Phase 2 : Gammes Montantes sur le 1er exercice -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">2. S�ries de Chauffe (${escapeHtml(firstEx ? firstEx.name : '1er Exercice')})</span>
                <span class="text-[10px] text-slate-400">Travail : ${workingWeight} kg</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">S�rie 1 (50%)</div>
                  <div class="text-sm font-black text-white mt-0.5">${w50} kg � 8</div>
                  <div class="text-[9px] text-emerald-400">Repos 45s</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">S�rie 2 (70%)</div>
                  <div class="text-sm font-black text-amber-300 mt-0.5">${w70} kg � 5</div>
                  <div class="text-[9px] text-emerald-400">Repos 60s</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">S�rie 3 (85%)</div>
                  <div class="text-sm font-black text-rose-300 mt-0.5">${w85} kg � 2</div>
                  <div class="text-[9px] text-emerald-400">Repos 90s</div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <button onclick="IronPulse.App.completeWarmupProtocol()" class="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg">
                ? Valider l'�chauffement (+35 XP & +15 ??)
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Fermer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 7. Modale R�compense de Fin de S�ance (Victoire de Qu�te RPG & Butin AURA FIT)
    if (ui.modal.type === 'workout-rpg-reward') {
      const d = ui.modal.data;
      const hero = ns.RPG ? ns.RPG.getHeroProfile() : null;
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border-2 border-emerald-500 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-4 shadow-2xl text-center">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto">
              ??
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                Syst�me d'�veil � Qu�te Accomplie
              </span>
              <h2 class="text-lg font-extrabold text-white mt-1.5">${escapeHtml(d.workoutName)}</h2>
              <p class="text-xs text-slate-300 mt-0.5">S�ance enregistr�e ! Vos attributs de Chasseur et votre Or progressent.</p>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center justify-center gap-4">
                <div class="text-2xl font-black text-emerald-400">+${d.earnedXp} XP</div>
                <div class="text-2xl font-black text-amber-300">+${d.earnedGold || 75} ?? Or</div>
              </div>
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div>
                  <div class="text-[10px] text-slate-400">Tonnage</div>
                  <div class="text-xs font-bold text-white">${d.totalVolume} kg</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400">S�ries</div>
                  <div class="text-xs font-bold text-white">${d.completedSets}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400">Dur�e</div>
                  <div class="text-xs font-bold text-emerald-400">${d.durationMin} min</div>
                </div>
              </div>
            </div>

            ${
              hero
                ? `
              <div class="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 text-left space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-extrabold text-white">${hero.classObj.icon} ${escapeHtml(hero.classObj.name)} � Rang ${hero.rankObj.rank}</span>
                  <span class="font-black text-emerald-400">Niv. ${hero.level}</span>
                </div>
                <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style="width: ${hero.levelProgressPct}%"></div>
                </div>
                <div class="text-[10px] text-slate-400 flex justify-between">
                  <span>Progression de niveau</span>
                  <span>${hero.xpInCurrentLevel} / ${hero.xpForNextLevel} XP</span>
                </div>
              </div>
            `
                : ''
            }

            <div class="flex gap-2">
              <button onclick="IronPulse.App.closeModal(); IronPulse.App.navigate('rpg');" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                ?? Voir mon H�ros
              </button>
              <button onclick="IronPulse.App.closeModal()" class="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
                Voir l'historique
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return '';
  }

  // ============================================================================
  // RENDU GLOBAL SHELL MOBILE
  // ============================================================================
  // TUTORIEL INTERACTIF, VISITE GUID�E & QUESTIONNAIRE PREMI�RE UTILISATION
  // ============================================================================
  const TUTORIAL_SLIDES = [
    {
      badge: 'Module 1 / 5 � QG du H�ros & Mod�le 3D',
      icon: '??',
      title: 'Votre Guerrier 3D Cel-Shading � 360�',
      subtitle: 'Chaque kilo soulev� dans la vraie vie renforce votre avatar dans l\'univers Aura Pulse.',
      bullets: [
        '?? **Sc�ne 3D interactive** : Faites pivoter votre guerrier � 360� � la souris ou au doigt et testez ses mouvements.',
        '?? **4 Attributs RPG r�els** : Force (STR), Endurance (END), Vitesse/Constance (VIT) et Volont�/Intensit� (VOL) calcul�s sur vos vraies s�ries.',
        '?? **Reliques & Titres** : D�bloquez des artefacts passifs (+5% � +8% XP) en battant des records.'
      ],
      highlightTab: 'home'
    },
    {
      badge: 'Module 2 / 5 � Donjon en Direct & Tempo 3-1-1',
      icon: '??',
      title: 'Hologramme 3D Synchronis� & M�tronome Biom�canique',
      subtitle: 'Pendant votre s�ance, votre avatar ex�cute exactement le m�me exercice que vous en temps r�el.',
      bullets: [
        '?? **M�tronome de Tempo (3-1-1 / 2-0-1 / 4-2-1)** : Suivez la jauge lumineuse (3s Descente Excentrique � 1s Pause � 1s Pouss�e Explosif) pour un recrutement musculaire maximal.',
        '?? **Surcharge d\'Aura Cin�tique & Audio** : Chaque s�rie coch�e (`?`) d�clenche un flash d\'aura lumineuse et lance automatiquement le minuteur de repos.',
        '? **M�moire de charge** : Vos poids et r�p�titions de la s�ance pr�c�dente sont pr�-remplis automatiquement.'
      ],
      highlightTab: 'workout'
    },
    {
      badge: 'Module 3 / 5 � Campagnes & Grimoire 3D',
      icon: '??',
      title: '4 Programmes Scientifiques & 25 Exercices Mod�lis�s',
      subtitle: 'Du Full Body D�butant au Push/Pull/Legs 6J, ou cr�ez vos propres s�ances sur mesure.',
      bullets: [
        '?? **Campagnes adapt�es** : Choisissez un programme structur� ou cr�ez vos propres routines dans l\'onglet *Mes S�ances*.',
        '?? **Grimoire de 25 Exercices** : Filtrez par muscle ou mat�riel. Cliquez sur un exercice pour voir la **d�monstration 3D interactive** + les consignes de s�curit�.',
        '? **Exercices personnalis�s** : Ajoutez librement vos propres mouvements au r�pertoire.'
      ],
      highlightTab: 'programs'
    },
    {
      badge: 'Module 4 / 5 � Boss de Donjon 1RM & Guilde',
      icon: '??',
      title: 'Terrassez les 4 Boss Mythiques & D�fiez la Guilde',
      subtitle: 'Vos records de force maximale th�orique (formule d\'Epley 1RM) font tomber les Boss de Donjon.',
      bullets: [
        '?? **4 Boss 1RM** : Cerb�re d\'Acier (D�velopp� Couch� = 80 kg), Golem Titan (Squat = 110 kg), Wyverne Abyssale (Soulev� de Terre = 140 kg), Commandant de l\'�clipse (Militaire = 55 kg).',
        '??? **D�fis de Guilde** : Affrontez des chasseurs rivaux sur 7 jours (volume, s�ries, r�gularit�) pour gagner +250 � +350 XP bonus.',
        '?? **Studio Striker Cin�tique** : Personnalisez librement la morphologie, les coiffures, les tenues techwear et �quipements de force pro.'
      ],
      highlightTab: 'rpg'
    },
    {
      badge: 'Module 5 / 5 � Oracle IA Prudent & Graphiques SVG',
      icon: '??',
      title: 'Coach IA Biom�canique & Courbes de Progression',
      subtitle: 'Une intelligence artificielle qui analyse votre �ge, taille, poids, IMC, RPE et surcharge progressive.',
      bullets: [
        '?? **Bilan Automatique Prudent** : D�tecte la stagnation, la fatigue excessive (RPE = 9) ou la marge de progression (+2,5 kg) et ajuste vos prochaines charges.',
        '?? **Chat Coach IA (Hors-ligne + Gemini)** : Posez n\'importe quelle question technique ou de r�cup�ration ; fonctionne 100% hors-ligne ou avec cl� API Gemini.',
        '?? **Graphiques SVG** : Visualisez votre 1RM, votre charge max et votre tonnage s�ance apr�s s�ance.'
      ],
      highlightTab: 'progress'
    }
  ];

  const GUIDED_TOUR_STEPS = [
    {
      tab: 'home',
      title: '1/6 � QG du H�ros & Avatar 3D',
      desc: 'Voici votre tableau de bord principal : faites tourner votre Guerrier 3D, consultez vos 4 attributs RPG (STR, END, VIT, VOL), votre qu�te prioritaire du jour et l\'avis rapide de l\'Oracle IA.'
    },
    {
      tab: 'rpg',
      title: '2/6 � Guilde, Studio 3D & Boss de Donjon',
      desc: 'Explorez les 5 sous-onglets ici : Statut RPG, Studio 3D (morphologies & coiffures), Donjons (les 4 Boss li�s � vos 1RM), Reliques et D�fis de Guilde entre amis.'
    },
    {
      tab: 'workout',
      title: '3/6 � Donjon d\'Entra�nement & M�tronome 3-1-1',
      desc: 'Lancez une s�ance pour voir votre Guerrier 3D reproduire l\'exercice en direct avec le M�tronome de Tempo (3s Descente � 1s Pause � 1s Pouss�e). Cochez une s�rie pour d�clencher la Surcharge d\'Aura !'
    },
    {
      tab: 'programs',
      title: '4/6 � Campagnes & S�ances sur mesure',
      desc: 'Votre programme recommand� par le questionnaire est activ� ici. Vous pouvez lancer n\'importe quelle journ�e d\'entra�nement en 1 clic ou cr�er vos s�ances personnalis�es.'
    },
    {
      tab: 'exercises',
      title: '5/6 � Grimoire des 25 Exercices 3D',
      desc: 'Recherchez un mouvement par groupe musculaire ou �quipement. Cliquez sur une fiche pour inspecter le mod�le 3D en mouvement et les conseils de posture.'
    },
    {
      tab: 'progress',
      title: '6/6 � Oracle IA & Courbes SVG',
      desc: 'Suivez vos courbes de 1RM et de tonnage, consultez les recommandations prudentes bas�es sur votre profil (�ge, taille, poids, RPE) et discutez avec le Coach IA.'
    }
  ];

  function renderGuidedTourBanner() {
    if (!ui.guidedTourActive) return '';
    const stepIdx = Math.max(0, Math.min(GUIDED_TOUR_STEPS.length - 1, ui.guidedTourStep || 0));
    const step = GUIDED_TOUR_STEPS[stepIdx];

    return `
      <div class="mb-3.5 rounded-2xl p-3.5 border-2 border-amber-400/60 bg-gradient-to-r from-amber-950/70 via-[#151C28] to-emerald-950/60 shadow-xl animate-slide-up">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">?? Visite Guid�e</span>
            <span class="text-xs font-black text-amber-300">${escapeHtml(step.title)}</span>
          </div>
          <button
            onclick="IronPulse.App.closeGuidedTour()"
            class="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700"
          >
            ? Fermer
          </button>
        </div>
        <p class="text-[11px] text-slate-200 leading-relaxed mb-2.5">${escapeHtml(step.desc)}</p>
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1">
            ${GUIDED_TOUR_STEPS.map(
              (_, i) => `
              <span class="h-1.5 rounded-full transition-all ${
                i === stepIdx ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-700'
              }"></span>
            `
            ).join('')}
          </div>
          <div class="flex items-center gap-1.5">
            ${
              stepIdx > 0
                ? `<button onclick="IronPulse.App.prevGuidedTourStep()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700">? Pr�c�dent</button>`
                : ''
            }
            ${
              stepIdx < GUIDED_TOUR_STEPS.length - 1
                ? `<button onclick="IronPulse.App.nextGuidedTourStep()" class="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[11px] font-black text-slate-950 shadow">Suivant ?</button>`
                : `<button onclick="IronPulse.App.closeGuidedTour()" class="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-[11px] font-black text-slate-950 shadow">? Terminer la visite</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderOnboardingTacticalCardHTML(bio) {
    return `
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">?? Diagnostic Biom�trique Instantan�</span>
        <span class="text-[10px] font-extrabold ${bio.bmiColor}">${bio.bmiLabel}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Indice IMC</div>
          <div class="text-base font-black text-white">${bio.bmi}</div>
          <div class="text-[9px] text-slate-500">${bio.heightCm} cm / ${bio.weightKg} kg</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Maintien Estim�</div>
          <div class="text-base font-black text-amber-300">${bio.tdee} <span class="text-[10px]">kcal/j</span></div>
          <div class="text-[9px] text-slate-500">M�tabolisme: ${bio.bmr} kcal</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Cible Prot�ines</div>
          <div class="text-base font-black text-emerald-300">${bio.proteinTargetG} <span class="text-[10px]">g/j</span></div>
          <div class="text-[9px] text-slate-500">1.8g / kg poids</div>
        </div>
      </div>
    `;
  }
  const renderOnboardingScouterCardHTML = renderOnboardingTacticalCardHTML;

  function renderOnboardingWizardModal() {
    if (!ui.onboardingOpen) return '';
    const state = ns.Storage.getState();
    const { profile } = state;
    const hero = ns.RPG ? ns.RPG.getHeroProfile() : null;
    const bio = computeBiometricSummary(profile);
    const step = ui.onboardingStep || 1;
    const recProgId = recommendProgramForProfile(profile);
    const recProg = ns.Data.PREDEFINED_PROGRAMS.find((p) => p.id === recProgId) || ns.Data.PREDEFINED_PROGRAMS[0];
    const goalObj = ns.Data.GOALS.find((g) => g.id === profile.goal) || ns.Data.GOALS[0];
    const levelObj = ns.Data.LEVELS.find((l) => l.id === profile.level) || ns.Data.LEVELS[1];
    const goalIcons = {
      hypertrophy: '??',
      strength: '??',
      fitness: '?????',
      fatloss: '?'
    };

    const stepLabels = [
      { n: 1, label: 'Biom�trie' },
      { n: 2, label: 'Objectifs' },
      { n: 3, label: 'Avatar 3D' },
      { n: 4, label: 'Tutoriel' },
      { n: 5, label: 'Lancement' }
    ];

    let stepContentHtml = '';

    // -------------------------------------------------------------------------
    // �TAPE 1 : QUESTIONNAIRE BIOM�TRIQUE (PSEUDO, �GE, TAILLE, POIDS + IMC)
    // -------------------------------------------------------------------------
    if (step === 1) {
      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-slate-900 border border-amber-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-amber-300">? Bienvenue dans IronPulse Z � Premi�re Utilisation</div>
            <h3 class="text-sm font-black text-white mt-0.5">�tape 1/5 : Calibration Biom�trique Tactique</h3>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Renseignez votre �ge, votre taille et votre poids pour calibrer le moteur biom�canique, vos besoins �nerg�tiques et l'Oracle IA.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1">Votre Pr�nom ou Pseudo de Striker</label>
            <input
              type="text"
              placeholder="Ex: Alex, Ren, Kaelen..."
              value="${escapeHtml(profile.name)}"
              oninput="IronPulse.App.updateOnboardingField('name', this.value)"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-3 gap-2.5">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <label class="block text-[10px] font-extrabold text-amber-300 uppercase mb-1">?? �ge (ans)</label>
              <input
                type="number"
                min="14"
                max="90"
                value="${profile.age || 26}"
                oninput="IronPulse.App.updateOnboardingField('age', Number(this.value))"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm font-black text-white text-center outline-none focus:border-amber-400"
              />
            </div>
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <label class="block text-[10px] font-extrabold text-emerald-300 uppercase mb-1">?? Taille (cm)</label>
              <input
                type="number"
                min="130"
                max="230"
                value="${profile.heightCm || 178}"
                oninput="IronPulse.App.updateOnboardingField('heightCm', Number(this.value))"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm font-black text-white text-center outline-none focus:border-emerald-400"
              />
            </div>
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <label class="block text-[10px] font-extrabold text-sky-300 uppercase mb-1">?? Poids (kg)</label>
              <input
                type="number"
                step="0.5"
                min="35"
                max="200"
                value="${profile.bodyWeightKg || 76}"
                oninput="IronPulse.App.updateOnboardingField('bodyWeightKg', Number(this.value))"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-sm font-black text-white text-center outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <!-- Analyse Tactique Instantan�e -->
          <div id="onb-scouter-card" class="rounded-2xl p-3.5 bg-slate-950/90 border border-emerald-500/30 space-y-2">
            ${renderOnboardingScouterCardHTML(bio)}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // �TAPE 2 : QUESTIONNAIRE SPORTIF (NIVEAU, OBJECTIF, FR�QUENCE, MAT�RIEL)
    // -------------------------------------------------------------------------
    else if (step === 2) {
      const equipOptions = [
        { id: 'full-gym', icon: '???', title: 'Salle compl�te', desc: 'Barres, halt�res, poulies, machines' },
        { id: 'home-gym', icon: '??', title: 'Home Gym', desc: 'Barre, banc, halt�res libres' },
        { id: 'bodyweight-db', icon: '??', title: 'Halt�res & Poids du corps', desc: 'Minimaliste & polyvalent' }
      ];
      const curEquip = profile.availableEquipment || 'full-gym';

      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-slate-900 border border-emerald-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300">?? Calibration de l'Entra�nement</div>
            <h3 class="text-sm font-black text-white mt-0.5">�tape 2/5 : Exp�rience, Objectif & Rythme</h3>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Le syst�me s�lectionne automatiquement votre campagne id�ale et votre temps de repos optimal.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">1. Votre niveau actuel en musculation</label>
            <div class="grid grid-cols-3 gap-2">
              ${ns.Data.LEVELS.map((lvl) => {
                const active = profile.level === lvl.id;
                return `
                  <button
                    onclick="IronPulse.App.updateOnboardingField('level', '${lvl.id}')"
                    class="p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="text-xs font-black ${active ? 'text-emerald-300' : 'text-white'}">${escapeHtml(lvl.label)}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5 leading-tight">${escapeHtml(lvl.desc)}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">2. Votre objectif principal</label>
            <div class="grid grid-cols-2 gap-2">
              ${ns.Data.GOALS.map((g) => {
                const active = profile.goal === g.id;
                const emoji = goalIcons[g.id] || '?';
                return `
                  <button
                    onclick="IronPulse.App.updateOnboardingField('goal', '${g.id}')"
                    class="p-2.5 rounded-xl border text-left transition flex items-start gap-2 ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <span class="text-base shrink-0">${emoji}</span>
                    <div>
                      <div class="text-xs font-black ${active ? 'text-amber-300' : 'text-white'}">${escapeHtml(g.label)}</div>
                      <div class="text-[10px] text-slate-400 leading-tight">${escapeHtml(g.desc)}</div>
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-bold text-slate-200">3. Fr�quence hebdomadaire souhait�e</label>
              <span class="text-xs font-black text-amber-300">${profile.weeklyTarget || 4} s�ances / sem.</span>
            </div>
            <div class="grid grid-cols-5 gap-1.5">
              ${[2, 3, 4, 5, 6]
                .map((n) => {
                  const active = Number(profile.weeklyTarget) === n;
                  return `
                  <button
                    onclick="IronPulse.App.updateOnboardingField('weeklyTarget', ${n})"
                    class="py-2 rounded-xl border text-xs font-black transition ${
                      active
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    ${n} j/sem
                  </button>
                `;
                })
                .join('')}
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">4. �quipement principal � disposition</label>
            <div class="grid grid-cols-3 gap-2">
              ${equipOptions
                .map((eq) => {
                  const active = curEquip === eq.id;
                  return `
                  <button
                    onclick="IronPulse.App.selectOnboardingEquipment('${eq.id}')"
                    class="p-2 rounded-xl border text-left transition ${
                      active
                        ? 'bg-indigo-500/20 border-indigo-400 text-white'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="text-sm">${eq.icon} <span class="text-[11px] font-black">${escapeHtml(eq.title)}</span></div>
                    <div class="text-[9px] text-slate-400 mt-0.5 leading-tight">${escapeHtml(eq.desc)}</div>
                  </button>
                `;
                })
                .join('')}
            </div>
          </div>

          <!-- Corpulence Actuelle -->
          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">5. Corpulence actuelle</label>
            <div class="grid grid-cols-3 gap-2">
              ${[
                { id: 'slim', icon: '??', label: 'Mince / Ecto', desc: 'M�tabolisme rapide, ossature fine' },
                { id: 'athletic', icon: '?', label: 'Athl�tique', desc: 'Forme �quilibr�e, base sportive' },
                { id: 'heavy', icon: '???', label: 'Robuste / Massif', desc: 'Grosse charpente, masse �tablie' }
              ].map((c) => {
                const active = (profile.currentBuild || 'athletic') === c.id;
                return `
                  <button
                    onclick="IronPulse.App.updateOnboardingField('currentBuild', '${c.id}')"
                    class="p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="text-xs font-black ${active ? 'text-amber-300' : 'text-white'}">${c.icon} ${escapeHtml(c.label)}</div>
                    <div class="text-[9px] text-slate-400 mt-0.5 leading-tight">${escapeHtml(c.desc)}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Corpulence Vis�e (Morphologie Cible Manga) -->
          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">6. Corpulence vis�e (Objectif Physique)</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${(ns.RPG.MORPHOLOGIES || []).slice(0, 4).map((m) => {
                const active = (profile.targetMorphology || hero?.appearance?.morphology || 'athletic-vtaper') === m.id;
                return `
                  <button
                    onclick="IronPulse.App.updateOnboardingTargetMorphology('${m.id}')"
                    class="p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="text-base">${m.icon}</div>
                    <div class="text-xs font-black ${active ? 'text-emerald-300' : 'text-white'} truncate mt-0.5">${escapeHtml(m.label.split(' (')[0])}</div>
                    <div class="text-[9px] text-slate-400 leading-tight mt-0.5">${escapeHtml(m.badge || '')}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Recommandation automatique du programme -->
          <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-2">
            <div>
              <div class="text-[10px] font-black uppercase tracking-wider text-emerald-400">? Campagne Recommand�e & Assign�e</div>
              <div class="text-xs font-extrabold text-white mt-0.5">${escapeHtml(recProg.name)} (${recProg.frequency})</div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">Repos ${profile.defaultRestSeconds || 90}s</span>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // �TAPE 3 : CR�ATION DE L'AVATAR 3D (CLASSE RPG, CHEVEUX STRIKER, AURA CIN�TIQUE)
    // -------------------------------------------------------------------------
    else if (step === 3 && hero) {
      stepContentHtml = `
        <div class="space-y-3">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-slate-900 border border-amber-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-amber-300">?? Forge du Striker 3D (Cel-Shading)</div>
            <h3 class="text-sm font-black text-white mt-0.5">�tape 3/5 : Cr�ez votre Avatar Shonen</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Faites pivoter le mod�le 3D � 360�, testez ses exercices et choisissez votre Classe et �veil d'Aura.
            </p>
          </div>

          ${
            ns.Hero3D
              ? ns.Hero3D.renderHero3DStageHTML({
                  compact: true,
                  showMoveSelector: true
                })
              : ''
          }

          <!-- ARCH�TYPES MANGA RAPIDES 1-CLIC (BAKI, IPPO, Pro, SOLO LEVELING, PERSONA) -->
          <div class="bg-gradient-to-r from-red-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/40 rounded-xl p-2.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black uppercase text-amber-300">?? Pr�r�glages Rapides Manga (1-Clic)</span>
              <span class="text-[9px] text-slate-400">Sport & Arts Martiaux</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              ${(ns.RPG.MANGA_ARCHETYPES || []).map((arch) => {
                const isActive = hero.appearance.auraStyle === arch.appearance.auraStyle && hero.appearance.outfit === arch.appearance.outfit;
                return `
                  <button
                    onclick="IronPulse.App.applyMangaArchetype('${arch.id}')"
                    class="p-1.5 rounded-lg border text-left transition flex items-center gap-1.5 ${
                      isActive ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <span class="text-sm shrink-0">${arch.icon}</span>
                    <span class="text-[10px] font-black truncate">${escapeHtml(arch.name)}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Sexe & Morphologie Manga</label>
            <div class="grid grid-cols-2 gap-2">
              ${(ns.RPG.GENDERS || []).map((g) => {
                const active = (hero.appearance.gender || 'male') === g.id;
                return `
                  <button
                    onclick="IronPulse.App.updateHeroAppearance('gender', '${g.id}')"
                    class="p-2 rounded-xl border text-left transition ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="text-xs font-black">${g.icon} ${escapeHtml(g.label)}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-amber-300 uppercase mb-1.5">?? Teint de Peau</div>
              <div class="flex flex-wrap gap-1">
                ${(ns.RPG.SKIN_TONES || []).map((st) => {
                  const active = (hero.appearance.skinTone || 'golden') === st.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('skinTone', '${st.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span class="w-2 h-2 rounded-full shrink-0" style="background:${st.hex}"></span>
                      ${escapeHtml(st.label.split(' ')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-cyan-300 uppercase mb-1.5">?? Coupe de Cheveux</div>
              <div class="flex flex-wrap gap-1">
                ${(ns.RPG.HAIRSTYLES || []).map((hs) => {
                  const active = (hero.appearance.hairstyle || 'spiky-striker') === hs.id || (hero.appearance.hairstyle === 'spiky-dbz' && hs.id === 'spiky-striker');
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('hairstyle', '${hs.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-cyan-400 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span>${hs.icon}</span>
                      ${escapeHtml(hs.label.split(' ')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-extrabold text-slate-200 uppercase tracking-wider mb-1.5">Classe de Chasseur (Bonus XP passif)</label>
            <div class="grid grid-cols-2 gap-2">
              ${ns.RPG.HERO_CLASSES.map((cls) => {
                const active = hero.classObj.id === cls.id;
                return `
                  <button
                    onclick="IronPulse.App.selectHeroClass('${cls.id}')"
                    class="p-2.5 rounded-xl border text-left transition ${
                      active
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-white">${cls.icon} ${escapeHtml(cls.name)}</span>
                      ${active ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">ACTIF</span>' : ''}
                    </div>
                    <div class="text-[10px] text-emerald-300 font-bold mt-0.5">${escapeHtml(cls.bonusDesc || cls.title)}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-amber-300 uppercase mb-1.5">? Couleur des Cheveux</div>
              <div class="flex flex-wrap gap-1">
                ${ns.RPG.HAIR_COLORS.map((hc) => {
                  const active = hero.appearance.hairColor === hc.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('hairColor', '${hc.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-amber-400 bg-amber-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span class="w-2 h-2 rounded-full shrink-0" style="background:${hc.hex}"></span>
                      ${escapeHtml(hc.label.split(' ')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-emerald-300 uppercase mb-1.5">?? Aura Ki</div>
              <div class="flex flex-wrap gap-1">
                ${ns.RPG.AURA_STYLES.map((ac) => {
                  const active = hero.appearance.auraStyle === ac.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('auraStyle', '${ac.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-emerald-400 bg-emerald-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span class="w-2 h-2 rounded-full shrink-0" style="background:${ac.primary}"></span>
                      ${escapeHtml(ac.label.split(' ')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-indigo-300 uppercase mb-1.5">?? Tenue de Combat</div>
              <div class="flex flex-wrap gap-1">
                ${(ns.RPG.OUTFITS || []).slice(0, 5).map((ot) => {
                  const active = hero.appearance.outfit === ot.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('outfit', '${ot.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-indigo-400 bg-indigo-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span>${ot.icon}</span>
                      ${escapeHtml(ot.label.split(' (')[0].replace('Manteau du ', '').replace('Short de Combat ', 'Short '))}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- YEUX & MARQUAGES DE GUERRE / CICATRICES BAKI & IPPO -->
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-cyan-300 uppercase mb-1.5">??? Couleur des Yeux</div>
              <div class="flex flex-wrap gap-1">
                ${(ns.RPG.EYE_COLORS || []).map((ec) => {
                  const active = hero.appearance.eyeColor === ec.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('eyeColor', '${ec.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-cyan-400 bg-cyan-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span class="w-2 h-2 rounded-full shrink-0" style="background:${ec.hex}"></span>
                      ${escapeHtml(ec.label.split(' ')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] font-black text-rose-300 uppercase mb-1.5">?? Cicatrices & Marquages</div>
              <div class="flex flex-wrap gap-1">
                ${(ns.RPG.WAR_MARKINGS || []).slice(0, 5).map((wm) => {
                  const active = (hero.appearance.warMarking || 'eye-scar') === wm.id;
                  return `
                    <button
                      onclick="IronPulse.App.updateHeroAppearance('warMarking', '${wm.id}')"
                      class="px-1.5 py-1 rounded-lg border text-[9px] font-bold flex items-center gap-1 ${
                        active ? 'border-rose-400 bg-rose-500/20 text-white' : 'border-slate-700 bg-slate-950 text-slate-300'
                      }"
                    >
                      <span>${wm.icon}</span>
                      ${escapeHtml(wm.label.split(' (')[0])}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // �TAPE 4 : TUTORIEL INTERACTIF DES FONCTIONNALIT�S (5 SLIDES ILLUSTR�ES)
    // -------------------------------------------------------------------------
    else if (step === 4) {
      const slideIdx = Math.max(0, Math.min(TUTORIAL_SLIDES.length - 1, ui.tutorialSlideIdx || 0));
      const slide = TUTORIAL_SLIDES[slideIdx];

      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-emerald-500/10 to-slate-900 border border-indigo-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-indigo-300">?? Guide Officiel des Fonctionnalit�s</div>
            <h3 class="text-sm font-black text-white mt-0.5">�tape 4/5 : Comment fonctionne IronPulse Z</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Parcourez les 5 piliers de l'application avant de lancer votre aventure.
            </p>
          </div>

          <!-- S�lecteur rapide des 5 modules du tutoriel -->
          <div class="grid grid-cols-5 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            ${TUTORIAL_SLIDES.map((s, idx) => {
              const active = idx === slideIdx;
              return `
                <button
                  onclick="IronPulse.App.setTutorialSlide(${idx})"
                  class="py-1.5 px-1 rounded-lg text-[10px] font-black transition flex flex-col items-center gap-0.5 ${
                    active ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }"
                >
                  <span class="text-sm">${s.icon}</span>
                  <span>#${idx + 1}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Carte de la slide active -->
          <div class="shonen-card rounded-2xl p-4 border border-amber-500/40 bg-gradient-to-br from-[#151C28] to-[#0B0F17] space-y-3">
            <div class="flex items-center justify-between">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                ${escapeHtml(slide.badge)}
              </span>
              <span class="text-2xl">${slide.icon}</span>
            </div>

            <div>
              <h4 class="text-base font-black text-white">${escapeHtml(slide.title)}</h4>
              <p class="text-xs text-emerald-300 font-semibold mt-0.5">${escapeHtml(slide.subtitle)}</p>
            </div>

            <div class="space-y-2 pt-1">
              ${slide.bullets
                .map(
                  (b) => `
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  ${renderSimpleMarkdown(b)}
                </div>
              `
                )
                .join('')}
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <button
                onclick="IronPulse.App.setTutorialSlide(${Math.max(0, slideIdx - 1)})"
                ${slideIdx === 0 ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  slideIdx === 0
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }"
              >
                ? Module pr�c�dent
              </button>
              <span class="text-[11px] font-bold text-slate-400">${slideIdx + 1} / ${TUTORIAL_SLIDES.length}</span>
              <button
                onclick="IronPulse.App.setTutorialSlide(${Math.min(TUTORIAL_SLIDES.length - 1, slideIdx + 1)})"
                ${slideIdx === TUTORIAL_SLIDES.length - 1 ? 'disabled' : ''}
                class="px-3 py-1.5 rounded-xl text-xs font-black border ${
                  slideIdx === TUTORIAL_SLIDES.length - 1
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'border-amber-400/50 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                }"
              >
                Module suivant ?
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // �TAPE 5 : R�CAPITULATIF TACTIQUE & CHOIX DU MODE DE D�PART
    // -------------------------------------------------------------------------
    else {
      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-slate-900 border border-emerald-400/40 text-center">
            <div class="text-2xl mb-1">???</div>
            <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Calibration Tactique Termin�e</div>
            <h3 class="text-base font-black text-white mt-0.5">${escapeHtml(profile.name || 'Alex')} est pr�t pour l'�veil !</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              V�rifiez votre fiche personnalis�e et choisissez comment d�marrer votre exp�rience.
            </p>
          </div>

          <!-- Fiche Synth�se -->
          <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-400 uppercase font-bold">Profil Biom�trique</div>
                <div class="font-black text-white mt-0.5">${bio.age} ans � ${bio.heightCm} cm � ${bio.weightKg} kg</div>
                <div class="text-[10px] ${bio.bmiColor} font-bold">IMC ${bio.bmi} (${bio.tdee} kcal/j)</div>
              </div>
              <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-400 uppercase font-bold">Objectif & Rythme</div>
                <div class="font-black text-amber-300 mt-0.5">${escapeHtml(goalObj.label)} � ${escapeHtml(levelObj.label)}</div>
                <div class="text-[10px] text-slate-300 font-semibold">${profile.weeklyTarget} s�ances / sem.</div>
              </div>
            </div>

            <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-emerald-400 uppercase font-black">Campagne Assign�e</div>
                <div class="text-xs font-extrabold text-white">${escapeHtml(recProg.name)}</div>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                ${hero ? `${hero.classObj.icon} ${escapeHtml(hero.classObj.name)}` : 'Guerrier Z'}
              </span>
            </div>
          </div>

          <!-- 3 Modes de D�marrage -->
          <div class="space-y-2 pt-1">
            <div class="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Choisissez votre mode de d�marrage :</div>

            <button
              onclick="IronPulse.App.finishOnboarding('guided')"
              class="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:opacity-95 text-slate-950 text-left shadow-lg transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black uppercase tracking-wide">?? D�marrer + Visite Guid�e Interactive (Recommand�)</div>
                <div class="text-[11px] font-semibold text-slate-900 mt-0.5">
                  Ouvre l'application avec une banni�re pas-�-pas qui vous montre chaque onglet en direct.
                </div>
              </div>
              <span class="text-lg font-black">?</span>
            </button>

            <button
              onclick="IronPulse.App.finishOnboarding('fresh')"
              class="w-full p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black text-emerald-300">?? D�marrer au Niveau 1 (Compte Vierge � 0 s�ance)</div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  Conserve votre profil (${bio.age} ans, ${bio.heightCm} cm, ${bio.weightKg} kg) et remet le compteur de s�ances � z�ro pour votre vraie 1re s�ance.
                </div>
              </div>
              <span class="text-sm font-black text-emerald-300">Niv. 1</span>
            </button>

            <button
              onclick="IronPulse.App.finishOnboarding('demo')"
              class="w-full p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-bold text-slate-200">?? Explorer avec Historique de D�mo (Niveau 7)</div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  Conserve votre profil personnalis� ET garde 6 s�ances d'exemple pour tester imm�diatement les graphiques et Boss.
                </div>
              </div>
              <span class="text-xs font-bold text-amber-300">Niv. 7</span>
            </button>

            <button
              onclick="IronPulse.App.loadMehdiProfile()"
              class="w-full p-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/50 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black text-indigo-300">?? Charger le Profil � Mehdi � (AURA FIT � Rang B � 320 ??)</div>
                <div class="text-[10px] text-slate-300 mt-0.5">
                  25 ans � 182 cm � 78.5 kg � 5j ?? � PRs : Couch� 92.5kg�6, Squat 125kg�4, Terre 145kg�4.
                </div>
              </div>
              <span class="text-xs font-black text-amber-300">Rang B</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-2.5 sm:p-4 animate-fade-in">
        <div class="bg-[#111722] border-2 border-amber-500/40 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <!-- En-t�te de l'assistant -->
          <div class="px-4 pt-3.5 pb-2.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">?</span>
              <span class="text-xs font-black text-white uppercase tracking-wider">Initialisation Tactique & Tutoriel</span>
            </div>
            <button
              onclick="IronPulse.App.finishOnboarding('demo')"
              class="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800"
              title="Passer l'introduction"
            >
              Passer ?
            </button>
          </div>

          <!-- Barre de progression des 5 �tapes -->
          <div class="px-4 py-2 bg-[#0E1420] border-b border-slate-800/80 grid grid-cols-5 gap-1 shrink-0">
            ${stepLabels
              .map((s) => {
                const isCurrent = s.n === step;
                const isDone = s.n < step;
                return `
                  <button
                    onclick="IronPulse.App.setOnboardingStep(${s.n})"
                    class="py-1 px-1 rounded-lg text-center transition ${
                      isCurrent
                        ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300'
                        : isDone
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-500'
                    }"
                  >
                    <div class="text-[9px] font-black">${isDone ? '?' : s.n}. ${s.label}</div>
                  </button>
                `;
              })
              .join('')}
          </div>

          <!-- Corps d�filant de l'�tape -->
          <div class="p-4 overflow-y-auto flex-1">
            ${stepContentHtml}
          </div>

          <!-- Pied de modale (Navigation Pr�c�dent / Suivant) -->
          ${
            step < 5
              ? `
            <div class="px-4 py-3 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
              ${
                step > 1
                  ? `<button onclick="IronPulse.App.setOnboardingStep(${step - 1})" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700">? Retour</button>`
                  : `<button onclick="IronPulse.App.setOnboardingStep(4)" class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-400 border border-slate-800">Aller au Tutoriel ?</button>`
              }
              <button
                onclick="IronPulse.App.setOnboardingStep(${step + 1})"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:opacity-95 text-xs font-black text-slate-950 shadow-lg transition"
              >
                Continuer (${step}/5) ?
              </button>
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  function render() {
    const root = document.getElementById('app-root');
    if (!root) return;

    const state = ns.Storage.getState();
    const hasActiveWorkout = !!state.activeWorkout;

    let screenHtml = '';
    switch (ui.currentTab) {
      case 'home':
        screenHtml = renderHomeScreen();
        break;
      case 'rpg':
        screenHtml = renderRPGScreen();
        break;
      case 'exercises':
        screenHtml = renderExercisesScreen();
        break;
      case 'programs':
        screenHtml = renderProgramsScreen();
        break;
      case 'workout':
        screenHtml = renderWorkoutScreen();
        break;
      case 'history':
        screenHtml = renderHistoryScreen();
        break;
      case 'progress':
        screenHtml = renderProgressAndAIScreen();
        break;
      case 'profile':
        screenHtml = renderProfileScreen();
        break;
      default:
        screenHtml = renderHomeScreen();
    }

    const navItems = [
      { id: 'home', label: 'H�ros', icon: '???' },
      { id: 'rpg', label: 'Guildes', icon: '??' },
      { id: 'workout', label: hasActiveWorkout ? 'S�ance !' : 'S�ance', icon: '?', highlight: hasActiveWorkout },
      { id: 'programs', label: 'Campagnes', icon: '???' },
      { id: 'progress', label: 'Oracle IA', icon: '??' }
    ];

    const heroQuick = ns.RPG ? ns.RPG.getHeroProfile() : null;
    if (typeof window !== 'undefined' && window.innerWidth <= 500) {
      ui.frameMode = 'full';
    }
    root.className = ui.frameMode === 'framed' ? 'app-shell-framed' : 'app-shell-full';

    root.innerHTML = `
      <!-- Barre d'�tat sup�rieure harmonis�e Shonen / Radar Tactique -->
      <header class="shonen-top-header px-3.5 pt-2.5 pb-2 flex items-center justify-between shrink-0 z-20 border-b border-cyan-500/20 bg-[#060912]/95 backdrop-blur-xl">
        <div onclick="IronPulse.App.navigate('home')" class="flex items-center gap-2 cursor-pointer">
          <img src="./src/icon.svg?v=5.1" alt="ALTHER FIT" class="w-8 h-8 rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-400/50 object-cover shrink-0" />
          <div>
            <span class="text-sm font-black tracking-tight text-white font-mono">ALTHER <span class="text-cyan-400">FIT</span> <span class="text-[10.5px] text-amber-400 font-extrabold uppercase tracking-wider">ALTR</span></span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            onclick="IronPulse.App.openOnboardingWizard(4)"
            class="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 transition flex items-center gap-1"
            title="Ouvrir le Tutoriel & Questionnaire"
          >
            <span>??</span><span>Tuto</span>
          </button>
          <button
            onclick="IronPulse.App.navigate('history')"
            class="px-2 py-1 rounded-lg text-xs font-bold transition ${
              ui.currentTab === 'history'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/70'
            }"
            title="Historique des séances"
          >
            📅
          </button>
          <button
            onclick="IronPulse.App.navigate('profile')"
            class="px-2 py-1 rounded-lg text-[11px] font-bold transition ${
              ui.currentTab === 'profile'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-700/70'
            }"
            title="Profil & Param�tres"
          >
            ??
          </button>
          <button
            onclick="IronPulse.App.toggleFrameMode()"
            class="hidden sm:inline-flex px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-[10px] text-slate-300 font-medium"
            title="Basculer Cadre Mobile / Large"
          >
            ${ui.frameMode === 'framed' ? '?' : '??'}
          </button>
        </div>
      </header>

      <!-- Contenu d�filant de l'�cran actif -->
      <main class="flex-1 overflow-y-auto px-3 pt-3 pb-3">
        ${renderGuidedTourBanner()}
        ${screenHtml}
      </main>

      <!-- Bandeau flottant du Minuteur de Repos -->
      <div id="rest-timer-bar" class="hidden"></div>

      <!-- Barre de navigation inf�rieure (Dock Shonen 5 Onglets - Image 2) -->
      <nav class="app-bottom-nav shonen-bottom-dock px-1.5 py-1.5 grid grid-cols-5 gap-1 shrink-0 z-20 border-t border-cyan-500/20 bg-[#060912]/95 backdrop-blur-xl">
        ${navItems
          .map((item) => {
            const active = ui.currentTab === item.id;
            return `
            <button
              onclick="IronPulse.App.navigate('${item.id}')"
              class="shonen-nav-btn flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
                active ? 'shonen-nav-active text-cyan-300 font-extrabold bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]' : 'text-slate-400 hover:text-slate-200 font-medium'
              }"
            >
              ${
                item.highlight
                  ? `<span class="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>`
                  : ''
              }
              <span class="text-base leading-none mb-1">${item.icon}</span>
              <span class="text-[9px] font-black uppercase tracking-wider truncate max-w-full px-0.5">${item.label}</span>
            </button>
          `;
          })
          .join('')}
      </nav>

      <!-- Modale �ventuelle ou Assistant Premi�re Utilisation -->
      ${ui.onboardingOpen ? renderOnboardingWizardModal() : renderModal()}
    `;

    updateRestTimerDOM();
    if (ns.Hero3D && ns.Hero3D.renderNow) {
      ns.Hero3D.renderNow();
    }
  }

  // Mise � jour chaque seconde de l'horloge de s�ance en cours
  function startWorkoutClockTicker() {
    if (workoutElapsedInterval) clearInterval(workoutElapsedInterval);
    workoutElapsedInterval = setInterval(() => {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const clockEl = document.getElementById('live-workout-clock');
      if (clockEl) {
        const sec = Math.floor((Date.now() - state.activeWorkout.startedAt) / 1000);
        clockEl.textContent = formatDurationClock(sec);
      }
    }, 1000);
  }

  // ============================================================================
  // ACTIONS PUBLIQUES DE L'APPLICATION
  // ============================================================================
  ns.App = {
    init() {
      const state = ns.Storage.getState();
      if (!state.profile.onboardingCompleted) {
        ui.onboardingOpen = true;
        ui.onboardingStep = 1;
      }
      startWorkoutClockTicker();
      if (ns.Hero3D) ns.Hero3D.startLoop();
      render();
    },

    openOnboardingWizard(step = 1) {
      ui.onboardingOpen = true;
      ui.onboardingStep = Number(step) || 1;
      ui.tutorialSlideIdx = 0;
      render();
    },

    setOnboardingStep(step) {
      ui.onboardingStep = Math.max(1, Math.min(5, Number(step) || 1));
      render();
    },

    setTutorialSlide(idx) {
      ui.tutorialSlideIdx = Math.max(0, Math.min(TUTORIAL_SLIDES.length - 1, Number(idx) || 0));
      render();
    },

    updateOnboardingField(field, value) {
      const state = ns.Storage.getState();
      state.profile[field] = value;
      // Calibration automatique du programme et du temps de repos selon l'objectif et le niveau
      if (field === 'level' || field === 'goal' || field === 'weeklyTarget') {
        state.profile.activeProgramId = recommendProgramForProfile(state.profile);
        if (state.profile.goal === 'strength') {
          state.profile.defaultRestSeconds = 150;
        } else if (state.profile.goal === 'fatloss' || state.profile.goal === 'fitness') {
          state.profile.defaultRestSeconds = 60;
        } else {
          state.profile.defaultRestSeconds = 90;
        }
      }
      ns.Storage.saveState();
      if (field === 'name' || field === 'age' || field === 'heightCm' || field === 'bodyWeightKg') {
        const scouterEl = document.getElementById('onb-scouter-card');
        if (scouterEl) {
          scouterEl.innerHTML = renderOnboardingScouterCardHTML(computeBiometricSummary(state.profile));
        }
      } else {
        render();
      }
    },

    updateOnboardingTargetMorphology(morphId) {
      const state = ns.Storage.getState();
      state.profile.targetMorphology = morphId;
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.appearance = state.rpg.appearance || {};
      state.rpg.appearance.morphology = morphId;
      ns.Storage.saveState();
      render();
    },

    selectOnboardingEquipment(equipId) {
      const state = ns.Storage.getState();
      state.profile.availableEquipment = equipId;
      ns.Storage.saveState();
      render();
    },

    finishOnboarding(mode = 'guided') {
      const state = ns.Storage.getState();
      state.profile.onboardingCompleted = true;
      state.profile.activeProgramId = recommendProgramForProfile(state.profile);

      if (mode === 'fresh') {
        // Compte vierge Niveau 1 (premi�re utilisation r�elle sans historique de d�mo)
        state.history = [];
        state.activeWorkout = null;
        if (state.rpg) {
          state.rpg.bonusXpEarned = 0;
          state.rpg.equippedRelics = [];
          state.rpg.claimedChallengeIds = [];
        }
        ui.guidedTourActive = true;
        ui.guidedTourStep = 0;
        ui.currentTab = 'home';
      } else if (mode === 'guided') {
        ui.guidedTourActive = true;
        ui.guidedTourStep = 0;
        ui.currentTab = GUIDED_TOUR_STEPS[0].tab;
      } else {
        ui.guidedTourActive = false;
      }

      ui.onboardingOpen = false;
      ns.Storage.saveState();
      if (ns.Hero3D && ns.Hero3D.triggerPowerBurst) {
        ns.Hero3D.triggerPowerBurst();
      }
      render();
    },

    startGuidedTour() {
      ui.onboardingOpen = false;
      ui.guidedTourActive = true;
      ui.guidedTourStep = 0;
      ui.currentTab = GUIDED_TOUR_STEPS[0].tab;
      render();
    },

    nextGuidedTourStep() {
      const next = (ui.guidedTourStep || 0) + 1;
      if (next >= GUIDED_TOUR_STEPS.length) {
        ui.guidedTourActive = false;
      } else {
        ui.guidedTourStep = next;
        ui.currentTab = GUIDED_TOUR_STEPS[next].tab;
      }
      render();
    },

    prevGuidedTourStep() {
      const prev = Math.max(0, (ui.guidedTourStep || 0) - 1);
      ui.guidedTourStep = prev;
      ui.currentTab = GUIDED_TOUR_STEPS[prev].tab;
      render();
    },

    closeGuidedTour() {
      ui.guidedTourActive = false;
      render();
    },

    refresh() {
      render();
    },

    setWorkout3DExercise(idx) {
      ui.activeWorkout3DExerciseIdx = Number(idx) || 0;
      render();
    },

    navigate(tab) {
      ui.currentTab = tab;
      render();
    },

    openAICoachTab() {
      ui.currentTab = 'progress';
      ui.progressSubTab = 'ai';
      render();
    },

    toggleFrameMode() {
      ui.frameMode = ui.frameMode === 'framed' ? 'full' : 'framed';
      render();
    },

    setHeroDisplayMode(mode) {
      ui.heroDisplayMode = mode === '3d' ? '3d' : 'art';
      render();
    },

    // --- Actions R�pertoire d'exercices ---
    onExerciseSearch(val) {
      ui.exerciseSearch = val;
      render();
      const input = document.querySelector('input[placeholder*="Rechercher un exercice"]');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    },

    setExerciseMuscle(m) {
      ui.selectedMuscle = m;
      render();
    },

    setExerciseEquipment(eq) {
      ui.selectedEquipment = eq;
      render();
    },

    openExerciseModal(exerciseId) {
      ui.modal = { type: 'exercise-detail', data: { exerciseId } };
      render();
    },

    openCreateExerciseModal() {
      ui.modal = { type: 'create-exercise', data: {} };
      render();
    },

    saveNewExercise() {
      const nameEl = document.getElementById('new-ex-name');
      const muscleEl = document.getElementById('new-ex-muscle');
      const equipEl = document.getElementById('new-ex-equip');
      const primaryEl = document.getElementById('new-ex-primary');
      const descEl = document.getElementById('new-ex-desc');

      const name = (nameEl ? nameEl.value : '').trim();
      if (!name) return;

      const state = ns.Storage.getState();
      const newEx = {
        id: 'ex-custom-' + Date.now(),
        name,
        muscleGroup: muscleEl ? muscleEl.value : 'Pectoraux',
        primaryMuscles: (primaryEl && primaryEl.value ? primaryEl.value : 'Muscle cibl�').split(',').map((s) => s.trim()),
        secondaryMuscles: [],
        equipment: equipEl ? equipEl.value : 'Halt�res',
        level: 'Interm�diaire',
        defaultRest: 90,
        description: (descEl && descEl.value ? descEl.value : 'Exercice personnalis� ajout� au r�pertoire.').trim(),
        instructions: [
          'Adoptez une posture stable et un gainage actif.',
          'Contr�lez la phase excentrique (descente) sur 2 secondes.',
          'Expirez lors de la phase concentrique (effort).'
        ],
        tips: 'Gardez une amplitude ma�tris�e et sans douleur articulaire.'
      };

      state.exercises.unshift(newEx);
      ns.Storage.saveState();
      ui.modal = null;
      render();
    },

    // --- Actions Programmes & S�ances Personnalis�es ---
    setProgramSubTab(sub) {
      ui.programSubTab = sub;
      render();
    },

    setProgramGoalFilter(g) {
      ui.filterGoal = g;
      render();
    },

    setProgramLevelFilter(l) {
      ui.filterLevel = l;
      render();
    },

    selectActiveProgram(progId) {
      const state = ns.Storage.getState();
      state.profile.activeProgramId = progId;
      ns.Storage.saveState();
      render();
    },

    startProgramSession(progId, sessId) {
      const prog = ns.Data.PREDEFINED_PROGRAMS.find((p) => p.id === progId);
      if (!prog) return;
      const sess = prog.sessions.find((s) => s.id === sessId);
      if (!sess) return;
      startWorkoutFromTemplate(sess, progId);
    },

    startCustomSession(sessId) {
      const state = ns.Storage.getState();
      const sess = state.customSessions.find((s) => s.id === sessId);
      if (!sess) return;
      startWorkoutFromTemplate(sess, null);
    },

    startEmptyWorkout() {
      startEmptyWorkout();
    },

    openCreateSessionModal() {
      ui.modal = {
        type: 'create-session',
        data: {
          name: 'Ma S�ance Personnalis�e',
          exercises: [
            { exerciseId: 'ex-bench-press', targetSets: 3, targetReps: '8-10', restSeconds: 120 },
            { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90 }
          ]
        }
      };
      render();
    },

    updateSessionDraftName(val) {
      if (ui.modal && ui.modal.type === 'create-session') {
        ui.modal.data.name = val;
      }
    },

    addDraftExercise(exId) {
      if (!ui.modal || ui.modal.type !== 'create-session') return;
      const ex = ns.Storage.getExerciseById(exId);
      ui.modal.data.exercises.push({
        exerciseId: exId,
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: ex.defaultRest || 90
      });
      render();
    },

    removeDraftExercise(idx) {
      if (!ui.modal || ui.modal.type !== 'create-session') return;
      ui.modal.data.exercises.splice(idx, 1);
      render();
    },

    updateDraftExField(idx, field, val) {
      if (!ui.modal || ui.modal.type !== 'create-session') return;
      if (ui.modal.data.exercises[idx]) {
        ui.modal.data.exercises[idx][field] = val;
      }
    },

    saveCustomSessionDraft() {
      if (!ui.modal || ui.modal.type !== 'create-session') return;
      const draft = ui.modal.data;
      if (!draft.exercises.length) return;
      const state = ns.Storage.getState();
      state.customSessions.unshift({
        id: 'custom-' + Date.now(),
        name: (draft.name || 'S�ance Personnalis�e').trim(),
        estimatedMinutes: draft.exercises.length * 10 + 5,
        isCustom: true,
        exercises: draft.exercises
      });
      ns.Storage.saveState();
      ui.modal = null;
      ui.programSubTab = 'custom';
      render();
    },

    deleteCustomSession(sessId) {
      const state = ns.Storage.getState();
      state.customSessions = state.customSessions.filter((s) => s.id !== sessId);
      ns.Storage.saveState();
      render();
    },

    // --- Actions S�ance en cours (Live Workout) ---
    updateWorkoutName(val) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      state.activeWorkout.name = val.trim() || 'S�ance';
      ns.Storage.saveState();
    },

    updateWorkoutNotes(val) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      state.activeWorkout.notes = val;
      ns.Storage.saveState();
    },

    updateWorkoutSet(exIdx, setIdx, field, val) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const set = state.activeWorkout.exercises[exIdx]?.sets[setIdx];
      if (!set) return;
      set[field] = Number(val) >= 0 ? Number(val) : 0;
      ns.Storage.saveState();
      render();
    },

    nudgeWorkoutSet(exIdx, setIdx, field, delta) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const set = state.activeWorkout.exercises[exIdx]?.sets[setIdx];
      if (!set) return;
      const cur = Number(set[field]) || 0;
      set[field] = Math.max(0, Math.round((cur + Number(delta)) * 10) / 10);
      ns.Storage.saveState();
      render();
    },

    openWarmupModal() {
      ui.modal = { type: 'warmup-protocol', data: {} };
      render();
    },

    completeWarmupProtocol() {
      const state = ns.Storage.getState();
      if (state.activeWorkout && !state.activeWorkout.warmupCompleted) {
        state.activeWorkout.warmupCompleted = true;
        if (ns.RPG) ns.RPG.ensureRpgState(state);
        state.rpg.bonusXpEarned = (Number(state.rpg.bonusXpEarned) || 0) + 35;
        state.rpg.goldBonus = (Number(state.rpg.goldBonus) || 0) + 15;
        state.rpg.gauvaxPose = 'effort';
        ns.Storage.saveState();
      }
      ui.modal = null;
      if (ns.Hero3D && ns.Hero3D.triggerPowerBurst) ns.Hero3D.triggerPowerBurst();
      render();
    },

    toggleSetCompleted(exIdx, setIdx) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const exBlock = state.activeWorkout.exercises[exIdx];
      const set = exBlock?.sets[setIdx];
      if (!set) return;

      set.completed = !set.completed;
      ui.activeWorkout3DExerciseIdx = exIdx;
      if (ns.RPG) {
        ns.RPG.ensureRpgState(state);
        state.rpg.gauvaxPose = set.completed ? 'victoire' : 'effort';
      }
      ns.Storage.saveState();

      if (set.completed) {
        if (ns.Hero3D) ns.Hero3D.triggerPowerBurst();
        const ex = ns.Storage.getExerciseById(exBlock.exerciseId);
        startRestTimer(set.restSeconds || exBlock.restSeconds || state.profile.defaultRestSeconds || 90, ex.name);
      }
      render();
    },

    addWorkoutSet(exIdx) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const exBlock = state.activeWorkout.exercises[exIdx];
      if (!exBlock) return;
      const lastSet = exBlock.sets[exBlock.sets.length - 1] || { weight: 20, reps: 10, restSeconds: 90 };
      exBlock.sets.push({
        weight: lastSet.weight,
        reps: lastSet.reps,
        rpe: 8,
        restSeconds: lastSet.restSeconds || exBlock.restSeconds || 90,
        completed: false
      });
      ns.Storage.saveState();
      render();
    },

    removeWorkoutSet(exIdx, setIdx) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const exBlock = state.activeWorkout.exercises[exIdx];
      if (!exBlock || exBlock.sets.length <= 1) return;
      exBlock.sets.splice(setIdx, 1);
      ns.Storage.saveState();
      render();
    },

    removeWorkoutExercise(exIdx) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      state.activeWorkout.exercises.splice(exIdx, 1);
      ns.Storage.saveState();
      render();
    },

    openAddExerciseToWorkoutModal() {
      ui.modal = { type: 'add-workout-exercise', data: {} };
      render();
    },

    addExerciseToActiveWorkout(exId) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      const ex = ns.Storage.getExerciseById(exId);
      const lastPerf = ns.Storage.getLastPerformanceForExercise(exId);
      const defaultWeight = lastPerf && lastPerf.sets[0] ? lastPerf.sets[0].weight : 20;
      const defaultReps = lastPerf && lastPerf.sets[0] ? lastPerf.sets[0].reps : 10;

      state.activeWorkout.exercises.push({
        exerciseId: exId,
        targetReps: '8-12',
        restSeconds: ex.defaultRest || 90,
        note: '',
        sets: [
          { weight: defaultWeight, reps: defaultReps, rpe: 8, restSeconds: ex.defaultRest || 90, completed: false },
          { weight: defaultWeight, reps: defaultReps, rpe: 8, restSeconds: ex.defaultRest || 90, completed: false },
          { weight: defaultWeight, reps: defaultReps, rpe: 8, restSeconds: ex.defaultRest || 90, completed: false }
        ]
      });
      ns.Storage.saveState();
      ui.modal = null;
      ui.currentTab = 'workout';
      render();
    },

    triggerManualRest(seconds, exName) {
      startRestTimer(seconds, exName);
    },

    adjustRest(delta) {
      adjustRestTimer(delta);
    },

    skipRest() {
      stopRestTimer();
    },

    finishActiveWorkout() {
      const state = ns.Storage.getState();
      const workout = state.activeWorkout;
      if (!workout) return;

      const durationMin = Math.max(1, Math.round((Date.now() - workout.startedAt) / 60000));

      // Conserver les s�ries valid�es (ou toutes les s�ries si l'utilisateur a oubli� de cocher)
      const cleanedExercises = workout.exercises
        .map((eb) => {
          const anyCompleted = eb.sets.some((s) => s.completed);
          const setsToSave = (anyCompleted ? eb.sets.filter((s) => s.completed) : eb.sets).map((s) => ({
            weight: Number(s.weight) || 0,
            reps: Number(s.reps) || 0,
            rpe: Number(s.rpe) || 8,
            restSeconds: Number(s.restSeconds) || 90,
            completed: true
          }));
          return {
            exerciseId: eb.exerciseId,
            sets: setsToSave
          };
        })
        .filter((eb) => eb.sets.length > 0);

      let earnedXp = 0;
      let statsSummary = { totalVolume: 0, completedSets: 0 };

      if (cleanedExercises.length > 0) {
        const savedWorkout = {
          id: 'hist-' + Date.now(),
          name: workout.name,
          programId: workout.programId,
          date: new Date().toISOString(),
          durationMinutes: durationMin,
          notes: workout.notes || '',
          exercises: cleanedExercises
        };
        state.history.push(savedWorkout);
        statsSummary = ns.Storage.computeWorkoutStats(savedWorkout);
        if (ns.RPG) {
          ns.RPG.ensureRpgState(state);
          const heroBefore = ns.RPG.getHeroProfile();
          earnedXp = ns.RPG.computeWorkoutXP(savedWorkout, heroBefore.classObj, heroBefore.activeRelicBonusPct);
          state.rpg.goldBonus = (Number(state.rpg.goldBonus) || 0) + 75;
          state.rpg.gauvaxPose = 'level_up';
        }
      }

      const earnedGold = cleanedExercises.length > 0 ? 75 + statsSummary.completedSets * 5 : 0;
      state.activeWorkout = null;
      stopRestTimer();
      ns.Storage.saveState();
      ui.currentTab = 'history';
      if (cleanedExercises.length > 0) {
        ui.modal = {
          type: 'workout-rpg-reward',
          data: {
            workoutName: workout.name,
            earnedXp,
            earnedGold,
            totalVolume: statsSummary.totalVolume,
            completedSets: statsSummary.completedSets,
            durationMin
          }
        };
      }
      render();
    },

    cancelActiveWorkout() {
      const state = ns.Storage.getState();
      state.activeWorkout = null;
      stopRestTimer();
      ns.Storage.saveState();
      ui.currentTab = 'home';
      render();
    },

    // --- Actions P�riodisation AURA FIT ---
    selectPeriodizationPhase(phaseId) {
      const state = ns.Storage.getState();
      state.profile.periodizationPhase = phaseId;
      ns.Storage.saveState();
      render();
    },

    setPeriodizationWeek(weekNum) {
      const state = ns.Storage.getState();
      state.profile.periodizationWeek = Number(weekNum) || 1;
      ns.Storage.saveState();
      render();
    },

    // --- Actions GAUVAX 16-Bit & Dressing AURA FIT ---
    setGauvaxPose(poseId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.gauvaxPose = poseId;
      ns.Storage.saveState();
      render();
    },

    buyOrEquipWardrobeItem(itemId) {
      const state = ns.Storage.getState();
      if (!ns.RPG) return;
      ns.RPG.ensureRpgState(state);
      const hero = ns.RPG.getHeroProfile();
      const item = (hero.wardrobeStatus || []).find((w) => w.id === itemId);
      if (!item) return;

      if (!item.unlocked) {
        if (!item.canBuy) return;
        state.rpg.goldSpent = (Number(state.rpg.goldSpent) || 0) + item.priceGold;
        if (!state.rpg.unlockedItems.includes(item.id)) {
          state.rpg.unlockedItems.push(item.id);
        }
      }

      if (item.slot === 'outfit') {
        state.rpg.equippedOutfit = item.id;
      } else if (item.slot === 'accessory') {
        state.rpg.equippedAccessory = item.id;
      } else if (item.slot === 'background') {
        state.rpg.equippedBackground = item.id;
      }
      state.rpg.gauvaxPose = 'victoire';
      ns.Storage.saveState();
      render();
    },

    loadMehdiProfile() {
      stopRestTimer();
      ns.Storage.loadMehdiPreset();
      ui.onboardingOpen = false;
      ui.guidedTourActive = false;
      ui.currentTab = 'home';
      render();
    },

    exportAntigravityMarkdown() {
      const state = ns.Storage.getState();
      const hero = ns.RPG ? ns.RPG.getHeroProfile() : {};
      const bio = computeBiometricSummary(state.profile || {});
      const md = [
        '# AURA FIT � IRONPULSE Z � Export Sp�cification & Statut Antigravity',
        '',
        `## 1. Profil Chasseur (${state.profile.name || 'Mehdi'})`,
        `- **Rang Isekai** : [${hero.rank?.tier || 'B'}] � ${hero.rank?.name || 'Chasseur'}`,
        `- **Niveau** : ${hero.level || 4} (${hero.totalXp || 0} XP) � **Puissance de Combat (CP)** : ${hero.combatPower || 0}`,
        `- **Or** : ${hero.gold || 0} ?? � **S�rie** : ${hero.streakDays || 0} jours ??`,
        `- **HP / MP** : ${hero.hpCurrent || 0}/${hero.hpMax || 0} HP � ${hero.mpCurrent || 0}/${hero.mpMax || 0} MP`,
        `- **Attributs** : FOR ${hero.attributes?.FOR || 0} | END ${hero.attributes?.END || 0} | VIT ${hero.attributes?.VIT || 0} | AGI ${hero.attributes?.AGI || 0} | INT ${hero.attributes?.INT || 0}`,
        `- **Biom�trie & Nutrition** : ${bio.age} ans � ${bio.heightCm} cm � ${bio.weightKg} kg � IMC ${bio.bmi} � BMR ${bio.bmr} kcal � Cible ${bio.targetKcal} kcal/j (P: ${bio.proteinG}g / G: ${bio.carbsG}g / L: ${bio.fatG}g)`,
        '',
        '## 2. Dump JSON Complet',
        '```json',
        JSON.stringify(state, null, 2),
        '```'
      ].join('\n');

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aura-fit-antigravity-export-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },

    // --- Actions Historique ---
    repeatHistoryWorkout(histId) {
      const state = ns.Storage.getState();
      const past = state.history.find((h) => h.id === histId);
      if (!past) return;
      const template = {
        name: past.name,
        exercises: (past.exercises || []).map((eb) => ({
          exerciseId: eb.exerciseId,
          targetSets: eb.sets.length || 3,
          targetReps: eb.sets[0] ? String(eb.sets[0].reps) : '10',
          restSeconds: eb.sets[0]?.restSeconds || 90
        }))
      };
      startWorkoutFromTemplate(template, past.programId);
    },

    deleteHistoryWorkout(histId) {
      const state = ns.Storage.getState();
      state.history = state.history.filter((h) => h.id !== histId);
      ns.Storage.saveState();
      render();
    },

    // --- Actions Progression & Coach IA ---
    setProgressSubTab(sub) {
      ui.progressSubTab = sub;
      render();
    },

    setChartExercise(exId) {
      ui.selectedChartExerciseId = exId;
      render();
    },

    setChartMetric(m) {
      ui.selectedChartMetric = m;
      render();
    },

    setAICustomQuestion(val) {
      ui.aiCustomQuestion = val;
    },

    async submitAIQuestion() {
      const q = (ui.aiCustomQuestion || '').trim() || 'Analyse mes s�ances et propose des ajustements prudents.';
      await this.askAI(q);
    },

    async askAI(questionText) {
      if (ui.aiLoading) return;
      ui.aiLoading = true;
      ui.aiCustomQuestion = '';
      render();

      const res = await ns.AICoach.askGeminiCoach(questionText);
      const state = ns.Storage.getState();
      state.aiConversationHistory.unshift({
        id: 'ai-' + Date.now(),
        question: questionText,
        answer: res.text,
        source: res.source,
        errorNote: res.errorNote || null,
        date: new Date().toISOString()
      });
      ns.Storage.saveState();
      ui.aiLoading = false;
      render();
    },

    // --- Actions Profil & Google AI Studio ---
    updateProfileField(field, value) {
      const state = ns.Storage.getState();
      state.profile[field] = value;
      ns.Storage.saveState();
      render();
    },

    toggleShowApiKey() {
      ui.showApiKey = !ui.showApiKey;
      render();
    },

    async testGeminiApiKey() {
      const state = ns.Storage.getState();
      const key = (state.profile.geminiApiKey || '').trim();
      const model = state.profile.geminiModel || 'gemini-2.5-flash';
      if (!key) {
        ui.geminiTestResult = { success: false, message: 'Veuillez saisir votre cl� API Google AI Studio d\'abord.' };
        render();
        return;
      }
      ui.geminiTesting = true;
      ui.geminiTestResult = null;
      render();

      const result = await ns.AICoach.testGeminiApiKey(key, model);
      ui.geminiTesting = false;
      if (result.success) {
        ui.geminiTestResult = {
          success: true,
          message: `Connexion Google AI Studio r�ussie avec le mod�le ${result.model} !`
        };
      } else {
        ui.geminiTestResult = {
          success: false,
          message: `�chec : ${result.error}`
        };
      }
      render();
    },

    exportDataJson() {
      const state = ns.Storage.getState();
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ironpulse-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    resetDemoData() {
      stopRestTimer();
      ns.Storage.resetToDemoData();
      ui.currentTab = 'home';
      ui.onboardingOpen = true;
      ui.onboardingStep = 1;
      ui.guidedTourActive = false;
      render();
    },

    // --- Actions RPG (H�ros, Reliques, D�fis & Guilde) ---
    setRpgSubTab(sub) {
      ui.rpgSubTab = sub;
      render();
    },

    openRpgSubTab(sub) {
      ui.currentTab = 'rpg';
      ui.rpgSubTab = sub;
      render();
    },

    selectHeroClass(classId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.heroClass = classId;
      const cls = ns.RPG?.HERO_CLASSES?.find((c) => c.id === classId);
      if (cls && cls.defaultAura) {
        state.rpg.appearance = state.rpg.appearance || {};
        state.rpg.appearance.auraStyle = cls.defaultAura;
      }
      ns.Storage.saveState();
      render();
    },

    updateHeroAppearance(field, value) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.appearance = state.rpg.appearance || {};
      state.rpg.appearance[field] = value;
      ns.Storage.saveState();
      render();
    },

    applyMangaArchetype(archetypeId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.appearance = state.rpg.appearance || {};
      const archetype = (ns.RPG.MANGA_ARCHETYPES || []).find((a) => a.id === archetypeId);
      if (!archetype) return;
      Object.assign(state.rpg.appearance, archetype.appearance);
      ns.Storage.saveState();
      if (ns.Audio) ns.Audio.playLevelUp();
      render();
    },

    applyCustomGlbModel() {
      const input = document.getElementById('custom-glb-url-input');
      const val = input ? input.value.trim() : '';
      if (!val) {
        if (ns.Audio) ns.Audio.playTap();
        return;
      }
      this.updateHeroAppearance('customModelGlb', val);
      if (ns.Audio) ns.Audio.playLevelUp();
    },

    clearCustomGlbModel() {
      this.updateHeroAppearance('customModelGlb', '');
      if (ns.Audio) ns.Audio.playTap();
    },

    togglePowerEquipment(equipId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      state.rpg.appearance = state.rpg.appearance || {};
      let list = state.rpg.appearance.powerEquipments || [];
      if (!Array.isArray(list)) list = [];
      const idx = list.indexOf(equipId);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(equipId);
      }
      state.rpg.appearance.powerEquipments = list;
      ns.Storage.saveState();
      render();
    },

    toggleEquipRelic(relicId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      const list = state.rpg.equippedRelics || [];
      const idx = list.indexOf(relicId);
      if (idx >= 0) {
        list.splice(idx, 1);
      } else {
        list.push(relicId);
      }
      state.rpg.equippedRelics = list;
      ns.Storage.saveState();
      render();
    },

    claimChallengeReward(challengeId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      if (!state.rpg.claimedChallengeIds.includes(challengeId)) {
        const ch = state.rpg.activeChallenges.find((c) => c.id === challengeId);
        state.rpg.claimedChallengeIds.push(challengeId);
        state.rpg.bonusXpEarned = (Number(state.rpg.bonusXpEarned) || 0) + (ch ? Number(ch.rewardXp) || 250 : 250);
        ns.Storage.saveState();
      }
      render();
    },

    openCreateChallengeModal() {
      ui.modal = { type: 'create-challenge', data: {} };
      render();
    },

    saveNewChallenge() {
      const friendEl = document.getElementById('chal-friend-name');
      const titleEl = document.getElementById('chal-title');
      const typeEl = document.getElementById('chal-type');
      const targetEl = document.getElementById('chal-target');

      const friendName = (friendEl && friendEl.value ? friendEl.value : 'Sora (Monarque Niv. 8)').trim();
      const title = (titleEl && titleEl.value ? titleEl.value : 'Duel des Chasseurs').trim();
      const type = typeEl ? typeEl.value : 'volume7d';
      const targetValue = Math.max(1, Number(targetEl ? targetEl.value : 15000) || 15000);

      const unitMap = {
        volume7d: 'kg',
        sets7d: 's�ries',
        workouts7d: 's�ances'
      };

      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);

      state.rpg.activeChallenges.unshift({
        id: 'chal-' + Date.now(),
        friendName,
        friendAvatar: '??',
        title,
        type,
        targetValue,
        friendValue: Math.round(targetValue * 0.55),
        unit: unitMap[type] || 'kg',
        rewardXp: 250,
        daysLeft: 7
      });

      ns.Storage.saveState();
      ui.modal = null;
      ui.rpgSubTab = 'guild';
      render();
    },

    openSwitchClubModal() {
      ui.modal = { type: 'switch-club', data: {} };
      render();
    },

    selectClub(clubId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      const presetClubs = (ns.RPG && ns.RPG.PRESET_CLUBS) || [];
      const club = presetClubs.find((c) => c.id === clubId);
      if (club) {
        state.rpg.clubId = club.id;
        state.rpg.guildName = club.name;
        state.rpg.guildMotto = club.motto;
        state.rpg.guildTier = club.tier;
        ns.Storage.saveState();
      }
      ui.modal = null;
      render();
    },

    claimClubChallenge(chalId) {
      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);
      const challenges = state.rpg.clubChallenges || [];
      const targetChal = challenges.find((c) => c.id === chalId);
      if (targetChal && !targetChal.claimed) {
        targetChal.claimed = true;
        if (ns.RPG && ns.RPG.awardExperience) {
          ns.RPG.awardExperience(targetChal.rewardXp || 200, targetChal.title || 'D�fi de Club accompli');
        }
        if (typeof state.rpg.gold === 'number') {
          state.rpg.gold += (targetChal.rewardGold || 100);
        }
        ns.Storage.saveState();
        if (ns.Hero3D && ns.Hero3D.triggerPowerBurst) {
          ns.Hero3D.triggerPowerBurst();
        }
        render();
      }
    },

    shareHunterChallenge(chalTitle, targetDesc) {
      const shareData = {
        title: 'IronPulse Z � D�fi Chasseur',
        text: `?? Je te d�fie sur IronPulse Z : "${chalTitle || 'D�fi Chasseur'}" (${targetDesc || 'Rejoins mon dojo'}). Pr�t � mesurer ton tonnage ?`,
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${shareData.text} � ${shareData.url}`).then(() => {
          alert('? D�fi copi� dans le presse-papier ! Partage-le � ton rival.');
        }).catch(() => {
          alert(`D�fi : ${shareData.text}`);
        });
      } else {
        alert(`D�fi : ${shareData.text}`);
      }
    },

    exportBackup() {
      if (ns.Storage && ns.Storage.exportBackupJSON) {
        ns.Storage.exportBackupJSON();
      }
    },

    exportIronPulseBackup() {
      if (ns.Storage && ns.Storage.exportIronPulseSecureBackup) {
        ns.Storage.exportIronPulseSecureBackup();
      }
    },

    importIronPulseFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target.result;
        if (ns.Storage && ns.Storage.importIronPulseSecureBackup) {
          const res = await ns.Storage.importIronPulseSecureBackup(content);
          if (res.success) {
            alert(`? Profil IronPulse de ${res.heroName} (Niv. ${res.level}) restaur� avec int�grit� valid�e !`);
            render();
          } else {
            alert('?? ' + (res.error || 'Erreur lors de la restauration.'));
          }
        }
      };
      reader.readAsText(file);
    },

    unlockTalent(talentId) {
      if (ns.RPG && ns.RPG.unlockTalentRank) {
        const res = ns.RPG.unlockTalentRank(talentId);
        if (res.success) {
          render();
        } else {
          alert('?? ' + (res.reason || 'Impossible de d�bloquer ce talent'));
        }
      }
    },

    resetTalents() {
      if (confirm('Voulez-vous r�initialiser tous vos talents et r�cup�rer vos points d��veil (TP) ?')) {
        if (ns.RPG && ns.RPG.resetTalents) {
          ns.RPG.resetTalents();
          render();
        }
      }
    },

    onImportBackupFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (ns.Storage && ns.Storage.importBackupJSON) {
          const res = ns.Storage.importBackupJSON(content);
          if (res.success) {
            alert('? Donn�es du Chasseur restaur�es avec succ�s !');
            render();
          } else {
            alert('?? ' + (res.error || 'Erreur lors de la lecture du fichier.'));
          }
        }
      };
      reader.readAsText(file);
    },

    closeModal() {
      ui.modal = null;
      render();
    }
  };
})(window.IronPulse);
