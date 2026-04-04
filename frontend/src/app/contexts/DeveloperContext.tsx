import React, { createContext, useContext, useState, useEffect } from 'react';

interface DeveloperFeatures {
    editProfile: boolean;
    darkMode: boolean;
    salesHistory: boolean;
    enableContactActions: boolean;
}

export interface ShopConfig {
    name: string;
    phone: string;
    address: string;
    gst: string;
    email?: string;
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
};

const defaultShopConfig: ShopConfig = {
    name: "SMR Battery Shop",
    phone: "7092706484",
    address: "Thoothukudi, Tamilnadu",
    gst: "33XXXXX1234X1Z5",
    email: "smrbattery@gmail.com",
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
        setShopConfig(prev => ({ ...prev, ...newConfig }));
    };

    return (
        <DeveloperContext.Provider value={{ features, toggleFeature, shopConfig, updateShopConfig }}>
            {children}
        </DeveloperContext.Provider>
    );
}

export function useDeveloper() {
    const context = useContext(DeveloperContext);
    if (!context) {
        throw new Error("useDeveloper must be used within a DeveloperProvider");
    }
    return context;
}
