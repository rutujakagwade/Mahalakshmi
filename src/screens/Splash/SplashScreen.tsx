import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { ArrowRight } from 'lucide-react-native';
import { colors, radii, shadows } from '../../theme';

const excavatorImg = require('../../assets/images/splash/excavator.png');
const splashBgImg = require('../../assets/images/splash/splash-bg.png');

interface SplashScreenProps {
  onNavigateNext: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigateNext }) => {
  return (
    <ImageBackground source={splashBgImg} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.container}>
        {/* Branding */}
        <View style={styles.branding}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo/logo.png')}
              accessibilityLabel="Goddess Mahalaxmi"
              style={styles.logoImage}
            />
          </View>

          <Text style={styles.title}>महालक्ष्मी</Text>
          <Text style={styles.subtitle}>इन्फ्रा अँड अर्थमूव्हर्स</Text>

          <View style={styles.divider} />

          <Text style={styles.blessing}>|| श्री महालक्ष्मी प्रसन्न ||</Text>
        </View>

        {/* Excavator Image */}
        <View style={styles.imageContainer}>
          <Image
            source={excavatorImg}
            style={styles.excavatorImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Action */}
        <View style={styles.bottomArea}>
          <AppButton
            title="शुरू करा"
            onPress={onNavigateNext}
            icon={<ArrowRight size={18} color="white" />}
            variant="primary"
            size="lg"
          />
          <Text style={styles.footerText}>
            सुरक्षित आणि 100% ऑफलाइन व्यवस्थापन
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  branding: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  logoWrapper: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 8,
  },
  blessing: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.goldDark,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 12,
    backgroundColor: 'transparent',
  },
  excavatorImage: {
    width: '100%',
    height: '100%',
    maxHeight: 220,
    backgroundColor: 'transparent',
  },
  bottomArea: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    gap: 12,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.goldDark,
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default SplashScreen;
