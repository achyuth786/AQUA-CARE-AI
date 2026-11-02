import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import { X, Grid2X2, Check, Scale, Wind, Waves, Sparkles } from 'lucide-react';

interface AddPondModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePond: (pondData: any, isEdit: boolean, pondId?: string) => Promise<void>;
  editingPond?: Pond | null;
}

export const AddPondModal: React.FC<AddPondModalProps> = ({
  isOpen,
  onClose,
  onSavePond,
  editingPond,
}) => {
  const { language, t } = useTranslation();

  const [name, setName] = useState('');
  const [nameTe, setNameTe] = useState('');
  const [areaHa, setAreaHa] = useState('1.0');
  const [depthM, setDepthM] = useState('1.5');
  const [seeds, setSeeds] = useState('100000');
  const [doc, setDoc] = useState('45');
  const [stockingDate, setStockingDate] = useState('2026-09-15');
  const [abw, setAbw] = useState('16.5');
  const [count, setCount] = useState('60');
  const [aeratorCount, setAeratorCount] = useState('4');
  const [aeratorHp, setAeratorHp] = useState('8');
  const [waterSource, setWaterSource] = useState('Brackish Creek Canal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPond) {
      setName(editingPond.name);
      setNameTe(editingPond.name_te);
      setAreaHa(editingPond.area_ha.toString());
      setDepthM(editingPond.depth_m.toString());
      setSeeds(editingPond.seed_quantity.toString());
      setDoc(editingPond.doc.toString());
      setStockingDate(editingPond.stocking_date);
      setAbw(editingPond.current_abw_g.toString());
      setCount(editingPond.estimated_count.toString());
      setAeratorCount(editingPond.aerator_count.toString());
      setAeratorHp(editingPond.aerator_hp.toString());
      setWaterSource(editingPond.water_source);
    } else {
      setName('');
      setNameTe('');
      setAreaHa('1.0');
      setDepthM('1.5');
      setSeeds('100000');
      setDoc('45');
      setStockingDate(new Date().toISOString().split('T')[0]);
      setAbw('16.5');
      setCount('60');
      setAeratorCount('4');
      setAeratorHp('8');
      setWaterSource('Brackish Creek Canal');
    }
  }, [editingPond, isOpen]);

  // When count changes, auto update ABW
  const handleCountChange = (val: string) => {
    setCount(val);
    const num = parseFloat(val);
    if (num > 0) {
      setAbw((1000 / num).toFixed(2));
    }
  };

  // When ABW changes, auto update count
  const handleAbwChange = (val: string) => {
    setAbw(val);
    const num = parseFloat(val);
    if (num > 0) {
      setCount(Math.round(1000 / num).toString());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSavePond(
        {
          name: name || `Pond (New)`,
          name_te: nameTe || `కొత్త చెరువు`,
          area_ha: parseFloat(areaHa),
          depth_m: parseFloat(depthM),
          seed_quantity: parseInt(seeds, 10),
          doc: parseInt(doc, 10),
          stocking_date: stockingDate,
          current_abw_g: parseFloat(abw),
          estimated_count: parseInt(count, 10),
          aerator_count: parseInt(aeratorCount, 10),
          aerator_hp: parseInt(aeratorHp, 10),
          water_source: waterSource,
        },
        !!editingPond,
        editingPond?.id
      );
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/10">
              <Grid2X2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {editingPond
                  ? language === 'te' ? 'చెరువు వివరాలను సవరించండి' : 'Edit Pond Details & Count'
                  : language === 'te' ? 'కొత్త చెరువును చేర్చండి' : 'Add New Vannamei Pond'}
              </h3>
              <p className="text-xs text-white/80">
                {language === 'te'
                  ? 'మీ చెరువు పేరు, ప్రస్తుత కౌంట్, మరియు సీడ్ వివరాలను నమోదు చేయండి'
                  : 'Enter your pond name, current count, seed stocking and parameters'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Pond Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pond Name (English)
              </label>
              <input
                type="text"
                placeholder="e.g. Pond 3 (South Side)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                చెరువు పేరు (తెలుగు)
              </label>
              <input
                type="text"
                placeholder="ఉదా: చెరువు 3 (దక్షిణం)"
                value={nameTe}
                onChange={(e) => setNameTe(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* CRITICAL: Present Count & ABW Quick Entry */}
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Scale className="w-4 h-4" />
              <span>Current Growth: Present Count &amp; Average Body Weight</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Present Count (Pieces / kg)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50 or 60"
                  value={count}
                  onChange={(e) => handleCountChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current ABW (Grams / piece)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 16.5"
                  value={abw}
                  onChange={(e) => handleAbwChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm font-bold font-mono tabular-nums bg-white dark:bg-slate-800 border border-emerald-400 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-300"
                />
              </div>
            </div>

            <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Entering either count or ABW automatically updates the other value.
            </div>
          </div>

          {/* Stocking & Area Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pond Area (Hectares)
              </label>
              <input
                type="number"
                step="0.1"
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Water Depth (Meters)
              </label>
              <input
                type="number"
                step="0.1"
                value={depthM}
                onChange={(e) => setDepthM(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Culture Days (DOC)
              </label>
              <input
                type="number"
                value={doc}
                onChange={(e) => setDoc(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Seed Stocking Quantity & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Seeds Stocked (PL count)
              </label>
              <input
                type="number"
                value={seeds}
                onChange={(e) => setSeeds(e.target.value)}
                placeholder="e.g. 100000"
                required
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stocking Date
              </label>
              <input
                type="date"
                value={stockingDate}
                onChange={(e) => setStockingDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Aeration & Water Source */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aerator Count
              </label>
              <input
                type="number"
                value={aeratorCount}
                onChange={(e) => setAeratorCount(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Aeration HP
              </label>
              <input
                type="number"
                value={aeratorHp}
                onChange={(e) => setAeratorHp(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Water Source
              </label>
              <select
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Brackish Creek Canal">Brackish Creek Canal</option>
                <option value="Borewell Water">Borewell Water</option>
                <option value="River Estuary Canal">River Estuary Canal</option>
                <option value="Sea Water Intake">Sea Water Intake</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingPond ? 'Update Pond & Count' : 'Add Pond'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
