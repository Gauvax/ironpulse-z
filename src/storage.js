// IronPulse — Gestionnaire d'État & Stockage Local Persistant
window.IronPulse = window.IronPulse || {};

(function (ns) {
  const STORAGE_KEY = 'ironpulse_app_state_v1';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function getDefaultState() {
    return {
      profile: clone(ns.Data.INITIAL_PROFILE),
      exercises: clone(ns.Data.INITIAL_EXERCISES),
      customSessions: clone(ns.Data.INITIAL_CUSTOM_SESSIONS),
      history: clone(ns.Data.INITIAL_HISTORY),
      activeWorkout: null,
      aiConversationHistory: [],
      rpg: null
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = getDefaultState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw);
      let mergedExercises = Array.isArray(parsed.exercises) && parsed.exercises.length
        ? parsed.exercises
        : clone(ns.Data.INITIAL_EXERCISES);
      // Fusionner automatiquement tout nouvel exercice ajouté au catalogue par défaut
      const existingIds = new Set(mergedExercises.map((e) => e.id));
      (ns.Data.INITIAL_EXERCISES || []).forEach((initEx) => {
        if (!existingIds.has(initEx.id)) {
          mergedExercises.push(clone(initEx));
        }
      });

      return {
        profile: { ...clone(ns.Data.INITIAL_PROFILE), ...(parsed.profile || {}) },
        exercises: mergedExercises,
        customSessions: Array.isArray(parsed.customSessions) ? parsed.customSessions : clone(ns.Data.INITIAL_CUSTOM_SESSIONS),
        history: Array.isArray(parsed.history) ? parsed.history : clone(ns.Data.INITIAL_HISTORY),
        activeWorkout: parsed.activeWorkout || null,
        aiConversationHistory: Array.isArray(parsed.aiConversationHistory) ? parsed.aiConversationHistory : [],
        rpg: parsed.rpg || null
      };
    } catch (e) {
      console.warn('Erreur lecture localStorage, chargement état par défaut:', e);
      return getDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Impossible de sauvegarder dans localStorage:', e);
    }
  }

  function resetToDemoData() {
    state = getDefaultState();
    saveState();
    return state;
  }

  function loadMehdiPreset() {
    const preset = ns.Data.AURA_FIT_MEHDI_PRESET;
    if (!preset) return resetToDemoData();
    state.profile = { ...clone(ns.Data.INITIAL_PROFILE), ...clone(preset.profile) };
    state.history = clone(preset.history);
    if (ns.RPG && ns.RPG.ensureRpgState) {
      ns.RPG.ensureRpgState(state);
    }
    state.rpg = {
      ...(state.rpg || {}),
      ...clone(preset.rpg),
      appearance: {
        ...((state.rpg && state.rpg.appearance) || {}),
        ...clone(preset.rpg.appearance)
      }
    };
    state.activeWorkout = null;
    saveState();
    return state;
  }

  function getExerciseById(id) {
    return state.exercises.find((e) => e.id === id) || {
      id,
      name: 'Exercice personnalisé',
      muscleGroup: 'Autre',
      primaryMuscles: ['Corps entier'],
      secondaryMuscles: [],
      equipment: 'Libre',
      level: 'Intermédiaire',
      defaultRest: 90,
      description: '',
      instructions: [],
      tips: ''
    };
  }

  // Formule d'Epley : 1RM = Charge * (1 + Reps / 30)
  function compute1RM(weight, reps) {
    const w = Number(weight) || 0;
    const r = Number(reps) || 0;
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  }

  // Formule de Brzycki : 1RM = Charge / (1.0278 - 0.0278 * Reps)
  function compute1RMBrzycki(weight, reps) {
    const w = Number(weight) || 0;
    const r = Math.min(30, Number(reps) || 0);
    if (w <= 0 || r <= 0) return 0;
    if (r === 1) return w;
    const denom = 1.0278 - 0.0278 * r;
    if (denom <= 0.1) return compute1RM(w, r);
    return Math.round((w / denom) * 10) / 10;
  }

  function computeWorkoutStats(workout) {
    let totalVolume = 0;
    let completedSets = 0;
    let totalReps = 0;

    (workout.exercises || []).forEach((exBlock) => {
      (exBlock.sets || []).forEach((s) => {
        if (s.completed !== false) {
          const w = Number(s.weight) || 0;
          const r = Number(s.reps) || 0;
          totalVolume += w * r;
          completedSets += 1;
          totalReps += r;
        }
      });
    });

    return {
      totalVolume: Math.round(totalVolume),
      completedSets,
      totalReps
    };
  }

  // Retourne la dernière performance enregistrée pour un exercice donné
  function getLastPerformanceForExercise(exerciseId) {
    const sorted = [...state.history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const w of sorted) {
      const found = (w.exercises || []).find((e) => e.exerciseId === exerciseId);
      if (found && found.sets && found.sets.length > 0) {
        return {
          date: w.date,
          workoutName: w.name,
          sets: found.sets
        };
      }
    }
    return null;
  }

  // Historique chronologique d'un exercice pour les graphiques et l'IA
  function getExerciseTimeline(exerciseId) {
    const sorted = [...state.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const timeline = [];

    sorted.forEach((w) => {
      const found = (w.exercises || []).find((e) => e.exerciseId === exerciseId);
      if (found && found.sets && found.sets.length > 0) {
        const validSets = found.sets.filter((s) => s.completed !== false && (Number(s.reps) > 0));
        if (validSets.length === 0) return;

        let maxWeight = 0;
        let best1RM = 0;
        let best1RMBrzycki = 0;
        let volume = 0;
        let totalReps = 0;
        let avgRpeSum = 0;
        let rpeCount = 0;
        let bestSetStr = '';

        validSets.forEach((s) => {
          const weight = Number(s.weight) || 0;
          const reps = Number(s.reps) || 0;
          const e1rm = compute1RM(weight, reps);
          const b1rm = compute1RMBrzycki(weight, reps);
          if (weight > maxWeight) maxWeight = weight;
          if (e1rm > best1RM) {
            best1RM = e1rm;
            bestSetStr = `${weight} kg × ${reps}`;
          }
          if (b1rm > best1RMBrzycki) {
            best1RMBrzycki = b1rm;
          }
          volume += weight * reps;
          totalReps += reps;
          if (s.rpe) {
            avgRpeSum += Number(s.rpe);
            rpeCount++;
          }
        });

        timeline.push({
          workoutId: w.id,
          date: w.date,
          maxWeight,
          best1RM,
          best1RMBrzycki,
          bestSetStr,
          volume: Math.round(volume),
          setsCount: validSets.length,
          totalReps,
          avgRpe: rpeCount > 0 ? Math.round((avgRpeSum / rpeCount) * 10) / 10 : null,
          sets: validSets
        });
      }
    });

    return timeline;
  }

  // Calcul d'un checksum SHA-256 ou Checksum Sécurisé asynchrone (Kage Sentinel)
  async function computeSaveSignature(payloadObj) {
    const rawString = JSON.stringify(payloadObj);
    if (window.crypto && window.crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(rawString + '::IRONPULSE_SECURE_SALT_2026::');
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback FNV-1a si crypto.subtle échoue
      }
    }
    let h1 = 0x811c9dc5;
    for (let i = 0; i < rawString.length; i++) {
      h1 ^= rawString.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    return 'fnv1a_' + (h1 >>> 0).toString(16);
  }

  // Exportation sécurisée au format officiel .ironpulse
  async function exportIronPulseSecureBackup() {
    const payloadToSign = {
      profile: state.profile,
      exercises: state.exercises,
      customSessions: state.customSessions,
      history: state.history,
      rpg: state.rpg
    };

    const signature = await computeSaveSignature(payloadToSign);
    const container = {
      magic: 'IRONPULSE_SAVE_V1',
      version: '2.0.0',
      timestamp: Date.now(),
      exportedAt: new Date().toISOString(),
      deviceInfo: navigator.userAgent.slice(0, 80),
      payload: payloadToSign,
      signature: signature
    };

    const jsonStr = JSON.stringify(container, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `hunter-backup-${safeDate}.ironpulse`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (ns.Audio && ns.Audio.playCoinGold) {
      ns.Audio.playCoinGold();
    }
    return true;
  }

  // Importation et validation d'intégrité .ironpulse
  async function importIronPulseSecureBackup(fileContentStr) {
    try {
      const container = JSON.parse(fileContentStr);

      if (!container || (container.magic !== 'IRONPULSE_SAVE_V1' && !container.payload)) {
        throw new Error('Fichier non reconnu comme sauvegarde IronPulse.');
      }

      const data = container.payload || container;
      if (!data || typeof data !== 'object') {
        throw new Error('Données corrompues : payload manquant.');
      }
      if (!data.profile || !Array.isArray(data.history)) {
        throw new Error('Profil ou historique manquant dans la sauvegarde.');
      }

      // Vérification de signature si disponible
      if (container.signature) {
        const expectedSig = await computeSaveSignature(data);
        if (container.signature !== expectedSig) {
          throw new Error('Échec d’intégrité : la signature du fichier ne correspond pas.');
        }
      }

      state.profile = { ...clone(ns.Data.INITIAL_PROFILE), ...(data.profile || {}) };
      state.exercises = Array.isArray(data.exercises) && data.exercises.length ? data.exercises : clone(ns.Data.INITIAL_EXERCISES);
      state.customSessions = Array.isArray(data.customSessions) ? data.customSessions : clone(ns.Data.INITIAL_CUSTOM_SESSIONS);
      state.history = data.history;
      state.rpg = data.rpg || null;
      state.activeWorkout = null;

      saveState();
      if (ns.Audio && ns.Audio.playLevelUp) {
        ns.Audio.playLevelUp();
      }
      return { success: true, heroName: state.profile.name, level: state.rpg ? state.rpg.level : 1 };
    } catch (err) {
      console.error('Erreur import .ironpulse :', err);
      return { success: false, error: err.message };
    }
  }

  // Exportation complète du profil et de l'historique sous forme de fichier JSON
  function exportBackupJSON() {
    const backupData = {
      app: 'IronPulse Z',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      payload: state
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ironpulse-z-backup-${safeDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (ns.Audio && ns.Audio.playCoinGold) {
      ns.Audio.playCoinGold();
    }
    return true;
  }

  // Importation et validation d'un fichier de sauvegarde JSON
  function importBackupJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.payload || parsed;
      if (!data || typeof data !== 'object') {
        throw new Error('Format de sauvegarde invalide');
      }
      if (!data.profile && !data.history) {
        throw new Error('Données de joueur manquantes');
      }

      state = data;
      saveState();
      if (ns.Audio && ns.Audio.playLevelUp) {
        ns.Audio.playLevelUp();
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message || 'Erreur lors de l’importation' };
    }
  }

  ns.Storage = {
    getState: () => state,
    saveState,
    resetToDemoData,
    loadMehdiPreset,
    getExerciseById,
    compute1RM,
    compute1RMBrzycki,
    computeWorkoutStats,
    getLastPerformanceForExercise,
    getExerciseTimeline,
    exportBackupJSON,
    importBackupJSON,
    exportIronPulseSecureBackup,
    importIronPulseSecureBackup
  };
})(window.IronPulse);
