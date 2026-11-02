import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import { UserProfile } from './AuthModal.tsx';
import {
  Waves,
  Sun,
  Moon,
  Globe,
  PlusCircle,
  Bell,
  MapPin,
  ChevronDown,
  User,
  Plus
} from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  selectedPondId: string;
  setSelectedPondId: (id: string) => void;
  ponds: Pond[];
  onOpenQuickLog: () => void;
  onOpenAddPond: () => void;
  onOpenAuth: () => void;
  currentUser: UserProfile;
  unreadAlertCount: number;
  onNavigateToAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  selectedPondId,
  setSelectedPondId,
  ponds,
  onOpenQuickLog,
  onOpenAddPond,
  onOpenAuth,
  currentUser,
  unreadAlertCount,
  onNavigateToAlerts,
}) => {
  const { language, toggleLanguage, t } = useTranslation();

  const selectedPond = ponds.find((p) => p.id === selectedPondId);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 md:gap-6 px-4 md:px-6 py-2.5 border-b border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm shadow-emerald-500/20">
          <Waves className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {t('brand_name')}
            </span>
            <span className="hidden sm:inline-flex text-[11px] font-semibold tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
              Vannamei OS
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-600" />
            {currentUser.district || t('location_badge')}
          </span>
        </div>
      </div>

      {/* Zone 2: Pond Quick Switcher & Add Pond Button */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={selectedPondId}
            onChange={(e) => setSelectedPondId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs md:text-sm font-semibold bg-emerald-50/70 dark:bg-slate-800 hover:bg-emerald-100/60 dark:hover:bg-slate-700 border border-emerald-200 dark:border-slate-700 rounded-lg text-emerald-900 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            <option value="all">
              {language === 'te' ? 'అన్ని చెరువులు (All Ponds)' : 'All Ponds (Whole Farm)'}
            </option>
            {ponds.map((pond) => (
              <option key={pond.id} value={pond.id}>
                {language === 'te' ? pond.name_te : pond.name} ({pond.estimated_count} Count · DOC {pond.doc})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-slate-400 pointer-events-none" />
        </div>

        {/* Add Pond Button */}
        <button
          onClick={onOpenAddPond}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200/80 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
          title="Add New Pond / కొత్త చెరువును చేర్చండి"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'te' ? '+ చెరువు' : '+ Add Pond'}</span>
        </button>

        {selectedPond && selectedPondId !== 'all' && (
          <span className="hidden xl:inline-flex items-center text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            ABW: {selectedPond.current_abw_g}g · {selectedPond.estimated_count} count · DOC {selectedPond.doc}
          </span>
        )}
      </div>

      {/* Zone 3: Actions (User Profile, Language, Theme, Quick Log) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* User Login / Profile Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5 text-emerald-600" />
          <span className="max-w-[100px] truncate">
            {currentUser.isLoggedIn ? currentUser.name.split(' ')[0] : language === 'te' ? 'లాగిన్' : 'Sign In'}
          </span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          aria-label="Toggle language"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          title="Switch Language / భాష మార్చండి"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Alert Bell */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          aria-label="View alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* Primary Action: Quick Log Button */}
        <button
          onClick={onOpenQuickLog}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('log_data_btn')}</span>
        </button>
      </div>
    </header>
  );
};
