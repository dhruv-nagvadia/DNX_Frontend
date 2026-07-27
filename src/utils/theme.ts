/**
 * Design tokens for use in TypeScript (rarely needed — prefer the CSS
 * variables in src/styles/theme.css from within .module.css files).
 * Keep these values in sync with theme.css.
 */
export const Spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const Breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
} as const;
