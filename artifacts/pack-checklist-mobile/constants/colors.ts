/**
 * Design tokens derived from the sibling web app (pack-checklist/src/index.css).
 * Earthy / Muted Forest palette — HSL values converted to hex.
 */
const colors = {
  light: {
    text: '#202E25',
    tint: '#4A6B52',

    background: '#F8F6F2',
    foreground: '#202E25',

    card: '#FFFFFF',
    cardForeground: '#202E25',

    primary: '#4A6B52',
    primaryForeground: '#F8F6F2',

    secondary: '#D9E2DA',
    secondaryForeground: '#2A3D2F',

    muted: '#E6EDE7',
    mutedForeground: '#697468',

    accent: '#EAE6DF',
    accentForeground: '#202E25',

    destructive: '#B55B32',
    destructiveForeground: '#F8F6F2',

    border: '#D1DBD2',
    input: '#D1DBD2',
  },

  dark: {
    text: '#E8F0EA',
    tint: '#7AA882',

    background: '#111A14',
    foreground: '#E8F0EA',

    card: '#1A2620',
    cardForeground: '#E8F0EA',

    primary: '#7AA882',
    primaryForeground: '#111A14',

    secondary: '#263B2C',
    secondaryForeground: '#C0D4C4',

    muted: '#1E2E23',
    mutedForeground: '#8DA892',

    accent: '#243020',
    accentForeground: '#E8F0EA',

    destructive: '#C96B40',
    destructiveForeground: '#111A14',

    border: '#2E4035',
    input: '#2E4035',
  },

  radius: 8,
};

export default colors;
