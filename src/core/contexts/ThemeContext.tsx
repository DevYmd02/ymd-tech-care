/**
 * @file ThemeContext.tsx
 * @description Theme Context สำหรับจัดการ Dark/Light Mode
 * @usage ครอบ App ด้วย ThemeProvider และใช้ useTheme() hook
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

// ====================================================================================
// CONTEXT
// ====================================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ====================================================================================
// PROVIDER
// ====================================================================================

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize theme from localStorage or system preference
    const [theme, setThemeState] = useState<Theme>(() => {
        // Check localStorage first
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored) return stored;

        // Otherwise check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Toggle between light and dark
    const toggleTheme = () => {
        setThemeState(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Set specific theme
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// ====================================================================================
// HOOK
// ====================================================================================

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
