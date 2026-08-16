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

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}
