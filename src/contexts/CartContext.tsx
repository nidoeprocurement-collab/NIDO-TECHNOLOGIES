import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CartItem = {
  id: number;
  name: string;
  image: string;
  specs: string[];
  moq: number;
  /** Total units available across all vendors. 0 = unknown / not set. */
  totalStock: number;
  priceNum: number;
  quantity: number;
  clientId?: string;
  category?: string;
  productCode?: string;
  leadTime?: string;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity: number = product.moq) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      setItems((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          // Never let quantity drop below the item's MOQ.
          const moqFloor = i.moq > 0 ? i.moq : 1;
          // Never let quantity exceed available stock (when stock is known).
          const stockCeil = i.totalStock > 0 ? i.totalStock : Infinity;
          const enforced = Math.min(stockCeil, Math.max(moqFloor, quantity));
          return { ...i, quantity: enforced };
        })
      );
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
