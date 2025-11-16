import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => Promise<void>;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    card: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const lightColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  text: '#1D1D1F',
  textSecondary: '#6E6E73',
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  border: '#E5E5EA',
  card: '#FFFFFF',
};

const darkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#98989D',
  primary: '#0A84FF',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  border: '#38383A',
  card: '#2C2C2E',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (profile?.theme && (profile.theme === 'light' || profile.theme === 'dark')) {
      setTheme(profile.theme);
    }
  }, [profile]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (user) {
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}