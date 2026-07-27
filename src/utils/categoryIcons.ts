/** Emoji icon per category slug, with a sensible fallback. */
const ICONS: Record<string, string> = {
  medical: '🩺',
  salon: '💇',
  fitness: '🏋️',
  tutors: '📚',
  legal: '⚖️',
  mechanic: '🔧',
  'home-services': '🔌',
  cleaning: '🧹',
  photographer: '📷',
  kirana: '🛒',
  appliance: '🧰',
  insurance: '🛡️',
  government: '🏛️',
};

export function categoryIcon(slug: string): string {
  return ICONS[slug] ?? '🏢';
}
