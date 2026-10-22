import { Provider } from '@/redux/api/provider/types';

export interface Step {
  label: string;
  done: boolean;
  go: () => void;
}

export function stepsFor(
  business: Provider,
  onGoTo: (businessId: string, tab: string) => void,
  onEdit: (businessId: string) => void,
): Step[] {
  const isStore = business.type === 'STORE';
  const id = business.id;
  return [
    { label: 'Add a description', done: !!business.description, go: () => onEdit(id) },
    isStore
      ? {
          label: 'List at least one product',
          done: (business.products?.length ?? 0) > 0,
          go: () => onGoTo(id, 'products'),
        }
      : {
          label: 'List at least one service',
          done: business.services.length > 0,
          go: () => onGoTo(id, 'services'),
        },
    { label: 'Upload photos', done: business.images.length > 0, go: () => onGoTo(id, 'photos') },
    {
      label: 'Set your business hours',
      done: business.businessHours.some((h) => h.isOpen),
      // Service businesses set hours under Calendar; stores have their own Hours tab.
      go: () => onGoTo(id, isStore ? 'hours' : 'calendar'),
    },
    { label: 'Add a contact email', done: !!business.email, go: () => onEdit(id) },
  ];
}

/** Completion of one business's profile — shared by the checklist and the business tiles. */
export function profileProgress(business: Provider): { pct: number; pending: number } {
  const steps = stepsFor(
    business,
    () => undefined,
    () => undefined,
  );
  const pending = steps.filter((st) => !st.done).length;
  return { pct: Math.round(((steps.length - pending) / steps.length) * 100), pending };
}
