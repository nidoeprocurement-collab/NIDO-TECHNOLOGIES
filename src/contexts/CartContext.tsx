import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface StockAllocation {
  vendorId: string;
  vendorProductId: string;
  vendorName: string;
  allocated: number;
}

export type CartItem = {
  id: number;
  name: string;
  image: string;
  specs: string[];
  moq: number;
  /** Combined stock across all vendors at add-to-cart time. */
  totalStock: number;
  priceNum: number;
  quantity: number;
  clientId?: string;
  category?: string;
  productCode?: string;
  leadTime?: string;
  // ── Vendor snapshot — locked at add-to-cart time by client selection ──────
  selectedVendorId?: string;
  selectedVendorName?: string;
  /** Vendor's raw base price per unit (excl. logistics/tax). */
  vendorPrice?: number;
  /** Fully-loaded landed cost per unit (incl. logistics, handling, tax). */
  landedCost?: number;
  /** GST rate % captured at time of add. */
  gstSnapshot?: number;
  /** HSN code captured at time of add. */
  hsnSnapshot?: string;
  /** Vendor rating (0-5) captured at time of add. */
  vendorRating?: number;
  /** Single-entry allocation record — kept for order-cancellation stock-release path. */
  vendorAllocations: StockAllocation[];
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'vendorAllocations'>, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  /** Like clearCart but does NOT restore vendor stock — call this after a confirmed order. */
  consumeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (
    product: Omit<CartItem, 'quantity' | 'vendorAllocations'>,
    quantity: number = Math.max(1, product.moq),
  ) => {
    setItems((prev) => {
      // Match by productCode + vendorId so the same product from different vendors is a separate line.
      const lineKey = `${product.productCode || product.id}__${product.selectedVendorId || ''}`;
      const existing = prev.find(
        (i) => `${i.productCode || i.id}__${i.selectedVendorId || ''}` === lineKey,
      );

      if (existing) {
        const newQty = existing.quantity + Math.max(0, quantity);
        const newAlloc: StockAllocation[] = product.selectedVendorId
          ? [{ vendorId: product.selectedVendorId, vendorProductId: '', vendorName: product.selectedVendorName || '', allocated: newQty }]
          : existing.vendorAllocations;
        return prev.map((i) =>
          `${i.productCode || i.id}__${i.selectedVendorId || ''}` === lineKey
            ? { ...i, quantity: newQty, vendorAllocations: newAlloc }
            : i,
        );
      }

      // New line — create allocation record for the client-selected vendor.
      const allocations: StockAllocation[] = product.selectedVendorId
        ? [{ vendorId: product.selectedVendorId, vendorProductId: '', vendorName: product.selectedVendorName || '', allocated: quantity }]
        : [];
      return [...prev, { ...product, quantity, vendorAllocations: allocations }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const moqFloor = i.moq > 0 ? i.moq : 1;
        const rawQty = Math.max(moqFloor, quantity);
        if (rawQty === i.quantity) return i;
        const newAlloc: StockAllocation[] = i.selectedVendorId
          ? [{ vendorId: i.selectedVendorId, vendorProductId: '', vendorName: i.selectedVendorName || '', allocated: rawQty }]
          : i.vendorAllocations;
        return { ...i, quantity: rawQty, vendorAllocations: newAlloc };
      }),
    );
  };

  const clearCart = () => setItems([]);

  /** Clears the cart without restoring stock — call after a confirmed order. */
  const consumeCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, consumeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
