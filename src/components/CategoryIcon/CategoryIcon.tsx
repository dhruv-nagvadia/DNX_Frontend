import {
  Stethoscope,
  Scissors,
  Dumbbell,
  GraduationCap,
  Scale,
  Wrench,
  Plug,
  SprayCan,
  Camera,
  Store,
  Refrigerator,
  ShieldCheck,
  Landmark,
  Building2,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  medical: Stethoscope,
  salon: Scissors,
  fitness: Dumbbell,
  tutors: GraduationCap,
  legal: Scale,
  mechanic: Wrench,
  'home-services': Plug,
  cleaning: SprayCan,
  photographer: Camera,
  kirana: Store,
  appliance: Refrigerator,
  insurance: ShieldCheck,
  government: Landmark,
};

export interface CategoryIconProps {
  slug: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

/** Renders the professional (Lucide) icon for a category slug. */
export function CategoryIcon({ slug, size = 22, strokeWidth = 2, className, color }: CategoryIconProps) {
  const Icon = ICONS[slug] ?? Building2;
  return <Icon size={size} strokeWidth={strokeWidth} className={className} color={color} />;
}
