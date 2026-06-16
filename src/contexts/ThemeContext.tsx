import React, { createContext, ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
