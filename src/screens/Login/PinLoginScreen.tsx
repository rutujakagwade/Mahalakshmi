import tw from 'twrnc';
import { View, Text, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye } from 'lucide-react-native';
import PinInput from '../../components/PinBox';
import { AuthService } from '../../utils/api';
import { colors } from '../../theme';

interface PinLoginScreenProps {
  onSuccess: () => void;
}

export const PinLoginScreen: React.FC<PinLoginScreenProps> = ({ onSuccess }) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const attemptLogin = async (enteredPin: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await AuthService.login(enteredPin);
      onSuccess();
    } catch (err: any) {
      if (enteredPin === '1234' || enteredPin.length === 4) {
        onSuccess();
      } else {
        setErrorMsg(err.message || 'चुकीचा PIN! कृपया पुन्हा प्रयत्न करा.');
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !loading) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        setTimeout(() => {
          attemptLogin(newPin);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (!loading) {
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleFingerprint = () => {
    onSuccess();
  };

  return (
    <View style={tw`flex-1 w-full flex flex-col justify-between bg-[${colors.background}] pb-6`}>
      {/* Top Status */}
      <View style={tw`flex flex-row items-center justify-between px-5 pt-3`}>
        <Text style={tw`text-xs font-semibold text-[${colors.textTertiary}]`}>9:30</Text>
        <View style={tw`flex flex-row items-center gap-1.5`}>
          <View style={tw`w-3 h-2 bg-[${colors.textTertiary}] rounded-sm`} />
          <View style={tw`w-2.5 h-2 bg-[${colors.textTertiary}] rounded-sm`} />
        </View>
      </View>

      {/* Main Lock Section */}
      <View style={tw`flex flex-col items-center pt-8 px-4`}>
        {/* Brand Logo */}
        <View style={tw`w-20 h-20 rounded-3xl bg-[${colors.primary}] items-center justify-center mb-4`}>
          <Lock size={32} color="white" />
        </View>

        <Text style={tw`font-bold text-xl text-[${colors.textPrimary}] mb-1`}>
          PIN प्रवेश
        </Text>
        <Text style={tw`text-sm text-[${colors.textSecondary}] mb-1`}>
          4 अंकी PIN टाका
        </Text>
        <Text style={tw`text-xs text-[${colors.textTertiary}] mb-4`}>
          (डेमो PIN: <Text style={tw`font-bold text-[${colors.primary}]`}>1234</Text> किंवा कोणताही 4 अंक)
        </Text>

        {loading && (
          <View style={tw`mb-3`}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {errorMsg ? (
          <View style={tw`bg-[${colors.errorBg}] border border-red-200 rounded-xl px-4 py-2.5 mb-3`}>
            <Text style={tw`text-xs text-[${colors.error}] font-semibold text-center`}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        <PinInput
          pin={pin}
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onFingerprint={handleFingerprint}
        />
      </View>

      {/* Bottom Safety Badge */}
      <View style={tw`px-6 w-full max-w-xs mx-auto`}>
        <View style={tw`bg-[${colors.primary}] py-3 px-4 rounded-2xl flex flex-row items-center justify-center gap-2`}>
          <ShieldCheck size={16} color={colors.gold} />
          <Text style={tw`text-white text-xs font-semibold`}>सुरक्षित आणि ऑफलाइन</Text>
        </View>
      </View>
    </View>
  );
};

export default PinLoginScreen;
