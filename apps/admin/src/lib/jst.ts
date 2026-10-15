// 日本時間（JST）での日付の扱い。サーバーやブラウザのタイムゾーンに左右されず、
// 「今日」「今月」を判定できるようにする（Renderのサーバーは世界標準時のため）。

const dayFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** "2026-10-15" 形式の、日本時間での日付。 */
export function jstDayKey(input: string | number | Date): string {
  return dayFormatter.format(new Date(input));
}

/** "2026-10" 形式の、日本時間での年月。 */
export function jstMonthKey(input: string | number | Date): string {
  return jstDayKey(input).slice(0, 7);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * 予約日時を、運営が一目で緊急度をつかめる短い言葉にする。
 * 例: 「あと2時間」「30分前に開始」「明日 20:00」「10/18(日) 20:00」
 */
export function describeWhen(targetIso: string, nowMs: number): string {
  const target = new Date(targetIso).getTime();
  const diff = target - nowMs;
  const clock = new Date(targetIso).toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diff < 0) {
    const minutes = Math.round(-diff / MINUTE);
    if (minutes < 60) return `${minutes}分前に開始`;
    if (minutes < 24 * 60) return `${Math.floor(minutes / 60)}時間前に開始`;
  } else if (diff < 90 * MINUTE) {
    return `あと${Math.max(1, Math.round(diff / MINUTE))}分`;
  } else if (diff < 6 * HOUR) {
    return `あと${Math.round(diff / HOUR)}時間`;
  }

  const todayKey = jstDayKey(nowMs);
  const targetKey = jstDayKey(targetIso);
  if (targetKey === todayKey) return `今日 ${clock}`;
  if (targetKey === jstDayKey(nowMs + 24 * HOUR)) return `明日 ${clock}`;

  const date = new Date(targetIso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  return `${date} ${clock}`;
}
