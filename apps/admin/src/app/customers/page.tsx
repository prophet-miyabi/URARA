"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, EmptyState, PageHeader, SearchInput } from "@/components/ui";
import { formatYen } from "@/lib/format";

interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  createdAt: string;
  reservationCount: number;
  lastReservationAt: string | null;
  totalYen: number;
}

function formatDay(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/customers")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCustomers(data.customers ?? []);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter((c) => [c.fullName, c.phoneNumber, c.email, c.address].join(" ").toLowerCase().includes(q))
      : customers;
    // 直近に利用のあったお客様が上に来るように並べる。
    return [...list].sort((a, b) => Date.parse(b.lastReservationAt ?? b.createdAt) - Date.parse(a.lastReservationAt ?? a.createdAt));
  }, [customers, query]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="お客様" description={`登録 ${customers.length} 名`} />

      <div className="mb-4">
        <SearchInput value={query} onChange={setQuery} placeholder="お名前・電話番号・メール・住所で検索" />
      </div>

      {loading ? (
        <Card>
          <EmptyState>読み込み中...</EmptyState>
        </Card>
      ) : failed ? (
        <Card>
          <EmptyState>お客様の情報を読み込めませんでした。時間をおいて、もう一度お試しください。</EmptyState>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState>{query ? "条件に合うお客様はいません" : "まだ登録されたお客様はいません"}</EmptyState>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {visible.map((c) => (
              <div key={c.id} className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base font-bold">{c.fullName}</p>
                  <span className="shrink-0 rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-subtle">
                    {c.reservationCount}回
                  </span>
                </div>
                <a href={`tel:${c.phoneNumber}`} className="mt-1 block text-sm text-blue-700 underline">
                  {c.phoneNumber}
                </a>
                <p className="mt-0.5 break-all text-xs text-subtle">{c.email}</p>
                <p className="mt-0.5 text-xs text-faint">{c.address}</p>
                <p className="mt-2 text-xs text-subtle">
                  最新の予約: {formatDay(c.lastReservationAt)} ・ 累計 <span className="font-semibold text-ink">{formatYen(c.totalYen)}</span>
                </p>
              </div>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold text-subtle">
                <tr>
                  <th className="px-4 py-2.5">お名前</th>
                  <th className="px-4 py-2.5">連絡先</th>
                  <th className="px-4 py-2.5">住所</th>
                  <th className="px-4 py-2.5 text-right">利用回数</th>
                  <th className="px-4 py-2.5">最新の予約日</th>
                  <th className="px-4 py-2.5 text-right">累計金額</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.id} className="border-t border-line transition hover:bg-canvas">
                    <td className="px-4 py-3 font-medium">{c.fullName}</td>
                    <td className="px-4 py-3">
                      <a href={`tel:${c.phoneNumber}`} className="text-blue-700 hover:underline">
                        {c.phoneNumber}
                      </a>
                      <div className="text-xs text-faint">{c.email}</div>
                    </td>
                    <td className="max-w-64 truncate px-4 py-3 text-subtle">{c.address}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.reservationCount}回</td>
                    <td className="whitespace-nowrap px-4 py-3 text-subtle">{formatDay(c.lastReservationAt)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatYen(c.totalYen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
