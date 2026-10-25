// ── Configuration Context ──────────────────────────────────────────────────────
// Replit PostgreSQL is the source of truth for internal settings. localStorage
// remains a cache for synchronous consumers such as document ID generators.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  CONFIG_DEFAULTS,
  CONFIG_STORAGE_KEY,
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
import { getCurrencyCode } from "@/lib/formatters";
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

function sanitizeLegacySettings(settings: GeneralSettings): GeneralSettings {
  const organization = { ...settings.organization };
  const oldDemoValues: Record<string, string> = {
    gstNumber: "27AACCN1234A1Z5",
    panNumber: "AACCN1234A",
    phone: "+91-44-1234-5678",
    email: "info@nido-tech.com",
    supportEmail: "support@nido-tech.com",
    website: "www.nido-tech.com",
  };

  for (const [key, demoValue] of Object.entries(oldDemoValues)) {
    if (organization[key as keyof typeof organization] === demoValue) {
      organization[key as keyof typeof organization] = "";
    }
  }

  const rates = settings.localization.exchangeRates;
  const hadOldDemoRates =
    rates.INR === 1 &&
    rates.USD === 0.010471 &&
    rates.EUR === 0.009061 &&
    rates.GBP === 0.007743 &&
    rates.AED === 0.038454;

  return {
    ...settings,
    organization,
    localization: hadOldDemoRates
      ? {
          ...settings.localization,
          exchangeRates: { INR: 1 },
          exchangeRatesUpdatedAt: "",
        }
      : settings.localization,
  };
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [config, setConfig] = useState<GeneralSettings>(() => loadConfig());
  const [savedConfig, setSavedConfig] = useState<GeneralSettings>(() => loadConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const remoteUpdatedAt = useRef<string | null>(null);
  const syncedUserId = useRef<string | null>(null);
  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

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

      const response = await fetch("/api/platform-settings/general", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Shared settings could not be saved.",
        );
      }

      const savedSettings =
        payload.settings && typeof payload.settings === "object"
          ? (payload.settings as GeneralSettings)
          : settings;
      saveConfig(savedSettings);
      const normalized = loadConfig();
      setConfig(normalized);
      setSavedConfig(normalized);
      remoteUpdatedAt.current =
        typeof payload.updatedAt === "string" ? payload.updatedAt : null;
      setPersistenceError(null);
      return normalized;
    },
    [isAuthenticated, user?.role, user?.userType],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    if (user.userType !== "nido_admin") {
      // Do not leave internal company settings in the browser cache when a
      // client portal account signs in on the same device.
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      const safeConfig = loadConfig();
      setConfig(safeConfig);
      setSavedConfig(safeConfig);
      remoteUpdatedAt.current = null;
      syncedUserId.current = user.id;
      setPersistenceError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    if (syncedUserId.current !== user.id) setIsLoading(true);
    const syncFromDatabase = async () => {
      if (cancelled || (isDirtyRef.current && syncedUserId.current === user.id)) {
        return;
      }
      try {
        const response = await fetch("/api/platform-settings/general", {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Shared settings could not be loaded.");
        }
        const payload = (await response.json()) as {
          settings?: GeneralSettings | null;
          updatedAt?: string | null;
        };

        if (payload.settings) {
          const updatedAt = payload.updatedAt ?? null;
          if (updatedAt !== remoteUpdatedAt.current) {
            saveConfig(payload.settings);
            const normalized = loadConfig();
            setConfig(normalized);
            setSavedConfig(normalized);
            remoteUpdatedAt.current = updatedAt;
          }
          syncedUserId.current = user.id;
          setPersistenceError(null);
          return;
        }

        // One-time, non-destructive import of this owner's saved browser
        // settings. If no saved settings exist, store clean application
        // defaults so all sessions read the same prefix list from PostgreSQL.
        if (user.role === "System Owner") {
          const hadSavedSettings =
            localStorage.getItem(CONFIG_STORAGE_KEY) !== null;
          const initialSettings = hadSavedSettings
            ? sanitizeLegacySettings(loadConfig())
            : sanitizeLegacySettings(CONFIG_DEFAULTS);
          await persistSettings(initialSettings);
        }
        syncedUserId.current = user.id;
      } catch (error) {
        if (!cancelled) {
          setPersistenceError(
            error instanceof Error
              ? error.message
              : "Shared settings could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          syncedUserId.current = user.id;
          setIsLoading(false);
        }
      }
    };

    void syncFromDatabase();
    const timer = window.setInterval(() => {
      void syncFromDatabase();
    }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    authLoading,
    isAuthenticated,
    user?.id,
    user?.role,
    user?.userType,
    persistSettings,
  ]);

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
        const previousConfig = loadConfig();
        const previousCurrency = getCurrencyCode(
          previousConfig.localization.currency,
        );
        const selectedCurrency = getCurrencyCode(
          newConfig.localization.currency,
        );
        const committed = await persistSettings(newConfig);

        if (previousCurrency !== selectedCurrency) {
          try {
            const response = await fetch("/api/exchange-rates?base=INR", {
              credentials: "include",
            });
            if (!response.ok) {
              throw new Error(
                `Exchange-rate request failed (${response.status})`,
              );
            }
            const payload = (await response.json()) as {
              rates?: Record<string, number>;
              fetchedAt?: string;
            };
            if (payload.rates && typeof payload.rates[selectedCurrency] === "number") {
              await persistSettings({
                ...committed,
                localization: {
                  ...committed.localization,
                  exchangeRates: {
                    ...committed.localization.exchangeRates,
                    ...payload.rates,
                    INR: 1,
                  },
                  exchangeRatesUpdatedAt:
                    payload.fetchedAt ?? new Date().toISOString(),
                },
              });
            }
          } catch {
            setPersistenceError(
              "Settings were saved, but live currency rates could not be refreshed.",
            );
          }
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Settings could not be saved to the shared database.";
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
