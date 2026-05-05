import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, X } from "lucide-react";
import { format } from "date-fns";
import { type Order, flavorOf, itemGross, itemTagList } from "@/lib/order";
import { downloadReceipt } from "@/lib/receipt";

export function Receipt({ order, onClose }: { order: Order; onClose?: () => void }) {
  return (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
        <p className="font-display text-xs tracking-[0.4em] opacity-80">RECEIPT</p>
        <h3 className="mt-1 font-display text-2xl font-bold">一期一會 拉麵屋</h3>
        <p className="mt-1 text-xs opacity-80">
          訂單 #{order.id.slice(0, 8).toUpperCase()} · {format(new Date(order.createdAt), "yyyy/MM/dd HH:mm")}
        </p>
      </div>

      <div id={`receipt-${order.id}`} className="space-y-3 px-6 py-5 text-sm">
        <div className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-xs">
          <span className="font-medium">
            {order.fulfillment === "pickup" ? "🛍️ 自取" : "🛵 外送"}
          </span>
          <span className="text-muted-foreground">
            預定 {format(new Date(order.scheduledAt), "MM/dd (EEE) HH:mm")}
          </span>
        </div>

        <ul className="space-y-2">
          {order.items.map((it, i) => {
            const f = flavorOf(it.flavorId);
            const tags = itemTagList(it);
            return (
              <li key={it.uid} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">{f.name}</span>
                    <span className="font-mono">${itemGross(it)}</span>
                  </div>
                  {tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {tags.map(t => (
                        <Badge key={t} variant="outline" className="px-1.5 py-0 text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <Separator />

        <div className="space-y-1 text-xs">
          <Row label="小計" value={`$${order.pricing.subtotal}`} />
          {order.pricing.fullComboDiscount > 0 && (
            <Row
              label={`加好加滿 × ${order.pricing.fullComboBowls} 碗`}
              value={`-$${order.pricing.fullComboDiscount}`}
              accent
            />
          )}
          {order.pricing.bulkDiscount > 0 && (
            <Row label="多碗優惠" value={`-$${order.pricing.bulkDiscount}`} accent />
          )}
          {order.pricing.deliveryFee > 0 && (
            <Row label="外送費" value={`$${order.pricing.deliveryFee}`} />
          )}
          {order.pricing.freeDeliveryApplied && (
            <Row label="外送費（滿額免運）" value="免費" accent />
          )}
        </div>

        <Separator />

        <div className="flex items-end justify-between">
          <span className="text-xs text-muted-foreground">應付總計</span>
          <span className="font-mono text-3xl font-bold text-primary">${order.pricing.total}</span>
        </div>

        {order.note && (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs italic text-muted-foreground">
            備註：{order.note}
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t border-border bg-secondary/40 px-6 py-4 print:hidden">
        <Button variant="outline" className="flex-1" onClick={() => downloadReceipt(order)}>
          <Download className="mr-1 h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> 列印
        </Button>
        {onClose && (
          <Button className="flex-1" onClick={onClose}>
            <X className="mr-1 h-4 w-4" /> 關閉
          </Button>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-primary" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
