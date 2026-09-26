// Site structure: nine pages grouped into six top-level sections.

export interface NavGroup {
  id: string;
  label: string;
  modules: string[];
  /** Rendered as a highlighted call-to-action instead of a plain nav link. */
  feature?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  { id: 'overview', label: 'Overview', modules: ['home', 'aim'] },
  { id: 'theory', label: 'Theory', modules: ['theory'] },
  { id: 'build', label: 'Build', modules: ['design', 'simulation'] },
  { id: 'diagnose', label: 'Diagnose', modules: ['diagnostics'] },
  { id: 'assessment', label: 'Assessment', modules: ['assessments'] },
  { id: 'minigame', label: 'Mini Game', modules: ['minigame'], feature: true },
  { id: 'report', label: 'Report', modules: ['conclusion'] },
];

/** Linear reading order used by Prev / Next. */
export const MODULE_ORDER = NAV_GROUPS.flatMap(g => g.modules);

export const MODULE_LABEL: Record<string, string> = {
  home: 'Overview',
  aim: 'Objectives',
  theory: 'Theory',
  design: 'Design',
  simulation: 'Simulate',
  diagnostics: 'Fault Diagnosis',
  assessments: 'Assessment',
  minigame: 'Mini Game',
  conclusion: 'Report',
};

export const groupOf = (module: string) => NAV_GROUPS.find(g => g.modules.includes(module)) ?? NAV_GROUPS[0];
