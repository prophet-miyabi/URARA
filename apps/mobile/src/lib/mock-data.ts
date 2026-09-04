import type { Location, Reservation } from './types';

const MOCK_LOCATION_ISHIWA: Location = {
  placeId: 'mock-place-ishiwa',
  name: '石和温泉 大広間 雅',
  address: '山梨県笛吹市石和町市部2-4-1',
  lat: 35.6547,
  lng: 138.6336,
};

const MOCK_LOCATION_KOFU: Location = {
  placeId: 'mock-place-kofu',
  name: '甲府 個室居酒屋 花月',
  address: '山梨県甲府市丸の内1-2-3',
  lat: 35.6642,
  lng: 138.5686,
};

// Fixed reference point (not `new Date()`) so this module produces identical
// output during Expo's static prerender and on client hydration.
const now = new Date('2026-08-18T09:00:00+09:00');
function hoursFromNow(h: number) {
  return new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
}

export const MOCK_MY_RESERVATIONS: Reservation[] = [
  {
    id: 'r3',
    location: MOCK_LOCATION_ISHIWA,
    bookingType: 'scheduled',
    requestedDatetime: hoursFromNow(50),
    guestCount: 8,
    companionCount: 2,
    durationHours: 3,
    travelFee: 5000,
    paymentMethod: 'card',
    notes: '',
    contactEmail: 'taro.yamamoto@example.com',
    status: 'confirmed',
    createdAt: hoursFromNow(-10),
  },
  {
    id: 'r5',
    location: MOCK_LOCATION_KOFU,
    bookingType: 'scheduled',
    requestedDatetime: hoursFromNow(-1),
    guestCount: 4,
    companionCount: 1,
    durationHours: 2,
    travelFee: 0,
    paymentMethod: 'card',
    notes: '',
    contactEmail: 'taro.yamamoto@example.com',
    status: 'cancelled',
    createdAt: hoursFromNow(-8),
  },
];
