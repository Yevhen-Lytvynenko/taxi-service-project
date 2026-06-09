/**
 * Мобільний UI у дусі таксі-додатків (Uklon): білий фон, жовтий акцент, мінімум шуму.
 */

export const colors = {
  background: '#FFFFFF',
  backgroundMuted: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSelected: '#FFFDF0',
  primary: '#FFDD2D',
  onPrimary: '#1A1A1A',
  onBackground: '#1A1A1A',
  onSurface: '#1A1A1A',
  onSurfaceMuted: '#8E8E93',
  border: '#E5E5EA',
  focusBorder: '#1A1A1A',
  error: '#FF3B30',
} as const;

/** Press, focus, disabled — use with Pressable / TextInput */
export const interaction = {
  pressedOpacity: 0.88,
  disabledOpacity: 0.45,
  chipPressedScale: 0.98,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
} as const;

/**
 * Нижня панель над мапою (оформлення замовлення / трекінг): скруглення + обрізання,
 * щоб фон ScrollView не «проступав» за радіус.
 */
export const mapBottomSheet = {
  backgroundColor: colors.surface,
  borderTopLeftRadius: radius.lg,
  borderTopRightRadius: radius.lg,
  overflow: 'hidden' as const,
};

/** ScrollView усередині такої панелі — без власного фону (лише контент). */
export const mapBottomSheetScroll = {
  backgroundColor: 'transparent' as const,
};

export const typography = {
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semiBold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 22,
    xxl: 26,
  },
} as const;
