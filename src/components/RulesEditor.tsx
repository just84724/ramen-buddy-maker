import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings2, RotateCcw } from "lucide-react";
import { type DiscountRules, DEFAULT_RULES, saveRules } from "@/lib/order";
import { toast } from "sonner";

export function RulesEditor({
  rules, onChange,
}: { rules: DiscountRules; onChange: (r: DiscountRules) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(rules);

  const apply = () => {
    onChange(draft);
    saveRules(draft);
    toast.success("優惠規則已更新");
    setOpen(false);
  };
  const reset = () => {
    setDraft(DEFAULT_RULES);
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => { setDraft(rules); setOpen(true); }}>
        <Settings2 className="mr-1 h-4 w-4" /> 折扣規則
      </Button>
    );
  }

  const F = (k: keyof DiscountRules, label: string, hint?: string) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={draft[k]}
        onChange={e => setDraft({ ...draft, [k]: Number(e.target.value) || 0 })}
        className="h-8"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-semibold">自訂優惠規則</h4>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="mr-1 h-3 w-3" /> 還原預設
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {F("fullComboPerBowl", "加好加滿折抵 / 碗", "三項加料皆加")}
        {F("bulkMinBowls", "多碗折扣門檻（碗）")}
        {F("bulkPerBowl", "多碗折扣 / 碗")}
        {F("deliveryFee", "外送費")}
        {F("freeDeliveryOver", "免外送費門檻")}
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>取消</Button>
        <Button className="flex-1" onClick={apply}>套用</Button>
      </div>
    </Card>
  );
}
