import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useDeveloper } from './DeveloperContext';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: (e?: React.MouseEvent | { clientX: number; clientY: number }) => void;
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

    const toggleDarkMode = (e?: React.MouseEvent | { clientX: number; clientY: number }) => {
        const hasViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document;
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (!hasViewTransition || prefersReducedMotion) {
            setIsDarkMode(!isDarkMode);
            return;
        }

        const x = e ? e.clientX : window.innerWidth / 2;
        const y = e ? e.clientY : window.innerHeight / 2;

        const nextMode = !isDarkMode;

        // Temporarily disable standard CSS animations/transitions on elements to prevent flicker
        document.documentElement.classList.add('disable-transitions');

        if (nextMode) {
            document.documentElement.classList.add('transition-to-dark');
            document.documentElement.classList.remove('transition-to-light');
        } else {
            document.documentElement.classList.add('transition-to-light');
            document.documentElement.classList.remove('transition-to-dark');
        }

        const transition = (document as any).startViewTransition(() => {
            // flushSync forces React to synchronously apply state changes to the DOM,
            // capturing the updated components in the View Transition screenshot.
            flushSync(() => {
                setIsDarkMode(nextMode);
            });
            
            // Apply the class immediately to the DOM inside the transition callback
            // to ensure it captures the exact transition states.
            const shouldBeDark = nextMode && features.darkMode;
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        });

        transition.ready.then(() => {
            const endRadius = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            );

            if (nextMode) {
                // Circle In: New dark mode theme expands
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(0px at ${x}px ${y}px)`,
                            `circle(${endRadius}px at ${x}px ${y}px)`
                        ]
                    },
                    {
                        duration: 500,
                        easing: 'ease-in-out',
                        pseudoElement: '::view-transition-new(root)'
                    }
                );
            } else {
                // Circle Out: Old dark mode theme shrinks
                document.documentElement.animate(
                    {
                        clipPath: [
                            `circle(${endRadius}px at ${x}px ${y}px)`,
                            `circle(0px at ${x}px ${y}px)`
                        ]
                    },
                    {
                        duration: 500,
                        easing: 'ease-in-out',
                        pseudoElement: '::view-transition-old(root)'
                    }
                );
            }
        });

        transition.finished.then(() => {
            document.documentElement.classList.remove('transition-to-dark', 'transition-to-light', 'disable-transitions');
        });
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
