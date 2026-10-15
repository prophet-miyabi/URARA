import { STATUS_LABEL, type ReservationStatus } from "@/lib/types";

// 点＋ラベルの控えめなバッジ。色だけに頼らず文字でも状態が分かるようにする。
const STATUS_STYLE: Record<ReservationStatus, { chip: string; dot: string }> = {
  received: { chip: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  arranging: { chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  completed: { chip: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  cancelled: { chip: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
