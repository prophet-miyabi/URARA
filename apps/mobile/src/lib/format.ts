export function formatDateTimeJST(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// 一覧カードの1行目用。例: 2026/10/15（木）
export function formatDateJST(iso: string): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}/${get('month')}/${get('day')}（${get('weekday')}）`;
}

// 開始時刻と利用時間から「19:00〜21:00」の形にする。
export function formatTimeRangeJST(iso: string, durationHours: number): string {
  const time = (d: Date) =>
    new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  return `${time(start)}〜${time(end)}`;
}

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
