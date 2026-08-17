import tw from 'twrnc';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { Calendar, CheckCircle } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { DailyLedgerService } from '../../utils/api';
import { colors, radii } from '../../theme';

interface DailyEntryScreenProps {
  onBack: () => void;
}

export const DailyEntryScreen: React.FC<DailyEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [entryType, setEntryType] = useState<'earnings' | 'expense'>('earnings');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('रोख');
  const [notes, setNotes] = useState<string>('');

  const [summary, setSummary] = useState({
    earnings: 12450,
    expense: 4320,
    profit: 8130,
  });

  const [savedMessage, setSavedMessage] = useState<string>('');

  const fetchDaySummary = async () => {
    try {
      const parts = date.split('/');
      const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : undefined;
      const res = await DailyLedgerService.getSummary(isoDate);
      if (res) {
        setSummary({
          earnings: res.earnings ?? 0,
          expense: res.expense ?? 0,
          profit: res.profit ?? 0,
        });
      }
    } catch {
      // Local fallback
    }
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  const handleSave = async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0 && !description) {
      alert('कृपया वर्णन व योग्य रक्कम टाका');
      return;
    }

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash',
      'ऑनलाइन': 'online',
      'उधारी': 'credit',
    };

    const parts = date.split('/');
    const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];

    try {
      await DailyLedgerService.create({
        entry_date: isoDate,
        type: entryType,
        description,
        amount: numAmount,
        payment_type: payTypeMap[paymentType] || 'cash',
        notes,
      });
      fetchDaySummary();
    } catch {
      if (entryType === 'earnings') {
        const newEarnings = summary.earnings + numAmount;
        const newProfit = newEarnings - summary.expense;
        setSummary({ ...summary, earnings: newEarnings, profit: newProfit });
      } else {
        const newExpense = summary.expense + numAmount;
        const newProfit = summary.earnings - newExpense;
        setSummary({ ...summary, expense: newExpense, profit: newProfit });
      }
    }

    setSavedMessage('नोंद यशस्वीरित्या सेव्ह झाली!');
    setDescription('');
    setAmount('');
    setNotes('');

    setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="रोजचा हिशोब"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
        onRightActionPress={() => setDate(getTodayFormatted())}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-8`}>
        {/* Success Banner */}
        {savedMessage && (
          <View style={tw`bg-[${colors.successBg}] border border-green-200 rounded-xl py-3 px-4 flex flex-row items-center gap-2`}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={tw`text-xs font-bold text-[${colors.success}]`}>{savedMessage}</Text>
          </View>
        )}

        {/* Form */}
        <AppCard style={tw`gap-4 p-4`}>
          <AppDatePicker label="दिनांक" value={date} onChange={setDate} />

          {/* Type Toggle */}
          <View>
            <Text style={tw`text-xs font-semibold text-[${colors.textSecondary}] mb-2`}>नोंद प्रकार</Text>
            <View style={tw`flex-row gap-2 p-1 bg-[${colors.surfaceTertiary}] rounded-xl`}>
              <TouchableOpacity
                onPress={() => setEntryType('earnings')}
                activeOpacity={0.7}
                style={tw`flex-1 py-2.5 rounded-lg ${entryType === 'earnings' ? `bg-[${colors.earnings}]` : 'bg-transparent'}`}
              >
                <Text style={tw`text-xs font-bold text-center ${entryType === 'earnings' ? 'text-white' : `text-[${colors.textSecondary}]`}`}>
                  कमाई (आवक)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEntryType('expense')}
                activeOpacity={0.7}
                style={tw`flex-1 py-2.5 rounded-lg ${entryType === 'expense' ? `bg-[${colors.expense}]` : 'bg-transparent'}`}
              >
                <Text style={tw`text-xs font-bold text-center ${entryType === 'expense' ? 'text-white' : `text-[${colors.textSecondary}]`}`}>
                  खर्च (जावक)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppInput
            label="वर्णन"
            value={description}
            onChangeText={setDescription}
            placeholder="उदा. जेसीबी काम"
          />

          <AppInput
            label="रक्कम (₹)"
            value={amount}
            onChangeText={setAmount}
            placeholder="रक्कम टाका"
            keyboardType="numeric"
          />

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

          <AppInput
            label="नोंद"
            value={notes}
            onChangeText={setNotes}
            placeholder="काही नोंद असेल तर"
          />

          <View style={tw`pt-2`}>
            <AppButton title="सेव्ह करा" onPress={handleSave} variant="primary" />
          </View>
        </AppCard>

        {/* Today Summary */}
        <View>
          <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider mb-3 px-1`}>आजचा सारांश</Text>
          <AppCard variant="elevated" style={tw`gap-3 p-4`}>
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-semibold text-[${colors.textSecondary}]`}>एकूण कमाई :</Text>
              <Text style={tw`font-bold text-[${colors.earnings}]`}>{formatCurrency(summary.earnings)}</Text>
            </View>
            <View style={tw`h-px bg-[${colors.borderLight}]`} />
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-semibold text-[${colors.textSecondary}]`}>एकूण खर्च :</Text>
              <Text style={tw`font-bold text-[${colors.expense}]`}>{formatCurrency(summary.expense)}</Text>
            </View>
            <View style={tw`h-px bg-[${colors.borderLight}]`} />
            <View style={tw`flex-row justify-between items-center w-full`}>
              <Text style={tw`font-bold text-[${colors.textPrimary}]`}>नफा :</Text>
              <Text style={tw`text-lg font-extrabold text-[${colors.earnings}]`}>{formatCurrency(summary.profit)}</Text>
            </View>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
};

export default DailyEntryScreen;
