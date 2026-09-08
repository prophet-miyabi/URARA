const COOLDOWN_MS = 5 * 60 * 1000; // 5分
const SWEEP_AGE_MS = 60 * 60 * 1000; // 1時間放置されたエントリは掃除する

// メモリ内ストア（DBを持たない現状の構成に合わせた最小実装）。同一メール
// アドレスから短時間に連続して送られてきた予約リクエストを、いたずら・
// 誤送信とみなして間引く。サーバー再起動で消えるが、対象がごく短い
// クールダウンなので実用上問題ない。
const lastAttempt = new Map<string, number>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sweep(now: number) {
  for (const [key, at] of lastAttempt) {
    if (now - at > SWEEP_AGE_MS) lastAttempt.delete(key);
  }
}

// true: 通常通り処理してよい。false: クールダウン中なので弾く。
export function checkAndRecordReservationAttempt(email: string): boolean {
  const key = normalizeEmail(email);
  const now = Date.now();
  sweep(now);

  const last = lastAttempt.get(key);
  if (last && now - last < COOLDOWN_MS) {
    return false;
  }

  lastAttempt.set(key, now);
  return true;
}
