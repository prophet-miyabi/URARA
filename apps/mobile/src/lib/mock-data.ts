import type { CastProfile, Location, Reservation } from './types';

export const MOCK_CAST: CastProfile[] = [
  { id: 'ca1', nickname: 'あゆ', tagline: '明るい会話で場を盛り上げます', tone: '朗らか' },
  { id: 'ca2', nickname: 'れいな', tagline: '落ち着いた接客が得意です', tone: '上品' },
  { id: 'ca3', nickname: 'みゆ', tagline: 'お酒の席が大好きです', tone: '社交的' },
  { id: 'ca4', nickname: 'さくら', tagline: '聞き上手で癒し系です', tone: '癒し' },
  { id: 'ca5', nickname: 'ののか', tagline: '初対面でも安心してお任せください', tone: '気配り' },
  { id: 'ca6', nickname: 'まい', tagline: '宴会を華やかに彩ります', tone: '華やか' },
];

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
