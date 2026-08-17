import { colors } from './colors';
import { fonts } from './fonts';

export const typography = {
  h1: {
    fontFamily: fonts.bold,
    fontSize: 28,
    fontWeight: '900' as const,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h4: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  bodyBold: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textTertiary,
  },
  captionBold: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textTertiary,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  labelBold: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  stat: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.textPrimary,
  },
  statSmall: {
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  statLarge: {
    fontFamily: fonts.bold,
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  bodyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textPrimary,
  },
};
