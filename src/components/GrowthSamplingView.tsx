import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond, SamplingRecord } from '../types/aquaculture.ts';
import {
  TrendingUp,
  PlusCircle,
  Scale,
  Calendar,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface GrowthSamplingViewProps {
  ponds: Pond[];
  selectedPondId: string;
  samplingRecords: SamplingRecord[];
  onOpenQuickLog: () => void;
}

export const GrowthSamplingView: React.FC<GrowthSamplingViewProps> = ({
  ponds,
  selectedPondId,
  samplingRecords,
  onOpenQuickLog,
}) => {
  const { language, t } = useTranslation();
  const [pondId, setPondId] = useState(
    selectedPondId === 'all' ? ponds[0]?.id || 'pond-01' : selectedPondId
  );
  const activePond = ponds.find((p) => p.id === pondId) || ponds[0];

  const filteredSamples = samplingRecords
    .filter((s) => s.pond_id === pondId)
    .sort((a, b) => b.doc - a.doc);

  const chartData = [...filteredSamples]
    .sort((a, b) => a.doc - b.doc)
    .map((s) => ({
      doc: `DOC ${s.doc}`,
      abw: s.abw_g,
      target: Number((0.01 + s.doc * 0.31).toFixed(2)),
    }));

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {t('growth_title')}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {t('growth_subtitle')}
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
            <span>+ Log Cast Net Sample</span>
          </button>
        </div>
      </div>

      {/* Growth Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono tabular-nums">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('current_abw')}
          </span>
          <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {activePond.current_abw_g} <span className="text-sm font-normal text-slate-400">g</span>
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            Stocking initial: 0.01g
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('count_per_kg')}
          </span>
          <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {activePond.estimated_count} <span className="text-sm font-normal text-slate-400">pcs/kg</span>
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            1000g / {activePond.current_abw_g}g
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('growth_rate')}
          </span>
          <div className="text-2xl md:text-3xl font-bold text-cyan-600 dark:text-cyan-400">
            0.53 <span className="text-sm font-normal text-slate-400">g / day</span>
          </div>
          <div className="text-[11px] font-sans text-emerald-600 mt-2">
            +3.2g gain this week
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-sans text-slate-500 block mb-1">
            {t('survival_rate')}
          </span>
          <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {activePond.estimated_survival_pct}%
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-2">
            Population: ~{Math.round(activePond.seed_quantity * (activePond.estimated_survival_pct / 100)).toLocaleString()} pcs
          </div>
        </div>
      </div>

      {/* Growth Curve Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'te' ? 'రొయ్యల ఎదుగుదల గ్రాఫ్ (గ్రాములలో)' : 'Vannamei Growth Progression (ABW in grams)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recorded growth against coastal Andhra Vannamei standard trajectory.
          </p>
        </div>

        <div className="h-64 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="doc" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="g" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                }}
              />
              <Line
                type="monotone"
                dataKey="abw"
                name="Actual ABW (g)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Benchmark (g)"
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sampling History Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Cast-Net Sampling Logbook / వారపు శాంప్లింగ్ రికార్డులు
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Culture Age</th>
                <th className="py-2.5 px-3">Shrimp in Sample</th>
                <th className="py-2.5 px-3">Net Weight (g)</th>
                <th className="py-2.5 px-3">ABW (g)</th>
                <th className="py-2.5 px-3">Count / kg</th>
                <th className="py-2.5 px-3">Weekly Gain</th>
                <th className="py-2.5 px-3">Gut Condition</th>
                <th className="py-2.5 px-3">Shell Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">{sample.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">DOC {sample.doc}</td>
                  <td className="py-3 px-3">{sample.sample_size_count} pcs</td>
                  <td className="py-3 px-3">{sample.total_sample_weight_g} g</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {sample.abw_g} g
                  </td>
                  <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                    {sample.count_per_kg} pcs
                  </td>
                  <td className="py-3 px-3 text-emerald-600">+{sample.weekly_gain_g} g</td>
                  <td className="py-3 px-3 font-sans capitalize">{sample.gut_condition}</td>
                  <td className="py-3 px-3 font-sans capitalize">{sample.shell_condition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
