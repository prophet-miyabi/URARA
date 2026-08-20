"use client";

import { useReservationStore } from "@/lib/reservation-store";

export default function CompanionsPage() {
  const { companions } = useReservationStore();

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">女の子管理</h1>
        <span className="text-xs text-neutral-400">連絡は電話・LINEのみ（専用アプリなし）</span>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {companions.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="font-medium">{c.fullName}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.status === "active" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {c.status === "active" ? "稼働中" : "休止中"}
              </span>
            </div>
            <p className="text-xs text-neutral-500">{c.phoneNumber}</p>
            <p className="text-xs text-neutral-500">LINE: {c.lineId}</p>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-neutral-200 bg-white md:block">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">氏名</th>
              <th className="px-4 py-2 font-medium">電話番号</th>
              <th className="px-4 py-2 font-medium">LINE ID</th>
              <th className="px-4 py-2 font-medium">稼働状況</th>
            </tr>
          </thead>
          <tbody>
            {companions.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium">{c.fullName}</td>
                <td className="px-4 py-3 text-neutral-500">{c.phoneNumber}</td>
                <td className="px-4 py-3 text-neutral-500">{c.lineId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.status === "active" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {c.status === "active" ? "稼働中" : "休止中"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        登録フォーム・シフト管理は次フェーズで実装予定です（現在は表示のみ）。
      </p>
    </div>
  );
}
