import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond, MarketPriceRecord } from '../types/aquaculture.ts';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Coins,
  CheckCircle2,
  Calendar,
  Layers,
  Scale
} from 'lucide-react';

interface HarvestSimulatorViewProps {
  ponds: Pond[];
  selectedPondId: string;
  marketPrices: MarketPriceRecord[];
}

export const HarvestSimulatorView: React.FC<HarvestSimulatorViewProps> = ({
  ponds,
  selectedPondId,
  marketPrices,
}) => {
  const { language, t } = useTranslation();
  const [pondId, setPondId] = useState(
    selectedPondId === 'all' ? ponds[0]?.id || 'pond-01' : selectedPondId
  );
  const activePond = ponds.find((p) => p.id === pondId) || ponds[0];

  const [targetCount, setTargetCount] = useState<number>(50);
  const [customPrice, setCustomPrice] = useState<string>('315');
  const [simulation, setSimulation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-update price when target count changes
  useEffect(() => {
    const matched = marketPrices.find((m) => m.count_per_kg === targetCount);
    if (matched) {
      setCustomPrice(matched.price_inr.toString());
    } else {
      if (targetCount <= 30) setCustomPrice('440');
      else if (targetCount <= 40) setCustomPrice('375');
      else if (targetCount <= 50) setCustomPrice('315');
      else if (targetCount <= 60) setCustomPrice('280');
      else setCustomPrice('225');
    }
  }, [targetCount, marketPrices]);

  // Run simulation calculation
  const fetchSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/what-if-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pond_id: pondId,
          target_count: targetCount,
          expected_price_inr: parseFloat(customPrice) || 315,
        }),
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [pondId, targetCount, customPrice]);

  const targetCountOptions = [80, 60, 50, 40, 30];

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {t('simulator_title')}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {t('simulator_subtitle')}
            </p>
          </div>

          {/* Pond Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pond:</span>
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
          </div>
        </div>
      </div>

      {/* Current vs Target Control Strip */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Current Status Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {t('current_doc_count')}
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activePond.estimated_count} Count
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              ABW: {activePond.current_abw_g}g · DOC {activePond.doc} days · Biomass {activePond.estimated_biomass_kg} kg
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex flex-col items-center justify-center text-slate-400">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">What-If Target</span>
            <ArrowRight className="w-6 h-6 text-cyan-500" />
          </div>

          {/* Target Count & Price Controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {t('target_count_label')} ({t('target_count_pieces')})
              </label>
              <div className="flex gap-1.5">
                {targetCountOptions.map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setTargetCount(cnt)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      targetCount === cnt
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t('expected_market_price')} (₹/kg)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Grid */}
      {simulation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono tabular-nums">
          {/* Card 1: Additional Days */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs text-slate-500 font-sans">{t('calc_additional_days')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              +{simulation.additional_days} <span className="text-xs font-normal font-sans text-slate-400">days</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-2">
              Harvest at DOC {simulation.projected_harvest_doc}
            </div>
          </div>

          {/* Card 2: Final Projected Biomass */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs text-slate-500 font-sans">{t('calc_final_biomass')}</div>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
              {simulation.projected_biomass_kg.toLocaleString()}{' '}
              <span className="text-xs font-normal font-sans text-slate-400">kg</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-sans mt-2">
              +{Math.max(0, simulation.projected_biomass_kg - activePond.estimated_biomass_kg)} kg gain
            </div>
          </div>

          {/* Card 3: Projected Gross Revenue */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs text-slate-500 font-sans">{t('calc_gross_revenue')}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{(simulation.projected_gross_revenue_inr / 100000).toFixed(2)}{' '}
              <span className="text-xs font-normal font-sans text-slate-400">Lakh</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-2">
              @ ₹{simulation.expected_price_inr} / kg
            </div>
          </div>

          {/* Card 4: Projected Net Profit */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs text-slate-500 font-sans">{t('calc_net_profit')}</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{(simulation.projected_net_profit_inr / 100000).toFixed(2)}{' '}
              <span className="text-xs font-normal font-sans text-slate-400">Lakh</span>
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-2">
              Cost: ₹{simulation.estimated_cost_per_kg_inr} / kg
            </div>
          </div>
        </div>
      )}

      {/* Scenario Comparison Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t('scenario_comparison')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare keeping shrimp for higher counts versus immediate harvest risk.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-2.5 px-3">Target Count</th>
                <th className="py-2.5 px-3">Target ABW</th>
                <th className="py-2.5 px-3">Harvest DOC</th>
                <th className="py-2.5 px-3">Total Biomass</th>
                <th className="py-2.5 px-3">Price / kg</th>
                <th className="py-2.5 px-3">Gross Revenue</th>
                <th className="py-2.5 px-3">Break-Even Price</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[
                { count: 80, abw: 12.5, doc: 42, biomass: 860, price: 225, rev: 193500, be: 185, risk: 'Low Risk (Early Cash)' },
                { count: 60, abw: 16.7, doc: 52, biomass: 1140, price: 280, rev: 319200, be: 198, risk: 'Optimal Balance' },
                { count: 50, abw: 20.0, doc: 61, biomass: 1350, price: 315, rev: 425250, be: 205, risk: 'Moderate Risk' },
                { count: 40, abw: 25.0, doc: 74, biomass: 1650, price: 375, rev: 618750, be: 215, risk: 'High Premium / WSSV Risk' },
                { count: 30, abw: 33.3, doc: 92, biomass: 2100, price: 440, rev: 924000, be: 230, risk: 'Critical Disease Risk' },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    row.count === targetCount ? 'bg-cyan-50/50 dark:bg-cyan-950/30 font-bold' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{row.count} Count</td>
                  <td className="py-3 px-3">{row.abw} g</td>
                  <td className="py-3 px-3">Day {row.doc}</td>
                  <td className="py-3 px-3">{row.biomass.toLocaleString()} kg</td>
                  <td className="py-3 px-3 text-cyan-600 dark:text-cyan-400">₹{row.price}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-600">₹{row.rev.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-500">₹{row.be} / kg</td>
                  <td className="py-3 px-3 font-sans text-[11px] text-slate-600 dark:text-slate-300">{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
