import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { Plus, Minus, ShoppingBag, Egg, Beef, ArrowUpCircle, Bike, Store } from "lucide-react";
import { format, addMinutes } from "date-fns";
import {
  FLAVORS, type Flavor, type CartItem, type FulfillmentType,
  itemGross, isFullCombo, computePricing, loadRules, type DiscountRules,
  itemTagList, saveOrder, flavorOf, takePendingCart,
} from "@/lib/order";
import { SiteHeader } from "@/components/SiteHeader";
import { RulesEditor } from "@/components/RulesEditor";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "拉麵點餐機 | 一期一會拉麵屋" },
      { name: "description", content: "線上點餐系統 — 鹽味、醬油、豚骨拉麵，可加大、糖心蛋、叉燒，加好加滿享折扣。" },
    ],
  }),
});

function ToppingChip({
  active, onClick, icon, label, price,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; price: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-secondary"
      }`}
    >
      {icon}<span>{label}</span>
      <span className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>{price}</span>
    </button>
  );
}

function FlavorCard({ flavor, onAdd }: { flavor: Flavor; onAdd: (opts: { big: boolean; egg: boolean; pork: boolean }) => void }) {
  const [big, setBig] = useState(false);
  const [egg, setEgg] = useState(false);
  const [pork, setPork] = useState(false);
  const preview = useMemo(
    () => itemGross({ uid: "", flavorId: flavor.id, big, egg, pork }),
    [flavor, big, egg, pork],
  );
  const fullCombo = big && egg && pork;
  return (
    <Card className="relative overflow-hidden border-border/70 p-0">
      <div className={`bg-gradient-to-br ${flavor.accent} px-6 pt-6 pb-4`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.3em] text-broth/80">{flavor.jp}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{flavor.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{flavor.desc}</p>
          </div>
          <Badge variant="secondary" className="bg-card/80 font-mono text-base">${flavor.price}</Badge>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <ToppingChip active={big} onClick={() => setBig(v => !v)} icon={<ArrowUpCircle className="h-4 w-4" />} label="加大" price={flavor.id === "tonkotsu" ? "+$50" : "+$30"} />
          <ToppingChip active={egg} onClick={() => setEgg(v => !v)} icon={<Egg className="h-4 w-4" />} label="糖心蛋" price="+$30" />
          <ToppingChip active={pork} onClick={() => setPork(v => !v)} icon={<Beef className="h-4 w-4" />} label="叉燒" price="+$60" />
        </div>
        {fullCombo && (
          <p className="rounded-md bg-accent/30 px-3 py-2 text-xs text-accent-foreground">🎉 加好加滿，每碗自動折抵</p>
        )}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">小計</p>
            <p className="font-mono text-2xl font-semibold text-primary">${preview}</p>
          </div>
          <Button onClick={() => { onAdd({ big, egg, pork }); setBig(false); setEgg(false); setPork(false); }} className="rounded-full px-5">
            <Plus className="mr-1 h-4 w-4" /> 加入訂單
          </Button>
        </div>
      </div>
    </Card>
  );
}

function nowPlus(minutes: number) {
  return format(addMinutes(new Date(), minutes), "yyyy-MM-dd'T'HH:mm");
}

function Index() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [rules, setRules] = useState<DiscountRules>(() => loadRules());
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [scheduledAt, setScheduledAt] = useState<string>(() => nowPlus(20));
  const [note, setNote] = useState("");

  useEffect(() => { setRules(loadRules()); }, []);

  const addItem = (flavor: Flavor, opts: { big: boolean; egg: boolean; pork: boolean }) => {
    if (cart.length >= 10) return toast.error("一次最多 10 碗喔！");
    setCart(c => [...c, { uid: crypto.randomUUID(), flavorId: flavor.id, ...opts }]);
    toast.success(`${flavor.name} 已加入訂單`);
  };
  const removeItem = (uid: string) => setCart(c => c.filter(i => i.uid !== uid));

  const pricing = useMemo(() => computePricing(cart, rules, fulfillment), [cart, rules, fulfillment]);

  const checkout = () => {
    if (!cart.length) return;
    if (!scheduledAt) return toast.error("請選擇取餐 / 送達時間");
    const order = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      items: cart,
      fulfillment,
      scheduledAt: new Date(scheduledAt).toISOString(),
      note: note.trim() || undefined,
      rulesSnapshot: rules,
      pricing,
    };
    saveOrder(order);
    setCart([]); setNote("");
    toast.success("訂單已建立");
    navigate({ to: "/order/$orderId", params: { orderId: order.id } });
  };

  return (
    <main className="min-h-screen pb-32">
      <Toaster position="top-center" richColors />
      <SiteHeader cartCount={cart.length} />

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-8 text-center">
        <p className="font-display text-sm tracking-[0.4em] text-primary">いらっしゃいませ</p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          歡迎光臨，<span className="text-primary">為您奉上一碗</span><br /> 用心熬煮的拉麵
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          選擇您喜愛的口味與配料，加好加滿可享優惠，點 {rules.bulkMinBowls} 碗以上每碗再折 ${rules.bulkPerBowl}。
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        {FLAVORS.map(f => (<FlavorCard key={f.id} flavor={f} onAdd={(opts) => addItem(f, opts)} />))}
      </section>

      <section className="mx-auto mt-14 grid max-w-6xl gap-6 px-6 lg:grid-cols-[1fr_360px]">
        {/* Cart */}
        <Card className="overflow-hidden border-border/70">
          <div className="flex items-center justify-between bg-secondary/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">您的訂單</h3>
            </div>
            <Badge variant="outline" className="font-mono">{cart.length} 碗</Badge>
          </div>

          {cart.length === 0 ? (
            <div className="px-6 py-16 text-center text-muted-foreground">
              <p className="font-display text-base">訂單空空如也，先選一碗喜歡的拉麵吧 🍜</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((item, idx) => {
                const tags = itemTagList(item);
                return (
                  <li key={item.uid} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-mono text-sm text-primary">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="font-medium">{flavorOf(item.flavorId).name}</p>
                      <p className="text-xs text-muted-foreground">{tags.length ? tags.join("・") : "原味"}</p>
                    </div>
                    {isFullCombo(item) && (
                      <Badge variant="outline" className="border-accent text-accent-foreground">加好加滿</Badge>
                    )}
                    <p className="font-mono text-base font-semibold">${itemGross(item)}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.uid)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {cart.length > 0 && (
            <div className="space-y-4 border-t border-border bg-card px-6 py-5">
              {/* Fulfillment */}
              <div className="grid grid-cols-2 gap-2">
                <FulfillmentBtn icon={<Store className="h-4 w-4" />} label="自取" hint="店內取餐" active={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")} />
                <FulfillmentBtn icon={<Bike className="h-4 w-4" />} label="外送" hint={`滿 $${rules.freeDeliveryOver} 免運`} active={fulfillment === "delivery"} onClick={() => setFulfillment("delivery")} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{fulfillment === "pickup" ? "預定取餐時間" : "預定送達時間"}</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">備註（選填）</Label>
                  <Textarea value={note} onChange={e => setNote(e.target.value)} className="h-9 min-h-9 resize-none" placeholder="例：不要香菜" />
                </div>
              </div>

              {/* Live discount breakdown */}
              <div className="space-y-1 rounded-lg bg-secondary/40 p-3 text-sm">
                <RowLine label="小計" value={`$${pricing.subtotal}`} />
                {pricing.fullComboDiscount > 0 && (
                  <RowLine accent
                    label={`加好加滿折抵（${pricing.fullComboBowls} 碗 × $${rules.fullComboPerBowl}）`}
                    value={`-$${pricing.fullComboDiscount}`} />
                )}
                {pricing.bulkDiscount > 0 ? (
                  <RowLine accent
                    label={`多碗優惠（${cart.length} 碗 × $${rules.bulkPerBowl}）`}
                    value={`-$${pricing.bulkDiscount}`} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    再點 {Math.max(0, rules.bulkMinBowls - cart.length)} 碗即可享多碗優惠
                  </p>
                )}
                {fulfillment === "delivery" && (
                  pricing.freeDeliveryApplied
                    ? <RowLine accent label="外送費（滿額免運）" value="免費" />
                    : <RowLine label={`外送費（差 $${Math.max(0, rules.freeDeliveryOver - (pricing.subtotal - pricing.fullComboDiscount - pricing.bulkDiscount))} 免運）`} value={`$${pricing.deliveryFee}`} />
                )}
              </div>

              <Separator />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">應付總金額</p>
                  <p className="font-mono text-3xl font-bold text-primary">${pricing.total}</p>
                </div>
                <Button size="lg" onClick={checkout} className="rounded-full px-8">確認結帳</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Side: rules editor */}
        <div className="space-y-3">
          <Card className="space-y-2 p-4 text-sm">
            <h4 className="font-display font-semibold">目前優惠</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>· 加好加滿（同碗加大 + 糖心蛋 + 叉燒）每碗折 ${rules.fullComboPerBowl}</li>
              <li>· 點 {rules.bulkMinBowls} 碗以上每碗再折 ${rules.bulkPerBowl}</li>
              <li>· 外送費 ${rules.deliveryFee}，滿 ${rules.freeDeliveryOver} 免運</li>
            </ul>
            <div className="pt-2">
              <RulesEditor rules={rules} onChange={setRules} />
            </div>
          </Card>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-6xl px-6 text-center text-xs text-muted-foreground">
        © 一期一會 拉麵屋 · 用心熬煮，誠摯款待
      </footer>
    </main>
  );
}

function RowLine({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${accent ? "text-primary" : "text-muted-foreground"}`}>
      <span>{label}</span><span className="font-mono">{value}</span>
    </div>
  );
}

function FulfillmentBtn({ icon, label, hint, active, onClick }: { icon: React.ReactNode; label: string; hint: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} type="button"
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
    </button>
  );
}
