// IronPulse — Base de données : Exercices, Programmes Prédéfinis & Historique Démo
window.IronPulse = window.IronPulse || {};

(function (ns) {
  const MUSCLE_GROUPS = [
    { id: 'all', label: 'Tous', color: '#10B981' },
    { id: 'Pectoraux', label: 'Pectoraux', color: '#EF4444' },
    { id: 'Dos', label: 'Dos', color: '#3B82F6' },
    { id: 'Jambes', label: 'Jambes', color: '#8B5CF6' },
    { id: 'Épaules', label: 'Épaules', color: '#F59E0B' },
    { id: 'Bras', label: 'Bras', color: '#EC4899' },
    { id: 'Abdominaux', label: 'Abdos & Core', color: '#14B8A6' }
  ];

  const EQUIPMENTS = [
    'Tous',
    'Barre',
    'Haltères',
    'Machine',
    'Poulie',
    'Poids du corps'
  ];

  const GOALS = [
    { id: 'hypertrophy', label: 'Prise de muscle', desc: 'Hypertrophie & volume musculaire (8-12 rép.)', icon: 'dumbbell' },
    { id: 'strength', label: 'Force athlétique', desc: 'Charges lourdes & gain de force nerveuse (3-6 rép.)', icon: 'flame' },
    { id: 'fitness', label: 'Remise en forme', desc: 'Tonification générale, posture & santé articulaire', icon: 'heart-pulse' },
    { id: 'fatloss', label: 'Perte de poids', desc: 'Dépense calorique élevée & maintien musculaire', icon: 'zap' }
  ];

  const LEVELS = [
    { id: 'beginner', label: 'Débutant', desc: 'Moins de 6 mois de pratique régulière' },
    { id: 'intermediate', label: 'Intermédiaire', desc: '6 mois à 2 ans de pratique structurée' },
    { id: 'advanced', label: 'Avancé', desc: 'Plus de 2 ans de pratique maîtrisée' }
  ];

  const INITIAL_EXERCISES = [
    {
      id: 'ex-bench-press',
      name: 'Développé couché à la barre',
      muscleGroup: 'Pectoraux',
      primaryMuscles: ['Grand pectoral (faisceau moyen)'],
      secondaryMuscles: ['Triceps', 'Deltoïde antérieur'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Exercice polyarticulaire de référence pour développer la masse et la force de l’ensemble de la sangle thoracique et des membres supérieurs.',
      instructions: [
        'Allongez-vous sur le banc, les yeux alignés sous la barre et les pieds bien ancrés au sol.',
        'Resserrez les omoplates vers l’arrière et vers le bas pour stabiliser vos épaules.',
        'Saisissez la barre avec une prise légèrement supérieure à la largeur des épaules.',
        'Descendez la barre de manière contrôlée jusqu’au milieu de la poitrine (coudes à environ 45-70° du buste).',
        'Poussez la barre vers le haut en expirant sans décoller les fessiers du banc.'
      ],
      tips: 'Évitez d’ouvrir les coudes à 90° pour protéger la coiffe des rotateurs. Demandez un pareur sur les séries lourdes.'
    },
    {
      id: 'ex-incline-db-press',
      name: 'Développé incliné aux haltères',
      muscleGroup: 'Pectoraux',
      primaryMuscles: ['Grand pectoral (faisceau claviculaire / haut)'],
      secondaryMuscles: ['Deltoïde antérieur', 'Triceps'],
      equipment: 'Haltères',
      level: 'Débutant',
      defaultRest: 90,
      description: 'Permet un travail ciblé du haut des pectoraux avec une grande amplitude de mouvement et une trajectoire naturelle pour les épaules.',
      instructions: [
        'Réglez le dossier du banc sur une inclinaison modérée de 30° (au-delà, les épaules prennent le dessus).',
        'Asseyez-vous avec les haltères sur les cuisses, puis basculez en arrière en vous aidant des genoux.',
        'Descendez les haltères de chaque côté du haut de la poitrine en contrôlant l’étirement.',
        'Remontez en convergeant légèrement sans entrechoquer les haltères en haut.'
      ],
      tips: 'Gardez la cage thoracique haute tout au long du mouvement.'
    },
    {
      id: 'ex-cable-fly',
      name: 'Écartés à la poulie vis-à-vis',
      muscleGroup: 'Pectoraux',
      primaryMuscles: ['Grand pectoral (faisceau sternal et interne)'],
      secondaryMuscles: ['Deltoïde antérieur'],
      equipment: 'Poulie',
      level: 'Débutant',
      defaultRest: 60,
      description: 'Exercice d’isolation maintenant une tension continue sur les pectoraux du début à la fin du mouvement.',
      instructions: [
        'Placez les poulies à hauteur d’épaules ou légèrement au-dessus, puis avancez d’un pas pour mettre les câbles sous tension.',
        'Fléchissez très légèrement les coudes et verrouillez cet angle.',
        'Ramenez les poignées devant vous comme si vous entouriez un arbre, en contractant volontairement les pectoraux 1 seconde.',
        'Revenez lentement à la position initiale sans laisser les épaules partir en avant.'
      ],
      tips: 'Privilégiez le ressenti musculaire plutôt qu’une charge excessive.'
    },
    {
      id: 'ex-lat-pulldown',
      name: 'Tirage vertical poitrine',
      muscleGroup: 'Dos',
      primaryMuscles: ['Grand dorsal', 'Grand rond'],
      secondaryMuscles: ['Biceps', 'Rhomboïdes', 'Trapèzes moyens'],
      equipment: 'Poulie',
      level: 'Débutant',
      defaultRest: 90,
      description: 'Mouvement fondamental pour développer la largeur du dos (effet en V) tout en maîtrisant exactement la charge.',
      instructions: [
        'Calez vos cuisses sous les boudins et saisissez la barre en pronation, plus large que les épaules.',
        'Inclinez très légèrement le buste en arrière (10-15°) et bombez le torse.',
        'Initiez le mouvement en abaissant les épaules, puis tirez les coudes vers le bas et l’arrière pour amener la barre au haut des pectoraux.',
        'Remontez la barre de manière contrôlée jusqu’à l’étirement complet des dorsaux.'
      ],
      tips: 'Ne tirez jamais la barre derrière la nuque : cela place l’articulation gléno-humérale et les cervicales en position vulnérable.'
    },
    {
      id: 'ex-barbell-row',
      name: 'Rowing barre buste penché',
      muscleGroup: 'Dos',
      primaryMuscles: ['Grand dorsal', 'Rhomboïdes', 'Trapèzes moyens'],
      secondaryMuscles: ['Deltoïde postérieur', 'Biceps', 'Lombaires (gainage)'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Exercice polyarticulaire majeur pour l’épaisseur du dos et la solidité de toute la chaîne postérieure.',
      instructions: [
        'Pieds largeur de hanches, fléchissez légèrement les genoux et penchez le buste en avant (entre 45° et 60°) en gardant le dos strictement plat.',
        'Saisissez la barre en pronation ou supination à largeur d’épaules.',
        'Tirez la barre vers le nombril en resserrant fortement les omoplates en fin de course.',
        'Redescendez la charge sans à-coups tout en maintenant le gainage abdominal.'
      ],
      tips: 'Si le bas du dos s’arrondit, réduisez la charge ou passez au rowing haltère unilatéral avec appui sur banc.'
    },
    {
      id: 'ex-seated-cable-row',
      name: 'Tirage horizontal à la poulie basse',
      muscleGroup: 'Dos',
      primaryMuscles: ['Rhomboïdes', 'Trapèzes moyens', 'Grand dorsal'],
      secondaryMuscles: ['Biceps', 'Brachial'],
      equipment: 'Poulie',
      level: 'Débutant',
      defaultRest: 90,
      description: 'Idéal pour renforcer le milieu du dos et corriger la posture des épaules enroulées vers l’avant.',
      instructions: [
        'Asseyez-vous pieds sur les cales, genoux semi-fléchis et buste bien droit.',
        'Tirez la poignée vers le bas de l’abdomen en gardant les coudes proches des côtes.',
        'Marquez un temps d’arrêt d’une seconde en resserrant les omoplates.',
        'Accompagnez le retour de la charge sans relâcher la tension lombaire.'
      ],
      tips: 'Évitez de balancer le buste d’avant en arrière pour tirer la charge.'
    },
    {
      id: 'ex-pullups',
      name: 'Tractions à la barre fixe',
      muscleGroup: 'Dos',
      primaryMuscles: ['Grand dorsal', 'Grand rond'],
      secondaryMuscles: ['Biceps', 'Avant-bras', 'Abdominaux'],
      equipment: 'Poids du corps',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Le meilleur exercice au poids du corps pour la force relative du haut du corps et le développement complet du dos.',
      instructions: [
        'Suspendez-vous à la barre en prise pronation (largeur supérieure aux épaules), bras tendus.',
        'Engagez les omoplates vers le bas puis hissez votre corps jusqu’à passer le menton au-dessus de la barre.',
        'Descendez lentement jusqu’à l’extension complète des bras sans vous laisser tomber.'
      ],
      tips: 'Utilisez un élastique de délestage si vous ne validez pas encore 5 répétitions propres.'
    },
    {
      id: 'ex-squat',
      name: 'Squat barre (Back Squat)',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Quadriceps', 'Grands fessiers'],
      secondaryMuscles: ['Ischio-jambiers', 'Adducteurs', 'Lombaires', 'Abdominaux'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 150,
      description: 'Roi des exercices pour le bas du corps, sollicitant puissamment les cuisses, les fessiers et le gainage profond.',
      instructions: [
        'Placez la barre sur les trapèzes (jamais sur les vertèbres cervicales), pieds écartés à largeur d’épaules et pointes légèrement ouvertes.',
        'Inspirez profondément et bloquez le gainage abdominal (manœuvre de bracing).',
        'Fléchissez hanches et genoux simultanément comme pour vous asseoir entre vos talons, jusqu’à ce que les cuisses soient au moins parallèles au sol.',
        'Poussez fort dans le milieu des pieds pour remonter tout en gardant les genoux dans l’axe des orteils.'
      ],
      tips: 'Réglez toujours les barres de sécurité de la cage à squat juste en dessous de votre point bas.'
    },
    {
      id: 'ex-leg-press',
      name: 'Presse à cuisses inclinée',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Quadriceps', 'Fessiers'],
      secondaryMuscles: ['Ischio-jambiers'],
      equipment: 'Machine',
      level: 'Débutant',
      defaultRest: 120,
      description: 'Permet de travailler intensément les jambes en sécurité sans contrainte axiale sur la colonne vertébrale.',
      instructions: [
        'Plaquez le bas du dos et les fessiers contre le siège, pieds placés au centre du plateau à largeur d’épaules.',
        'Déverrouillez les sécurités et descendez le plateau lentement jusqu’à former un angle de 90° aux genoux.',
        'Repoussez le plateau par les talons sans jamais verrouiller complètement les genoux en haut.'
      ],
      tips: 'Ne descendez pas au point de décoller le bassin du dossier, cela reporterait la pression sur les disques lombaires.'
    },
    {
      id: 'ex-rdl',
      name: 'Soulevé de terre roumain',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Ischio-jambiers', 'Grands fessiers'],
      secondaryMuscles: ['Érecteurs du rachis', 'Trapèzes', 'Avant-bras'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Mouvement de charnière de hanche indispensable pour renforcer l’arrière des cuisses et les fessiers.',
      instructions: [
        'Debout, barre en mains contre les cuisses, déverrouillez légèrement les genoux (15° de flexion fixe).',
        'Poussez les fessiers loin vers l’arrière en faisant glisser la barre le long des cuisses puis des tibias, dos parfaitement neutre.',
        'Arrêtez la descente dès que vous sentez un fort étirement dans les ischio-jambiers (généralement mi-tibia).',
        'Contractez les fessiers pour ramener le bassin vers l’avant et revenir debout.'
      ],
      tips: 'La barre doit toujours frôler vos jambes : si elle s’éloigne, le levier sur les lombaires augmente fortement.'
    },
    {
      id: 'ex-leg-curl',
      name: 'Leg Curl allongé ou assis',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Ischio-jambiers'],
      secondaryMuscles: ['Mollets (gastrocnémiens)'],
      equipment: 'Machine',
      level: 'Débutant',
      defaultRest: 75,
      description: 'Isolation ciblée de l’arrière de la cuisse pour équilibrer l’articulation du genou et prévenir les blessures.',
      instructions: [
        'Ajustez le boudin juste au-dessus des talons et alignez l’axe de rotation de la machine avec vos genoux.',
        'Fléchissez les jambes au maximum en gardant le bassin collé au banc.',
        'Maintenez la contraction 1 seconde puis contrôlez la phase excentrique sur 2 à 3 secondes.'
      ],
      tips: 'Contrôlez particulièrement la redescente : c’est là que les ischio-jambiers recrutent le plus de fibres.'
    },
    {
      id: 'ex-ohp',
      name: 'Développé militaire (Overhead Press)',
      muscleGroup: 'Épaules',
      primaryMuscles: ['Deltoïde antérieur', 'Deltoïde moyen'],
      secondaryMuscles: ['Triceps', 'Haut des pectoraux', 'Trapèzes supérieurs'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Exercice polyarticulaire debout ou assis pour construire des épaules puissantes et stables.',
      instructions: [
        'Barre posée sur le haut de la clavicule, coudes légèrement en avant de la barre, fessiers et abdominaux contractés.',
        'Poussez la barre verticalement en reculant légèrement le menton pour la laisser passer.',
        'Une fois la barre au-dessus du crâne, engagez légèrement la tête sous la barre bras tendus.',
        'Redescendez en contrôle jusqu’aux clavicules.'
      ],
      tips: 'Ne cambrez pas excessivement le bas du dos ; contractez fort les fessiers pour verrouiller le bassin.'
    },
    {
      id: 'ex-lateral-raise',
      name: 'Élévations latérales aux haltères',
      muscleGroup: 'Épaules',
      primaryMuscles: ['Deltoïde moyen (faisceau latéral)'],
      secondaryMuscles: ['Trapèzes supérieurs'],
      equipment: 'Haltères',
      level: 'Débutant',
      defaultRest: 60,
      description: 'L’exercice incontournable pour élargir la carrure et sculpter le galbe latéral de l’épaule.',
      instructions: [
        'Debout, buste très légèrement penché en avant, un haltère dans chaque main.',
        'Montez les bras sur les côtés dans le plan de l’omoplate (légèrement vers l’avant, 15-20°) jusqu’à l’horizontale.',
        'Gardez les coudes légèrement fléchis et menez le mouvement par les coudes, pas par les poignets.',
        'Redescendez en freinant la charge sans relâcher complètement en bas.'
      ],
      tips: 'Utilisez des charges modérées : si vous devez donner une impulsion avec le buste, l’haltère est trop lourd.'
    },
    {
      id: 'ex-face-pull',
      name: 'Face Pull à la corde',
      muscleGroup: 'Épaules',
      primaryMuscles: ['Deltoïde postérieur', 'Coiffe des rotateurs (infra-épineux)'],
      secondaryMuscles: ['Trapèzes moyens et inférieurs', 'Rhomboïdes'],
      equipment: 'Poulie',
      level: 'Débutant',
      defaultRest: 60,
      description: 'Exercice de santé articulaire et d’isolation de l’arrière d’épaule, essentiel pour équilibrer tous les développés.',
      instructions: [
        'Réglez la poulie à hauteur du visage avec une corde à double poignée.',
        'Tirez le milieu de la corde vers votre front en écartant les mains et en effectuant une rotation externe des épaules.',
        'En fin de mouvement, vos poings doivent se trouver de part et d’autre des oreilles, coudes hauts.'
      ],
      tips: 'À intégrer 1 à 2 fois par semaine pour garder des épaules saines et indolores.'
    },
    {
      id: 'ex-barbell-curl',
      name: 'Curl biceps barre EZ ou haltères',
      muscleGroup: 'Bras',
      primaryMuscles: ['Biceps brachial', 'Brachial antérieur'],
      secondaryMuscles: ['Brachio-radial (avant-bras)'],
      equipment: 'Haltères',
      level: 'Débutant',
      defaultRest: 75,
      description: 'Exercice d’isolation classique pour le développement du volume et de la force de flexion du coude.',
      instructions: [
        'Debout, coudes collés aux flancs et épaules basses.',
        'Fléchissez les avant-bras pour monter la charge en contractant fortement les biceps en haut.',
        'Redescendez sur 2 secondes jusqu’à l’extension quasi complète sans avancer les coudes.'
      ],
      tips: 'La barre EZ ou les haltères réduisent le stress sur les poignets par rapport à une barre droite.'
    },
    {
      id: 'ex-triceps-pushdown',
      name: 'Extension triceps à la poulie haute',
      muscleGroup: 'Bras',
      primaryMuscles: ['Triceps brachial (chefs latéral et médial)'],
      secondaryMuscles: ['Ancôné'],
      equipment: 'Poulie',
      level: 'Débutant',
      defaultRest: 75,
      description: 'Isolation précise des triceps, qui représentent les deux tiers du volume du bras.',
      instructions: [
        'Face à la poulie haute avec corde ou barre, collez les coudes contre vos côtes.',
        'Tendez complètement les avant-bras vers le bas en écartant la corde en fin de course.',
        'Remontez lentement les avant-bras sans laisser les coudes monter vers l’avant.'
      ],
      tips: 'Seuls les avant-bras doivent bouger : les coudes servent de charnière fixe.'
    },
    {
      id: 'ex-plank',
      name: 'Gainage planche abdominale active',
      muscleGroup: 'Abdominaux',
      primaryMuscles: ['Transverse', 'Grand droit de l’abdomen'],
      secondaryMuscles: ['Obliques', 'Fessiers', 'Dentelé antérieur'],
      equipment: 'Poids du corps',
      level: 'Débutant',
      defaultRest: 60,
      description: 'Renforcement isométrique profond de la sangle abdominale pour protéger la colonne vertébrale sur les mouvements lourds.',
      instructions: [
        'En appui sur les avant-bras et les pointes de pieds, alignez chevilles, bassin et épaules.',
        'Rétroversez légèrement le bassin en contractant volontairement les fessiers et les abdominaux.',
        'Tirez virtuellement vos coudes vers vos pointes de pieds pour maximiser la tension.'
      ],
      tips: 'Mieux vaut 3 séries de 40 secondes en tension maximale que 2 minutes avec le bas du dos creusé.'
    },
    {
      id: 'ex-cable-crunch',
      name: 'Crunch abdominal à la poulie haute',
      muscleGroup: 'Abdominaux',
      primaryMuscles: ['Grand droit de l’abdomen'],
      secondaryMuscles: ['Obliques'],
      equipment: 'Poulie',
      level: 'Intermédiaire',
      defaultRest: 60,
      description: 'Permet d’appliquer une surcharge progressive mesurable sur les abdominaux grâce à la résistance de la poulie.',
      instructions: [
        'À genoux devant la poulie haute, tenez la corde de chaque côté de la tête.',
        'Enroulez la colonne thoracique en rapprochant le sternum du bassin (les hanches restent fixes).',
        'Expirez complètement en bas du mouvement puis remontez lentement vertèbre par vertèbre.'
      ],
      tips: 'Ne fléchissez pas les hanches (évitez de vous asseoir sur les talons), c’est le buste qui doit s’enrouler.'
    },
    {
      id: 'ex-dips',
      name: 'Dips aux barres parallèles',
      muscleGroup: 'Pectoraux',
      primaryMuscles: ['Grand pectoral (faisceau inférieur)', 'Triceps brachial'],
      secondaryMuscles: ['Deltoïde antérieur'],
      equipment: 'Poids du corps',
      level: 'Intermédiaire',
      defaultRest: 120,
      description: 'Mouvement polyarticulaire au poids du corps ou lesté pour forger le bas des pectoraux et la puissance de poussée des triceps.',
      instructions: [
        'En appui bras tendus sur les barres parallèles, abaissez les épaules loin des oreilles.',
        'Penchez légèrement le buste vers l’avant (20-30°) pour cibler davantage les pectoraux.',
        'Fléchissez les coudes de manière contrôlée jusqu’à ce que les épaules arrivent au niveau des coudes.',
        'Poussez fort dans les paumes pour revenir bras tendus en haut.'
      ],
      tips: 'Ne descendez pas de façon excessive si vous ressentez une gêne à l’avant de l’épaule.'
    },
    {
      id: 'ex-pushups',
      name: 'Pompes explosives / classiques',
      muscleGroup: 'Pectoraux',
      primaryMuscles: ['Grand pectoral', 'Triceps brachial'],
      secondaryMuscles: ['Deltoïde antérieur', 'Gainage abdominal'],
      equipment: 'Poids du corps',
      level: 'Débutant',
      defaultRest: 75,
      description: 'Classique incontournable du conditionnement martial pour renforcer les pectoraux, les triceps et le gainage complet.',
      instructions: [
        'Mains au sol légèrement plus larges que les épaules, corps gainé de la tête aux talons.',
        'Descendez la poitrine à quelques centimètres du sol, coudes orientés à 45° vers l’arrière.',
        'Repoussez le sol avec explosivité tout en gardant les abdominaux et fessiers verrouillés.'
      ],
      tips: 'Ne laissez jamais le bassin s’affaisser vers le sol.'
    },
    {
      id: 'ex-walking-lunges',
      name: 'Fentes marchées aux haltères',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Quadriceps', 'Grands fessiers'],
      secondaryMuscles: ['Ischio-jambiers', 'Adducteurs', 'Mollets'],
      equipment: 'Haltères',
      level: 'Intermédiaire',
      defaultRest: 90,
      description: 'Exercice unilatéral complet pour équilibrer la force gauche/droite, galber les fessiers et renforcer la stabilité du genou.',
      instructions: [
        'Un haltère dans chaque main, effectuez un grand pas contrôlé vers l’avant.',
        'Descendez le genou arrière vers le sol en formant deux angles proches de 90° aux genoux.',
        'Poussez dans le talon du pied avant pour ramener la jambe arrière et enchaîner le pas suivant.'
      ],
      tips: 'Gardez le buste fier et le genou avant aligné avec le deuxième orteil.'
    },
    {
      id: 'ex-calf-raise',
      name: 'Extensions mollets debout',
      muscleGroup: 'Jambes',
      primaryMuscles: ['Gastrocnémiens (jumeaux)', 'Soléaire'],
      secondaryMuscles: ['Stabilisateurs de la cheville'],
      equipment: 'Machine',
      level: 'Débutant',
      defaultRest: 60,
      description: 'Isolation essentielle pour la détente verticale, la stabilité de la cheville et le volume des mollets.',
      instructions: [
        'Placez l’avant des pieds sur la cale, talons dans le vide et jambes tendues (sans hyperextension des genoux).',
        'Laissez descendre les talons lentement pour étirer complètement le tendon d’Achille.',
        'Montez le plus haut possible sur la pointe des pieds et maintenez la contraction 1 à 2 secondes.'
      ],
      tips: 'Évitez les rebonds rapides : le tendon d’Achille restitue l’énergie élastique au détriment du travail musculaire.'
    },
    {
      id: 'ex-hammer-curl',
      name: 'Curl marteau aux haltères (Hammer Curl)',
      muscleGroup: 'Bras',
      primaryMuscles: ['Brachial antérieur', 'Brachio-radial (long supinateur)'],
      secondaryMuscles: ['Biceps brachial'],
      equipment: 'Haltères',
      level: 'Débutant',
      defaultRest: 75,
      description: 'Développe l’épaisseur du bras et la puissance de l’avant-bras grâce à la prise neutre (pouces vers le plafond).',
      instructions: [
        'Debout, un haltère dans chaque main en prise neutre (paumes face à face).',
        'Fléchissez les coudes sans faire tourner les poignets pour monter les haltères vers les épaules.',
        'Contrôlez la descente sur 2 secondes en gardant les coudes fixes contre les côtes.'
      ],
      tips: 'Idéal pour donner de la largeur au bras vu de face et renforcer la poigne.'
    },
    {
      id: 'ex-skull-crusher',
      name: 'Barre au front (Skull Crusher)',
      muscleGroup: 'Bras',
      primaryMuscles: ['Triceps brachial (longue portion et chefs latéral/médial)'],
      secondaryMuscles: ['Ancôné'],
      equipment: 'Barre',
      level: 'Intermédiaire',
      defaultRest: 90,
      description: 'Exercice roi pour la masse des triceps grâce à l’étirement prononcé de la longue portion.',
      instructions: [
        'Allongé sur un banc plat, tenez une barre EZ bras tendus légèrement inclinés vers l’arrière de la tête.',
        'Pliez uniquement les coudes pour descendre la barre vers le front ou juste derrière le crâne.',
        'Resserrez les coudes et tendez les avant-bras pour revenir à la position haute.'
      ],
      tips: 'Gardez les bras légèrement inclinés vers l’arrière pour maintenir une tension constante sur les triceps en haut.'
    },
    {
      id: 'ex-hanging-leg-raise',
      name: 'Relevé de jambes suspendu à la barre',
      muscleGroup: 'Abdominaux',
      primaryMuscles: ['Grand droit de l’abdomen (partie inférieure)', 'Obliques'],
      secondaryMuscles: ['Fléchisseurs de hanche (psoas-iliaque)', 'Avant-bras (poigne)'],
      equipment: 'Poids du corps',
      level: 'Intermédiaire',
      defaultRest: 75,
      description: 'Mouvement gymnique de haut niveau pour sculpter toute la sangle abdominale et renforcer le grip.',
      instructions: [
        'Suspendez-vous à la barre fixe, épaules engagées (actives) et jambes jointes.',
        'Montez les genoux ou les jambes tendues en enroulant le bassin vers le haut (rétroversion) en fin de course.',
        'Redescendez lentement sans laisser le corps osciller d’avant en arrière.'
      ],
      tips: 'C’est l’enroulement du bassin vers le thorax qui recrute vraiment les abdominaux au-delà des fléchisseurs de hanche.'
    }
  ];

  const PREDEFINED_PROGRAMS = [
    {
      id: 'prog-fullbody-beginner',
      name: 'Fondations Full Body 3x/sem',
      goal: 'fitness',
      level: 'beginner',
      frequency: '3 séances / semaine',
      durationWeeks: 8,
      badge: 'Idéal Débutant',
      description: 'Programme complet travaillant tout le corps à chaque séance avec des exercices polyarticulaires sécuritaires pour apprendre la technique et progresser chaque semaine.',
      sessions: [
        {
          id: 'sess-fb-a',
          name: 'Full Body A — Focus Poussée & Cuisses',
          estimatedMinutes: 50,
          exercises: [
            { exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '10-12', restSeconds: 120, note: 'Contrôlez la descente sur 2s' },
            { exerciseId: 'ex-incline-db-press', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Omoplates resserrées' },
            { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Tirez avec les coudes' },
            { exerciseId: 'ex-lateral-raise', targetSets: 3, targetReps: '12-15', restSeconds: 60, note: 'Sans élan du buste' },
            { exerciseId: 'ex-plank', targetSets: 3, targetReps: '45', restSeconds: 60, note: 'Secondes de maintien actif' }
          ]
        },
        {
          id: 'sess-fb-b',
          name: 'Full Body B — Focus Chaîne Postérieure',
          estimatedMinutes: 50,
          exercises: [
            { exerciseId: 'ex-squat', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: 'Amplitude maîtrisée' },
            { exerciseId: 'ex-seated-cable-row', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Pause 1s omoplates serrées' },
            { exerciseId: 'ex-bench-press', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: 'Pieds ancrés au sol' },
            { exerciseId: 'ex-leg-curl', targetSets: 3, targetReps: '12-15', restSeconds: 75, note: 'Excentrique contrôlé' },
            { exerciseId: 'ex-barbell-curl', targetSets: 2, targetReps: '12', restSeconds: 60, note: 'Coudes fixes' }
          ]
        }
      ]
    },
    {
      id: 'prog-ppl-hypertrophy',
      name: 'Push / Pull / Legs — Hypertrophie',
      goal: 'hypertrophy',
      level: 'intermediate',
      frequency: '3 à 6 séances / semaine',
      durationWeeks: 10,
      badge: 'Populaire • Prise de Muscle',
      description: 'Le classique PPL structuré scientifiquement pour maximiser le volume d’entraînement, la récupération par groupe musculaire et l’hypertrophie harmonieuse.',
      sessions: [
        {
          id: 'sess-ppl-push',
          name: 'Séance PUSH (Pectoraux, Épaules, Triceps)',
          estimatedMinutes: 60,
          exercises: [
            { exerciseId: 'ex-bench-press', targetSets: 4, targetReps: '6-8', restSeconds: 150, note: 'Surcharge progressive principale' },
            { exerciseId: 'ex-incline-db-press', targetSets: 3, targetReps: '8-10', restSeconds: 90, note: 'Étirement contrôlé en bas' },
            { exerciseId: 'ex-ohp', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: 'Gainage strict' },
            { exerciseId: 'ex-lateral-raise', targetSets: 4, targetReps: '12-15', restSeconds: 60, note: 'Tension continue' },
            { exerciseId: 'ex-triceps-pushdown', targetSets: 3, targetReps: '10-12', restSeconds: 75, note: 'Extension complète en bas' }
          ]
        },
        {
          id: 'sess-ppl-pull',
          name: 'Séance PULL (Dos, Arrière d’épaules, Biceps)',
          estimatedMinutes: 60,
          exercises: [
            { exerciseId: 'ex-barbell-row', targetSets: 4, targetReps: '8-10', restSeconds: 120, note: 'Dos plat impératif' },
            { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Contraction 1s en bas' },
            { exerciseId: 'ex-seated-cable-row', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Focus milieu du dos' },
            { exerciseId: 'ex-face-pull', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Santé des épaules' },
            { exerciseId: 'ex-barbell-curl', targetSets: 3, targetReps: '10-12', restSeconds: 75, note: 'Contrôle excentrique' }
          ]
        },
        {
          id: 'sess-ppl-legs',
          name: 'Séance LEGS (Quadriceps, Ischios, Fessiers, Abdos)',
          estimatedMinutes: 65,
          exercises: [
            { exerciseId: 'ex-squat', targetSets: 4, targetReps: '6-8', restSeconds: 150, note: 'Mouvement roi du jour' },
            { exerciseId: 'ex-rdl', targetSets: 3, targetReps: '8-10', restSeconds: 120, note: 'Charnière de hanche stricte' },
            { exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '10-12', restSeconds: 120, note: 'Pieds largeur épaules' },
            { exerciseId: 'ex-leg-curl', targetSets: 3, targetReps: '12-15', restSeconds: 75, note: 'Finition ischio-jambiers' },
            { exerciseId: 'ex-cable-crunch', targetSets: 3, targetReps: '12-15', restSeconds: 60, note: 'Enroulement vertébral' }
          ]
        }
      ]
    },
    {
      id: 'prog-upper-lower-strength',
      name: 'Upper / Lower — Force & Densité 4j',
      goal: 'strength',
      level: 'advanced',
      frequency: '4 séances / semaine',
      durationWeeks: 8,
      badge: 'Force & Puissance',
      description: 'Répartition Haut / Bas du corps combinant des séries lourdes (4-6 rép.) sur les mouvements de base et du travail d’assistance ciblé.',
      sessions: [
        {
          id: 'sess-ul-upper',
          name: 'Upper Body — Force Haut du Corps',
          estimatedMinutes: 65,
          exercises: [
            { exerciseId: 'ex-bench-press', targetSets: 4, targetReps: '5', restSeconds: 180, note: 'RPE 8 — garder 2 rép. en réserve' },
            { exerciseId: 'ex-barbell-row', targetSets: 4, targetReps: '6', restSeconds: 150, note: 'Explosif à la montée' },
            { exerciseId: 'ex-ohp', targetSets: 3, targetReps: '6-8', restSeconds: 150, note: 'Gainage maximal' },
            { exerciseId: 'ex-pullups', targetSets: 3, targetReps: '8', restSeconds: 120, note: 'Amplitude complète' },
            { exerciseId: 'ex-face-pull', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Prévention coiffe rotateurs' }
          ]
        },
        {
          id: 'sess-ul-lower',
          name: 'Lower Body — Force Bas du Corps',
          estimatedMinutes: 65,
          exercises: [
            { exerciseId: 'ex-squat', targetSets: 4, targetReps: '5', restSeconds: 180, note: 'Focus vitesse de remontée' },
            { exerciseId: 'ex-rdl', targetSets: 4, targetReps: '6-8', restSeconds: 150, note: 'Dos neutre' },
            { exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '10', restSeconds: 120, note: 'Volume complémentaire' },
            { exerciseId: 'ex-leg-curl', targetSets: 3, targetReps: '12', restSeconds: 90, note: 'Équilibre genou' },
            { exerciseId: 'ex-plank', targetSets: 3, targetReps: '60', restSeconds: 60, note: 'Gainage lourd' }
          ]
        }
      ]
    },
    {
      id: 'prog-metabolic-fatloss',
      name: 'Circuit Métabolique & Recomposition',
      goal: 'fatloss',
      level: 'beginner',
      frequency: '3 à 4 séances / semaine',
      durationWeeks: 6,
      badge: 'Perte de Poids & Tonus',
      description: 'Séances dynamiques avec temps de repos maîtrisés et exercices polyarticulaires pour maximiser la dépense énergétique tout en préservant la masse maigre.',
      sessions: [
        {
          id: 'sess-meta-1',
          name: 'Circuit Athlétique A (Corps Entier)',
          estimatedMinutes: 45,
          exercises: [
            { exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '12-15', restSeconds: 75, note: 'Rythme fluide et régulier' },
            { exerciseId: 'ex-incline-db-press', targetSets: 3, targetReps: '12', restSeconds: 75, note: 'Contrôle respiratoire' },
            { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '12-15', restSeconds: 75, note: 'Amplitude complète' },
            { exerciseId: 'ex-rdl', targetSets: 3, targetReps: '12', restSeconds: 90, note: 'Chaîne postérieure' },
            { exerciseId: 'ex-cable-crunch', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Sangle abdominale' }
          ]
        },
        {
          id: 'sess-meta-2',
          name: 'Circuit Athlétique B (Tonification & Cardio)',
          estimatedMinutes: 45,
          exercises: [
            { exerciseId: 'ex-squat', targetSets: 3, targetReps: '12', restSeconds: 90, note: 'Charge modérée, exécution propre' },
            { exerciseId: 'ex-seated-cable-row', targetSets: 3, targetReps: '12-15', restSeconds: 75, note: 'Omoplates serrées' },
            { exerciseId: 'ex-cable-fly', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Brûlure musculaire contrôlée' },
            { exerciseId: 'ex-lateral-raise', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Épaules toniques' },
            { exerciseId: 'ex-plank', targetSets: 3, targetReps: '45', restSeconds: 45, note: 'Gainage dynamique' }
          ]
        }
      ]
    }
  ];

  // Helper to generate dates relative to today so charts are always up-to-date
  function daysAgoISO(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(18, 0, 0, 0);
    return d.toISOString();
  }

  const INITIAL_HISTORY = [
    {
      id: 'hist-1',
      name: 'Séance PUSH (Pectoraux, Épaules, Triceps)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(16),
      durationMinutes: 56,
      notes: 'Bonne énergie, exécution propre sur le développé couché.',
      exercises: [
        {
          exerciseId: 'ex-bench-press',
          sets: [
            { weight: 65, reps: 8, rpe: 7.5, restSeconds: 150, completed: true },
            { weight: 65, reps: 8, rpe: 8, restSeconds: 150, completed: true },
            { weight: 65, reps: 7, rpe: 8.5, restSeconds: 150, completed: true },
            { weight: 62.5, reps: 8, rpe: 8.5, restSeconds: 150, completed: true }
          ]
        },
        {
          exerciseId: 'ex-incline-db-press',
          sets: [
            { weight: 22, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 22, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 22, reps: 9, rpe: 8.5, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-ohp',
          sets: [
            { weight: 40, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 40, reps: 8, rpe: 8.5, restSeconds: 120, completed: true },
            { weight: 40, reps: 7, rpe: 9, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-lateral-raise',
          sets: [
            { weight: 10, reps: 14, rpe: 8, restSeconds: 60, completed: true },
            { weight: 10, reps: 14, rpe: 8.5, restSeconds: 60, completed: true },
            { weight: 10, reps: 12, rpe: 9, restSeconds: 60, completed: true }
          ]
        }
      ]
    },
    {
      id: 'hist-2',
      name: 'Séance PULL (Dos, Arrière d’épaules, Biceps)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(14),
      durationMinutes: 54,
      notes: 'Bon ressenti sur les dorsaux.',
      exercises: [
        {
          exerciseId: 'ex-barbell-row',
          sets: [
            { weight: 60, reps: 8, rpe: 7.5, restSeconds: 120, completed: true },
            { weight: 60, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 60, reps: 8, rpe: 8, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-lat-pulldown',
          sets: [
            { weight: 55, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 55, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 55, reps: 10, rpe: 8.5, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-face-pull',
          sets: [
            { weight: 20, reps: 15, rpe: 7.5, restSeconds: 60, completed: true },
            { weight: 20, reps: 15, rpe: 8, restSeconds: 60, completed: true },
            { weight: 20, reps: 15, rpe: 8, restSeconds: 60, completed: true }
          ]
        },
        {
          exerciseId: 'ex-barbell-curl',
          sets: [
            { weight: 14, reps: 10, rpe: 8, restSeconds: 75, completed: true },
            { weight: 14, reps: 10, rpe: 8.5, restSeconds: 75, completed: true },
            { weight: 14, reps: 9, rpe: 9, restSeconds: 75, completed: true }
          ]
        }
      ]
    },
    {
      id: 'hist-3',
      name: 'Séance LEGS (Quadriceps, Ischios, Fessiers, Abdos)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(11),
      durationMinutes: 62,
      notes: 'Squat solide, gainage bien engagé.',
      exercises: [
        {
          exerciseId: 'ex-squat',
          sets: [
            { weight: 85, reps: 6, rpe: 7.5, restSeconds: 150, completed: true },
            { weight: 85, reps: 6, rpe: 8, restSeconds: 150, completed: true },
            { weight: 85, reps: 6, rpe: 8, restSeconds: 150, completed: true },
            { weight: 85, reps: 6, rpe: 8.5, restSeconds: 150, completed: true }
          ]
        },
        {
          exerciseId: 'ex-rdl',
          sets: [
            { weight: 75, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 75, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 75, reps: 8, rpe: 8.5, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-leg-press',
          sets: [
            { weight: 140, reps: 10, rpe: 8, restSeconds: 120, completed: true },
            { weight: 140, reps: 10, rpe: 8, restSeconds: 120, completed: true },
            { weight: 140, reps: 10, rpe: 8.5, restSeconds: 120, completed: true }
          ]
        }
      ]
    },
    {
      id: 'hist-4',
      name: 'Séance PUSH (Pectoraux, Épaules, Triceps)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(8),
      durationMinutes: 58,
      notes: '4x8 validé à 67.5 kg au développé couché !',
      exercises: [
        {
          exerciseId: 'ex-bench-press',
          sets: [
            { weight: 67.5, reps: 8, rpe: 8, restSeconds: 150, completed: true },
            { weight: 67.5, reps: 8, rpe: 8, restSeconds: 150, completed: true },
            { weight: 67.5, reps: 8, rpe: 8.5, restSeconds: 150, completed: true },
            { weight: 67.5, reps: 7, rpe: 9, restSeconds: 150, completed: true }
          ]
        },
        {
          exerciseId: 'ex-incline-db-press',
          sets: [
            { weight: 24, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 24, reps: 9, rpe: 8.5, restSeconds: 90, completed: true },
            { weight: 24, reps: 9, rpe: 9, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-ohp',
          sets: [
            { weight: 40, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 40, reps: 8, rpe: 8.5, restSeconds: 120, completed: true },
            { weight: 40, reps: 8, rpe: 9, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-triceps-pushdown',
          sets: [
            { weight: 25, reps: 12, rpe: 8, restSeconds: 75, completed: true },
            { weight: 25, reps: 12, rpe: 8, restSeconds: 75, completed: true },
            { weight: 25, reps: 11, rpe: 8.5, restSeconds: 75, completed: true }
          ]
        }
      ]
    },
    {
      id: 'hist-5',
      name: 'Séance PULL (Dos, Arrière d’épaules, Biceps)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(5),
      durationMinutes: 55,
      notes: 'Progression nette sur le rowing et le tirage vertical.',
      exercises: [
        {
          exerciseId: 'ex-barbell-row',
          sets: [
            { weight: 62.5, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 62.5, reps: 8, rpe: 8, restSeconds: 120, completed: true },
            { weight: 62.5, reps: 8, rpe: 8.5, restSeconds: 120, completed: true },
            { weight: 62.5, reps: 8, rpe: 8.5, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-lat-pulldown',
          sets: [
            { weight: 57.5, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 57.5, reps: 10, rpe: 8.5, restSeconds: 90, completed: true },
            { weight: 57.5, reps: 10, rpe: 8.5, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-seated-cable-row',
          sets: [
            { weight: 50, reps: 12, rpe: 8, restSeconds: 90, completed: true },
            { weight: 50, reps: 12, rpe: 8, restSeconds: 90, completed: true },
            { weight: 50, reps: 11, rpe: 8.5, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-barbell-curl',
          sets: [
            { weight: 14, reps: 11, rpe: 8, restSeconds: 75, completed: true },
            { weight: 14, reps: 11, rpe: 8.5, restSeconds: 75, completed: true },
            { weight: 14, reps: 10, rpe: 8.5, restSeconds: 75, completed: true }
          ]
        }
      ]
    },
    {
      id: 'hist-6',
      name: 'Séance PUSH (Pectoraux, Épaules, Triceps)',
      programId: 'prog-ppl-hypertrophy',
      date: daysAgoISO(2),
      durationMinutes: 60,
      notes: 'Nouveau record à 70 kg au développé couché ! Légère stagnation au développé militaire.',
      exercises: [
        {
          exerciseId: 'ex-bench-press',
          sets: [
            { weight: 70, reps: 8, rpe: 8, restSeconds: 150, completed: true },
            { weight: 70, reps: 8, rpe: 8.5, restSeconds: 150, completed: true },
            { weight: 70, reps: 8, rpe: 8.5, restSeconds: 150, completed: true },
            { weight: 70, reps: 8, rpe: 9, restSeconds: 150, completed: true }
          ]
        },
        {
          exerciseId: 'ex-incline-db-press',
          sets: [
            { weight: 24, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 24, reps: 10, rpe: 8, restSeconds: 90, completed: true },
            { weight: 24, reps: 10, rpe: 8.5, restSeconds: 90, completed: true }
          ]
        },
        {
          exerciseId: 'ex-ohp',
          sets: [
            { weight: 40, reps: 8, rpe: 8.5, restSeconds: 120, completed: true },
            { weight: 40, reps: 8, rpe: 9, restSeconds: 120, completed: true },
            { weight: 40, reps: 7, rpe: 9.5, restSeconds: 120, completed: true }
          ]
        },
        {
          exerciseId: 'ex-lateral-raise',
          sets: [
            { weight: 10, reps: 15, rpe: 8, restSeconds: 60, completed: true },
            { weight: 10, reps: 15, rpe: 8, restSeconds: 60, completed: true },
            { weight: 10, reps: 15, rpe: 8.5, restSeconds: 60, completed: true }
          ]
        },
        {
          exerciseId: 'ex-triceps-pushdown',
          sets: [
            { weight: 27.5, reps: 12, rpe: 8, restSeconds: 75, completed: true },
            { weight: 27.5, reps: 12, rpe: 8.5, restSeconds: 75, completed: true },
            { weight: 27.5, reps: 12, rpe: 8.5, restSeconds: 75, completed: true }
          ]
        }
      ]
    }
  ];

  const INITIAL_CUSTOM_SESSIONS = [
    {
      id: 'custom-express-upper',
      name: 'Haut du Corps Express (40 min)',
      estimatedMinutes: 40,
      isCustom: true,
      exercises: [
        { exerciseId: 'ex-incline-db-press', targetSets: 3, targetReps: '10', restSeconds: 90, note: 'Tempo 2-0-1' },
        { exerciseId: 'ex-lat-pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90, note: 'Focus grand dorsal' },
        { exerciseId: 'ex-lateral-raise', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Épaules larges' },
        { exerciseId: 'ex-face-pull', targetSets: 3, targetReps: '15', restSeconds: 60, note: 'Posture & coiffe' }
      ]
    }
  ];

  const PERIODIZATION_PHASES = [
    {
      id: 'accumulation',
      name: 'Phase 1 : Accumulation (Volume)',
      weeks: 'Semaines 1 à 3',
      badge: 'Hypertrophie & Base',
      targetRpe: 'RPE 7.5 - 8.0',
      repRange: '10 - 15 rép.',
      volumeMod: '+15% Séries',
      color: 'emerald',
      desc: 'Construction de la capacité de travail, recrutement métabolique et renforcement tendineux avec charges modérées.'
    },
    {
      id: 'intensification',
      name: 'Phase 2 : Intensification (Densité)',
      weeks: 'Semaines 4 à 5',
      badge: 'Force & Surcharge',
      targetRpe: 'RPE 8.0 - 8.5',
      repRange: '6 - 8 rép.',
      volumeMod: 'Charges +7.5%',
      color: 'amber',
      desc: 'Élévation progressive de la tension mécanique et réduction des répétitions pour stimuler la force myofibrillaire.'
    },
    {
      id: 'peaking',
      name: 'Phase 3 : Peaking (Surpassement 1RM)',
      weeks: 'Semaine 6',
      badge: 'Chasse aux Boss 1RM',
      targetRpe: 'RPE 9.0 - 9.5',
      repRange: '3 - 5 rép.',
      volumeMod: 'Intensité Max',
      color: 'rose',
      desc: 'Semaine de pic nerveux idéale pour battre vos records personnels (PRs) et terrasser les Boss de Donjon.'
    },
    {
      id: 'deload',
      name: 'Phase 4 : Deload (Régénération Active)',
      weeks: 'Semaine 7',
      badge: 'Récupération SNC',
      targetRpe: 'RPE 6.0 - 7.0',
      repRange: '8 - 10 rép. fluides',
      volumeMod: '-40% Volume',
      color: 'sky',
      desc: 'Semaine de décharge stratégique pour dissiper la fatigue nerveuse et articulaire tout en conservant la technique.'
    }
  ];

  // Préréglage complet "Mehdi — AURA FIT (Rang B)" issu du dump officiel
  const AURA_FIT_MEHDI_PRESET = {
    profile: {
      name: 'Mehdi',
      gender: 'male',
      age: 25,
      heightCm: 182,
      bodyWeightKg: 78.5,
      availableEquipment: 'full-gym',
      level: 'intermediate',
      goal: 'hypertrophy',
      weeklyTarget: 4,
      unit: 'kg',
      defaultRestSeconds: 90,
      activeProgramId: 'prog-ppl-hypertrophy',
      periodizationPhase: 'intensification',
      periodizationWeek: 4,
      soundEnabled: true,
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash',
      onboardingCompleted: true
    },
    rpg: {
      heroClass: 'berserker',
      bonusXpEarned: 350,
      goldBonus: 320,
      goldSpent: 0,
      streakDaysOverride: 5,
      gauvaxPose: 'repos',
      equippedOutfit: 'tee_oversize_white',
      equippedAccessory: 'gold_earring',
      equippedBackground: 'neon_gym',
      unlockedWardrobeIds: [
        'tee_oversize_white',
        'tank_shadow',
        'gold_earring',
        'neon_gym',
        'sunset_rooftop'
      ],
      appearance: {
        visualMode: 'model-3d',
        visualMode3dReady: true,
        auraStyle: 'gold',
        hairColor: 'kinetic-gold',
        armorTint: 'dark-steel',
        lightningSparks: true,
        battleTitle: 'Chasseur Rang B • Vétéran de Fonte'
      }
    },
    history: [
      {
        id: 'mehdi-hist-1',
        name: 'Quête PUSH A — Pectoraux & Épaules',
        programId: 'prog-ppl-hypertrophy',
        date: daysAgoISO(10),
        durationMinutes: 58,
        notes: 'Excellente vitesse de barre au développé couché.',
        exercises: [
          {
            exerciseId: 'ex-bench-press',
            sets: [
              { weight: 87.5, reps: 6, rpe: 8, restSeconds: 150, completed: true },
              { weight: 90, reps: 6, rpe: 8.5, restSeconds: 150, completed: true },
              { weight: 90, reps: 6, rpe: 8.5, restSeconds: 150, completed: true },
              { weight: 85, reps: 8, rpe: 8, restSeconds: 150, completed: true }
            ]
          },
          {
            exerciseId: 'ex-incline-db-press',
            sets: [
              { weight: 32, reps: 10, rpe: 8, restSeconds: 90, completed: true },
              { weight: 32, reps: 10, rpe: 8.5, restSeconds: 90, completed: true },
              { weight: 32, reps: 9, rpe: 8.5, restSeconds: 90, completed: true }
            ]
          },
          {
            exerciseId: 'ex-ohp',
            sets: [
              { weight: 52.5, reps: 8, rpe: 8, restSeconds: 120, completed: true },
              { weight: 55, reps: 6, rpe: 8.5, restSeconds: 120, completed: true },
              { weight: 55, reps: 6, rpe: 8.5, restSeconds: 120, completed: true }
            ]
          }
        ]
      },
      {
        id: 'mehdi-hist-2',
        name: 'Quête LEGS A — Squat & Chaîne Postérieure',
        programId: 'prog-ppl-hypertrophy',
        date: daysAgoISO(8),
        durationMinutes: 64,
        notes: 'Squat solide, gainage très stable.',
        exercises: [
          {
            exerciseId: 'ex-squat',
            sets: [
              { weight: 115, reps: 5, rpe: 8, restSeconds: 180, completed: true },
              { weight: 120, reps: 5, rpe: 8.5, restSeconds: 180, completed: true },
              { weight: 125, reps: 4, rpe: 8.5, restSeconds: 180, completed: true },
              { weight: 110, reps: 8, rpe: 8, restSeconds: 150, completed: true }
            ]
          },
          {
            exerciseId: 'ex-leg-press',
            sets: [
              { weight: 200, reps: 12, rpe: 8, restSeconds: 120, completed: true },
              { weight: 210, reps: 12, rpe: 8, restSeconds: 120, completed: true },
              { weight: 220, reps: 10, rpe: 8.5, restSeconds: 120, completed: true }
            ]
          }
        ]
      },
      {
        id: 'mehdi-hist-3',
        name: 'Quête PULL A — Soulevé de Terre & Dos',
        programId: 'prog-ppl-hypertrophy',
        date: daysAgoISO(5),
        durationMinutes: 62,
        notes: 'Record PR au Soulevé de Terre (145 kg x 4) !',
        exercises: [
          {
            exerciseId: 'ex-rdl',
            sets: [
              { weight: 135, reps: 5, rpe: 8, restSeconds: 150, completed: true },
              { weight: 140, reps: 5, rpe: 8.5, restSeconds: 150, completed: true },
              { weight: 145, reps: 4, rpe: 8.5, restSeconds: 180, completed: true },
              { weight: 130, reps: 8, rpe: 8, restSeconds: 150, completed: true }
            ]
          },
          {
            exerciseId: 'ex-barbell-row',
            sets: [
              { weight: 82.5, reps: 8, rpe: 8, restSeconds: 120, completed: true },
              { weight: 85, reps: 8, rpe: 8.5, restSeconds: 120, completed: true },
              { weight: 85, reps: 8, rpe: 8.5, restSeconds: 120, completed: true }
            ]
          },
          {
            exerciseId: 'ex-lat-pulldown',
            sets: [
              { weight: 70, reps: 10, rpe: 8, restSeconds: 90, completed: true },
              { weight: 70, reps: 10, rpe: 8, restSeconds: 90, completed: true },
              { weight: 75, reps: 8, rpe: 8.5, restSeconds: 90, completed: true }
            ]
          }
        ]
      },
      {
        id: 'mehdi-hist-4',
        name: 'Quête PUSH B — Record PR Développé Couché',
        programId: 'prog-ppl-hypertrophy',
        date: daysAgoISO(3),
        durationMinutes: 60,
        notes: 'PR 92.5 kg x 6 reps validé (1RM estimé : 111 kg) !',
        exercises: [
          {
            exerciseId: 'ex-bench-press',
            sets: [
              { weight: 90, reps: 6, rpe: 8, restSeconds: 150, completed: true },
              { weight: 92.5, reps: 6, rpe: 8.5, restSeconds: 180, completed: true },
              { weight: 92.5, reps: 6, rpe: 9, restSeconds: 180, completed: true },
              { weight: 85, reps: 8, rpe: 8, restSeconds: 150, completed: true }
            ]
          },
          {
            exerciseId: 'ex-dips',
            sets: [
              { weight: 20, reps: 10, rpe: 8, restSeconds: 90, completed: true },
              { weight: 20, reps: 10, rpe: 8.5, restSeconds: 90, completed: true },
              { weight: 20, reps: 9, rpe: 8.5, restSeconds: 90, completed: true }
            ]
          },
          {
            exerciseId: 'ex-lateral-raise',
            sets: [
              { weight: 14, reps: 15, rpe: 8, restSeconds: 60, completed: true },
              { weight: 14, reps: 15, rpe: 8.5, restSeconds: 60, completed: true },
              { weight: 14, reps: 14, rpe: 8.5, restSeconds: 60, completed: true }
            ]
          }
        ]
      },
      {
        id: 'mehdi-hist-5',
        name: 'Quête UPPER / BRAS — Densité & Hypertrophie',
        programId: 'prog-ppl-hypertrophy',
        date: daysAgoISO(1),
        durationMinutes: 55,
        notes: 'Congestion maximale bras & dos, série de 5 jours maintenue.',
        exercises: [
          {
            exerciseId: 'ex-pullups',
            sets: [
              { weight: 80, reps: 10, rpe: 8, restSeconds: 120, completed: true },
              { weight: 80, reps: 10, rpe: 8.5, restSeconds: 120, completed: true },
              { weight: 80, reps: 9, rpe: 8.5, restSeconds: 120, completed: true }
            ]
          },
          {
            exerciseId: 'ex-barbell-curl',
            sets: [
              { weight: 40, reps: 10, rpe: 8, restSeconds: 75, completed: true },
              { weight: 40, reps: 10, rpe: 8.5, restSeconds: 75, completed: true },
              { weight: 42.5, reps: 8, rpe: 8.5, restSeconds: 75, completed: true }
            ]
          },
          {
            exerciseId: 'ex-skull-crusher',
            sets: [
              { weight: 37.5, reps: 10, rpe: 8, restSeconds: 75, completed: true },
              { weight: 37.5, reps: 10, rpe: 8.5, restSeconds: 75, completed: true },
              { weight: 40, reps: 8, rpe: 8.5, restSeconds: 75, completed: true }
            ]
          }
        ]
      }
    ]
  };

  const INITIAL_PROFILE = {
    name: 'Mehdi',
    gender: 'male',
    age: 25,
    heightCm: 182,
    bodyWeightKg: 78.5,
    availableEquipment: 'full-gym',
    level: 'intermediate',
    goal: 'hypertrophy',
    weeklyTarget: 4,
    unit: 'kg',
    defaultRestSeconds: 90,
    activeProgramId: 'prog-ppl-hypertrophy',
    periodizationPhase: 'accumulation',
    periodizationWeek: 2,
    soundEnabled: true,
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    onboardingCompleted: false
  };

  ns.Data = {
    MUSCLE_GROUPS,
    EQUIPMENTS,
    GOALS,
    LEVELS,
    PERIODIZATION_PHASES,
    AURA_FIT_MEHDI_PRESET,
    INITIAL_EXERCISES,
    PREDEFINED_PROGRAMS,
    INITIAL_HISTORY,
    INITIAL_CUSTOM_SESSIONS,
    INITIAL_PROFILE
  };
})(window.IronPulse);
