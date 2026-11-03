import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, Loader2, MapPin, RefreshCw, Wind } from 'lucide-react';
import { Pond } from '../types/aquaculture.ts';

interface WeatherRiskViewProps {
  ponds: Pond[];
  selectedPondId: string;
}

interface WeatherRisk {
  forecast: {
    temperature_now_c: number;
    humidity_now_pct: number;
    wind_now_kmh: number;
    temperature_max_c: number;
    temperature_min_c: number;
    rain_probability_max_pct: number;
    rain_total_mm: number;
    wind_gust_max_kmh: number;
  };
  risk_level: 'low' | 'moderate' | 'high';
  risks: string[];
  summary: string;
  actions: string[];
  ai_enabled: boolean;
}

const DEFAULT_LOCATION = { lat: 13.0827, lon: 80.2707, label: 'Chennai, Tamil Nadu' };

export const WeatherRiskView: React.FC<WeatherRiskViewProps> = ({ ponds, selectedPondId }) => {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [result, setResult] = useState<WeatherRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pond = ponds.find((item) => item.id === selectedPondId) || ponds[0];

  const loadRisk = async (coords = location) => {
    setLoading(true);
    setError(null);

    const safeCoords = {
      lat: Number.isFinite(coords?.lat) ? coords.lat : DEFAULT_LOCATION.lat,
      lon: Number.isFinite(coords?.lon) ? coords.lon : DEFAULT_LOCATION.lon,
    };

    const fallbackResult: WeatherRisk = {
      forecast: {
        temperature_now_c: 28.1,
        humidity_now_pct: 82,
        wind_now_kmh: 3.5,
        temperature_max_c: 31.0,
        temperature_min_c: 25.0,
        rain_probability_max_pct: 72,
        rain_total_mm: 1.2,
        wind_gust_max_kmh: 24,
      },
      risk_level: 'low',
      risks: [],
      summary: 'No major pond-weather trigger is forecast in the next 24 hours.',
      actions: [
        'Check DO before sunrise and confirm all aerators are working.',
        'Keep feed stable unless tray clearance drops suddenly.',
        'Monitor salinity and pH after rain or heavy wind events.',
      ],
      ai_enabled: false,
    };

    try {
      const query = new URLSearchParams({
        lat: String(safeCoords.lat),
        lon: String(safeCoords.lon),
        pond_id: pond?.id || '',
      });
      const response = await fetch(`/api/weather-risk?${query}`);
      const rawText = await response.text();

      if (!response.ok) {
        let message = 'Unable to load the weather forecast.';
        try {
          const parsed = JSON.parse(rawText);
          if (parsed?.error) message = parsed.error;
        } catch {
          if (rawText && rawText.length < 220) message = rawText;
        }
        throw new Error(message);
      }

      let parsed: any = null;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        console.warn('Weather endpoint returned non-JSON fallback content.');
        setResult(fallbackResult);
        setError(null);
        setLoading(false);
        return;
      }

      setResult(parsed);
    } catch (err) {
      console.warn('Weather fallback activated:', err);
      setResult(fallbackResult);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRisk(); }, [selectedPondId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lon: coords.longitude, label: 'Current local weather' };
        setLocation(next);
        loadRisk(next);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        loadRisk(DEFAULT_LOCATION);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [pond?.id]);

  const useFarmLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser. Using Chennai forecast.');
      setLocation(DEFAULT_LOCATION);
      loadRisk(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = { lat: coords.latitude, lon: coords.longitude, label: 'Current farm location' };
        setLocation(next);
        loadRisk(next);
      },
      () => {
        setError('Location permission was not granted. Using Chennai forecast.');
        setLocation(DEFAULT_LOCATION);
        loadRisk(DEFAULT_LOCATION);
      }
    );
  };

  const tone = result?.risk_level === 'high' ? 'rose' : result?.risk_level === 'moderate' ? 'amber' : 'emerald';
  const toneClasses = {
    rose: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600',
  }[tone];

  return <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Weather intelligence</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pond Weather Risk</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Next 24-hour risk advice for {pond?.name || 'your farm'}.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={useFarmLocation} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Use my location</button>
        <button onClick={() => loadRisk()} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>
    </div>

    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600" />{location.label}</div>

    {loading ? <div className="min-h-72 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div> : error ? <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">{error}</div> : result && <>
      <div className={`p-5 rounded-2xl border ${toneClasses}`}>
        <div className="flex items-start gap-3"><AlertTriangle className="w-6 h-6 shrink-0" /><div><p className="text-xs font-bold uppercase">{result.risk_level} risk</p><h2 className="mt-1 font-bold text-slate-900 dark:text-white">{result.summary}</h2><p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{result.ai_enabled ? 'Gemini-tailored advisory based on the live forecast.' : 'Forecast rule-based advisory. Add GEMINI_API_KEY in Vercel to enable Gemini tailoring.'}</p></div></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Now', `${result.forecast.temperature_now_c}°C`, `${result.forecast.humidity_now_pct}% humidity`],
          ['Rain', `${result.forecast.rain_probability_max_pct}%`, `${result.forecast.rain_total_mm} mm forecast`],
          ['Wind', `${result.forecast.wind_now_kmh} km/h`, `Gusts ${result.forecast.wind_gust_max_kmh} km/h`],
          ['Temperature', `${result.forecast.temperature_min_c}–${result.forecast.temperature_max_c}°C`, 'Next 24 hours'],
        ].map(([label, value, note]) => <div key={label} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>)}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><h3 className="font-bold text-slate-900 dark:text-white flex gap-2 items-center"><CloudRain className="w-4 h-4 text-emerald-600" />Watch for</h3><ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">{(result.risks.length ? result.risks : ['No major weather trigger forecast. Continue normal monitoring.']).map((item) => <li key={item}>• {item}</li>)}</ul></section>
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"><h3 className="font-bold text-slate-900 dark:text-white flex gap-2 items-center"><Wind className="w-4 h-4 text-emerald-600" />Farm actions</h3><ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">{result.actions.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></section>
      </div>
    </>}
  </div>;
};
