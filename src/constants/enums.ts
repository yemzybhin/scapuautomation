export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum QuantixType {
  FACTS = 'facts',
  PULSE = 'pulse',
  SPONSORED = 'sponsored',
}

export enum QuantixCategory {
  ANIMALS = 'ANIMALS',
  PLANTS = 'PLANTS',
  HUMAN_BODY = 'HUMAN_BODY',
  MICROBES = 'MICROBES',
  PHYSICS = 'PHYSICS',
  CHEMISTRY = 'CHEMISTRY',
  SPACE = 'SPACE',
  MIND = 'MIND',
  EARTH = 'EARTH',
  TECHNOLOGY = 'TECHNOLOGY',
  SCIENCE_HISTORY = 'SCIENCE_HISTORY',
  HEALTH_MEDICINE = 'HEALTH_MEDICINE',
  ENVIRONMENT = 'ENVIRONMENT',
  ENGINEERING = 'ENGINEERING',
}

export enum AnimalSubCategory {
  MAMMALS = 'mammals',
  BIRDS = 'birds',
  REPTILES = 'reptiles',
  AMPHIBIANS = 'amphibians',
  FISH = 'fish',
  INSECTS = 'insects',
  MARINE_ANIMALS = 'marine animals',
  ANIMAL_BEHAVIOR = 'animal behavior',
  EXTINCT_ANIMALS = 'extinct animals',
  ANIMAL_SUPERPOWERS = 'animal superpowers',
}

export enum PlantSubCategory {
  TREES = 'trees',
  FLOWERS = 'flowers',
  FUNGI = 'fungi',
  CARNIVOROUS_PLANTS = 'carnivorous plants',
  PLANT_BEHAVIOR = 'plant behavior',
  PHOTOSYNTHESIS = 'photosynthesis',
  PLANT_SURVIVAL = 'plant survival',
  CROPS_FOOD = 'crops and food',
  FORESTS = 'forests',
}

export enum HumanBodySubCategory {
  BRAIN = 'brain',
  HEART = 'heart',
  LUNGS = 'lungs',
  SKIN = 'skin',
  BONES = 'bones',
  MUSCLES = 'muscles',
  DIGESTION = 'digestion',
  BLOOD = 'blood',
  IMMUNE_SYSTEM = 'immune system',
  SENSES = 'senses',
  SLEEP = 'sleep',
}

export enum HealthMedicineSubCategory {
  DISEASES = 'diseases',
  VACCINES = 'vaccines',
  NUTRITION = 'nutrition',
  MEDICAL_DISCOVERIES = 'medical discoveries',
  MENTAL_HEALTH = 'mental health',
  FITNESS = 'fitness',
  LONGEVITY = 'longevity',
  PUBLIC_HEALTH = 'public health',
}

export enum MicroOrganismsSubCategory {
  BACTERIA = 'bacteria',
  VIRUSES = 'viruses',
  PROTISTS = 'protists',
  ARCHAEA = 'archaea',
  MICROSCOPIC_FUNGI = 'microscopic fungi',
  MICROBIOMES = 'microbiomes',
  EXTREMOPHILES = 'extremophiles',
  FERMENTATION = 'fermentation',
  DISEASE_MICROBES = 'disease microbes',
  BENEFICIAL_MICROBES = 'beneficial microbes',
}

export enum BrainMindSubCategory {
  MEMORY = 'memory',
  EMOTIONS = 'emotions',
  INTELLIGENCE = 'intelligence',
  DREAMS = 'dreams',
  PERCEPTION = 'perception',
  CONSCIOUSNESS = 'consciousness',
  DECISION_MAKING = 'decision making',
  HABITS = 'habits',
}

export enum PhysicsSubCategory {
  GRAVITY = 'gravity',
  MOTION = 'motion',
  ENERGY = 'energy',
  ELECTRICITY = 'electricity',
  MAGNETISM = 'magnetism',
  SOUND = 'sound',
  LIGHT = 'light',
  QUANTUM_PHYSICS = 'quantum physics',
  RELATIVITY = 'relativity',
}

export enum ChemistrySubCategory {
  ELEMENTS = 'elements',
  REACTIONS = 'reactions',
  MOLECULES = 'molecules',
  ACIDS_BASES = 'acids and bases',
  MATERIALS = 'materials',
  FOOD_CHEMISTRY = 'food chemistry',
  WEIRD_CHEMISTRY = 'weird chemistry',
  EXPLOSIONS = 'explosions',
}

export enum SpaceSubCategory {
  PLANETS = 'planets',
  STARS = 'stars',
  GALAXIES = 'galaxies',
  BLACK_HOLES = 'black holes',
  MOONS = 'moons',
  ASTEROIDS = 'asteroids',
  SPACE_MISSIONS = 'space missions',
  EXOPLANETS = 'exoplanets',
  UNIVERSE = 'universe',
}

export enum EarthScienceSubCategory {
  VOLCANOES = 'volcanoes',
  EARTHQUAKES = 'earthquakes',
  OCEANS = 'oceans',
  WEATHER = 'weather',
  CLIMATE = 'climate',
  ROCKS_MINERALS = 'rocks and minerals',
  ATMOSPHERE = 'atmosphere',
  NATURAL_DISASTERS = 'natural disasters',
}

export enum EnvironmentSubCategory {
  ECOSYSTEMS = 'ecosystems',
  BIODIVERSITY = 'biodiversity',
  POLLUTION = 'pollution',
  CONSERVATION = 'conservation',
  CLIMATE_CHANGE = 'climate change',
  RENEWABLE_ENERGY = 'renewable energy',
  ENDANGERED_SPECIES = 'endangered species',
}

export enum TechSubCategory {
  ARTIFICIAL_INTELLIGENCE = 'artificial intelligence',
  ROBOTICS = 'robotics',
  COMPUTERS = 'computers',
  CYBERSECURITY = 'cybersecurity',
  INVENTIONS = 'inventions',
  FUTURE_TECH = 'future tech',
  BIOTECHNOLOGY = 'biotechnology',
  NANOTECHNOLOGY = 'nanotechnology',
}

export enum EngineeringSubCategory {
  MACHINES = 'machines',
  BRIDGES = 'bridges',
  ROCKETS = 'rockets',
  VEHICLES = 'vehicles',
  MATERIALS_ENGINEERING = 'materials engineering',
  CIVIL_ENGINEERING = 'civil engineering',
  ELECTRICAL_ENGINEERING = 'electrical engineering',
}

export enum ScienceHistorySubCategory {
  SCIENTISTS = 'scientists',
  DISCOVERIES = 'discoveries',
  INVENTIONS = 'inventions',
  EXPERIMENTS = 'experiments',
  SPACE_RACE = 'space race',
  ANCIENT_SCIENCE = 'ancient science',
  NOBEL_PRIZES = 'nobel prizes',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PostType {
  TOP_10_CONTENT = 'top_10_content',
  TRUE_OR_FALSE = 'true_or_false',
  ONE_LINE = 'one_line',
  QUESTION_OF_THE_DAY = 'question_of_the_day',
  FACT = 'fact',
  QUICK_QUIZ = 'quick_quiz',
  SCIENTIFIC_DISCOVERY = 'scientific_discovery',
}

export const CategorySubCategoryMap = {
  [QuantixCategory.ANIMALS]: Object.values(AnimalSubCategory),
  [QuantixCategory.PLANTS]: Object.values(PlantSubCategory),
  [QuantixCategory.HUMAN_BODY]: Object.values(HumanBodySubCategory),
  [QuantixCategory.HEALTH_MEDICINE]: Object.values(HealthMedicineSubCategory),
  [QuantixCategory.MICROBES]: Object.values(MicroOrganismsSubCategory),
  [QuantixCategory.MIND]: Object.values(BrainMindSubCategory),
  [QuantixCategory.SPACE]: Object.values(SpaceSubCategory),
  [QuantixCategory.PHYSICS]: Object.values(PhysicsSubCategory),
  [QuantixCategory.CHEMISTRY]: Object.values(ChemistrySubCategory),
  [QuantixCategory.EARTH]: Object.values(EarthScienceSubCategory),
  [QuantixCategory.ENVIRONMENT]: Object.values(EnvironmentSubCategory),
  [QuantixCategory.TECHNOLOGY]: Object.values(TechSubCategory),
  [QuantixCategory.ENGINEERING]: Object.values(EngineeringSubCategory),
  [QuantixCategory.SCIENCE_HISTORY]: Object.values(ScienceHistorySubCategory),
} as const;
