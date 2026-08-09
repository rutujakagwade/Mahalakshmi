import tw from 'twrnc';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Calendar } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';

interface DailyEntryScreenProps {
  onBack: () => void;
}

export const DailyEntryScreen: React.FC<DailyEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>('20/05/2024');
  const [entryType, setEntryType] = useState<'earnings' | 'expense'>('earnings');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('रोख');
  const [notes, setNotes] = useState<string>('');

  // Summary state
  const [summary, setSummary] = useState({
    earnings: 12450,
    expense: 4320,
    profit: 8130,
  });

  const [savedMessage, setSavedMessage] = useState<string>('');

  const handleSave = () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 && !description) {
      alert('कृपया वर्णन व योग्य रक्कम टाका');
      return;
    }

    if (entryType === 'earnings') {
      const newEarnings = summary.earnings + numAmount;
      const newProfit = newEarnings - summary.expense;
      setSummary({ ...summary, earnings: newEarnings, profit: newProfit });
    } else {
      const newExpense = summary.expense + numAmount;
      const newProfit = summary.earnings - newExpense;
      setSummary({ ...summary, expense: newExpense, profit: newProfit });
    }

    setSavedMessage('नोंद यशस्वीरित्या सेव्ह झाली!');
    setDescription('');
    setAmount('');
    setNotes('');

    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <View style={tw`flex-1 w-full bg-[#FAF7F2] text-stone-900 select-none`}>
      <AppHeader
        title="रोजचा हिशोब"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
        onRightActionPress={() => setDate(getTodayFormatted())}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-8`}>
        {savedMessage && (
          <View style={tw`bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl text-center`}>
            {savedMessage}
          </View>
        )}

        {/* Form Container */}
        <AppCard style={tw`space-y-3.5 p-4 shadow-sm`}>
          {/* Date Input */}
          <AppDatePicker
            label="दिनांक"
            value={date}
            onChange={setDate}
          />

          {/* Type Toggle Tabs (Earnings vs Expense) */}
          <View style={tw`flex-row gap-2 p-1 bg-stone-100 rounded-xl`}>
            <TouchableOpacity
              onPress={() => setEntryType('earnings')}
              style={tw`flex-1 py-2 rounded-lg ${entryType === 'earnings'
                  ? 'bg-emerald-700'
                  : 'bg-transparent'
                }`}
            >
              <Text
                style={tw`text-xs font-bold text-center ${entryType === 'earnings'
                    ? 'text-white'
                    : 'text-stone-600'
                  }`}
              >
                कमाई (आवक)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEntryType('expense')}
              style={tw`flex-1 py-2 rounded-lg ${entryType === 'expense'
                  ? 'bg-red-600'
                  : 'bg-transparent'
                }`}
            >
              <Text
                style={tw`text-xs font-bold text-center ${entryType === 'expense'
                    ? 'text-white'
                    : 'text-stone-600'
                  }`}
              >
                खर्च (जावक)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <AppInput
            label="वर्णन"
            value={description}
            onChangeText={setDescription}
            placeholder="उदा. जेसीबी काम"
          />

          {/* Amount */}
          <AppInput
            label="रक्कम (₹)"
            type="number"
            value={amount}
            onChangeText={setAmount}
            placeholder="रक्कम टाका"
          />

          {/* Payment Type */}
          <AppDropdown
            label="पेमेंट प्रकार"
            value={paymentType}
            onChangeText={setPaymentType}
            options={[
              { label: 'रोख', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी', value: 'उधारी' },
            ]}
          />

          {/* Notes */}
          <AppInput
            label="नोंद"
            value={notes}
            onChangeText={setNotes}
            placeholder="काही नोंद असेल तर"
          />

          {/* Save Button */}
          <View style={tw`pt-2`}>
            <AppButton title="सेव्ह करा" onPress={handleSave} variant="primary" />
          </View>
        </AppCard>

        {/* Today Summary Section */}
        <View style={tw`pt-2`}>
          <Text style={tw`font-bold text-sm text-stone-800 mb-2.5`}>आजचा सारांश</Text>
          <AppCard style={tw`space-y-2 p-3.5 bg-stone-50/80`}>
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-semibold text-stone-700`}>एकूण कमाई :</Text>
              <Text style={tw`font-bold text-emerald-700`}>{formatCurrency(summary.earnings)}</Text>
            </View>
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-semibold text-stone-700`}>एकूण खर्च :</Text>
              <Text style={tw`font-bold text-red-600`}>{formatCurrency(summary.expense)}</Text>
            </View>
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-bold text-stone-800`}>नफा :</Text>
              <Text style={tw`font-extrabold text-emerald-700`}>{formatCurrency(summary.profit)}</Text>
            </View>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
};

export default DailyEntryScreen;
