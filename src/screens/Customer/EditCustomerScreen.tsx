import tw from 'twrnc';
import { View } from 'react-native';
import React, { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';

export const EditCustomerScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [name, setName] = useState('संतोष पाटील');
  const [location, setLocation] = useState('गोकुळ शिरगाव');
  const [phone, setPhone] = useState('9765432101');

  const handleSave = () => {
    alert('ग्राहक अपडेट झाला!');
    onBack();
  };

  return (
    <View style={tw`flex-1 bg-[#FAF7F2] text-stone-900`}>
      <AppHeader title="ग्राहक संपादित करा" showBack={true} onBackPress={onBack} />
      <View style={tw`p-4 max-w-lg mx-auto space-y-3`}>
        <AppCard style={tw`space-y-3 p-4`}>
          <AppInput label="ग्राहकाचे नाव" value={name} onChangeText={setName} />
          <AppInput label="गाव / ठिकाण" value={location} onChangeText={setLocation} />
          <AppInput label="मोबाईल नंबर" value={phone} onChangeText={setPhone} type="tel" />
          <AppButton title="अपडेट करा" onPress={handleSave} variant="primary" />
        </AppCard>
      </View>
    </View>
  );
};

export default EditCustomerScreen;
