import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_STORAGE_KEY = 'urara.profile.email.v1';

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function getSavedEmail(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(EMAIL_STORAGE_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(EMAIL_STORAGE_KEY, email.trim());
}
