import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface DeveloperContextType {
    features: DeveloperFeatures;
    toggleFeature: (featureName: keyof DeveloperFeatures) => void;
    shopConfig: ShopConfig;
    updateShopConfig: (newConfig: Partial<ShopConfig>) => void;
}

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

    const toggleFeature = (featureName: keyof DeveloperFeatures) => {
        setFeatures(prev => ({
            ...prev,
            [featureName]: !prev[featureName]
        }));
    };

    const updateShopConfig = (newConfig: Partial<ShopConfig>) => {
        setShopConfig(prev => {
            const next = { ...prev, ...newConfig };
            if (newConfig.serviceLogIdPrefix !== undefined) {
                next.serviceLogIdPrefix = sanitizeServiceLogIdPrefix(newConfig.serviceLogIdPrefix);
            }
            return next;
        });
    };

    return (
        <DeveloperContext.Provider value={{ features, toggleFeature, shopConfig, updateShopConfig }}>
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
