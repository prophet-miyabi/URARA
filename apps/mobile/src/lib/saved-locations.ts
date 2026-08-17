import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location } from './types';

const STORAGE_KEY = 'urara.savedLocations.v1';
const MAX_SAVED = 8;

export async function getSavedLocations(): Promise<Location[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Location[];
  } catch {
    return [];
  }
}

export async function saveLocation(location: Location): Promise<Location[]> {
  const current = await getSavedLocations();
  const deduped = current.filter((l) => l.placeId !== location.placeId);
  const next = [location, ...deduped].slice(0, MAX_SAVED);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
