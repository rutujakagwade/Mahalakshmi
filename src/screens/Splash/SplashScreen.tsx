import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../theme/colors';

const flashScreenImg = require('../../assets/images/splash/flashscreen.png');
const logoImg = require('../../assets/images/logo/logo.png');

interface SplashScreenProps {
  onNavigateNext: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigateNext }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const bottomFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(bottomFadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate after 2.8 seconds
    const timer = setTimeout(() => {
      onNavigateNext();
    }, 2800);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, bottomFadeAnim, onNavigateNext]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onNavigateNext}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Decorative ambient background glows */}
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      {/* Main Content Area */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.imageWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={flashScreenImg}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom Footer Section */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: bottomFadeAnim,
          },
        ]}
      >
        <ActivityIndicator
          size="small"
          color={colors.gold || '#D4AF37'}
          style={styles.loader}
        />
        <Text style={styles.footerText}>महालक्ष्मी अर्थमूव्हर्स</Text>
        <Text style={styles.versionText}>v1.0.0 • सुरक्षित आणि विश्वसनीय</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#38070D', // Deep premium burgundy matching brand
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  topGlow: {
    position: 'absolute',
    top: -80,
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: 'rgba(107, 18, 28, 0.45)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -100,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: (width * 1.1) / 2,
    backgroundColor: 'rgba(74, 11, 18, 0.6)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: '100%',
    maxHeight: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  splashImage: {
    width: Math.min(width * 0.9, 420),
    height: Math.min(width * 0.9, 420),
    maxWidth: '100%',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  loader: {
    marginBottom: 12,
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  versionText: {
    color: colors.goldLight || '#FEF3C7',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.85,
  },
});

export default SplashScreen;
