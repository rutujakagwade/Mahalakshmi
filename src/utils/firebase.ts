import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './api';

export const FCM_TOKEN_STORAGE_KEY = '@mahalaxmi_fcm_token';

/**
 * Register and sync FCM Token with Laravel Backend.
 */
export async function syncFcmToken(token?: string) {
  try {
    let currentToken = token;
    if (!currentToken) {
      const stored = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
      currentToken = stored ?? undefined;
    }


    if (currentToken) {
      await NotificationService.saveFcmToken(currentToken);
      console.log('FCM Token synced with backend:', currentToken);
    }
  } catch (err: any) {
    console.warn('Failed to sync FCM Token with backend:', err?.message);
  }
}

/**
 * Save FCM token locally and sync with backend.
 */
export async function saveAndSyncFcmToken(token: string) {
  try {
    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    await syncFcmToken(token);
  } catch (err: any) {
    console.warn('Failed to save FCM token:', err?.message);
  }
}

/**
 * Initialize Firebase Cloud Messaging listeners (dynamically loaded if firebase installed).
 */
export async function setupFirebaseMessaging() {
  try {
    // Try requiring @react-native-firebase/messaging dynamically
    const messaging = require('@react-native-firebase/messaging').default;

    // 1. Request Permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Firebase Notification permission granted.');

      // 2. Fetch FCM Token
      const token = await messaging().getToken();
      if (token) {
        await saveAndSyncFcmToken(token);
      }

      // 3. Listen for token refreshes
      messaging().onTokenRefresh(async (newToken: string) => {
        console.log('FCM Token refreshed:', newToken);
        await saveAndSyncFcmToken(newToken);
      });

      // 4. Listen for Foreground notifications
      messaging().onMessage(async (remoteMessage: any) => {
        console.log('FCM Foreground Notification Received:', remoteMessage);
      });
    }
  } catch (err) {
    // Firebase native SDK not linked yet (until google-services.json is present and npm package installed)
    console.log('Firebase native SDK not active. Syncing stored FCM token if available...');
    await syncFcmToken();
  }
}
