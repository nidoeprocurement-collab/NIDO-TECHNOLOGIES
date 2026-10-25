// ── Configuration Context ──────────────────────────────────────────────────────
// General settings are stored in this browser for the local-only prototype.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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
import { useAuth } from "@/contexts/AuthContext";

interface ConfigContextType {
  config: GeneralSettings;
  updateSection: <K extends keyof GeneralSettings>(
    section: K,
    patch: Partial<GeneralSettings[K]>,
  ) => void;
  saveSettings: () => Promise<void>;
  commitSettings: (newConfig: GeneralSettings) => Promise<void>;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  persistenceError: string | null;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [config, setConfig] = useState<GeneralSettings>(() => loadConfig());
  const [savedConfig, setSavedConfig] = useState<GeneralSettings>(() => loadConfig());
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig);
      setSavedConfig(newConfig);
    });
    return unsubscribe;
  }, []);

  const persistSettings = useCallback(
    async (settings: GeneralSettings) => {
      if (
        !isAuthenticated ||
        user?.userType !== "nido_admin" ||
        user.role !== "System Owner"
      ) {
        throw new Error("Only the System Owner can save platform settings.");
      }

      saveConfig(settings);
      const normalized = loadConfig();
      setConfig(normalized);
      setSavedConfig(normalized);
      setPersistenceError(null);
      return normalized;
    },
    [isAuthenticated, user?.role, user?.userType],
  );

  const updateSection = useCallback(
    <K extends keyof GeneralSettings>(
      section: K,
      patch: Partial<GeneralSettings[K]>,
    ) => {
      setConfig((previous) => ({
        ...previous,
        [section]: { ...previous[section], ...patch },
      }));
    },
    [],
  );

  const commitSettings = useCallback(
    async (newConfig: GeneralSettings) => {
      setIsSaving(true);
      setPersistenceError(null);
      try {
        await persistSettings(newConfig);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Settings could not be saved in this browser.";
        setPersistenceError(message);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [persistSettings],
  );

  const saveSettings = useCallback(
    () => commitSettings(config),
    [commitSettings, config],
  );

  return (
    <ConfigContext.Provider
      value={{
        config,
        updateSection,
        saveSettings,
        commitSettings,
        isDirty,
        isLoading,
        isSaving,
        persistenceError,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ConfigContextType {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within <ConfigProvider>");
  return context;
}

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

export type {
  GeneralSettings,
  OrgSettings,
  ThemeSettings,
  LocalizationSettings,
  ProcurementSettings,
  NotificationSettings,
  SecuritySettings,
};
