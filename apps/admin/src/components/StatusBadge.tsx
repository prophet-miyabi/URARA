import { STATUS_LABEL, type ReservationStatus } from "@/lib/types";

const STATUS_STYLE: Record<ReservationStatus, string> = {
  received: "bg-blue-100 text-blue-700",
  arranging: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-neutral-200 text-neutral-600",
  cancelled: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
