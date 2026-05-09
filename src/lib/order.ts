export type FlavorId = "salt" | "shoyu" | "tonkotsu";

export type Flavor = {
  id: FlavorId;
  name: string;
  jp: string;
  price: number;
  desc: string;
  accent: string;
};

export const FLAVORS: Flavor[] = [
  { id: "salt", name: "鹽味拉麵", jp: "塩らーめん", price: 220, desc: "清澈金湯，鮮甜爽口", accent: "from-amber-200/60 to-amber-50" },
  { id: "shoyu", name: "醬油拉麵", jp: "醤油らーめん", price: 240, desc: "古法熟成醬油，香醇回甘", accent: "from-orange-200/60 to-amber-50" },
  { id: "tonkotsu", name: "豚骨拉麵", jp: "豚骨らーめん", price: 280, desc: "18 小時熬煮乳白濃湯", accent: "from-rose-200/60 to-amber-50" },
];

export type CartItem = {
  uid: string;
  flavorId: FlavorId;
  big: boolean;
  egg: boolean;
  pork: boolean;
};

export const TOPPING_PRICE = {
  bigDefault: 30,
  bigTonkotsu: 50,
  egg: 30,
  pork: 60,
} as const;

export type DiscountRules = {
  /** 加好加滿（同碗三項加料皆加）每碗折抵 */
  fullComboPerBowl: number;
  /** 多碗折扣門檻 */
  bulkMinBowls: number;
  /** 多碗折扣每碗折抵 */
  bulkPerBowl: number;
  /** 外送費 */
  deliveryFee: number;
  /** 訂單滿額免外送費 */
  freeDeliveryOver: number;
};

export const DEFAULT_RULES: DiscountRules = {
  fullComboPerBowl: 20,
  bulkMinBowls: 2,
  bulkPerBowl: 20,
  deliveryFee: 60,
  freeDeliveryOver: 800,
};

export function flavorOf(id: FlavorId): Flavor {
  return FLAVORS.find(f => f.id === id)!;
}

export function basePrice(item: CartItem) {
  return flavorOf(item.flavorId).price;
}

export function toppingsPrice(item: CartItem) {
  let p = 0;
  if (item.big) p += item.flavorId === "tonkotsu" ? TOPPING_PRICE.bigTonkotsu : TOPPING_PRICE.bigDefault;
  if (item.egg) p += TOPPING_PRICE.egg;
  if (item.pork) p += TOPPING_PRICE.pork;
  return p;
}

/** 單碗未折扣價 */
export function itemGross(item: CartItem) {
  return basePrice(item) + toppingsPrice(item);
}

/** 該碗符合加好加滿 */
export function isFullCombo(item: CartItem) {
  return item.big && item.egg && item.pork;
}

export type PricingBreakdown = {
  subtotal: number;
  fullComboBowls: number;
  fullComboDiscount: number;
  bulkDiscount: number;
  deliveryFee: number;
  freeDeliveryApplied: boolean;
  total: number;
};

export type FulfillmentType = "pickup" | "delivery";

export function computePricing(
  items: CartItem[],
  rules: DiscountRules,
  fulfillment: FulfillmentType,
): PricingBreakdown {
  const subtotal = items.reduce((s, i) => s + itemGross(i), 0);
  const fullComboBowls = items.filter(isFullCombo).length;
  const fullComboDiscount = fullComboBowls * rules.fullComboPerBowl;
  const bulkDiscount = items.length >= rules.bulkMinBowls ? items.length * rules.bulkPerBowl : 0;
  const afterDiscount = Math.max(0, subtotal - fullComboDiscount - bulkDiscount);

  let deliveryFee = 0;
  let freeDeliveryApplied = false;
  if (fulfillment === "delivery") {
    if (afterDiscount >= rules.freeDeliveryOver) {
      freeDeliveryApplied = true;
    } else {
      deliveryFee = rules.deliveryFee;
    }
  }
  return {
    subtotal,
    fullComboBowls,
    fullComboDiscount,
    bulkDiscount,
    deliveryFee,
    freeDeliveryApplied,
    total: afterDiscount + deliveryFee,
  };
}

export function itemTagList(item: CartItem) {
  return [item.big && "加大", item.egg && "糖心蛋", item.pork && "叉燒"].filter(Boolean) as string[];
}

export type OrderStatus = "created" | "preparing" | "completed";

export const ORDER_STATUS_FLOW: OrderStatus[] = ["created", "preparing", "completed"];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; emoji: string; tone: string }> = {
  created: { label: "已建立", emoji: "📝", tone: "bg-secondary text-secondary-foreground" },
  preparing: { label: "備餐中", emoji: "🍳", tone: "bg-amber-100 text-amber-900" },
  completed: { label: "完成", emoji: "✅", tone: "bg-emerald-100 text-emerald-900" },
};

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(s);
  return i >= 0 && i < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[i + 1] : null;
}

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  fulfillment: FulfillmentType;
  scheduledAt: string; // ISO
  note?: string;
  rulesSnapshot: DiscountRules;
  pricing: PricingBreakdown;
  status: OrderStatus;
};

/** 計算可讀折扣解釋（用於收據逐條顯示） */
export type DiscountExplain = {
  key: string;
  label: string;
  formula: string;
  amount: number; // 負數=折抵, 正數=加收, 0=資訊
  kind: "discount" | "fee" | "info";
};

export function explainPricing(
  items: CartItem[],
  rules: DiscountRules,
  fulfillment: FulfillmentType,
  pricing: PricingBreakdown,
): DiscountExplain[] {
  const out: DiscountExplain[] = [];
  if (pricing.fullComboBowls > 0) {
    out.push({
      key: "fullCombo",
      label: "加好加滿折扣",
      formula: `${pricing.fullComboBowls} 碗 × $${rules.fullComboPerBowl} = $${pricing.fullComboDiscount}`,
      amount: -pricing.fullComboDiscount,
      kind: "discount",
    });
  }
  if (items.length >= rules.bulkMinBowls) {
    out.push({
      key: "bulk",
      label: `多碗優惠（滿 ${rules.bulkMinBowls} 碗）`,
      formula: `${items.length} 碗 × $${rules.bulkPerBowl} = $${pricing.bulkDiscount}`,
      amount: -pricing.bulkDiscount,
      kind: "discount",
    });
  } else if (items.length > 0) {
    out.push({
      key: "bulk-info",
      label: "多碗優惠",
      formula: `再點 ${rules.bulkMinBowls - items.length} 碗即享每碗折 $${rules.bulkPerBowl}`,
      amount: 0,
      kind: "info",
    });
  }
  if (fulfillment === "delivery") {
    const afterDiscount = pricing.subtotal - pricing.fullComboDiscount - pricing.bulkDiscount;
    if (pricing.freeDeliveryApplied) {
      out.push({
        key: "delivery",
        label: "外送費（滿額免運）",
        formula: `折抵後 $${afterDiscount} ≥ 免運門檻 $${rules.freeDeliveryOver}`,
        amount: -rules.deliveryFee,
        kind: "discount",
      });
    } else {
      out.push({
        key: "delivery",
        label: "外送費",
        formula: `差 $${Math.max(0, rules.freeDeliveryOver - afterDiscount)} 即可免運`,
        amount: pricing.deliveryFee,
        kind: "fee",
      });
    }
  }
  return out;
}

const HISTORY_KEY = "ramen.orders.v1";
const RULES_KEY = "ramen.rules.v1";
const PENDING_CART_KEY = "ramen.pendingCart.v1";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const all = loadOrders();
  all.unshift(order);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all.slice(0, 100)));
}

export function getOrder(id: string): Order | undefined {
  return loadOrders().find(o => o.id === id);
}

export function deleteOrder(id: string) {
  const all = loadOrders().filter(o => o.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

export function loadRules(): DiscountRules {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    return { ...DEFAULT_RULES, ...JSON.parse(localStorage.getItem(RULES_KEY) || "{}") };
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveRules(rules: DiscountRules) {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}
