import type { CastProfile, Reservation, Venue } from './types';

export const MOCK_VENUES: Venue[] = [
  { id: 'v1', name: '甲府 個室居酒屋 花月', city: '甲府市', venueType: 'restaurant' },
  { id: 'v2', name: '昭和町 宴会場 かがやき', city: '昭和町', venueType: 'banquet_hall' },
  { id: 'v3', name: '石和温泉 大広間 雅', city: '笛吹市石和町', venueType: 'banquet_hall' },
  { id: 'v4', name: '甲府 イベントホール SORA', city: '甲府市', venueType: 'event_venue' },
];

export const MOCK_CAST: CastProfile[] = [
  { id: 'ca1', nickname: 'あゆ', tagline: '明るい会話で場を盛り上げます', tone: '朗らか' },
  { id: 'ca2', nickname: 'れいな', tagline: '落ち着いた接客が得意です', tone: '上品' },
  { id: 'ca3', nickname: 'みゆ', tagline: 'お酒の席が大好きです', tone: '社交的' },
  { id: 'ca4', nickname: 'さくら', tagline: '聞き上手で癒し系です', tone: '癒し' },
  { id: 'ca5', nickname: 'ののか', tagline: '初対面でも安心してお任せください', tone: '気配り' },
  { id: 'ca6', nickname: 'まい', tagline: '宴会を華やかに彩ります', tone: '華やか' },
];

const now = new Date();
function hoursFromNow(h: number) {
  return new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();
}

export const MOCK_MY_RESERVATIONS: Reservation[] = [
  {
    id: 'r3',
    venueId: 'v3',
    bookingType: 'scheduled',
    requestedDatetime: hoursFromNow(50),
    guestCount: 8,
    companionCount: 2,
    durationHours: 3,
    travelFee: 5000,
    paymentMethod: 'card',
    notes: '',
    status: 'confirmed',
    createdAt: hoursFromNow(-10),
  },
  {
    id: 'r5',
    venueId: 'v1',
    bookingType: 'scheduled',
    requestedDatetime: hoursFromNow(-1),
    guestCount: 4,
    companionCount: 1,
    durationHours: 2,
    travelFee: 0,
    paymentMethod: 'card',
    notes: '',
    status: 'cancelled',
    createdAt: hoursFromNow(-8),
  },
];
