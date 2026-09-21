export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
}
