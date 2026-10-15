"use client";

import { useEffect, useState } from "react";

// 「あと2時間」のような相対表示が古くならないよう、一定間隔で現在時刻を更新する。
// 初期値は最初の描画時に1回だけ決める（描画のたびにDate.now()を呼ばない）。
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
