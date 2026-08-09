import { colors } from './colors';
import { fonts } from './fonts';

export const typography = {
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
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
};
