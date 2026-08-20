/**
 * Safe Persistent Storage Utility
 * Handles AsyncStorage safely with automatic in-memory fallback
 * in case the native module is not linked or running in an existing build.
 */

let memoryStorage: Record<string, string> = {};

let asyncStorageModule: any = null;

try {
  // Dynamically require to prevent crash if native module is absent
  asyncStorageModule = require('@react-native-async-storage/async-storage').default;
} catch {
  asyncStorageModule = null;
}

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (asyncStorageModule && typeof asyncStorageModule.getItem === 'function') {
        const val = await asyncStorageModule.getItem(key);
        if (val !== null && val !== undefined) {
          memoryStorage[key] = val;
          return val;
        }
      }
    } catch {
      // Native module unavailable or errored — fallback to memory
    }
    return memoryStorage[key] ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
    try {
      if (asyncStorageModule && typeof asyncStorageModule.setItem === 'function') {
        await asyncStorageModule.setItem(key, value);
      }
    } catch {
      // Memory store is already updated
    }
  },

  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
    try {
      if (asyncStorageModule && typeof asyncStorageModule.removeItem === 'function') {
        await asyncStorageModule.removeItem(key);
      }
    } catch {
      // Memory store is already updated
    }
  },

  clear: async (): Promise<void> => {
    memoryStorage = {};
    try {
      if (asyncStorageModule && typeof asyncStorageModule.clear === 'function') {
        await asyncStorageModule.clear();
      }
    } catch {
      // Memory store is already cleared
    }
  },
};

export default SafeStorage;
