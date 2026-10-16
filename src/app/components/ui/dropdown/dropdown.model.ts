export interface DropdownOption<T = string> {
  value: T;
  /** Full label displayed inside the dropdown menu (e.g. "English", "Polski", "Español"). */
  label: string;
  /** Optional compact code/label shown on the trigger button (e.g. "EN", "PL", "ES"). */
  shortLabel?: string;
  /** Optional secondary badge or description in the menu item. */
  badge?: string;
  icon?: any;
}
