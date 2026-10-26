import type { MyOrder } from "@/contexts/MyOrdersContext";
import ProductConfigurationSummary from "@/components/shared/ProductConfigurationSummary";
import { formatCurrency } from "@/lib/formatters";
import {
  calculateRemainingOrderPricing,
  getOrderLineUnitPriceInclusive,
  getOrderSubOrderId,
} from "@/lib/orderPricing";

type OrderSummarySubOrder = {
  id: string;
  itemStatus: string;
};

function formatPrice(amount: number) {
  return formatCurrency(amount, undefined, { decimals: 0 });
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
  const totalDiscountPct = pricing.subtotalBeforeDiscount > 0
    ? (pricing.discountAmount / pricing.subtotalBeforeDiscount) * 100
    : 0;
  const discountDisplay = pricing.discountAmount > 0
    ? `-${formatPrice(pricing.discountAmount)} (${Number(totalDiscountPct.toFixed(2))}%)`
    : "—";

  return (
    <div className="h-full rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Order Summary</h2>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">{items.length} Items in Order</span>
      </div>

      {items.length > 0 ? (
        <div className="mb-4 space-y-3">
          {items.map((item) => (
            <div key={item.subOrderId || `${item.id}-${item.name}`} className="flex items-center gap-3">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 object-cover"
                />
              ) : (
                <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50">
                  📦
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-800">{item.name}</p>
                <p className="mt-0.5 text-xs text-gray-400">Qty: {item.quantity}</p>
                <ProductConfigurationSummary
                  configuration={item.configuration}
                  priceAdjustment={item.configurationPriceAdjustment}
                />
              </div>
              <p className="shrink-0 text-right text-xs font-semibold text-gray-900">
                {formatPrice(getOrderLineUnitPriceInclusive(item) * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-400">Item details are not available for this order.</p>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Items Subtotal</span>
          <span className="font-medium text-gray-900">{formatPrice(pricing.subtotalBeforeDiscount)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Discounts</span>
          <span className="text-right font-medium text-green-600">{discountDisplay}</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-gray-100 pt-2">
          <span className="text-gray-500">Subtotal after discounts</span>
          <span className="font-medium text-gray-900">{formatPrice(pricing.preTaxSubtotal)}</span>
        </div>
        {pricing.slabs.map((slab) => (
          <div key={slab.rate} className="flex justify-between gap-3">
            <span className="text-gray-500">Tax ({slab.rate}%)</span>
            <span className="font-medium text-gray-900">{formatPrice(slab.gst)}</span>
          </div>
        ))}
        {pricing.shippingDeliveryFee > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Shipping / Delivery Fee</span>
            <span className="font-medium text-gray-900">{formatPrice(pricing.shippingDeliveryFee)}</span>
          </div>
        )}
        {pricing.platformFee > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Platform Fee</span>
            <span className="font-medium text-gray-900">{formatPrice(pricing.platformFee)}</span>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-gray-100 pt-2">
          <span className="font-semibold text-gray-900">Total Amount</span>
          <span className="text-base font-bold text-gray-900">{formatPrice(pricing.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
