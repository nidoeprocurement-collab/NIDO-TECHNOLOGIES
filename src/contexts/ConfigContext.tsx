// ── Configuration Context ──────────────────────────────────────────────────────
// Provides live GeneralSettings to every component in the tree.
// Wraps configService so components never touch localStorage directly.

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  loadConfig,
  saveConfig,
  subscribeToConfig,
  type GeneralSettings,
  type OrgSettings,
  type ThemeSettings,
  type LocalizationSettings,
  type ProcurementSettings,
  type NotificationSettings,
  type SecuritySettings,
} from "@/lib/configService";

// ── Context shape ──────────────────────────────────────────────────────────────

interface ConfigContextType {
  config: GeneralSettings;
  /** Patch a single section in memory (not yet persisted). */
  updateSection: <K extends keyof GeneralSettings>(
    section: K,
    patch: Partial<GeneralSettings[K]>
  ) => void;
  /** Persist current in-memory state to localStorage and notify the whole app. */
  saveSettings: () => void;
  /**
   * Atomically commit a complete settings snapshot — sets both in-memory config
   * and the persisted baseline in one shot.  Used by GeneralSettingsTab so that
   * draft changes are only published when the user explicitly clicks Save.
   */
  commitSettings: (newConfig: GeneralSettings) => void;
  /** True when in-memory config differs from what is persisted. */
  isDirty: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GeneralSettings>(() => loadConfig());
  const [savedConfig, setSavedConfig] = useState<GeneralSettings>(() => loadConfig());

  // Subscribe to external changes (cross-tab storage events, or other saves)
  useEffect(() => {
    const unsub = subscribeToConfig((newConfig) => {
      setConfig(newConfig);
      setSavedConfig(newConfig);
    });
    return unsub;
  }, []);

  const updateSection = useCallback(
    <K extends keyof GeneralSettings>(section: K, patch: Partial<GeneralSettings[K]>) => {
      setConfig((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...patch },
      }));
    },
    []
  );

  const saveSettings = useCallback(() => {
    // saveConfig fires the CONFIG_CHANGED_EVENT which our subscriber above will pick
    // up, but we also update savedConfig immediately to clear the dirty flag.
    saveConfig(config);
    setSavedConfig(config);
  }, [config]);

  const commitSettings = useCallback((newConfig: GeneralSettings) => {
    setConfig(newConfig);
    setSavedConfig(newConfig);
    saveConfig(newConfig);
  }, []);

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  return (
    <ConfigContext.Provider value={{ config, updateSection, saveSettings, commitSettings, isDirty }}>
      {children}
    </ConfigContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useConfig(): ConfigContextType {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within <ConfigProvider>");
  return ctx;
}

// ── Convenience section hooks ──────────────────────────────────────────────────

export function useOrgConfig(): OrgSettings {
  return useConfig().config.organization;
}

export function useThemeConfig(): ThemeSettings {
  return useConfig().config.theme;
}

export function useLocalizationConfig(): LocalizationSettings {
  return useConfig().config.localization;
}

export function useProcurementConfig(): ProcurementSettings {
  return useConfig().config.procurement;
}

export function useNotificationConfig(): NotificationSettings {
  return useConfig().config.notifications;
}

export function useSecurityConfig(): SecuritySettings {
  return useConfig().config.security;
}

// Re-export types for convenience
export type {
  GeneralSettings,
  OrgSettings,
  ThemeSettings,
  LocalizationSettings,
  ProcurementSettings,
  NotificationSettings,
  SecuritySettings,
};
