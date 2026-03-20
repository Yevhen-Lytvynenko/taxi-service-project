/**
 * Strum brand design system
 * Colors: #1a1a1a (dark), #ffffff (white), #ffd451 (accent)
 */

export const colors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  primary: '#ffd451',
  onPrimary: '#1a1a1a',
  onBackground: '#1a1a1a',
  onSurface: '#1a1a1a',
  onSurfaceMuted: '#666666',
  border: '#e0e0e0',
  error: '#ff5252',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 28,
  },
} as const;
