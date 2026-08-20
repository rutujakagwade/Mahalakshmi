import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import tw from 'twrnc';
import { SafeStorage } from '../../utils/storage';
import { AppHeader } from '../../components/AppHeader';
import { AppButton } from '../../components/AppButton';
import {
  ShieldCheck,
  HardDrive,
  Lock,
  Globe,
  PhoneCall,
  Info,
  LogOut,
  ChevronRight,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { AuthService } from '../../utils/api';
import { colors, radii } from '../../theme';
import PinInput from '../../components/PinBox';

// ─── PIN Change Modal ───────────────────────────────────────────────────────

type PinStep = 'current' | 'new' | 'confirm';

interface ChangePinModalProps {
  visible: boolean;
  onClose: () => void;
}

const stepConfig: Record<PinStep, { title: string; subtitle: string }> = {
  current: { title: 'सध्याचा PIN', subtitle: 'आपला सध्याचा 4 अंकी PIN टाका' },
  new:     { title: 'नवीन PIN',   subtitle: 'नवीन 4 अंकी PIN निवडा' },
  confirm: { title: 'PIN पुष्टी',  subtitle: 'नवीन PIN पुन्हा टाका' },
};

const ChangePinModal: React.FC<ChangePinModalProps> = ({ visible, onClose }) => {
  const [step, setStep] = useState<PinStep>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);

  // active pin for the current step
  const activePin =
    step === 'current' ? currentPin :
    step === 'new'     ? newPin     :
                         confirmPin;

  const setActivePin = (val: string) => {
    if (step === 'current') { setCurrentPin(val); }
    else if (step === 'new') { setNewPin(val); }
    else { setConfirmPin(val); }
  };

  const handleClose = () => {
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setErrorMsg('');
    setLoading(false);
    setSuccess(false);
    onClose();
  };

  const handleKeyPress = (num: string) => {
    if (activePin.length < 4 && !loading) {
      const next = activePin + num;
      setActivePin(next);
      setErrorMsg('');
      if (next.length === 4) {
        setTimeout(() => advanceStep(next), 150);
      }
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setActivePin(activePin.slice(0, -1));
      setErrorMsg('');
    }
  };

  const advanceStep = async (pin: string) => {
    if (step === 'current') {
      setStep('new');
    } else if (step === 'new') {
      setStep('confirm');
    } else {
      // confirm step — validate and call API
      if (pin !== newPin) {
        setErrorMsg('PIN जुळत नाही! पुन्हा प्रयत्न करा.');
        setConfirmPin('');
        return;
      }
      setLoading(true);
      try {
        await AuthService.updatePin(currentPin, newPin);
        setSuccess(true);
        setTimeout(() => handleClose(), 1800);
      } catch (err: any) {
        setErrorMsg(err.message || 'PIN बदलणे अयशस्वी झाले.');
        // reset to start
        setStep('current');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      } finally {
        setLoading(false);
      }
    }
  };

  const stepIndex = step === 'current' ? 0 : step === 'new' ? 1 : 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={modalStyles.container}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>PIN बदला</Text>
          <TouchableOpacity onPress={handleClose} style={modalStyles.closeBtn}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={modalStyles.stepRow}>
          {(['current', 'new', 'confirm'] as PinStep[]).map((s, i) => (
            <View key={s} style={modalStyles.stepItemRow}>
              <View
                style={[
                  modalStyles.stepDot,
                  i < stepIndex && modalStyles.stepDotDone,
                  i === stepIndex && modalStyles.stepDotActive,
                ]}
              >
                {i < stepIndex
                  ? <CheckCircle size={14} color="white" />
                  : <Text style={[modalStyles.stepNum, i === stepIndex && modalStyles.stepNumActive]}>
                      {i + 1}
                    </Text>
                }
              </View>
              {i < 2 && (
                <View style={[modalStyles.stepLine, i < stepIndex && modalStyles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        {/* Content */}
        {success ? (
          <View style={modalStyles.successBox}>
            <View style={modalStyles.successIcon}>
              <CheckCircle size={48} color={colors.success} />
            </View>
            <Text style={modalStyles.successTitle}>PIN यशस्वीरित्या बदलला!</Text>
            <Text style={modalStyles.successSub}>आता नवीन PIN वापरून लॉगिन करा.</Text>
          </View>
        ) : (
          <View style={modalStyles.pinArea}>
            <Text style={modalStyles.stepTitle}>{stepConfig[step].title}</Text>
            <Text style={modalStyles.stepSub}>{stepConfig[step].subtitle}</Text>

            {loading && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 8 }} />
            )}

            {errorMsg ? (
              <View style={modalStyles.errorBox}>
                <Text style={modalStyles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <PinInput
              pin={activePin}
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── Language Selection Modal ───────────────────────────────────────────────

interface LanguageModalProps {
  visible: boolean;
  selectedLanguage: 'mr' | 'hi' | 'en';
  onSelectLanguage: (code: 'mr' | 'hi' | 'en') => void;
  onClose: () => void;
}

const LanguageModal: React.FC<LanguageModalProps> = ({
  visible,
  selectedLanguage,
  onSelectLanguage,
  onClose,
}) => {
  const languages: { id: 'mr' | 'hi' | 'en'; name: string; subtitle: string; flag: string }[] = [
    {
      id: 'mr',
      name: 'मराठी',
      subtitle: 'मराठी भाषा (Default)',
      flag: '🚩',
    },
    {
      id: 'hi',
      name: 'हिंदी',
      subtitle: 'हिंदी भाषा (Hindi)',
      flag: '🇮🇳',
    },
    {
      id: 'en',
      name: 'English',
      subtitle: 'English Language',
      flag: '🌐',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.langOverlay}>
        <View style={modalStyles.langCard}>
          {/* Header */}
          <View style={modalStyles.langHeader}>
            <View style={tw`flex flex-row items-center gap-2`}>
              <View style={modalStyles.langIconBox}>
                <Globe size={18} color={colors.primary} />
              </View>
              <Text style={modalStyles.langTitle}>भाषा निवडा (Select Language)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={modalStyles.langCloseBtn} activeOpacity={0.7}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={modalStyles.langList}>
            {languages.map((item) => {
              const isSelected = selectedLanguage === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectLanguage(item.id)}
                  activeOpacity={0.75}
                  style={[
                    modalStyles.langOptionItem,
                    isSelected && modalStyles.langOptionItemSelected,
                  ]}
                >
                  <View style={tw`flex flex-row items-center gap-3`}>
                    <Text style={tw`text-2xl`}>{item.flag}</Text>
                    <View>
                      <Text
                        style={[
                          modalStyles.langOptionName,
                          isSelected && { color: colors.primary, fontWeight: '800' },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={modalStyles.langOptionSub}>{item.subtitle}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <CheckCircle size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Note */}
          <View style={tw`pt-2`}>
            <TouchableOpacity
              onPress={onClose}
              style={modalStyles.cancelBtn}
              activeOpacity={0.8}
            >
              <Text style={modalStyles.cancelBtnText}>रद्द करा (Cancel)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Settings Screen ────────────────────────────────────────────────────────

interface SettingsScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onLogout }) => {
  const [businessName, setBusinessName] = useState('महालक्ष्मी इन्फ्रा');
  const [businessSubtitle, setBusinessSubtitle] = useState('|| श्री महालक्ष्मी प्रसन्न ||');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'mr' | 'hi' | 'en'>('mr');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // Load saved language preference
    SafeStorage.getItem('@mahalaxmi_app_language')
      .then((val) => {
        if (val === 'hi' || val === 'en' || val === 'mr') {
          setSelectedLanguage(val);
        }
      })
      .catch(() => {});

    // Load profile
    AuthService.getProfile()
      .then((res) => {
        if (res?.user) {
          setBusinessName(res.user.businessName);
          setBusinessSubtitle(res.user.businessSubtitle);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectLanguage = async (code: 'mr' | 'hi' | 'en') => {
    setSelectedLanguage(code);
    await SafeStorage.setItem('@mahalaxmi_app_language', code);
    setLangModalVisible(false);

    const msg =
      code === 'mr'
        ? 'मराठी भाषा निवडली आहे!'
        : code === 'hi'
        ? 'हिंदी भाषा चुनी गई है!'
        : 'English language selected!';
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const getLanguageDisplayName = () => {
    if (selectedLanguage === 'hi') return 'हिंदी';
    if (selectedLanguage === 'en') return 'English';
    return 'मराठी';
  };

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
      <AppHeader title="ॲप सेटिंग्ज" showBack={true} onBackPress={onBack} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Toast Notification Banner */}
        {toastMsg ? (
          <View style={tw`bg-[${colors.successBg}] border border-green-200 rounded-xl py-3 px-4 flex flex-row items-center gap-2`}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={tw`text-xs font-bold text-[${colors.success}]`}>{toastMsg}</Text>
          </View>
        ) : null}

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

            {/* ✅ PIN बदला — tappable */}
            <TouchableOpacity
              style={[styles.optionItem, styles.lastOptionItem]}
              onPress={() => setPinModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.primarySurface }]}>
                  <Lock size={16} color={colors.primary} />
                </View>
                <Text style={styles.optionLabel}>PIN बदला</Text>
              </View>
              <View style={styles.optionRight}>
                <ChevronRight size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info Group */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>ॲप माहिती व सेटिंग्ज</Text>
          <View style={styles.optionsList}>
            {/* ✅ Language Selection Row (Clickable) */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.surfaceTertiary }]}>
                  <Globe size={16} color={colors.textSecondary} />
                </View>
                <Text style={styles.optionLabel}>भाषा (Language)</Text>
              </View>
              <View style={tw`flex flex-row items-center gap-1.5`}>
                <Text style={styles.optionValueDark}>{getLanguageDisplayName()}</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>

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
                <Text style={styles.optionLabel}>ॲप व्हर्जन</Text>
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

      {/* PIN Change Modal */}
      <ChangePinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
      />

      {/* Language Selection Modal */}
      <LanguageModal
        visible={langModalVisible}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={handleSelectLanguage}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.success,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  stepLineDone: {
    backgroundColor: colors.success,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stepNumActive: {
    color: colors.white,
  },
  pinArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radii.lg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error,
    textAlign: 'center',
  },
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  /* Language Modal Styles */
  langOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  langCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  langIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  langCloseBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.surfaceTertiary,
  },
  langList: {
    gap: 10,
  },
  langOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  langOptionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  langOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  langOptionSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 1,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

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
    gap: 16,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  optionsList: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
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
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  optionValue: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  optionValueDark: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  logoutWrapper: {
    paddingTop: 8,
  },
});

export default SettingsScreen;
