import React, { createContext, ReactNode } from 'react';

export function CartProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
