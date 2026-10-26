import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ThemeColor } from '../types/database';
import { PermanentSevaView } from '../components/PermanentSevaView';
import { GramaMoktesararuView } from '../components/GramaMoktesararuView';
import { AnnualKanikeView } from '../components/AnnualKanikeView';
import { isSupabaseConfigured } from '../lib/supabase';
import { repository } from '../lib/repository';
import {
  Sun,
  Moon,
  Globe,
  Palette,
  BookOpen,
  Users,
  Coins,
  Check,
  Database,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export type MainNavigationTab = 'SEVA_REGISTER' | 'MOKTESARARU' | 'ANNUAL_KANIKE';

export const TempleWorkspace: React.FC = () => {
  const { language, setLanguage, themeMode, setThemeMode, themeColor, setThemeColor, showToast } = useApp();
  const [activeMainTab, setActiveMainTab] = useState<MainNavigationTab>('SEVA_REGISTER');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const colors: { key: ThemeColor; label: string; hex: string }[] = [
    { key: 'forest', label: 'Emerald', hex: '#16a34a' },
    { key: 'saffron', label: 'Saffron', hex: '#d97706' },
    { key: 'crimson', label: 'Crimson', hex: '#e11d48' },
    { key: 'indigo', label: 'Indigo', hex: '#4f46e5' },
  ];

  // Close color picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClearMockData = () => {
    if (
      confirm(
        language === 'kn'
          ? 'ಸ್ಥಳೀಯ ಡೆಮೋ/ಡಮ್ಮಿ ಡೇಟಾವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ? (ಖಾಲಿ ಡೇಟಾಬೇಸ್‌ನೊಂದಿಗೆ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ)'
          : 'Are you sure you want to wipe all local test/dummy data? This will reset all tables to completely clean state.'
      )
    ) {
      repository.clearAllLocalData();
      showToast(
        language === 'kn' ? 'ಎಲ್ಲಾ ಡಮ್ಮಿ ಡೇಟಾ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ' : 'All test/dummy data cleared successfully',
        'info'
      );
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  const tabs: { key: MainNavigationTab; label_en: string; label_kn: string; icon: React.ReactNode }[] = [
    {
      key: 'SEVA_REGISTER',
      label_en: 'Seva Register',
      label_kn: 'ಶಾಶ್ವತ ಸೇವೆ',
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      key: 'MOKTESARARU',
      label_en: 'Grama Moktesararu',
      label_kn: 'ಗ್ರಾಮ ಮೊಕ್ತೇಸರರು',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      key: 'ANNUAL_KANIKE',
      label_en: 'Annual Kanike',
      label_kn: 'ವಾರ್ಷಿಕ ಕಾಣಿಕೆ',
      icon: <Coins className="w-3.5 h-3.5" />,
    },
  ];

  const currentColor = colors.find(c => c.key === themeColor) || colors[0];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090e14] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#0d131c] border-b border-slate-200 dark:border-slate-800/80 no-print">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          {/* Top Row: Brand + Controls */}
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0 shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
                style={{ background: currentColor.hex }}
              >
                ಕಾ
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  {language === 'kn' ? 'ಶ್ರೀ ಕಾಳಿಕಾಂಬಾ ದೇವಸ್ಥಾನ' : 'Sri Kalikamba Temple'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight hidden sm:block">
                  {language === 'kn' ? 'ಬಾರಕೂರು — ಆಡಳಿತ ವ್ಯವಸ್ಥೆ' : 'Barkur, Udupi — Temple Administration'}
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              {/* Database Status Button */}
              <button
                onClick={() => setShowDbModal(true)}
                className={`btn-secondary !px-2.5 !py-1.5 !text-[11px] flex items-center gap-1.5 ${
                  isSupabaseConfigured
                    ? '!border-emerald-500/40 !bg-emerald-50/50 dark:!bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Database Settings & Cloud Sync"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden md:inline font-semibold">
                  {isSupabaseConfigured ? 'Supabase Live' : 'Local Storage'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </button>

              {/* Language */}
              <button
                onClick={() => setLanguage(language === 'kn' ? 'en' : 'kn')}
                className="btn-secondary !px-2.5 !py-1.5 !text-[11px]"
                title="Toggle language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'kn' ? 'English' : 'ಕನ್ನಡ'}</span>
              </button>

              {/* Accent Color */}
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(v => !v)}
                  className="btn-secondary !px-2.5 !py-1.5"
                  title="Accent color"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: currentColor.hex }}
                  />
                </button>

                {showColorPicker && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50">
                    <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Accent Color
                    </p>
                    {colors.map(col => (
                      <button
                        key={col.key}
                        onClick={() => {
                          setThemeColor(col.key);
                          setShowColorPicker(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: col.hex }} />
                        <span>{col.label}</span>
                        {themeColor === col.key && <Check className="w-3 h-3 ml-auto text-slate-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark Mode */}
              <button
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                className="btn-secondary !px-2 !py-1.5"
                title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {themeMode === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation Row */}
          <div className="flex items-end gap-0 -mb-px overflow-x-auto scrollbar-none">
            {tabs.map(tab => {
              const isActive = activeMainTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveMainTab(tab.key)}
                  className={[
                    'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 whitespace-nowrap transition-all duration-150 focus:outline-none',
                    isActive
                      ? 'border-[--primary] text-[--primary] font-semibold dark:text-[--primary]'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-200 dark:hover:border-slate-700',
                  ].join(' ')}
                  style={isActive ? { borderBottomColor: currentColor.hex, color: currentColor.hex } : {}}
                >
                  {tab.icon}
                  <span>{language === 'kn' ? tab.label_kn : tab.label_en}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 sm:px-6 py-5">
        {activeMainTab === 'SEVA_REGISTER' && <PermanentSevaView />}
        {activeMainTab === 'MOKTESARARU' && <GramaMoktesararuView />}
        {activeMainTab === 'ANNUAL_KANIKE' && <AnnualKanikeView />}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d131c] py-3 px-6 no-print">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Sri Kalikamba Temple, Barkur — Administrative Management System</span>
          <span>Udupi District, Karnataka</span>
        </div>
      </footer>

      {/* DATABASE SETTINGS & CLEAN DATA MODAL */}
      {showDbModal && (
        <div className="modal-overlay no-print">
          <div className="modal-panel max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'kn' ? 'ಡೇಟಾಬೇಸ್ & ಸಿಂಕ್ ನಿಯಂತ್ರಣ' : 'Database & Sync Control'}
                </h3>
              </div>
              <button onClick={() => setShowDbModal(false)} className="btn-ghost !px-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Connection Status Box */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isSupabaseConfigured
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                }`}
              >
                {isSupabaseConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Running on Local Storage'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {isSupabaseConfigured
                      ? 'All additions, updates, and removals save directly to your secure Supabase PostgreSQL database.'
                      : 'Records are currently stored in your browser local storage. Connect Supabase to enable cloud persistence and real-time syncing.'}
                  </p>
                </div>
              </div>

              {/* Clean Mock Data Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{language === 'kn' ? 'ಡಮ್ಮಿ ಡೇಟಾ ಅಳಿಸಿ' : 'Purge All Dummy Data'}</span>
                  </span>
                  <button
                    onClick={handleClearMockData}
                    className="btn-secondary !text-rose-600 hover:!bg-rose-50 dark:hover:!bg-rose-950/40 !py-1 !px-2.5 text-xs font-semibold"
                  >
                    {language === 'kn' ? 'ಖಾಲಿ ಪ್ರಾರಂಭಿಸಿ' : 'Wipe to 0 Records'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {language === 'kn'
                    ? 'ಡೆಮೋ ದಾಖಲೆಗಳನ್ನು ತೆಗೆದುಹಾಕಿ ಶುದ್ಧ ನೈಜ ನೋಂದಣಿಗಳಿಗೆ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.'
                    : 'Wipes all sample test rows across all 3 modules so you start with a 100% clean, empty temple registry.'}
                </p>
              </div>

              {/* Setup Guide Link */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'kn' ? 'Supabase ಸೆಟಪ್ ಹಂತಗಳು' : 'Supabase Quick Setup (3 Steps):'}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <li>
                    Create project at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 underline font-semibold inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    Open SQL Editor in Supabase, paste and run script from{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">
                      supabase/schema.sql
                    </code>
                  </li>
                  <li>
                    Add project URL & anon key to your{' '}
                    <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px]">.env</code> file.
                  </li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setShowDbModal(false)} className="btn-primary">
                  {language === 'kn' ? 'ಮುಕ್ತಾಯ' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
