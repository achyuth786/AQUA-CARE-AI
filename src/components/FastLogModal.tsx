import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import { X, Droplets, UtensilsCrossed, TrendingUp, Check } from 'lucide-react';

interface FastLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  ponds: Pond[];
  selectedPondId: string;
  onSaveWater: (data: any) => Promise<void>;
  onSaveFeed: (data: any) => Promise<void>;
  onSaveSampling: (data: any) => Promise<void>;
}

export const FastLogModal: React.FC<FastLogModalProps> = ({
  isOpen,
  onClose,
  ponds,
  selectedPondId,
  onSaveWater,
  onSaveFeed,
  onSaveSampling,
}) => {
  const { language, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'water' | 'feed' | 'sampling'>('water');
  const [pondId, setPondId] = useState(selectedPondId === 'all' ? ponds[0]?.id || 'pond-01' : selectedPondId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Water Form State
  const [timeOfDay, setTimeOfDay] = useState<'AM' | 'PM'>('AM');
  const [doPpm, setDoPpm] = useState('4.8');
  const [ph, setPh] = useState('8.0');
  const [salinity, setSalinity] = useState('13');
  const [temp, setTemp] = useState('28.5');
  const [alkalinity, setAlkalinity] = useState('140');
  const [ammonia, setAmmonia] = useState('0.2');
  const [transparency, setTransparency] = useState('32');
  const [waterNotes, setWaterNotes] = useState('');

  // Feed Form State
  const [mealNumber, setMealNumber] = useState<1 | 2 | 3 | 4>(1);
  const [feedQuantity, setFeedQuantity] = useState('10.0');
  const [feedBrand, setFeedBrand] = useState('CP Prima 38%');
  const [tray1, setTray1] = useState<'clean' | 'slight_left' | 'half_left' | 'untouched'>('clean');
  const [tray2, setTray2] = useState<'clean' | 'slight_left' | 'half_left' | 'untouched'>('clean');
  const [tray3, setTray3] = useState<'clean' | 'slight_left' | 'half_left' | 'untouched'>('clean');
  const [tray4, setTray4] = useState<'clean' | 'slight_left' | 'half_left' | 'untouched'>('clean');

  // Sampling Form State
  const [sampleCount, setSampleCount] = useState('100');
  const [sampleWeightG, setSampleWeightG] = useState('1600');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeTab === 'water') {
        await onSaveWater({
          pond_id: pondId,
          time_of_day: timeOfDay,
          do_ppm: parseFloat(doPpm),
          ph: parseFloat(ph),
          salinity_ppt: parseFloat(salinity),
          temperature_c: parseFloat(temp),
          alkalinity_ppm: parseFloat(alkalinity),
          ammonia_ppm: parseFloat(ammonia),
          transparency_cm: parseFloat(transparency),
          notes: waterNotes,
        });
      } else if (activeTab === 'feed') {
        await onSaveFeed({
          pond_id: pondId,
          meal_number: mealNumber,
          meal_time: mealNumber === 1 ? '06:00 AM' : mealNumber === 2 ? '11:00 AM' : mealNumber === 3 ? '03:00 PM' : '07:00 PM',
          feed_brand: feedBrand,
          pellet_size_mm: 1.8,
          protein_pct: 38,
          feed_quantity_kg: parseFloat(feedQuantity),
          tray_observations: {
            tray_1: tray1,
            tray_2: tray2,
            tray_3: tray3,
            tray_4: tray4,
          },
        });
      } else if (activeTab === 'sampling') {
        const selectedPondObj = ponds.find((p) => p.id === pondId);
        await onSaveSampling({
          pond_id: pondId,
          doc: selectedPondObj?.doc || 48,
          sample_size_count: parseInt(sampleCount, 10),
          total_sample_weight_g: parseFloat(sampleWeightG),
          gut_condition: 'full',
          shell_condition: 'hard',
        });
      }
      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('modal_quick_log_title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('water')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'water'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Droplets className="w-4 h-4 text-cyan-500" />
            <span>{t('nav_water')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
            <span>{t('nav_feed')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sampling')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'sampling'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>{t('nav_growth')}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pond Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('select_pond')}
            </label>
            <select
              value={pondId}
              onChange={(e) => setPondId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
            >
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {language === 'te' ? p.name_te : p.name} (DOC {p.doc})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'water' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time / సమయం
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeOfDay('AM')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                        timeOfDay === 'AM'
                          ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      AM (05:30)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeOfDay('PM')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                        timeOfDay === 'PM'
                          ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      PM (17:30)
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    DO (ppm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={doPpm}
                    onChange={(e) => setDoPpm(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    pH (7.5 - 8.5)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Salinity (ppt)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={salinity}
                    onChange={(e) => setSalinity(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Alkalinity (ppm)
                  </label>
                  <input
                    type="number"
                    value={alkalinity}
                    onChange={(e) => setAlkalinity(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Notes / పరిశీలనలు (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Started 4 aerators, greenish-brown plankton bloom"
                  value={waterNotes}
                  onChange={(e) => setWaterNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meal / పూట
                  </label>
                  <select
                    value={mealNumber}
                    onChange={(e) => setMealNumber(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value={1}>Meal 1 (06:00 AM)</option>
                    <option value={2}>Meal 2 (11:00 AM)</option>
                    <option value={3}>Meal 3 (03:00 PM)</option>
                    <option value={4}>Meal 4 (07:00 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Feed Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={feedQuantity}
                    onChange={(e) => setFeedQuantity(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Check Trays (2.5 hours post-feed) / చెక్ ట్రేల పరిశీలన
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Tray 1', val: tray1, set: setTray1 },
                    { label: 'Tray 2', val: tray2, set: setTray2 },
                    { label: 'Tray 3', val: tray3, set: setTray3 },
                    { label: 'Tray 4', val: tray4, set: setTray4 },
                  ].map((tray, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{tray.label}</div>
                      <select
                        value={tray.val}
                        onChange={(e) => tray.set(e.target.value as any)}
                        className="w-full text-xs p-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded"
                      >
                        <option value="clean">Clean (100% Eaten)</option>
                        <option value="slight_left">10-20% Left</option>
                        <option value="half_left">50% Left (Overfed)</option>
                        <option value="untouched">Untouched (Critical)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sampling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shrimp Count in Cast Net / రొయ్యల సంఖ్య
                  </label>
                  <input
                    type="number"
                    value={sampleCount}
                    onChange={(e) => setSampleCount(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Net Weight (grams) / మొత్తం బరువు (గ్రాములు)
                  </label>
                  <input
                    type="number"
                    value={sampleWeightG}
                    onChange={(e) => setSampleWeightG(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Calculation Preview */}
              {parseFloat(sampleCount) > 0 && parseFloat(sampleWeightG) > 0 && (
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 text-xs flex justify-between items-center font-mono tabular-nums">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Calculated ABW: </span>
                    <strong className="text-cyan-700 dark:text-cyan-300 text-sm">
                      {(parseFloat(sampleWeightG) / parseFloat(sampleCount)).toFixed(2)} g
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Count / kg: </span>
                    <strong className="text-cyan-700 dark:text-cyan-300 text-sm">
                      {Math.round(1000 / (parseFloat(sampleWeightG) / parseFloat(sampleCount)))} pcs
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all disabled:opacity-50"
            >
              {successNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t('log_success_msg')}</span>
                </>
              ) : isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <span>{t('save_log_btn')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
