export const colors = {
  bg: '#FCF9F2',
  surface: '#F6F3EC',
  surfaceAlt: '#F1EEE7',
  surfaceTile: '#EBE8E1',
  card: '#FFFFFF',
  cardBorder: 'rgba(57, 105, 52, 0.05)',
  cardBorderTan: 'rgba(193, 201, 187, 0.2)',
  border: '#E5E2DB',
  borderRing: '#C1C9BB',

  primary: '#396934',
  primaryDeep: '#3D5E38',
  primaryMid: '#6B9E63',
  primaryDeeper: '#344D30',
  primarySubdued: '#496B44',
  primaryEyebrow: '#456740',
  primaryOlive: '#4B6546',
  primaryMoss: '#7D9977',

  mint: '#C4EAB9',
  mintLight: '#CDEBC4',

  text: '#1C1C18',
  textBody: '#42493F',
  textMuted: '#72796E',
  textOnDark: '#FFFFFF',

  ringOuter: 'rgba(57, 105, 52, 0.1)',
  ringInner: 'rgba(57, 105, 52, 0.2)',

  success: '#396934',

  navBar: 'rgba(245, 242, 235, 0.92)',
  navBorder: 'rgba(212, 228, 208, 0.4)',
  navInactive: 'rgba(107, 158, 99, 0.7)',

  cellEmpty: '#E5E2DB',
  cellLow: '#C4EAB9',
  cellMid: '#6B9E63',
  cellHigh: '#396934',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 9999,
};

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

export const text = {
  hero: { fontFamily: fonts.extrabold, fontSize: 72, lineHeight: 72, letterSpacing: -3.6 },
  display: { fontFamily: fonts.bold, fontSize: 40, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 30 },
  h3: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  cta: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyTight: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 0.14 },
  caption: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.24 },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2 },
  eyebrowLoose: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 2.4 },
  navLabel: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.275 },
  micro: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 14 },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSoft: {
    shadowColor: '#3D5E38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cta: {
    shadowColor: '#396934',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
  ctaSoft: {
    shadowColor: '#396934',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};
