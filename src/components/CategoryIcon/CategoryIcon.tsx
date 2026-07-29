import {
  Stethoscope,
  Scissors,
  Dumbbell,
  GraduationCap,
  Wrench,
  Car,
  Briefcase,
  Camera,
  Store,
  UtensilsCrossed,
  Landmark,
  Boxes,
  Building2,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  healthcare: Stethoscope,
  beauty: Scissors,
  fitness: Dumbbell,
  education: GraduationCap,
  home: Wrench,
  automotive: Car,
  professional: Briefcase,
  events: Camera,
  retail: Store,
  food: UtensilsCrossed,
  government: Landmark,
  other: Boxes,
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
