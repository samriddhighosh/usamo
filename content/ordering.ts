// Section -> Chapter -> Module

export type SectionID =
  | 'foundations'
  | 'intermediate'
  | 'advanced'
  | 'usamo';

export type Chapter = {
  name: string;
  items: string[];
  description?: string;
};

const MODULE_ORDERING: { [key in SectionID]: Chapter[] } = {
  foundations: [
    {
      name: 'Number Sense',
      description: 'Fluency with arithmetic and foundational number theory.',
      items: ['arithmetic-nt-basics'],
    },
    {
      name: 'Algebra Basics',
      items: ['algebra-basics'],
    },
    {
      name: 'Counting Fundamentals',
      items: ['counting-fundamentals'],
    },
    {
      name: 'Geometry Basics',
      items: ['geometry-basics'],
    },
    {
      name: 'Word Problems',
      items: ['word-problems'],
    },
    {
      name: 'Intro to Probability',
      items: ['intro-probability'],
    },
  ],
  intermediate: [
    {
      name: 'Advanced Algebra',
      items: ['advanced-algebra'],
    },
    {
      name: 'Functional Equations',
      items: ['functional-equations-intro'],
    },
    {
      name: 'Counting & Casework',
      items: ['advanced-counting'],
    },
    {
      name: 'Probability',
      items: ['probability-intermediate'],
    },
    {
      name: 'Number Theory',
      items: ['number-theory-intermediate'],
    },
    {
      name: 'Euclidean Geometry',
      items: ['euclidean-geometry'],
    },
    {
      name: 'Coordinate Geometry',
      items: ['coordinate-geometry'],
    },
    {
      name: 'Inequalities',
      items: ['inequalities'],
    },
    {
      name: 'Sequences & Series',
      items: ['sequences-series'],
    },
  ],
  advanced: [
    {
      name: 'Strong Number Theory',
      items: ['number-theory-advanced'],
    },
    {
      name: 'Advanced Counting',
      items: ['counting-advanced'],
    },
    {
      name: 'Polynomials & Roots',
      items: ['polynomials-roots'],
    },
    {
      name: 'Complex Numbers',
      items: ['complex-numbers'],
    },
    {
      name: 'Advanced Geometry',
      items: ['geometry-advanced'],
    },
    {
      name: 'Trig in Contests',
      items: ['trig-contests'],
    },
    {
      name: 'Inequalities (AIME)',
      items: ['inequalities-advanced'],
    },
    {
      name: 'Generating Functions',
      items: ['generating-functions'],
    },
    {
      name: 'Functional Equations (AIME)',
      items: ['functional-equations-advanced'],
    },
  ],
  usamo: [
    {
      name: 'Proof Writing',
      items: ['proof-writing-basics'],
    },
    {
      name: 'Induction & Extremal',
      items: ['induction-extremal'],
    },
    {
      name: 'Graph Theory Intro',
      items: ['graph-theory-intro'],
    },
    {
      name: 'Advanced Inequalities',
      items: ['inequalities-olympiad'],
    },
    {
      name: 'Olympiad Number Theory',
      items: ['olympiad-number-theory'],
    },
    {
      name: 'Olympiad Geometry',
      items: ['olympiad-geometry'],
    },
    {
      name: 'Strategy & Writeups',
      items: ['strategy-writeup'],
    },
  ],
};

export default MODULE_ORDERING;
export const SECTIONS: SectionID[] = Object.keys(
  MODULE_ORDERING
) as SectionID[];
export const SECTION_LABELS: { [key in SectionID]: string } = {
  foundations: 'Foundations',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  usamo: 'USAMO Prep',
} as const;
export const SECTION_SEO_DESCRIPTION: { [key in SectionID]: string } = {
  foundations:
    'Core AMC 8 and early AMC 10 foundations: number sense, algebra, counting, geometry, word problems, and probability.',
  intermediate:
    'AMC 10/12 topics: algebra, functional equations, counting, probability, number theory, geometry, inequalities, and sequences.',
  advanced:
    'AIME-level techniques: advanced number theory, counting, polynomials, complex numbers, geometry, trig, inequalities, and generating functions.',
  usamo:
    'USAMO preparation: proof writing, induction, extremal arguments, olympiad number theory and geometry, and contest strategy.',
};
export const SECTION_SEO_TITLES: { [key in SectionID]: string } = {
  foundations: 'AMC Foundations',
  intermediate: 'AMC 10/12 Intermediate Topics',
  advanced: 'AIME Advanced Topics',
  usamo: 'USAMO Preparation',
};

const moduleIDToSectionMap: { [key: string]: SectionID } = {};

SECTIONS.forEach(section => {
  MODULE_ORDERING[section].forEach(category => {
    category.items.forEach(moduleID => {
      moduleIDToSectionMap[moduleID] = section;
    });
  });
});

export { moduleIDToSectionMap, moduleIDToURLMap };

const moduleIDToURLMap: { [key: string]: string } = {};

SECTIONS.forEach(section => {
  MODULE_ORDERING[section].forEach(category => {
    category.items.forEach(moduleID => {
      moduleIDToURLMap[moduleID] = `/${section}/${moduleID}`;
    });
  });
});
