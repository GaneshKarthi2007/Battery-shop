import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDeveloper } from './DeveloperContext';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { features } = useDeveloper();

    // Default to light mode or local storage if it exists
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        const saved = localStorage.getItem('powercell_dark_mode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        // If developer turned off the dark mode module entirely, force light mode.
        const shouldBeDark = isDarkMode && features.darkMode;

        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        localStorage.setItem('powercell_dark_mode', JSON.stringify(isDarkMode));
    }, [isDarkMode, features.darkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
