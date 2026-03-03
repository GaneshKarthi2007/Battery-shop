import React, { createContext, useContext, useState, useEffect } from 'react';

interface DeveloperFeatures {
    editProfile: boolean;
    darkMode: boolean;
    // We can add more feature toggles here in the future
}

interface DeveloperContextType {
    features: DeveloperFeatures;
    toggleFeature: (featureName: keyof DeveloperFeatures) => void;
}

const defaultFeatures: DeveloperFeatures = {
    editProfile: true, // Enabled by default
    darkMode: true,
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

    useEffect(() => {
        localStorage.setItem('developer_features', JSON.stringify(features));
    }, [features]);

    const toggleFeature = (featureName: keyof DeveloperFeatures) => {
        setFeatures(prev => ({
            ...prev,
            [featureName]: !prev[featureName]
        }));
    };

    return (
        <DeveloperContext.Provider value={{ features, toggleFeature }}>
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
