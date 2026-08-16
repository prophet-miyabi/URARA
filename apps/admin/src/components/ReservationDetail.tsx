"use client";

import Link from "next/link";
import { useState } from "react";
import { calculatePrice } from "@companion-dispatch/pricing";
import { useReservationStore } from "@/lib/reservation-store";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTimeJST, formatYen } from "@/lib/format";

const BOOKING_TYPE_LABEL = { now: "今すぐ予約", scheduled: "日時指定予約" } as const;
const PAYMENT_LABEL = { cash: "現金", card: "カード" } as const;

export function ReservationDetail({ id }: { id: string }) {
  const store = useReservationStore();
  const reservation = store.getReservation(id);
  const [travelFeeInput, setTravelFeeInput] = useState<string | null>(null);
  const [durationInput, setDurationInput] = useState<string | null>(null);

  if (!reservation) {
    return (
      <div className="max-w-3xl">
        <Link href="/" className="text-sm text-neutral-500 hover:underline">
          ← 予約キューに戻る
        </Link>
        <p className="mt-4 text-neutral-500">予約が見つかりませんでした。</p>
      </div>
    );
  }

  const venue = store.venues.find((v) => v.id === reservation.venueId);
  const customer = reservation.customerId
    ? store.customers.find((c) => c.id === reservation.customerId)
    : null;

  const price = calculatePrice({
    companionCount: reservation.companionCount,
    durationHours: reservation.durationHours,
    travelFee: reservation.travelFee,
  });

  const toggleCompanion = (companionId: string) => {
    const current = reservation.assignedCompanionIds;
    const next = current.includes(companionId)
      ? current.filter((cid) => cid !== companionId)
      : [...current, companionId];
    store.assignCompanions(reservation.id, next);
  };

  const commitTravelFee = () => {
    if (travelFeeInput === null) return;
    const value = Number(travelFeeInput);
    if (!Number.isNaN(value) && value >= 0) {
      store.updateTravelFee(reservation.id, value);
    }
    setTravelFeeInput(null);
  };

  const commitDuration = () => {
    if (durationInput === null) return;
    const value = Number(durationInput);
    if (!Number.isNaN(value) && value >= 2) {
      store.updateDuration(reservation.id, value);
    }
    setDurationInput(null);
  };

  const isTerminal = reservation.status === "cancelled" || reservation.status === "completed";
  const canMoveToArranging = !isTerminal && reservation.status === "received";
  const canConfirm =
    !isTerminal &&
    reservation.status === "arranging" &&
    reservation.assignedCompanionIds.length >= reservation.companionCount;
  const canComplete = !isTerminal && reservation.status === "confirmed";
  const canCancel = !isTerminal;

  return (
    <div className="max-w-3xl">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← 予約キューに戻る
      </Link>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          予約詳細 <span className="text-neutral-400 font-normal text-base">#{reservation.id}</span>
        </h1>
        <StatusBadge status={reservation.status} />
      </div>

      {/* Status stepper */}
      <div className="mb-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs">
          {(["received", "arranging", "confirmed", "completed"] as ReservationStatus[]).map((s, i, arr) => {
            const currentIndex = ["received", "arranging", "confirmed", "completed"].indexOf(reservation.status);
            const reached = reservation.status !== "cancelled" && i <= currentIndex;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex-1 rounded-full py-2 text-center font-semibold ${
                    reached ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </div>
                {i < arr.length - 1 && <span className="text-neutral-300">→</span>}
              </div>
            );
          })}
        </div>
        {reservation.status === "cancelled" && (
          <p className="mt-3 text-sm font-semibold text-red-600">この予約はキャンセルされました</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column: details */}
        <div className="space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-500">予約内容</h2>
            <dl className="space-y-2 text-sm">
              <Row label="お客様" value={`${reservation.contactName} (${reservation.contactPhone})`} />
              <Row
                label="会員情報"
                value={
                  customer
                    ? `会員 / 本人確認: ${idLabel(customer.identityVerificationStatus)}`
                    : "非会員（電話予約）"
                }
              />
              <Row label="店舗" value={venue?.name ?? "-"} />
              <Row label="予約種別" value={BOOKING_TYPE_LABEL[reservation.bookingType]} />
              <Row label="日時" value={formatDateTimeJST(reservation.requestedDatetime)} />
              <Row label="お客様人数" value={`${reservation.guestCount}名`} />
              <Row label="女の子人数" value={`${reservation.companionCount}名`} />
              <Row label="支払い方法" value={PAYMENT_LABEL[reservation.paymentMethod]} />
              {reservation.notes && <Row label="要望・連絡事項" value={reservation.notes} />}
            </dl>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-500">利用時間・料金</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">利用時間（基本2時間〜延長編集可）</dt>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={2}
                    step={1}
                    value={durationInput ?? reservation.durationHours}
                    onChange={(e) => setDurationInput(e.target.value)}
                    onBlur={commitDuration}
                    className="w-16 rounded border border-neutral-300 px-2 py-1 text-right"
                  />
                  <span>時間</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">出張料（現地確定後に入力）</dt>
                <div className="flex items-center gap-1">
                  <span>¥</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={travelFeeInput ?? reservation.travelFee}
                    onChange={(e) => setTravelFeeInput(e.target.value)}
                    onBlur={commitTravelFee}
                    className="w-24 rounded border border-neutral-300 px-2 py-1 text-right"
                  />
                </div>
              </div>
              <hr className="border-neutral-100" />
              <Row label="基本料金" value={formatYen(price.basePrice)} />
              {price.extensionPrice > 0 && <Row label="延長料金" value={formatYen(price.extensionPrice)} />}
              <Row label="出張料" value={formatYen(price.travelFee)} />
              <div className="flex items-center justify-between font-bold">
                <dt>合計</dt>
                <dd>{formatYen(price.totalPrice)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-500">ステータス履歴</h2>
            <ol className="space-y-2 text-sm">
              {reservation.statusHistory.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 text-neutral-300">•</span>
                  <div>
                    <span className="font-medium">{STATUS_LABEL[h.toStatus]}</span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {formatDateTimeJST(h.changedAt)} / {h.changedBy}
                    </span>
                    {h.note && <div className="text-xs text-neutral-500">{h.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right column: actions */}
        <div className="space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-500">女の子の割当</h2>
            <ul className="space-y-2">
              {store.companions.map((c) => {
                const checked = reservation.assignedCompanionIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                        c.status === "inactive" ? "opacity-40" : ""
                      } ${checked ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}
                    >
                      <span>
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={checked}
                          disabled={c.status === "inactive"}
                          onChange={() => toggleCompanion(c.id)}
                        />
                        {c.fullName}
                      </span>
                      <span className="text-xs text-neutral-400">{c.phoneNumber}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-neutral-400">
              {reservation.assignedCompanionIds.length} / {reservation.companionCount} 名 手配済み
            </p>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold text-neutral-500">ステータス操作</h2>
            <div className="flex flex-col gap-2">
              <ActionButton disabled={!canMoveToArranging} onClick={() => store.setStatus(reservation.id, "arranging")}>
                手配中にする
              </ActionButton>
              <ActionButton primary disabled={!canConfirm} onClick={() => store.setStatus(reservation.id, "confirmed")}>
                確定して通知送信
              </ActionButton>
              <ActionButton disabled={!canComplete} onClick={() => store.setStatus(reservation.id, "completed")}>
                利用終了にする
              </ActionButton>
              <ActionButton
                danger
                disabled={!canCancel}
                onClick={() => store.setStatus(reservation.id, "cancelled", "運営操作によるお断り/キャンセル")}
              >
                お断り・キャンセル
              </ActionButton>
            </div>
            {reservation.status === "received" && (
              <p className="mt-2 text-xs text-neutral-400">
                まず「手配中にする」で手配を開始してください。
              </p>
            )}
            {reservation.status === "arranging" &&
              reservation.assignedCompanionIds.length < reservation.companionCount && (
                <p className="mt-2 text-xs text-amber-600">
                  「確定」には希望人数分の女の子を割り当ててください。
                </p>
              )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function idLabel(status: string) {
  return { unverified: "未確認", pending_review: "審査中", verified: "確認済み", rejected: "却下" }[status] ?? status;
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
        primary
          ? "bg-neutral-900 text-white hover:bg-neutral-700"
          : danger
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}
