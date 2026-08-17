import tw from 'twrnc';
import { View } from 'react-native';
import React, { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';

export const AddCustomerScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = () => {
    if (!name) return alert('नाव टाका');
    alert('ग्राहक जोडला गेला!');
    onBack();
  };

  return (
    <View style={tw`flex-1 bg-[#FAF7F2] text-stone-900`}>
      <AppHeader title="नवीन ग्राहक जोडा" showBack={true} onBackPress={onBack} />
      <View style={tw`p-4 max-w-lg mx-auto space-y-3`}>
        <AppCard style={tw`space-y-3 p-4`}>
          <AppInput label="ग्राहकाचे नाव" value={name} onChangeText={setName} placeholder="उदा. संतोष पाटील" />
          <AppInput label="गाव / ठिकाण" value={location} onChangeText={setLocation} placeholder="उदा. गोकुळ शिरगाव" />
          <AppInput label="मोबाईल नंबर" value={phone} onChangeText={setPhone} placeholder="उदा. 9765432101" keyboardType="phone-pad" />
          <AppButton title="सेव्ह करा" onPress={handleSave} variant="primary" />
        </AppCard>
      </View>
    </View>
  );
};

export default AddCustomerScreen;
