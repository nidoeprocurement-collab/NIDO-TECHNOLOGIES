import React, { createContext, useContext, useState, ReactNode } from 'react';
import { reserveStock, releaseStock, releasePartial, reserveExtra, type StockAllocation } from '@/lib/stockEngine';

export type CartItem = {
  id: number;
  name: string;
  image: string;
  specs: string[];
  moq: number;
  /** Combined stock across all vendors at the time this item was added. 0 = unknown. */
  totalStock: number;
  priceNum: number;
  quantity: number;
  clientId?: string;
  category?: string;
  productCode?: string;
  leadTime?: string;
  /** Which vendor contributed how many units — used to restore stock on remove/decrease. */
  vendorAllocations: StockAllocation[];
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'vendorAllocations'>, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (
    product: Omit<CartItem, 'quantity' | 'vendorAllocations'>,
    quantity: number = product.moq,
  ) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        // Item already in cart — reserve only the additional qty.
        const extra = Math.max(0, quantity);
        if (extra === 0) return prev;
        const newAllocations = reserveExtra(
          product.productCode || '',
          extra,
          existing.vendorAllocations,
        );
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + extra, vendorAllocations: newAllocations }
            : i,
        );
      }
      // New item — reserve stock and store the allocation.
      const allocations = reserveStock(product.productCode || '', quantity);
      return [...prev, { ...product, quantity, vendorAllocations: allocations }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) releaseStock(item.vendorAllocations);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        const moqFloor = i.moq > 0 ? i.moq : 1;
        // Stock ceiling: how many can the cart hold?
        // = qty already reserved (which is deducted from vendor stock)
        //   + what's still left on vendor shelves
        // We read totalStock as a hint; the real guard is what reserveStock returns.
        const rawQty = Math.max(moqFloor, quantity);

        if (rawQty === i.quantity) return i;

        let newAllocations = i.vendorAllocations;

        if (rawQty > i.quantity) {
          // Increasing qty — try to reserve the difference.
          const diff = rawQty - i.quantity;
          newAllocations = reserveExtra(i.productCode || '', diff, i.vendorAllocations);
          // Actual qty = sum of all allocated units (may be < rawQty if stock ran out).
          const actualQty = newAllocations.reduce((s, a) => s + a.allocated, 0);
          return { ...i, quantity: Math.max(moqFloor, actualQty), vendorAllocations: newAllocations };
        } else {
          // Decreasing qty — release the difference back to vendors.
          const diff = i.quantity - rawQty;
          newAllocations = releasePartial(i.vendorAllocations, diff);
          return { ...i, quantity: rawQty, vendorAllocations: newAllocations };
        }
      }),
    );
  };

  const clearCart = () => {
    setItems((prev) => {
      prev.forEach((item) => releaseStock(item.vendorAllocations));
      return [];
    });
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
