import type { Location } from './types';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

export const isPlacesApiConfigured = Boolean(API_KEY);

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      structuredFormat?: {
        mainText?: { text: string };
        secondaryText?: { text: string };
      };
      text?: { text: string };
    };
  }>;
}

// Uses the Places API (New) — https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!API_KEY || query.trim().length < 2) return [];

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
    },
    body: JSON.stringify({
      input: query,
      languageCode: 'ja',
      regionCode: 'JP',
    }),
  });

  if (!res.ok) {
    throw new Error(`Places autocomplete failed: ${res.status}`);
  }

  const data: AutocompleteResponse = await res.json();
  return (data.suggestions ?? [])
    .filter((s) => s.placePrediction)
    .map((s) => {
      const p = s.placePrediction!;
      return {
        placeId: p.placeId,
        mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
      };
    });
}

interface PlaceDetailsResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
}

// https://developers.google.com/maps/documentation/places/web-service/place-details
export async function getPlaceDetails(placeId: string): Promise<Location> {
  if (!API_KEY) throw new Error('Google Places API key is not configured');

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });

  if (!res.ok) {
    throw new Error(`Place details failed: ${res.status}`);
  }

  const data: PlaceDetailsResponse = await res.json();
  return {
    placeId: data.id,
    name: data.displayName?.text ?? '',
    address: data.formattedAddress ?? '',
    lat: data.location?.latitude ?? 0,
    lng: data.location?.longitude ?? 0,
  };
}
