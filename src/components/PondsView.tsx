import React from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import {
  Grid2X2,
  Calendar,
  Layers,
  Wind,
  CheckCircle2,
  Fish,
  Activity,
  PlusCircle,
  TrendingUp,
  MapPin,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';

interface PondsViewProps {
  ponds: Pond[];
  selectedPondId: string;
  setSelectedPondId: (id: string) => void;
  onNavigate: (view: string) => void;
  onOpenAddPond: () => void;
  onEditPond: (pond: Pond) => void;
  onDeletePond: (id: string) => void;
}

export const PondsView: React.FC<PondsViewProps> = ({
  ponds,
  selectedPondId,
  setSelectedPondId,
  onNavigate,
  onOpenAddPond,
  onEditPond,
  onDeletePond,
}) => {
  const { language, t } = useTranslation();

  return (
    <div className="space-y-6 pb-16 md:pb-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Grid2X2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
              {t('nav_ponds')} (Digital Twin &amp; Ponds Hub)
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            {language === 'te'
              ? 'ప్రతి చెరువు యొక్క పూర్తి ప్రొఫైల్, సీడ్ నిల్వ, ప్రస్తుత కౌంట్ మరియు ఏరియేటర్ల నిర్వహణ'
              : 'Manage your pond specifications, current shrimp counts, stocking density, and aerators.'}
          </p>
        </div>

        <button
          onClick={onOpenAddPond}
          className="flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'te' ? '+ కొత్త చెరువు చేర్చండి' : '+ Add New Pond'}</span>
        </button>
      </div>

      {/* Ponds Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ponds.map((pond) => {
          const isSelected = selectedPondId === pond.id;
          return (
            <div
              key={pond.id}
              className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'te' ? pond.name_te : pond.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    ID: {pond.id} · {pond.species}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-sans ${
                      pond.status === 'active'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}
                  >
                    {pond.status}
                  </span>
                  <button
                    onClick={() => onEditPond(pond)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Pond Parameters"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Core Telemetry Strip */}
              <div className="grid grid-cols-2 gap-2 my-4 p-3 rounded-xl bg-emerald-50/50 dark:bg-slate-800/60 font-mono tabular-nums text-xs border border-emerald-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Culture Age</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">DOC {pond.doc} days</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Present Count</span>
                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{pond.estimated_count} pcs/kg</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">Est. Biomass</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{pond.estimated_biomass_kg.toLocaleString()} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-sans block">ABW Weight</span>
                  <span className="font-bold text-sm text-teal-600">{pond.current_abw_g} g</span>
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pond Area &amp; Depth:</span>
                  <span className="font-mono">{pond.area_ha} Ha · {pond.depth_m}m depth</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stocked Seeds:</span>
                  <span className="font-mono">{pond.seed_quantity.toLocaleString()} PL ({pond.stocking_density_per_sqm} pcs/m²)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Aeration Gear:</span>
                  <span className="font-mono flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-emerald-600" />
                    {pond.aerator_count} Paddlewheels ({pond.aerator_hp} HP total)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Water Source:</span>
                  <span className="truncate max-w-[150px]">{pond.water_source}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPondId(pond.id);
                    onNavigate('dashboard');
                  }}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors text-center cursor-pointer"
                >
                  {language === 'te' ? 'ఈ చెరువును ఎంచుకోండి' : 'Select Pond'}
                </button>
                <button
                  onClick={() => onEditPond(pond)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {language === 'te' ? 'సవరించండి' : 'Edit'}
                </button>
                {ponds.length > 1 && (
                  <button
                    onClick={() => onDeletePond(pond.id)}
                    className="p-2 text-xs rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                    title="Delete Pond"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
