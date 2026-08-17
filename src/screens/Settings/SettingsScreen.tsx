import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { ShieldCheck, HardDrive, Lock, Globe, PhoneCall, Info, LogOut, ChevronRight, User } from 'lucide-react-native';
import { AuthService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout }) => {
  const [businessName, setBusinessName] = useState('महालक्ष्मी इन्फ्रा अँड अर्थमूव्हर्स');
  const [businessSubtitle, setBusinessSubtitle] = useState('|| श्री महालक्ष्मी प्रसन्न ||');

  useEffect(() => {
    AuthService.getProfile().then(res => {
      if (res?.user) {
        setBusinessName(res.user.businessName);
        setBusinessSubtitle(res.user.businessSubtitle);
      }
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // ignore
    }
    onLogout();
  };

  const initials = businessName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.screen}>
      <AppHeader title="सेटिंग" showBack={true} onBackPress={onBack} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileTitle} numberOfLines={1}>{businessName}</Text>
            <Text style={styles.profileSubtitle}>{businessSubtitle}</Text>
          </View>
        </View>

        {/* Security & Backup Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>सुरक्षा व बॅकअप</Text>
          <View style={styles.optionsList}>
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.infoBg }]}>
                  <HardDrive size={16} color={colors.info} />
                </View>
                <Text style={styles.optionLabel}>ऑटो बॅकअप (मोबाईल मध्ये)</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>चालू आहे</Text>
              </View>
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.successBg }]}>
                  <ShieldCheck size={16} color={colors.success} />
                </View>
                <Text style={styles.optionLabel}>डेटा सुरक्षितता</Text>
              </View>
              <Text style={styles.optionValue}>100% ऑफलाइन</Text>
            </View>

            <View style={[styles.optionItem, styles.lastOptionItem]}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.primarySurface }]}>
                  <Lock size={16} color={colors.primary} />
                </View>
                <Text style={styles.optionLabel}>PIN बदला</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>1234</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </View>
            </View>
          </View>
        </View>

        {/* App Info Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>अॅप माहिती</Text>
          <View style={styles.optionsList}>
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.surfaceTertiary }]}>
                  <Globe size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.optionLabel}>भाषा (Language)</Text>
              </View>
              <Text style={styles.optionValueDark}>मराठी</Text>
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.surfaceTertiary }]}>
                  <PhoneCall size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.optionLabel}>मदत व सपोर्ट</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </View>

            <View style={[styles.optionItem, styles.lastOptionItem]}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.surfaceTertiary }]}>
                  <Info size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.optionLabel}>अॅप व्हर्जन</Text>
              </View>
              <Text style={styles.optionValue}>v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutWrapper}>
          <AppButton
            title="लॉगआउट करा"
            icon={<LogOut size={16} color="white" />}
            onPress={handleLogout}
            variant="danger"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 20,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsList: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.xs,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  optionValue: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  optionValueDark: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  logoutWrapper: {
    marginTop: 8,
  },
});

export default SettingsScreen;
