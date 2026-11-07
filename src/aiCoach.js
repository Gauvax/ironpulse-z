// IronPulse — Moteur d'Accompagnement IA (Analyse Locale Biomécanique + Google Gemini API)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  const MEDICAL_DISCLAIMER =
    "Avertissement de prudence : Ces analyses et suggestions sont générées à titre purement informatif et éducatif pour accompagner votre suivi sportif. Elles ne constituent en aucun cas un avis médical, un diagnostic ou une prescription kinésithérapique. Écoutez vos sensations articulaires et consultez un médecin ou un professionnel de santé diplômé avant de modifier intensément votre entraînement ou en cas de douleur.";

  function analyzeTrainingData() {
    const state = ns.Storage.getState();
    const { history, profile, exercises } = state;

    const goalObj = ns.Data.GOALS.find((g) => g.id === profile.goal) || ns.Data.GOALS[0];
    const levelObj = ns.Data.LEVELS.find((l) => l.id === profile.level) || ns.Data.LEVELS[1];

    const ageVal = Number(profile.age) || 26;
    const heightVal = Number(profile.heightCm) || 178;
    const weightVal = Number(profile.bodyWeightKg) || 76;
    const bmiVal = Math.round((weightVal / Math.pow(heightVal / 100, 2)) * 10) / 10;

    if (!history || history.length === 0) {
      return {
        disclaimer: MEDICAL_DISCLAIMER,
        summaryTitle: 'En attente de votre 1re séance (Profil calibré)',
        summaryText: `Profil **${levelObj.label}** (${ageVal} ans, ${heightVal} cm, ${weightVal} kg — IMC ${bmiVal}) • Objectif **${goalObj.label}**. Enregistrez votre première séance pour débloquer les courbes 1RM et les recommandations de surcharge progressive.`,
        score: 0,
        avgGlobalRpe: '—',
        workouts7d: 0,
        workouts14d: 0,
        highlights: [],
        adjustments: [
          {
            type: 'guidance',
            badge: 'Démarrage prudent',
            title: 'Privilégiez la maîtrise technique & le Tempo 3-1-1',
            detail: 'Pour vos premières séances, conservez 2 à 3 répétitions en réserve (RPE 7-8) et suivez le métronome 3-1-1 afin d’ancrer une exécution propre et de limiter les courbatures excessives.'
          }
        ],
        muscleBalance: {
          Pectoraux: 0,
          Dos: 0,
          Jambes: 0,
          Épaules: 0,
          Bras: 0,
          Abdominaux: 0
        }
      };
    }

    // 1. Calcul de la fréquence sur les 7 et 14 derniers jours
    const now = Date.now();
    const ms7d = 7 * 24 * 3600 * 1000;
    const ms14d = 14 * 24 * 3600 * 1000;

    const last7dWorkouts = history.filter((w) => now - new Date(w.date).getTime() <= ms7d);
    const last14dWorkouts = history.filter((w) => now - new Date(w.date).getTime() <= ms14d);

    // 2. Répartition par groupe musculaire (nombre de séries validées)
    const muscleSets = {
      Pectoraux: 0,
      Dos: 0,
      Jambes: 0,
      Épaules: 0,
      Bras: 0,
      Abdominaux: 0
    };

    let totalRpeSum = 0;
    let totalRpeCount = 0;

    history.forEach((w) => {
      (w.exercises || []).forEach((exBlock) => {
        const ex = ns.Storage.getExerciseById(exBlock.exerciseId);
        const validSets = (exBlock.sets || []).filter((s) => s.completed !== false);
        if (muscleSets[ex.muscleGroup] !== undefined) {
          muscleSets[ex.muscleGroup] += validSets.length;
        }
        validSets.forEach((s) => {
          if (s.rpe) {
            totalRpeSum += Number(s.rpe);
            totalRpeCount += 1;
          }
        });
      });
    });

    const avgGlobalRpe = totalRpeCount > 0 ? Math.round((totalRpeSum / totalRpeCount) * 10) / 10 : 8.0;

    // 3. Analyse exercice par exercice (Progrès vs Stagnation / Fatigue)
    const highlights = [];
    const adjustments = [];

    exercises.forEach((ex) => {
      const timeline = ns.Storage.getExerciseTimeline(ex.id);
      if (timeline.length >= 2) {
        const first = timeline[0];
        const prev = timeline[timeline.length - 2];
        const latest = timeline[timeline.length - 1];

        const diff1RMFromStart = Math.round((latest.best1RM - first.best1RM) * 10) / 10;
        const pctFromStart = first.best1RM > 0 ? Math.round(((latest.best1RM - first.best1RM) / first.best1RM) * 1000) / 10 : 0;
        const diffWeightRecent = latest.maxWeight - prev.maxWeight;
        const diffVolRecent = latest.volume - prev.volume;

        // Mise en évidence des progrès
        if (diff1RMFromStart > 0 && (diffWeightRecent > 0 || diffVolRecent > 0)) {
          highlights.push({
            exerciseId: ex.id,
            exerciseName: ex.name,
            muscleGroup: ex.muscleGroup,
            metric: `+${diff1RMFromStart} kg (1RM est.)`,
            pct: `+${pctFromStart}%`,
            latestPerf: `${latest.bestSetStr}`,
            comment:
              diffWeightRecent > 0
                ? `Charge montée de ${prev.maxWeight} kg à ${latest.maxWeight} kg avec maîtrise.`
                : `Volume en hausse de +${diffVolRecent} kg sur la dernière séance.`
          });
        }

        // Détection de plateau ou RPE élevé sur la dernière séance
        if (latest.avgRpe && latest.avgRpe >= 9 && latest.best1RM <= prev.best1RM) {
          adjustments.push({
            type: 'caution',
            exerciseId: ex.id,
            badge: 'Plateau & Intensité Élevée',
            title: `${ex.name} : consolider avant d’alourdir`,
            detail: `Votre dernière séance affiche un effort perçu élevé (RPE ${latest.avgRpe}/10) à ${latest.maxWeight} kg sans gain de répétitions. Par prudence articulaire, conservez la même charge à la prochaine séance ou réduisez-la de 5 % en soignant la vitesse d’exécution.`
          });
        } else if (latest.avgRpe && latest.avgRpe <= 8.5 && diffVolRecent >= 0) {
          // Suggestion de surcharge progressive prudente selon l'objectif et le niveau
          const increment = ex.equipment === 'Barre' ? 2.5 : 1.0;
          if (profile.level === 'beginner') {
            adjustments.push({
              type: 'progression',
              exerciseId: ex.id,
              badge: 'Progression Douce',
              title: `${ex.name} : +1 répétition par série`,
              detail: `Vos séries à ${latest.maxWeight} kg sont bien maîtrisées (RPE ${latest.avgRpe}/10). En tant que profil ${levelObj.label}, tentez d’ajouter 1 répétition propre par série avant d’augmenter la charge.`
            });
          } else {
            adjustments.push({
              type: 'progression',
              exerciseId: ex.id,
              badge: `Objectif ${goalObj.label}`,
              title: `${ex.name} : palier de +${increment} kg envisageable`,
              detail: `Progression régulière jusqu'à ${latest.bestSetStr} avec une réserve de sécurité convenable. Si votre échauffement est fluide et indolore, vous pouvez viser +1 répétition ou +${increment} kg sur la 1re série.`
            });
          }
        }
      }
    });

    // 4. Vérification de l'équilibre Poussée (Pectoraux/Épaules) vs Tirage (Dos)
    const pushSets = muscleSets.Pectoraux + muscleSets.Épaules;
    const pullSets = muscleSets.Dos;
    if (pushSets > pullSets * 1.4 && pushSets >= 8) {
      adjustments.push({
        type: 'balance',
        badge: 'Équilibre Postural',
        title: 'Renforcer le ratio Tirage / Poussée',
        detail: `Vous cumulez ${pushSets} séries de poussée (pectoraux/épaules) contre ${pullSets} séries de tirage (dos). Pour préserver la santé de vos épaules et votre posture, pensez à ajouter 2 à 3 séries de tirage horizontal ou de Face Pull cette semaine.`
      });
    }

    // 5. Vérification du volume Bas du corps
    if (muscleSets.Jambes < (pushSets + pullSets) * 0.25 && history.length >= 3) {
      adjustments.push({
        type: 'balance',
        badge: 'Harmonie Globale',
        title: 'Sollicitation du bas du corps',
        detail: `Le volume consacré aux jambes (${muscleSets.Jambes} séries) reste inférieur à celui du haut du corps. Une séance jambes/gainage par semaine favorise l’équilibre musculaire et métabolique.`
      });
    }

    // 6. Gestion de la fatigue générale
    if (avgGlobalRpe >= 8.8) {
      adjustments.unshift({
        type: 'recovery',
        badge: 'Récupération & Prudence',
        title: 'Surveillez la fatigue nerveuse et articulaire',
        detail: `Votre RPE moyen récent est de ${avgGlobalRpe}/10 (proche de l’échec musculaire). Garder 1 à 2 répétitions en réserve (RPE 7.5 - 8.5) sur la majorité de vos séries stimule tout aussi bien la progression tout en réduisant fortement le risque de blessure.`
      });
    }

    const summaryTitle =
      highlights.length > 0
        ? `${highlights.length} exercice(s) en progression nette sur vos dernières séances`
        : `Suivi régulier (${last14dWorkouts.length} séances sur 14 jours)`;

    const summaryText = `Analyse calibrée pour votre profil **${levelObj.label}** (${ageVal} ans, ${heightVal} cm, ${weightVal} kg — IMC ${bmiVal}) avec un objectif **${goalObj.label}**. Vous avez réalisé ${last7dWorkouts.length} séance(s) sur les 7 derniers jours (cible : ${profile.weeklyTarget}/sem) avec une intensité moyenne perçue de ${avgGlobalRpe}/10.`;

    return {
      disclaimer: MEDICAL_DISCLAIMER,
      summaryTitle,
      summaryText,
      avgGlobalRpe,
      workouts7d: last7dWorkouts.length,
      workouts14d: last14dWorkouts.length,
      highlights: highlights.slice(0, 5),
      adjustments: adjustments.slice(0, 5),
      muscleBalance: muscleSets
    };
  }

  const GEMINI_MODELS = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recommandé)', desc: 'Le modèle Google AI Studio le plus rapide et équilibré' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Modèle haute performance pour le raisonnement rapide' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Version établie pour toutes les clés API' }
  ];

  // Teste la validité d'une clé API Google AI Studio
  async function testGeminiApiKey(rawKey, modelId) {
    const key = (rawKey || '').trim();
    if (!key) {
      return { success: false, error: 'Veuillez saisir une clé API Google AI Studio (format: AIzaSy...).' };
    }
    const model = modelId || 'gemini-2.5-flash';
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Réponds uniquement: "Connexion Google AI Studio réussie."' }] }]
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error?.message || `Erreur HTTP ${res.status} reçue de Google AI Studio.`
        };
      }
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
      return {
        success: true,
        model,
        reply: reply.trim()
      };
    } catch (e) {
      return {
        success: false,
        error: e.message || 'Impossible de joindre les serveurs Google AI Studio (vérifiez votre connexion internet).'
      };
    }
  }

  // Appel au Coach IA via Google AI Studio / Gemini API (ou bascule moteur local)
  async function askGeminiCoach(userQuestion) {
    const state = ns.Storage.getState();
    const { profile, history } = state;
    const envApiKey =
      (typeof window !== 'undefined' && (window.VITE_GEMINI_API_KEY || window.GEMINI_API_KEY)) ||
      (typeof process !== 'undefined' && process.env && (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY)) ||
      '';
    const apiKey = (profile.geminiApiKey || envApiKey || '').trim();
    const selectedModel = profile.geminiModel || 'gemini-2.5-flash';

    const localAnalysis = analyzeTrainingData();
    const goalObj = ns.Data.GOALS.find((g) => g.id === profile.goal) || ns.Data.GOALS[0];
    const levelObj = ns.Data.LEVELS.find((l) => l.id === profile.level) || ns.Data.LEVELS[1];

    // Préparation d'un résumé compact des 5 dernières séances pour le contexte
    const recentSummary = [...history]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((w) => {
        const exList = (w.exercises || [])
          .map((eb) => {
            const ex = ns.Storage.getExerciseById(eb.exerciseId);
            const setsStr = (eb.sets || [])
              .filter((s) => s.completed !== false)
              .map((s) => `${s.weight}kg x ${s.reps}${s.rpe ? ` (RPE ${s.rpe})` : ''}`)
              .join(', ');
            return `${ex.name}: [${setsStr}]`;
          })
          .join(' | ');
        return `- ${w.date.slice(0, 10)} (${w.name}, ${w.durationMinutes} min): ${exList}`;
      })
      .join('\n');

    // Si aucune clé API Gemini n'est renseignée, on génère une réponse experte locale immédiate
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 450));
      return buildLocalContextualReply(userQuestion, localAnalysis, goalObj, levelObj);
    }

    const systemInstruction = [
      "Tu es le Coach IA d'Aura Pulse: Iron Strike, un préparateur physique virtuel bienveillant, méthodique et très prudent.",
      `Profil utilisateur : Niveau = ${levelObj.label}, Objectif = ${goalObj.label}, Âge = ${profile.age || 26} ans, Taille = ${profile.heightCm || 178} cm, Poids = ${profile.bodyWeightKg} kg, Cible = ${profile.weeklyTarget} séances/semaine.`,
      "Règles impératives :",
      "1. Analyse les séances enregistrées, mets en évidence les progrès chiffrés et propose 2 à 3 ajustements progressifs adaptés au niveau et à l'objectif.",
      "2. Reste toujours prudent : privilégie la qualité d'exécution, la progressivité (garder 1 à 3 répétitions en réserve / RPE 7.5-8.5) et la récupération.",
      "3. Rappelle systématiquement que tes conseils sont indicatifs et ne remplacent pas l'avis d'un médecin, kinésithérapeute ou professionnel de santé, surtout en cas de douleur.",
      "4. Réponds en français de manière claire, structurée et concise avec des puces markdown."
    ].join('\n');

    const promptInput = [
      `Historique récent des séances :\n${recentSummary || 'Aucune séance enregistrée.'}`,
      `Question ou demande de l'utilisateur : ${userQuestion || "Analyse mes dernières séances, souligne mes progrès et propose des ajustements prudents pour ma prochaine semaine."}`
    ].join('\n\n');

    let textOutput = '';
    let sourceUsed = selectedModel;

    try {
      // 1. Tenter le SDK officiel @google/genai si présent dans l'environnement
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: promptInput,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        textOutput = response.text || (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) || '';
      } catch (sdkImportErr) {
        // 2. Si le SDK n'est pas chargé via bundler, appel direct à l'API REST Google AI Studio
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: promptInput }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.7 }
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (textOutput) {
        return {
          source: sourceUsed,
          text: textOutput
        };
      }
      throw new Error('Réponse vide reçue de Google AI Studio.');
    } catch (err) {
      console.warn('Erreur appel Google AI Studio / Gemini API, bascule sur le moteur local prudent :', err);
      const fallback = buildLocalContextualReply(userQuestion, localAnalysis, goalObj, levelObj);
      return {
        source: 'local-fallback',
        errorNote: `Note : Clé API Google AI Studio indisponible ou invalide (${err.message || 'erreur réseau'}). Bilan généré par le moteur biomécanique local.`,
        text: fallback.text
      };
    }
  }

  function buildLocalContextualReply(userQuestion, analysis, goalObj, levelObj) {
    const q = (userQuestion || '').toLowerCase();
    const lines = [];

    lines.push(`### Bilan personnalisé (${goalObj.label} • ${levelObj.label})`);
    lines.push('');

    if (q.includes('douleur') || q.includes('mal') || q.includes('bless') || q.includes('épaule') || q.includes('dos') || q.includes('genou')) {
      lines.push('⚠️ **Prudence prioritaire face à une gêne ou douleur :**');
      lines.push('- **Suspendez immédiatement** tout exercice qui déclenche une douleur aiguë ou articulaire.');
      lines.push('- Ne cherchez jamais à « forcer sur une douleur » : remplacez temporairement le mouvement par une variante indolore à charge légère ou mettez la zone au repos.');
      lines.push('- **Consultez un médecin du sport ou un kinésithérapeute** pour établir un diagnostic précis avant de reprendre des charges sur cette articulation.');
      lines.push('');
    }

    if (analysis.highlights.length > 0) {
      lines.push('**1. Progrès mis en évidence :**');
      analysis.highlights.slice(0, 3).forEach((h) => {
        lines.push(`- **${h.exerciseName}** : ${h.metric} (${h.pct}) — dernière meilleure série à **${h.latestPerf}**. ${h.comment}`);
      });
      lines.push('');
    }

    if (analysis.adjustments.length > 0) {
      lines.push('**2. Ajustements prudents recommandés pour vos prochaines séances :**');
      analysis.adjustments.slice(0, 3).forEach((a) => {
        lines.push(`- **${a.title}** : ${a.detail}`);
      });
      lines.push('');
    }

    if (q.includes('récup') || q.includes('repos') || q.includes('fatigue') || q.includes('décharge')) {
      lines.push('**3. Gestion de la récupération :**');
      lines.push('- Prévoyez au moins **48h de récupération** avant de solliciter à nouveau intensément le même groupe musculaire.');
      lines.push('- Toutes les 5 à 6 semaines, une **semaine de décharge (Deload)** en réduisant le nombre de séries de 30 % et les charges de 10 % permet aux tendons et au système nerveux de surcompenser en sécurité.');
      lines.push('');
    }

    lines.push(`> *Rappel de sécurité : Ces recommandations ne remplacent pas l’avis d’un professionnel de santé.*`);

    return {
      source: 'local-engine',
      text: lines.join('\n')
    };
  }

  ns.AICoach = {
    MEDICAL_DISCLAIMER,
    GEMINI_MODELS,
    analyzeTrainingData,
    askGeminiCoach,
    testGeminiApiKey
  };
})(window.IronPulse);
