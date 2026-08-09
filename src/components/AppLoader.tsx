import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';

export const AppLoader: React.FC<{ message?: string }> = ({ message = 'लोड होत आहे...' }) => {
  return (
    <View style={tw`flex flex-col items-center justify-center p-8 gap-3`}>
      <View style={tw`w-10 h-10 border-4 border-[#6B121C] border-t-transparent rounded-full animate-spin`}></View>
      <Text style={tw`text-sm font-medium text-stone-600`}>{message}</Text>
    </View>
  );
};

export default AppLoader;
