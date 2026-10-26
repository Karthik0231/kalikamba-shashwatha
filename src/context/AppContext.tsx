import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColor } from '../types/database';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  language: 'kn' | 'en';
  setLanguage: (lang: 'kn' | 'en') => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'kn' | 'en'>(() => {
    return (localStorage.getItem('barkur_lang') as 'kn' | 'en') || 'kn';
  });

  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('barkur_mode') as 'light' | 'dark') || 'light';
  });

  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    return (localStorage.getItem('barkur_color') as ThemeColor) || 'forest';
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Apply dark mode and theme color to root
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('barkur_mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-color', themeColor);
    localStorage.setItem('barkur_color', themeColor);
  }, [themeColor]);

  const setLanguage = (lang: 'kn' | 'en') => {
    setLanguageState(lang);
    localStorage.setItem('barkur_lang', lang);
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        themeMode,
        setThemeMode,
        themeColor,
        setThemeColor,
        toasts,
        showToast,
      }}
    >
      {children}
      {/* Toast popup */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none no-print">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-xs sm:text-sm font-semibold flex items-center justify-between border ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-gray-900 text-white border-gray-700'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
