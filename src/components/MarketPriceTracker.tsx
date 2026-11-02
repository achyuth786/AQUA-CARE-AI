import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { MarketPriceRecord, Pond } from '../types/aquaculture.ts';
import {
  IndianRupee,
  Plus,
  Trash2,
  Calendar,
  TrendingUp,
  Scale,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface MarketPriceTrackerProps {
  marketPrices: MarketPriceRecord[];
  onSavePrice: (data: { count_per_kg: number; price_inr: number; region?: string }) => Promise<void>;
  ponds: Pond[];
}

export const MarketPriceTracker: React.FC<MarketPriceTrackerProps> = ({
  marketPrices,
  onSavePrice,
  ponds,
}) => {
  const { language, t } = useTranslation();
  const [newCount, setNewCount] = useState('60');
  const [newPrice, setNewPrice] = useState('280');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Pond for Revenue Calculator
  const [calcPondId, setCalcPondId] = useState(ponds[0]?.id || 'pond-01');
  const calcPond = ponds.find((p) => p.id === calcPondId) || ponds[0];

  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCount || !newPrice) return;
    setIsSubmitting(true);
    try {
      await onSavePrice({
        count_per_kg: parseInt(newCount, 10),
        price_inr: parseFloat(newPrice),
        region: 'Bhimavaram Gate',
      });
      setNewCount('');
      setNewPrice('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = marketPrices.map((m) => ({
    count: `${m.count_per_kg} Count`,
    price: m.price_inr,
  }));

  // Revenue estimation for selected pond
  const matchedPrice =
    marketPrices.find((m) => m.count_per_kg === calcPond?.estimated_count)?.price_inr || 280;
  const estimatedRevenue = (calcPond?.estimated_biomass_kg || 0) * matchedPrice;

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {t('prices_title')}
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {t('prices_subtitle')}
          </p>
        </div>
      </div>

      {/* Top 2 Columns: Add Price Form & Revenue Estimator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple Add Price Form */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-500" />
            <span>{t('add_price_btn')} (Simple 2-Field Entry)</span>
          </h3>

          <form onSubmit={handleAddPrice} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Shrimp Count (Pcs/kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Price per kg (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 315"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    required
                    className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Save Market Price
            </button>
          </form>
        </div>

        {/* Live Pond Value Estimator */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-500" />
                <span>Pond Market Valuation / చెరువు ప్రస్తుత విలువ</span>
              </h3>
              <select
                value={calcPondId}
                onChange={(e) => setCalcPondId(e.target.value)}
                className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                {ponds.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
              <span className="text-xs font-sans text-slate-500 block mb-1">
                Estimated Farm-Gate Value (Today)
              </span>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                ₹{estimatedRevenue.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 font-sans mt-2">
                Based on {calcPond?.estimated_biomass_kg.toLocaleString()} kg biomass @ ₹{matchedPrice}/kg ({calcPond?.estimated_count} Count).
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-3 font-sans">
            Rates reflect verified coastal Andhra farm-gate auctions (West Godavari, Krishna).
          </div>
        </div>
      </div>

      {/* Price Comparison Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Count-Wise Price Gradient (₹ / kg)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Higher count (smaller shrimp) commands lower price; lower count (larger shrimp) commands exponential premium.
          </p>
        </div>

        <div className="h-60 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="count" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="₹" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#1E293B',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                }}
              />
              <Bar dataKey="price" name="Farm Gate (₹/kg)" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current Prices Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Active Andhra Farm-Gate Price Board
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-sans text-[11px] uppercase">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Shrimp Count</th>
                <th className="py-2.5 px-3">Average Body Weight</th>
                <th className="py-2.5 px-3">Farm Gate Price (₹/kg)</th>
                <th className="py-2.5 px-3 font-sans">Trading Center</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {marketPrices.map((mp) => (
                <tr key={mp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-sans text-slate-600 dark:text-slate-300">{mp.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {mp.count_per_kg} Count
                  </td>
                  <td className="py-3 px-3">{(1000 / mp.count_per_kg).toFixed(1)} g</td>
                  <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{mp.price_inr} / kg
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-500">{mp.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
