import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Minus, Trash2, ShoppingBag, Egg, Beef, ArrowUpCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "拉麵點餐機 | 一期一會拉麵屋" },
      { name: "description", content: "線上點餐系統 — 鹽味、醬油、豚骨拉麵，可加大、糖心蛋、叉燒，加好加滿享折扣。" },
    ],
  }),
});

type FlavorId = "salt" | "shoyu" | "tonkotsu";

type Flavor = {
  id: FlavorId;
  name: string;
  jp: string;
  price: number;
  desc: string;
  accent: string;
};

const FLAVORS: Flavor[] = [
  { id: "salt", name: "鹽味拉麵", jp: "塩らーめん", price: 220, desc: "清澈金湯，鮮甜爽口", accent: "from-amber-200/60 to-amber-50" },
  { id: "shoyu", name: "醬油拉麵", jp: "醤油らーめん", price: 240, desc: "古法熟成醬油，香醇回甘", accent: "from-orange-200/60 to-amber-50" },
  { id: "tonkotsu", name: "豚骨拉麵", jp: "豚骨らーめん", price: 280, desc: "18 小時熬煮乳白濃湯", accent: "from-rose-200/60 to-amber-50" },
];

type CartItem = {
  uid: string;
  flavor: Flavor;
  big: boolean;
  egg: boolean;
  pork: boolean;
};

function itemPrice(item: CartItem) {
  let p = item.flavor.price;
  if (item.big) p += item.flavor.id === "tonkotsu" ? 50 : 30;
  if (item.egg) p += 30;
  if (item.pork) p += 60;
  if (item.big && item.egg && item.pork) p -= 20;
  return p;
}

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
      {icon}
      <span>{label}</span>
      <span className={`text-xs ${active ? "opacity-90" : "text-muted-foreground"}`}>{price}</span>
    </button>
  );
}

function FlavorCard({
  flavor, onAdd,
}: { flavor: Flavor; onAdd: (opts: { big: boolean; egg: boolean; pork: boolean }) => void }) {
  const [big, setBig] = useState(false);
  const [egg, setEgg] = useState(false);
  const [pork, setPork] = useState(false);

  const previewPrice = useMemo(
    () => itemPrice({ uid: "", flavor, big, egg, pork }),
    [flavor, big, egg, pork],
  );
  const fullCombo = big && egg && pork;

  return (
    <Card className={`relative overflow-hidden border-border/70 p-0`}>
      <div className={`bg-gradient-to-br ${flavor.accent} px-6 pt-6 pb-4`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-xs tracking-[0.3em] text-broth/80">{flavor.jp}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-foreground">{flavor.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{flavor.desc}</p>
          </div>
          <Badge variant="secondary" className="bg-card/80 font-mono text-base">
            ${flavor.price}
          </Badge>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <ToppingChip
            active={big}
            onClick={() => setBig(v => !v)}
            icon={<ArrowUpCircle className="h-4 w-4" />}
            label="加大"
            price={flavor.id === "tonkotsu" ? "+$50" : "+$30"}
          />
          <ToppingChip
            active={egg}
            onClick={() => setEgg(v => !v)}
            icon={<Egg className="h-4 w-4" />}
            label="糖心蛋"
            price="+$30"
          />
          <ToppingChip
            active={pork}
            onClick={() => setPork(v => !v)}
            icon={<Beef className="h-4 w-4" />}
            label="叉燒"
            price="+$60"
          />
        </div>

        {fullCombo && (
          <p className="rounded-md bg-accent/30 px-3 py-2 text-xs text-accent-foreground">
            🎉 加好加滿，自動折抵 $20
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">小計</p>
            <p className="font-mono text-2xl font-semibold text-primary">${previewPrice}</p>
          </div>
          <Button
            onClick={() => {
              onAdd({ big, egg, pork });
              setBig(false); setEgg(false); setPork(false);
            }}
            className="rounded-full px-5"
          >
            <Plus className="mr-1 h-4 w-4" /> 加入訂單
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Index() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitted, setSubmitted] = useState<null | { items: CartItem[]; subtotal: number; discount: number; total: number }>(null);

  const addItem = (flavor: Flavor, opts: { big: boolean; egg: boolean; pork: boolean }) => {
    if (cart.length >= 10) {
      toast.error("一次最多 10 碗喔！");
      return;
    }
    setCart(c => [...c, { uid: crypto.randomUUID(), flavor, ...opts }]);
    toast.success(`${flavor.name} 已加入訂單`);
  };

  const removeItem = (uid: string) => setCart(c => c.filter(i => i.uid !== uid));

  const subtotal = cart.reduce((s, i) => s + itemPrice(i), 0);
  const bulkDiscount = cart.length >= 2 ? cart.length * 20 : 0;
  const total = Math.max(0, subtotal - bulkDiscount);

  const checkout = () => {
    if (!cart.length) return;
    setSubmitted({ items: cart, subtotal, discount: bulkDiscount, total });
    setCart([]);
  };

  return (
    <main className="min-h-screen pb-32">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <span className="font-display text-xl">麵</span>
            </div>
            <div>
              <p className="font-display text-xs tracking-[0.3em] text-muted-foreground">ICHIGO ICHIE</p>
              <h1 className="font-display text-xl font-bold">一期一會 拉麵屋</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <ShoppingBag className="h-4 w-4" />
            <span>{cart.length} / 10 碗</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10 text-center">
        <p className="font-display text-sm tracking-[0.4em] text-primary">いらっしゃいませ</p>
        <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
          歡迎光臨，<span className="text-primary">為您奉上一碗</span>
          <br /> 用心熬煮的拉麵
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          選擇您喜愛的口味與配料，加好加滿可享優惠，點 2 碗以上每碗再折 $20。
        </p>
      </section>

      {/* Menu */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        {FLAVORS.map(f => (
          <FlavorCard key={f.id} flavor={f} onAdd={(opts) => addItem(f, opts)} />
        ))}
      </section>

      {/* Cart */}
      <section className="mx-auto mt-16 max-w-6xl px-6">
        <Card className="overflow-hidden border-border/70">
          <div className="flex items-center justify-between bg-secondary/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">您的訂單</h3>
            </div>
            <Badge variant="outline" className="font-mono">{cart.length} 碗</Badge>
          </div>

          {cart.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground">
              <p className="font-display text-base">訂單空空如也，先選一碗喜歡的拉麵吧 🍜</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((item, idx) => {
                const tags = [
                  item.big && "加大",
                  item.egg && "糖心蛋",
                  item.pork && "叉燒",
                ].filter(Boolean) as string[];
                return (
                  <li key={item.uid} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-mono text-sm text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.flavor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tags.length ? tags.join("・") : "原味"}
                      </p>
                    </div>
                    <p className="font-mono text-base font-semibold">${itemPrice(item)}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.uid)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          {cart.length > 0 && (
            <div className="space-y-2 border-t border-border bg-card px-6 py-5">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>小計</span>
                <span className="font-mono">${subtotal}</span>
              </div>
              {bulkDiscount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>多碗優惠（每碗 $20 × {cart.length}）</span>
                  <span className="font-mono">-${bulkDiscount}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">應付總金額</p>
                  <p className="font-mono text-3xl font-bold text-primary">${total}</p>
                </div>
                <Button size="lg" onClick={checkout} className="rounded-full px-8">
                  確認結帳
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Receipt modal-ish */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
              <p className="font-display text-xs tracking-[0.4em] opacity-80">RECEIPT</p>
              <h3 className="mt-1 font-display text-2xl font-bold">點餐完成 🎉</h3>
              <p className="mt-1 text-sm opacity-90">感謝您的光臨，請稍候片刻</p>
            </div>
            <div className="space-y-2 px-6 py-5 text-sm">
              {submitted.items.map((it, i) => {
                const tags = [it.big && "加大", it.egg && "糖心蛋", it.pork && "叉燒"].filter(Boolean) as string[];
                return (
                  <div key={it.uid} className="flex justify-between">
                    <span>
                      {i + 1}. {it.flavor.name}
                      {tags.length > 0 && <span className="text-muted-foreground"> · {tags.join("、")}</span>}
                    </span>
                    <span className="font-mono">${itemPrice(it)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>小計</span><span className="font-mono">${submitted.subtotal}</span>
              </div>
              {submitted.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>折扣</span><span className="font-mono">-${submitted.discount}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-lg font-semibold">
                <span>總計</span><span className="font-mono text-primary">${submitted.total}</span>
              </div>
            </div>
            <div className="flex gap-2 border-t border-border bg-secondary/40 px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setSubmitted(null)}>
                <Trash2 className="mr-1 h-4 w-4" /> 關閉
              </Button>
              <Button className="flex-1" onClick={() => setSubmitted(null)}>
                再點一份
              </Button>
            </div>
          </Card>
        </div>
      )}

      <footer className="mx-auto mt-16 max-w-6xl px-6 text-center text-xs text-muted-foreground">
        © 一期一會 拉麵屋 · 用心熬煮，誠摯款待
      </footer>
    </main>
  );
}
