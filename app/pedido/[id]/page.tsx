import AppShell from "@/components/AppShell";
import OrderTracker from "@/components/OrderTracker";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell>
      <OrderTracker orderId={id} />
    </AppShell>
  );
}
