/**
 * Theme Configuration — "Amherst Civic"
 *
 * Central design system for the Town of Amherst app.
 *
 * Palette is sourced directly from the Town's official website
 * (amherst.ca): a civic blue for navigation, headers, and primary
 * actions, and a fresh green accent (used in the Town's site widgets
 * and CTAs) for highlights and success states. Editorial serif
 * headings (Libre Caslon Text) are paired with a clean sans-serif
 * (Work Sans) for body/UI text.
 *
 * Colours target WCAG AA contrast on the light surfaces they sit on.
 * Screens consume these tokens (theme.colors.* / theme.typography.*), so the
 * whole app re-themes from this one file.
 */

// Font family names — must match the keys loaded via useFonts() in app/_layout.tsx.
export const fonts = {
  serif: 'LibreCaslonText_400Regular',
  serifBold: 'LibreCaslonText_700Bold',
  sans: 'WorkSans_400Regular',
  sansMedium: 'WorkSans_500Medium',
  sansSemibold: 'WorkSans_600SemiBold',
  sansBold: 'WorkSans_700Bold',
} as const;

export const theme = {
  colors: {
    // Brand — Amherst civic blue (matches the Town's nav bar & quicklinks)
    brand: '#0A5599',
    brandDark: '#073D6E',
    brandLight: '#3D7EB8',

    // Primary palette (alias of brand for structural elements)
    primary: '#0A5599',
    primaryDark: '#073D6E',
    primaryLight: '#3D7EB8',

    // Secondary / accent — Amherst civic green (matches the Town's site accents)
    secondary: '#009D4B',
    accent: '#009D4B',
    accentDark: '#00703A',
    accentLight: '#BCE9D2',

    // Semantic
    success: '#009D4B',
    warning: '#B45309',
    danger: '#B3261E',
    error: '#B3261E',
    info: '#0A5599',

    // Backgrounds — cool, paper-white tones with a civic-blue tint
    background: '#F2F6FA',        // app background
    backgroundLight: '#FAFCFE',   // near-white
    backgroundElevated: '#FFFFFF',

    // Surfaces
    surface: '#E7F0F7',           // pale blue container (chips/badges)
    surfaceElevated: '#FFFFFF',   // cards
    surfaceLight: '#DCE7F0',      // pale blue, subtle fills

    // Common UI neutrals (blue-charcoal family, softer than pure black)
    white: '#FFFFFF',
    nearWhite: '#F5F9FC',
    lightGray: '#DCE7F0',
    mediumGray: '#8A99A8',
    darkGray: '#54626F',
    almostBlack: '#131B24',
    darkText: '#16222E',
    mediumText: '#3E4B58',
    lightText: '#131B24',

    // Highlights (soft civic green, echoes the Town's CTA green)
    highlightYellow: '#E6F5EC',
    highlightYellowBorder: '#7FCDA0',
    highlightGold: '#009D4B',

    // Text hierarchy (on light-blue / white)
    text: '#131B24',
    textPrimary: '#16222E',
    textSecondary: '#3E4B58',
    textMuted: '#5C6B79',
    textDisabled: '#9AA8B5',

    // Borders & dividers (blue-tinted)
    border: '#C9D8E3',
    borderLight: '#D9E4ED',
    divider: '#E1EBF1',

    // Tabs
    tabActive: '#0A5599',
    tabInactive: '#8A99A8',

    // Gradients
    gradientPrimary: ['#0A5599', '#3D7EB8'],
    gradientBrand: ['#0A5599', '#073D6E'],
    gradientDark: ['#FAFCFE', '#F2F6FA'],
    gradientAccent: ['#BCE9D2', '#009D4B'],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    // Display — hero editorial serif
    display: {
      fontFamily: fonts.serifBold,
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 42,
      letterSpacing: -0.4,
    },
    // Title — page headers (serif)
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    // Heading — section & card titles (serif)
    heading: {
      fontFamily: fonts.serifBold,
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 29,
      letterSpacing: -0.2,
    },
    // Subheading (serif)
    subheading: {
      fontFamily: fonts.serifBold,
      fontSize: 18,
      fontWeight: '700' as const,
      lineHeight: 25,
      letterSpacing: 0,
    },
    // Body — Work Sans
    body: {
      fontFamily: fonts.sans,
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    // Body emphasized
    bodyBold: {
      fontFamily: fonts.sansSemibold,
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    // Caption — metadata
    caption: {
      fontFamily: fonts.sansMedium,
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    // Small — fine print
    small: {
      fontFamily: fonts.sansMedium,
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 18,
      letterSpacing: 0.2,
    },
    // Label — uppercase overline label-caps
    label: {
      fontFamily: fonts.sansSemibold,
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 16,
      letterSpacing: 1.4,
      textTransform: 'uppercase' as const,
    },
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    // Diffused, low-opacity, civic-blue-tinted shadows
    small: {
      shadowColor: '#0A5599',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#0A5599',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    },
    large: {
      shadowColor: '#0A5599',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0A5599',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 12,
    },
  },
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export type Theme = typeof theme;
