// IronPulse — Moteur RPG Fantasy / Shonen (Système d'Éveil des Chasseurs, Direction Artistique Shonen, Personnalisation, Reliques & Guilde)
window.IronPulse = window.IronPulse || {};

(function (ns) {
  function resolveAssetUrl(filename) {
    const base = window.IRONPULSE_ASSETS_BASE || './src/assets/';
    return base + filename;
  }

  // Classes du Héros dans l'univers Shonen / Fantasy avec Artworks dédiés
  const HERO_CLASSES = [
    {
      id: 'berserker',
      name: 'Athlète Force Pure',
      icon: '⚔️',
      artFile: 'hero-anime-original.svg',
      title: 'Seigneur de la Poussée & de l’Impact',
      bonusDesc: '+10 % XP Pectoraux, Épaules & Bras',
      desc: 'Spécialiste des charges explosives du haut du corps. +10 % d’XP sur les exercices Pectoraux, Épaules et Triceps.',
      bonusMuscles: ['Pectoraux', 'Épaules', 'Bras'],
      color: 'rose',
      defaultAura: 'crimson'
    },
    {
      id: 'paladin',
      name: 'Paladin Égide',
      icon: '🛡️',
      artFile: 'hero-paladin.jpg',
      title: 'Gardien de l’Équilibre & de la Posture',
      bonusDesc: '+10 % XP Dos & Abdominaux',
      desc: 'Maître de l’harmonie musculaire et du tirage. +10 % d’XP sur le Dos, le Gainage et les séances complètes.',
      bonusMuscles: ['Dos', 'Abdominaux'],
      color: 'blue',
      defaultAura: 'azure'
    },
    {
      id: 'titan',
      name: 'Titan Colossal',
      icon: '🏔️',
      artFile: 'hero-titan.jpg',
      title: 'Briseur de Terre & Force Pure',
      bonusDesc: '+10 % XP Jambes & Séries lourdes',
      desc: 'Puissance brute enracinée dans les jambes et la chaîne postérieure. +10 % d’XP sur les Jambes et les séries lourdes.',
      bonusMuscles: ['Jambes', 'Dos'],
      color: 'amber',
      defaultAura: 'gold'
    },
    {
      id: 'monarch',
      name: 'Athlète Nocturne',
      icon: '👑',
      artFile: 'hero-monarch.jpg',
      title: 'Chasseur Polyvalent de Rang Souverain',
      bonusDesc: '+8 % XP Global sur toute séance',
      desc: 'Maîtrise totale de tous les groupes musculaires. +8 % d’XP global sur l’ensemble des entraînements.',
      bonusMuscles: ['Pectoraux', 'Dos', 'Jambes', 'Épaules', 'Bras', 'Abdominaux'],
      color: 'violet',
      defaultAura: 'shadow'
    }
  ];

  // Options de personnalisation visuelle du personnage (Studio Chara-Design / Anime Urbain)
  const AURA_STYLES = [
    { id: 'shadow-monarch', label: 'Aura Cinétique Nocturne', primary: '#7C3AED', secondary: '#06B6D4', glow: 'rgba(124, 58, 237, 0.85)' },
    { id: 'phantom-rebel', label: 'Sprinter Urbain Tactique', primary: '#EF4444', secondary: '#F8FAFC', glow: 'rgba(239, 68, 68, 0.85)' },
    { id: 'gold', label: 'Éveil Solaire Cinétique', primary: '#F59E0B', secondary: '#FEF08A', glow: 'rgba(245, 158, 11, 0.75)' },
    { id: 'crimson', label: 'Surcharge Écarlate Intensive', primary: '#F43F5E', secondary: '#FB923C', glow: 'rgba(244, 63, 94, 0.72)' },
    { id: 'azure', label: 'Flux Astral Divin', primary: '#38BDF8', secondary: '#E0F2FE', glow: 'rgba(56, 189, 248, 0.75)' },
    { id: 'shadow', label: 'Aura de l’Ombre Souveraine', primary: '#8B5CF6', secondary: '#C4B5FD', glow: 'rgba(139, 92, 246, 0.75)' },
    { id: 'emerald', label: 'Résonance Tellurique Colossale', primary: '#10B981', secondary: '#BEF264', glow: 'rgba(16, 185, 129, 0.75)' }
  ];

  const GENDERS = [
    { id: 'male', label: 'Guerrier (Masculin)', icon: '⚔️' },
    { id: 'female', label: 'Guerrière (Féminin)', icon: '🛡️' }
  ];

  // 5 PROPOSITIONS DE MORPHOLOGIES MAJEURES (CORPS MODULAIRES SHONEN & COMBAT)
  const MORPHOLOGIES = [
    {
      id: 'athletic-vtaper',
      label: 'Striker V-Taper (Athlétique)',
      name: 'Striker V-Taper (Athlétique)',
      icon: '⚡',
      badge: 'Équilibré & Puissant',
      desc: 'Silhouette en V parfaite, abdominaux 8-pack sculptés, deltoïdes ronds et découpe athlétique agile.'
    },
    {
      id: 'ogre-hanma',
      label: 'Titan Calisthénie & Hypertrophie',
      name: 'Titan Calisthénie & Hypertrophie',
      icon: '👹',
      badge: 'Démon & Striations',
      desc: 'Trapèzes en cobra hyper-développés, dentelés en dents de requin, striations sternales et vascularisation sous tension maximale.'
    },
    {
      id: 'iron-puncher',
      label: 'Puncheur d’Acier (Boxe & Cardio)',
      name: 'Puncheur d’Acier (Boxe & Cardio)',
      icon: '🥊',
      badge: 'Épaules Canons & Impact',
      desc: 'Épaules en boulets de canon pour le Dempsey Roll, avant-bras bandés de puncheur, cou d’acier ultra-dense et vapeur corporelle.'
    },
    {
      id: 'colossal-titan',
      label: 'Titan Colossal (Heavyweight)',
      name: 'Titan Colossal (Heavyweight)',
      icon: '🛡️',
      badge: 'Force Brute 1RM',
      desc: 'Trapèzes massifs surélevés, deltoïdes colossaux, cage thoracique élargie et charpente lourde de force.'
    },
    {
      id: 'agile-stalker',
      label: 'Valkyrie / Ombre Éthérée',
      name: 'Valkyrie / Ombre Éthérée',
      icon: '🗡️',
      badge: 'Vitesse & Agilité',
      desc: 'Silhouette fine et tonique, centre de gravité bas, réactivité cinétique et tenue profilée.'
    }
  ];

  const SKIN_TONES = [
    { id: 'dark', label: 'Ébène Athlétique (Studio AAA)', hex: '#523425', shade: '#3D2418', shadow: '#26150D' },
    { id: 'bronze', label: 'Bronze Sculpté', hex: '#784831', shade: '#5C3421', shadow: '#3B1F12' },
    { id: 'tan', label: 'Cuivré Hâlé', hex: '#B26E45', shade: '#8D5230', shadow: '#5E331B' },
    { id: 'golden', label: 'Doré Ambré', hex: '#DE9E6E', shade: '#BD7E50', shadow: '#7F4D2B' },
    { id: 'fair', label: 'Clair Pêche', hex: '#EFC2A0', shade: '#D89E78', shadow: '#966343' },
    { id: 'pale', label: 'Pâle Albâtre', hex: '#F7D6C4', shade: '#E2B59F', shadow: '#9F7059' },
    { id: 'shadow', label: 'Ombre Souveraine', hex: '#312E81', shade: '#1E1B4B', shadow: '#0F172A' }
  ];

  const EYE_COLORS = [
    { id: 'cyan-astral', label: 'Cyan Astral', hex: '#06B6D4', glow: '#67E8F9' },
    { id: 'kinetic-gold', label: 'Or Cinétique', hex: '#F59E0B', glow: '#FDE68A' },
    { id: 'crimson-berserk', label: 'Rouge Intensité', hex: '#EF4444', glow: '#FCA5A5' },
    { id: 'amethyst-void', label: 'Violet du Néant', hex: '#8B5CF6', glow: '#C4B5FD' },
    { id: 'emerald-mana', label: 'Vert Tellurique', hex: '#10B981', glow: '#6EE7B7' },
    { id: 'silver-instinct', label: 'Argent Divin', hex: '#E2E8F0', glow: '#FFFFFF' }
  ];

  // 3 PROPOSITIONS DE COIFFURES MAJEURES + VARIANTES MODULAIRES
  const HAIRSTYLES = [
    {
      id: 'solo-undercut',
      label: 'Mèche du Chasseur S (Édition Nocturne)',
      icon: '🗡️',
      tag: 'Édition Nocturne',
      desc: 'Coupe effilée asymétrique noire de Monarque, mèche acérée couvrant le front et révélant un regard incandescent.'
    },
    {
      id: 'persona-joker',
      label: 'Chevelure Rebelle (Style Urbain)',
      icon: '🃏',
      tag: 'Style Urbain',
      desc: 'Mèches texturées dynamiques au vent, contrastes marqués d’encre noire et reflets cel-shading ultra-stylisés.'
    },
    {
      id: 'spiky-striker',
      label: 'Pointes Cinétiques de Chasseur',
      icon: '⚡',
      tag: 'Proposition 1 (Action Shonen)',
      desc: 'Pointes dynamiques acérées avec reflets biseautés inspirées des champions d’action RPG mobile.'
    },
    {
      id: 'cyber-undercut',
      label: 'Undercut Cyber-Monarque',
      icon: '🗡️',
      tag: 'Proposition 2 (Urban Techwear)',
      desc: 'Coupe urbaine asymétrique moderne, mèche effilée tombant sur la tempe et côtés rasés nets.'
    },
    {
      id: 'stellar-flow',
      label: 'Crinière Stellaire Flamboyante',
      icon: '🔥',
      tag: 'Proposition 3 (Énergie Pure)',
      desc: 'Longue chevelure de guerrier d’énergie flottant dans l’aura cinétique.'
    },
    {
      id: 'valkyrie-braids',
      label: 'Tresses Valkyrie de Combat',
      icon: '🛡️',
      tag: 'Variante Guerrière',
      desc: 'Tresses d’assaut serrées avec bagues de renfort en acier.'
    },
    {
      id: 'tactical-crop',
      label: 'Court Militaire Fade',
      icon: '✂️',
      tag: 'Variante Athlétique',
      desc: 'Coupe courte nette avec dégradé à blanc pour une visibilité totale en arène.'
    }
  ];

  const HAIR_COLORS = [
    { id: 'obsidian', label: 'Noir Sidéral', hex: '#0F172A', stroke: '#475569' },
    { id: 'kinetic-gold', label: 'Or Cinétique Flamboyant', hex: '#FACC15', stroke: '#FEF9C3' },
    { id: 'silver', label: 'Argent Astral Divin', hex: '#E2E8F0', stroke: '#38BDF8' },
    { id: 'crimson', label: 'Surcharge Écarlate', hex: '#DC2626', stroke: '#FCA5A5' },
    { id: 'amethyst', label: 'Bleu / Violet Astral', hex: '#2563EB', stroke: '#93C5FD' },
    { id: 'rose', label: 'Rosé Impérial', hex: '#F43F5E', stroke: '#FDA4AF' },
    { id: 'emerald', label: 'Vert Tellurique', hex: '#10B981', stroke: '#6EE7B7' }
  ];

  const ARMOR_TINTS = [
    { id: 'dark-steel', label: 'Dogi Noir & Rubis', start: '#334155', mid: '#1E293B', end: '#090D16', sash: '#E11D48' },
    { id: 'golden-god', label: 'Dogi Forge Solaire & Azur', start: '#F97316', mid: '#EA580C', end: '#9A3412', sash: '#2563EB' },
    { id: 'royal-aegis', label: 'Dogi Bleu Céleste & Blanc', start: '#2563EB', mid: '#1D4ED8', end: '#1E3A8A', sash: '#F8FAFC' },
    { id: 'blood-dragon', label: 'Dogi Écarlate & Or', start: '#BE123C', mid: '#881337', end: '#4C0519', sash: '#F59E0B' }
  ];

  // CHOIX DE MÂCHOIRES & STRUCTURES FACIALES
  const JAW_TYPES = [
    { id: 'jaw-sharp', label: 'Mâchoire V-Shape Acérée', icon: '📐', desc: 'Lignes épurées et menton pointu façon shonen urbain moderne' },
    { id: 'jaw-chiseled', label: 'Mâchoire Carrée Ciselée', icon: '🔲', desc: 'Structure osseuse massive et virile taillée pour encaisser les chocs' },
    { id: 'jaw-soft', label: 'Mâchoire Fine Profilée', icon: '✨', desc: 'Galbe athlétique élégant pour silhouettes rapides et agiles' }
  ];

  const FACE_EXPRESSIONS = [
    { id: 'determined', label: 'Focus Déterminé (Striker)', icon: '🎯', desc: 'Regard perçant vers l’objectif, sourcils droits et mâchoire verrouillée' },
    { id: 'monarch', label: 'Regard du Souverain', icon: '👑', desc: 'Calme impérial, yeux embrasés de mana froid' },
    { id: 'berserk', label: 'Rage de Dépassement (1RM)', icon: '🔥', desc: 'Intensité extrême, dents serrées et pupilles dilatées par la poussée' },
    { id: 'confident', label: 'Sourire du Vainqueur', icon: '😏', desc: 'Sourire en coin de défi avant d’entrer dans l’arène' }
  ];

  const WAR_MARKINGS = [
    { id: 'shadow-monarch-eyes', label: 'Yeux du Monarque (Édition Nocturne)', icon: '👁️' },
    { id: 'phantom-mask', label: 'Masque Sprinter Urbain Tactique', icon: '🎭' },
    { id: 'none', label: 'Visage Pur', icon: '✨' },
    { id: 'eye-scar', label: 'Balafre du Vétéran', icon: '⚔️' },
    { id: 'mana-runes', label: 'Runes Cinétiques d’Éveil', icon: '🔮' },
    { id: 'hunter-sigil', label: 'Sceau de Chasseur de Faille', icon: '⚡' },
    { id: 'energy-circuit', label: 'Lignes Bio-Circuits Néon', icon: '🌐' },
    { id: 'baki-scars', label: 'Cicatrices de l’Ogre (Hypertrophie Pure)', icon: '👹' },
    { id: 'ippo-focus', label: 'Regard du Champion (Boxe & Cardio)', icon: '🥊' }
  ];

  // PROPOSITIONS DE TENUES SPORT & ACTION RPG
  const OUTFITS = [
    {
      id: 'outfit-baki-trunks',
      label: 'Short de Combat Brut (Hypertrophie Pure)',
      icon: '🩳',
      desc: 'Torse nu ultra-strié, short court MMA écarlate, pieds nus avec bandages aux chevilles et Dos du Démon.'
    },
    {
      id: 'outfit-boxer-trunks',
      label: 'Trunks de Boxe Anglaise (Boxe & Cardio)',
      icon: '🥊',
      desc: 'Trunks de boxe bleue à ceinture blanche de champion, bandages de frappe Dempsey Roll et carrure de puncheur.'
    },
    {
      id: 'outfit-z-warrior',
      label: 'Dogi de la Gravité x100 (Style Pro)',
      icon: '🥋',
      desc: 'Dogi martial d’entraînement intensif sous haute gravité avec poignets lestés et ceinture de combat nouée.'
    },
    {
      id: 'outfit-monarch-trench',
      label: 'Manteau du Monarque (Édition Nocturne)',
      icon: '🧥',
      desc: 'Long trench d’ébène fluide aux volutes d’ombres violettes et revers relevés de Chasseur de rang S.'
    },
    {
      id: 'outfit-phantom-thief',
      label: 'Queue-de-pie Rebelle (Style Urbain)',
      icon: '🎭',
      desc: 'Longue queue-de-pie de cuir noir doublée de pourpre écarlate, gants cramoisis et cel-shading tranché.'
    },
    {
      id: 'outfit-dogi',
      label: 'Dogi de l’Ordre Cinétique',
      icon: '🥋',
      desc: 'Tenue martiale hybride avec pantalon large shonen et ceinture nouée.'
    },
    {
      id: 'outfit-techwear',
      label: 'Techwear Stringer & Cargo',
      icon: '🎽',
      desc: 'Débardeur fitness biseauté laissant voir la musculature et pantalon cargo à sangles.'
    },
    {
      id: 'outfit-compression',
      label: 'Combinaison Cyber-Pulse',
      icon: '⚡',
      desc: 'Armure thermique de compression profilée avec bandes luminescentes réactives.'
    }
  ];

  // ÉQUIPEMENTS DE FORCE PROFESSIONNELS & COMBAT
  const POWER_EQUIPMENTS = [
    { id: 'shadow-daggers', label: 'Dagues Jumelles d’Ombre (Édition Nocturne)', icon: '🗡️', slot: 'weapons', desc: 'Lames d’assassin forgées dans le néant avec tranchant infusé de mana bleuté.' },
    { id: 'phantom-gloves', label: 'Gants Cramoisis du Rebelle (Style Urbain)', icon: '🥊', slot: 'hands', desc: 'Gants de cuir rouge carmin emblématiques des cambrioleurs de cœurs.' },
    { id: 'equip-belt', label: 'Ceinture à Levier Acier (13mm)', icon: '🛡️', slot: 'belt', desc: 'Ceinture de force en cuir rigide avec boucle à levier en acier runique.' },
    { id: 'equip-sleeves', label: 'Genouillères Néoprène (7mm)', icon: '🦵', slot: 'knees', desc: 'Manchons de compression 7mm assurant un rebond élastique optimal au squat.' },
    { id: 'equip-wristwraps', label: 'Protège-Poignets Cinétiques', icon: '🥊', slot: 'wrists', desc: 'Bandes élastiques haute tension stabilisant les poignets aux charges lourdes.' },
    { id: 'equip-straps', label: 'Sangles de Tirage Tactiques', icon: '✋', slot: 'hands', desc: 'Sangles en nylon haute résistance pour un grip infaillible au soulevé de terre.' },
    { id: 'equip-boxer-wraps', label: 'Bandages de Boxe (Boxe & Cardio)', icon: '🥊', slot: 'hands', desc: 'Bandes de gaze blanche serrées pour absorber les chocs titanesques.' },
    { id: 'equip-demon-back', label: 'Dos du Démon (Hypertrophie Pure)', icon: '👹', slot: 'back', desc: 'Sillons dorsaux et trapèzes en cobra irradiant une énergie rougeoyante.' }
  ];

  const CUSTOM_TITLES = [
    'Athlète Nocturne (Rang S)',
    'Voleur Fantôme du Cœur',
    'Striker de la Fonte',
    'Éveillé du Tonnage',
    'Chasseur de Rang S • Vétéran de Fonte',
    'Briseur de Gravité',
    'Maître de la Surcharge',
    'Monarque de l’Acier',
    'Poing du Vortex'
  ];

  // PRÉSETS D'ARCHÉTYPES MANGA RPG & SPORTS DE COMBAT (1-CLIC)
  const MANGA_ARCHETYPES = [
    {
      id: 'baki-hanma',
      name: 'Titan Hypertrophie',
      subtitle: 'Calisthénie Extrême & Force Brute • Combat Brut & Calisthénie',
      icon: '👹',
      badge: 'Démon & Striations',
      description: 'Torse nu ultra-strié, dentelés en dents de requin, Dos du Démon irradiant, cicatrices de l’Ogre, short de combat MMA écarlate et rage pure.',
      appearance: {
        gender: 'male',
        morphology: 'ogre-hanma',
        auraStyle: 'crimson',
        outfit: 'outfit-baki-trunks',
        hairstyle: 'cyber-undercut',
        hairColor: 'crimson',
        warMarking: 'baki-scars',
        eyeColor: 'crimson-berserk',
        powerEquipments: ['equip-demon-back'],
        battleTitle: 'Créature la plus Forte du Monde',
        lightningSparks: true
      }
    },
    {
      id: 'hajime-ippo',
      name: 'Puncheur d’Acier',
      subtitle: 'Boxe & Cardio Explosif • Cadence & Impact',
      icon: '🥊',
      badge: 'Impact & Explosivité',
      description: 'Trunks de boxe de champion à large ceinture blanche, bandages de frappe serrés, épaules canons de puncheur, regard d’acier et aura azur d’impact.',
      appearance: {
        gender: 'male',
        morphology: 'iron-puncher',
        auraStyle: 'azure',
        outfit: 'outfit-boxer-trunks',
        hairstyle: 'tactical-crop',
        hairColor: 'obsidian',
        warMarking: 'ippo-focus',
        eyeColor: 'cyan-astral',
        powerEquipments: ['equip-boxer-wraps'],
        battleTitle: 'Artilleur du Ring',
        lightningSparks: true
      }
    },
    {
      id: 'dbz-saiyan',
      name: 'Athlète Puissance Pure',
      subtitle: 'Haute Gravité x100 & Énergie Cinétique',
      icon: '⚡',
      badge: 'Aura Solaire Apex',
      description: 'Tenue de Compression Pro martiale sous gravité x100, aura solaire dorée crépitante d’éclairs et ceinture de force.',
      appearance: {
        gender: 'male',
        morphology: 'athletic-vtaper',
        auraStyle: 'gold',
        outfit: 'outfit-z-warrior',
        hairstyle: 'tactical-crop',
        hairColor: 'obsidian',
        warMarking: 'hunter-sigil',
        eyeColor: 'emerald-mana',
        powerEquipments: ['equip-belt'],
        battleTitle: 'Guerrier de la Gravité x100',
        lightningSparks: true
      }
    },
    {
      id: 'solo-leveling',
      name: 'Athlète Nocturne',
      subtitle: 'Athlète Nocturne • Force & Agilité',
      icon: '👑',
      badge: 'Rang S National',
      description: 'Aura violette ténébreuse, veste athlétique sombre fluide, coupe dynamique moderne et regard embrasé de mana cyan.',
      appearance: {
        gender: 'male',
        morphology: 'athletic-vtaper',
        auraStyle: 'shadow-monarch',
        outfit: 'outfit-monarch-trench',
        hairstyle: 'solo-undercut',
        hairColor: 'obsidian',
        warMarking: 'shadow-monarch-eyes',
        eyeColor: 'cyan-astral',
        powerEquipments: ['shadow-daggers'],
        battleTitle: 'Athlète Nocturne (Rang S)',
        lightningSparks: true
      }
    },
    {
      id: 'persona-5',
      name: 'Sprinter Urbain Tactique',
      subtitle: 'Style Urbain • Agilité & Explosivité',
      icon: '🎭',
      badge: 'Vitesse Écarlate',
      description: 'Aura pourpre écarlate, tenue urbaine profilée, gants de grip carmin et cel-shading ultra-contrasté.',
      appearance: {
        gender: 'male',
        morphology: 'athletic-vtaper',
        auraStyle: 'phantom-rebel',
        outfit: 'outfit-phantom-thief',
        hairstyle: 'persona-joker',
        hairColor: 'obsidian',
        warMarking: 'phantom-mask',
        eyeColor: 'silver-instinct',
        powerEquipments: ['phantom-gloves'],
        battleTitle: 'Sprinter Urbain Tactique',
        lightningSparks: true
      }
    }
  ];

  // Catalogue Boutique & Dressing 16-Bit / Isekai (AURA FIT Wardrobe)
  const WARDROBE_CATALOG = [
    { id: 'tee_oversize_white', name: 'T-shirt Oversize Blanc', slot: 'outfit', slotLabel: 'Tenue', icon: '👕', priceGold: 0, minLevel: 1, desc: 'Coupe streetwear oversize blanche signature GAUVAX.' },
    { id: 'tank_shadow', name: 'Débardeur Shadow Gym', slot: 'outfit', slotLabel: 'Tenue', icon: '🎽', priceGold: 150, minLevel: 3, desc: 'Débardeur noir échancré mettant en valeur les deltoïdes et pectoraux.' },
    { id: 'hoodie_amber', name: 'Hoodie Streetwear Ambre', slot: 'outfit', slotLabel: 'Tenue', icon: '🧥', priceGold: 250, minLevel: 5, desc: 'Pump cover lourd ambre & obsidienne pour l’échauffement.' },
    { id: 'compression_pro', name: 'Tactical Pro Compression', slot: 'outfit', slotLabel: 'Tenue', icon: '🥋', priceGold: 400, minLevel: 8, desc: 'Armure thermique cyber-compression à coutures réactives.' },
    { id: 'gold_earring', name: 'Anneau d’Or Signature', slot: 'accessory', slotLabel: 'Accessoire', icon: '💍', priceGold: 0, minLevel: 1, desc: 'Anneau d’or 16-bit brillant à l’oreille gauche.' },
    { id: 'gym_gloves', name: 'Gants Cuir Grip Pro', slot: 'accessory', slotLabel: 'Accessoire', icon: '🥊', priceGold: 100, minLevel: 2, desc: 'Gants de tirage renforcés pour soulevé de terre lourd.' },
    { id: 'beats_headphones', name: 'Casque Audio Studio Bass', slot: 'accessory', slotLabel: 'Accessoire', icon: '🎧', priceGold: 220, minLevel: 4, desc: 'Casque arceau isolant pour une concentration totale sous la barre.' },
    { id: 'neon_gym', name: 'Salle Néon Nocturne', slot: 'background', slotLabel: 'Fond', icon: '🌃', priceGold: 0, minLevel: 1, desc: 'Rack de force nocturne éclairé aux néons cyan et ambre.' },
    { id: 'sunset_rooftop', name: 'Golden Hour Rooftop', slot: 'background', slotLabel: 'Fond', icon: '🌇', priceGold: 180, minLevel: 3, desc: 'Toit urbain surplombant la métropole au coucher du soleil.' },
    { id: 'dojo_minimal', name: 'Dojo Brutaliste Métal', slot: 'background', slotLabel: 'Fond', icon: '⛩️', priceGold: 280, minLevel: 6, desc: 'Sanctuaire d’acier et béton brut dédié aux records 1RM.' }
  ];

  // Les 5 états d'animation de l'avatar 16-Bit GAUVAX
  const GAUVAX_STATES = [
    { id: 'repos', label: 'Repos', icon: '😌', quote: 'Prêt à soulever de la fonte. La gravité attend.' },
    { id: 'effort', label: 'Effort', icon: '🔥', quote: 'Contraction maximale ! Plus qu’une rep !' },
    { id: 'victoire', label: 'Victoire', icon: '🏆', quote: 'Série validée ! +XP & Or acquis !' },
    { id: 'fatigue', label: 'Fatigue', icon: '💧', quote: 'Respiration haletante... Récupération du Ki.' },
    { id: 'level_up', label: 'Level Up', icon: '⚡', quote: '[SYSTÈME] : Limites brisées ! Ascension d’Éveillé !' }
  ];

  // Rangs de Chasseur de l'Ordre Cinétique (E -> D -> C -> B -> A -> S -> SS)
  const HUNTER_RANKS = [
    { rank: 'E', minLevel: 1, title: 'Chasseur Éveillé', aura: 'Gris Acier', badgeBg: 'bg-slate-800 text-slate-200 border-slate-600' },
    { rank: 'D', minLevel: 3, title: 'Combattant de Bronze', aura: 'Vert Émeraude', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    { rank: 'C', minLevel: 6, title: 'Chevalier d’Argent', aura: 'Bleu Azur', badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/50' },
    { rank: 'B', minLevel: 10, title: 'Commandant d’Assaut', aura: 'Violet Astral', badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' },
    { rank: 'A', minLevel: 15, title: 'Héritier des Titans', aura: 'Or Flamboyant', badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    { rank: 'S', minLevel: 22, title: 'Chasseur de Rang S', aura: 'Pourpre Impérial', badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    { rank: 'SS', minLevel: 30, title: 'Monarque Absolu', aura: 'Éclat Divin', badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-500/60' }
  ];

  // Reliques & Équipements déblocables par les performances réelles
  const RELICS = [
    {
      id: 'relic-gauntlets',
      name: 'Bandages de Force Pro',
      slot: 'Mains',
      rarity: 'Rare (Rang C)',
      icon: '🥊',
      bonusXpPct: 5,
      bonusLabel: '+5 % XP Global & +3 FOR',
      conditionDesc: 'Terminer au moins 2 séances d’entraînement',
      checkUnlock: (ctx) => ctx.totalWorkouts >= 2
    },
    {
      id: 'relic-belt',
      name: 'Ceinture du Titan Colossal',
      slot: 'Taille',
      rarity: 'Épique (Rang B)',
      icon: '⛓️',
      bonusXpPct: 7,
      bonusLabel: '+7 % XP Global & +5 END',
      conditionDesc: 'Cumuler plus de 15 000 kg (15 t) de tonnage total soulevé',
      checkUnlock: (ctx) => ctx.totalVolumeKg >= 15000
    },
    {
      id: 'relic-pauldrons',
      name: 'Espaliers d’Atlas',
      slot: 'Épaules',
      rarity: 'Épique (Rang B)',
      icon: '🛡️',
      bonusXpPct: 6,
      bonusLabel: '+6 % XP Global & +4 VIT',
      conditionDesc: 'Valider au moins 45 séries au total dans l’historique',
      checkUnlock: (ctx) => ctx.totalSets >= 45
    },
    {
      id: 'relic-boots',
      name: 'Bottes de Foudre Valkyrie',
      slot: 'Pieds',
      rarity: 'Épique (Rang A)',
      icon: '⚡',
      bonusXpPct: 8,
      bonusLabel: '+8 % XP Global & +6 AGI',
      conditionDesc: 'Atteindre un 1RM estimé ≥ 95 kg au Squat ou ≥ 150 kg à la Presse',
      checkUnlock: (ctx) => ctx.bestSquat1RM >= 95 || ctx.bestLegPress1RM >= 150
    },
    {
      id: 'relic-blade',
      name: 'Lame Runique de l’Éclipse',
      slot: 'Arme',
      rarity: 'Légendaire (Rang S)',
      icon: '🗡️',
      bonusXpPct: 10,
      bonusLabel: '+10 % XP Global & +8 FOR',
      conditionDesc: 'Atteindre un 1RM estimé ≥ 85 kg au Développé couché barre',
      checkUnlock: (ctx) => ctx.bestBench1RM >= 85
    },
    {
      id: 'relic-chronometer',
      name: 'Chronomètre de Faille Astrale',
      slot: 'Relique',
      rarity: 'Épique (Rang A)',
      icon: '⏱️',
      bonusXpPct: 8,
      bonusLabel: '+8 % XP & Cadence Parfaite',
      conditionDesc: 'Maintenir un tempo régulier sur au moins 25 séries',
      checkUnlock: (ctx) => ctx.totalSets >= 25
    },
    {
      id: 'relic-sun-elixir',
      name: 'Élixir d’Aura Solaire',
      slot: 'Consommable Mythique',
      rarity: 'Mythique (Rang SS)',
      icon: '🧪',
      bonusXpPct: 12,
      bonusLabel: '+12 % XP & Stamina Maximale',
      conditionDesc: 'Terminer au moins 6 séances et dépasser 30 000 kg soulevés',
      checkUnlock: (ctx) => ctx.totalWorkouts >= 6 && ctx.totalVolumeKg >= 30000
    },
    {
      id: 'relic-crown',
      name: 'Couronne du Souverain Absolu',
      slot: 'Tête',
      rarity: 'Mythique (Rang SS)',
      icon: '👑',
      bonusXpPct: 15,
      bonusLabel: '+15 % XP Global & Aura Souveraine',
      conditionDesc: 'Terminer au moins 8 séances et dépasser 45 000 kg de tonnage total',
      checkUnlock: (ctx) => ctx.totalWorkouts >= 8 && ctx.totalVolumeKg >= 45000
    }
  ];

  // Boss de Donjon avec Artworks Anime Shonen dédiés
  const DUNGEON_BOSSES = [
    {
      id: 'boss-cerberus',
      name: 'Cerbère des Portes de Fer',
      rank: 'Rang C',
      icon: '🐺',
      artFile: 'boss-cerberus.jpg',
      exerciseId: 'ex-bench-press',
      exerciseLabel: 'Développé couché barre (1RM est.)',
      target1RM: 85,
      rewardXp: 350,
      lore: 'Gardien infernal à trois têtes des portes de la forge. Requiert une poussée thoracique de 85 kg en 1RM estimé.'
    },
    {
      id: 'boss-golem',
      name: 'Golem d’Obsidienne Géant',
      rank: 'Rang B',
      icon: '🗿',
      artFile: 'boss-golem.jpg',
      exerciseId: 'ex-squat',
      exerciseLabel: 'Squat barre libre (1RM est.)',
      target1RM: 105,
      rewardXp: 500,
      lore: 'Colosse volcanique gravé de runes dorées. Seule une poussée de jambes supérieure à 105 kg (1RM est.) brise sa carapace.'
    },
    {
      id: 'boss-wyvern',
      name: 'Wyverne des Cieux',
      rank: 'Rang B',
      icon: '🐉',
      artFile: 'boss-wyvern.jpg',
      exerciseId: 'ex-barbell-row',
      exerciseLabel: 'Rowing barre buste penché (1RM est.)',
      target1RM: 80,
      rewardXp: 450,
      lore: 'Dragon des tempêtes foudroyant. Pour l’attirer au sol, votre force de tirage dorsal doit atteindre 80 kg en 1RM estimé.'
    },
    {
      id: 'boss-commander',
      name: 'Commandant de l’Éclipse Écarlate',
      aliasId: 'boss-igris',
      rank: 'Rang A',
      icon: '⚔️',
      artFile: 'boss-igris.jpg',
      exerciseId: 'ex-bench-press',
      exerciseLabel: 'Développé couché barre (1RM est.)',
      target1RM: 100,
      rewardXp: 800,
      lore: 'Chevalier commandant écarlate de la garde d’acier. Franchir la barre mythique des 100 kg en 1RM estimé au développé couché permet de le terrasser.'
    }
  ];

  // ============================================================================
  // ARBRE DE COMPÉTENCES PHYSIQUES : CALISTHÉNIE & MAÎTRISE CORPORELLE
  // ============================================================================
  const TALENT_PATHS = {
    PULL: {
      id: 'pull',
      name: 'Voie du Tirage (Traction & Levers)',
      subtitle: 'Chaîne Postérieure, Dos d’Élite & Muscle-Up',
      icon: '🦅',
      color: 'cyan',
      theme: 'Force Relative, Dorsaux & Contrôle Aérien'
    },
    PUSH: {
      id: 'push',
      name: 'Voie de la Poussée (Planche & Dips)',
      subtitle: 'Épaules Canons, Triceps de Fer & Équilibre',
      icon: '⚡',
      color: 'amber',
      theme: 'Stabilité Scapulaire, HSPU & Full Planche'
    },
    CORE: {
      id: 'core',
      name: 'Voie du Gainage (Drapeau & Dragon Flag)',
      subtitle: 'Sangle Abdominale Blindée & Tension Corporelle',
      icon: '🔥',
      color: 'emerald',
      theme: 'Ceinture d’Acier, L-Sit & Human Flag'
    }
  };

  const TALENT_NODES = [
    // --- 1. BRANCHE TIRAGE & CALISTHÉNIE SUSPENDUE ---
    {
      id: 'pull_1',
      path: 'pull',
      tier: 1,
      name: 'Tractions Strictes Propres',
      icon: '🧗',
      maxRank: 3,
      requires: null,
      costPerRank: 1,
      description: 'Quête : Valider 10 tractions strictes menton au-dessus de la barre. Effet : +5% Force (FOR) et +4% XP sur tout le Dos.',
      effects: { statBonus: { FOR: 5 }, muscleXpBonus: { Dos: 0.04 } }
    },
    {
      id: 'pull_2',
      path: 'pull',
      tier: 2,
      name: 'Muscle-Up Explosif',
      icon: '⚡',
      maxRank: 3,
      requires: 'pull_1',
      costPerRank: 1,
      description: 'Quête : Transition explosive au-dessus de la barre sans kipping. Effet : +6% Puissance (PWR) et +5% sur le calcul 1RM.',
      effects: { e1rmMultiplier: 0.05, statBonus: { PWR: 6 } }
    },
    {
      id: 'pull_3',
      path: 'pull',
      tier: 3,
      name: 'Front Lever Tendu (Légende)',
      icon: '🦅',
      maxRank: 1,
      requires: 'pull_2',
      costPerRank: 2,
      description: 'Quête Ultime : Maintenir le corps horizontal rigide 5 secondes. Effet : Débloque la posture 3D Aérienne et +15% de Tonnage effectif.',
      effects: { volumeMultiplier: 0.15, unlockBerserkMode: true }
    },

    // --- 2. BRANCHE POUSSÉE & FORCE SCAPULAIRE ---
    {
      id: 'push_1',
      path: 'push',
      tier: 1,
      name: 'Dips Profonds Lestés',
      icon: '🛡️',
      maxRank: 3,
      requires: null,
      costPerRank: 1,
      description: 'Quête : Valider 15 dips complets avec amplitude verrouillée. Effet : +5% Force de Poussée et -10s repos optimal.',
      effects: { statBonus: { FOR: 5 }, restTimeReductionSec: 10 }
    },
    {
      id: 'push_2',
      path: 'push',
      tier: 2,
      name: 'Handstand Push-Up (HSPU)',
      icon: '🤸',
      maxRank: 3,
      requires: 'push_1',
      costPerRank: 1,
      description: 'Quête : 5 pompes en équilibre sur les mains au mur. Effet : +5% Agilité (AGI) et +6% XP Épaules & Pectoraux.',
      effects: { statBonus: { AGI: 5 }, muscleXpBonus: { Épaules: 0.06, Pectoraux: 0.04 } }
    },
    {
      id: 'push_3',
      path: 'push',
      tier: 3,
      name: 'Full Planche (Maîtrise Suprême)',
      icon: '💥',
      maxRank: 1,
      requires: 'push_2',
      costPerRank: 2,
      description: 'Quête Ultime : Lévitation bras tendus parallèle au sol. Effet : Débloque l’Aura Dorée de Maîtrise et +20% d’Or par séance.',
      effects: { goldMultiplier: 0.20, fullMpRegenOnFinish: true }
    },

    // --- 3. BRANCHE CORE & PHYSIQUE D’ATHLÈTE ---
    {
      id: 'core_1',
      path: 'core',
      tier: 1,
      name: 'L-Sit Isométrique',
      icon: '📐',
      maxRank: 3,
      requires: null,
      costPerRank: 1,
      description: 'Quête : Tenue d’équerre 20 secondes aux barres parallèles. Effet : +5% Endurance (END) et +50% XP Séries Critiques.',
      effects: { critChance: 0.05, critMultiplier: 0.50 }
    },
    {
      id: 'core_2',
      path: 'core',
      tier: 2,
      name: 'Dragon Flag (Bruce Lee)',
      icon: '🐉',
      maxRank: 3,
      requires: 'core_1',
      costPerRank: 1,
      description: 'Quête : Descente lente et remontée sur les seules épaules. Effet : +4% Vitalité (VIT) et +5% XP Global.',
      effects: { statBonus: { VIT: 4 }, globalXpBonus: 0.05 }
    },
    {
      id: 'core_3',
      path: 'core',
      tier: 3,
      name: 'Human Flag (Drapeau Humain)',
      icon: '🚩',
      maxRank: 1,
      requires: 'core_2',
      costPerRank: 2,
      description: 'Quête Ultime : Suspension latérale horizontale à un poteau. Effet : Double la contribution aux Défis de Club et aura de tempête.',
      effects: { worldBossDamageMult: 2.0, darkManaCosmetic: true }
    }
  ];

  // ============================================================================
  // RAID DE BOSS MONDIAL ASYNCHRONE (WORLD BOSS)
  // ============================================================================
  const WORLD_BOSS_CONFIG = {
    id: 'world-boss-behemoth-1',
    name: 'Béhémoth de l’Abysse d’Acier',
    title: 'Monstre Calamité de Faille Rang SSS',
    maxHp: 1000000, // 1 000 000 PV collectifs
    icon: '👹',
    artFile: 'boss-cerberus.jpg',
    cycleDays: 7,
    rewards: [
      { thresholdPct: 25, rewardGold: 500, rewardXp: 1000, title: 'Briseur d’Armure' },
      { thresholdPct: 50, rewardGold: 1000, rewardXp: 2000, relicId: 'relic-titan-sigil' },
      { thresholdPct: 100, rewardGold: 2500, rewardXp: 5000, title: 'Pourfendeur de Monde' }
    ]
  };

  // CLUBS DE FITNESS & DOJO COMMUNAUTAIRES (DIMENSION VIRALE & LADDER DE GUILDE)
  const PRESET_CLUBS = [
    {
      id: 'club-pulse',
      name: 'Ordre du Pulse — Guerriers de Fer',
      motto: 'Dépasse tes limites à chaque série.',
      tier: 'Ligue Or',
      tierBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: '⚡',
      membersCount: 42,
      baseTonnage: 128400,
      bossDamageContribution: 245000
    },
    {
      id: 'club-titan',
      name: 'Titan Gym — Dojo Bastille',
      motto: 'La fonte ne ment jamais.',
      tier: 'Ligue Platine',
      tierBadge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      icon: '🥋',
      membersCount: 68,
      baseTonnage: 245000,
      bossDamageContribution: 420000
    },
    {
      id: 'club-shadow',
      name: 'Shadow Fitness — Rôdeurs de Nuit',
      motto: 'L’entraînement silencieux forge les champions.',
      tier: 'Ligue Diamant',
      tierBadge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: '🌑',
      membersCount: 54,
      baseTonnage: 198000,
      bossDamageContribution: 385000
    }
  ];

  // DÉFIS HEBDOMADAIRES DU CLUB POUR SES ADHÉRENTS
  const DEFAULT_CLUB_CHALLENGES = [
    {
      id: 'cc-1',
      title: 'Défi Pilonnage : 45 Tonnes Collectives',
      description: 'Cumul de tonnage de tous les adhérents du club cette semaine.',
      targetValue: 45000,
      unit: 'kg',
      currentValue: 37800,
      rewardXp: 1200,
      rewardGold: 450,
      icon: '🏋️',
      progressPct: 84
    },
    {
      id: 'cc-2',
      title: 'Défi Assiduité : 120 Séries de Guilde',
      description: 'Chaque série validée au tempo 3-1-1 fait progresser le compteur.',
      targetValue: 120,
      unit: 'séries',
      currentValue: 104,
      rewardXp: 800,
      rewardGold: 300,
      icon: '⏱️',
      progressPct: 86
    },
    {
      id: 'cc-3',
      title: 'Défi Force Pure : 8 Nouveaux Records 1RM',
      description: 'Records personnels battus par les membres du club.',
      targetValue: 8,
      unit: 'records',
      currentValue: 6,
      rewardXp: 1500,
      rewardGold: 600,
      icon: '💥',
      progressPct: 75
    }
  ];

  // FIL D'ACTUALITÉ EN DIRECT DES AMIS ET ADHÉRENTS
  const DEFAULT_ACTIVITY_FEED = [
    { id: 'act-1', friendName: 'Lyra_Valkyrie', avatar: '⚔️', action: 'a validé un nouveau record 1RM : Développé Couché 110 kg !', timeAgo: 'Il y a 12 min', tag: 'RECORD 🔥' },
    { id: 'act-2', friendName: 'Kaelen_Shield', avatar: '🛡️', action: 'a infligé 4 800 dégâts au Béhémoth de l’Abysse !', timeAgo: 'Il y a 34 min', tag: 'RAID 👹' },
    { id: 'act-3', friendName: 'Sora_Shadow', avatar: '🥷', action: 'a terminé sa séance « Poussée Lourde » (Volume : 12.4 t).', timeAgo: 'Il y a 1h', tag: 'SÉANCE ⚡' },
    { id: 'act-4', friendName: 'Ragnar_Iron', avatar: '🪓', action: 'a rejoint le club et débloqué le Rang B !', timeAgo: 'Il y a 2h', tag: 'PROMOTION 👑' }
  ];

  // État RPG par défaut dans le profil
  const DEFAULT_RPG_STATE = {
    heroClass: 'berserker',
    clubId: 'club-pulse',
    guildName: 'Ordre du Pulse — Guerriers de Fer',
    guildMotto: 'Dépasse tes limites à chaque série.',
    guildTier: 'Ligue Or',
    claimedClubChallengeIds: [],
    bonusXpEarned: 250,
    goldBonus: 320,
    goldSpent: 0,
    streakDaysOverride: 5,
    gauvaxPose: 'repos',
    equippedOutfit: 'tee_oversize_white',
    equippedAccessory: 'gold_earring',
    equippedBackground: 'neon_gym',
    talents: {
      spentPoints: 0,
      allocated: {}
    },
    worldBoss: {
      bossId: 'world-boss-behemoth-1',
      weekEpoch: Math.floor(Date.now() / (7 * 86400000)),
      userDealtDamage: 0,
      claimedRewards: []
    },
    unlockedWardrobeIds: [
      'tee_oversize_white',
      'tank_shadow',
      'gold_earring',
      'neon_gym',
      'sunset_rooftop'
    ],
    equippedRelics: ['relic-gauntlets', 'relic-belt', 'relic-pauldrons'],
    appearance: {
      visualMode: 'model-3d', // 'model-3d' | 'pixel-16bit' | 'illustrated' | 'custom-rig'
      visualMode3dReady: true,
      gender: 'male', // 'male' | 'female'
      morphology: 'athletic-vtaper', // 'athletic-vtaper' | 'colossal-titan' | 'agile-stalker'
      jawType: 'jaw-sharp', // 'jaw-sharp' | 'jaw-chiseled' | 'jaw-soft'
      outfit: 'outfit-dogi', // 'outfit-dogi' | 'outfit-techwear' | 'outfit-compression'
      skinTone: 'golden', // 'fair' | 'pale' | 'golden' | 'tan' | 'dark' | 'shadow'
      hairstyle: 'spiky-striker', // 'spiky-striker' | 'cyber-undercut' | 'stellar-flow' | 'valkyrie-braids' | 'tactical-crop'
      eyeColor: 'cyan-astral', // 'cyan-astral' | 'kinetic-gold' | 'crimson-berserk' | 'amethyst-void' | 'emerald-mana' | 'silver-instinct'
      expression: 'determined', // 'determined' | 'monarch' | 'berserk' | 'confident'
      warMarking: 'eye-scar', // 'none' | 'eye-scar' | 'mana-runes' | 'hunter-sigil' | 'energy-circuit'
      manaEyeSmoke: true, // Volutes de fumée de mana émanant des yeux
      auraStyle: 'gold',
      hairColor: 'obsidian',
      armorTint: 'dark-steel',
      powerEquipments: ['equip-belt', 'equip-wristwraps'],
      lightningSparks: true,
      battleTitle: 'Striker de la Fonte'
    },
    activeChallenges: [
      {
        id: 'chal-1',
        friendName: 'Kaelen (Paladin Niv. 9)',
        friendAvatar: '🛡️',
        title: 'Duel de Tonnage Hebdomadaire',
        type: 'volume7d',
        targetValue: 18000,
        friendValue: 14200,
        unit: 'kg',
        rewardXp: 300,
        daysLeft: 3
      },
      {
        id: 'chal-2',
        friendName: 'Lyra (Valkyrie Niv. 11)',
        friendAvatar: '⚡',
        title: 'Assaut de Séries (7 jours)',
        type: 'sets7d',
        targetValue: 40,
        friendValue: 34,
        unit: 'séries',
        rewardXp: 250,
        daysLeft: 4
      },
      {
        id: 'chal-3',
        friendName: 'Ragnar (Berserker Niv. 8)',
        friendAvatar: '🪓',
        title: 'Régularité des Chasseurs (7j)',
        type: 'workouts7d',
        targetValue: 3,
        friendValue: 2,
        unit: 'séances',
        rewardXp: 200,
        daysLeft: 2
      }
    ],
    claimedChallengeIds: [],
    guildMembers: [
      { id: 'gm-1', name: 'Lyra_Valkyrie', heroClass: 'Titan Colossal', rank: 'A', level: 15, weeklyVolume: 16400, avatar: '⚡' },
      { id: 'gm-2', name: 'Kaelen_Shield', heroClass: 'Paladin Égide', rank: 'B', level: 11, weeklyVolume: 14200, avatar: '🛡️' },
      { id: 'gm-3', name: 'Ragnar_Iron', heroClass: 'Athlète Force Pure', rank: 'C', level: 8, weeklyVolume: 9800, avatar: '🪓' },
      { id: 'gm-4', name: 'Sora_Shadow', heroClass: 'Athlète Nocturne', rank: 'C', level: 7, weeklyVolume: 7600, avatar: '🗡️' }
    ]
  };

  function ensureRpgState(state) {
    if (!state.rpg) {
      state.rpg = JSON.parse(JSON.stringify(DEFAULT_RPG_STATE));
    } else {
      state.rpg.heroClass = state.rpg.heroClass || DEFAULT_RPG_STATE.heroClass;
      state.rpg.clubId = state.rpg.clubId || DEFAULT_RPG_STATE.clubId;
      state.rpg.guildName = state.rpg.guildName || DEFAULT_RPG_STATE.guildName;
      state.rpg.guildMotto = state.rpg.guildMotto || DEFAULT_RPG_STATE.guildMotto;
      state.rpg.guildTier = state.rpg.guildTier || DEFAULT_RPG_STATE.guildTier;
      if (!Array.isArray(state.rpg.claimedClubChallengeIds)) {
        state.rpg.claimedClubChallengeIds = [];
      }
      state.rpg.bonusXpEarned = Number(state.rpg.bonusXpEarned) || 0;
      state.rpg.goldBonus = state.rpg.goldBonus !== undefined ? Number(state.rpg.goldBonus) : DEFAULT_RPG_STATE.goldBonus;
      state.rpg.goldSpent = Number(state.rpg.goldSpent) || 0;
      state.rpg.streakDaysOverride = Number(state.rpg.streakDaysOverride) || 5;
      state.rpg.gauvaxPose = state.rpg.gauvaxPose || 'repos';
      state.rpg.equippedOutfit = state.rpg.equippedOutfit || DEFAULT_RPG_STATE.equippedOutfit;
      state.rpg.equippedAccessory = state.rpg.equippedAccessory || DEFAULT_RPG_STATE.equippedAccessory;
      state.rpg.equippedBackground = state.rpg.equippedBackground || DEFAULT_RPG_STATE.equippedBackground;
      if (!Array.isArray(state.rpg.unlockedWardrobeIds)) {
        state.rpg.unlockedWardrobeIds = [...DEFAULT_RPG_STATE.unlockedWardrobeIds];
      }
      if (!state.rpg.appearance) {
        state.rpg.appearance = JSON.parse(JSON.stringify(DEFAULT_RPG_STATE.appearance));
      } else {
        state.rpg.appearance = { ...DEFAULT_RPG_STATE.appearance, ...state.rpg.appearance };
        if (!state.rpg.appearance.visualMode3dReady) {
          state.rpg.appearance.visualMode = 'model-3d';
          state.rpg.appearance.visualMode3dReady = true;
        }
      }
      if (!Array.isArray(state.rpg.equippedRelics)) {
        state.rpg.equippedRelics = [...DEFAULT_RPG_STATE.equippedRelics];
      }
      if (!Array.isArray(state.rpg.activeChallenges)) {
        state.rpg.activeChallenges = JSON.parse(JSON.stringify(DEFAULT_RPG_STATE.activeChallenges));
      }
      if (!Array.isArray(state.rpg.claimedChallengeIds)) {
        state.rpg.claimedChallengeIds = [];
      }
      if (!Array.isArray(state.rpg.guildMembers)) {
        state.rpg.guildMembers = JSON.parse(JSON.stringify(DEFAULT_RPG_STATE.guildMembers));
      }
    }
    return state.rpg;
  }

  function computeWorkoutXP(workout, heroClassObj, relicBonusPct) {
    const stats = ns.Storage.computeWorkoutStats(workout);
    const baseCompletionXp = 120;
    const setsXp = stats.completedSets * 18;
    const volumeXp = Math.round(stats.totalVolume / 45);
    const subtotal = baseCompletionXp + setsXp + volumeXp;
    const multiplier = 1 + (Number(relicBonusPct) || 0) / 100 + (heroClassObj ? 0.08 : 0);
    return Math.round(subtotal * multiplier);
  }

  function getHeroProfile() {
    const state = ns.Storage.getState();
    const rpg = ensureRpgState(state);
    const { history, profile } = state;

    const classObj = HERO_CLASSES.find((c) => c.id === rpg.heroClass) || HERO_CLASSES[3];
    const auraObj = AURA_STYLES.find((a) => a.id === rpg.appearance.auraStyle) || AURA_STYLES[0];
    const hairObj = HAIR_COLORS.find((h) => h.id === rpg.appearance.hairColor) || HAIR_COLORS[0];
    const armorObj = ARMOR_TINTS.find((t) => t.id === rpg.appearance.armorTint) || ARMOR_TINTS[0];
    const genderObj = GENDERS.find((g) => g.id === rpg.appearance.gender) || GENDERS[0];
    const morphologyObj = MORPHOLOGIES.find((m) => m.id === rpg.appearance.morphology) || MORPHOLOGIES[0];
    const jawTypeObj = JAW_TYPES.find((j) => j.id === rpg.appearance.jawType) || JAW_TYPES[0];
    const outfitObj = OUTFITS.find((o) => o.id === rpg.appearance.outfit) || OUTFITS[0];
    const skinObj = SKIN_TONES.find((s) => s.id === rpg.appearance.skinTone) || SKIN_TONES[2];
    const eyeObj = EYE_COLORS.find((e) => e.id === rpg.appearance.eyeColor) || EYE_COLORS[0];

    // Mappage de rtrocompatibilit des coiffures
    let hairId = rpg.appearance.hairstyle;
    if (hairId === 'spiky-dbz') hairId = 'spiky-striker';
    if (hairId === 'solo-undercut') hairId = 'cyber-undercut';
    if (hairId === 'long-warrior') hairId = 'stellar-flow';
    if (hairId === 'braids-valkyrie') hairId = 'valkyrie-braids';
    if (hairId === 'short-crop') hairId = 'tactical-crop';
    const hairStyleObj = HAIRSTYLES.find((hs) => hs.id === hairId) || HAIRSTYLES[0];

    const expressionObj = FACE_EXPRESSIONS.find((ex) => ex.id === rpg.appearance.expression) || FACE_EXPRESSIONS[0];
    let markingId = rpg.appearance.warMarking;
    if (markingId === 'sukuna-stripes') markingId = 'hunter-sigil';
    const warMarkingObj = WAR_MARKINGS.find((m) => m.id === markingId) || WAR_MARKINGS[1];
    const manaEyeSmoke = rpg.appearance.manaEyeSmoke !== false;
    const powerEquipments = rpg.appearance.powerEquipments || ['equip-belt', 'equip-wristwraps'];

    let totalVolumeKg = 0;
    let totalSets = 0;
    let totalReps = 0;
    const muscleSets = {
      Pectoraux: 0,
      Dos: 0,
      Jambes: 0,
      Épaules: 0,
      Bras: 0,
      Abdominaux: 0
    };

    const now = Date.now();
    const ms7d = 7 * 24 * 3600 * 1000;
    let volume7d = 0;
    let sets7d = 0;
    let workouts7d = 0;

    history.forEach((w) => {
      const st = ns.Storage.computeWorkoutStats(w);
      totalVolumeKg += st.totalVolume;
      totalSets += st.completedSets;
      totalReps += st.totalReps;

      const isRecent = now - new Date(w.date).getTime() <= ms7d;
      if (isRecent) {
        workouts7d += 1;
        volume7d += st.totalVolume;
        sets7d += st.completedSets;
      }

      (w.exercises || []).forEach((eb) => {
        const ex = ns.Storage.getExerciseById(eb.exerciseId);
        const validCount = (eb.sets || []).filter((s) => s.completed !== false).length;
        if (muscleSets[ex.muscleGroup] !== undefined) {
          muscleSets[ex.muscleGroup] += validCount;
        }
      });
    });

    const benchTimeline = ns.Storage.getExerciseTimeline('ex-bench-press');
    const squatTimeline = ns.Storage.getExerciseTimeline('ex-squat');
    const rowTimeline = ns.Storage.getExerciseTimeline('ex-barbell-row');
    const legPressTimeline = ns.Storage.getExerciseTimeline('ex-leg-press');

    const bestBench1RM = benchTimeline.length ? Math.max(...benchTimeline.map((t) => t.best1RM)) : 0;
    const bestSquat1RM = squatTimeline.length ? Math.max(...squatTimeline.map((t) => t.best1RM)) : 0;
    const bestRow1RM = rowTimeline.length ? Math.max(...rowTimeline.map((t) => t.best1RM)) : 0;
    const bestLegPress1RM = legPressTimeline.length ? Math.max(...legPressTimeline.map((t) => t.best1RM)) : 0;

    const unlockContext = {
      totalWorkouts: history.length,
      totalVolumeKg,
      totalSets,
      bestBench1RM,
      bestSquat1RM,
      bestRow1RM,
      bestLegPress1RM
    };

    const relicsStatus = RELICS.map((r) => {
      const unlocked = r.checkUnlock(unlockContext);
      const equipped = unlocked && rpg.equippedRelics.includes(r.id);
      return { ...r, unlocked, equipped };
    });

    const activeRelicBonusPct = relicsStatus
      .filter((r) => r.equipped)
      .reduce((acc, r) => acc + r.bonusXpPct, 0);

    const bossesStatus = DUNGEON_BOSSES.map((b) => {
      const tl = ns.Storage.getExerciseTimeline(b.exerciseId);
      const currentBest = tl.length ? Math.max(...tl.map((t) => t.best1RM)) : 0;
      const defeated = currentBest >= b.target1RM;
      const pct = Math.min(100, Math.round((currentBest / b.target1RM) * 100));
      return {
        ...b,
        artUrl: resolveAssetUrl(b.artFile),
        currentBest,
        defeated,
        pct
      };
    });

    const bossesXp = bossesStatus.filter((b) => b.defeated).reduce((acc, b) => acc + b.rewardXp, 0);

    const workoutsXp = history.reduce((acc, w) => acc + computeWorkoutXP(w, classObj, activeRelicBonusPct), 0);
    const totalXp = workoutsXp + bossesXp + (Number(rpg.bonusXpEarned) || 0);

    let level = 1;
    let xpRemaining = totalXp;
    let xpForNextLevel = 450;

    while (xpRemaining >= xpForNextLevel) {
      xpRemaining -= xpForNextLevel;
      level += 1;
      xpForNextLevel = Math.round(450 * Math.pow(level, 1.08));
    }

    const levelProgressPct = Math.min(100, Math.round((xpRemaining / xpForNextLevel) * 100));

    let currentRankObj = HUNTER_RANKS[0];
    for (const r of HUNTER_RANKS) {
      if (level >= r.minLevel) currentRankObj = r;
    }

    const pushSets = muscleSets.Pectoraux + muscleSets.Épaules + muscleSets.Bras;
    const pullSets = muscleSets.Dos;
    const legSets = muscleSets.Jambes;
    const coreSets = muscleSets.Abdominaux;

    const attributes = [
      {
        code: 'FOR',
        name: 'Force d’Impact (Haut)',
        desc: 'Pectoraux, Épaules & Triceps',
        value: Math.min(99, 18 + pushSets * 2 + Math.round(bestBench1RM / 6)),
        color: 'bg-rose-500',
        textColor: 'text-rose-300'
      },
      {
        code: 'VIT',
        name: 'Armure & Posture (Dos)',
        desc: 'Tirages, Grand Dorsal & Coiffe',
        value: Math.min(99, 18 + pullSets * 3 + Math.round(bestRow1RM / 6)),
        color: 'bg-blue-500',
        textColor: 'text-blue-300'
      },
      {
        code: 'PUI',
        name: 'Puissance Tellurique (Bas)',
        desc: 'Squat, Presse, Ischios & Fessiers',
        value: Math.min(99, 18 + legSets * 4 + Math.round(bestSquat1RM / 5)),
        color: 'bg-violet-500',
        textColor: 'text-violet-300'
      },
      {
        code: 'END',
        name: 'Endurance de Combat',
        desc: 'Tonnage cumulé & volume de séries',
        value: Math.min(99, 20 + Math.round(totalSets * 0.9) + Math.round(totalVolumeKg / 2500)),
        color: 'bg-emerald-500',
        textColor: 'text-emerald-300'
      },
      {
        code: 'AGI',
        name: 'Agilité & Constance',
        desc: 'Gainage, régularité & équilibre',
        value: Math.min(99, 22 + history.length * 5 + coreSets * 4),
        color: 'bg-amber-500',
        textColor: 'text-amber-300'
      },
      {
        code: 'INT',
        name: 'Savoir Tactique (Isekai)',
        desc: 'Tempo, périodisation & maîtrise technique',
        value: Math.min(99, 10 + (level - 1) * 5 + history.length * 2),
        color: 'bg-cyan-500',
        textColor: 'text-cyan-300'
      }
    ];

    const endValue = attributes.find((a) => a.code === 'END').value;
    const intValue = attributes.find((a) => a.code === 'INT').value;
    const hpMax = 100 + endValue * 10;
    const mpMax = 50 + intValue * 8;

    const goldEarned = (Number(rpg.goldBonus) || 320) + history.length * 50 + totalSets * 5;
    const gold = Math.max(0, goldEarned - (Number(rpg.goldSpent) || 0));
    const streakDays = Number(rpg.streakDaysOverride) || Math.max(1, Math.min(30, workouts7d || history.length));

    const wardrobeStatus = WARDROBE_CATALOG.map((item) => {
      const unlocked = (rpg.unlockedWardrobeIds || []).includes(item.id) || item.priceGold === 0;
      const equipped =
        (item.slot === 'outfit' && rpg.equippedOutfit === item.id) ||
        (item.slot === 'accessory' && rpg.equippedAccessory === item.id) ||
        (item.slot === 'background' && rpg.equippedBackground === item.id);
      return {
        ...item,
        unlocked,
        equipped,
        canAfford: gold >= item.priceGold,
        levelMet: level >= item.minLevel
      };
    });

    const combatPower =
      level * 150 +
      attributes.reduce((acc, a) => acc + a.value * 12, 0) +
      relicsStatus.filter((r) => r.equipped).length * 180 +
      wardrobeStatus.filter((w) => w.unlocked).length * 25;

    const weeklyQuests = [
      {
        id: 'q-weekly-sessions',
        title: 'Quête Quotidienne du Système : Discipline',
        desc: `Réaliser ${profile.weeklyTarget || 4} séances sur les 7 derniers jours`,
        current: workouts7d,
        target: profile.weeklyTarget || 4,
        unit: 'séances',
        rewardXp: 250,
        completed: workouts7d >= (profile.weeklyTarget || 4)
      },
      {
        id: 'q-weekly-volume',
        title: 'Épreuve des Titans : Tonnage de Guerre',
        desc: 'Soulever au moins 12 000 kg (12 t) sur les 7 derniers jours',
        current: volume7d,
        target: 12000,
        unit: 'kg',
        rewardXp: 300,
        completed: volume7d >= 12000
      },
      {
        id: 'q-pull-balance',
        title: 'Serment du Paladin : Renfort Dorsal',
        desc: 'Cumuler au moins 15 séries de Dos au total pour protéger les épaules',
        current: pullSets,
        target: 15,
        unit: 'séries',
        rewardXp: 200,
        completed: pullSets >= 15
      }
    ];

    const evaluatedChallenges = rpg.activeChallenges.map((ch) => {
      let userVal = 0;
      if (ch.type === 'volume7d') userVal = volume7d;
      else if (ch.type === 'sets7d') userVal = sets7d;
      else if (ch.type === 'workouts7d') userVal = workouts7d;
      else userVal = totalVolumeKg;

      const userPct = Math.min(100, Math.round((userVal / ch.targetValue) * 100));
      const friendPct = Math.min(100, Math.round((ch.friendValue / ch.targetValue) * 100));
      const isWinning = userVal >= ch.friendValue;
      const isCompleted = userVal >= ch.targetValue;
      const isClaimed = rpg.claimedChallengeIds.includes(ch.id);

      return {
        ...ch,
        userVal,
        userPct,
        friendPct,
        isWinning,
        isCompleted,
        isClaimed
      };
    });

    const leaderboard = [
      ...rpg.guildMembers,
      {
        id: 'gm-user',
        name: `${profile.name} (Vous)`,
        heroClass: classObj.name,
        rank: currentRankObj.rank,
        level,
        weeklyVolume: volume7d,
        avatar: classObj.icon,
        isUser: true
      }
    ].sort((a, b) => b.weeklyVolume - a.weeklyVolume);

    return {
      heroName: profile.name,
      classObj: {
        ...classObj,
        artUrl: resolveAssetUrl(classObj.artFile)
      },
      arenaBgUrl: resolveAssetUrl('arena-bg.jpg'),
      appearance: rpg.appearance,
      auraObj,
      hairObj,
      armorObj,
      genderObj,
      morphologyObj,
      jawTypeObj,
      outfitObj,
      powerEquipments,
      skinObj,
      eyeObj,
      hairStyleObj,
      expressionObj,
      warMarkingObj,
      manaEyeSmoke,
      rankObj: currentRankObj,
      level,
      totalXp,
      xpInCurrentLevel: xpRemaining,
      xpForNextLevel,
      levelProgressPct,
      combatPower,
      attributes,
      relicsStatus,
      activeRelicBonusPct,
      bossesStatus,
      weeklyQuests,
      evaluatedChallenges,
      clubId: rpg.clubId || 'club-pulse',
      guildTier: rpg.guildTier || 'Ligue Or',
      guildName: rpg.guildName,
      guildMotto: rpg.guildMotto,
      presetClubs: PRESET_CLUBS,
      clubChallenges: DEFAULT_CLUB_CHALLENGES.map((cc) => ({
        ...cc,
        isClaimed: (rpg.claimedClubChallengeIds || []).includes(cc.id)
      })),
      activityFeed: DEFAULT_ACTIVITY_FEED,
      leaderboard,
      gold,
      goldEarned,
      streakDays,
      hpMax,
      mpMax,
      gauvaxPose: rpg.gauvaxPose || 'repos',
      equippedOutfit: rpg.equippedOutfit || 'tee_oversize_white',
      equippedAccessory: rpg.equippedAccessory || 'gold_earring',
      equippedBackground: rpg.equippedBackground || 'neon_gym',
      wardrobeStatus,
      stats7d: {
        workouts7d,
        volume7d,
        sets7d
      }
    };
  }

  // Moteur de Sprite Pixel Art 16-Bit GAUVAX (Grille 64x64 crispEdges) — 5 États + Tenues + Accessoires + Décors
  function renderGauvaxPixelAvatar16Bit(hero, opts) {
    const poseId = (opts && opts.pose) || hero.gauvaxPose || 'repos';
    const stateObj = GAUVAX_STATES.find((s) => s.id === poseId) || GAUVAX_STATES[0];
    const outfitId = hero.equippedOutfit || 'tee_oversize_white';
    const accId = hero.equippedAccessory || 'gold_earring';
    const bgId = hero.equippedBackground || 'neon_gym';
    const showControls = !(opts && opts.compact);

    // Palette 16-Bit selon le décor équipé
    let bgSvg = '';
    if (bgId === 'sunset_rooftop') {
      bgSvg = `
        <rect width="64" height="64" fill="#1E1B4B" />
        <rect y="0" width="64" height="14" fill="#311042" />
        <rect y="14" width="64" height="14" fill="#7C2D12" />
        <rect y="28" width="64" height="14" fill="#EA580C" />
        <rect y="42" width="64" height="10" fill="#F59E0B" />
        <!-- Soleil Pixel 16-bit -->
        <rect x="24" y="18" width="16" height="12" fill="#FEF08A" opacity="0.85" />
        <rect x="22" y="20" width="20" height="8" fill="#FDE047" opacity="0.85" />
        <!-- Immeubles Silhouette -->
        <rect x="2" y="30" width="10" height="22" fill="#0F172A" />
        <rect x="14" y="36" width="8" height="16" fill="#1E293B" />
        <rect x="44" y="34" width="9" height="18" fill="#1E293B" />
        <rect x="54" y="28" width="8" height="24" fill="#0F172A" />
        <!-- Sol Rooftop -->
        <rect y="50" width="64" height="14" fill="#090D16" />
        <rect y="50" width="64" height="2" fill="#F59E0B" />
      `;
    } else if (bgId === 'dojo_minimal') {
      bgSvg = `
        <rect width="64" height="64" fill="#18181B" />
        <rect x="4" y="6" width="56" height="44" fill="#27272A" />
        <!-- Poutres Acier Brutalistes -->
        <rect x="10" y="6" width="3" height="44" fill="#3F3F46" />
        <rect x="51" y="6" width="3" height="44" fill="#3F3F46" />
        <rect x="4" y="24" width="56" height="2" fill="#52525B" />
        <!-- Bannière Dojo -->
        <rect x="28" y="8" width="8" height="14" fill="#090D16" />
        <rect x="30" y="10" width="4" height="2" fill="#F43F5E" />
        <rect x="30" y="14" width="4" height="2" fill="#F43F5E" />
        <!-- Tatami / Sol Métal -->
        <rect y="50" width="64" height="14" fill="#09090B" />
        <rect y="50" width="64" height="2" fill="#71717A" />
      `;
    } else {
      // neon_gym (Par défaut : Salle Néon Nocturne)
      bgSvg = `
        <rect width="64" height="64" fill="#060913" />
        <!-- Grille murale cyber -->
        <rect x="4" y="6" width="56" height="44" fill="#0B1120" />
        <!-- Tubes Néon Cyan & Ambre -->
        <rect x="6" y="10" width="2" height="36" fill="#06B6D4" />
        <rect x="56" y="10" width="2" height="36" fill="#F59E0B" />
        <rect x="12" y="8" width="40" height="2" fill="#38BDF8" opacity="0.7" />
        <!-- Rack de Squat en arrière-plan -->
        <rect x="16" y="16" width="2" height="34" fill="#334155" />
        <rect x="46" y="16" width="2" height="34" fill="#334155" />
        <rect x="12" y="26" width="40" height="2" fill="#64748B" />
        <rect x="10" y="23" width="3" height="8" fill="#E11D48" />
        <rect x="51" y="23" width="3" height="8" fill="#E11D48" />
        <!-- Sol Gym Caoutchouc -->
        <rect y="50" width="64" height="14" fill="#0F172A" />
        <rect y="50" width="64" height="2" fill="#06B6D4" opacity="0.6" />
      `;
    }

    // Aura & Effets selon les 5 états (repos, effort, victoire, fatigue, level_up)
    let fxBehind = '';
    let fxFront = '';
    if (poseId === 'effort') {
      fxBehind = `
        <rect x="16" y="12" width="32" height="40" fill="#F43F5E" opacity="0.22" />
        <rect x="18" y="8" width="28" height="44" fill="#FB923C" opacity="0.18" />
      `;
      fxFront = `
        <!-- Gouttes de sueur 16-bit & Haltères d'effort -->
        <rect x="19" y="20" width="2" height="3" fill="#38BDF8" />
        <rect x="44" y="22" width="2" height="3" fill="#38BDF8" />
        <rect x="12" y="34" width="40" height="2" fill="#94A3B8" />
        <rect x="9" y="30" width="4" height="10" fill="#E11D48" />
        <rect x="51" y="30" width="4" height="10" fill="#E11D48" />
      `;
    } else if (poseId === 'victoire') {
      fxBehind = `
        <rect x="16" y="10" width="32" height="42" fill="#FACC15" opacity="0.18" />
      `;
      fxFront = `
        <!-- Étoiles Dorées 16-Bit -->
        <rect x="10" y="14" width="4" height="4" fill="#FDE047" />
        <rect x="11" y="12" width="2" height="8" fill="#FEF08A" />
        <rect x="50" y="14" width="4" height="4" fill="#FDE047" />
        <rect x="51" y="12" width="2" height="8" fill="#FEF08A" />
        <rect x="14" y="28" width="3" height="3" fill="#F59E0B" />
        <rect x="48" y="26" width="3" height="3" fill="#F59E0B" />
      `;
    } else if (poseId === 'fatigue') {
      fxBehind = `
        <rect x="18" y="16" width="28" height="36" fill="#38BDF8" opacity="0.16" />
      `;
      fxFront = `
        <!-- Vapeur / Souffle de récupération bleuté -->
        <rect x="20" y="22" width="2" height="4" fill="#60A5FA" />
        <rect x="42" y="24" width="2" height="4" fill="#60A5FA" />
        <rect x="35" y="23" width="4" height="2" fill="#E0F2FE" opacity="0.8" />
      `;
    } else if (poseId === 'level_up') {
      fxBehind = `
        <!-- Piliers d'Ascension Cyan & Or -->
        <rect x="14" y="0" width="4" height="52" fill="#06B6D4" opacity="0.45" />
        <rect x="46" y="0" width="4" height="52" fill="#FACC15" opacity="0.45" />
        <rect x="20" y="4" width="24" height="48" fill="#38BDF8" opacity="0.25" />
      `;
      fxFront = `
        <!-- Éclairs Level Up 16-Bit -->
        <rect x="12" y="18" width="3" height="6" fill="#FEF08A" />
        <rect x="15" y="24" width="3" height="6" fill="#38BDF8" />
        <rect x="49" y="16" width="3" height="6" fill="#FEF08A" />
        <rect x="46" y="22" width="3" height="6" fill="#38BDF8" />
      `;
    }

    // Couleurs de la tenue équipée (T-shirt Oversize Blanc, Débardeur Shadow, Hoodie Ambre, Compression Pro)
    let torsoSvg = '';
    const armsRaised = poseId === 'victoire' || poseId === 'level_up';
    const skinMain = '#FDBA74';
    const skinShade = '#EA9A62';
    const gloveColor = accId === 'gym_gloves' ? '#1E293B' : skinMain;

    if (outfitId === 'tank_shadow') {
      torsoSvg = `
        <!-- Débardeur Shadow Gym Noir & Épaules nues musclées -->
        <rect x="22" y="26" width="20" height="14" fill="#0F172A" />
        <rect x="22" y="26" width="4" height="6" fill="${skinMain}" />
        <rect x="38" y="26" width="4" height="6" fill="${skinMain}" />
        <rect x="27" y="29" width="10" height="2" fill="#F43F5E" />
      `;
    } else if (outfitId === 'hoodie_amber') {
      torsoSvg = `
        <!-- Hoodie Streetwear Ambre & Noir -->
        <rect x="20" y="25" width="24" height="15" fill="#F59E0B" />
        <rect x="24" y="26" width="16" height="14" fill="#D97706" />
        <rect x="28" y="26" width="2" height="6" fill="#0F172A" />
        <rect x="34" y="26" width="2" height="6" fill="#0F172A" />
        <rect x="25" y="34" width="14" height="5" fill="#1E293B" />
      `;
    } else if (outfitId === 'compression_pro') {
      torsoSvg = `
        <!-- Tactical Pro Compression Cyber -->
        <rect x="21" y="26" width="22" height="14" fill="#0F172A" />
        <rect x="23" y="27" width="18" height="12" fill="#1E293B" />
        <rect x="31" y="26" width="2" height="14" fill="#06B6D4" />
        <rect x="24" y="31" width="16" height="1" fill="#06B6D4" />
      `;
    } else {
      // tee_oversize_white (Par défaut : T-shirt Blanc Oversize GAUVAX)
      torsoSvg = `
        <rect x="20" y="26" width="24" height="14" fill="#F8FAFC" />
        <rect x="22" y="28" width="20" height="12" fill="#E2E8F0" />
        <rect x="28" y="26" width="8" height="2" fill="#CBD5E1" />
        <rect x="27" y="30" width="10" height="2" fill="#0F172A" />
      `;
    }

    // Bras selon l'état (levés en victoire/level_up, contractés sinon)
    const armsSvg = armsRaised
      ? `
        <rect x="16" y="18" width="4" height="10" fill="${skinMain}" />
        <rect x="16" y="15" width="4" height="3" fill="${gloveColor}" />
        <rect x="44" y="18" width="4" height="10" fill="${skinMain}" />
        <rect x="44" y="15" width="4" height="3" fill="${gloveColor}" />
      `
      : `
        <rect x="16" y="27" width="4" height="10" fill="${skinMain}" />
        <rect x="16" y="36" width="4" height="4" fill="${gloveColor}" />
        <rect x="44" y="27" width="4" height="10" fill="${skinMain}" />
        <rect x="44" y="36" width="4" height="4" fill="${gloveColor}" />
      `;

    // Yeux & Bouche selon l'état
    const eyeColor = poseId === 'level_up' ? '#06B6D4' : '#0F172A';
    const mouthSvg =
      poseId === 'victoire' || poseId === 'level_up'
        ? `<rect x="29" y="22" width="6" height="2" fill="#FFFFFF" />`
        : poseId === 'effort'
        ? `<rect x="28" y="22" width="8" height="2" fill="#E11D48" />`
        : `<rect x="30" y="22" width="4" height="1" fill="#7C2D12" />`;

    // Accessoires Tête (Anneau d'Or à l'oreille gauche ou Casque Studio Bass)
    const headAccessorySvg =
      accId === 'beats_headphones'
        ? `
          <rect x="22" y="11" width="20" height="2" fill="#E11D48" />
          <rect x="21" y="16" width="3" height="6" fill="#E11D48" />
          <rect x="40" y="16" width="3" height="6" fill="#E11D48" />
        `
        : `
          <!-- Anneau d'Or Signature à l'oreille gauche -->
          <rect x="22" y="20" width="2" height="2" fill="#FACC15" />
        `;

    return `
      <div class="gauvax-pixel-stage relative w-full max-w-[235px] mx-auto select-none">
        <!-- Bulle de dialogue 16-bit -->
        <div class="mb-1.5 px-2.5 py-1 rounded-xl bg-slate-950/95 border border-amber-500/40 text-center shadow-md">
          <div class="text-[9px] font-black uppercase tracking-wider text-amber-300">${stateObj.icon} GAUVAX 16-BIT • ${stateObj.label.toUpperCase()}</div>
          <div class="text-[10px] text-slate-200 font-semibold leading-tight truncate" title="${stateObj.quote}">« ${stateObj.quote} »</div>
        </div>

        <!-- Cadre Arcade 16-Bit Pixel Art -->
        <div class="relative rounded-2xl overflow-hidden border-2 border-amber-400/70 bg-[#060913] shadow-[0_0_25px_rgba(245,158,11,0.28)]">
          <svg viewBox="0 0 64 64" shape-rendering="crispEdges" style="image-rendering: pixelated;" class="w-full h-[238px] block mx-auto">
            ${bgSvg}
            ${fxBehind}

            <!-- Ombre au sol 16-bit -->
            <rect x="20" y="53" width="24" height="3" fill="#020617" opacity="0.75" />

            <!-- PANTALON CARGO NOIR (Signature GAUVAX) -->
            <rect x="23" y="40" width="8" height="11" fill="#0F172A" />
            <rect x="33" y="40" width="8" height="11" fill="#0F172A" />
            <!-- Poches latérales Cargo -->
            <rect x="21" y="43" width="3" height="5" fill="#1E293B" />
            <rect x="40" y="43" width="3" height="5" fill="#1E293B" />
            <rect x="23" y="39" width="18" height="2" fill="#334155" />

            <!-- SNEAKERS BLANCHES 16-BIT -->
            <rect x="21" y="51" width="10" height="4" fill="#F8FAFC" />
            <rect x="21" y="54" width="10" height="1" fill="#F59E0B" />
            <rect x="33" y="51" width="10" height="4" fill="#F8FAFC" />
            <rect x="33" y="54" width="10" height="1" fill="#F59E0B" />

            <!-- TORSE & TENUE ÉQUIPÉE -->
            ${torsoSvg}
            ${armsSvg}

            <!-- COU & VISAGE PIXEL ART -->
            <rect x="29" y="24" width="6" height="3" fill="${skinShade}" />
            <rect x="24" y="14" width="16" height="11" fill="${skinMain}" />
            <!-- Yeux -->
            <rect x="27" y="18" width="2" height="2" fill="${eyeColor}" />
            <rect x="35" y="18" width="2" height="2" fill="${eyeColor}" />
            <!-- Sourcils -->
            <rect x="26" y="16" width="4" height="1" fill="#CA8A04" />
            <rect x="34" y="16" width="4" height="1" fill="#CA8A04" />
            ${mouthSvg}

            <!-- CHEVEUX DÉCOLORÉS BLONDS 16-BIT (Signature GAUVAX) -->
            <rect x="23" y="9" width="18" height="5" fill="#FACC15" />
            <rect x="25" y="7" width="14" height="3" fill="#FEF08A" />
            <rect x="22" y="11" width="3" height="4" fill="#EAB308" />
            <rect x="39" y="11" width="3" height="4" fill="#EAB308" />
            <rect x="27" y="6" width="3" height="2" fill="#FEF08A" />
            <rect x="34" y="6" width="3" height="2" fill="#FEF08A" />

            ${headAccessorySvg}
            ${fxFront}
          </svg>

          <!-- Sélecteur rapide des 5 états d'animation en bas du cadre -->
          ${
            showControls
              ? `
            <div class="bg-slate-950/95 border-t border-slate-800 px-1.5 py-1.5 flex items-center justify-between gap-1">
              ${GAUVAX_STATES.map(
                (st) => `
                <button
                  onclick="window.IronPulse.App.setGauvaxPose('${st.id}')"
                  title="État : ${st.label}"
                  class="flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition border ${
                    poseId === st.id
                      ? 'bg-amber-500/25 text-amber-300 border-amber-400/70'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }"
                >
                  ${st.icon} ${st.label.slice(0, 5)}
                </button>
              `
              ).join('')}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  // Rendu visuel du Héros : Avatar Shōnen Animé Uniformisé (Charte ALTR Plein Pied)
  function renderHeroAvatarSVG(hero, opts) {
    const compact = !!(opts && opts.compact);
    const height = compact ? '180px' : '260px';
    const heroName = (hero && hero.heroName ? hero.heroName : 'MEHDI').toUpperCase();
    const classIcon = (hero && hero.classObj && hero.classObj.icon) ? hero.classObj.icon : '⚔️';
    const className = (hero && hero.classObj && hero.classObj.name) ? hero.classObj.name : 'Athlète Force Pure';

    return `
      <div class="shonen-portrait-stage relative w-full mx-auto select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#090E1A] to-[#04070D] border border-cyan-500/30 p-2 shadow-xl">
        <!-- Anneau d'Aura de Ki Cyan & Or animée -->
        <div class="shonen-aura-ring-cyan"></div>

        <!-- Scène de l'Athlète Animé en Respiration Martiale -->
        <div class="relative flex flex-col items-center justify-center w-full" style="height: ${height};">
          <!-- Onde de choc au sol -->
          <div class="absolute bottom-1 w-32 h-4 rounded-full bg-cyan-400/20 blur-sm ki-shockwave-pulse pointer-events-none"></div>

          <!-- Personnage Shonen Cel-Shading Plein Pied Animé -->
          <img
            src="./src/assets/hero-anime-original.svg"
            alt="${heroName}"
            style="max-height: 100%; width: auto;"
            class="relative z-10 w-auto h-full object-contain drop-shadow-[0_10px_22px_rgba(6,182,212,0.45)] altr-animated-hero"
          />

          <!-- Badge Classe & Posture Martiale -->
          <div class="absolute bottom-1.5 left-2 right-2 flex items-center justify-between px-2 py-0.5 rounded-lg bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md z-20">
            <span class="text-[9px] font-black text-cyan-300 flex items-center gap-1 font-mono">
              <span>${classIcon}</span><span>${className}</span>
            </span>
            <span class="text-[8.5px] font-extrabold text-amber-400 font-mono tracking-wider">
              TEMPO 3-1-1
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderLegacyRig2D(hero) {
    const app = hero.appearance || {};
    const auraId = app.auraStyle || app.auraColor || 'gold';
    const aura = AURA_STYLES.find((a) => a.id === auraId) || hero.auraObj || AURA_STYLES[0];
    const hair = hero.hairObj || HAIR_COLORS[0];
    const armor = hero.armorObj || ARMOR_TINTS[0];
    const skin = hero.skinObj || SKIN_TONES[2];
    const eye = hero.eyeObj || EYE_COLORS[0];
    const hairStyle = hero.hairStyleObj || HAIRSTYLES[0];
    const isFemale = (hero.genderObj?.id || app.gender) === 'female';
    const sparks = app.lightningSparks !== false && app.sparksEnabled !== false;
    const titleText = app.battleTitle || app.customTitle || 'Guerrier Z de la Fonte';
    const mode = 'custom-rig';

    const eqIds = hero.relicsStatus.filter((r) => r.equipped).map((r) => r.id);
    const hasCrown = eqIds.includes('relic-crown');
    const hasPauldrons = eqIds.includes('relic-pauldrons');
    const hasGauntlets = eqIds.includes('relic-gauntlets');
    const hasBelt = eqIds.includes('relic-belt');
    const hasBoots = eqIds.includes('relic-boots');
    const hasBlade = eqIds.includes('relic-blade');

    // MODE 1 : PERSONNAGE DE PLEIN PIED TORSE NU (ILLUSTRATION HD + FLAMMES D'AURA & ÉCLAIRS)
    if (mode === 'illustrated') {
      const equippedRelicsList = hero.relicsStatus.filter((r) => r.equipped);
      return `
        <div class="shonen-portrait-stage relative w-full max-w-[215px] mx-auto select-none">
          <!-- Halo d'Aura Cinétique respirant derrière le guerrier de plein pied -->
          <div class="shonen-aura-ring" style="--aura-primary: ${aura.primary}; --aura-secondary: ${aura.secondary}; --aura-glow: ${aura.glow};"></div>

          <!-- Capsule / Cadre Énergétique Shonen de Plein Pied -->
          <div class="shonen-portrait-frame relative rounded-2xl overflow-hidden border-2" style="border-color: ${aura.primary}; box-shadow: 0 0 28px ${aura.glow}, inset 0 0 18px ${aura.glow};">
            <img
              src="${hero.classObj.artUrl}"
              alt="${hero.classObj.name}"
              class="w-full h-[272px] object-cover object-center block shonen-hero-img"
            />

            <!-- Superposition d'Aura Ki Pro au sol, pierres en lévitation et éclairs en SVG -->
            <svg viewBox="0 0 200 272" class="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="kiGroundGlow" x1="0%" y1="70%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="${aura.primary}" stop-opacity="0" />
                  <stop offset="70%" stop-color="${aura.primary}" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="#050811" stop-opacity="0.92" />
                </linearGradient>
              </defs>
              <rect width="200" height="272" fill="url(#kiGroundGlow)" />
              <!-- Ondes de choc de Ki sous les bottes -->
              <ellipse cx="100" cy="242" rx="76" ry="8" fill="none" stroke="${aura.secondary}" stroke-width="1.4" stroke-dasharray="8 5" opacity="0.75" />
              ${
                sparks
                  ? `
                <!-- Éclairs d'Aura Cinétique crépitants de la tête aux pieds -->
                <polyline class="shonen-spark-bolt" points="16,38 30,64 18,74 36,110" fill="none" stroke="${aura.secondary}" stroke-width="2.2" stroke-linecap="round" />
                <polyline class="shonen-spark-bolt shonen-spark-delay" points="184,32 166,62 178,72 158,108" fill="none" stroke="${aura.primary}" stroke-width="2.2" stroke-linecap="round" />
                <polyline class="shonen-spark-bolt" points="22,155 38,180 26,192 44,224" fill="none" stroke="${aura.secondary}" stroke-width="2" stroke-linecap="round" />
                <polyline class="shonen-spark-bolt shonen-spark-delay" points="178,150 160,178 172,190 154,222" fill="none" stroke="${aura.primary}" stroke-width="2" stroke-linecap="round" />
                <!-- Pierres en lévitation sous la pression du Ki -->
                <polygon points="24,218 30,213 33,220 26,223" fill="${aura.secondary}" opacity="0.85" />
                <polygon points="172,212 179,207 181,215 174,218" fill="${aura.primary}" opacity="0.85" />
                <circle cx="28" cy="118" r="2.5" fill="${aura.secondary}" class="animate-ping" />
                <circle cx="174" cy="132" r="2.5" fill="${aura.primary}" class="animate-ping" />
              `
                  : ''
              }
            </svg>

            <!-- Badge HUD Tactique / Titre de Combat en bas sans masquer les jambes -->
            <div class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-1 rounded-xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-sm">
              <span class="text-[9px] font-black uppercase tracking-wider text-amber-300 truncate">⚡ ${titleText}</span>
              <div class="flex items-center gap-0.5 shrink-0">
                ${equippedRelicsList.map((r) => `<span class="text-[11px]" title="${r.name}">${r.icon}</span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // MODE 2 : COMBATTANT CINÉTIQUE URBAIN VECTORIEL MODULABLE DE PLEIN PIED
    const sashColor = armor.sash || '#E11D48';
    const morphId = hero.morphologyObj?.id || app.morphology || (isFemale ? 'agile-stalker' : 'athletic-vtaper');
    const outfitId = hero.outfitObj?.id || app.outfit || 'outfit-dogi';
    const jawId = hero.jawTypeObj?.id || app.jawType || 'jaw-sharp';
    const powerEqs = hero.powerEquipments || app.powerEquipments || ['equip-belt', 'equip-wristwraps'];
    const hasPowerBelt = powerEqs.includes('equip-belt') || hasBelt;
    const hasPowerSleeves = powerEqs.includes('equip-sleeves');
    const hasPowerWristwraps = powerEqs.includes('equip-wristwraps');
    const hasPowerStraps = powerEqs.includes('equip-straps');
    const hasBoxerWraps = powerEqs.includes('equip-boxer-wraps');
    const hasDemonBack = powerEqs.includes('equip-demon-back');
    const hasChronometer = eqIds.includes('relic-chronometer');
    const hasElixir = eqIds.includes('relic-sun-elixir');

    return `
      <div class="shonen-portrait-stage relative w-full max-w-[215px] mx-auto select-none">
        <div class="shonen-aura-ring" style="--aura-primary: ${aura.primary}; --aura-secondary: ${aura.secondary}; --aura-glow: ${aura.glow};"></div>
        <div class="shonen-portrait-frame relative rounded-2xl overflow-hidden border-2 bg-[#070B14]" style="border-color: ${aura.primary}; box-shadow: 0 0 26px ${aura.glow};">
          <svg viewBox="0 0 220 272" class="w-full h-[272px] mx-auto select-none block">
            <defs>
              <radialGradient id="dbzAuraGrad" cx="50%" cy="48%" r="52%">
                <stop offset="0%" stop-color="${aura.secondary}" stop-opacity="0.55" />
                <stop offset="55%" stop-color="${aura.primary}" stop-opacity="0.28" />
                <stop offset="100%" stop-color="#070B14" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="skinTorsoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${skin.hex}" />
                <stop offset="55%" stop-color="${skin.shade}" />
                <stop offset="100%" stop-color="${skin.shadow}" />
              </linearGradient>
              <linearGradient id="skinShadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${skin.shade}" />
                <stop offset="100%" stop-color="${skin.shadow}" />
              </linearGradient>
              <linearGradient id="dogiPantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${armor.start}" />
                <stop offset="55%" stop-color="${armor.mid}" />
                <stop offset="100%" stop-color="${armor.end}" />
              </linearGradient>
              <linearGradient id="kiBladeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="${aura.secondary}" />
                <stop offset="100%" stop-color="${aura.primary}" />
              </linearGradient>
              <linearGradient id="goldBeltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FEF08A" />
                <stop offset="50%" stop-color="#F59E0B" />
                <stop offset="100%" stop-color="#B45309" />
              </linearGradient>
              <linearGradient id="leverSteelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#F8FAFC" />
                <stop offset="50%" stop-color="#CBD5E1" />
                <stop offset="100%" stop-color="#64748B" />
              </linearGradient>
              <linearGradient id="techwearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1E293B" />
                <stop offset="60%" stop-color="#0F172A" />
                <stop offset="100%" stop-color="#020617" />
              </linearGradient>
            </defs>

            <!-- Onde de choc cratère au sol (Plein Pied) -->
            <ellipse cx="110" cy="248" rx="82" ry="13" fill="url(#dbzAuraGrad)" />
            <ellipse cx="110" cy="248" rx="70" ry="8" fill="none" stroke="${aura.primary}" stroke-width="1.6" stroke-dasharray="8 4" opacity="0.85" />
            <ellipse cx="110" cy="248" rx="46" ry="5" fill="none" stroke="${aura.secondary}" stroke-width="1.2" opacity="0.75" />

            <!-- Double Flamme d'Aura Cinétique derrière le corps entier -->
            <path d="M36 244 Q18 170 42 112 L28 92 L54 68 L44 36 L78 44 L94 10 L110 26 L126 10 L142 44 L176 36 L166 68 L192 92 L178 112 Q202 170 184 244 Z" fill="${aura.primary}" opacity="0.26" />
            <path d="M48 242 Q34 175 54 120 L42 100 L66 78 L58 48 L86 54 L110 20 L134 54 L162 48 L154 78 L178 100 L166 120 Q186 175 172 242 Z" fill="${aura.secondary}" opacity="0.22" />
            <circle cx="110" cy="132" r="88" fill="url(#dbzAuraGrad)" />

            <!-- ARTEFACT : Lame Runique de l’Éclipse dans le dos si Relique équipée -->
            ${
              hasBlade
                ? `
              <g transform="translate(152, 34) rotate(20)">
                <rect x="-3" y="0" width="6" height="165" rx="2" fill="url(#kiBladeGrad)" stroke="#FFFFFF" stroke-width="1" />
                <rect x="-11" y="135" width="22" height="5" rx="2" fill="url(#goldBeltGrad)" />
                <circle cx="0" cy="148" r="4.5" fill="${aura.secondary}" stroke="#0F172A" stroke-width="1" />
              </g>
            `
                : ''
            }

            <!-- ARTEFACT : Chronomètre de Faille Astrale -->
            ${
              hasChronometer
                ? `
              <g transform="translate(68, 66)">
                <circle cx="0" cy="0" r="6" fill="#0F172A" stroke="${aura.secondary}" stroke-width="1.2" />
                <circle cx="0" cy="0" r="4" fill="none" stroke="${aura.primary}" stroke-width="0.8" stroke-dasharray="2 1" />
                <line x1="0" y1="0" x2="2" y2="-2" stroke="#FFFFFF" stroke-width="1" />
              </g>
            `
                : ''
            }

            <!-- ARTEFACT : Élixir d’Aura Solaire à la hanche -->
            ${
              hasElixir
                ? `
              <g transform="translate(142, 142)">
                <rect x="-4" y="0" width="8" height="13" rx="2.5" fill="${aura.primary}" stroke="#FEF08A" stroke-width="1" opacity="0.9" />
                <rect x="-2" y="-3" width="4" height="3" rx="1" fill="#78350F" />
                <circle cx="0" cy="6" r="2" fill="#FFFFFF" opacity="0.8" />
              </g>
            `
                : ''
            }

            <!-- BOTTES DE COMBAT RENFORCÉES (DE PLEIN PIED : JUSQU'Y=246) -->
            <!-- Jambe gauche botte -->
            <path d="M76 204 L70 238 L62 245 L92 245 L93 204 Z" fill="${hasBoots ? '#1E293B' : '#0F172A'}" stroke="${hasBoots ? aura.secondary : '#475569'}" stroke-width="1.5" />
            <rect x="73" y="203" width="20" height="6" rx="2" fill="${sashColor}" />
            <path d="M62 242 L92 242 L92 246 L62 246 Z" fill="#F8FAFC" />
            <!-- Jambe droite botte -->
            <path d="M127 204 L128 245 L158 245 L150 238 L144 204 Z" fill="${hasBoots ? '#1E293B' : '#0F172A'}" stroke="${hasBoots ? aura.secondary : '#475569'}" stroke-width="1.5" />
            <rect x="127" y="203" width="20" height="6" rx="2" fill="${sashColor}" />
            <path d="M128 242 L158 242 L158 246 L128 246 Z" fill="#F8FAFC" />

            <!-- PANTALON SELON TENUE (DOGI / TECHWEAR / COMPRESSION) -->
            ${
              outfitId === 'outfit-techwear'
                ? `
              <!-- Pantalon Cargo Techwear avec sangles tactiques -->
              <path d="M84 142 L64 178 L70 206 L96 206 L108 156 Z" fill="url(#techwearGrad)" stroke="#334155" stroke-width="1.5" />
              <path d="M136 142 L156 178 L150 206 L124 206 L112 156 Z" fill="url(#techwearGrad)" stroke="#334155" stroke-width="1.5" />
              <rect x="66" y="165" width="14" height="16" rx="2" fill="#1E293B" stroke="${aura.primary}" stroke-width="0.8" />
              <rect x="140" y="165" width="14" height="16" rx="2" fill="#1E293B" stroke="${aura.primary}" stroke-width="0.8" />
              <line x1="68" y1="173" x2="80" y2="173" stroke="#F8FAFC" stroke-width="1" />
              <line x1="142" y1="173" x2="154" y2="173" stroke="#F8FAFC" stroke-width="1" />
            `
                : outfitId === 'outfit-compression'
                ? `
              <!-- Collant de compression Cyber-Pulse profilé -->
              <path d="M84 142 L68 178 L72 206 L94 206 L108 156 Z" fill="#090D16" stroke="${aura.primary}" stroke-width="1.4" />
              <path d="M136 142 L152 178 L148 206 L126 206 L112 156 Z" fill="#090D16" stroke="${aura.primary}" stroke-width="1.4" />
              <path d="M78 146 L72 182 L76 202" fill="none" stroke="${aura.secondary}" stroke-width="1.2" />
              <path d="M142 146 L148 182 L144 202" fill="none" stroke="${aura.secondary}" stroke-width="1.2" />
            `
                : `
              <!-- Pantalon ample d'arts martiaux Dogi -->
              <path d="M84 142 L66 178 L72 206 L96 206 L108 156 Z" fill="url(#dogiPantsGrad)" stroke="#1E293B" stroke-width="1.5" />
              <line x1="76" y1="162" x2="92" y2="184" stroke="#0F172A" stroke-width="1.4" opacity="0.65" />
              <line x1="72" y1="184" x2="88" y2="196" stroke="#0F172A" stroke-width="1.3" opacity="0.65" />
              <path d="M136 142 L154 178 L148 206 L124 206 L112 156 Z" fill="url(#dogiPantsGrad)" stroke="#1E293B" stroke-width="1.5" />
              <line x1="144" y1="162" x2="128" y2="184" stroke="#0F172A" stroke-width="1.4" opacity="0.65" />
              <line x1="148" y1="184" x2="132" y2="196" stroke="#0F172A" stroke-width="1.3" opacity="0.65" />
            `
            }

            <!-- ÉQUIPEMENT DE FORCE : Genouillères Néoprène 7mm -->
            ${
              hasPowerSleeves
                ? `
              <rect x="67" y="180" width="22" height="20" rx="3" fill="#1E293B" stroke="${aura.secondary}" stroke-width="1.5" />
              <polygon points="78,183 85,190 78,197 71,190" fill="none" stroke="#F8FAFC" stroke-width="1" />
              <rect x="131" y="180" width="22" height="20" rx="3" fill="#1E293B" stroke="${aura.secondary}" stroke-width="1.5" />
              <polygon points="142,183 149,190 142,197 135,190" fill="none" stroke="#F8FAFC" stroke-width="1" />
            `
                : ''
            }

            <!-- CEINTURE DE FORCE À LEVIER EN ACIER RUNIQUE OU CEINTURE OBI -->
            ${
              hasPowerBelt
                ? `
              <rect x="80" y="134" width="60" height="13" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.8" />
              <rect x="104" y="135" width="14" height="11" rx="2" fill="url(#leverSteelGrad)" stroke="#0F172A" stroke-width="1.2" />
              <path d="M112 136 L124 136 L126 142 L112 142 Z" fill="#F8FAFC" stroke="#0F172A" stroke-width="1" />
              <circle cx="88" cy="140" r="1.2" fill="#64748B" />
              <circle cx="94" cy="140" r="1.2" fill="#64748B" />
              <circle cx="100" cy="140" r="1.2" fill="#64748B" />
            `
                : `
              <rect x="83" y="135" width="54" height="11" rx="3" fill="${sashColor}" stroke="#0F172A" stroke-width="1.4" />
              <path d="M106 142 L94 176 L102 178 L110 146 Z" fill="${sashColor}" stroke="#0F172A" stroke-width="1" />
              <path d="M114 142 L126 174 L118 177 L110 146 Z" fill="${sashColor}" stroke="#0F172A" stroke-width="1" />
              <circle cx="110" cy="141" r="5" fill="#FEF08A" stroke="#0F172A" stroke-width="1.2" />
            `
            }

            <!-- TORSE & HAUT DU CORPS SELON LES 5 MORPHOLOGIES SHONEN & COMBAT -->
            ${
              morphId === 'ogre-hanma'
                ? `
              <!-- MORPHOLOGIE OGRE DÉCHAÎNÉ (STYLE BAKI : DÉMON, TRAPÈZES COBRA & STRIATIONS) -->
              <!-- Trapèzes Cobra Géants montants -->
              <polygon points="66,62 110,44 154,62 164,76 56,76" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M80 62 Q110 50 140 62" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <line x1="92" y1="50" x2="88" y2="72" stroke="${skin.shadow}" stroke-width="1.4" />
              <line x1="128" y1="50" x2="132" y2="72" stroke="${skin.shadow}" stroke-width="1.4" />
              <!-- Cou ultra-dense & Clavicules sculptées -->
              <rect x="94" y="44" width="32" height="24" rx="4" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.5" />
              <path d="M92 68 Q110 74 128 68" fill="none" stroke="${skin.shadow}" stroke-width="2" />
              <!-- Cage thoracique & Pectoraux tranchés et striés Baki -->
              <path d="M64 74 L156 74 L142 140 L78 140 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="2" />
              <line x1="110" y1="74" x2="110" y2="137" stroke="${skin.shadow}" stroke-width="2.2" />
              <path d="M70 78 L108 81 L108 106 L74 103 Z" fill="none" stroke="${skin.shadow}" stroke-width="2" />
              <path d="M150 78 L112 81 L112 106 L146 103 Z" fill="none" stroke="${skin.shadow}" stroke-width="2" />
              <line x1="80" y1="86" x2="104" y2="88" stroke="${skin.shadow}" stroke-width="1.3" opacity="0.85" />
              <line x1="78" y1="94" x2="102" y2="96" stroke="${skin.shadow}" stroke-width="1.3" opacity="0.85" />
              <line x1="140" y1="86" x2="116" y2="88" stroke="${skin.shadow}" stroke-width="1.3" opacity="0.85" />
              <line x1="142" y1="94" x2="118" y2="96" stroke="${skin.shadow}" stroke-width="1.3" opacity="0.85" />
              <!-- Dentelés en dents de requin (Serratus anterior Baki) -->
              <path d="M74 105 L86 109 L76 115 L88 119 L78 125 L90 129" fill="none" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M146 105 L134 109 L144 115 L132 119 L142 125 L130 129" fill="none" stroke="${skin.shadow}" stroke-width="1.8" />
              <!-- 8-Pack chiffré et rainuré -->
              <rect x="94" y="106" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="112" y="106" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="94" y="116" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="112" y="116" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="95" y="126" width="13" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="112" y="126" width="13" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <!-- Lueur rougeoyante du Dos du Démon si activée -->
              ${
                hasDemonBack
                  ? `
                <path d="M78 80 Q110 96 142 80 Q110 120 78 80" fill="none" stroke="#DC2626" stroke-width="1.6" opacity="0.75" />
                <circle cx="110" cy="98" r="4" fill="#DC2626" opacity="0.8" />
              `
                  : ''
              }
            `
                : morphId === 'iron-puncher'
                ? `
              <!-- MORPHOLOGIE PUNCHEUR D’ACIER (STYLE IPPO : ÉPAULES CANONS & VAPEUR) -->
              <!-- Trapèzes et Cou compact de Boxeur -->
              <polygon points="76,68 110,54 144,68 152,78 68,78" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="96" y="48" width="28" height="22" rx="4" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.6" />
              <!-- Pectoraux rebondis & Torse de puncheur -->
              <path d="M68 76 L152 76 L138 138 L82 138 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M72 80 Q90 82 108 83 L108 105 Q90 106 76 102 Z" fill="none" stroke="${skin.shadow}" stroke-width="1.9" />
              <path d="M148 80 Q130 82 112 83 L112 105 Q130 106 144 102 Z" fill="none" stroke="${skin.shadow}" stroke-width="1.9" />
              <line x1="110" y1="80" x2="110" y2="135" stroke="${skin.shadow}" stroke-width="2" />
              <!-- Obliques pour pivot de puissance Dempsey Roll -->
              <path d="M84 110 Q94 115 106 113" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
              <path d="M136 110 Q126 115 114 113" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
              <rect x="96" y="106" width="13" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <rect x="111" y="106" width="13" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <rect x="97" y="116" width="12" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <rect x="111" y="116" width="12" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <rect x="98" y="126" width="11" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <rect x="111" y="126" width="11" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <!-- Vapeur corporelle de combat (Fumée de surchauffe Dempsey Roll) -->
              <path d="M60 68 Q54 52 64 40 Q68 48 64 62" fill="${aura.primary}" opacity="0.35" />
              <path d="M160 68 Q166 52 156 40 Q152 48 156 62" fill="${aura.primary}" opacity="0.35" />
              <path d="M110 46 Q116 32 110 20 Q106 28 108 40" fill="#FFFFFF" opacity="0.4" />
            `
                : morphId === 'colossal-titan'
                ? `
              <!-- MORPHOLOGIE TITAN COLOSSAL (CHARPENTE LOURDE 1RM) -->
              <polygon points="76,68 110,54 144,68 152,78 68,78" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="97" y="52" width="26" height="20" rx="5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
              <path d="M66 74 L154 74 L142 140 L78 140 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M72 78 L109 81 L109 107 L77 104 Z" fill="none" stroke="${skin.shadow}" stroke-width="2" />
              <path d="M148 78 L111 81 L111 107 L143 104 Z" fill="none" stroke="${skin.shadow}" stroke-width="2" />
              <line x1="110" y1="81" x2="110" y2="136" stroke="${skin.shadow}" stroke-width="1.8" />
              <rect x="94" y="108" width="15" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
              <rect x="111" y="108" width="15" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
              <rect x="95" y="119" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
              <rect x="111" y="119" width="14" height="9" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.5" />
            `
                : morphId === 'agile-stalker' || isFemale
                ? `
              <!-- MORPHOLOGIE VALKYRIE / OMBRE ÉTHÉRÉE (AGILE & PROFILÉE) -->
              <polygon points="88,72 110,64 132,72 136,80 84,80" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.1" />
              <rect x="103" y="58" width="14" height="14" rx="3" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1" />
              <path d="M80 76 L140 76 L128 137 L92 137 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
              <path d="M78 80 L110 84 L142 80 L140 106 L110 110 L80 106 Z" fill="url(#dogiPantsGrad)" stroke="#1E293B" stroke-width="1.5" />
              <line x1="80" y1="105" x2="140" y2="105" stroke="${sashColor}" stroke-width="2" />
              <circle cx="110" cy="94" r="3.5" fill="${sashColor}" stroke="#0F172A" stroke-width="1" />
              <line x1="110" y1="110" x2="110" y2="135" stroke="${skin.shadow}" stroke-width="1.3" opacity="0.8" />
              <path d="M102 115 Q110 118 118 115" fill="none" stroke="${skin.shadow}" stroke-width="1" opacity="0.7" />
              <path d="M103 124 Q110 127 117 124" fill="none" stroke="${skin.shadow}" stroke-width="1" opacity="0.7" />
            `
                : `
              <!-- MORPHOLOGIE STRIKER ATHLÉTIQUE (V-TAPER PARFAIT) -->
              <polygon points="84,72 110,62 136,72 142,80 78,80" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.2" />
              <rect x="101" y="56" width="18" height="16" rx="4" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.1" />
              <path d="M74 76 L146 76 L134 137 L86 137 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.5" />
              <path d="M78 80 L109 82 L109 103 L83 101 Z" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <path d="M142 80 L111 82 L111 103 L137 101 Z" fill="none" stroke="${skin.shadow}" stroke-width="1.6" />
              <line x1="88" y1="75" x2="106" y2="79" stroke="${skin.shadow}" stroke-width="1.4" />
              <line x1="132" y1="75" x2="114" y2="79" stroke="${skin.shadow}" stroke-width="1.4" />
              <line x1="110" y1="82" x2="110" y2="135" stroke="${skin.shadow}" stroke-width="1.6" />
              <rect x="96" y="105" width="12" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <rect x="112" y="105" width="12" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <rect x="97" y="115" width="11" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <rect x="112" y="115" width="11" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <rect x="98" y="125" width="10" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <rect x="112" y="125" width="10" height="8" rx="2" fill="none" stroke="${skin.shadow}" stroke-width="1.3" />
              <line x1="84" y1="108" x2="92" y2="112" stroke="${skin.shadow}" stroke-width="1.2" />
              <line x1="86" y1="116" x2="93" y2="120" stroke="${skin.shadow}" stroke-width="1.2" />
              <line x1="136" y1="108" x2="128" y2="112" stroke="${skin.shadow}" stroke-width="1.2" />
              <line x1="134" y1="116" x2="127" y2="120" stroke="${skin.shadow}" stroke-width="1.2" />
            `
            }

            <!-- HAUT TECHNIQUE SI TENUE STRINGER SÉLECTIONNÉE -->
            ${
              outfitId === 'outfit-techwear'
                ? `
              <path d="M92 76 L128 76 L124 134 L96 134 Z" fill="url(#techwearGrad)" stroke="${aura.primary}" stroke-width="1.2" />
              <line x1="110" y1="84" x2="110" y2="126" stroke="${aura.secondary}" stroke-width="1.2" stroke-dasharray="3 2" />
            `
                : ''
            }

            <!-- ÉPAULES & BRAS MUSCLÉS SELON MORPHOLOGIE -->
            ${
              morphId === 'ogre-hanma'
                ? `
              <!-- BRAS DE L'OGRE (BAKI STYLE : VASCULARITÉ & DELTOÏDES GÉANTS) -->
              <circle cx="64" cy="82" r="16.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="2" />
              <path d="M52 86 L42 120 L58 126 L71 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M50 78 Q58 84 54 96" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
              <circle cx="156" cy="82" r="16.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="2" />
              <path d="M168 86 L178 120 L162 126 L149 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M170 78 Q162 84 166 96" fill="none" stroke="${skin.shadow}" stroke-width="1.4" />
            `
                : morphId === 'iron-puncher'
                ? `
              <!-- BRAS DE PUNCHEUR (IPPO STYLE : CANONS & AVANT-BRAS DE FRAPPE) -->
              <circle cx="66" cy="84" r="15.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.9" />
              <path d="M54 88 L45 120 L61 125 L73 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.7" />
              <circle cx="154" cy="84" r="15.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.9" />
              <path d="M166 88 L175 120 L159 125 L147 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.7" />
            `
                : morphId === 'colossal-titan'
                ? `
              <circle cx="68" cy="82" r="15" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M56 88 L46 120 L62 125 L73 95 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.6" />
              <circle cx="152" cy="82" r="15" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.8" />
              <path d="M164 88 L174 120 L158 125 L147 95 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.6" />
            `
                : morphId === 'agile-stalker' || isFemale
                ? `
              <circle cx="72" cy="84" r="9.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
              <path d="M63 90 L55 120 L67 123 L75 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
              <circle cx="148" cy="84" r="9.5" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
              <path d="M157 90 L165 120 L153 123 L145 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
            `
                : `
              <circle cx="71" cy="84" r="12" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
              <path d="M61 90 L52 120 L66 124 L75 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
              <circle cx="149" cy="84" r="12" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
              <path d="M159 90 L168 120 L154 124 L145 96 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
            `
            }

            <!-- Aura d'épaules si Relique Espaliers d'Atlas équipée -->
            ${
              hasPauldrons
                ? `
              <path d="M56 78 Q68 64 84 74" fill="none" stroke="${aura.secondary}" stroke-width="2.5" stroke-linecap="round" />
              <path d="M164 78 Q152 64 136 74" fill="none" stroke="${aura.secondary}" stroke-width="2.5" stroke-linecap="round" />
            `
                : ''
            }

            <!-- Avant-bras & Protège-poignets / Bandages de Boxe -->
            <path d="M52 118 L48 144 L61 146 L65 122 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
            ${
              hasBoxerWraps || morphId === 'iron-puncher'
                ? `
              <rect x="46" y="128" width="17" height="18" rx="2" fill="#F8FAFC" stroke="#64748B" stroke-width="1.4" />
              <line x1="46" y1="133" x2="63" y2="133" stroke="#CBD5E1" stroke-width="1" />
              <line x1="46" y1="138" x2="63" y2="138" stroke="#CBD5E1" stroke-width="1" />
              <line x1="46" y1="143" x2="63" y2="143" stroke="#CBD5E1" stroke-width="1" />
            `
                : `
              <rect x="47" y="133" width="15" height="12" rx="2" fill="${hasPowerWristwraps ? '#1E293B' : sashColor}" stroke="${hasPowerWristwraps ? aura.secondary : '#0F172A'}" stroke-width="1.3" />
            `
            }
            <circle cx="53" cy="151" r="6.5" fill="url(#skinShadowGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
            ${hasPowerStraps ? `<line x1="53" y1="145" x2="51" y2="162" stroke="${aura.primary}" stroke-width="2" stroke-linecap="round" />` : ''}

            <path d="M168 118 L172 144 L159 146 L155 122 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
            ${
              hasBoxerWraps || morphId === 'iron-puncher'
                ? `
              <rect x="157" y="128" width="17" height="18" rx="2" fill="#F8FAFC" stroke="#64748B" stroke-width="1.4" />
              <line x1="157" y1="133" x2="174" y2="133" stroke="#CBD5E1" stroke-width="1" />
              <line x1="157" y1="138" x2="174" y2="138" stroke="#CBD5E1" stroke-width="1" />
              <line x1="157" y1="143" x2="174" y2="143" stroke="#CBD5E1" stroke-width="1" />
            `
                : `
              <rect x="158" y="133" width="15" height="12" rx="2" fill="${hasPowerWristwraps ? '#1E293B' : sashColor}" stroke="${hasPowerWristwraps ? aura.secondary : '#0F172A'}" stroke-width="1.3" />
            `
            }
            <circle cx="167" cy="151" r="6.5" fill="url(#skinShadowGrad)" stroke="${skin.shadow}" stroke-width="1.3" />
            ${hasPowerStraps ? `<line x1="167" y1="145" x2="169" y2="162" stroke="${aura.primary}" stroke-width="2" stroke-linecap="round" />` : ''}

            <!-- VISAGE SELON FORME DE MÂCHOIRE -->
            ${
              jawId === 'jaw-chiseled'
                ? `
              <path d="M96 40 L124 40 L122 57 L116 64 L104 64 L98 57 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.5" />
            `
                : jawId === 'jaw-soft'
                ? `
              <path d="M98 40 L122 40 L119 58 Q110 65 101 58 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
            `
                : `
              <path d="M97 40 L123 40 L120 59 L110 66 L100 59 Z" fill="url(#skinTorsoGrad)" stroke="${skin.shadow}" stroke-width="1.4" />
            `
            }

            <!-- MARQUAGES DE GUERRE & SIGNES D'ÉNERGIE -->
            ${
              (hero.warMarkingObj?.id || app.warMarking) === 'eye-scar'
                ? `
              <line x1="114" y1="44" x2="117" y2="56" stroke="${skin.shadow}" stroke-width="1.8" stroke-linecap="round" />
              <line x1="114.5" y1="44" x2="117.5" y2="56" stroke="#FEF08A" stroke-width="0.8" stroke-linecap="round" opacity="0.65" />
            `
                : (hero.warMarkingObj?.id || app.warMarking) === 'baki-scars'
                ? `
              <!-- CICATRICES DE L'OGRE BAKI -->
              <line x1="97" y1="46" x2="103" y2="52" stroke="${skin.shadow}" stroke-width="1.6" stroke-linecap="round" />
              <line x1="102" y1="46" x2="98" y2="52" stroke="${skin.shadow}" stroke-width="1.6" stroke-linecap="round" />
              <line x1="117" y1="53" x2="124" y2="57" stroke="${skin.shadow}" stroke-width="1.6" stroke-linecap="round" />
            `
                : (hero.warMarkingObj?.id || app.warMarking) === 'ippo-focus'
                ? `
              <!-- REGARD DU CHAMPION IPPO -->
              <path d="M100 55 Q104 57 108 55" fill="none" stroke="#DC2626" stroke-width="1.3" opacity="0.75" />
              <path d="M112 55 Q116 57 120 55" fill="none" stroke="#DC2626" stroke-width="1.3" opacity="0.75" />
              <circle cx="97" cy="53" r="1.5" fill="#DC2626" opacity="0.45" />
            `
                : (hero.warMarkingObj?.id || app.warMarking) === 'mana-runes'
                ? `
              <path d="M100 54 L103 56 L106 54" fill="none" stroke="${eye.glow}" stroke-width="1.2" />
              <path d="M114 54 L117 56 L120 54" fill="none" stroke="${eye.glow}" stroke-width="1.2" />
              <circle cx="103" cy="57" r="0.8" fill="${eye.hex}" />
              <circle cx="117" cy="57" r="0.8" fill="${eye.hex}" />
            `
                : (hero.warMarkingObj?.id || app.warMarking) === 'energy-circuit'
                ? `
              <polyline points="98,48 96,54 99,58" fill="none" stroke="${eye.glow}" stroke-width="1.2" />
              <polyline points="122,48 124,54 121,58" fill="none" stroke="${eye.glow}" stroke-width="1.2" />
              <circle cx="96" cy="54" r="0.9" fill="${eye.hex}" />
              <circle cx="124" cy="54" r="0.9" fill="${eye.hex}" />
            `
                : (hero.warMarkingObj?.id || app.warMarking) === 'hunter-sigil' || (hero.warMarkingObj?.id || app.warMarking) === 'sukuna-stripes'
                ? `
              <line x1="98" y1="52" x2="103" y2="54" stroke="#0F172A" stroke-width="1.5" />
              <line x1="99" y1="55" x2="104" y2="57" stroke="#0F172A" stroke-width="1.5" />
              <line x1="122" y1="52" x2="117" y2="54" stroke="#0F172A" stroke-width="1.5" />
              <line x1="121" y1="55" x2="116" y2="57" stroke="#0F172A" stroke-width="1.5" />
            `
                : ''
            }

            <!-- EXPRESSIONS FACIALES SHONEN -->
            ${
              (hero.expressionObj?.id || app.expression) === 'monarch'
                ? `
              <line x1="99" y1="48" x2="108" y2="49" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round" />
              <line x1="121" y1="48" x2="112" y2="49" stroke="#0F172A" stroke-width="1.6" stroke-linecap="round" />
              <polygon points="101,50 108,50 102,52" fill="${eye.hex}" />
              <circle cx="104.5" cy="51" r="0.9" fill="${eye.glow}" />
              <polygon points="119,50 112,50 118,52" fill="${eye.hex}" />
              <circle cx="115.5" cy="51" r="0.9" fill="${eye.glow}" />
              <line x1="107" y1="58" x2="113" y2="58" stroke="${skin.shadow}" stroke-width="1.2" stroke-linecap="round" />
            `
                : (hero.expressionObj?.id || app.expression) === 'berserk'
                ? `
              <polyline points="99,46 109,50" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round" />
              <polyline points="121,46 111,50" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round" />
              <circle cx="104" cy="51.5" r="2.2" fill="${eye.hex}" stroke="#DC2626" stroke-width="0.8" />
              <circle cx="104" cy="51.5" r="0.7" fill="#FFFFFF" />
              <circle cx="116" cy="51.5" r="2.2" fill="${eye.hex}" stroke="#DC2626" stroke-width="0.8" />
              <circle cx="116" cy="51.5" r="0.7" fill="#FFFFFF" />
              <polygon points="106,57 114,57 113,60 107,60" fill="#0F172A" stroke="${skin.shadow}" stroke-width="1" />
              <line x1="107" y1="58" x2="113" y2="58" stroke="#FFFFFF" stroke-width="1" />
            `
                : (hero.expressionObj?.id || app.expression) === 'confident'
                ? `
              <polyline points="100,47 108,49" fill="none" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" />
              <polyline points="120,49 112,50" fill="none" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" />
              <polygon points="101,50 108,51 102,53" fill="${eye.hex}" />
              <circle cx="104.5" cy="51.5" r="0.8" fill="${eye.glow}" />
              <polygon points="119,50 112,51 118,53" fill="${eye.hex}" />
              <circle cx="115.5" cy="51.5" r="0.8" fill="${eye.glow}" />
              <path d="M106 59 Q110 59 114 57" fill="none" stroke="${skin.shadow}" stroke-width="1.5" stroke-linecap="round" />
            `
                : `
              <polyline points="100,48 108,50" fill="none" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" />
              <polyline points="120,48 112,50" fill="none" stroke="#0F172A" stroke-width="1.8" stroke-linecap="round" />
              <polygon points="101,50 108,51 102,53" fill="${eye.hex}" />
              <circle cx="104.5" cy="51.5" r="0.8" fill="${eye.glow}" />
              <polygon points="119,50 112,51 118,53" fill="${eye.hex}" />
              <circle cx="115.5" cy="51.5" r="0.8" fill="${eye.glow}" />
              <line x1="106" y1="58" x2="114" y2="58" stroke="${skin.shadow}" stroke-width="1.4" stroke-linecap="round" />
            `
            }

            <!-- VOLUTES DE VAPEUR DE MANA ÉMANANT DES YEUX -->
            ${
              (hero.manaEyeSmoke !== false && app.manaEyeSmoke !== false)
                ? `
              <path d="M100 50 Q93 42 90 32 Q88 24 92 16" fill="none" stroke="${eye.glow}" stroke-width="1.8" stroke-linecap="round" opacity="0.85" />
              <path d="M99 49 Q94 38 96 28" fill="none" stroke="${eye.hex}" stroke-width="1" stroke-linecap="round" opacity="0.6" />
              <circle cx="91" cy="22" r="1.2" fill="${eye.glow}" opacity="0.75" />

              <path d="M120 50 Q127 42 130 32 Q132 24 128 16" fill="none" stroke="${eye.glow}" stroke-width="1.8" stroke-linecap="round" opacity="0.85" />
              <path d="M121 49 Q126 38 124 28" fill="none" stroke="${eye.hex}" stroke-width="1" stroke-linecap="round" opacity="0.6" />
              <circle cx="129" cy="22" r="1.2" fill="${eye.glow}" opacity="0.75" />
            `
                : ''
            }

            <!-- 3 PROPOSITIONS DE COIFFURES MAJEURES + VARIANTES -->
            ${
              (hairStyle.id === 'cyber-undercut' || hairStyle.id === 'solo-undercut')
                ? `
              <!-- Proposition 2 : Undercut Cyber-Monarque -->
              <path d="M90 44 L92 30 Q110 16 128 30 L130 44 Q110 38 90 44 Z" fill="#090D16" stroke="${hair.stroke}" stroke-width="1.2" />
              <path d="M88 34 Q106 14 132 24 L134 38 L124 34 Q114 48 108 52 Q110 36 94 38 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" />
              <polygon points="104,36 109,52 113,38" fill="${hair.hex}" />
            `
                : (hairStyle.id === 'stellar-flow' || hairStyle.id === 'long-warrior')
                ? `
              <!-- Proposition 3 : Crinière Stellaire Flamboyante -->
              <path d="M94 45 L62 38 L74 24 L56 12 L84 14 L98 4 L110 16 L122 4 L136 14 L164 12 L146 24 L158 38 L126 45 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" />
              <path d="M68 40 L52 76 L70 86 L64 52 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.2" />
              <path d="M152 40 L168 76 L150 86 L156 52 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.2" />
              <polygon points="96,38 102,50 106,38" fill="${hair.hex}" />
              <polygon points="114,38 118,50 124,38" fill="${hair.hex}" />
            `
                : (hairStyle.id === 'valkyrie-braids' || hairStyle.id === 'braids-valkyrie')
                ? `
              <!-- Variante : Tresses Valkyrie de Combat -->
              <path d="M92 42 Q110 24 128 42 L130 36 Q110 18 90 36 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" />
              <path d="M106 18 Q110 4 124 2 Q138 2 144 14 Q148 26 142 42 L136 40 Q140 24 134 14 Q126 8 112 18 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" />
              <rect x="114" y="8" width="6" height="4" rx="1" fill="#F59E0B" stroke="#FEF08A" stroke-width="0.8" />
              <rect x="136" y="22" width="5" height="3" rx="1" fill="#F59E0B" stroke="#FEF08A" stroke-width="0.8" />
              <polygon points="98,38 103,46 107,38" fill="${hair.hex}" />
              <polygon points="113,38 117,46 122,38" fill="${hair.hex}" />
            `
                : (hairStyle.id === 'tactical-crop' || hairStyle.id === 'short-crop')
                ? `
              <!-- Variante : Court Militaire Fade -->
              <path d="M92 44 L90 34 L96 28 L104 22 L110 24 L116 22 L124 28 L130 34 L128 44 Q110 38 92 44 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" />
              <polygon points="98,34 102,42 106,34" fill="${hair.hex}" />
              <polygon points="112,34 116,42 120,34" fill="${hair.hex}" />
            `
                : `
              <!-- Proposition 1 : Pointes Cinétiques de Chasseur (spiky-striker) -->
              <path d="M94 45 L72 34 L88 28 L76 12 L98 22 L104 4 L112 20 L122 4 L126 22 L146 12 L134 28 L150 34 L126 45 Q110 36 94 45 Z" fill="${hair.hex}" stroke="${hair.stroke}" stroke-width="1.5" stroke-linejoin="round" />
              <polygon points="98,38 103,48 106,38" fill="${hair.hex}" />
              <polygon points="112,38 116,49 120,38" fill="${hair.hex}" />
            `
            }

            ${
              hasCrown
                ? `<polygon points="96,26 102,14 110,22 118,14 124,26" fill="url(#goldBeltGrad)" stroke="#FEF9C3" stroke-width="1.2" />`
                : ''
            }

            ${
              sparks
                ? `
              <polyline class="shonen-spark-bolt" points="28,60 44,88 32,96 48,128" fill="none" stroke="${aura.secondary}" stroke-width="2.2" stroke-linecap="round" />
              <polyline class="shonen-spark-bolt shonen-spark-delay" points="192,54 176,84 188,92 172,126" fill="none" stroke="${aura.primary}" stroke-width="2.2" stroke-linecap="round" />
              <polyline class="shonen-spark-bolt" points="34,168 48,196 38,208 54,234" fill="none" stroke="${aura.secondary}" stroke-width="2" stroke-linecap="round" />
              <polyline class="shonen-spark-bolt shonen-spark-delay" points="186,164 170,192 182,204 166,232" fill="none" stroke="${aura.primary}" stroke-width="2" stroke-linecap="round" />
            `
                : ''
            }
          </svg>

          <!-- Badge HUD inférieur -->
          <div class="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between px-2 py-1 rounded-xl bg-slate-950/85 border border-slate-700/80 backdrop-blur-sm">
            <span class="text-[9px] font-black uppercase tracking-wider text-amber-300 truncate">⚡ ${titleText}</span>
            <span class="text-[9px] font-extrabold text-emerald-400">Pulse Rig 2D</span>
          </div>
        </div>
      </div>
    `;
  }

  ns.RPG = {
    resolveAssetUrl,
    HERO_CLASSES,
    AURA_STYLES,
    HAIR_COLORS,
    ARMOR_TINTS,
    GENDERS,
    SKIN_TONES,
    EYE_COLORS,
    HAIRSTYLES,
    FACE_EXPRESSIONS,
    WAR_MARKINGS,
    MORPHOLOGIES,
    JAW_TYPES,
    OUTFITS,
    POWER_EQUIPMENTS,
    MANGA_ARCHETYPES,
    APPEARANCE_OPTIONS: {
      genders: GENDERS,
      morphologies: MORPHOLOGIES,
      jawTypes: JAW_TYPES,
      outfits: OUTFITS,
      powerEquipments: POWER_EQUIPMENTS,
      skinTones: SKIN_TONES,
      hairstyles: HAIRSTYLES,
      hairColors: HAIR_COLORS,
      eyeColors: EYE_COLORS,
      expressions: FACE_EXPRESSIONS,
      warMarkings: WAR_MARKINGS,
      auraChoices: AURA_STYLES,
      hairChoices: HAIR_COLORS,
      armorChoices: ARMOR_TINTS
    },
    CUSTOM_TITLES,
    WARDROBE_CATALOG,
    GAUVAX_STATES,
    HUNTER_RANKS,
    RELICS,
    DUNGEON_BOSSES,
    PRESET_CLUBS,
    DEFAULT_CLUB_CHALLENGES,
    DEFAULT_ACTIVITY_FEED,
    ensureRpgState,
    computeWorkoutXP,
    getHeroProfile,
    renderGauvaxPixelAvatar16Bit,
    renderHeroAvatarSVG
  };
})(window.IronPulse);
