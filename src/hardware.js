// IronPulse Z - Module Hardware & Interopérabilité Capteurs (Web Bluetooth LE + Simulateur Biomécanique Hybride)
// Spécification Clean-Room : Bluetooth SIG Standards (Heart Rate 0x180D, FTMS 0x1826)
(function () {
  'use strict';

  var BLE_SERVICES = {
    HEART_RATE: 0x180d,
    FITNESS_MACHINE: 0x1826,
    CYCLING_SPEED_CADENCE: 0x1816
  };

  var BLE_CHARS = {
    HEART_RATE_MEASUREMENT: 0x2a37,
    FITNESS_MACHINE_FEATURE: 0x2acc,
    TREADMILL_DATA: 0x2acd,
    CROSS_TRAINER_DATA: 0x2ace,
    ROWER_DATA: 0x2acf
  };

  var state = {
    supported: !!(navigator.bluetooth && window.isSecureContext),
    status: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'simulated'
    deviceName: null,
    device: null,
    server: null,
    heartRate: 0,
    rpeEstimate: 0,
    cadence: 0,
    powerWatts: 0,
    isSimulated: false,
    simTimer: null
  };

  // --- TRACKING INERTIEL BIOMÉCANIQUE (DeviceMotionEvent) ---
  var motionState = {
    supported: typeof window !== 'undefined' && 'DeviceMotionEvent' in window,
    active: false,
    permissionGranted: false,
    repCount: 0,
    currentPhase: 'idle', // 'idle' | 'eccentric' | 'inflection' | 'concentric'
    currentAcceleration: 0,
    peakAcceleration: 0,
    lastRepTimestamp: 0,
    filteredAccel: 0,
    baselineGravity: 9.81
  };

  var MOTION_CONFIG = {
    ALPHA: 0.22,               // Constante de lissage passe-bas IIR
    MIN_THRESH: 1.65,          // Seuil minimal d'amorce du mouvement (m/s²)
    PEAK_THRESH: 2.85,         // Seuil du pic concentrique (m/s²)
    VALLEY_THRESH: 0.95,       // Seuil du point mort bas / inversion
    DEBOUNCE_MS: 1100          // Temps minimum anti-rebond entre deux répétitions
  };

  var listeners = [];

  function notify(data) {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](data);
      } catch (e) {
        console.error('Erreur listener hardware :', e);
      }
    }
  }

  function isSupported() {
    return state.supported;
  }

  function getState() {
    return {
      supported: state.supported,
      status: state.status,
      deviceName: state.deviceName,
      heartRate: state.heartRate,
      rpeEstimate: state.rpeEstimate,
      cadence: state.cadence,
      powerWatts: state.powerWatts,
      isSimulated: state.isSimulated,
      // Capteur inertiel smartphone (DeviceMotion)
      motionSupported: motionState.supported,
      motionActive: motionState.active,
      motionReps: motionState.repCount,
      motionPhase: motionState.currentPhase,
      motionAcceleration: motionState.currentAcceleration,
      motionPeakAccel: motionState.peakAcceleration
    };
  }

  function addListener(fn) {
    if (typeof fn === 'function' && listeners.indexOf(fn) === -1) {
      listeners.push(fn);
    }
  }

  function removeListener(fn) {
    var idx = listeners.indexOf(fn);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  }

  // Décodage standard Bluetooth SIG Heart Rate (0x2A37)
  function handleHeartRateNotification(event) {
    var value = event.target.value;
    if (!value || value.byteLength === 0) return;

    var flags = value.getUint8(0);
    var hr = 0;
    // Bit 0 = 0 -> UINT8, Bit 0 = 1 -> UINT16
    if ((flags & 0x01) === 0) {
      hr = value.getUint8(1);
    } else {
      hr = value.getUint16(1, true);
    }

    state.heartRate = hr;
    // Estimation d'intensité RPE biomécanique basée sur la FC (fréquence cardiaque relative)
    var rpe = Math.min(10, Math.max(1, ((hr - 60) / 130) * 9 + 1)).toFixed(1);
    state.rpeEstimate = parseFloat(rpe);

    notify(getState());
  }

  // Connexion standard Web Bluetooth
  async function connectHeartRate() {
    if (!state.supported) {
      console.warn('Web Bluetooth indisponible. Activation du simulateur de secours.');
      startSimulation();
      return getState();
    }

    try {
      state.status = 'connecting';
      notify(getState());

      var device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICES.HEART_RATE] }],
        optionalServices: ['battery_service']
      });

      device.addEventListener('gattserverdisconnected', function () {
        disconnect();
      });

      var server = await device.gatt.connect();
      var service = await server.getPrimaryService(BLE_SERVICES.HEART_RATE);
      var characteristic = await service.getCharacteristic(BLE_CHARS.HEART_RATE_MEASUREMENT);

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateNotification);

      state.device = device;
      state.server = server;
      state.deviceName = device.name || 'Capteur Cardio BLE';
      state.status = 'connected';
      state.isSimulated = false;

      notify(getState());
      return getState();
    } catch (err) {
      console.warn('Connexion Bluetooth annulée ou échouée :', err);
      state.status = 'disconnected';
      notify(getState());
      throw err;
    }
  }

  // Déconnexion propre
  function disconnect() {
    stopSimulation();
    if (state.device && state.device.gatt && state.device.gatt.connected) {
      try {
        state.device.gatt.disconnect();
      } catch (e) {
        // Ignorer si déjà déconnecté
      }
    }
    state.device = null;
    state.server = null;
    state.deviceName = null;
    state.status = 'disconnected';
    state.heartRate = 0;
    state.rpeEstimate = 0;
    state.cadence = 0;
    state.powerWatts = 0;
    state.isSimulated = false;
    notify(getState());
  }

  // SIMULATEUR BIOMÉCANIQUE UNIVERSEL (Fallback pour iOS/Safari, non-HTTPS et tests hors-ligne)
  function startSimulation(baseHr) {
    disconnect();
    state.status = 'simulated';
    state.isSimulated = true;
    state.deviceName = 'Simulateur Biomécanique Virtuel';
    var hr = baseHr || 128;
    var t = 0;

    state.simTimer = setInterval(function () {
      t += 0.1;
      // Simulation d'une courbe d'effort Shōnen réaliste avec variations naturelles
      var wave = Math.sin(t) * 12 + Math.cos(t * 0.5) * 6;
      var simulatedHr = Math.round(hr + wave);
      state.heartRate = Math.max(65, Math.min(195, simulatedHr));
      state.rpeEstimate = parseFloat(Math.min(10, Math.max(1, ((state.heartRate - 60) / 130) * 9 + 1)).toFixed(1));
      state.powerWatts = Math.round(state.heartRate * 1.8 + Math.sin(t * 2) * 20);
      state.cadence = Math.round(60 + Math.sin(t) * 8);

      notify(getState());
    }, 1000);

    notify(getState());
    return getState();
  }

  function stopSimulation() {
    if (state.simTimer) {
      clearInterval(state.simTimer);
      state.simTimer = null;
    }
  }

  // --- TRAITEMENT DU SIGNAL ACCÉLÉROMÈTRE & COMPTAGE DE RÉPÉTITIONS ---
  function handleDeviceMotion(event) {
    if (!motionState.active) return;

    var acc = event.acceleration;
    var ax = 0, ay = 0, az = 0;

    if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
      ax = acc.x || 0;
      ay = acc.y || 0;
      az = acc.z || 0;
    } else if (event.accelerationIncludingGravity) {
      var raw = event.accelerationIncludingGravity;
      var rawNorm = Math.hypot(raw.x || 0, raw.y || 0, raw.z || 0);
      var net = Math.abs(rawNorm - motionState.baselineGravity);
      ax = net;
      ay = 0;
      az = 0;
    }

    var mag = Math.hypot(ax, ay, az);

    // Filtre passe-bas IIR
    motionState.filteredAccel = MOTION_CONFIG.ALPHA * mag + (1 - MOTION_CONFIG.ALPHA) * motionState.filteredAccel;
    var a = motionState.filteredAccel;
    motionState.currentAcceleration = parseFloat(a.toFixed(2));
    if (a > motionState.peakAcceleration) {
      motionState.peakAcceleration = parseFloat(a.toFixed(2));
    }

    var now = performance.now();

    // Machine à états finis (FSM) pour le cycle de répétition
    switch (motionState.currentPhase) {
      case 'idle':
        if (a > MOTION_CONFIG.MIN_THRESH) {
          motionState.currentPhase = 'eccentric';
        }
        break;

      case 'eccentric':
        if (a < MOTION_CONFIG.VALLEY_THRESH) {
          motionState.currentPhase = 'inflection';
        }
        break;

      case 'inflection':
        if (a > MOTION_CONFIG.PEAK_THRESH) {
          motionState.currentPhase = 'concentric';
        }
        break;

      case 'concentric':
        if (a < MOTION_CONFIG.MIN_THRESH) {
          if (now - motionState.lastRepTimestamp >= MOTION_CONFIG.DEBOUNCE_MS) {
            motionState.repCount += 1;
            motionState.lastRepTimestamp = now;

            // Retour haptique instantané de validation
            if (window.IronPulse && window.IronPulse.Audio && window.IronPulse.Audio.triggerHaptic) {
              window.IronPulse.Audio.triggerHaptic(45);
            }
          }
          motionState.currentPhase = 'idle';
        }
        break;
    }

    notify(getState());
  }

  // Demande de permission iOS 13+ & initialisation
  async function requestMotionPermission() {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        var permission = await DeviceMotionEvent.requestPermission();
        motionState.permissionGranted = permission === 'granted';
        return motionState.permissionGranted;
      } catch (err) {
        console.warn('Autorisation DeviceMotion refusée :', err);
        motionState.permissionGranted = false;
        return false;
      }
    }
    motionState.permissionGranted = true;
    return true;
  }

  async function startMotionTracking() {
    var permitted = await requestMotionPermission();
    if (!permitted) return false;

    if (!motionState.active) {
      motionState.active = true;
      motionState.filteredAccel = 0;
      motionState.peakAcceleration = 0;
      motionState.currentPhase = 'idle';
      window.addEventListener('devicemotion', handleDeviceMotion, { passive: true });
      notify(getState());
    }
    return true;
  }

  function stopMotionTracking() {
    if (motionState.active) {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      motionState.active = false;
      motionState.currentPhase = 'idle';
      notify(getState());
    }
  }

  function resetMotionReps() {
    motionState.repCount = 0;
    motionState.peakAcceleration = 0;
    motionState.currentPhase = 'idle';
    notify(getState());
  }

  // API publique du module
  var api = {
    isSupported: isSupported,
    getState: getState,
    addListener: addListener,
    removeListener: removeListener,
    connectHeartRate: connectHeartRate,
    disconnect: disconnect,
    startSimulation: startSimulation,
    stopSimulation: stopSimulation,
    requestMotionPermission: requestMotionPermission,
    startMotionTracking: startMotionTracking,
    stopMotionTracking: stopMotionTracking,
    resetMotionReps: resetMotionReps
  };

  window.IronPulse = window.IronPulse || {};
  window.IronPulse.Hardware = api;
  window.IronPulseHardware = api;
})();
