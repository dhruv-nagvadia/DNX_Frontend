import {
  Baby,
  Car,
  Command,
  Dog,
  Droplet,
  Dumbbell,
  Eye,
  Flower2,
  Hand,
  HeartPulse,
  Paintbrush,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
  WavesVertical,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * A display icon for a service, picked from keywords in its name — services
 * have no icon/photo field, so this keeps lists scannable ("Beard Grooming" →
 * face, "Full Body Massage" → lotus …). Shared by the Services and Bookings
 * screens so the same service always gets the same icon. First match wins.
 */
const RULES: [RegExp, LucideIcon][] = [
  [/beard|shave|moustache|mustache/i, Smile],
  [/colou?r|dye|highlight|henna|paint/i, Paintbrush],
  [/spa|steam|scalp|keratin|smooth/i, WavesVertical],
  [/massage|therapy|relax|ayur/i, Flower2],
  [/facial|cleanup|clean-up|skin|glow|bleach|makeup|make-up|bridal/i, Sparkles],
  [/mani|pedi|nail|hand/i, Hand],
  [/wax|thread|brow|lash|eye/i, Eye],
  [/hair|cut|trim|style|blow/i, Scissors],
  [/wash|clean|laundry|bath/i, Droplet],
  [/gym|fitness|yoga|train|workout/i, Dumbbell],
  [/doctor|clinic|check|consult|dental|physio/i, Stethoscope],
  [/health|heart|care/i, HeartPulse],
  [/kid|child|baby/i, Baby],
  [/pet|dog|cat|groom/i, Dog],
  [/car|bike|vehicle/i, Car],
  [/repair|fix|install|service|plumb|electric/i, Wrench],
];

export function serviceIcon(name: string): LucideIcon {
  for (const [pattern, Icon] of RULES) {
    if (pattern.test(name)) {
      return Icon;
    }
  }
  return Command;
}
