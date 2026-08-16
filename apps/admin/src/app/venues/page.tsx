"use client";

import { useReservationStore } from "@/lib/reservation-store";

const TYPE_LABEL = { restaurant: "飲食店", banquet_hall: "宴会場", event_venue: "イベント会場" } as const;

export default function VenuesPage() {
  const { venues } = useReservationStore();

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">店舗管理</h1>
        <span className="text-xs text-neutral-400">
          登録済みの店舗のみ予約時に選択可能（個人宅・ホテル客室は対象外）
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">店舗名</th>
              <th className="px-4 py-2 font-medium">種別</th>
              <th className="px-4 py-2 font-medium">住所</th>
              <th className="px-4 py-2 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3">{TYPE_LABEL[v.venueType]}</td>
                <td className="px-4 py-3 text-neutral-500">{v.address}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {v.isActive ? "掲載中" : "非掲載"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        店舗の追加・編集フォームは次フェーズで実装予定です（現在は表示のみ）。
      </p>
    </div>
  );
}
