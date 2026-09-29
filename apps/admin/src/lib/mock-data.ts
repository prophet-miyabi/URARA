import type { Companion, Venue } from "./types";

export const MOCK_VENUES: Venue[] = [
  {
    id: "v1",
    name: "甲府 個室居酒屋 花月",
    address: "山梨県甲府市丸の内1-2-3",
    prefecture: "山梨県",
    city: "甲府市",
    venueType: "restaurant",
    isActive: true,
  },
  {
    id: "v2",
    name: "昭和町 宴会場 かがやき",
    address: "山梨県中巨摩郡昭和町清水新居1-1",
    prefecture: "山梨県",
    city: "昭和町",
    venueType: "banquet_hall",
    isActive: true,
  },
  {
    id: "v3",
    name: "石和温泉 大広間 雅",
    address: "山梨県笛吹市石和町市部2-4-1",
    prefecture: "山梨県",
    city: "笛吹市石和町",
    venueType: "banquet_hall",
    isActive: true,
  },
  {
    id: "v4",
    name: "甲府 イベントホール SORA",
    address: "山梨県甲府市国母5-6-7",
    prefecture: "山梨県",
    city: "甲府市",
    venueType: "event_venue",
    isActive: true,
  },
];

export const MOCK_COMPANIONS: Companion[] = [
  { id: "c1", fullName: "佐藤 A子", phoneNumber: "090-1111-2222", lineId: "sato_a", status: "active" },
  { id: "c2", fullName: "鈴木 B美", phoneNumber: "090-2222-3333", lineId: "suzuki_b", status: "active" },
  { id: "c3", fullName: "高橋 C香", phoneNumber: "090-3333-4444", lineId: "takahashi_c", status: "active" },
  { id: "c4", fullName: "田中 D奈", phoneNumber: "090-4444-5555", lineId: "tanaka_d", status: "active" },
  { id: "c5", fullName: "伊藤 E菜", phoneNumber: "090-5555-6666", lineId: "ito_e", status: "inactive" },
];

