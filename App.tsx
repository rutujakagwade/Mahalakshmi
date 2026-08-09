import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import tw from 'twrnc';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaView style={tw`flex-1 bg-stone-900`}>
      <StatusBar barStyle="light-content" backgroundColor="#6B121C" />
      <RootNavigator />
    </SafeAreaView>
  );
}
