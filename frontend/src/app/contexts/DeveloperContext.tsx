import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { settingsApi, type ShopSettings, type ShopSettingsUpdate } from '../api/settingsApi';

interface DeveloperFeatures {
    editProfile: boolean;
    darkMode: boolean;
    salesHistory: boolean;
    enableContactActions: boolean;
    serviceViewToggle: boolean;
    reportExport: boolean;
    pushNotifications: boolean;
    autoGenerateServiceLogId: boolean;
}

export interface ShopConfig {
    name: string;
    phone: string;
    address: string;
    gst: string;
    email?: string;
    /** Prefix shown before every Service Log ID (e.g. "SRV-"). Set by admin or developer. Empty = no prefix. */
    serviceLogIdPrefix: string;
}

/** Normalise a user-typed prefix: trim, drop characters that are not letters/digits/-/_/#//, cap length. */
export function sanitizeServiceLogIdPrefix(raw: string): string {
    return raw.replace(/[^A-Za-z0-9\-_#/]/g, '').slice(0, 10);
}

/** Display a service log ID with the configured prefix, e.g. ("SRV-", "12") → "SRV-12". */
export function formatServiceLogId(prefix: string | undefined, id: string | number | undefined | null): string {
    const value = id === undefined || id === null ? '' : String(id);
    return `${prefix ?? ''}${value}`;
}

export type SettingsSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

interface DeveloperContextType {
    features: DeveloperFeatures;
    toggleFeature: (featureName: keyof DeveloperFeatures) => void;
    shopConfig: ShopConfig;
    updateShopConfig: (newConfig: Partial<ShopConfig>) => void;
    /** State of the last server sync of shopConfig (settings are stored on the backend and shared across devices). */
    settingsSyncStatus: SettingsSyncStatus;
    settingsSyncError: string | null;
    /** Re-fetch shop settings from the server (called automatically on mount and after login). */
    refreshShopConfig: () => Promise<void>;
}

/** Window event dispatched by AuthContext after a successful login so settings can be re-fetched. */
export const AUTH_CHANGED_EVENT = 'auth:changed';

/** Map between the camelCase ShopConfig used by the UI and the snake_case settings API. */
const SHOP_CONFIG_TO_SETTINGS: Record<keyof ShopConfig, keyof ShopSettings> = {
    name: 'shop_name',
    phone: 'shop_phone',
    address: 'shop_address',
    gst: 'shop_gst',
    email: 'shop_email',
    serviceLogIdPrefix: 'service_log_id_prefix',
};

export function settingsToShopConfig(settings: Partial<ShopSettings> | null | undefined, base: ShopConfig): ShopConfig {
    if (!settings) return base;
    const next: ShopConfig = { ...base };
    (Object.keys(SHOP_CONFIG_TO_SETTINGS) as (keyof ShopConfig)[]).forEach((cfgKey) => {
        const apiKey = SHOP_CONFIG_TO_SETTINGS[cfgKey];
        const value = settings[apiKey];
        // null/undefined on the server = "not set yet": keep the local/default value
        if (value !== null && value !== undefined) {
            (next as any)[cfgKey] = cfgKey === 'serviceLogIdPrefix' ? sanitizeServiceLogIdPrefix(value) : value;
        }
    });
    return next;
}

export function shopConfigToSettings(patch: Partial<ShopConfig>): ShopSettingsUpdate {
    const out: ShopSettingsUpdate = {};
    (Object.keys(patch) as (keyof ShopConfig)[]).forEach((cfgKey) => {
        const apiKey = SHOP_CONFIG_TO_SETTINGS[cfgKey];
        if (apiKey) out[apiKey] = (patch[cfgKey] ?? '') as string;
    });
    return out;
}

const SAVE_DEBOUNCE_MS = 600;

const defaultFeatures: DeveloperFeatures = {
    editProfile: true, // Enabled by default
    darkMode: true,
    salesHistory: true,
    enableContactActions: false, // Default to Copy behavior
    serviceViewToggle: true,
    reportExport: true, // Enabled by default
    pushNotifications: true, // Defaultly toggled ON
    autoGenerateServiceLogId: false, // Don't auto generate log id until developer gives permission
};

const defaultShopConfig: ShopConfig = {
    name: "SMR Battery Shop",
    phone: "7092706484",
    address: "Thoothukudi, Tamilnadu",
    gst: "33XXXXX1234X1Z5",
    email: "smrbattery@gmail.com",
    serviceLogIdPrefix: "",
};

const DeveloperContext = createContext<DeveloperContextType | undefined>(undefined);

export function DeveloperProvider({ children }: { children: React.ReactNode }) {
    const [features, setFeatures] = useState<DeveloperFeatures>(() => {
        const saved = localStorage.getItem('developer_features');
        if (saved) {
            try {
                return { ...defaultFeatures, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse developer features", e);
            }
        }
        return defaultFeatures;
    });

    const [shopConfig, setShopConfig] = useState<ShopConfig>(() => {
        const saved = localStorage.getItem('developer_shop_config');
        if (saved) {
            try {
                return { ...defaultShopConfig, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Failed to parse shop config", e);
            }
        }
        return defaultShopConfig;
    });

    useEffect(() => {
        localStorage.setItem('developer_features', JSON.stringify(features));
    }, [features]);

    useEffect(() => {
        localStorage.setItem('developer_shop_config', JSON.stringify(shopConfig));
    }, [shopConfig]);

    // ---- Server sync: settings live on the backend so every device sees the same values ----
    const [settingsSyncStatus, setSettingsSyncStatus] = useState<SettingsSyncStatus>('idle');
    const [settingsSyncError, setSettingsSyncError] = useState<string | null>(null);
    const pendingPatchRef = useRef<ShopSettingsUpdate>({});
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasAuthToken = () => {
        try { return !!localStorage.getItem('auth_token'); } catch { return false; }
    };

    const refreshShopConfig = useCallback(async () => {
        if (!hasAuthToken()) return;
        try {
            const settings = await settingsApi.getSettings();
            setShopConfig(prev => settingsToShopConfig(settings, prev));
            setSettingsSyncStatus('idle');
            setSettingsSyncError(null);
        } catch (e: any) {
            // Offline / server down: keep using the cached localStorage copy
            setSettingsSyncStatus('error');
            setSettingsSyncError(e?.message || 'Could not load settings from server');
        }
    }, []);

    useEffect(() => {
        // Defer the initial fetch out of the effect body (avoids sync setState-in-effect)
        queueMicrotask(() => { refreshShopConfig(); });
        const onAuthChanged = () => { refreshShopConfig(); };
        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        return () => {
            window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [refreshShopConfig]);

    const flushPendingSave = useCallback(async () => {
        const patch = pendingPatchRef.current;
        pendingPatchRef.current = {};
        if (Object.keys(patch).length === 0 || !hasAuthToken()) return;
        setSettingsSyncStatus('saving');
        try {
            const settings = await settingsApi.updateSettings(patch);
            setShopConfig(prev => settingsToShopConfig(settings, prev));
            setSettingsSyncStatus('saved');
            setSettingsSyncError(null);
        } catch (e: any) {
            setSettingsSyncStatus('error');
            setSettingsSyncError(e?.message || 'Could not save settings to server');
        }
    }, []);

    const queueSave = useCallback((patch: Partial<ShopConfig>) => {
        pendingPatchRef.current = { ...pendingPatchRef.current, ...shopConfigToSettings(patch) };
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => { flushPendingSave(); }, SAVE_DEBOUNCE_MS);
    }, [flushPendingSave]);

    const toggleFeature = (featureName: keyof DeveloperFeatures) => {
        setFeatures(prev => ({
            ...prev,
            [featureName]: !prev[featureName]
        }));
    };

    const updateShopConfig = (newConfig: Partial<ShopConfig>) => {
        const clean: Partial<ShopConfig> = { ...newConfig };
        if (newConfig.serviceLogIdPrefix !== undefined) {
            clean.serviceLogIdPrefix = sanitizeServiceLogIdPrefix(newConfig.serviceLogIdPrefix);
        }
        setShopConfig(prev => ({ ...prev, ...clean }));
        queueSave(clean);
    };

    return (
        <DeveloperContext.Provider value={{
            features, toggleFeature, shopConfig, updateShopConfig,
            settingsSyncStatus, settingsSyncError, refreshShopConfig,
        }}>
            {children}
        </DeveloperContext.Provider>
    );
}

/**
 * Read the configured Service Log ID prefix. Safe to call outside a DeveloperProvider
 * (returns "" so read-only screens and tests keep working without the provider).
 */
export function useServiceLogIdPrefix(): string {
    const context = useContext(DeveloperContext);
    return context?.shopConfig.serviceLogIdPrefix ?? '';
}

export function useDeveloper() {
    const context = useContext(DeveloperContext);
    if (!context) {
        throw new Error("useDeveloper must be used within a DeveloperProvider");
    }
    return context;
}
