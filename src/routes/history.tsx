import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  type Order, loadOrders, deleteOrder, flavorOf,
  setPendingCart, ORDER_STATUS_META, type OrderStatus,
} from "@/lib/order";
import { downloadReceipt } from "@/lib/receipt";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Trash2, Receipt as ReceiptIcon, ShoppingBag, Search,
  Repeat, Download, Printer,
} from "lucide-react";
import { toast, Toaster } from "sonner";

type SortKey = "date_desc" | "date_asc" | "total_desc" | "total_asc" | "schedule_asc";
type FulfillFilter = "all" | "pickup" | "delivery";
type StatusFilter = "all" | OrderStatus;

export const Route = createFileRoute("/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "訂單歷史 | 一期一會拉麵屋" },
      { name: "description", content: "查看、搜尋、排序與重印過去的拉麵訂單收據。" },
    ],
  }),
});

function HistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [fulfillFilter, setFulfillFilter] = useState<FulfillFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => { setOrders(loadOrders()); }, []);

  const remove = (id: string) => {
    deleteOrder(id);
    setOrders(loadOrders());
    toast.success("已刪除");
  };

  const repeat = (o: Order) => {
    setPendingCart(o.items);
    toast.success("已複製品項，前往結帳");
    navigate({ to: "/" });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = orders.filter(o => {
      if (fulfillFilter !== "all" && o.fulfillment !== fulfillFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      const idMatch = o.id.toLowerCase().includes(q);
      const flavorMatch = o.items.some(i =>
        flavorOf(i.flavorId).name.toLowerCase().includes(q) ||
        flavorOf(i.flavorId).jp.toLowerCase().includes(q),
      );
      const noteMatch = o.note?.toLowerCase().includes(q);
      return idMatch || flavorMatch || !!noteMatch;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "date_asc": return +new Date(a.createdAt) - +new Date(b.createdAt);
        case "total_desc": return b.pricing.total - a.pricing.total;
        case "total_asc": return a.pricing.total - b.pricing.total;
        case "schedule_asc": return +new Date(a.scheduledAt) - +new Date(b.scheduledAt);
        case "date_desc":
        default: return +new Date(b.createdAt) - +new Date(a.createdAt);
      }
    });
    return list;
  }, [orders, query, sort, fulfillFilter, statusFilter]);

  return (
    <main className="min-h-screen pb-24">
      <Toaster position="top-center" richColors />
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.4em] text-primary">HISTORY</p>
            <h2 className="mt-1 font-display text-3xl font-bold">訂單歷史</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              共 {orders.length} 筆 · 顯示 {filtered.length} 筆
            </p>
          </div>
          <Button asChild variant="outline"><Link to="/"><ShoppingBag className="mr-1 h-4 w-4" /> 回到點餐</Link></Button>
        </div>

        {/* Search & filter bar */}
        <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="搜尋訂單編號、口味或備註"
              className="pl-9"
            />
          </div>
          <Select value={fulfillFilter} onValueChange={v => setFulfillFilter(v as FulfillFilter)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部方式</SelectItem>
              <SelectItem value="pickup">自取</SelectItem>
              <SelectItem value="delivery">外送</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="created">已建立</SelectItem>
              <SelectItem value="preparing">備餐中</SelectItem>
              <SelectItem value="completed">完成</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">建立日期：新→舊</SelectItem>
              <SelectItem value="date_asc">建立日期：舊→新</SelectItem>
              <SelectItem value="schedule_asc">取餐/送達：近→遠</SelectItem>
              <SelectItem value="total_desc">金額：高→低</SelectItem>
              <SelectItem value="total_asc">金額：低→高</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {filtered.length === 0 ? (
          <Card className="py-16 text-center text-muted-foreground">
            <p className="font-display">
              {orders.length === 0 ? "還沒有訂單，去點一碗熱呼呼的拉麵吧 🍜" : "找不到符合條件的訂單"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => {
              const meta = ORDER_STATUS_META[o.status];
              return (
                <Card key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">#{o.id.slice(0, 8).toUpperCase()}</Badge>
                      <Badge variant={o.fulfillment === "delivery" ? "default" : "secondary"}>
                        {o.fulfillment === "delivery" ? "外送" : "自取"}
                      </Badge>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.tone}`}>
                        {meta.emoji} {meta.label}
                      </span>
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
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <p className="mr-2 font-mono text-xl font-bold text-primary">${o.pricing.total}</p>
                    <Button size="sm" variant="outline" onClick={() => repeat(o)}>
                      <Repeat className="mr-1 h-4 w-4" /> 重複下單
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { downloadReceipt(o); toast.success("PDF 下載中"); }}>
                      <Download className="mr-1 h-4 w-4" /> PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-1 h-4 w-4" /> 列印
                    </Button>
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
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
