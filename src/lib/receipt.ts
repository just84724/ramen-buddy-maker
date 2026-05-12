import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { format } from "date-fns";
import {
  type Order, flavorOf, itemGross, itemTagList, explainPricing,
  ORDER_STATUS_META,
} from "./order";

/**
 * 以 HTML → Canvas → PDF 的方式產生收據，避免 jsPDF 內建字型不支援
 * 中文造成的亂碼問題。文字會以圖片形式嵌入 PDF（不可選取，但永遠正確）。
 */
function buildReceiptHtml(order: Order): HTMLElement {
  const explains = explainPricing(order.items, order.rulesSnapshot, order.fulfillment, order.pricing);
  const meta = ORDER_STATUS_META[order.status];

  const wrap = document.createElement("div");
  wrap.style.cssText = [
    "position:fixed",
    "left:-99999px",
    "top:0",
    "width:340px",
    "padding:20px",
    "background:#ffffff",
    "color:#1a1a1a",
    'font-family:"PingFang TC","Microsoft JhengHei","Heiti TC","Noto Sans TC",sans-serif',
    "font-size:13px",
    "line-height:1.55",
  ].join(";");

  const itemsHtml = order.items.map((it, i) => {
    const f = flavorOf(it.flavorId);
    const tags = itemTagList(it);
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin:6px 0;">
        <div style="flex:1;padding-right:8px;">
          <div style="font-weight:600;">${i + 1}. ${f.name}</div>
          ${tags.length ? `<div style="font-size:11px;color:#666;margin-top:2px;">+ ${tags.join(" / ")}</div>` : ""}
        </div>
        <div style="font-family:monospace;font-weight:600;">$${itemGross(it)}</div>
      </div>`;
  }).join("");

  const explainsHtml = explains.map(e => {
    const sign = e.amount === 0 ? "—" : e.amount < 0 ? `-$${Math.abs(e.amount)}` : `+$${e.amount}`;
    const color = e.kind === "discount" ? "#b45309" : e.kind === "fee" ? "#1a1a1a" : "#888";
    return `
      <div style="background:#f7f3ec;border-radius:6px;padding:8px 10px;margin:5px 0;">
        <div style="display:flex;justify-content:space-between;font-weight:600;color:${color};">
          <span>${e.label}</span><span style="font-family:monospace;">${sign}</span>
        </div>
        <div style="font-size:11px;color:#666;margin-top:2px;">${e.formula}</div>
      </div>`;
  }).join("");

  const dash = `<div style="border-top:1px dashed #c8c0b0;margin:10px 0;"></div>`;

  wrap.innerHTML = `
    <div style="text-align:center;padding-bottom:10px;">
      <div style="font-weight:700;font-size:18px;">一期一會 拉麵屋</div>
      <div style="font-size:11px;color:#666;margin-top:2px;">RECEIPT · 收據</div>
    </div>
    ${dash}
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#444;">
      <span>訂單 #${order.id.slice(0, 8).toUpperCase()}</span>
      <span>${format(new Date(order.createdAt), "yyyy/MM/dd HH:mm")}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#444;margin-top:4px;">
      <span>${order.fulfillment === "pickup" ? "🛍️ 自取" : "🛵 外送"}</span>
      <span>預定 ${format(new Date(order.scheduledAt), "MM/dd HH:mm")}</span>
    </div>
    <div style="margin-top:6px;font-size:11px;color:#444;">
      狀態：${meta.label}
    </div>
    ${dash}
    ${itemsHtml}
    ${dash}
    <div style="display:flex;justify-content:space-between;color:#666;">
      <span>小計</span><span style="font-family:monospace;">$${order.pricing.subtotal}</span>
    </div>
    <div style="margin-top:6px;">${explainsHtml}</div>
    ${dash}
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span style="font-size:12px;color:#666;">應付總計</span>
      <span style="font-family:monospace;font-size:24px;font-weight:700;color:#b45309;">$${order.pricing.total}</span>
    </div>
    ${order.note ? `<div style="margin-top:10px;background:#f4efe6;padding:8px 10px;border-radius:6px;font-size:11px;color:#555;font-style:italic;">備註：${order.note}</div>` : ""}
    <div style="text-align:center;margin-top:14px;font-size:11px;color:#888;">
      🎉 感謝您的光臨 · Thank you!
    </div>
  `;
  return wrap;
}

export async function buildReceiptPdf(order: Order): Promise<jsPDF> {
  const node = buildReceiptHtml(order);
  document.body.appendChild(node);
  try {
    // 等字型載入完成，避免量測誤差
    if (document.fonts?.ready) await document.fonts.ready;
    const dataUrl = await toPng(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("image load failed")); });
    const imgW = 320;
    const imgH = (img.height * imgW) / img.width;
    const doc = new jsPDF({ unit: "pt", format: [imgW, imgH] });
    doc.addImage(dataUrl, "PNG", 0, 0, imgW, imgH);
    return doc;
  } finally {
    node.remove();
  }
}

export async function downloadReceipt(order: Order) {
  const doc = await buildReceiptPdf(order);
  doc.save(`ramen-receipt-${order.id.slice(0, 8)}.pdf`);
}
