import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond, FeedRecord } from '../types/aquaculture.ts';
import {
  UtensilsCrossed,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Scale,
  Clock,
  TrendingDown
} from 'lucide-react';

interface FeedManagementViewProps {
  ponds: Pond[];
  selectedPondId: string;
  feedRecords: FeedRecord[];
  onOpenQuickLog: () => void;
}

export const FeedManagementView: React.FC<FeedManagementViewProps> = ({
  ponds,
  selectedPondId,
  feedRecords,
  onOpenQuickLog,
}) => {
  const { language, t } = useTranslation();
  const [pondId, setPondId] = useState(
    selectedPondId === 'all' ? ponds[0]?.id || 'pond-01' : selectedPondId
  );
  const activePond = ponds.find((p) => p.id === pondId) || ponds[0];

  // Feed % of Biomass Sliding Scale (based on ABW)
  // <5g: 5.0%, 5-10g: 4.2%, 10-15g: 3.4%, 15-20g: 2.8%, >20g: 2.4%
  const getOptimalFeedPct = (abw: number) => {
    if (abw < 5) return 5.0;
    if (abw < 10) return 4.2;
    if (abw < 15) return 3.4;
    if (abw < 20) return 2.8;
    return 2.4;
  };

  const feedPct = getOptimalFeedPct(activePond.current_abw_g);
  const calculatedDailyTotalKg = Number(
    ((activePond.estimated_biomass_kg * feedPct) / 100).toFixed(1)
  );

  const filteredFeed = feedRecords.filter((f) => f.pond_id === pondId);

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {t('feed_title')}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {t('feed_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pondId}
            onChange={(e) => setPondId(e.target.value)}
            className="text-xs md:text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
          >
            {ponds.map((p) => (
              <option key={p.id} value={p.id}>
                {language === 'te' ? p.name_te : p.name} (DOC {p.doc})
              </option>
            ))}
          </select>

          <button
            onClick={onOpenQuickLog}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Meal</span>
          </button>
        </div>
      </div>

      {/* Feeding Calculation & Biomass KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('recommended_feed')}
          </span>
          <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
            {calculatedDailyTotalKg} <span className="text-xs font-normal text-slate-400">kg / day</span>
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            Divided into 4 meals ({(calculatedDailyTotalKg / 4).toFixed(1)} kg each)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('feed_per_biomass')}
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {feedPct}% <span className="text-xs font-normal text-slate-400">of biomass</span>
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            ABW: {activePond.current_abw_g}g ({activePond.estimated_count} count)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('kpi_fcr')}
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activePond.fcr}
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            Target benchmark: 1.25 - 1.40
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            Cumulative Feed
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activePond.cumulative_feed_kg.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            Biomass: {activePond.estimated_biomass_kg.toLocaleString()} kg
          </div>
        </div>
      </div>

      {/* Check Tray Observation Rules */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Info className="w-4 h-4 text-cyan-500" />
          <span>Andhra Vannamei Check-Tray Decision Matrix / చెక్ ట్రేల నిర్ణయ పట్టిక</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              Tray Clean (0% Left)
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              {language === 'te'
                ? 'రొయ్యలు చురుగ్గా తింటున్నాయి. తదుపరి పూట దాణాను 5-10% పెంచవచ్చు.'
                : 'Excellent appetite. Consider +5% increase in next meal if water DO is healthy.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              10 - 20% Left
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              {language === 'te'
                ? 'సరైన మోతాదు. ప్రస్తుత దాణాను యథాతథంగా కొనసాగించండి.'
                : 'Ideal feeding rate. Maintain same quantity for next meal.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60">
            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
              50% Left (Overfed)
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              {language === 'te'
                ? 'అధిక దాణా. వెంటనే తదుపరి పూట 20% తగ్గించండి. అడుగున వ్యర్థాలు చేరకూడదు.'
                : 'Overfeeding detected. Reduce next meal by 20% to prevent anaerobic pond sludge.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800/60">
            <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
              Untouched (100% Left)
            </span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px]">
              {language === 'te'
                ? 'తీవ్ర ఒత్తిడి లేదా వ్యాధి లక్షణం. వెంటనే దాణా ఆపి DO, అమ్మోనియా పరీక్షించండి.'
                : 'Stop feeding immediately. Test DO and check for molting or gill fouling.'}
            </p>
          </div>
        </div>
      </div>

      {/* Feed Schedule Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Daily Feeding Log / నేటి దాణా సమయాలు
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Meal</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Feed Brand</th>
                <th className="py-2.5 px-3">Pellet Size</th>
                <th className="py-2.5 px-3">Quantity (kg)</th>
                <th className="py-2.5 px-3">Tray Observations</th>
                <th className="py-2.5 px-3 font-sans">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredFeed.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">{rec.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white font-sans">
                    Meal {rec.meal_number}
                  </td>
                  <td className="py-3 px-3">{rec.meal_time}</td>
                  <td className="py-3 px-3 font-sans">{rec.feed_brand}</td>
                  <td className="py-3 px-3">{rec.pellet_size_mm} mm</td>
                  <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                    {rec.feed_quantity_kg} kg
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 text-[10px] font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        T1: {rec.tray_observations.tray_1}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        T2: {rec.tray_observations.tray_2}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-sans text-[11px] text-slate-500 max-w-xs truncate">
                    {rec.feed_adjustment_notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
