import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import { colors, radii, shadows } from '../theme';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: { maxWidth: SCREEN_WIDTH * 0.85 },
    md: { maxWidth: SCREEN_WIDTH * 0.92 },
    lg: { maxWidth: SCREEN_WIDTH * 0.95 },
    full: { maxWidth: SCREEN_WIDTH * 0.98 },
  };

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalBox, sizeStyles[size]]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close modal"
              activeOpacity={0.7}
            >
              <X size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: colors.white,
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.white,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  body: {
    padding: 16,
  },
});

export default AppModal;
