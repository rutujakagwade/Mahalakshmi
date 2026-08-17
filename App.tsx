import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import tw from 'twrnc';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaView style={tw`flex-1 bg-[${colors.background}]`}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <RootNavigator />
    </SafeAreaView>
  );
}
