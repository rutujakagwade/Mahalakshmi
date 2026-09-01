import { Linking, Alert } from 'react-native';

export interface CustomerUdharShareData {
  customerName: string;
  phone?: string;
  location?: string;
  totalWork?: number;
  totalPaid?: number;
  udhariBalance: number;
  expectedPaymentDate?: string;
}

export interface WorkBalanceShareData {
  customerName: string;
  phone?: string;
  workName: string;
  machineName?: string;
  location?: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  startDate?: string;
}

/**
 * Format phone number to international WhatsApp format (e.g. 91XXXXXXXXXX)
 */
export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Send customer overall Udhari summary directly to customer on WhatsApp
 */
export const sendCustomerUdharOnWhatsApp = async (data: CustomerUdharShareData) => {
  const { customerName, phone, location, totalWork = 0, totalPaid = 0, udhariBalance, expectedPaymentDate } = data;

  const todayStr = new Date().toLocaleDateString('en-GB');

  let message = `🚜 *महालक्ष्मी इन्फ्रा (Mahalaxmi Infra)* 🚜\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📄 *उधारी हिशोब तपशील (Udhar Statement)*\n`;
  message += `📅 *तारीख:* ${todayStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `👤 *ग्राहक:* *${customerName}*\n`;
  if (location) {
    message += `📍 *ठिकाण/गाव:* ${location}\n`;
  }
  message += `\n📊 *कामाचा व पेमेंटचा हिशोब:*\n`;
  message += `🔹 *एकूण काम:* ₹${totalWork.toLocaleString('en-IN')}\n`;
  message += `🔹 *जमा रक्कम:* ₹${totalPaid.toLocaleString('en-IN')}\n`;
  message += `🔸 *बाकी उधारी रक्कम:* *₹${udhariBalance.toLocaleString('en-IN')}*\n`;

  if (expectedPaymentDate) {
    message += `\n⏰ *पेमेंट देण्याची ठरलेली तारीख:* *${expectedPaymentDate}*\n`;
  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🙏 *विनंती:* कृपया वरील बाकी रक्कम वेळेत जमा करावी.\n`;
  message += `काही शंका असल्यास संपर्क साधावा.\n\n`;
  message += `*धन्यवाद!* ✨\n`;
  message += `*महालक्ष्मी इन्फ्रा*`;

  await openWhatsApp(phone, message);
};

/**
 * Send single work balance details to customer on WhatsApp
 */
export const sendWorkBalanceOnWhatsApp = async (data: WorkBalanceShareData) => {
  const {
    customerName,
    phone,
    workName,
    machineName,
    location,
    totalAmount,
    advanceAmount,
    balanceAmount,
    startDate,
  } = data;

  let message = `🚜 *महालक्ष्मी इन्फ्रा (Mahalaxmi Infra)* 🚜\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📋 *काम बिल व हिशोब (Work Details)*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `👤 *ग्राहक:* *${customerName}*\n`;
  message += `🏗️ *काम:* ${workName}\n`;
  if (machineName) message += `🚜 *मशीन:* ${machineName}\n`;
  if (location) message += `📍 *गाव/ठिकाण:* ${location}\n`;
  if (startDate) message += `📅 *तारीख:* ${startDate}\n`;
  message += `\n💰 *पेमेंट तपशील:*\n`;
  message += `🔹 *एकूण बिल:* ₹${totalAmount.toLocaleString('en-IN')}\n`;
  message += `🔹 *आगाऊ/जमा:* ₹${advanceAmount.toLocaleString('en-IN')}\n`;
  message += `🔸 *उर्वरित बाकी:* *₹${balanceAmount.toLocaleString('en-IN')}*\n`;
  message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🙏 कृपया उर्वरित रक्कम लवकर जमा करावी. धन्यवाद!\n`;
  message += `*महालक्ष्मी इन्फ्रा*`;

  await openWhatsApp(phone, message);
};

/**
 * Core function to launch WhatsApp with prefilled message
 */
export const openWhatsApp = async (phone?: string, message: string = '') => {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);

  if (!cleanPhone) {
    // If no phone number, open generic WhatsApp share or alert
    const genericUrl = `whatsapp://send?text=${encodedText}`;
    try {
      const canOpen = await Linking.canOpenURL(genericUrl);
      if (canOpen) {
        await Linking.openURL(genericUrl);
        return;
      }
    } catch {
      // fallback
    }

    Alert.alert(
      'मोबाईल नंबर नाही',
      'या ग्राहकाचा मोबाईल नंबर उपलब्ध नाही. कृपया आधी ग्राहकाचा फोन नंबर अपडेट करा किंवा WhatsApp मध्ये थेट शेअर करा.',
      [
        { text: 'रद्द करा', style: 'cancel' },
        {
          text: 'इतर शेअर',
          onPress: () => {
            Linking.openURL(`https://api.whatsapp.com/send?text=${encodedText}`).catch(() => {});
          },
        },
      ]
    );
    return;
  }

  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch (err: any) {
      Alert.alert('त्रुटी', 'WhatsApp उघडता आले नाही. कृपया WhatsApp इन्स्टॉल असल्याचे तपासा.');
    }
  }
};
