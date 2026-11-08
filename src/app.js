// IronPulse — Contrôleur Principal d'Interface Mobile (7 Écrans + Chronomètre + Modales)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  const ui = {
    currentTab: 'home', // 'home' | 'rpg' | 'exercises' | 'programs' | 'workout' | 'history' | 'progress' | 'profile'
    frameMode: 'framed', // 'framed' | 'full'
    // Assistant Première Utilisation (Questionnaire Biométrique + Avatar 3D + Tutoriel)
    onboardingOpen: false,
    onboardingStep: 1, // 1: Biométrie (Âge/Taille/Poids) | 2: Objectif & Niveau | 3: Guerrier 3D | 4: Tutoriel App | 5: Synthèse & Départ
    tutorialSlideIdx: 0,
    // Visite guidée interactive en direct sur les onglets de l'application
    guidedTourActive: false,
    guidedTourStep: 0,
    // Sous-onglet RPG Héros
    rpgSubTab: 'hero', // 'hero' | 'customize' | 'quests' | 'relics' | 'guild'
    activeWorkout3DExerciseIdx: 0,
    // Filtres Répertoire d'exercices
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

  // Petit synthétiseur Web Audio pour le bip de fin de repos (sans fichier audio externe)
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
      // Ignorer si l'autoplay audio est bloqué
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
              ⏱
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
            Passer ⏭
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

  // Démarrer une séance à partir d'un modèle (programme prédéfini, séance perso, ou séance libre)
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
      name: sessionTemplate.name || 'Séance libre',
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
        name: 'Séance Libre Personnalisée',
        exercises: [
          { exerciseId: 'ex-bench-press', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: '' },
          { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: '' }
        ]
      },
      null
    );
  }

  // Formatage markdown léger pour les réponses du Coach IA
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
          return `<div class="flex items-start gap-2 text-xs text-slate-200 leading-relaxed mb-1.5"><span class="text-emerald-400 font-bold mt-0.5">•</span><span>${formatted.replace(/^[-*]\s+/, '')}</span></div>`;
        }
        if (trimmed.startsWith('> ')) {
          return `<div class="border-l-2 border-amber-500/60 pl-2.5 py-1 my-1.5 text-[11px] text-amber-200/90 bg-amber-500/10 rounded-r-lg">${formatted.replace(/^>\s+/, '')}</div>`;
        }
        return `<p class="text-xs text-slate-200 leading-relaxed mb-1.5">${formatted}</p>`;
      })
      .join('');
  }

  // ============================================================================
  // RENDU ÉCRAN 1 : QG DU HÉROS (INTERFACE FUSIONNÉE JEU RPG : AVATAR + QUÊTES)
  // ============================================================================
  function renderHomeScreen() {
    const state = ns.Storage.getState();
    const { profile, history, activeWorkout } = state;
    const analysis = ns.AICoach.analyzeTrainingData();
    const hero = ns.RPG ? ns.RPG.getHeroProfile() : null;

    const activeProg =
      ns.Data.PREDEFINED_PROGRAMS.find((p) => p.id === profile.activeProgramId) ||
      ns.Data.PREDEFINED_PROGRAMS[1];

    const nextSession = activeProg.sessions[history.length % activeProg.sessions.length] || activeProg.sessions[0];

    if (!hero) {
      return `<div class="p-4 text-xs text-slate-400">Initialisation du Système RPG...</div>`;
    }

    const avatarSvg = ns.RPG.renderHeroAvatarSVG(hero);
    const relics = hero.relicsStatus || [];

    const renderRelicBadge = (r) => `
      <button
        onclick="${r.unlocked ? `IronPulse.App.toggleEquipRelic('${r.id}')` : `IronPulse.App.openRpgSubTab('relics')`}"
        class="flex flex-col items-center justify-center p-2 rounded-xl border transition active:scale-95 ${
          r.equipped
            ? 'bg-emerald-500/15 border-emerald-400/60 shadow-sm shadow-emerald-500/20'
            : r.unlocked
            ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500'
            : 'bg-slate-950/50 border-slate-800/60 opacity-60'
        }"
        title="${escapeHtml(r.name)} — ${escapeHtml(r.bonusLabel)}"
      >
        <span class="text-base leading-none mb-1">${r.unlocked ? r.icon : '🔒'}</span>
        <span class="text-[8px] font-black uppercase tracking-wider ${r.equipped ? 'text-emerald-400' : 'text-slate-400'} truncate w-full text-center">${escapeHtml(r.slot)}</span>
      </button>
    `;

    // Estimations de gain d'XP pour la quête du jour
    const questEstimatedXp = 120 + nextSession.exercises.length * 3 * 18 + 180;

    return `
      <div class="space-y-4 pb-6 animate-slide-up">
        <!-- CARTE CENTRALE STUDIO AAA : AVATAR 3D ÉPURÉ + STATS & ARÈNE SOMBRE -->
        <div class="relative overflow-hidden bg-[#0A0E17]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3.5">
          <!-- Fond Studio Dark Vignette -->
          <div class="absolute inset-0 bg-radial-gradient from-transparent via-[#0A0E17]/60 to-[#05070B] pointer-events-none"></div>

          <!-- En-tête : Identité de l'Athlète & Niveau Studio -->
          <div class="relative z-10 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${hero.rankObj.badgeBg} border border-white/15">
                  RANG ${hero.rankObj.rank}
                </span>
                <span class="text-xs font-bold text-amber-300 truncate">« ${escapeHtml(hero.appearance?.battleTitle || hero.appearance?.customTitle || hero.rankObj.title)} »</span>
              </div>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <h1 class="text-xl font-black text-white tracking-tight truncate">${escapeHtml(hero.heroName)}</h1>
                <button onclick="IronPulse.App.openRpgSubTab('hero')" class="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[10px] text-emerald-300 font-bold transition flex items-center gap-1">
                  ${hero.classObj.icon} ${escapeHtml(hero.classObj.name)} ↻
                </button>
                <button onclick="IronPulse.App.openRpgSubTab('customize')" class="px-2.5 py-1 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-[10px] text-indigo-300 font-extrabold transition">
                  ⚙️ Studio 3D
                </button>
              </div>
            </div>
            <div class="text-right shrink-0 bg-slate-950/90 border border-emerald-500/40 rounded-2xl px-3 py-2 shadow-lg">
              <div class="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">NIVEAU</div>
              <div class="text-2xl font-black text-emerald-400 leading-none mt-0.5 font-mono">${hero.level}</div>
            </div>
          </div>

          <!-- Barre de Puissance de Combat & Jauges Minimalistes -->
          <div class="relative z-10 bg-slate-950/70 border border-white/5 rounded-2xl p-3 space-y-2 backdrop-blur-md">
            <div class="flex items-center justify-between text-xs flex-wrap gap-2">
              <span class="text-slate-200 font-extrabold flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                COMBAT POWER : <strong class="text-emerald-400 font-mono text-sm">${hero.combatPower}</strong>
              </span>
              <div class="flex items-center gap-2.5 text-[11px] font-black">
                <span class="text-rose-400 flex items-center gap-0.5">❤️ ${hero.hpMax}</span>
                <span class="text-cyan-300 flex items-center gap-0.5">💧 ${hero.mpMax}</span>
                <span class="text-amber-300 flex items-center gap-0.5">🪙 ${hero.gold}</span>
                <span class="text-orange-400 flex items-center gap-0.5">🔥 ${hero.streakDays}j</span>
              </div>
            </div>
            <div class="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div class="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-500" style="width: ${hero.levelProgressPct}%"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Progression Rang</span>
              <span class="text-indigo-300 font-mono font-bold">${hero.xpInCurrentLevel} / ${hero.xpForNextLevel} XP (${hero.levelProgressPct}%)</span>
            </div>
          </div>

          <!-- SCÈNE CENTRALE : AVATAR 3D ATHLÈTE EN PLEINE LARGEUR (PLEIN PIED & ROTATION 360°) -->
          <div class="relative z-10 w-full py-1">
            ${avatarSvg}
          </div>

          <!-- DOCK HORIZONTAL DES 6 RELIQUES D'ÉQUIPEMENT (ACCÈS DIRECT SANS ENCOMBRER L'AVATAR) -->
          <div class="relative z-10 pt-1">
            <div class="flex items-center justify-between mb-1.5 px-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-slate-400">Équipements & Reliques de Fonte</span>
              <span class="text-[10px] text-emerald-400 font-extrabold cursor-pointer hover:underline" onclick="IronPulse.App.openRpgSubTab('relics')">Inventaire →</span>
            </div>
            <div class="grid grid-cols-6 gap-1.5">
              ${relics.slice(0, 6).map(renderRelicBadge).join('')}
            </div>
          </div>

          <!-- Barre des 6 Attributs Biomécaniques -->
          <div class="relative z-10 grid grid-cols-6 gap-1.5 pt-3 border-t border-white/10 text-center">
            ${hero.attributes
              .map(
                (a) => `
              <div onclick="IronPulse.App.openRpgSubTab('hero')" class="cursor-pointer bg-slate-950/60 hover:bg-slate-900/90 border border-white/5 rounded-xl p-2 transition">
                <div class="text-[9px] font-black ${a.textColor}">${a.code}</div>
                <div class="text-xs font-black text-white font-mono mt-0.5">${a.value}</div>
                <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-white/5">
                  <div class="${a.color} h-full rounded-full" style="width: ${a.value}%"></div>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- QUÊTE PRINCIPALE DU JOUR (LANCER LA SÉANCE = ENTRER DANS LE DONJON) -->
        ${
          activeWorkout
            ? `
          <div class="bg-emerald-950/60 border-2 border-emerald-500 rounded-2xl p-4 shadow-lg animate-pulse-glow">
            <div class="flex items-center justify-between mb-1.5">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ⚔️ Combat de Donjon en cours
              </span>
              <span class="text-xs font-mono text-emerald-200">${escapeHtml(activeWorkout.name)}</span>
            </div>
            <p class="text-xs text-slate-300 mb-3">Votre quête physique est active. Validez vos séries pour infliger des dégâts et remporter l'XP.</p>
            <button onclick="IronPulse.App.navigate('workout')" class="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-md active:scale-[0.99] transition">
              Reprendre le Combat en direct →
            </button>
          </div>
        `
            : `
          <div class="bg-[#151C28] border border-emerald-500/40 rounded-2xl p-4 shadow-lg space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                📜 Quête Principale du Jour
              </span>
              <span class="text-xs font-extrabold text-amber-300">Récompense : ~+${questEstimatedXp} XP</span>
            </div>

            <div>
              <h2 class="text-base font-extrabold text-white">${escapeHtml(nextSession.name)}</h2>
              <p class="text-xs text-slate-400">Campagne : <span class="text-slate-200 font-semibold">${escapeHtml(activeProg.name)}</span> • ⏱ ~${nextSession.estimatedMinutes} min</p>
            </div>

            <div class="flex flex-wrap gap-1.5">
              ${nextSession.exercises
                .map((item) => {
                  const ex = ns.Storage.getExerciseById(item.exerciseId);
                  return `<span class="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200">${escapeHtml(ex.name)} <strong class="text-emerald-400">${item.targetSets}×${item.targetReps}</strong></span>`;
                })
                .join('')}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button onclick="IronPulse.App.startProgramSession('${activeProg.id}', '${nextSession.id}')" class="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition">
                <span>⚔️ Entrer dans le Donjon (Démarrer)</span>
              </button>
              <button onclick="IronPulse.App.startEmptyWorkout()" class="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition">
                <span>＋ Quête Libre Personnalisée</span>
              </button>
            </div>
          </div>
        `
        }

        <!-- ACCÈS RAPIDE AUX PORTAILS RPG (DONJONS & BOSS, GUILDE & DÉFIS D'AMIS, ARSENAL) -->
        <div class="grid grid-cols-3 gap-2">
          <button onclick="IronPulse.App.openRpgSubTab('quests')" class="bg-[#151C28] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">🐉</div>
            <div class="text-xs font-extrabold text-white">Boss & Quêtes</div>
            <div class="text-[10px] text-emerald-400">${hero.bossesStatus.filter((b) => b.defeated).length}/${hero.bossesStatus.length} Boss vaincus</div>
          </button>
          <button onclick="IronPulse.App.openRpgSubTab('guild')" class="bg-[#151C28] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">🛡️</div>
            <div class="text-xs font-extrabold text-white">Club & Défis</div>
            <div class="text-[10px] text-amber-300">${hero.evaluatedChallenges.length} duels actifs</div>
          </button>
          <button onclick="IronPulse.App.openRpgSubTab('relics')" class="bg-[#151C28] hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-3 text-left transition active:scale-[0.98]">
            <div class="text-base mb-0.5">👑</div>
            <div class="text-xs font-extrabold text-white">Reliques</div>
            <div class="text-[10px] text-indigo-300">${hero.relicsStatus.filter((r) => r.unlocked).length}/${hero.relicsStatus.length} éveillées</div>
          </button>
        </div>

        <!-- ORACLE BIOMÉCANIQUE (COACH IA PRUDENT INTÉGRÉ COMME MENTOR DU HÉROS) -->
        <div class="bg-gradient-to-br from-indigo-950/50 via-[#151C28] to-[#151C28] border border-indigo-500/30 rounded-2xl p-3.5 shadow-lg space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 text-sm">🔮</span>
              <div>
                <h3 class="text-xs font-extrabold text-white">Oracle Biomécanique (Coach IA)</h3>
                <p class="text-[10px] text-indigo-300">${escapeHtml(analysis.summaryTitle)}</p>
              </div>
            </div>
            <button onclick="IronPulse.App.openAICoachTab()" class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold transition">
              Consulter →
            </button>
          </div>

          ${
            analysis.adjustments.length > 0
              ? `
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 leading-relaxed">
              <span class="text-amber-400 font-bold">🎯 Conseil de maîtrise :</span> <strong>${escapeHtml(analysis.adjustments[0].title)}</strong> — ${escapeHtml(analysis.adjustments[0].detail)}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU ÉCRAN 2 : RÉPERTOIRE D'EXERCICES
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
          Aucun exercice ne correspond à vos filtres.
        </div>
      `
        : filtered
            .map((ex) => {
              const lastPerf = ns.Storage.getLastPerformanceForExercise(ex.id);
              const bestSet =
                lastPerf && lastPerf.sets && lastPerf.sets.length
                  ? `${lastPerf.sets[0].weight} kg × ${lastPerf.sets[0].reps}`
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
                  <span class="text-slate-400 text-xs px-2 py-1 rounded-lg bg-slate-800/70 shrink-0">Fiche →</span>
                </div>
                <p class="text-xs text-slate-400 line-clamp-2 mb-2">${escapeHtml(ex.description)}</p>
                <div class="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/80">
                  <span class="text-slate-300 truncate">🎯 <strong class="font-medium">${escapeHtml((ex.primaryMuscles || []).join(', '))}</strong></span>
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
            <h1 class="text-lg font-extrabold text-white">Répertoire d’exercices</h1>
            <p class="text-xs text-slate-400">${filtered.length} exercice(s) avec muscles ciblés et consignes</p>
          </div>
          <button onclick="IronPulse.App.openCreateExerciseModal()" class="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition">
            ＋ Créer
          </button>
        </div>

        <!-- Barre de recherche -->
        <div class="relative">
          <input
            type="text"
            value="${escapeHtml(ui.exerciseSearch)}"
            oninput="IronPulse.App.onExerciseSearch(this.value)"
            placeholder="Rechercher un exercice ou un muscle (ex: développé, dos, fessiers)..."
            class="w-full bg-[#151C28] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-3.5 pr-9 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          ${
            ui.exerciseSearch
              ? `<button onclick="IronPulse.App.onExerciseSearch('')" class="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs">✕</button>`
              : ''
          }
        </div>

        <!-- Filtres Groupes Musculaires -->
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          ${musclePills}
        </div>

        <!-- Filtres Équipement -->
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
  // RENDU ÉCRAN 3 : PROGRAMMES PRÉDÉFINIS & SÉANCES PERSONNALISÉES
  // ============================================================================
  function renderProgramsScreen() {
    const state = ns.Storage.getState();
    const { profile, customSessions } = state;

    const subTabBar = `
      <div class="grid grid-cols-3 gap-1 bg-[#151C28] p-1 rounded-xl border border-slate-800">
        <button onclick="IronPulse.App.setProgramSubTab('predefined')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'predefined' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          📜 Campagnes
        </button>
        <button onclick="IronPulse.App.setProgramSubTab('custom')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'custom' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ⚡ Mes Séances (${customSessions.length})
        </button>
        <button onclick="IronPulse.App.setProgramSubTab('periodization')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.programSubTab === 'periodization' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          📅 Périodisation
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
            <h1 class="text-lg font-extrabold text-white">Planificateur de Périodisation</h1>
            <p class="text-xs text-slate-400">Structurez votre mésocycle en 4 phases scientifiques (AURA FIT)</p>
          </div>

          ${subTabBar}

          <!-- Carte Phase Active du Mésocycle -->
          <div class="bg-gradient-to-br from-amber-950/40 via-[#151C28] to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  Mésocycle Actif • Semaine ${activeWeek}
                </span>
                <h2 class="text-base font-extrabold text-white mt-1">${activePhase.icon} ${escapeHtml(activePhase.name)}</h2>
                <p class="text-xs text-emerald-300 font-semibold">${escapeHtml(activePhase.subtitle)} (${escapeHtml(activePhase.weeksRange)})</p>
              </div>
              <div class="text-right shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
                <div class="text-[9px] uppercase text-slate-400 font-bold">Intensité</div>
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
                <div class="text-[9px] uppercase text-slate-400 font-bold">Séries / Muscle</div>
                <div class="text-xs font-black text-emerald-400">${escapeHtml(activePhase.setsPerMuscle)}</div>
              </div>
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-bold">Répétitions</div>
                <div class="text-xs font-black text-amber-300">${escapeHtml(activePhase.repRange)}</div>
              </div>
            </div>

            <!-- Sélecteur de Semaine du Mésocycle (1 à 7) -->
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

          <!-- Les 4 Phases du Mésocycle -->
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
                          <div class="text-[10px] text-slate-400">${escapeHtml(ph.weeksRange)} • ${escapeHtml(ph.intensityPct)}</div>
                        </div>
                      </div>
                      <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }">
                        ${isSelected ? '✓ Phase Active' : 'Activer'}
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
            <p class="text-sm font-bold text-white mb-1">Aucune séance personnalisée</p>
            <p class="text-xs text-slate-400 mb-4">Composez votre propre séance en choisissant vos exercices, séries, répétitions et temps de repos.</p>
            <button onclick="IronPulse.App.openCreateSessionModal()" class="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              ＋ Créer ma première séance
            </button>
          </div>
        `
          : customSessions
              .map((sess) => {
                return `
                <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <span class="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase">Séance Personnalisée</span>
                      <h3 class="text-base font-bold text-white mt-1">${escapeHtml(sess.name)}</h3>
                      <p class="text-xs text-slate-400">${sess.exercises.length} exercices • ~${sess.estimatedMinutes || 45} min</p>
                    </div>
                    <button onclick="IronPulse.App.deleteCustomSession('${sess.id}')" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1" title="Supprimer">🗑</button>
                  </div>

                  <div class="space-y-1.5 bg-slate-900/70 rounded-xl p-2.5 border border-slate-800/80">
                    ${sess.exercises
                      .map((item, idx) => {
                        const ex = ns.Storage.getExerciseById(item.exerciseId);
                        return `
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-slate-200 truncate"><span class="text-slate-500 mr-1">${idx + 1}.</span>${escapeHtml(ex.name)}</span>
                          <span class="text-emerald-400 font-semibold shrink-0 ml-2">${item.targetSets} × ${item.targetReps} (${item.restSeconds}s)</span>
                        </div>
                      `;
                      })
                      .join('')}
                  </div>

                  <button onclick="IronPulse.App.startCustomSession('${sess.id}')" class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow active:scale-[0.99] transition">
                    ▶ Lancer cette séance maintenant
                  </button>
                </div>
              `;
              })
              .join('');

      return `
        <div class="space-y-3.5 pb-6 animate-slide-up">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-extrabold text-white">Programmes & Séances</h1>
              <p class="text-xs text-slate-400">Créez et personnalisez vos propres entraînements</p>
            </div>
            <button onclick="IronPulse.App.openCreateSessionModal()" class="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow">
              ＋ Nouvelle séance
            </button>
          </div>
          ${subTabBar}
          <div class="space-y-3">
            ${customHtml}
          </div>
        </div>
      `;
    }

    // Programmes prédéfinis filtrés par Objectif et Niveau
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
                <span class="text-[11px] text-slate-400">• ${escapeHtml(prog.frequency)}</span>
              </div>
              <h3 class="text-base font-extrabold text-white">${escapeHtml(prog.name)}</h3>
            </div>
            ${
              isActive
                ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold shrink-0">✓ Actif</span>`
                : `<button onclick="IronPulse.App.selectActiveProgram('${prog.id}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold shrink-0 transition">Choisir</button>`
            }
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(prog.description)}</p>

          <!-- Séances incluses dans ce programme -->
          <div class="space-y-2 pt-1">
            ${prog.sessions
              .map(
                (s) => `
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <div class="text-xs font-bold text-white">${escapeHtml(s.name)}</div>
                    <div class="text-[11px] text-slate-400">${s.exercises.length} exercices • ~${s.estimatedMinutes} min</div>
                  </div>
                  <button onclick="IronPulse.App.startProgramSession('${prog.id}', '${s.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shrink-0 active:scale-95 transition">
                    ▶ Démarrer
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${s.exercises
                    .map((item) => {
                      const ex = ns.Storage.getExerciseById(item.exerciseId);
                      return `<span onclick="IronPulse.App.openExerciseModal('${ex.id}')" class="cursor-pointer px-2 py-0.5 rounded bg-slate-800/90 hover:bg-slate-700 text-[10px] text-slate-300">${escapeHtml(ex.name)} (${item.targetSets}×${item.targetReps})</span>`;
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
          <h1 class="text-lg font-extrabold text-white">Programmes & Séances</h1>
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
  // RENDU ÉCRAN 4 : SÉANCE EN COURS (LIVE WORKOUT TRACKER)
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
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-300">🧊 Salle de Gravité 3D — Échauffement</span>
                <h2 class="text-sm font-extrabold text-white">Votre Héros 3D est prêt pour le Donjon</h2>
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">Temps Réel</span>
            </div>
            ${ns.Hero3D ? ns.Hero3D.renderHero3DStageHTML({ showMoveSelector: true, compact: true }) : ''}
          </div>
          <div>
            <h1 class="text-lg font-extrabold text-white">Aucune séance active</h1>
            <p class="text-xs text-slate-400 max-w-xs mx-auto mt-1">Lancez une séance pour que votre Guerrier 3D exécute chaque exercice avec vous en direct.</p>
          </div>
          <div class="space-y-2.5 max-w-xs mx-auto pt-1">
            <button onclick="IronPulse.App.navigate('programs')" class="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition">
              ⚔️ Choisir une séance de Campagne
            </button>
            <button onclick="IronPulse.App.startEmptyWorkout()" class="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition">
              ＋ Démarrer une Quête Libre (avec Coach 3D)
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
            ? `Dernière séance : ${lastPerf.sets.map((s) => `${s.weight}×${s.reps}`).slice(0, 3).join(', ')} kg`
            : 'Première saisie sur cet exercice';

        const setsRowsHtml = exBlock.sets
          .map((set, setIdx) => {
            const done = !!set.completed;
            const currentRpe = set.rpe || 8;
            return `
              <div class="space-y-1 py-1.5 px-1.5 sm:px-2 rounded-xl transition ${
                done ? 'bg-emerald-500/15 border border-emerald-500/40' : 'bg-slate-900/90 border border-slate-800/80'
              }">
                <div class="grid grid-cols-12 gap-1 sm:gap-1.5 items-center">
                  <!-- Numéro Série -->
                  <div class="col-span-1 text-center text-xs font-extrabold ${done ? 'text-emerald-400' : 'text-slate-400'}">
                    ${setIdx + 1}
                  </div>

                  <!-- Charge (kg) -->
                  <div class="col-span-3">
                    <input
                      type="number"
                      step="0.5"
                      aria-label="Charge série ${setIdx + 1}"
                      value="${set.weight}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'weight', this.value)"
                      class="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-1.5 px-1 text-center text-base sm:text-sm font-bold text-white outline-none"
                    />
                  </div>

                  <!-- Répétitions -->
                  <div class="col-span-2">
                    <input
                      type="number"
                      step="1"
                      aria-label="Répétitions série ${setIdx + 1}"
                      value="${set.reps}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'reps', this.value)"
                      class="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-1.5 px-1 text-center text-base sm:text-sm font-bold text-white outline-none"
                    />
                  </div>

                  <!-- RPE (Effort perçu 6-10) -->
                  <div class="col-span-2">
                    <select
                      aria-label="RPE série ${setIdx + 1}"
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
                      aria-label="Repos série ${setIdx + 1}"
                      value="${set.restSeconds || exBlock.restSeconds || 90}"
                      onchange="IronPulse.App.updateWorkoutSet(${exIdx}, ${setIdx}, 'restSeconds', this.value)"
                      class="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-lg py-1.5 px-0.5 text-center text-base sm:text-xs font-medium text-slate-300 outline-none"
                    />
                  </div>

                  <!-- Bouton Valider Série + Supprimer -->
                  <div class="col-span-2 flex items-center justify-end gap-0.5">
                    <button
                      onclick="IronPulse.App.toggleSetCompleted(${exIdx}, ${setIdx})"
                      class="flex-1 py-1.5 px-1 rounded-lg font-extrabold text-xs transition active:scale-95 ${
                        done
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }"
                      title="Valider la série et lancer le repos"
                    >
                      ${done ? '✓' : 'OK'}
                    </button>
                    ${
                      exBlock.sets.length > 1
                        ? `<button onclick="IronPulse.App.removeWorkoutSet(${exIdx}, ${setIdx})" class="px-1 py-1.5 text-slate-500 hover:text-rose-400 text-xs" title="Supprimer série">✕</button>`
                        : ''
                    }
                  </div>
                </div>

                <!-- Boutons rapides ergonomiques à une main (-2.5/+2.5 kg & -1/+1 rep) façon AURA FIT -->
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
                  <span class="text-[11px] text-slate-400">Cible : ${escapeHtml(exBlock.targetReps || '8-12')} rép.</span>
                  <button
                    onclick="IronPulse.App.setWorkout3DExercise(${exIdx})"
                    class="px-2 py-0.5 rounded-lg border text-[10px] font-extrabold transition ${
                      ui.activeWorkout3DExerciseIdx === exIdx
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                        : 'bg-slate-800/90 text-amber-300 border-amber-500/40 hover:bg-slate-700'
                    }"
                  >
                    🧊 ${ui.activeWorkout3DExerciseIdx === exIdx ? 'En cours en 3D' : 'Voir en 3D'}
                  </button>
                </div>
                <h3 onclick="IronPulse.App.openExerciseModal('${ex.id}')" class="text-sm font-extrabold text-white mt-0.5 cursor-pointer hover:text-emerald-400 transition truncate">
                  ${escapeHtml(ex.name)} <span class="text-xs font-normal text-slate-400">ⓘ</span>
                </h3>
                <div class="text-[11px] text-emerald-400/90 font-medium">${escapeHtml(lastPerfLabel)}</div>
              </div>
              <button onclick="IronPulse.App.removeWorkoutExercise(${exIdx})" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1" title="Retirer l'exercice">🗑</button>
            </div>

            <!-- En-tête des colonnes -->
            <div class="grid grid-cols-12 gap-1 sm:gap-1.5 px-1.5 sm:px-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <div class="col-span-1 text-center">#</div>
              <div class="col-span-3 text-center">Charge</div>
              <div class="col-span-2 text-center">Rép.</div>
              <div class="col-span-2 text-center">RPE</div>
              <div class="col-span-2 text-center">Repos</div>
              <div class="col-span-2 text-right pr-1">Statut</div>
            </div>

            <!-- Liste des séries -->
            <div class="space-y-1.5">
              ${setsRowsHtml}
            </div>

            <!-- Ajouter une série / Lancer repos manuel -->
            <div class="flex items-center justify-between gap-2 pt-1">
              <button onclick="IronPulse.App.addWorkoutSet(${exIdx})" class="flex-1 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-bold text-slate-200 active:scale-[0.99] transition">
                ＋ Ajouter une série
              </button>
              <button onclick="IronPulse.App.triggerManualRest(${exBlock.restSeconds || 90}, '${escapeHtml(ex.name)}')" class="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-emerald-300 active:scale-95 transition">
                ⏱ Repos ${exBlock.restSeconds || 90}s
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
        <!-- Barre supérieure de séance en direct -->
        <div class="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-lg">
          <div class="flex items-center justify-between gap-2 mb-2">
            <div class="min-w-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Entraînement en direct</span>
              <input
                type="text"
                value="${escapeHtml(workout.name)}"
                onchange="IronPulse.App.updateWorkoutName(this.value)"
                class="block w-full bg-transparent text-base font-extrabold text-white border-b border-transparent focus:border-emerald-500 outline-none truncate"
              />
            </div>
            <div class="text-right shrink-0">
              <div id="live-workout-clock" class="text-lg font-extrabold font-mono text-emerald-400 tabular-nums">${formatDurationClock(elapsedSec)}</div>
              <div class="text-[10px] text-slate-400">Durée</div>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 py-2 px-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center mb-3">
            <div>
              <div class="text-[10px] text-slate-400">Séries validées</div>
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
              ✓ Terminer & Enregistrer la séance
            </button>
            <button onclick="IronPulse.App.cancelActiveWorkout()" class="px-3 py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition" title="Annuler la séance">
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
              <span>${workout.warmupCompleted ? '✓ Échauffement Dynamique Validé' : '🔥 Échauffement Dynamique & Montée en Charge'}</span>
              <span class="text-[10px] font-black">${workout.warmupCompleted ? '+35 XP & +15 🪙 acquis' : '+35 XP & +15 🪙'}</span>
            </button>
          </div>
        </div>

        <!-- SCÈNE HOLOGRAPHIQUE 3D EN DIRECT : LE HÉROS EFFECTUE LE MÊME MOUVEMENT QUE L'EXERCICE ACTIF -->
        ${
          activeEx3D && ns.Hero3D
            ? `
          <div class="shonen-arena-card relative overflow-hidden bg-[#151C28] border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl space-y-2.5">
            <div class="relative z-10 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-wider text-amber-300">🧊 Synchronisation 3D en Direct</span>
                <h2 class="text-sm font-extrabold text-white truncate">🏋️ ${escapeHtml(activeEx3D.name)}</h2>
                <p class="text-[10px] text-emerald-400 truncate">🎯 ${escapeHtml(activeMoveMeta ? activeMoveMeta.focus : (activeEx3D.primaryMuscles || []).join(', '))}</p>
              </div>
              <span class="px-2 py-1 rounded-xl bg-slate-950/90 border border-amber-400/40 text-[10px] font-extrabold text-amber-300 shrink-0">
                ${escapeHtml(activeExBlock3D.targetReps || '8-12')} rép.
              </span>
            </div>

            <!-- Sélecteur d'exercice synchronisé en 3D -->
            <div class="relative z-10 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              ${workout3DPills}
            </div>

            <!-- Canvas 3D exécutant le mouvement biomécanique de l'exercice -->
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

        <!-- Ajouter un exercice à la séance -->
        <button onclick="IronPulse.App.openAddExerciseToWorkoutModal()" class="w-full py-3.5 rounded-2xl bg-[#151C28] hover:bg-slate-800 border border-dashed border-emerald-500/50 text-emerald-400 font-bold text-xs transition">
          ＋ Ajouter un exercice à la séance
        </button>

        <!-- Notes de séance -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-3.5">
          <label class="block text-xs font-bold text-slate-300 mb-1.5">Notes & Ressenti de la séance</label>
          <textarea
            rows="2"
            placeholder="Ex: Très bonnes sensations aux pectoraux, penser à monter à 72.5 kg la semaine prochaine..."
            onchange="IronPulse.App.updateWorkoutNotes(this.value)"
            class="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          >${escapeHtml(workout.notes || '')}</textarea>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU ÉCRAN 5 : HISTORIQUE DES SÉANCES
  // ============================================================================
  function renderHistoryScreen() {
    const state = ns.Storage.getState();
    const sorted = [...state.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const cardsHtml =
      sorted.length === 0
        ? `
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
          Aucune séance terminée dans l'historique.
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
                    .map((s) => `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] font-mono">${s.weight}kg × ${s.reps}</span>`)
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
                    <div class="text-[11px] text-emerald-400 font-semibold">${formatFullDate(w.date)} • ⏱ ${w.durationMinutes || 50} min</div>
                    <h3 class="text-sm font-extrabold text-white">${escapeHtml(w.name)}</h3>
                  </div>
                  <div class="flex items-center gap-1">
                    <button onclick="IronPulse.App.repeatHistoryWorkout('${w.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition">
                      ↻ Refaire
                    </button>
                    <button onclick="IronPulse.App.deleteHistoryWorkout('${w.id}')" class="px-2 py-1 text-slate-500 hover:text-rose-400 text-xs" title="Supprimer">🗑</button>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2 bg-slate-900/80 rounded-xl p-2 text-center border border-slate-800/70">
                  <div>
                    <div class="text-[10px] text-slate-400">Tonnage</div>
                    <div class="text-xs font-bold text-white">${stats.totalVolume} kg</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">Séries</div>
                    <div class="text-xs font-bold text-white">${stats.completedSets}</div>
                  </div>
                  <div>
                    <div class="text-[10px] text-slate-400">Répétitions</div>
                    <div class="text-xs font-bold text-emerald-400">${stats.totalReps}</div>
                  </div>
                </div>

                <div class="space-y-1 pt-1">
                  ${exRows}
                </div>

                ${
                  w.notes
                    ? `<div class="text-xs text-slate-300 italic bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/70">💬 « ${escapeHtml(w.notes)} »</div>`
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
            <h1 class="text-lg font-extrabold text-white">Historique des séances</h1>
            <p class="text-xs text-slate-400">${sorted.length} entraînement(s) enregistré(s)</p>
          </div>
          <button onclick="IronPulse.App.navigate('progress')" class="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400">
            Voir Graphiques →
          </button>
        </div>

        <div class="space-y-3">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU ÉCRAN 6 : PROGRESSION & ACCOMPAGNEMENT COACH IA
  // ============================================================================
  function renderProgressAndAIScreen() {
    const state = ns.Storage.getState();
    const analysis = ns.AICoach.analyzeTrainingData();

    const subTabBar = `
      <div class="grid grid-cols-3 gap-1 bg-[#151C28] p-1 rounded-xl border border-slate-800">
        <button onclick="IronPulse.App.setProgressSubTab('charts')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'charts' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          📊 Graphiques & 1RM
        </button>
        <button onclick="IronPulse.App.setProgressSubTab('ai')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'ai' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          ✨ Coach IA
        </button>
        <button onclick="IronPulse.App.setProgressSubTab('nutrition')" class="py-2 rounded-lg text-[11px] font-bold transition ${
          ui.progressSubTab === 'nutrition' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-300 hover:text-white'
        }">
          🥩 Nutrition
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

          <!-- Paramètres rapides Genre / Poids / Objectif -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-white">⚡ Paramètres Métaboliques</span>
              <span class="text-[11px] font-bold ${bio.bmiColor}">IMC ${bio.bmi} • ${bio.bmiLabel}</span>
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
                ♂ Homme (Mifflin +5)
              </button>
              <button
                onclick="IronPulse.App.updateProfileField('gender', 'female')"
                class="py-2 px-3 rounded-xl border text-xs font-extrabold transition ${
                  gender === 'female'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }"
              >
                ♀ Femme (Mifflin -161)
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

          <!-- Répartition des Macronutriments -->
          <div class="bg-[#151C28] border border-emerald-500/30 rounded-2xl p-4 space-y-3.5 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-extrabold text-white">🥩 Répartition Quotidienne des Macros</h2>
                <p class="text-[11px] text-slate-400">Calibré pour ${bio.weightKg} kg (${escapeHtml(bio.goalNutritionLabel)})</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-extrabold">
                💧 ${bio.hydrationL} L d'eau/j
              </span>
            </div>

            <!-- Protéines -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-rose-300">🥩 Protéines (Construction musculaire · 2.0g/kg)</span>
                <span class="font-black text-white">${bio.proteinTargetG} g <span class="text-[10px] text-slate-400">(${bio.proteinKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-rose-500 h-full rounded-full" style="width: ${bio.proteinPct}%"></div>
              </div>
            </div>

            <!-- Glucides -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-amber-300">🍚 Glucides (Énergie & Glycogène Ki)</span>
                <span class="font-black text-white">${bio.carbsTargetG} g <span class="text-[10px] text-slate-400">(${bio.carbsKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-amber-400 h-full rounded-full" style="width: ${bio.carbsPct}%"></div>
              </div>
            </div>

            <!-- Lipides -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="font-bold text-emerald-300">🥑 Lipides (Système hormonal · 1.0g/kg)</span>
                <span class="font-black text-white">${bio.fatTargetG} g <span class="text-[10px] text-slate-400">(${bio.fatKcal} kcal)</span></span>
              </div>
              <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="bg-emerald-400 h-full rounded-full" style="width: ${bio.fatPct}%"></div>
              </div>
            </div>

            <!-- Timing péri-entraînement -->
            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
              <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                <div class="font-extrabold text-amber-300 mb-0.5">⚡ Pré-Séance (-1h30)</div>
                <div class="text-slate-300">~${Math.round(bio.carbsTargetG * 0.25)}g glucides digestes + ~${Math.round(bio.proteinTargetG * 0.2)}g protéines.</div>
              </div>
              <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                <div class="font-extrabold text-emerald-300 mb-0.5">🏆 Post-Séance (+1h)</div>
                <div class="text-slate-300">~${Math.round(bio.proteinTargetG * 0.3)}g protéines + ~${Math.round(bio.carbsTargetG * 0.35)}g glucides.</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    if (ui.progressSubTab === 'charts') {
      const timeline = ns.Storage.getExerciseTimeline(ui.selectedChartExerciseId);
      const selectedEx = ns.Storage.getExerciseById(ui.selectedChartExerciseId);

      let latestStat = '—';
      let deltaStat = '—';
      if (timeline.length > 0) {
        const first = timeline[0];
        const last = timeline[timeline.length - 1];
        const unit = 'kg';
        latestStat = `${last[ui.selectedChartMetric]} ${unit}`;
        if (timeline.length > 1) {
          const diff = Math.round((last[ui.selectedChartMetric] - first[ui.selectedChartMetric]) * 10) / 10;
          deltaStat = `${diff >= 0 ? '+' : ''}${diff} ${unit}`;
        } else {
          deltaStat = '1 séance';
        }
      }

      return `
        <div class="space-y-4 pb-6 animate-slide-up">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-lg font-extrabold text-white">Progression & Analyse</h1>
              <p class="text-xs text-slate-400">Suivez l’évolution de vos charges et volumes</p>
            </div>
            <button onclick="IronPulse.App.navigate('history')" class="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
              🗓 Historique
            </button>
          </div>

          ${subTabBar}

          <!-- Carte Graphique par Exercice -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-bold text-slate-300">Exercice analysé :</label>
              <select onchange="IronPulse.App.setChartExercise(this.value)" class="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none max-w-[210px]">
                ${state.exercises
                  .map((ex) => `<option value="${ex.id}" ${ex.id === ui.selectedChartExerciseId ? 'selected' : ''}>${escapeHtml(ex.name)}</option>`)
                  .join('')}
              </select>
            </div>

            <!-- Choix de la métrique -->
            <div class="grid grid-cols-3 gap-1.5">
              <button onclick="IronPulse.App.setChartMetric('best1RM')" class="py-1.5 rounded-lg text-[11px] font-bold transition ${
                ui.selectedChartMetric === 'best1RM'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }">
                1RM Estimé (kg)
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

            <!-- Résumé Chiffré (Epley + Brzycki + Meilleure Série) -->
            <div class="grid grid-cols-4 gap-1.5 bg-slate-900/70 rounded-xl p-2.5 border border-slate-800/80 text-center">
              <div>
                <div class="text-[9px] text-slate-400">1RM Epley</div>
                <div class="text-xs font-extrabold text-white">${timeline.length ? `${timeline[timeline.length - 1].best1RM} kg` : '—'}</div>
              </div>
              <div>
                <div class="text-[9px] text-amber-300">1RM Brzycki</div>
                <div class="text-xs font-extrabold text-amber-300">${timeline.length ? `${timeline[timeline.length - 1].best1RMBrzycki || timeline[timeline.length - 1].best1RM} kg` : '—'}</div>
              </div>
              <div>
                <div class="text-[9px] text-slate-400">Évolution</div>
                <div class="text-xs font-extrabold text-emerald-400">${deltaStat}</div>
              </div>
              <div>
                <div class="text-[9px] text-slate-400">Meilleure</div>
                <div class="text-[11px] font-bold text-slate-200 truncate">${timeline.length ? timeline[timeline.length - 1].bestSetStr : '—'}</div>
              </div>
            </div>

            <!-- Courbe SVG -->
            ${ns.Charts.renderExerciseChart(timeline, ui.selectedChartMetric)}
          </div>

          <!-- Graphique Tonnage des dernières séances -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-white">Tonnage par séance (7 dernières)</h3>
              <span class="text-[11px] text-slate-400">Volume total déplacé</span>
            </div>
            ${ns.Charts.renderWorkoutVolumeBars(state.history)}
          </div>

          <!-- Répartition par Groupe Musculaire -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div>
              <h3 class="text-sm font-bold text-white">Équilibre des groupes musculaires</h3>
              <p class="text-[11px] text-slate-400">Nombre de séries effectives enregistrées</p>
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
        ? `<div class="text-xs text-slate-400">Continuez à enregistrer vos séances pour dégager des tendances de progression.</div>`
        : analysis.highlights
            .map(
              (h) => `
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-2">
            <div>
              <div class="text-xs font-bold text-white">${escapeHtml(h.exerciseName)}</div>
              <div class="text-[11px] text-slate-300 mt-0.5">${escapeHtml(h.comment)}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">Dernière perf : ${escapeHtml(h.latestPerf)}</div>
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
          <p class="text-xs text-slate-400">Analyse des progrès & ajustements prudents personnalisés</p>
        </div>

        ${subTabBar}

        <!-- Bandeau Prudence Médicale Obligatoire -->
        <div class="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 flex items-start gap-2.5">
          <span class="text-amber-400 text-base shrink-0 mt-0.5">⚕️</span>
          <div class="text-[11px] text-amber-100/90 leading-relaxed">
            <strong class="text-amber-300 font-bold">Prudence & Santé :</strong> ${escapeHtml(ns.AICoach.MEDICAL_DISCLAIMER)}
          </div>
        </div>

        <!-- Synthèse des Progrès Détectés -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-extrabold text-white">📈 Progrès mis en évidence</h3>
            <span class="text-[11px] text-emerald-400 font-semibold">RPE moyen : ${analysis.avgGlobalRpe}/10</span>
          </div>
          <div class="space-y-2">
            ${highlightsHtml}
          </div>
        </div>

        <!-- Ajustements Prudents Proposés -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div>
            <h3 class="text-sm font-extrabold text-white">🎯 Ajustements adaptés à votre profil</h3>
            <p class="text-[11px] text-slate-400">Basés sur votre objectif, votre niveau et la gestion de la fatigue</p>
          </div>
          <div class="space-y-2">
            ${adjustmentsHtml}
          </div>
        </div>

        <!-- Consultation interactive du Coach IA (Moteur Local + Google Gemini 3.8 Flash) -->
        <div class="bg-gradient-to-b from-indigo-950/40 to-[#151C28] border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">💬 Interroger le Coach IA</h3>
              <p class="text-[11px] text-slate-400">
                ${
                  state.profile.geminiApiKey
                    ? 'Connecté à Google AI Studio (' + (state.profile.geminiModel || 'gemini-2.5-flash') + ')'
                    : 'Moteur biomécanique local actif (Clé Google AI Studio configurable dans Profil)'
                }
              </p>
            </div>
          </div>

          <!-- Questions rapides -->
          <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button onclick="IronPulse.App.askAI('Analyse mes dernières séances et propose un plan pour ma prochaine semaine.')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              📋 Bilan de ma semaine
            </button>
            <button onclick="IronPulse.App.askAI('Je stagne au développé militaire, quel ajustement prudent conseilles-tu ?')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              🏋️ Débloquer un plateau
            </button>
            <button onclick="IronPulse.App.askAI('Je ressens une légère fatigue aux épaules, comment adapter ma séance avec prudence ?')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 whitespace-nowrap">
              🛡️ Fatigue aux épaules
            </button>
          </div>

          <!-- Formulaire question libre -->
          <div class="flex gap-2">
            <input
              id="ai-question-input"
              type="text"
              value="${escapeHtml(ui.aiCustomQuestion)}"
              oninput="IronPulse.App.setAICustomQuestion(this.value)"
              placeholder="Posez une question sur votre entraînement ou récupération..."
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

          <!-- Réponses du Coach -->
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
                ? `<div class="text-[11px] text-slate-400 text-center py-2">Touchez un bouton rapide ci-dessus pour générer un bilan détaillé.</div>`
                : chatLogs
                    .slice(0, 3)
                    .map(
                      (entry) => `
                  <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div class="flex items-center justify-between text-[10px] text-indigo-300 font-semibold">
                      <span>Demande : « ${escapeHtml(entry.question)} »</span>
                      <span>${entry.source && entry.source.startsWith('gemini') ? '✨ Google AI Studio (' + entry.source + ')' : '⚙️ Analyse Locale'}</span>
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
  // RENDU ÉCRAN 7 : PROFIL & PARAMÈTRES
  // ============================================================================
  function computeBiometricSummary(profile) {
    const age = Number(profile.age) || 25;
    const heightCm = Number(profile.heightCm) || 182;
    const weightKg = Number(profile.bodyWeightKg) || 78.5;
    const freq = Number(profile.weeklyTarget) || 4;
    const gender = profile.gender === 'female' ? 'female' : 'male';
    const heightM = heightCm / 100;
    const bmi = heightM > 0 ? +(weightKg / (heightM * heightM)).toFixed(1) : 22.5;
    let bmiLabel = 'Athlétique / Normal';
    let bmiColor = 'text-emerald-400';
    if (bmi < 18.5) {
      bmiLabel = 'Gabarit Léger (Surplus conseillé)';
      bmiColor = 'text-sky-400';
    } else if (bmi >= 25 && bmi < 30) {
      bmiLabel = 'Gabarit Puissant / Massif';
      bmiColor = 'text-amber-400';
    } else if (bmi >= 30) {
      bmiLabel = 'Gabarit Titan (Priorité Recomposition)';
      bmiColor = 'text-rose-400';
    }
    // Mifflin-St Jeor (Homme: +5 | Femme: -161) + multiplicateur selon fréquence
    const genderOffset = gender === 'female' ? -161 : 5;
    const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset);
    const activityMult = freq <= 2 ? 1.375 : freq <= 4 ? 1.55 : 1.725;
    const tdee = Math.round(bmr * activityMult);

    const goal = (profile.goal || 'hypertrophy').toLowerCase();
    let calorieDelta = 280;
    let goalNutritionLabel = 'Surplus Hypertrophie (+280 kcal)';
    if (goal === 'fatloss') {
      calorieDelta = -400;
      goalNutritionLabel = 'Déficit Sèche (-400 kcal)';
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
    if (level === 'beginner' || level.includes('débutant') || goal === 'fitness' || freq <= 3) {
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
            <p class="text-xs text-slate-400">Biométrie (âge, taille, poids), objectifs, Coach IA et Tutoriel</p>
          </div>
          <button
            onclick="IronPulse.App.openOnboardingWizard(1)"
            class="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-black text-amber-300 transition shrink-0"
          >
            🎓 Assistant & Tuto
          </button>
        </div>

        <!-- Carte Tactique Biométrique (IMC + Kcal + Protéines) -->
        <div class="shonen-card rounded-2xl p-3.5 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-[#151C28] to-[#0B0F17]">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">📡 Bilan Biométrique Tactique</span>
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
              <div class="text-[9px] text-slate-400 uppercase font-bold">Protéines</div>
              <div class="text-sm font-black text-emerald-300">${bio.proteinTargetG} <span class="text-[9px] font-normal">g/j</span></div>
            </div>
            <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-2">
              <div class="text-[9px] text-slate-400 uppercase font-bold">Gabarit</div>
              <div class="text-xs font-black text-indigo-300">${bio.heightCm}cm · ${bio.age}a</div>
            </div>
          </div>
        </div>

        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Prénom / Pseudo de Chasseur</label>
            <input
              type="text"
              value="${escapeHtml(profile.name)}"
              onchange="IronPulse.App.updateProfileField('name', this.value)"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div class="grid grid-cols-3 gap-2.5">
            <div>
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Âge (ans)</label>
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
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Séances cibles / sem.</label>
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
              <label class="block text-[11px] font-bold text-slate-300 mb-1">Repos par défaut (s)</label>
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

        <!-- Tutoriel Interactif & Visite Guidée -->
        <div class="bg-[#151C28] border border-amber-500/30 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-amber-300">🎓 Tutoriel & Première Utilisation</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Interactif</span>
          </div>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Relancez à tout moment le questionnaire de personnalisation initiale, le tutoriel illustré des fonctionnalités ou la visite guidée pas-à-pas.
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              onclick="IronPulse.App.openOnboardingWizard(1)"
              class="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-extrabold text-amber-300 transition"
            >
              📋 Questionnaire & Tuto
            </button>
            <button
              onclick="IronPulse.App.startGuidedTour()"
              class="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-extrabold text-emerald-300 transition"
            >
              🧭 Visite Guidée des Onglets
            </button>
          </div>
        </div>

        <!-- Configuration Optionnelle Clé API Google AI Studio / Gemini -->
        <div class="bg-[#151C28] border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs">✨</span>
              <span class="text-xs font-black uppercase tracking-wider text-white">Google AI Studio • Moteur Gemini</span>
            </div>
            <span class="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30">
              ${profile.geminiModel || 'gemini-2.5-flash'}
            </span>
          </div>

          <p class="text-[11px] text-slate-300 leading-relaxed">
            Le Coach IA fonctionne immédiatement hors-ligne grâce à son moteur biomécanique local. Pour débloquer la synthèse conversationnelle complète de Google DeepMind, configurez votre clé API gratuite Google AI Studio.
          </p>

          <!-- Sélecteur de Modèle -->
          <div class="space-y-1">
            <label class="block text-[10px] font-black uppercase text-slate-400">Modèle Gemini</label>
            <select
              onchange="IronPulse.App.updateProfileField('geminiModel', this.value)"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="gemini-2.5-flash" ${(profile.geminiModel || 'gemini-2.5-flash') === 'gemini-2.5-flash' ? 'selected' : ''}>
                Gemini 2.5 Flash (Recommandé • Ultra-rapide & équilibré)
              </option>
              <option value="gemini-2.0-flash" ${profile.geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>
                Gemini 2.0 Flash (Raisonnement avancé)
              </option>
              <option value="gemini-1.5-flash" ${profile.geminiModel === 'gemini-1.5-flash' ? 'selected' : ''}>
                Gemini 1.5 Flash (Standard stable)
              </option>
            </select>
          </div>

          <!-- Saisie Clé API avec bouton Masquer/Afficher -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-[10px] font-black uppercase text-slate-400">Clé API Google AI Studio</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                class="text-[10px] text-amber-400 hover:text-amber-300 font-extrabold underline flex items-center gap-1"
              >
                <span>🔑 Obtenir une clé gratuite</span>
                <span>↗</span>
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
                title="${ui.showApiKey ? 'Masquer la clé' : 'Afficher la clé'}"
              >
                ${ui.showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <p class="text-[9px] text-slate-500">
              🔒 Sécurité locale : votre clé est conservée uniquement dans votre navigateur (localStorage) et n'est jamais transmise à des tiers.
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
              <span>${ui.geminiTesting ? '⏳' : '⚡'}</span>
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
                ${ui.geminiTestResult.success ? '✓' : '⚠️'} ${escapeHtml(ui.geminiTestResult.message)}
              </div>
            `
                : ''
            }
          </div>
        </div>

        <!-- Gestion des données & Préréglage AURA FIT (Mehdi) -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Données, Export Antigravity & Profil Mehdi</h3>
            <span class="text-[10px] font-bold text-amber-300">AURA FIT × IRONPULSE Z</span>
          </div>
          <button
            onclick="IronPulse.App.loadMehdiProfile()"
            class="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-xs font-extrabold text-amber-300 transition flex items-center justify-center gap-2"
          >
            ⚡ Charger le Profil Mehdi (AURA FIT — Rang B • 25 ans • 182 cm • 78.5 kg)
          </button>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="IronPulse.App.exportDataJson()" class="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition">
              ⬇ Export JSON
            </button>
            <button onclick="IronPulse.App.exportAntigravityMarkdown()" class="py-2.5 px-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 transition">
              📄 Export MD
            </button>
            <button onclick="IronPulse.App.resetDemoData()" class="py-2.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition">
              ↺ Reset Visite
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <button onclick="IronPulse.App.exportIronPulseBackup()" class="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-[11px] font-black text-emerald-300 transition flex items-center justify-center gap-1.5">
              <span>🔒</span> <span>Sauvegarde .ironpulse</span>
            </button>
            <label class="py-2.5 px-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[11px] font-black text-cyan-300 transition flex items-center justify-center gap-1.5 cursor-pointer">
              <span>📥</span> <span>Restaurer .ironpulse</span>
              <input type="file" accept=".ironpulse,.json" onchange="IronPulse.App.importIronPulseFile(event)" class="hidden" />
            </label>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU ÉCRAN 8 : HÉROS RPG (UNIVERS SHONEN AURA PULSE & GUILDE)
  // ============================================================================
  function renderRPGScreen() {
    if (!ns.RPG) return '<div class="text-xs text-slate-400">Chargement du Système RPG...</div>';
    const hero = ns.RPG.getHeroProfile();

    const subTabs = [
      { id: 'hero', label: '⚔️ Statut' },
      { id: 'talents', label: '⚡ Talents' },
      { id: 'customize', label: '🎨 Studio' },
      { id: 'quests', label: '🐉 Donjons' },
      { id: 'relics', label: '👑 Reliques' },
      { id: 'guild', label: '🛡️ Guilde' }
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

    // En-tête commun du Chasseur (Fenêtre Système)
    const heroHeader = `
      <div class="shonen-arena-card relative overflow-hidden bg-gradient-to-br from-indigo-950/50 via-[#151C28] to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div class="shonen-arena-bg" style="background-image: url('${hero.arenaBgUrl}');"></div>
        <div class="relative z-10 flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${ns.RPG.resolveAssetUrl(hero.classObj.artFile)}" alt="${escapeHtml(hero.classObj.name)}" class="w-12 h-12 rounded-2xl object-cover object-top border-2 border-amber-400/60 shrink-0 shadow-md" />
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-2 py-0.5 rounded border text-[10px] font-black ${hero.rankObj.badgeBg}">RANG ${hero.rankObj.rank}</span>
                <span class="text-[11px] font-bold text-amber-300">« ${escapeHtml(hero.appearance?.battleTitle || hero.appearance?.customTitle || hero.rankObj.title)} »</span>
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
            <span class="text-slate-300 font-semibold">Expérience d'Éveil (Total : ${hero.totalXp} XP)</span>
            <span class="text-emerald-400 font-bold">${hero.xpInCurrentLevel} / ${hero.xpForNextLevel} XP (${hero.levelProgressPct}%)</span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: ${hero.levelProgressPct}%"></div>
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 flex-wrap gap-1">
            <span>⚡ CP : <strong class="text-white">${hero.combatPower}</strong></span>
            <span>❤️ HP : <strong class="text-rose-400">${hero.hpMax}</strong></span>
            <span>💧 MP : <strong class="text-cyan-300">${hero.mpMax}</strong></span>
            <span>🪙 Or : <strong class="text-amber-300">${hero.gold}</strong></span>
            <span>🔥 Série : <strong class="text-orange-400">${hero.streakDays}j</strong></span>
          </div>
        </div>
      </div>
    `;

    // SOUS-ONGLET TALENTS SHŌNEN (ARBRE DE COMPÉTENCES : TITAN, MOINE, OMBRE) - Densetsu Scénariste
    if (ui.rpgSubTab === 'talents') {
      const state = ns.Storage.getState();
      const tpAvailable = ns.RPG.getTalentPointsAvailable(state);
      const mults = ns.RPG.computeTalentMultipliers(state);
      const allocated = (state.rpg && state.rpg.talents && state.rpg.talents.allocated) || {};

      const talentPaths = [
        { key: 'TITAN', def: ns.RPG.TALENT_PATHS.TITAN },
        { key: 'MONK', def: ns.RPG.TALENT_PATHS.MONK },
        { key: 'SHADOW', def: ns.RPG.TALENT_PATHS.SHADOW }
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
                        ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">✓ Max</span>`
                        : isLocked
                        ? `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px] font-bold">🔒 Prérequis</span>`
                        : `<button onclick="IronPulse.App.unlockTalent('${node.id}')" ${canUnlock ? '' : 'disabled'} class="px-2.5 py-1 rounded-lg ${
                            canUnlock ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-500'
                          } text-[10px] transition active:scale-95">
                            ⚡ Éveiller (${node.costPerRank} TP)
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

          <!-- Bannière Points de Talents -->
          <div class="bg-gradient-to-r from-amber-950/40 via-[#151C28] to-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-2 shadow-lg">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-amber-300">Points d’Éveil Shōnen</span>
              <div class="text-xl font-black text-white flex items-center gap-2">
                <span>⚡ ${tpAvailable} TP Disponibles</span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">Gagnez 1 TP à chaque passage de niveau pour débloquer vos spécialisations</p>
            </div>
            <button onclick="IronPulse.App.resetTalents()" class="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-extrabold text-slate-300 transition shrink-0">
              ↺ Réinitialiser
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
                        <div class="text-[10px] text-slate-400 truncate">Niv. ${item.minLevel} requis • ${item.priceGold === 0 ? 'Gratuit' : `${item.priceGold} 🪙`}</div>
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
                          ? '✓ Équipé'
                          : item.unlocked
                          ? 'Équiper'
                          : !item.levelMet
                          ? `🔒 Niv.${item.minLevel}`
                          : `🪙 ${item.priceGold}`
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
                ${active ? 'ÉQUIPÉ' : '+ AJOUTER'}
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
            « ${escapeHtml(title)} »
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

          <!-- SCÈNE D'APERÇU EN DIRECT DU STRIKER PLEIN PIED TORSE NU -->
          <div class="shonen-arena-card relative overflow-hidden bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3">
            <div class="shonen-arena-bg" style="background-image: url('${hero.arenaBgUrl}');"></div>
            <div class="relative z-10 flex items-center justify-between">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-amber-300 font-black">⚡ Studio Striker Cinétique (Plein Pied & Torse Nu)</span>
                <h2 class="text-sm font-extrabold text-white">Apparence & Aura Cinétique</h2>
              </div>
              <button
                onclick="IronPulse.App.updateHeroAppearance('lightningSparks', ${!sparksOn})"
                class="px-2.5 py-1 rounded-xl border text-[10px] font-extrabold transition ${
                  sparksOn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }"
              >
                ⚡ Éclairs d'Aura : ${sparksOn ? 'ACTIFS' : 'OFF'}
              </button>
            </div>

            <div class="relative z-10 flex justify-center py-1">
              <div class="w-full max-w-[235px]">
                ${ns.RPG.renderHeroAvatarSVG(hero)}
              </div>
            </div>
          </div>

          <!-- ARCHÉTYPES MANGA RPG & SPORTS DE COMBAT (1-CLIC) -->
          <div class="bg-gradient-to-r from-red-950/60 via-slate-900 to-indigo-950/60 border-2 border-amber-500/50 rounded-2xl p-4 space-y-3 shadow-xl">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-amber-500/25 border border-amber-400 text-amber-300 text-[9px] font-black uppercase tracking-wider">⚡ STYLES SPORTS & COMBAT MANGA</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white mt-1">Archétypes Sport & Arts Martiaux (1-Clic)</h3>
                <p class="text-[11px] text-slate-300">Activez en 1 clic l'apparence, l'aura et la morphologie de Baki, Ippo, Dragon Ball Z, Solo Leveling ou Persona.</p>
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
                      ${isActive ? '✓ Archétype Actif' : `⚡ Activer ${escapeHtml(arch.name)}`}
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- BOUTIQUE & DRESSING 16-BIT AURA FIT (TENUES, ACCESSOIRES, DÉCORS PAYABLES EN OR 🪙) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">🛍️ Boutique & Dressing GAUVAX 16-Bit (AURA FIT)</h3>
                <p class="text-[11px] text-slate-400">Débloquez tenues, accessoires et décors avec votre Or gagné en séance</p>
              </div>
              <span class="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black shrink-0">
                🪙 ${hero.gold} Or
              </span>
            </div>

            ${renderWardrobeSlotSection('outfit', '👕 Tenues (Outfit)')}
            ${renderWardrobeSlotSection('accessory', '🎧 Accessoires Signature')}
            ${renderWardrobeSlotSection('background', '🌃 Décors de Salle 16-Bit')}
          </div>

          <!-- IMPORT & CRÉATION AVATAR 3D PROFESSIONNEL (GLTF / READY PLAYER ME) -->
          <div class="bg-gradient-to-r from-indigo-950/80 to-slate-900 border-2 border-indigo-500/60 rounded-2xl p-4 space-y-3 shadow-xl">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-[9px] font-black uppercase tracking-wider">PIPELINE 3D PRO • GLTF</span>
                <h3 class="text-xs font-black uppercase tracking-wider text-white mt-1">🌐 Importateur d'Avatar 3D Réaliste (GLB / Ready Player Me)</h3>
                <p class="text-[11px] text-slate-300">Chargez n'importe quel modèle 3D polygonal texturé (Ready Player Me, Mixamo, scan 3D) ou collez son lien GLB.</p>
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
                  ⚡ Charger GLB
                </button>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Créez gratuitement votre avatar réaliste sur <a href="https://readyplayer.me" target="_blank" rel="noopener noreferrer" class="text-indigo-400 underline font-bold">Ready Player Me</a> puis collez son URL GLB.</span>
                ${app.customModelGlb ? `<button onclick="IronPulse.App.clearCustomGlbModel()" class="text-rose-400 hover:underline font-bold">Réinitialiser (Modèle Standard)</button>` : ''}
              </div>
            </div>
          </div>

          <!-- 1. SEXE & ARCHÉTYPE MANGA -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">1. Sexe & Identité Manga (3D & 2D)</h3>
              <p class="text-[11px] text-slate-400">Striker masculin ou Guerrière Valkyrie avec tenue ajustée</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${genderPills}
            </div>
          </div>

          <!-- 2. MORPHOLOGIE DU CORPS (5 PROPOSITIONS SHONEN & COMBAT) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">2. Morphologie & Musculature (V-Taper, Baki, Ippo, Titan, Valkyrie)</h3>
              <p class="text-[11px] text-slate-400">Impacte la carrure, les trapèzes, les striations et le rendu des sprites de combat</p>
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
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">5. Couleur des Cheveux (Éveil Cinétique)</h3>
              <p class="text-[11px] text-slate-400">Noir Onyx, Or Cinétique, Argent Astral, Rouge Berserker, Cyan Pulsé, Améthyste...</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${hairPills}
            </div>
          </div>

          <!-- 6. FORME DU VISAGE & MÂCHOIRE (3 CHOIX) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">6. Forme du Visage & Mâchoire (3 Choix)</h3>
              <p class="text-[11px] text-slate-400">Structure angulaire manga, ciselage de la mâchoire et proportion crânienne 3D</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${jawTypePills}
            </div>
          </div>

          <!-- 7. REGARD & COULEUR DES YEUX MANGA -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">7. Regard & Couleur des Yeux (Lueur d'Aura)</h3>
              <p class="text-[11px] text-slate-400">Iris luminescents avec reflets d'énergie martiale</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${eyePills}
            </div>
            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-cyan-300">Volutes de Fumée de Mana (Mana Smoke FX)</span>
                <p class="text-[10px] text-slate-400">Émanation d'énergie magique depuis les coins des yeux</p>
              </div>
              <button
                onclick="IronPulse.App.updateHeroAppearance('manaEyeSmoke', ${app.manaEyeSmoke === false})"
                class="px-2.5 py-1 rounded-xl border text-[10px] font-black transition ${
                  app.manaEyeSmoke !== false
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }"
              >
                ${app.manaEyeSmoke !== false ? '✓ ACTIF' : 'OFF'}
              </button>
            </div>
          </div>

          <!-- 8. EXPRESSION FACIALE SHONEN -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">8. Expression Faciale & Tempérament</h3>
              <p class="text-[11px] text-slate-400">Déterminé, Regard du Monarque, Rage Berserker 1RM ou Sourire Confiant</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${expressionPills}
            </div>
          </div>

          <!-- 9. MARQUAGES DE GUERRE & CICATRICES -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">9. Marquages de Guerre & Cicatrices</h3>
              <p class="text-[11px] text-slate-400">Cicatrice oculaire biseautée, runes astrales, bandes de chasseur d’ombre</p>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${markingPills}
            </div>
          </div>

          <!-- 10. FLAMME D'AURA & ÉNERGIE D'ÉVEIL -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">10. Flamme d'Aura & Énergie d'Éveil</h3>
              <p class="text-[11px] text-slate-400">Aura d'Or Solaire, Surcharge Écarlate, Pulsation Azur, Éther Astral...</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${auraPills}
            </div>
          </div>

          <!-- 11. TENUE URBAINE & TECHWEAR (3 PROPOSITIONS) -->
          <div class="bg-[#151C28] border border-amber-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">11. Tenue Urbaine & Fitness Techwear (3 Propositions)</h3>
              <p class="text-[11px] text-slate-400">Dogi de l'Ordre, Stringer Techwear & Cargo à sangles, ou Combinaison Cyber-Pulse</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              ${outfitPills}
            </div>
          </div>

          <!-- 12. ÉQUIPEMENTS DE FORCE & POWERLIFTING PRO -->
          <div class="bg-[#151C28] border border-emerald-500/40 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-emerald-300">12. Équipements de Force Professionnels</h3>
              <p class="text-[11px] text-slate-400">Ceinture à levier acier, genouillères 7mm néoprène, protège-poignets et sangles grip</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${powerEquipmentPills}
            </div>
          </div>

          <!-- 13. COULEUR DE BASE & TEINTE D'ARMURE -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">13. Teinte d'Armure & Accents de Tenue</h3>
              <p class="text-[11px] text-slate-400">Couleurs des tissus, passepoils tactiques et ceinture nouée</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${armorPills}
            </div>
          </div>

          <!-- 14. CLASSE & ARCHÉTYPE DE PLEIN PIED -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">14. Archétype & Illustration de Classe</h3>
              <p class="text-[11px] text-slate-400">Artworks HD pour le mode Portrait & Bannière de Guilde</p>
            </div>
            <div class="grid grid-cols-2 gap-2">
              ${classPortraits}
            </div>
          </div>

          <!-- 15. TITRE DE COMBAT -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-white">15. Titre de Striker Cinétique</h3>
              <p class="text-[11px] text-slate-400">Affiché sur le HUD tactique et dans le classement de Guilde</p>
            </div>
            <div class="flex flex-wrap gap-1.5">
              ${titlePills}
            </div>
          </div>

          <!-- 16. SAUVEGARDE & TRANSFERT CLOUD / FICHIER JSON -->
          <div class="bg-gradient-to-r from-emerald-950/40 via-[#151C28] to-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xs font-extrabold uppercase tracking-wider text-emerald-300">💾 Sauvegarde & Restauration du Chasseur</h3>
                <p class="text-[11px] text-slate-400">Exportez votre profil, vos 1RM et votre progression pour ne jamais rien perdre</p>
              </div>
              <span class="text-xl">🛡️</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                onclick="IronPulse.App.exportBackup()"
                class="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span>💾</span> Exporter (.json)
              </button>
              <label class="cursor-pointer py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95">
                <span>📥</span> Importer (.json)
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
                    ? `<span class="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-extrabold shrink-0">Équipée</span>`
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

          <!-- Aperçu Visuel de l'Avatar & Équipements actifs -->
          <div class="bg-[#151C28] border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
            <div class="w-36 shrink-0">
              ${ns.RPG.renderHeroAvatarSVG(hero, { compact: true })}
            </div>
            <div class="flex-1 space-y-2">
              <div class="text-xs font-extrabold text-white">Direction Artistique Shonen & Éveil</div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Personnalisez l'illustration HD, la couleur d'Aura Ki, les éclairs et l'armure de votre <strong class="text-emerald-400">${escapeHtml(hero.classObj.name)}</strong>.
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button onclick="IronPulse.App.setRpgSubTab('customize')" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold transition">
                  🎨 Studio Apparence
                </button>
                <button onclick="IronPulse.App.setRpgSubTab('relics')" class="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[11px] font-bold transition">
                  👑 Reliques (${hero.relicsStatus.filter((r) => r.equipped).length})
                </button>
              </div>
            </div>
          </div>

          <!-- Attributs Biomécaniques du Chasseur -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-sm font-extrabold text-white">📊 Attributs d'Éveil (Liés aux muscles)</h2>
                <p class="text-[11px] text-slate-400">Augmentent automatiquement selon vos séries et records 1RM</p>
              </div>
            </div>
            <div class="space-y-3 pt-1">
              ${attrsHtml}
            </div>
          </div>

          <!-- Choix de la Classe Shonen / Fantasy -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">⚔️ Classe de Chasseur (Spécialisation)</h2>
              <p class="text-[11px] text-slate-400">Changez de classe à tout moment selon votre cycle d'entraînement</p>
            </div>
            <div class="space-y-2">
              ${classesHtml}
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 2 : QUÊTES DU SYSTÈME & BOSS DE DONJON
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
                <span class="${q.completed ? 'text-emerald-400 font-bold' : 'text-amber-300'}">${q.completed ? '✓ Accomplie' : 'En cours'}</span>
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
                ${b.defeated ? '✓ BOSS VAINCU' : `Récompense : +${b.rewardXp} XP`}
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

          <!-- Quêtes Hebdomadaires du Système -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">📜 Quêtes Hebdomadaires du Système</h2>
              <p class="text-[11px] text-slate-400">Validées automatiquement par vos séances des 7 derniers jours</p>
            </div>
            <div class="space-y-2">
              ${questsHtml}
            </div>
          </div>

          <!-- Boss de Donjon (Seuils 1RM) -->
          <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
            <div>
              <h2 class="text-sm font-extrabold text-white">🐉 Boss de Donjon (Records 1RM)</h2>
              <p class="text-[11px] text-slate-400">Terrassez les Boss en franchissant des paliers de force (1RM estimé)</p>
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
                    ${r.unlocked ? r.icon : '🔒'}
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
                          ${r.equipped ? '✓ Équipé' : 'Équiper'}
                        </button>`
                      : `<span class="px-2 py-1 rounded bg-slate-800 text-slate-500 text-[10px] font-bold">Verrouillé</span>`
                  }
                </div>
              </div>
              <div class="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                Condition d'éveil : <strong class="text-slate-200">${escapeHtml(r.conditionDesc)}</strong>
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
                <h2 class="text-sm font-extrabold text-white">👑 Arsenal & Reliques des Ombres</h2>
                <p class="text-[11px] text-slate-400">Équipez vos reliques débloquées pour cumuler jusqu'à +51% de bonus d'XP</p>
              </div>
            </div>
            <div class="space-y-2.5">
              ${relicsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // SOUS-ONGLET 4 : SOCIAL, DÉFIS D'AMIS & COMPÉTITIONS DE CLUB (GUILDE)
    const challengesHtml = hero.evaluatedChallenges
      .map((ch) => {
        return `
          <div class="bg-slate-900/90 border ${ch.isWinning ? 'border-emerald-500/40' : 'border-slate-800'} rounded-xl p-3 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-base">${ch.friendAvatar}</span>
                <div>
                  <div class="text-xs font-extrabold text-white">${escapeHtml(ch.title)}</div>
                  <div class="text-[11px] text-indigo-300">Contre ${escapeHtml(ch.friendName)} • Reste ${ch.daysLeft}j</div>
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
                ${ch.isWinning ? '🔥 Vous êtes en tête du duel !' : '⚡ Encore un effort pour passer devant !'}
              </span>
              ${
                ch.isClaimed
                  ? `<span class="text-[11px] font-bold text-emerald-400">✓ Récompense encaissée</span>`
                  : ch.isWinning
                  ? `<button onclick="IronPulse.App.claimChallengeReward('${ch.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-extrabold active:scale-95 transition">
                      Réclamer +${ch.rewardXp} XP
                    </button>`
                  : `<button onclick="IronPulse.App.navigate('workout')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold">
                      S'entraîner →
                    </button>`
              }
            </div>
          </div>
        `;
      })
      .join('');

    const leaderboardHtml = hero.leaderboard
      .map((m, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
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
                <div class="text-[10px] text-slate-400">Niv. ${m.level} • ${escapeHtml(m.heroClass)}</div>
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

        <!-- Bannière Club & Ligue Shōnen (Hub Communautaire & Viral) -->
        <div class="bg-gradient-to-br from-indigo-950/60 via-[#151C28] to-[#151C28] border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-3">
              <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-indigo-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow">
                ⚡
              </span>
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Club & Guilde Active</span>
                  <span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">${escapeHtml(hero.guildTier || 'Ligue Or')}</span>
                </div>
                <h2 class="text-base font-black text-white leading-tight mt-0.5">${escapeHtml(hero.guildName)}</h2>
                <p class="text-[11px] text-slate-400 italic">« ${escapeHtml(hero.guildMotto)} »</p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="IronPulse.App.openSwitchClubModal()" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition active:scale-95">
                🔄 Changer
              </button>
              <button onclick="IronPulse.App.openCreateChallengeModal()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] shadow transition active:scale-95">
                ⚔️ Défier un Ami
              </button>
              <button onclick="IronPulse.App.shareHunterChallenge('Rejoins mon Dojo')" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] shadow transition active:scale-95" title="Partager sur WhatsApp / Instagram">
                📲 Partager
              </button>
            </div>
          </div>

          <div class="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
            <div class="flex justify-between text-xs">
              <span class="font-bold text-amber-300">🔥 Boss de Raid de Guilde : Dragon de Fer</span>
              <span class="font-bold text-white">${(guildTotalVol / 1000).toFixed(1)} / ${(raidTargetVol / 1000).toFixed(0)} t (${raidPct}%)</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style="width: ${raidPct}%"></div>
            </div>
            <div class="text-[11px] text-slate-400">
              Chaque série validée par vous et les membres de votre club inflige des dégâts au Boss de Raid hebdomadaire.
            </div>
          </div>

          <!-- BOSS MONDIAL ASYNCHRONE CALAMITÉ (1 000 000 PV) - Densetsu Scénariste -->
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
                  ${wb.isDefeated ? '💀 TERRASSÉ' : '🔥 ACTIF'}
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
                <span>⚔️ Vos Dégâts : <strong class="text-white">${wb.userDamage.toLocaleString()} PV</strong> (${wb.userContributionPct}%)</span>
                <span class="text-amber-300 font-bold">🎁 Paliers : 25% • 50% • 100%</span>
              </div>
            </div>
            `;
          })()}
        </div>

        <!-- 3 DÉFIS HEBDOMADAIRES DU CLUB POUR SES ADHÉRENTS -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">🎯 Défis du Club pour les Adhérents</h3>
              <p class="text-[11px] text-slate-400">Objectifs collectifs de la semaine lancés par l'administration du Dojo</p>
            </div>
            <span class="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-black">
              Hebdo ⏳
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
                      +${cc.rewardXp} XP • 🪙${cc.rewardGold}
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
                        ? `<span class="text-[10px] font-bold text-emerald-400">✓ Récompense réclamée</span>`
                        : `<button onclick="IronPulse.App.claimClubChallenge('${cc.id}')" class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] transition active:scale-95 shadow">
                            Réclamer Récompense (+${cc.rewardXp} XP)
                          </button>`
                    }
                  </div>
                </div>
              `)
              .join('')}
          </div>
        </div>

        <!-- FIL D'ACTUALITÉ EN DIRECT DES POTES DE FONTE -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">⚡ Fil d'Activité des Potes de Fonte</h3>
              <p class="text-[11px] text-slate-400">Flux en direct des séances et records validés par vos amis</p>
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

        <!-- Duels & Défis d'Amis en cours -->
        <div class="bg-[#151C28] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-extrabold text-white">⚔️ Défis d'Amis en Direct (${hero.evaluatedChallenges.length})</h3>
              <p class="text-[11px] text-slate-400">Affrontez vos amis sur le tonnage, le nombre de séries ou la régularité</p>
            </div>
            <button onclick="IronPulse.App.shareHunterChallenge('Défi de Fonte')" class="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold hover:bg-indigo-500/30">
              📲 Inviter un Ami
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
              <h3 class="text-sm font-extrabold text-white">🏆 Classement Hebdomadaire du Club</h3>
              <p class="text-[11px] text-slate-400">Classé par tonnage total soulevé sur les 7 derniers jours</p>
            </div>
            <span class="text-[10px] text-amber-300 font-bold">Ligue Active 🥇</span>
          </div>
          <div class="space-y-1.5">
            ${leaderboardHtml}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // RENDU DES MODALES (DÉTAIL EXERCICE, CRÉATION SÉANCE, RÉCAPITULATIF, ETC.)
  // ============================================================================
  function renderModal() {
    if (!ui.modal) return '';
    const state = ns.Storage.getState();

    // 1. Modale Fiche Détaillée d'un Exercice
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
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(ex.description)}</p>

            <!-- Démonstration Biomécanique 3D en direct par votre Striker -->
            ${
              ns.Hero3D
                ? `
              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="font-extrabold text-amber-300 uppercase tracking-wider">🧊 Démonstration 3D Interactive (360°)</span>
                  <span class="text-slate-400">Glissez pour tourner</span>
                </div>
                ${ns.Hero3D.renderHero3DStageHTML({ exerciseId: ex.id, compact: true })}
              </div>
            `
                : ''
            }

            <!-- Muscles ciblés -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 space-y-2">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Muscles principaux ciblés</span>
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

            <!-- Consignes d'exécution -->
            <div class="space-y-2">
              <h3 class="text-xs font-extrabold uppercase tracking-wider text-slate-200">📋 Consignes d’exécution</h3>
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
                <strong class="text-amber-300">💡 Conseil sécurité & posture :</strong> ${escapeHtml(ex.tips)}
              </div>
            `
                : ''
            }

            ${
              best1RM > 0
                ? `
              <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                <span class="text-slate-300">Votre record 1RM estimé :</span>
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
                  ＋ Ajouter à la séance en cours
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

    // 2. Modale Ajouter un exercice à la séance en cours
    if (ui.modal.type === 'add-workout-exercise') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[82vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Ajouter un exercice à la séance</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>
            <div class="space-y-2">
              ${state.exercises
                .map(
                  (ex) => `
                <div class="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <div>
                    <div class="text-xs font-bold text-white">${escapeHtml(ex.name)}</div>
                    <div class="text-[11px] text-slate-400">${escapeHtml(ex.muscleGroup)} • ${escapeHtml(ex.equipment)}</div>
                  </div>
                  <button onclick="IronPulse.App.addExerciseToActiveWorkout('${ex.id}')" class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">
                    ＋ Ajouter
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

    // 3. Modale Création d'une Séance Personnalisée
    if (ui.modal.type === 'create-session') {
      const draft = ui.modal.data;
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3.5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Créer une séance personnalisée</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom de la séance</label>
              <input
                type="text"
                value="${escapeHtml(draft.name)}"
                oninput="IronPulse.App.updateSessionDraftName(this.value)"
                placeholder="Ex: Pectoraux & Bras Spécial"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div class="space-y-2">
              <div class="text-xs font-bold text-slate-300">Exercices sélectionnés (${draft.exercises.length})</div>
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
                            <button onclick="IronPulse.App.removeDraftExercise(${idx})" class="text-slate-400 hover:text-rose-400 text-xs">✕</button>
                          </div>
                          <div class="grid grid-cols-3 gap-2">
                            <div>
                              <label class="block text-[10px] text-slate-400">Séries</label>
                              <input type="number" min="1" max="10" value="${item.targetSets}" onchange="IronPulse.App.updateDraftExField(${idx}, 'targetSets', Number(this.value))" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center" />
                            </div>
                            <div>
                              <label class="block text-[10px] text-slate-400">Répétitions</label>
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
              <label class="block text-xs font-bold text-slate-300 mb-1">Ajouter un exercice du répertoire :</label>
              <select onchange="if(this.value){IronPulse.App.addDraftExercise(this.value); this.value='';}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none">
                <option value="">＋ Choisir un exercice à ajouter...</option>
                ${state.exercises.map((ex) => `<option value="${ex.id}">${escapeHtml(ex.name)} (${escapeHtml(ex.muscleGroup)})</option>`).join('')}
              </select>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveCustomSessionDraft()" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                Enregistrer la séance
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Annuler
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 4. Modale Création d'un Exercice Personnalisé dans le Répertoire
    if (ui.modal.type === 'create-exercise') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">Ajouter un exercice au répertoire</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom de l’exercice</label>
              <input id="new-ex-name" type="text" placeholder="Ex: Fentes bulgares aux haltères" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
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
                <label class="block text-xs font-bold text-slate-300 mb-1">Équipement</label>
                <select id="new-ex-equip" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
                  ${ns.Data.EQUIPMENTS.filter((e) => e !== 'Tous')
                    .map((e) => `<option value="${e}">${escapeHtml(e)}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Muscles principaux ciblés</label>
              <input id="new-ex-primary" type="text" placeholder="Ex: Quadriceps, Grands fessiers" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Description & Consignes d'exécution</label>
              <textarea id="new-ex-desc" rows="3" placeholder="Décrivez la posture et les étapes clés d'exécution..." class="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"></textarea>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveNewExercise()" class="flex-1 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs">
                Ajouter au répertoire
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Annuler
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 5. Modale Lancer un Défi à un Ami / Membre de Guilde
    if (ui.modal.type === 'create-challenge') {
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border border-slate-700 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-3.5 shadow-2xl">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-extrabold text-white">⚔️ Lancer un Défi de Chasseur</h2>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Adversaire / Ami du Club</label>
              <input id="chal-friend-name" type="text" placeholder="Ex: Mehdi (Berserker Niv. 10)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Nom du défi</label>
              <input id="chal-title" type="text" placeholder="Ex: Choc des Titans — Tonnage 7j" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Type d'épreuve</label>
                <select id="chal-type" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white outline-none">
                  <option value="volume7d">Tonnage 7 jours (kg)</option>
                  <option value="sets7d">Séries validées (7j)</option>
                  <option value="workouts7d">Nombre de séances (7j)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Cible à atteindre</label>
                <input id="chal-target" type="number" value="15000" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none" />
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button onclick="IronPulse.App.saveNewChallenge()" class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">
                Envoyer le Défi (+250 XP en jeu)
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
                <h2 class="text-base font-extrabold text-white">🏛️ Choisir un Club / Guilde</h2>
                <p class="text-[11px] text-slate-400">Rejoignez un dojo pour participer aux raids et ligues collectives</p>
              </div>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
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
                          <p class="text-[10px] text-slate-400 italic mt-0.5">« ${escapeHtml(club.motto)} »</p>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span>👥 ${club.membersCount} adhérents • Tonnage : <strong>${(club.baseTonnage / 1000).toFixed(0)}t</strong></span>
                      ${
                        isCurrent
                          ? `<span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">✓ Votre Club</span>`
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

    // 6. Modale Échauffement Dynamique Articulaire & Montée en Charge (DynamicWarmupModal AURA FIT)
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
                  🔥 Protocole Pré-Combat AURA FIT
                </span>
                <h2 class="text-base font-extrabold text-white mt-1">Échauffement Dynamique & Gammes</h2>
                <p class="text-[11px] text-slate-400">Préparez vos articulations et votre système nerveux (+35 XP & +15 🪙)</p>
              </div>
              <button onclick="IronPulse.App.closeModal()" class="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-bold">✕</button>
            </div>

            <!-- Phase 1 : Mobilité Articulaire -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">1. Mobilité Articulaire & Coiffe (3 min)</div>
              <div class="space-y-1.5 text-xs text-slate-200">
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>🔄 Rotations externes épaules & dislocates</span>
                  <span class="font-bold text-emerald-300">2 × 15 rép.</span>
                </div>
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>🧘 Ouverture thoracique & hanches dynamiques</span>
                  <span class="font-bold text-emerald-300">60 sec</span>
                </div>
                <div class="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <span>⚡ Gainage d'activation abdos / fessiers</span>
                  <span class="font-bold text-emerald-300">45 sec</span>
                </div>
              </div>
            </div>

            <!-- Phase 2 : Gammes Montantes sur le 1er exercice -->
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold text-amber-300 uppercase tracking-wider">2. Séries de Chauffe (${escapeHtml(firstEx ? firstEx.name : '1er Exercice')})</span>
                <span class="text-[10px] text-slate-400">Travail : ${workingWeight} kg</span>
              </div>
              <div class="grid grid-cols-3 gap-2 text-center">
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">Série 1 (50%)</div>
                  <div class="text-sm font-black text-white mt-0.5">${w50} kg × 8</div>
                  <div class="text-[9px] text-emerald-400">Repos 45s</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">Série 2 (70%)</div>
                  <div class="text-sm font-black text-amber-300 mt-0.5">${w70} kg × 5</div>
                  <div class="text-[9px] text-emerald-400">Repos 60s</div>
                </div>
                <div class="bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <div class="text-[10px] text-slate-400 font-bold">Série 3 (85%)</div>
                  <div class="text-sm font-black text-rose-300 mt-0.5">${w85} kg × 2</div>
                  <div class="text-[9px] text-emerald-400">Repos 90s</div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <button onclick="IronPulse.App.completeWarmupProtocol()" class="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg">
                ✓ Valider l'Échauffement (+35 XP & +15 🪙)
              </button>
              <button onclick="IronPulse.App.closeModal()" class="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                Fermer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // 7. Modale Récompense de Fin de Séance (Victoire de Quête RPG & Butin AURA FIT)
    if (ui.modal.type === 'workout-rpg-reward') {
      const d = ui.modal.data;
      const hero = ns.RPG ? ns.RPG.getHeroProfile() : null;
      return `
        <div class="modal-backdrop z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-slide-up">
          <div class="bg-[#111722] border-2 border-emerald-500 w-full max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl overflow-y-auto p-5 space-y-4 shadow-2xl text-center">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto">
              🏆
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                Système d'Éveil — Quête Accomplie
              </span>
              <h2 class="text-lg font-extrabold text-white mt-1.5">${escapeHtml(d.workoutName)}</h2>
              <p class="text-xs text-slate-300 mt-0.5">Séance enregistrée ! Vos attributs de Chasseur et votre Or progressent.</p>
            </div>

            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center justify-center gap-4">
                <div class="text-2xl font-black text-emerald-400">+${d.earnedXp} XP</div>
                <div class="text-2xl font-black text-amber-300">+${d.earnedGold || 75} 🪙 Or</div>
              </div>
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div>
                  <div class="text-[10px] text-slate-400">Tonnage</div>
                  <div class="text-xs font-bold text-white">${d.totalVolume} kg</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400">Séries</div>
                  <div class="text-xs font-bold text-white">${d.completedSets}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400">Durée</div>
                  <div class="text-xs font-bold text-emerald-400">${d.durationMin} min</div>
                </div>
              </div>
            </div>

            ${
              hero
                ? `
              <div class="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 text-left space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-extrabold text-white">${hero.classObj.icon} ${escapeHtml(hero.classObj.name)} • Rang ${hero.rankObj.rank}</span>
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
                ⚔️ Voir mon Héros
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
  // TUTORIEL INTERACTIF, VISITE GUIDÉE & QUESTIONNAIRE PREMIÈRE UTILISATION
  // ============================================================================
  const TUTORIAL_SLIDES = [
    {
      badge: 'Module 1 / 5 · QG du Héros & Modèle 3D',
      icon: '👑',
      title: 'Votre Guerrier 3D Cel-Shading à 360°',
      subtitle: 'Chaque kilo soulevé dans la vraie vie renforce votre avatar dans l\'univers Aura Pulse.',
      bullets: [
        '🎯 **Scène 3D interactive** : Faites pivoter votre guerrier à 360° à la souris ou au doigt et testez ses mouvements.',
        '📊 **4 Attributs RPG réels** : Force (STR), Endurance (END), Vitesse/Constance (VIT) et Volonté/Intensité (VOL) calculés sur vos vraies séries.',
        '👑 **Reliques & Titres** : Débloquez des artefacts passifs (+5% à +8% XP) en battant des records.'
      ],
      highlightTab: 'home'
    },
    {
      badge: 'Module 2 / 5 · Donjon en Direct & Tempo 3-1-1',
      icon: '⚔️',
      title: 'Hologramme 3D Synchronisé & Métronome Biomécanique',
      subtitle: 'Pendant votre séance, votre avatar exécute exactement le même exercice que vous en temps réel.',
      bullets: [
        '⏱️ **Métronome de Tempo (3-1-1 / 2-0-1 / 4-2-1)** : Suivez la jauge lumineuse (3s Descente Excentrique · 1s Pause · 1s Poussée Explosif) pour un recrutement musculaire maximal.',
        '💥 **Surcharge d\'Aura Cinétique & Audio** : Chaque série cochée (`✓`) déclenche un flash d\'aura lumineuse et lance automatiquement le minuteur de repos.',
        '⚡ **Mémoire de charge** : Vos poids et répétitions de la séance précédente sont pré-remplis automatiquement.'
      ],
      highlightTab: 'workout'
    },
    {
      badge: 'Module 3 / 5 · Campagnes & Grimoire 3D',
      icon: '📜',
      title: '4 Programmes Scientifiques & 25 Exercices Modélisés',
      subtitle: 'Du Full Body Débutant au Push/Pull/Legs 6J, ou créez vos propres séances sur mesure.',
      bullets: [
        '📜 **Campagnes adaptées** : Choisissez un programme structuré ou créez vos propres routines dans l\'onglet *Mes Séances*.',
        '📘 **Grimoire de 25 Exercices** : Filtrez par muscle ou matériel. Cliquez sur un exercice pour voir la **démonstration 3D interactive** + les consignes de sécurité.',
        '➕ **Exercices personnalisés** : Ajoutez librement vos propres mouvements au répertoire.'
      ],
      highlightTab: 'programs'
    },
    {
      badge: 'Module 4 / 5 · Boss de Donjon 1RM & Guilde',
      icon: '🐉',
      title: 'Terrassez les 4 Boss Mythiques & Défiez la Guilde',
      subtitle: 'Vos records de force maximale théorique (formule d\'Epley 1RM) font tomber les Boss de Donjon.',
      bullets: [
        '🐉 **4 Boss 1RM** : Cerbère d\'Acier (Développé Couché ≥ 80 kg), Golem Titan (Squat ≥ 110 kg), Wyverne Abyssale (Soulevé de Terre ≥ 140 kg), Commandant de l\'Éclipse (Militaire ≥ 55 kg).',
        '🛡️ **Défis de Guilde** : Affrontez des chasseurs rivaux sur 7 jours (volume, séries, régularité) pour gagner +250 à +350 XP bonus.',
        '🎨 **Studio Striker Cinétique** : Personnalisez librement la morphologie, les coiffures, les tenues techwear et équipements de force pro.'
      ],
      highlightTab: 'rpg'
    },
    {
      badge: 'Module 5 / 5 · Oracle IA Prudent & Graphiques SVG',
      icon: '🔮',
      title: 'Coach IA Biomécanique & Courbes de Progression',
      subtitle: 'Une intelligence artificielle qui analyse votre âge, taille, poids, IMC, RPE et surcharge progressive.',
      bullets: [
        '🧠 **Bilan Automatique Prudent** : Détecte la stagnation, la fatigue excessive (RPE ≥ 9) ou la marge de progression (+2,5 kg) et ajuste vos prochaines charges.',
        '💬 **Chat Coach IA (Hors-ligne + Gemini)** : Posez n\'importe quelle question technique ou de récupération ; fonctionne 100% hors-ligne ou avec clé API Gemini.',
        '📈 **Graphiques SVG** : Visualisez votre 1RM, votre charge max et votre tonnage séance après séance.'
      ],
      highlightTab: 'progress'
    }
  ];

  const GUIDED_TOUR_STEPS = [
    {
      tab: 'home',
      title: '1/6 · QG du Héros & Avatar 3D',
      desc: 'Voici votre tableau de bord principal : faites tourner votre Guerrier 3D, consultez vos 4 attributs RPG (STR, END, VIT, VOL), votre quête prioritaire du jour et l\'avis rapide de l\'Oracle IA.'
    },
    {
      tab: 'rpg',
      title: '2/6 · Guilde, Studio 3D & Boss de Donjon',
      desc: 'Explorez les 5 sous-onglets ici : Statut RPG, Studio 3D (morphologies & coiffures), Donjons (les 4 Boss liés à vos 1RM), Reliques et Défis de Guilde entre amis.'
    },
    {
      tab: 'workout',
      title: '3/6 · Donjon d\'Entraînement & Métronome 3-1-1',
      desc: 'Lancez une séance pour voir votre Guerrier 3D reproduire l\'exercice en direct avec le Métronome de Tempo (3s Descente · 1s Pause · 1s Poussée). Cochez une série pour déclencher la Surcharge d\'Aura !'
    },
    {
      tab: 'programs',
      title: '4/6 · Campagnes & Séances sur mesure',
      desc: 'Votre programme recommandé par le questionnaire est activé ici. Vous pouvez lancer n\'importe quelle journée d\'entraînement en 1 clic ou créer vos séances personnalisées.'
    },
    {
      tab: 'exercises',
      title: '5/6 · Grimoire des 25 Exercices 3D',
      desc: 'Recherchez un mouvement par groupe musculaire ou équipement. Cliquez sur une fiche pour inspecter le modèle 3D en mouvement et les conseils de posture.'
    },
    {
      tab: 'progress',
      title: '6/6 · Oracle IA & Courbes SVG',
      desc: 'Suivez vos courbes de 1RM et de tonnage, consultez les recommandations prudentes basées sur votre profil (âge, taille, poids, RPE) et discutez avec le Coach IA.'
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
            <span class="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">🧭 Visite Guidée</span>
            <span class="text-xs font-black text-amber-300">${escapeHtml(step.title)}</span>
          </div>
          <button
            onclick="IronPulse.App.closeGuidedTour()"
            class="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700"
          >
            ✕ Fermer
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
                ? `<button onclick="IronPulse.App.prevGuidedTourStep()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700">◀ Précédent</button>`
                : ''
            }
            ${
              stepIdx < GUIDED_TOUR_STEPS.length - 1
                ? `<button onclick="IronPulse.App.nextGuidedTourStep()" class="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[11px] font-black text-slate-950 shadow">Suivant ▶</button>`
                : `<button onclick="IronPulse.App.closeGuidedTour()" class="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-[11px] font-black text-slate-950 shadow">✓ Terminer la visite</button>`
            }
          </div>
        </div>
      </div>
    `;
  }

  function renderOnboardingTacticalCardHTML(bio) {
    return `
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">📡 Diagnostic Biométrique Instantané</span>
        <span class="text-[10px] font-extrabold ${bio.bmiColor}">${bio.bmiLabel}</span>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Indice IMC</div>
          <div class="text-base font-black text-white">${bio.bmi}</div>
          <div class="text-[9px] text-slate-500">${bio.heightCm} cm / ${bio.weightKg} kg</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Maintien Estimé</div>
          <div class="text-base font-black text-amber-300">${bio.tdee} <span class="text-[10px]">kcal/j</span></div>
          <div class="text-[9px] text-slate-500">Métabolisme: ${bio.bmr} kcal</div>
        </div>
        <div class="bg-slate-900 rounded-xl p-2 border border-slate-800">
          <div class="text-[9px] text-slate-400 uppercase font-bold">Cible Protéines</div>
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
      hypertrophy: '💪',
      strength: '🔥',
      fitness: '❤️‍🔥',
      fatloss: '⚡'
    };

    const stepLabels = [
      { n: 1, label: 'Biométrie' },
      { n: 2, label: 'Objectifs' },
      { n: 3, label: 'Avatar 3D' },
      { n: 4, label: 'Tutoriel' },
      { n: 5, label: 'Lancement' }
    ];

    let stepContentHtml = '';

    // -------------------------------------------------------------------------
    // ÉTAPE 1 : QUESTIONNAIRE BIOMÉTRIQUE (PSEUDO, ÂGE, TAILLE, POIDS + IMC)
    // -------------------------------------------------------------------------
    if (step === 1) {
      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-slate-900 border border-amber-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-amber-300">⚡ Bienvenue dans IronPulse Z — Première Utilisation</div>
            <h3 class="text-sm font-black text-white mt-0.5">Étape 1/5 : Calibration Biométrique Tactique</h3>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Renseignez votre âge, votre taille et votre poids pour calibrer le moteur biomécanique, vos besoins énergétiques et l'Oracle IA.
            </p>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1">Votre Prénom ou Pseudo de Striker</label>
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
              <label class="block text-[10px] font-extrabold text-amber-300 uppercase mb-1">🎂 Âge (ans)</label>
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
              <label class="block text-[10px] font-extrabold text-emerald-300 uppercase mb-1">📏 Taille (cm)</label>
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
              <label class="block text-[10px] font-extrabold text-sky-300 uppercase mb-1">⚖️ Poids (kg)</label>
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

          <!-- Analyse Tactique Instantanée -->
          <div id="onb-scouter-card" class="rounded-2xl p-3.5 bg-slate-950/90 border border-emerald-500/30 space-y-2">
            ${renderOnboardingScouterCardHTML(bio)}
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // ÉTAPE 2 : QUESTIONNAIRE SPORTIF (NIVEAU, OBJECTIF, FRÉQUENCE, MATÉRIEL)
    // -------------------------------------------------------------------------
    else if (step === 2) {
      const equipOptions = [
        { id: 'full-gym', icon: '🏋️', title: 'Salle complète', desc: 'Barres, haltères, poulies, machines' },
        { id: 'home-gym', icon: '🏠', title: 'Home Gym', desc: 'Barre, banc, haltères libres' },
        { id: 'bodyweight-db', icon: '🤸', title: 'Haltères & Poids du corps', desc: 'Minimaliste & polyvalent' }
      ];
      const curEquip = profile.availableEquipment || 'full-gym';

      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-indigo-500/10 to-slate-900 border border-emerald-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300">🎯 Calibration de l'Entraînement</div>
            <h3 class="text-sm font-black text-white mt-0.5">Étape 2/5 : Expérience, Objectif & Rythme</h3>
            <p class="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Le système sélectionne automatiquement votre campagne idéale et votre temps de repos optimal.
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
                const emoji = goalIcons[g.id] || '⚡';
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
              <label class="text-xs font-bold text-slate-200">3. Fréquence hebdomadaire souhaitée</label>
              <span class="text-xs font-black text-amber-300">${profile.weeklyTarget || 4} séances / sem.</span>
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
            <label class="block text-xs font-bold text-slate-200 mb-1.5">4. Équipement principal à disposition</label>
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
                { id: 'slim', icon: '🏃', label: 'Mince / Ecto', desc: 'Métabolisme rapide, ossature fine' },
                { id: 'athletic', icon: '⚡', label: 'Athlétique', desc: 'Forme équilibrée, base sportive' },
                { id: 'heavy', icon: '🛡️', label: 'Robuste / Massif', desc: 'Grosse charpente, masse établie' }
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

          <!-- Corpulence Visée (Morphologie Cible Manga) -->
          <div>
            <label class="block text-xs font-bold text-slate-200 mb-1.5">6. Corpulence visée (Objectif Physique)</label>
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
              <div class="text-[10px] font-black uppercase tracking-wider text-emerald-400">✨ Campagne Recommandée & Assignée</div>
              <div class="text-xs font-extrabold text-white mt-0.5">${escapeHtml(recProg.name)} (${recProg.frequency})</div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black shrink-0">Repos ${profile.defaultRestSeconds || 90}s</span>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // ÉTAPE 3 : CRÉATION DE L'AVATAR 3D (CLASSE RPG, CHEVEUX STRIKER, AURA CINÉTIQUE)
    // -------------------------------------------------------------------------
    else if (step === 3 && hero) {
      stepContentHtml = `
        <div class="space-y-3">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-slate-900 border border-amber-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-amber-300">🎨 Forge du Striker 3D (Cel-Shading)</div>
            <h3 class="text-sm font-black text-white mt-0.5">Étape 3/5 : Créez votre Avatar Shonen</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Faites pivoter le modèle 3D à 360°, testez ses exercices et choisissez votre Classe et éveil d'Aura.
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

          <!-- ARCHÉTYPES MANGA RAPIDES 1-CLIC (BAKI, IPPO, DBZ, SOLO LEVELING, PERSONA) -->
          <div class="bg-gradient-to-r from-red-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/40 rounded-xl p-2.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-black uppercase text-amber-300">🌟 Préréglages Rapides Manga (1-Clic)</span>
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
              <div class="text-[9px] font-black text-amber-300 uppercase mb-1.5">🎭 Teint de Peau</div>
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
              <div class="text-[9px] font-black text-cyan-300 uppercase mb-1.5">✂️ Coupe de Cheveux</div>
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
              <div class="text-[9px] font-black text-amber-300 uppercase mb-1.5">⚡ Couleur des Cheveux</div>
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
              <div class="text-[9px] font-black text-emerald-300 uppercase mb-1.5">🔥 Aura Ki</div>
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
              <div class="text-[9px] font-black text-indigo-300 uppercase mb-1.5">🥋 Tenue de Combat</div>
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
              <div class="text-[9px] font-black text-cyan-300 uppercase mb-1.5">👁️ Couleur des Yeux</div>
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
              <div class="text-[9px] font-black text-rose-300 uppercase mb-1.5">⚔️ Cicatrices & Marquages</div>
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
    // ÉTAPE 4 : TUTORIEL INTERACTIF DES FONCTIONNALITÉS (5 SLIDES ILLUSTRÉES)
    // -------------------------------------------------------------------------
    else if (step === 4) {
      const slideIdx = Math.max(0, Math.min(TUTORIAL_SLIDES.length - 1, ui.tutorialSlideIdx || 0));
      const slide = TUTORIAL_SLIDES[slideIdx];

      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-emerald-500/10 to-slate-900 border border-indigo-500/30">
            <div class="text-[10px] font-black uppercase tracking-widest text-indigo-300">🎓 Guide Officiel des Fonctionnalités</div>
            <h3 class="text-sm font-black text-white mt-0.5">Étape 4/5 : Comment fonctionne IronPulse Z</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Parcourez les 5 piliers de l'application avant de lancer votre aventure.
            </p>
          </div>

          <!-- Sélecteur rapide des 5 modules du tutoriel -->
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
                ◀ Module précédent
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
                Module suivant ▶
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // -------------------------------------------------------------------------
    // ÉTAPE 5 : RÉCAPITULATIF TACTIQUE & CHOIX DU MODE DE DÉPART
    // -------------------------------------------------------------------------
    else {
      stepContentHtml = `
        <div class="space-y-3.5">
          <div class="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-amber-500/15 to-slate-900 border border-emerald-400/40 text-center">
            <div class="text-2xl mb-1">⚡🐉</div>
            <div class="text-[10px] font-black uppercase tracking-widest text-emerald-300">Calibration Tactique Terminée</div>
            <h3 class="text-base font-black text-white mt-0.5">${escapeHtml(profile.name || 'Alex')} est prêt pour l'éveil !</h3>
            <p class="text-[11px] text-slate-300 mt-0.5">
              Vérifiez votre fiche personnalisée et choisissez comment démarrer votre expérience.
            </p>
          </div>

          <!-- Fiche Synthèse -->
          <div class="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-400 uppercase font-bold">Profil Biométrique</div>
                <div class="font-black text-white mt-0.5">${bio.age} ans · ${bio.heightCm} cm · ${bio.weightKg} kg</div>
                <div class="text-[10px] ${bio.bmiColor} font-bold">IMC ${bio.bmi} (${bio.tdee} kcal/j)</div>
              </div>
              <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <div class="text-[10px] text-slate-400 uppercase font-bold">Objectif & Rythme</div>
                <div class="font-black text-amber-300 mt-0.5">${escapeHtml(goalObj.label)} · ${escapeHtml(levelObj.label)}</div>
                <div class="text-[10px] text-slate-300 font-semibold">${profile.weeklyTarget} séances / sem.</div>
              </div>
            </div>

            <div class="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-emerald-400 uppercase font-black">Campagne Assignée</div>
                <div class="text-xs font-extrabold text-white">${escapeHtml(recProg.name)}</div>
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                ${hero ? `${hero.classObj.icon} ${escapeHtml(hero.classObj.name)}` : 'Guerrier Z'}
              </span>
            </div>
          </div>

          <!-- 3 Modes de Démarrage -->
          <div class="space-y-2 pt-1">
            <div class="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Choisissez votre mode de démarrage :</div>

            <button
              onclick="IronPulse.App.finishOnboarding('guided')"
              class="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 hover:opacity-95 text-slate-950 text-left shadow-lg transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black uppercase tracking-wide">🧭 Démarrer + Visite Guidée Interactive (Recommandé)</div>
                <div class="text-[11px] font-semibold text-slate-900 mt-0.5">
                  Ouvre l'application avec une bannière pas-à-pas qui vous montre chaque onglet en direct.
                </div>
              </div>
              <span class="text-lg font-black">▶</span>
            </button>

            <button
              onclick="IronPulse.App.finishOnboarding('fresh')"
              class="w-full p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black text-emerald-300">🌱 Démarrer au Niveau 1 (Compte Vierge — 0 séance)</div>
                <div class="text-[11px] text-slate-300 mt-0.5">
                  Conserve votre profil (${bio.age} ans, ${bio.heightCm} cm, ${bio.weightKg} kg) et remet le compteur de séances à zéro pour votre vraie 1re séance.
                </div>
              </div>
              <span class="text-sm font-black text-emerald-300">Niv. 1</span>
            </button>

            <button
              onclick="IronPulse.App.finishOnboarding('demo')"
              class="w-full p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-bold text-slate-200">🔥 Explorer avec Historique de Démo (Niveau 7)</div>
                <div class="text-[10px] text-slate-400 mt-0.5">
                  Conserve votre profil personnalisé ET garde 6 séances d'exemple pour tester immédiatement les graphiques et Boss.
                </div>
              </div>
              <span class="text-xs font-bold text-amber-300">Niv. 7</span>
            </button>

            <button
              onclick="IronPulse.App.loadMehdiProfile()"
              class="w-full p-2.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/50 text-left transition flex items-center justify-between gap-2"
            >
              <div>
                <div class="text-xs font-black text-indigo-300">👾 Charger le Profil « Mehdi » (AURA FIT — Rang B • 320 🪙)</div>
                <div class="text-[10px] text-slate-300 mt-0.5">
                  25 ans · 182 cm · 78.5 kg · 5j 🔥 · PRs : Couché 92.5kg×6, Squat 125kg×4, Terre 145kg×4.
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
          <!-- En-tête de l'assistant -->
          <div class="px-4 pt-3.5 pb-2.5 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">⚡</span>
              <span class="text-xs font-black text-white uppercase tracking-wider">Initialisation Tactique & Tutoriel</span>
            </div>
            <button
              onclick="IronPulse.App.finishOnboarding('demo')"
              class="text-[10px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900 border border-slate-800"
              title="Passer l'introduction"
            >
              Passer ✕
            </button>
          </div>

          <!-- Barre de progression des 5 étapes -->
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
                    <div class="text-[9px] font-black">${isDone ? '✓' : s.n}. ${s.label}</div>
                  </button>
                `;
              })
              .join('')}
          </div>

          <!-- Corps défilant de l'étape -->
          <div class="p-4 overflow-y-auto flex-1">
            ${stepContentHtml}
          </div>

          <!-- Pied de modale (Navigation Précédent / Suivant) -->
          ${
            step < 5
              ? `
            <div class="px-4 py-3 bg-[#0B0F17] border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
              ${
                step > 1
                  ? `<button onclick="IronPulse.App.setOnboardingStep(${step - 1})" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700">◀ Retour</button>`
                  : `<button onclick="IronPulse.App.setOnboardingStep(4)" class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-400 border border-slate-800">Aller au Tutoriel ▶</button>`
              }
              <button
                onclick="IronPulse.App.setOnboardingStep(${step + 1})"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:opacity-95 text-xs font-black text-slate-950 shadow-lg transition"
              >
                Continuer (${step}/5) ▶
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
      {
        id: 'home',
        label: 'MON ALTR',
        iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7v6c0 1.1.9 2 2 2h1v-4H6V9a6 6 0 1 1 12 0v4h-2v4h1c1.1 0 2-.9 2-2V9a7 7 0 0 0-7-7z"/><path d="M12 2v5"/></svg>`
      },
      {
        id: 'rpg',
        label: 'GUILDES',
        iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 7v7M9 10h6"/></svg>`
      },
      {
        id: 'workout',
        label: 'SÉANCE',
        isCenter: true,
        highlight: hasActiveWorkout,
        iconSvg: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="14.5" y1="17.5" x2="3" y2="6"/><line x1="10" y1="20" x2="20" y2="10"/><line x1="14" y1="4" x2="20" y2="10"/><line x1="4" y1="14" x2="10" y2="20"/><line x1="16.5" y1="7.5" x2="9.5" y2="14.5"/></svg>`
      },
      {
        id: 'programs',
        label: 'CAMPAGNES',
        iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="7" y1="6" x2="7" y2="18"/><line x1="17" y1="6" x2="17" y2="18"/><polygon points="12 2 9 6 15 6"/><polygon points="7 6 5 9 9 9"/><polygon points="17 6 15 9 19 9"/></svg>`
      },
      {
        id: 'progress',
        label: 'ORACLE',
        iconSvg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`
      }
    ];

    const heroQuick = ns.RPG ? ns.RPG.getHeroProfile() : null;
    root.className = ui.frameMode === 'framed' ? 'app-shell-framed' : 'app-shell-full';

    root.innerHTML = `
      <!-- Barre d'état supérieure harmonisée Shonen / Radar Tactique -->
      <header class="shonen-top-header px-3.5 pt-3 pb-2.5 flex items-center justify-between shrink-0 z-20">
        <div onclick="IronPulse.App.navigate('home')" class="flex items-center gap-2 cursor-pointer">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-base shadow-md">
            ⚡
          </div>
          <div>
            <span class="text-sm font-black tracking-tight text-white">IRON<span class="text-amber-400">PULSE</span> <span class="text-[10px] text-emerald-400 font-extrabold">Z</span></span>
            <span class="block text-[9px] text-slate-400 uppercase tracking-widest -mt-0.5">Shonen RPG & AI Coach</span>
          </div>
        </div>

        <div class="flex items-center gap-1">
          ${
            heroQuick
              ? `
            <button
              onclick="IronPulse.App.openRpgSubTab('customize')"
              class="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[10px] font-black text-amber-300 transition flex items-center gap-1.5"
              title="Série 🔥, Or 🪙 & Puissance CP"
            >
              <span>🔥${heroQuick.streakDays}j</span>
              <span>🪙${heroQuick.gold}</span>
              <span class="hidden sm:inline">⚡${heroQuick.combatPower}</span>
            </button>
          `
              : ''
          }
          <button
            onclick="IronPulse.App.openOnboardingWizard(4)"
            class="px-2 py-1.5 rounded-xl text-[10px] font-extrabold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 transition"
            title="Ouvrir le Tutoriel & Questionnaire de personnalisation"
          >
            🎓 Tuto
          </button>
          <button
            onclick="IronPulse.App.navigate('history')"
            class="px-2 py-1.5 rounded-xl text-[11px] font-bold transition ${
              ui.currentTab === 'history'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/70'
            }"
            title="Historique des séances"
          >
            🗓
          </button>
          <button
            onclick="IronPulse.App.navigate('profile')"
            class="px-2 py-1.5 rounded-xl text-[11px] font-bold transition ${
              ui.currentTab === 'profile'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/70'
            }"
            title="Profil & Paramètres"
          >
            👤
          </button>
          <button
            onclick="IronPulse.App.toggleFrameMode()"
            class="hidden sm:inline-flex px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-[10px] text-slate-300 font-medium"
            title="Basculer Cadre Mobile / Large"
          >
            ${ui.frameMode === 'framed' ? '⛶' : '📱'}
          </button>
        </div>
      </header>

      <!-- Contenu défilant de l'écran actif -->
      <main class="flex-1 overflow-y-auto px-3.5 pt-3.5 pb-4">
        ${renderGuidedTourBanner()}
        ${screenHtml}
      </main>

      <!-- Bandeau flottant du Minuteur de Repos -->
      <div id="rest-timer-bar" class="hidden"></div>

      <!-- Barre de navigation inférieure (Dock Shonen Moderne 5 Onglets Vectoriels) -->
      <nav class="app-bottom-nav shonen-bottom-dock px-1.5 py-1.5 grid grid-cols-5 gap-1 shrink-0 z-20 items-end" style="grid-template-columns: repeat(5, minmax(0, 1fr)) !important;">
        ${navItems
          .map((item) => {
            const active = (ui.currentTab === item.id) || (item.id === 'programs' && ui.currentTab === 'exercises') || (item.id === 'progress' && ui.currentTab === 'history');
            if (item.isCenter) {
              return `
                <button
                  onclick="IronPulse.App.navigate('${item.id}')"
                  class="flex flex-col items-center justify-center -translate-y-2 py-1 px-0.5 rounded-2xl transition duration-150 ${
                    active ? 'text-amber-300 font-black' : 'text-slate-300 hover:text-white'
                  }"
                >
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center relative ${
                    active
                      ? 'bg-gradient-to-tr from-cyan-500 to-amber-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.7)]'
                      : 'bg-[#0E1726] border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  }">
                    ${item.highlight ? `<span class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>` : ''}
                    ${item.iconSvg}
                  </div>
                  <span class="text-[10px] sm:text-[10.5px] font-black tracking-widest uppercase mt-0.5 text-amber-300">${item.label}</span>
                </button>
              `;
            }
            return `
              <button
                onclick="IronPulse.App.navigate('${item.id}')"
                class="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
                  active
                    ? 'text-cyan-300 font-extrabold bg-cyan-950/40 border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }"
              >
                <div class="mb-1 ${active ? 'text-cyan-300 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : 'text-slate-400'}">${item.iconSvg}</div>
                <span class="text-[10px] sm:text-[10.5px] font-black tracking-wider uppercase truncate max-w-full">${item.label}</span>
                ${active ? `<span class="text-[8.5px] font-bold text-cyan-400 tracking-wider">Actif</span>` : ''}
              </button>
            `;
          })
          .join('')}
      </nav>

      <!-- Modale éventuelle ou Assistant Première Utilisation -->
      ${ui.onboardingOpen ? renderOnboardingWizardModal() : renderModal()}
    `;

    updateRestTimerDOM();
    if (ns.Hero3D) {
      if (ns.Hero3D.startLoop) ns.Hero3D.startLoop();
      if (ns.Hero3D.renderNow) ns.Hero3D.renderNow();
    }
  }

  // Mise à jour chaque seconde de l'horloge de séance en cours
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
        // Compte vierge Niveau 1 (première utilisation réelle sans historique de démo)
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

    // --- Actions Répertoire d'exercices ---
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
        primaryMuscles: (primaryEl && primaryEl.value ? primaryEl.value : 'Muscle ciblé').split(',').map((s) => s.trim()),
        secondaryMuscles: [],
        equipment: equipEl ? equipEl.value : 'Haltères',
        level: 'Intermédiaire',
        defaultRest: 90,
        description: (descEl && descEl.value ? descEl.value : 'Exercice personnalisé ajouté au répertoire.').trim(),
        instructions: [
          'Adoptez une posture stable et un gainage actif.',
          'Contrôlez la phase excentrique (descente) sur 2 secondes.',
          'Expirez lors de la phase concentrique (effort).'
        ],
        tips: 'Gardez une amplitude maîtrisée et sans douleur articulaire.'
      };

      state.exercises.unshift(newEx);
      ns.Storage.saveState();
      ui.modal = null;
      render();
    },

    // --- Actions Programmes & Séances Personnalisées ---
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
          name: 'Ma Séance Personnalisée',
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
        name: (draft.name || 'Séance Personnalisée').trim(),
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

    // --- Actions Séance en cours (Live Workout) ---
    updateWorkoutName(val) {
      const state = ns.Storage.getState();
      if (!state.activeWorkout) return;
      state.activeWorkout.name = val.trim() || 'Séance';
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

      // Conserver les séries validées (ou toutes les séries si l'utilisateur a oublié de cocher)
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

    // --- Actions Périodisation AURA FIT ---
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
        '# AURA FIT × IRONPULSE Z — Export Spécification & Statut Antigravity',
        '',
        `## 1. Profil Chasseur (${state.profile.name || 'Mehdi'})`,
        `- **Rang Isekai** : [${hero.rank?.tier || 'B'}] — ${hero.rank?.name || 'Chasseur'}`,
        `- **Niveau** : ${hero.level || 4} (${hero.totalXp || 0} XP) • **Puissance de Combat (CP)** : ${hero.combatPower || 0}`,
        `- **Or** : ${hero.gold || 0} 🪙 • **Série** : ${hero.streakDays || 0} jours 🔥`,
        `- **HP / MP** : ${hero.hpCurrent || 0}/${hero.hpMax || 0} HP • ${hero.mpCurrent || 0}/${hero.mpMax || 0} MP`,
        `- **Attributs** : FOR ${hero.attributes?.FOR || 0} | END ${hero.attributes?.END || 0} | VIT ${hero.attributes?.VIT || 0} | AGI ${hero.attributes?.AGI || 0} | INT ${hero.attributes?.INT || 0}`,
        `- **Biométrie & Nutrition** : ${bio.age} ans • ${bio.heightCm} cm • ${bio.weightKg} kg • IMC ${bio.bmi} • BMR ${bio.bmr} kcal • Cible ${bio.targetKcal} kcal/j (P: ${bio.proteinG}g / G: ${bio.carbsG}g / L: ${bio.fatG}g)`,
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
      const q = (ui.aiCustomQuestion || '').trim() || 'Analyse mes séances et propose des ajustements prudents.';
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
        ui.geminiTestResult = { success: false, message: 'Veuillez saisir votre clé API Google AI Studio d\'abord.' };
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
          message: `Connexion Google AI Studio réussie avec le modèle ${result.model} !`
        };
      } else {
        ui.geminiTestResult = {
          success: false,
          message: `Échec : ${result.error}`
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

    // --- Actions RPG (Héros, Reliques, Défis & Guilde) ---
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
        sets7d: 'séries',
        workouts7d: 'séances'
      };

      const state = ns.Storage.getState();
      if (ns.RPG) ns.RPG.ensureRpgState(state);

      state.rpg.activeChallenges.unshift({
        id: 'chal-' + Date.now(),
        friendName,
        friendAvatar: '⚔️',
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
          ns.RPG.awardExperience(targetChal.rewardXp || 200, targetChal.title || 'Défi de Club accompli');
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
        title: 'IronPulse Z — Défi Chasseur',
        text: `⚔️ Je te défie sur IronPulse Z : "${chalTitle || 'Défi Chasseur'}" (${targetDesc || 'Rejoins mon dojo'}). Prêt à mesurer ton tonnage ?`,
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(`${shareData.text} — ${shareData.url}`).then(() => {
          alert('✓ Défi copié dans le presse-papier ! Partage-le à ton rival.');
        }).catch(() => {
          alert(`Défi : ${shareData.text}`);
        });
      } else {
        alert(`Défi : ${shareData.text}`);
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
            alert(`✓ Profil IronPulse de ${res.heroName} (Niv. ${res.level}) restauré avec intégrité validée !`);
            render();
          } else {
            alert('⚠️ ' + (res.error || 'Erreur lors de la restauration.'));
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
          alert('⚠️ ' + (res.reason || 'Impossible de débloquer ce talent'));
        }
      }
    },

    resetTalents() {
      if (confirm('Voulez-vous réinitialiser tous vos talents et récupérer vos points d’éveil (TP) ?')) {
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
            alert('✓ Données du Chasseur restaurées avec succès !');
            render();
          } else {
            alert('⚠️ ' + (res.error || 'Erreur lors de la lecture du fichier.'));
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
