import jsPDF from "jspdf";
import { format } from "date-fns";
import { type Order, flavorOf, itemGross, itemTagList } from "./order";

export function buildReceiptPdf(order: Order): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: [320, 600] });
  const W = 320;
  let y = 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ICHIGO ICHIE RAMEN", W / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Receipt / 收據", W / 2, y, { align: "center" });
  y += 18;

  doc.setLineDashPattern([2, 2], 0);
  doc.line(20, y, W - 20, y);
  y += 14;
  doc.setLineDashPattern([], 0);

  doc.setFontSize(9);
  doc.text(`Order: ${order.id.slice(0, 8).toUpperCase()}`, 20, y);
  doc.text(format(new Date(order.createdAt), "yyyy-MM-dd HH:mm"), W - 20, y, { align: "right" });
  y += 12;
  doc.text(
    `${order.fulfillment === "pickup" ? "Pickup / 自取" : "Delivery / 外送"}  @  ${format(new Date(order.scheduledAt), "MM-dd HH:mm")}`,
    20, y,
  );
  y += 14;

  doc.setLineDashPattern([2, 2], 0);
  doc.line(20, y, W - 20, y);
  y += 14;
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "bold");
  order.items.forEach((it, i) => {
    const f = flavorOf(it.flavorId);
    const tags = itemTagList(it);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${f.id.toUpperCase()}`, 20, y);
    doc.text(`$${itemGross(it)}`, W - 20, y, { align: "right" });
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(f.name + (tags.length ? "  +  " + tags.join(" / ") : ""), 24, y);
    y += 14;
    doc.setFontSize(9);
  });

  doc.setLineDashPattern([2, 2], 0);
  doc.line(20, y, W - 20, y);
  y += 14;
  doc.setLineDashPattern([], 0);

  const p = order.pricing;
  const row = (label: string, val: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, 20, y);
    doc.text(val, W - 20, y, { align: "right" });
    y += 12;
  };
  row("Subtotal", `$${p.subtotal}`);
  if (p.fullComboDiscount) row(`Full combo x${p.fullComboBowls}`, `-$${p.fullComboDiscount}`);
  if (p.bulkDiscount) row(`Bulk discount`, `-$${p.bulkDiscount}`);
  if (p.deliveryFee) row(`Delivery fee`, `$${p.deliveryFee}`);
  if (p.freeDeliveryApplied) row(`Free delivery`, `-`);
  y += 4;
  doc.setFontSize(12);
  row("TOTAL", `$${p.total}`, true);
  y += 18;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your visit!", W / 2, y, { align: "center" });
  y += 12;
  doc.text("感謝您的光臨", W / 2, y, { align: "center" });

  return doc;
}

export function downloadReceipt(order: Order) {
  const doc = buildReceiptPdf(order);
  doc.save(`ramen-receipt-${order.id.slice(0, 8)}.pdf`);
}
