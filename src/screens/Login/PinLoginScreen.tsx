import tw from 'twrnc';
import { View, Text } from 'react-native';
import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react-native';
import PinInput from '../../components/PinBox';

interface PinLoginScreenProps {
  onSuccess: () => void;
}

export const PinLoginScreen: React.FC<PinLoginScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === '1234' || newPin.length === 4) {
            onSuccess();
          } else {
            setErrorMsg('चुकीचा PIN! कृपया पुन्हा प्रयत्न करा.');
            setPin('');
          }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleFingerprint = () => {
    onSuccess();
  };

  return (
    <View style={tw`flex-1 w-full flex flex-col justify-between bg-stone-50 pb-6`}>
      {/* Top Status bar */}
      <View style={tw`flex flex-row items-center justify-between px-5 pt-3`}>
        <Text style={tw`text-xs font-semibold text-stone-700`}>9:30</Text>
        <View style={tw`flex flex-row items-center gap-1.5`}>
          <View style={tw`w-3 h-2 bg-stone-700 rounded-sm`} />
          <View style={tw`w-2.5 h-2 bg-stone-700 rounded-sm`} />
        </View>
      </View>

      {/* Main Lock Section */}
      <View style={tw`flex flex-col items-center pt-8 px-4`}>
        <View style={tw`w-16 h-16 rounded-full bg-[#6B121C] flex items-center justify-center shadow-md mb-3`}>
          <Lock size={28} color="white" />
        </View>

        <Text style={tw`font-bold text-lg text-stone-900 mb-1`}>
          4 अंकी PIN टाका
        </Text>
        <Text style={tw`text-xs text-stone-500 mb-2`}>
          (डेमो PIN: <Text style={tw`font-bold text-[#6B121C]`}>1234</Text> किंवा कोणताही 4 अंक)
        </Text>

        {errorMsg ? (
          <Text style={tw`text-xs text-red-600 font-semibold mb-2`}>
            {errorMsg}
          </Text>
        ) : null}

        <PinInput
          pin={pin}
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onFingerprint={handleFingerprint}
        />
      </View>

      {/* Bottom Offline Safety Badge */}
      <View style={tw`px-6 w-full max-w-xs mx-auto`}>
        <View style={tw`bg-[#6B121C] py-2.5 px-4 rounded-xl flex flex-row items-center justify-center gap-2 shadow-sm`}>
          <ShieldCheck size={16} color="#FBBF24" />
          <Text style={tw`text-white text-xs font-semibold`}>सुरक्षित आणि ऑफलाइन</Text>
        </View>
      </View>
    </View>
  );
};

export default PinLoginScreen;
