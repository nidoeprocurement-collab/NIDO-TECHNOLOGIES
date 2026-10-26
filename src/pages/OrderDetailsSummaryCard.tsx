import type { MyOrder } from "@/contexts/MyOrdersContext";
import { formatCurrency } from "@/lib/formatters";
import { ClipboardList } from "lucide-react";
import {
  calculateRemainingOrderPricing,
  getOrderSubOrderId,
} from "@/lib/orderPricing";

type OrderSummarySubOrder = {
  id: string;
  itemStatus: string;
};

function formatPrice(amount: number) {
  return formatCurrency(amount, undefined, { decimals: 2 });
}

export default function OrderDetailsSummaryCard({
  order,
  subOrders,
}: {
  order: MyOrder;
  subOrders: OrderSummarySubOrder[];
}) {
  const cancelledIds = new Set(
    subOrders.filter((subOrder) => subOrder.itemStatus === "Cancelled").map((subOrder) => subOrder.id),
  );
  const pricing = calculateRemainingOrderPricing(order, cancelledIds);
  const items = (order.cartItems || []).filter(
    (item, index) => !cancelledIds.has(getOrderSubOrderId(order.id, item, index)),
  );
  const totalItems = items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  const rowStyle = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 6,
  } as const;
  const labelStyle = {
    minWidth: 0,
    color: "#667085",
    fontSize: 11.5,
    lineHeight: 1.35,
  } as const;
  const valueStyle = {
    flexShrink: 0,
    color: "#344054",
    fontSize: 11.5,
    fontWeight: 600,
    lineHeight: 1.35,
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div style={{ height: "100%", minWidth: 0, boxSizing: "border-box", background: "#fff", border: "1px solid #e0e5eb", borderRadius: 9, padding: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <ClipboardList size={14} color="#64748b" />
          <h2 style={{ margin: 0, color: "#344054", fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap" }}>Order Summary</h2>
        </div>
        <span style={{ color: "#98a2b3", fontSize: 10.5, whiteSpace: "nowrap" }}>{order.id}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingBottom: 7, marginBottom: 7, borderBottom: "1px solid #edf0f3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          <span style={labelStyle}>Sub-Orders</span>
          <strong style={valueStyle}>{subOrders.length}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          <span style={labelStyle}>Total Items</span>
          <strong style={valueStyle}>{totalItems}</strong>
        </div>
      </div>

      <div style={{ paddingTop: 1 }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Sub-Total (excl. GST)</span>
          <span style={valueStyle}>{formatPrice(pricing.subtotalBeforeDiscount)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>GST (GST)</span>
          <span style={valueStyle}>{formatPrice(pricing.totalGst)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Shipping / delivery</span>
          <span style={valueStyle}>{formatPrice(pricing.shippingDeliveryFee)}</span>
        </div>
        <div style={{ ...rowStyle, marginBottom: 7 }}>
          <span style={labelStyle}>Consolidated Discount</span>
          <span style={{ ...valueStyle, color: "#16764a" }}>{formatPrice(pricing.discountAmount)}</span>
        </div>
        <div style={{ ...rowStyle, marginBottom: 0, paddingTop: 7, borderTop: "1px solid #e4e7ec" }}>
          <strong style={{ color: "#344054", fontSize: 12.5, lineHeight: 1.35 }}>Total Order Amount</strong>
          <strong style={{ ...valueStyle, color: "#1d4ed8", fontSize: 13.5 }}>{formatPrice(pricing.grandTotal)}</strong>
        </div>
      </div>
    </div>
  );
}
