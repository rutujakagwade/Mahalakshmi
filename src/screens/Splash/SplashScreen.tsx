import React from 'react';
import { View, Text, Image, StyleSheet, ImageBackground } from 'react-native';
import { Images } from '../../constants/Images';
import { AppButton } from '../../components/AppButton';
import { SvgImage } from '../../components/SvgImage';
import { ArrowRight } from 'lucide-react-native';

const excavatorImg = require('../../assets/images/splash/excavator.png');
const splashBgImg = require('../../assets/images/splash/splash-bg.png');

interface SplashScreenProps {
  onNavigateNext: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigateNext }) => {
  return (
    <ImageBackground source={splashBgImg} style={styles.backgroundImage} resizeMode="cover">
      <View style={styles.container}>

        {/* Main Branding Section */}
        <View style={styles.branding}>
          {/* Deity Icon */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/logo/logo.png')}
              accessibilityLabel="Goddess Mahalaxmi"
              style={styles.logoImage}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>महालक्ष्मी</Text>
          <Text style={styles.subtitle}>इन्फ्रा अँड अर्थमूव्हर्स</Text>

          {/* Subtitle */}
          <Text style={styles.blessing}>|| श्री महालक्ष्मी प्रसन्न ||</Text>
        </View>

        {/* Middle Machinery Image Graphic */}
        <View style={styles.imageContainer}>
          <Image
            source={excavatorImg}
            style={styles.excavatorImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Action Area */}
        <View style={styles.bottomArea}>
          <AppButton
            title="शुरू करा / पुढे जा"
            onPress={onNavigateNext}
            icon={<ArrowRight size={18} color="white" />}
            variant="primary"
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  statusTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403c',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIconItem: {
    width: 12,
    height: 8,
    backgroundColor: '#44403c',
    borderRadius: 2,
  },
  branding: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  logoWrapper: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#6B121C',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7E1522',
    textAlign: 'center',
    marginTop: 2,
  },
  blessing: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350f',
    marginTop: 8,
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
    maxHeight: 240,
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
    color: '#78350f',
    fontWeight: '600',
    opacity: 0.8,
  },
});

export default SplashScreen;