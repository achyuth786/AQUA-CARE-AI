import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import {
  LayoutDashboard,
  Droplets,
  UtensilsCrossed,
  ScanEye,
  Calculator,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenQuickLog: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView,
  setCurrentView,
  onOpenQuickLog,
}) => {
  const { t } = useTranslation();

  const items = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'water', label: t('nav_water'), icon: Droplets },
    { id: 'feed', label: t('nav_feed'), icon: UtensilsCrossed },
    { id: 'scanner', label: 'AI Scan', icon: ScanEye },
    { id: 'harvest', label: 'What-If', icon: Calculator },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-lg select-none">
      {items.slice(0, 2).map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg flex-1 ${
              isActive
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
          </button>
        );
      })}

      {/* Floating Center Quick-Log Action */}
      <button
        onClick={onOpenQuickLog}
        className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 active:scale-95 transition-transform"
        aria-label="Quick log pond entry"
      >
        <Plus className="w-6 h-6" />
      </button>

      {items.slice(2).map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg flex-1 ${
              isActive
                ? 'text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
