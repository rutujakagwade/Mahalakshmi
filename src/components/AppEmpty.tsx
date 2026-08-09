import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';
import { Images } from '../constants/Images';
import { SvgImage } from './SvgImage';

export const EmptyView: React.FC<{ message?: string }> = ({ message = 'कोणताही डेटा उपलब्ध नाही' }) => {
  return (
    <View style={tw`flex flex-col items-center justify-center p-8 gap-3 text-center`}>
      <SvgImage source={Images.common.noData} accessibilityLabel="No Data" style={tw`w-20 h-20 opacity-60`} />
      <Text style={tw`text-sm font-medium text-stone-500`}>{message}</Text>
    </View>
  );
};

export default EmptyView;
