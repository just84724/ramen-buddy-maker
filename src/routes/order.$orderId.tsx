import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { type Order, getOrder } from "@/lib/order";
import { Receipt } from "@/components/Receipt";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/order/$orderId")({
  component: OrderPage,
  head: () => ({
    meta: [
      { title: "訂單收據 | 一期一會拉麵屋" },
      { name: "description", content: "查看訂單明細並下載 PDF 收據。" },
    ],
  }),
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => { setOrder(getOrder(orderId) ?? null); }, [orderId]);

  if (order === undefined) return null;

  return (
    <main className="min-h-screen pb-20">
      <Toaster position="top-center" richColors />
      <SiteHeader />
      <section className="mx-auto max-w-xl px-6 py-10">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/history"><ArrowLeft className="mr-1 h-4 w-4" /> 返回歷史</Link>
          </Button>
        </div>
        {order ? (
          <Receipt order={order} onClose={() => navigate({ to: "/" })} />
        ) : (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            找不到此訂單
          </div>
        )}
      </section>
    </main>
  );
}
