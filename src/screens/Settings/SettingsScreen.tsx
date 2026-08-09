import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import { ShieldCheck, HardDrive, Lock, Globe, PhoneCall, Info, LogOut } from 'lucide-react-native';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout }) => {
  return (
    <View style={styles.screen}>
      <AppHeader title="सेटिंग" showBack={true} onBackPress={onBack} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileTitle}>महालक्ष्मी इन्फ्रा अँड अर्थमूव्हर्स</Text>
            <Text style={styles.profileSubtitle}>|| श्री महालक्ष्मी प्रसन्न ||</Text>
          </View>
        </View>

        {/* Security & Backup Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>सुरक्षा व बॅकअप</Text>

          <View style={styles.optionsList}>
            {/* Option 1 */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <HardDrive size={18} color="#6B121C" />
                <Text style={styles.optionLabel}>ऑटो बॅकअप (मोबाईल मध्ये)</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>चालू आहे</Text>
              </View>
            </View>

            {/* Option 2 */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <ShieldCheck size={18} color="#6B121C" />
                <Text style={styles.optionLabel}>डेटा सुरक्षितता</Text>
              </View>
              <Text style={styles.optionValue}>100% ऑफलाइन</Text>
            </View>

            {/* Option 3 */}
            <View style={[styles.optionItem, styles.lastOptionItem]}>
              <View style={styles.optionLeft}>
                <Lock size={18} color="#6B121C" />
                <Text style={styles.optionLabel}>PIN बदला</Text>
              </View>
              <Text style={styles.optionValue}>1234</Text>
            </View>
          </View>
        </View>

        {/* App Info Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>अॅप माहिती</Text>

          <View style={styles.optionsList}>
            {/* Option 1 */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Globe size={18} color="#57534e" />
                <Text style={styles.optionLabel}>भाषा (Language)</Text>
              </View>
              <Text style={styles.optionValueDark}>मराठी</Text>
            </View>

            {/* Option 2 */}
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <PhoneCall size={18} color="#57534e" />
                <Text style={styles.optionLabel}>मदत व सपोर्ट</Text>
              </View>
            </View>

            {/* Option 3 */}
            <View style={[styles.optionItem, styles.lastOptionItem]}>
              <View style={styles.optionLeft}>
                <Info size={18} color="#57534e" />
                <Text style={styles.optionLabel}>अॅप व्हर्जन</Text>
              </View>
              <Text style={styles.optionValue}>v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Lock / Logout Button */}
        <View style={styles.logoutWrapper}>
          <AppButton
            title="अॅप लॉक करा (लॉगआउट)"
            icon={<LogOut size={16} color="white" />}
            onPress={onLogout}
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
    backgroundColor: '#FAF7F2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B121C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fde047',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginTop: 2,
    fontWeight: '500',
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534e',
    paddingHorizontal: 4,
  },
  optionsList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#292524',
  },
  badge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  optionValue: {
    fontSize: 13,
    color: '#78716c',
  },
  optionValueDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#44403c',
  },
  logoutWrapper: {
    marginTop: 8,
  },
});

export default SettingsScreen;
