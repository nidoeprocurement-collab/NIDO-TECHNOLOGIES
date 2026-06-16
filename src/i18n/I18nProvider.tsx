import React, { createContext, ReactNode } from 'react';

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
