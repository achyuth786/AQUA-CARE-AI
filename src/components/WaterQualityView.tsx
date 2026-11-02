import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond, WaterQualityRecord } from '../types/aquaculture.ts';
import {
  Droplets,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface WaterQualityViewProps {
  ponds: Pond[];
  selectedPondId: string;
  waterRecords: WaterQualityRecord[];
  onOpenQuickLog: () => void;
}

export const WaterQualityView: React.FC<WaterQualityViewProps> = ({
  ponds,
  selectedPondId,
  waterRecords,
  onOpenQuickLog,
}) => {
  const { language, t } = useTranslation();
  const [filterSession, setFilterSession] = useState<'all' | 'AM' | 'PM'>('all');

  const filteredRecords = waterRecords.filter((rec) => {
    const matchesPond = selectedPondId === 'all' || rec.pond_id === selectedPondId;
    const matchesSession = filterSession === 'all' || rec.time_of_day === filterSession;
    return matchesPond && matchesSession;
  });

  const latest = filteredRecords[0] || waterRecords[0];

  // Parameter safety standards guide
  const paramCards = [
    {
      name: t('param_do'),
      value: `${latest?.do_ppm ?? 4.8} ppm`,
      status: latest?.do_ppm < 4.0 ? 'warning' : latest?.do_ppm < 4.5 ? 'caution' : 'optimal',
      ideal: '≥ 4.5 ppm (Morning) / 6.0 - 8.0 ppm (PM)',
      note: 'Critical for respiration & appetite. Aerate when < 4.5 ppm.',
    },
    {
      name: t('param_ph'),
      value: `${latest?.ph ?? 8.0}`,
      status: latest?.ph < 7.5 || latest?.ph > 8.5 ? 'caution' : 'optimal',
      ideal: '7.8 - 8.3 (Daily swing < 0.5)',
      note: 'Fluctuation > 0.5 induces severe molting stress.',
    },
    {
      name: t('param_salinity'),
      value: `${latest?.salinity_ppt ?? 13} ppt`,
      status: 'optimal',
      ideal: '10 - 25 ppt for Vannamei',
      note: 'Brackish water provides optimal osmoregulatory balance.',
    },
    {
      name: t('param_temp'),
      value: `${latest?.temperature_c ?? 28}°C`,
      status: 'optimal',
      ideal: '28°C - 31°C',
      note: 'Low temps (<26°C) cut shrimp metabolic feeding rate.',
    },
    {
      name: t('param_alkalinity'),
      value: `${latest?.alkalinity_ppm ?? 140} ppm`,
      status: latest?.alkalinity_ppm < 120 ? 'caution' : 'optimal',
      ideal: '120 - 180 ppm (CaCO3)',
      note: 'Maintains pH buffer & ensures exoskeleton hardening.',
    },
    {
      name: t('param_ammonia'),
      value: `${latest?.ammonia_ppm ?? 0.25} ppm`,
      status: latest?.ammonia_ppm > 0.5 ? 'warning' : latest?.ammonia_ppm > 0.3 ? 'caution' : 'optimal',
      ideal: '< 0.3 ppm TAN (Un-ionized NH3 < 0.05)',
      note: 'Toxic at higher pH. Reduce feed if ammonia climbs.',
    },
    {
      name: t('param_nitrite'),
      value: `${latest?.nitrite_ppm ?? 0.08} ppm`,
      status: latest?.nitrite_ppm > 0.2 ? 'warning' : latest?.nitrite_ppm > 0.1 ? 'caution' : 'optimal',
      ideal: '< 0.1 ppm NO2',
      note: 'Oxidizes hemocyanin causing hypoxia (brown blood).',
    },
    {
      name: t('param_transparency'),
      value: `${latest?.transparency_cm ?? 32} cm`,
      status: 'optimal',
      ideal: '30 - 40 cm (Secchi Disk)',
      note: 'Indicates healthy green/brown microalgae bloom.',
    },
  ];

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {t('water_title')}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {t('water_subtitle')}
          </p>
        </div>

        <button
          onClick={onOpenQuickLog}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Log Water Reading</span>
        </button>
      </div>

      {/* 8 Parameter Real-Time Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 font-mono tabular-nums">
        {paramCards.map((card, idx) => {
          const isWarning = card.status === 'warning';
          const isCaution = card.status === 'caution';
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isWarning
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                  : isCaution
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between font-sans text-xs mb-1">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px] font-medium">
                  {card.name}
                </span>
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : isCaution ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
              </div>

              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {card.value}
              </div>

              <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ideal: </span>
                {card.ideal}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Logs Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Physicochemical Audit Log / నీటి కొలతల రికార్డులు
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete historical record of morning and evening measurements.
            </p>
          </div>

          {/* Session Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterSession('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterSession === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              All Readings
            </button>
            <button
              onClick={() => setFilterSession('AM')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterSession === 'AM'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              AM (Dawn)
            </button>
            <button
              onClick={() => setFilterSession('PM')}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterSession === 'PM'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              PM (Dusk)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-2.5 px-3">Date &amp; Time</th>
                <th className="py-2.5 px-3">Pond</th>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">DO (ppm)</th>
                <th className="py-2.5 px-3">pH</th>
                <th className="py-2.5 px-3">Salinity (ppt)</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">TAN Ammonia</th>
                <th className="py-2.5 px-3">Nitrite (ppm)</th>
                <th className="py-2.5 px-3">Transparency</th>
                <th className="py-2.5 px-3 font-sans">Notes / Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecords.map((rec) => {
                const pond = ponds.find((p) => p.id === rec.pond_id);
                const isLowDo = rec.do_ppm < 4.0;
                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isLowDo ? 'bg-rose-50/30 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-sans">
                      {new Date(rec.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-bold font-sans text-slate-900 dark:text-white">
                      {language === 'te' ? pond?.name_te : pond?.name}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                          rec.time_of_day === 'AM'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                            : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200'
                        }`}
                      >
                        {rec.time_of_day}
                      </span>
                    </td>
                    <td className={`py-3 px-3 font-bold ${isLowDo ? 'text-rose-600' : 'text-cyan-600 dark:text-cyan-400'}`}>
                      {rec.do_ppm} ppm
                    </td>
                    <td className="py-3 px-3">{rec.ph}</td>
                    <td className="py-3 px-3">{rec.salinity_ppt} ppt</td>
                    <td className="py-3 px-3">{rec.temperature_c}°C</td>
                    <td className="py-3 px-3">{rec.ammonia_ppm} ppm</td>
                    <td className="py-3 px-3">{rec.nitrite_ppm} ppm</td>
                    <td className="py-3 px-3">{rec.transparency_cm} cm</td>
                    <td className="py-3 px-3 font-sans text-[11px] text-slate-500 max-w-xs truncate">
                      {rec.notes || rec.recorded_by || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
