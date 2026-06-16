import React, { createContext, ReactNode } from 'react';

export function DataProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
