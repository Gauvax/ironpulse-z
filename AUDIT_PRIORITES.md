# 🛡️ Audit Approfondi & Roadmap de Priorités — IronPulse Z

Cet audit évalue l'état actuel d'**IronPulse Z** et définit la hiérarchie des priorités d'ingénierie et de design pour transformer le projet en une application web & mobile publiable et haut de gamme.

---

## 1. Bilan de l'Audit Multidimensionnel

```mermaid
quadrantChart
    title Matrice Impact vs Effort (Priorités de Publication)
    x-axis Faible Effort --> Fort Effort
    y-axis Faible Impact --> Fort Impact
    quadrant-1 Priorité 1 : Chantiers Majeurs
    quadrant-2 Priorité 2 : Quick Wins Fort Impact
    quadrant-3 Priorité 4 : Backlog Secondaire
    quadrant-4 Priorité 3 : Optimisations Techniques
    "Animations Fluides 3D/2D": [0.65, 0.88]
    "Sélecteur Rapide Studio UI": [0.25, 0.78]
    "Export / Import Sauvegardes Cloud": [0.45, 0.82]
    "Effets Sonores & Ki Audio SFX": [0.35, 0.72]
    "PWA Manifest & Cache Offline": [0.30, 0.68]
    "Multi-Donjons Boss IA Dynamiques": [0.80, 0.85]
    "Optimisation Draw Calls Three.js": [0.55, 0.60]
```

### A. Graphismes & Direction Artistique Manga (Note : 8.5/10)
- **Points Forts :**
  - Identité Shonen sombre très affirmée (palette 60-30-10 Obsidian / Ki Gold / Astral Cyan).
  - Personnalisation complète : Sexe (Guerrier / Valkyrie), 6 teints de peau, 5 coiffures 3D/2D, 7 couleurs de cheveux, 6 teintes d'yeux avec pupille Ki.
  - Double moteur hybride : Three.js WebGL Cel-Shading 360° + Rig vectoriel 2D + Pixel Art 16-Bit GAUVAX.
- **Axes d'Amélioration :**
  - Ajout d'animations de transition interpolées entre les mouvements (Lerp / Slerp osseux plus organique).
  - Richesse de la garde-robe : plus de variantes d'accessoires (gants de tirage, ceintures de force cuir brodé, bandeaux martiaux).

### B. Moteur 3D Three.js & Performance (Note : 9/10)
- **Points Forts :**
  - Zéro dépendance externe lourde : maillage procédural cel-shadé (capsules, sphères, cônes orientés).
  - Éclairage dynamique temps réel avec `PointLight` pulsée et `DirectionalLight` (Rim light arrière).
  - Métronome biomécanique 3-1-1 calibré pour l'hypertrophie.
- **Axes d'Amélioration :**
  - Nettoyage rigoureux des géométries lors des re-renders pour éviter toute accumulation mémoire.
  - Option de verrouillage à 60 FPS sur mobile pour préserver la batterie.

### C. Moteur MMORPG & Progression (Note : 8.5/10)
- **Points Forts :**
  - Calcul dynamique de l'XP indexé sur le volume réel ($Tonnage \times Séries$).
  - Boss de Donjon déblocables via des records 1RM réels (Brzycki / Epley).
  - Système de Reliques passives (+5% à +15% XP).
- **Axes d'Amélioration :**
  - Donjons hebdomadaires avec malus d'énergie ou boss à vaincre en équipe (Guilde synchrone).
  - Système de hauts-faits (Achievements) visuels avec badges métalliques.

### D. IA Coach Gemini & Intelligence Prédictive (Note : 8/10)
- **Points Forts :**
  - SDK officiel `@google/genai` avec gestion sécurisée des clés via `window.GEMINI_API_KEY` (zéro fuite `.env`).
  - Analyse contextuelle de l'historique d'entraînement, fatigue et surcompensation.
- **Axes d'Amélioration :**
  - Mode streaming pour les réponses du coach IA dans le chat.
  - Suggestions automatiques de charges pour la séance du jour selon le RPE de la séance précédente.

---

## 2. Plan d'Action & Roadmap des Priorités

### 🎯 Priorité 1 : Finition Visuelle & Audio Immersive (Semaine 1)
1. **Audio Ki & Scouter SFX :**
   - Synthétiseur audio Web Audio API pour les bips de tempo 3-1-1, sons de montée de niveau (*Level Up!*) et explosion de Ki.
2. **Effets d'Impact Frames (Manga Punch FX) :**
   - Flashs blancs à 1 frame sur la validation d'une série lourde ou défaite d'un Boss de donjon.
3. **Animations de Transition Fluide :**
   - Interpolation adoucie lors du passage d'un mouvement à un autre (ex: de la Garde martiale au Squat lourd).

### 🎯 Priorité 2 : Persistance & Sécurité des Données (Semaine 2)
1. **Export / Import de Sauvegarde JSON :**
   - Bouton de sauvegarde locale one-click pour exporter/importer son profil de chasseur sans risque de perte.
2. **PWA & Cache Hors-Ligne Total :**
   - Service Worker pour que l'application fonctionne à 100% dans une salle de sport sans connexion réseau.

### 🎯 Priorité 3 : Social & Boss Raids (Semaine 3)
1. **Système de Défis de Guilde Amis :**
   - Partage de cartes de victoires stylisées générées en image (pour Instagram/Discord).
2. **Monétisation Cosmétique (Optionnel) :**
   - Skin exclusifs déblocables uniquement via des records d'assiduité (zéro pay-to-win, 100% effort).
