import { ReservationDetail } from "@/components/ReservationDetail";

export default async function ReservationDetailPage({ params }: PageProps<"/reservations/[id]">) {
  const { id } = await params;
  return <ReservationDetail id={id} />;
}
