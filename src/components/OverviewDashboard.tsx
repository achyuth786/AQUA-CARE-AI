import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond, WaterQualityRecord, FeedRecord, SamplingRecord, Alert, MarketPriceRecord } from '../types/aquaculture.ts';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Droplets,
  UtensilsCrossed,
  ScanEye,
  BotMessageSquare,
  Calculator,
  ChevronRight,
  Activity,
  Fish,
  Layers,
  Sparkles,
  Plus,
  Edit3,
  Scale,
  Waves
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface OverviewDashboardProps {
  ponds: Pond[];
  selectedPondId: string;
  waterRecords: WaterQualityRecord[];
  feedRecords: FeedRecord[];
  samplingRecords: SamplingRecord[];
  alerts: Alert[];
  marketPrices: MarketPriceRecord[];
  onAcknowledgeAlert: (id: string) => void;
  onNavigate: (view: string) => void;
  onOpenQuickLog: () => void;
  onOpenAddPond: () => void;
  onEditPond: (pond: Pond) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  ponds,
  selectedPondId,
  waterRecords,
  feedRecords,
  samplingRecords,
  alerts,
  marketPrices,
  onAcknowledgeAlert,
  onNavigate,
  onOpenQuickLog,
  onOpenAddPond,
  onEditPond,
}) => {
  const { language, t } = useTranslation();

  const filteredPonds =
    selectedPondId === 'all' ? ponds : ponds.filter((p) => p.id === selectedPondId);

  const activePond =
    selectedPondId === 'all' ? ponds[0] || null : ponds.find((p) => p.id === selectedPondId) || ponds[0];

  // Aggregated Farm Metrics
  const totalBiomass = filteredPonds.reduce((acc, p) => acc + p.estimated_biomass_kg, 0);
  const avgHealthScore = Math.round(
    filteredPonds.reduce((acc, p) => acc + p.health_score, 0) / Math.max(1, filteredPonds.length)
  );
  const totalDailyFeed = feedRecords
    .filter((f) => selectedPondId === 'all' || f.pond_id === selectedPondId)
    .reduce((acc, f) => acc + f.feed_quantity_kg, 0);

  const activeAlerts = alerts.filter(
    (a) => !a.acknowledged && (selectedPondId === 'all' || a.pond_id === selectedPondId)
  );

  // Prepare Water Quality Chart Data
  const chartWaterData = waterRecords
    .slice(0, 7)
    .reverse()
    .map((w) => ({
      time: `${new Date(w.timestamp).toLocaleDateString(language === 'te' ? 'te-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      })} ${w.time_of_day}`,
      do: w.do_ppm,
      ph: w.ph,
      temp: w.temperature_c,
      safeMinDo: 4.5,
    }));

  // Prepare Growth Progression Chart Data
  const chartGrowthData = samplingRecords
    .filter((s) => selectedPondId === 'all' || s.pond_id === selectedPondId)
    .sort((a, b) => a.doc - b.doc)
    .map((s) => ({
      doc: `Day ${s.doc}`,
      abw: s.abw_g,
      benchmark: Number((0.01 + s.doc * 0.31).toFixed(2)),
    }));

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Visual Emerald Hero Banner with Real Vannamei Aquaculture Pond Photography */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 dark:border-emerald-800/60 shadow-lg group">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/vannamei_farm_hero_1793641197430.jpg"
            alt="Vannamei Shrimp Farm in Andhra Pradesh"
            className="w-full h-full object-cover object-center brightness-90 group-hover:scale-105 transition-transform duration-700"
          />
          {/* Subtle green and white contrast scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/75 to-teal-950/60 dark:from-slate-950/95 dark:via-emerald-950/80 dark:to-slate-950/70" />
        </div>

        <div className="relative z-10 p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
              <Waves className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {language === 'te'
                  ? 'ఆంధ్రప్రదేశ్ వనామి రొయ్యల స్మార్ట్ మేనేజ్‌మెంట్'
                  : 'Andhra Pradesh Vannamei Precision Management'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {language === 'te'
                ? 'వనామి రొయ్యల సాగు నిర్వహణ వేదిక'
                : 'Vannamei Shrimp Farm Operations & Intelligence'}
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed drop-shadow-xs">
              {language === 'te'
                ? 'మీ ప్రస్తుత కౌంట్, దాణా మోతాదులు, నీటి ఆక్సిజన్ మరియు వ్యాధుల స్కానింగ్‌ను ఒక్కచోటే నిర్వహించండి.'
                : 'Monitor daily water parameters, adjust biomass-based rations, check tray clearance, and screen shrimp health with Gemini AI.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={onOpenAddPond}
              className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{language === 'te' ? '+ కొత్త చెరువు చేర్చండి' : '+ Add New Pond'}</span>
            </button>
            <button
              onClick={onOpenQuickLog}
              className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Droplets className="w-4 h-4" />
              <span>{t('log_data_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner (if active) */}
      {activeAlerts.length > 0 && (
        <div className="relative overflow-hidden rounded-xl border border-rose-300 dark:border-rose-900/80 bg-rose-50/90 dark:bg-rose-950/40 p-4 shadow-sm transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    {language === 'te' ? activeAlerts[0].title_te : activeAlerts[0].title}
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 uppercase font-semibold">
                    {activeAlerts[0].severity}
                  </span>
                </div>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 max-w-2xl">
                  {language === 'te' ? activeAlerts[0].recommendation_te : activeAlerts[0].recommendation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={() => onAcknowledgeAlert(activeAlerts[0].id)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 transition-colors cursor-pointer"
              >
                {language === 'te' ? 'గుర్తించబడింది (Acknowledge)' : 'Acknowledge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER REQUIREMENT: Direct Present Count & Pond Parameter Quick-Updater Card */}
      {activePond && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/30 dark:to-slate-900 border border-emerald-300 dark:border-emerald-800/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {language === 'te' ? 'ప్రస్తుత రొయ్యల కౌంట్ & బరువు' : 'Active Pond Present Count & Body Weight'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  {language === 'te' ? activePond.name_te : activePond.name}
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1 font-mono tabular-nums">
                <span className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {activePond.estimated_count}{' '}
                  <span className="text-xs font-normal text-slate-500 font-sans">Count (pcs/kg)</span>
                </span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  ABW: {activePond.current_abw_g} g
                </span>
                <span className="text-xs text-slate-500">
                  · DOC {activePond.doc} days · {activePond.seed_quantity.toLocaleString()} Seeds
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => onEditPond(activePond)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{language === 'te' ? 'కౌంట్ / వివరాలు సవరించండి' : 'Edit Count & Details'}</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Top Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* KPI 1: Estimated Biomass */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>{t('kpi_biomass')}</span>
            <Fish className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalBiomass.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+68 kg</span>
            <span>growth this week</span>
          </div>
        </div>

        {/* KPI 2: Health Index */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>{t('kpi_health_score')}</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{avgHealthScore}</span>
            <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {t('status_optimal')} · Normal Appetite
          </div>
        </div>

        {/* KPI 3: Today's Feed */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>{t('kpi_daily_feed')}</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalDailyFeed.toFixed(1)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            4 Meals · CP Prima 38%
          </div>
        </div>

        {/* KPI 4: Average Count / kg */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>{t('kpi_current_count')}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {activePond?.estimated_count || 67}{' '}
            <span className="text-sm font-normal text-slate-500">pcs/kg</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            ABW: {activePond?.current_abw_g || 14.8}g (DOC {activePond?.doc || 48})
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Water Quality DO Diurnal Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-emerald-600" />
                <span>{t('param_do')} &amp; {t('param_ph')} Cycle</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'te'
                  ? 'ఉదయం మరియు సాయంత్రం ఆక్సిజన్ హెచ్చుతగ్గులు'
                  : 'Diurnal dissolved oxygen & pH variation'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('water')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'te' ? 'పూర్తి వివరాలు' : 'View Full Logs'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartWaterData}>
                <defs>
                  <linearGradient id="colorDoEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis domain={[2, 9]} stroke="#94A3B8" fontSize={10} tickLine={false} unit="ppm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="do"
                  name="Dissolved Oxygen (ppm)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDoEmerald)"
                />
                <Line
                  type="monotone"
                  dataKey="safeMinDo"
                  name="Safe Minimum (4.5 ppm)"
                  stroke="#F43F5E"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Shrimp Growth vs Godavari Benchmark */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{t('actual_growth')} vs {t('standard_benchmark')}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'te'
                  ? 'సగటు శరీర బరువు (ABW - గ్రాములలో)'
                  : 'Average body weight (ABW in grams) over culture days'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('growth')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'te' ? 'శాంప్లింగ్' : 'Sampling'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="doc" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="g" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="abw"
                  name="Recorded ABW (g)"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669' }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Godavari Target (g)"
                  stroke="#64748B"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards (Scanner with Shrimp Photo, What-If, Advisor) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Gemini Health Scanner CTA with Fresh Shrimp Specimen Asset */}
        <div
          onClick={() => onNavigate('scanner')}
          className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 transition-all cursor-pointer shadow-xs hover:shadow-md overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <ScanEye className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Multimodal AI
            </span>
          </div>

          <div className="aspect-16/9 rounded-xl overflow-hidden mb-3 border border-emerald-100 dark:border-slate-800">
            <img
              src="/src/assets/images/vannamei_fresh_shrimp_1793641197038.jpg"
              alt="Healthy Vannamei Specimen"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
            {t('nav_scanner')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {language === 'te'
              ? 'రొయ్యల ఫోటోలను అప్‌లోడ్ చేసి మొప్పలు, పేగు, కండరాల స్థితిని విశ్లేషించండి.'
              : 'Upload shrimp photos to detect visible symptoms like black gill, white gut, and shell softening.'}
          </p>
          <div className="mt-3 flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'te' ? 'స్కానింగ్ ప్రారంభించండి' : 'Launch Screening'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: What-If Harvest Simulator CTA */}
        <div
          onClick={() => onNavigate('harvest')}
          className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-teal-800 dark:text-teal-200 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
              Economics
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
            {t('nav_harvest')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {language === 'te'
              ? '60 కౌంట్ వద్ద పట్టుబడి చేయాలా లేదా 40 కౌంట్ వరకు ఉంచాలా? ఖర్చులు & లాభాలు పోల్చండి.'
              : 'Compare harvesting at 60 count vs. growing to 40 count against feed costs and risk.'}
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-teal-700 dark:text-teal-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'te' ? 'లాభాలు లెక్కించండి' : 'Simulate Scenarios'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: AI Aquaculture Advisor CTA */}
        <div
          onClick={() => onNavigate('assistant')}
          className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-cyan-800 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">
              తెలుగు / English
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 transition-colors">
            {t('nav_assistant')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {language === 'te'
              ? 'ఈరోజు నా చెరువులో ఎంత ఫీడ్ వేయాలి? రాత్రి ఆక్సిజన్ ఎందుకు తగ్గుతోంది? AI ని అడగండి.'
              : 'Context-aware farm advisor trained on your real pond data, water levels, and feed schedule.'}
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-cyan-700 dark:text-cyan-400 gap-1 group-hover:translate-x-1 transition-transform">
            <span>{language === 'te' ? 'సందేహాలు అడగండి' : 'Chat with Advisor'}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
