import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import {
  LayoutDashboard,
  Grid2X2,
  Droplets,
  UtensilsCrossed,
  TrendingUp,
  ScanEye,
  BotMessageSquare,
  Calculator,
  IndianRupee,
  ShieldCheck,
  CircleAlert,
  Sparkles,
  CloudSun
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  unreadAlertCount,
}) => {
  const { language, t } = useTranslation();

  const navItems = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'ponds', label: t('nav_ponds'), icon: Grid2X2 },
    { id: 'water', label: t('nav_water'), icon: Droplets },
    { id: 'feed', label: t('nav_feed'), icon: UtensilsCrossed },
    { id: 'growth', label: t('nav_growth'), icon: TrendingUp },
    { id: 'scanner', label: t('nav_scanner'), icon: ScanEye, isSpecial: true },
    { id: 'weather', label: 'Weather Risk', icon: CloudSun },
    { id: 'assistant', label: t('nav_assistant'), icon: BotMessageSquare, isAi: true },
    { id: 'harvest', label: t('nav_harvest'), icon: Calculator },
    { id: 'prices', label: t('nav_prices'), icon: IndianRupee },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-emerald-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/60 p-4 shrink-0 justify-between select-none">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="text-[11px] font-bold text-emerald-800/60 dark:text-emerald-400/60 uppercase tracking-wider px-3 mb-2">
            Operations &amp; Health
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 shadow-xs border border-emerald-200 dark:border-emerald-800/80'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 hover:text-emerald-800 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.isSpecial && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.2 rounded-full">
                      Vision
                    </span>
                  )}

                  {item.isAi && (
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-1.5 py-0.2 rounded-full">
                      AI 24/7
                    </span>
                  )}

                  {item.id === 'water' && unreadAlertCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                      <CircleAlert className="w-2.5 h-2.5" />
                      {unreadAlertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Farm Trust Banner */}
      <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Vannamei Protocol</span>
        </div>
        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
          Grounded in CIBA &amp; MPEDA coastal Andhra aquaculture standards.
        </p>
      </div>
    </aside>
  );
};
