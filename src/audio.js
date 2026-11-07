// IronPulse Z — Synthétiseur Sonore Shonen & HUD Tactique SFX (Web Audio API natif, 0 dépendance)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freqStart, freqEnd, durationSec, waveType, gainPeak, panVal) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = waveType || 'sine';
      osc.frequency.setValueAtTime(Math.max(20, freqStart), now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + durationSec);
      }

      gain.gain.setValueAtTime(gainPeak || 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      if (ctx.createStereoPanner && panVal !== undefined) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, panVal)), now);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch (e) {
      // Audio bloqué ou non disponible
    }
  }

  // --- MOTEUR HAPTIQUE SHŌNEN (VIBRATION API) ---
  function isHapticsSupported() {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  function isHapticsAllowed() {
    if (!isHapticsSupported()) return false;
    try {
      const state = ns.Storage ? ns.Storage.getState() : null;
      if (state && state.profile && state.profile.vibrationEnabled === false) return false;
    } catch (e) {}
    return true;
  }

  function triggerHaptic(pattern) {
    if (!isHapticsAllowed()) return false;
    try {
      return navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  }

  function hapticTempoTick(phase, count) {
    if (phase === 'ecc') {
      triggerHaptic(count === 1 ? 24 : 14);
    } else if (phase === 'pause-bot' || phase === 'pause') {
      triggerHaptic([28, 35, 28]);
    } else if (phase === 'conc' || phase === 'conc-burst' || phase === 'conc-go') {
      triggerHaptic([45, 25, 80]);
    }
  }

  function hapticImpactHeavy() {
    triggerHaptic([75, 30, 120, 40, 220]);
  }

  function hapticLevelUp() {
    triggerHaptic([25, 45, 30, 45, 40, 45, 55, 40, 75, 35, 110, 30, 160]);
  }

  // 1. BIP HUD TACTIQUE HIGH-TECH (Clics UI & Mesures)
  function playTacticalBeep(pitchShift) {
    const baseFreq = 880 * (pitchShift || 1.0);
    playTone(baseFreq, baseFreq * 1.35, 0.05, 'triangle', 0.08);
  }

  // Alias rétrocompatible
  const playScouterBeep = playTacticalBeep;

  // 2. ÉVEIL DU MANA & SURCHARGE CINÉTIQUE (Validation de série / Power Burst)
  function playKiBurst() {
    triggerHaptic([35, 20, 60]);
    playTone(110, 440, 0.32, 'sawtooth', 0.14);
    setTimeout(() => playTone(330, 880, 0.28, 'triangle', 0.11), 60);
    setTimeout(() => playTone(660, 1320, 0.22, 'sine', 0.09), 120);
  }

  // 3. MONTÉE DE NIVEAU SHONEN (LEVEL UP TRIOMPHANT)
  function playLevelUp() {
    hapticLevelUp();
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpège Do Majeur
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, freq * 1.02, 0.25, 'triangle', 0.12);
        playTone(freq * 0.5, freq * 0.51, 0.22, 'sine', 0.08);
      }, idx * 65);
    });
  }

  // 4. COUP CRITIQUE / IMPACT FRAME (Record battu ou Boss touché)
  function playImpactHeavy() {
    hapticImpactHeavy();
    playTone(180, 45, 0.22, 'square', 0.18);
    playTone(90, 30, 0.35, 'sine', 0.22);
    setTimeout(() => playTone(880, 220, 0.12, 'sawtooth', 0.08), 35);
  }

  // 5. GAIN DE PIÈCES D'OR 16-BIT (Boutique & Quêtes)
  function playCoinGold() {
    triggerHaptic(25);
    playTone(987.77, 987.77, 0.08, 'square', 0.09);
    setTimeout(() => playTone(1318.51, 1318.51, 0.22, 'square', 0.11), 75);
  }

  // 6. MÉTRONOME BIOMÉCANIQUE 3-1-1
  function playTempoTick(phase, count) {
    hapticTempoTick(phase, count);
    if (phase === 'ecc') {
      playTone(587.33, 587.33, 0.045, 'triangle', 0.07);
    } else if (phase === 'pause-bot') {
      playTone(440, 493.88, 0.08, 'sine', 0.09);
    } else if (phase === 'conc-burst') {
      playTone(659.25, 1174.66, 0.14, 'sawtooth', 0.11);
    }
  }

  ns.Audio = {
    getAudioContext,
    playTone,
    playTacticalBeep,
    playScouterBeep,
    playKiBurst,
    playLevelUp,
    playImpactHeavy,
    playCoinGold,
    playTempoTick,
    isHapticsSupported,
    triggerHaptic,
    hapticTempoTick,
    hapticImpactHeavy,
    hapticLevelUp
  };
})(window.IronPulse);
