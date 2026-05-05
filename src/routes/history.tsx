import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { type Order, loadOrders, deleteOrder, flavorOf } from "@/lib/order";
import { SiteHeader } from "@/components/SiteHeader";
import { Trash2, Receipt as ReceiptIcon, ShoppingBag } from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "訂單歷史 | 一期一會拉麵屋" },
      { name: "description", content: "查看與重印過去的拉麵訂單收據。" },
    ],
  }),
});

function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { setOrders(loadOrders()); }, []);

  const remove = (id: string) => {
    deleteOrder(id);
    setOrders(loadOrders());
    toast.success("已刪除");
  };

  return (
    <main className="min-h-screen pb-24">
      <Toaster position="top-center" richColors />
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.4em] text-primary">HISTORY</p>
            <h2 className="mt-1 font-display text-3xl font-bold">訂單歷史</h2>
            <p className="mt-1 text-sm text-muted-foreground">所有訂單會儲存在此裝置上，可隨時查看或重印。</p>
          </div>
          <Button asChild variant="outline"><Link to="/"><ShoppingBag className="mr-1 h-4 w-4" /> 回到點餐</Link></Button>
        </div>

        {orders.length === 0 ? (
          <Card className="py-16 text-center text-muted-foreground">
            <p className="font-display">還沒有訂單，去點一碗熱呼呼的拉麵吧 🍜</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <Card key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</Badge>
                    <Badge variant={o.fulfillment === "delivery" ? "default" : "secondary"}>
                      {o.fulfillment === "delivery" ? "外送" : "自取"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(o.createdAt), "yyyy/MM/dd HH:mm")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm">
                    {o.items.map(i => flavorOf(i.flavorId).name).join("、")}
                    <span className="text-muted-foreground"> · {o.items.length} 碗</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    預定 {format(new Date(o.scheduledAt), "MM/dd HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xl font-bold text-primary">${o.pricing.total}</p>
                  <Button asChild size="sm">
                    <Link to="/order/$orderId" params={{ orderId: o.id }}>
                      <ReceiptIcon className="mr-1 h-4 w-4" /> 收據
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
