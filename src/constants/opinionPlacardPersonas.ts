export type OpinionPlacardPersona = {
  fullName: string;
  photoDescriptor: string;
};

type PersonaPool = {
  locale: string;
  givenNames: string[];
  familyNames: string[];
  photoDescriptor: string;
};

const PERSONA_POOLS: PersonaPool[] = [
  {
    locale: 'Nigerian',
    givenNames: [
      'Adeola',
      'Chinedu',
      'Aisha',
      'Tunde',
      'Ngozi',
      'Ifeoma',
      'Musa',
      'Yetunde',
      'Emeka',
      'Zainab',
    ],
    familyNames: [
      'Adebayo',
      'Okafor',
      'Balogun',
      'Eze',
      'Musa',
      'Ogunleye',
      'Nwosu',
      'Ibrahim',
      'Oladipo',
      'Umeh',
    ],
    photoDescriptor: 'Nigerian adult, natural phone camera portrait',
  },
  {
    locale: 'American',
    givenNames: [
      'Jordan',
      'Maya',
      'Ethan',
      'Brianna',
      'Caleb',
      'Avery',
      'Logan',
      'Taylor',
      'Marcus',
      'Emily',
    ],
    familyNames: [
      'Carter',
      'Miller',
      'Johnson',
      'Parker',
      'Reed',
      'Brooks',
      'Morgan',
      'Bennett',
      'Hayes',
      'Coleman',
    ],
    photoDescriptor: 'American adult, casual social media profile portrait',
  },
  {
    locale: 'French',
    givenNames: [
      'Camille',
      'Luc',
      'Manon',
      'Antoine',
      'Sophie',
      'Julien',
      'Clara',
      'Mathieu',
      'Ines',
      'Nicolas',
    ],
    familyNames: [
      'Moreau',
      'Dubois',
      'Laurent',
      'Bernard',
      'Lefevre',
      'Roux',
      'Fontaine',
      'Girard',
      'Mercier',
      'Fournier',
    ],
    photoDescriptor: 'French adult, relaxed everyday profile photo',
  },
  {
    locale: 'Chinese',
    givenNames: ['Wei', 'Mei', 'Jing', 'Liang', 'Xinyi', 'Chen', 'Yuna', 'Ming', 'Lina', 'Hao'],
    familyNames: ['Li', 'Wang', 'Zhang', 'Chen', 'Liu', 'Yang', 'Huang', 'Zhao', 'Wu', 'Xu'],
    photoDescriptor: 'Chinese adult, realistic social profile headshot',
  },
  {
    locale: 'Indian',
    givenNames: [
      'Aarav',
      'Priya',
      'Rohan',
      'Ananya',
      'Kiran',
      'Meera',
      'Vikram',
      'Nisha',
      'Arjun',
      'Sanya',
    ],
    familyNames: [
      'Sharma',
      'Patel',
      'Singh',
      'Rao',
      'Gupta',
      'Iyer',
      'Mehta',
      'Nair',
      'Kapoor',
      'Joshi',
    ],
    photoDescriptor: 'Indian adult, natural casual profile portrait',
  },
  {
    locale: 'Brazilian',
    givenNames: [
      'Lucas',
      'Mariana',
      'Rafael',
      'Beatriz',
      'Thiago',
      'Camila',
      'Felipe',
      'Larissa',
      'Gustavo',
      'Renata',
    ],
    familyNames: [
      'Silva',
      'Santos',
      'Oliveira',
      'Costa',
      'Pereira',
      'Almeida',
      'Ferreira',
      'Rodrigues',
      'Barbosa',
      'Gomes',
    ],
    photoDescriptor: 'Brazilian adult, warm natural profile portrait',
  },
  {
    locale: 'Mexican',
    givenNames: [
      'Diego',
      'Sofia',
      'Mateo',
      'Valeria',
      'Javier',
      'Lucia',
      'Emiliano',
      'Paola',
      'Andres',
      'Daniela',
    ],
    familyNames: [
      'Garcia',
      'Hernandez',
      'Lopez',
      'Martinez',
      'Gonzalez',
      'Perez',
      'Ramirez',
      'Torres',
      'Flores',
      'Rivera',
    ],
    photoDescriptor: 'Mexican adult, realistic phone camera profile photo',
  },
  {
    locale: 'British',
    givenNames: [
      'Oliver',
      'Amelia',
      'Harry',
      'Isla',
      'George',
      'Freya',
      'Noah',
      'Grace',
      'Leo',
      'Evie',
    ],
    familyNames: [
      'Smith',
      'Jones',
      'Taylor',
      'Brown',
      'Williams',
      'Wilson',
      'Evans',
      'Thomas',
      'Roberts',
      'Walker',
    ],
    photoDescriptor: 'British adult, understated everyday profile portrait',
  },
  {
    locale: 'Japanese',
    givenNames: ['Haruto', 'Yui', 'Sota', 'Aoi', 'Ren', 'Mei', 'Daiki', 'Hina', 'Kaito', 'Rina'],
    familyNames: [
      'Sato',
      'Suzuki',
      'Takahashi',
      'Tanaka',
      'Watanabe',
      'Ito',
      'Yamamoto',
      'Nakamura',
      'Kobayashi',
      'Kato',
    ],
    photoDescriptor: 'Japanese adult, clean realistic profile headshot',
  },
  {
    locale: 'South African',
    givenNames: [
      'Thabo',
      'Lerato',
      'Sipho',
      'Naledi',
      'Mandla',
      'Zanele',
      'Kabelo',
      'Nomsa',
      'Sibusiso',
      'Ayanda',
    ],
    familyNames: [
      'Mokoena',
      'Nkosi',
      'Dlamini',
      'Ndlovu',
      'Khumalo',
      'Maseko',
      'Mthembu',
      'Naidoo',
      'Botha',
      'Jacobs',
    ],
    photoDescriptor: 'South African adult, candid social profile portrait',
  },
];

const getIndex = (seed: number, modulo: number, salt: number): number => {
  const value = Math.sin((seed + 1) * (salt + 17)) * 10000;
  return Math.abs(Math.floor(value)) % modulo;
};

/**
 * Picks a persona whose name and look match the placard's region. Passing a
 * locale keeps a Nigerian trend from being posted by 'Emily Parker'; an unknown
 * locale falls back to the full pool rather than throwing.
 */
export const pickOpinionPlacardPersona = (
  seed: number,
  personaLocale?: string,
): OpinionPlacardPersona => {
  const matchingPools = personaLocale
    ? PERSONA_POOLS.filter(candidate => candidate.locale === personaLocale)
    : PERSONA_POOLS;
  const pools = matchingPools.length > 0 ? matchingPools : PERSONA_POOLS;
  const pool = pools[getIndex(seed, pools.length, 3)];
  const givenName = pool.givenNames[getIndex(seed, pool.givenNames.length, 11)];
  const familyName = pool.familyNames[getIndex(seed, pool.familyNames.length, 29)];

  return {
    fullName: `${givenName} ${familyName}`,
    photoDescriptor: `${pool.photoDescriptor}, fictional ${pool.locale} person`,
  };
};
