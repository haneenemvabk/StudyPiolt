/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#13213a',
    tint: '#1daaa2',
    background: '#f7f8f6',
    foreground: '#13213a',
    card: '#ffffff',
    cardForeground: '#13213a',
    primary: '#1daaa2',
    primaryForeground: '#ffffff',
    secondary: '#e8f0ef',
    secondaryForeground: '#173d45',
    muted: '#edf0ef',
    mutedForeground: '#718087',
    accent: '#f1e6d4',
    accentForeground: '#624d2f',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#dce5e2',
    input: '#dce5e2',
    success: '#4c9b73',
    warning: '#d98b4d',
    navy: '#13213a',
    lilac: '#e9e6f5',
    lilacForeground: '#514a7c',
  },
  dark: {
    text: '#f4f7f4',
    tint: '#4fc4bb',
    background: '#101a2b',
    foreground: '#f4f7f4',
    card: '#18263a',
    cardForeground: '#f4f7f4',
    primary: '#4fc4bb',
    primaryForeground: '#0e2930',
    secondary: '#203445',
    secondaryForeground: '#d7eeea',
    muted: '#203044',
    mutedForeground: '#9cacb4',
    accent: '#403c35',
    accentForeground: '#f2d8b4',
    destructive: '#ff7068',
    destructiveForeground: '#ffffff',
    border: '#2a3b4e',
    input: '#2a3b4e',
    success: '#6ac28d',
    warning: '#e6a36b',
    navy: '#0f1b2e',
    lilac: '#373550',
    lilacForeground: '#d9d5ff',
  },
  radius: 18,
};

export default colors;
