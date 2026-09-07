import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_STORAGE_KEY = 'urara.profile.email.v1';
const VERIFICATION_STORAGE_KEY = 'urara.profile.emailVerification.v1';

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

export interface SavedVerification {
  email: string;
  token: string;
}

export async function getSavedVerification(): Promise<SavedVerification | null> {
  try {
    const raw = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedVerification) : null;
  } catch {
    return null;
  }
}

export async function saveVerification(verification: SavedVerification | null): Promise<void> {
  if (verification) {
    await AsyncStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verification));
  } else {
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
  }
}
