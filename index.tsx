// Point d'entrée Google AI Studio (Vite / ES Module)
// Synchronise automatiquement la clé GEMINI_API_KEY de l'environnement AI Studio avec le moteur Coach IA d'IronPulse Z / AURA FIT
declare global {
  interface Window {
    GEMINI_API_KEY?: string;
    IronPulse?: any;
  }
}

try {
  if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
    window.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  }
} catch (_e) {
  // Mode navigateur local autonome (file://)
}

export {};
