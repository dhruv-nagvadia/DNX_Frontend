import { ReactNode } from 'react';

export interface OptionSectionProps {
  /** Becomes the checkbox's id/name, so it must be unique on the page. */
  name: string;
  label: string;
  /** A line explaining what ticking it does. */
  description?: string;
  /** A small icon beside the label. */
  icon?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Heading of the mini-section that opens underneath when it's ticked. */
  settingsTitle?: string;
  disabled?: boolean;
  /** The settings that appear (in their own mini-section) when ticked. Optional. */
  children?: ReactNode;
}
