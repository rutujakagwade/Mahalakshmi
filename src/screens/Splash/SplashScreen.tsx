import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, TouchableOpacity, Dimensions } from 'react-native';

const flashScreenImg = require('../../assets/images/splash/flashscreen.png');
const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onNavigateNext: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigateNext }) => {
  useEffect(() => {
    // Automatically redirect to PIN screen after 3 seconds
    const timer = setTimeout(() => {
      onNavigateNext();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onNavigateNext]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onNavigateNext}
      style={styles.container}
    >
      <StatusBar hidden={false} barStyle="light-content" translucent backgroundColor="transparent" />
      <Image
        source={flashScreenImg}
        style={styles.image}
        resizeMode="cover"
        fadeDuration={0}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default SplashScreen;
