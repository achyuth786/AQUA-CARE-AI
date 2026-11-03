import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { OverviewDashboard } from './components/OverviewDashboard.tsx';
import { PondsView } from './components/PondsView.tsx';
import { WaterQualityView } from './components/WaterQualityView.tsx';
import { FeedManagementView } from './components/FeedManagementView.tsx';
import { GrowthSamplingView } from './components/GrowthSamplingView.tsx';
import { ShrimpHealthScanner } from './components/ShrimpHealthScanner.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { HarvestSimulatorView } from './components/HarvestSimulatorView.tsx';
import { MarketPriceTracker } from './components/MarketPriceTracker.tsx';
import { WeatherRiskView } from './components/WeatherRiskView.tsx';
import { FastLogModal } from './components/FastLogModal.tsx';
import { AuthModal, UserProfile } from './components/AuthModal.tsx';
import { AddPondModal } from './components/AddPondModal.tsx';
import { FloatingAiWidget } from './components/FloatingAiWidget.tsx';

import {
  initialFarm,
  initialPonds,
  initialWaterRecords,
  initialFeedRecords,
  initialSamplingRecords,
  initialMarketPrices,
  initialAlerts,
} from './data/seedData.ts';
import {
  Farm,
  Pond,
  WaterQualityRecord,
  FeedRecord,
  SamplingRecord,
  MarketPriceRecord,
  Alert,
} from './types/aquaculture.ts';

function AppContent() {
  const { language } = useTranslation();

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aquacare_theme');
    if (saved) return saved === 'dark';
    return false; // Default to clean fresh green & white light theme as requested by the user
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aquacare_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aquacare_theme', 'light');
    }
  }, [darkMode]);

  // Farmer User State (Login / Profile)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('aquacare_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      name: 'Farmer',
      phone: '',
      farm_name: 'My Aqua Farm',
      district: 'Coastal Region, AP',
      isLoggedIn: true,
    };
  });

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('aquacare_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    const emptyUser: UserProfile = {
      name: 'Guest Farmer',
      phone: '',
      farm_name: '',
      district: 'Andhra Pradesh',
      isLoggedIn: false,
    };
    setCurrentUser(emptyUser);
    localStorage.removeItem('aquacare_user');
  };

  // Active View and Navigation
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedPondId, setSelectedPondId] = useState<string>('all');

  // Modals State
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isAddPondOpen, setIsAddPondOpen] = useState<boolean>(false);
  const [editingPond, setEditingPond] = useState<Pond | null>(null);

  // Application Data States
  const [ponds, setPonds] = useState<Pond[]>(() => {
    try {
      const saved = localStorage.getItem('aquacare_ponds');
      return saved ? JSON.parse(saved) : initialPonds;
    } catch {
      return initialPonds;
    }
  });
  const [waterRecords, setWaterRecords] = useState<WaterQualityRecord[]>(initialWaterRecords);
  const [feedRecords, setFeedRecords] = useState<FeedRecord[]>(initialFeedRecords);
  const [samplingRecords, setSamplingRecords] = useState<SamplingRecord[]>(initialSamplingRecords);
  const [marketPrices, setMarketPrices] = useState<MarketPriceRecord[]>(initialMarketPrices);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  // Keep farmer-created ponds available when the hosted API is unavailable.
  useEffect(() => {
    localStorage.setItem('aquacare_ponds', JSON.stringify(ponds));
  }, [ponds]);

  // Load backend state
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [pondsRes, waterRes, feedRes, sampRes, priceRes, alertRes] = await Promise.all([
          fetch('/api/ponds').catch(() => null),
          fetch('/api/water-quality').catch(() => null),
          fetch('/api/feed-records').catch(() => null),
          fetch('/api/growth-sampling').catch(() => null),
          fetch('/api/market-prices').catch(() => null),
          fetch('/api/alerts').catch(() => null),
        ]);

        if (pondsRes && pondsRes.ok) setPonds(await pondsRes.json());
        if (waterRes && waterRes.ok) setWaterRecords(await waterRes.json());
        if (feedRes && feedRes.ok) setFeedRecords(await feedRes.json());
        if (sampRes && sampRes.ok) setSamplingRecords(await sampRes.json());
        if (priceRes && priceRes.ok) setMarketPrices(await priceRes.json());
        if (alertRes && alertRes.ok) setAlerts(await alertRes.json());
      } catch (err) {
        console.log('Using preloaded state:', err);
      }
    };

    loadBackendData();
  }, []);

  // Save new pond or update existing pond
  const handleSavePond = async (pondData: any, isEdit: boolean, pondId?: string) => {
    try {
      const url = isEdit && pondId ? `/api/ponds/${pondId}` : '/api/ponds';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pondData),
      });

      if (!res.ok) throw new Error(`Pond API returned ${res.status}`);

      const updated = await res.json();
      if (isEdit) {
        setPonds((prev) => prev.map((p) => (p.id === pondId ? updated : p)));
        setSelectedPondId(pondId || updated.id);
      } else {
        setPonds((prev) => [...prev, updated]);
        setSelectedPondId(updated.id);
      }
      setCurrentView('dashboard');
    } catch {
      if (isEdit && pondId) {
        setPonds((prev) =>
          prev.map((p) =>
            p.id === pondId
              ? {
                  ...p,
                  ...pondData,
                  name: pondData.name || p.name,
                  name_te: pondData.name_te || p.name_te || p.name,
                  estimated_biomass_kg: Math.round(
                    (Number(pondData.seed_quantity || p.seed_quantity) * 0.85 * Number(pondData.current_abw_g || p.current_abw_g)) / 1000
                  ),
                }
              : p
          )
        );
        setSelectedPondId(pondId);
      } else {
        const seedCount = Number(pondData.seed_quantity || 100000);
        const abw = Number(pondData.current_abw_g || 16.5);
        const area = Number(pondData.area_ha || 1.0);
        const newLocalPond: Pond = {
          id: `local-pond-${Date.now()}`,
          farm_id: 'farm-godavari-01',
          name: (pondData.name || 'Pond').trim() || 'Pond',
          name_te: pondData.name_te || pondData.name || 'చెరువు',
          area_ha: area,
          depth_m: Number(pondData.depth_m || 1.5),
          water_source: pondData.water_source || 'Brackish Creek Canal',
          aerator_count: Number(pondData.aerator_count || 4),
          aerator_hp: Number(pondData.aerator_hp || 8),
          status: 'active',
          doc: Number(pondData.doc || 40),
          stocking_date: pondData.stocking_date || new Date().toISOString().split('T')[0],
          species: 'Litopenaeus vannamei (SPF)',
          seed_quantity: seedCount,
          stocking_density_per_sqm: Math.round(seedCount / (Math.max(area, 0.01) * 10000)),
          initial_abw_g: 0.01,
          current_abw_g: abw,
          estimated_count: Number(pondData.estimated_count || Math.round(1000 / abw)),
          estimated_survival_pct: 85.0,
          estimated_biomass_kg: Math.round((seedCount * 0.85 * abw) / 1000),
          cumulative_feed_kg: 1800,
          fcr: 1.28,
          health_score: 92,
        };
        setPonds((prev) => [...prev, newLocalPond]);
        setSelectedPondId(newLocalPond.id);
      }
      setCurrentView('dashboard');
    }
  };

  const handleDeletePond = async (id: string) => {
    try {
      await fetch(`/api/ponds/${id}`, { method: 'DELETE' });
    } catch {}
    setPonds((prev) => prev.filter((p) => p.id !== id));
    if (selectedPondId === id) setSelectedPondId('all');
  };

  const handleEditPondTrigger = (pond: Pond) => {
    setEditingPond(pond);
    setIsAddPondOpen(true);
  };

  const handleOpenNewPondTrigger = () => {
    setEditingPond(null);
    setIsAddPondOpen(true);
  };

  // Handlers for logging records
  const handleSaveWater = async (data: any) => {
    try {
      const res = await fetch('/api/water-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newRecord = await res.json();
        setWaterRecords((prev) => [newRecord, ...prev]);
        const alertRes = await fetch('/api/alerts');
        if (alertRes.ok) setAlerts(await alertRes.json());
      }
    } catch {
      const localRecord: WaterQualityRecord = {
        id: `wq-${Date.now()}`,
        ...data,
        timestamp: new Date().toISOString(),
      };
      setWaterRecords((prev) => [localRecord, ...prev]);
    }
  };

  const handleSaveFeed = async (data: any) => {
    try {
      const res = await fetch('/api/feed-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newRecord = await res.json();
        setFeedRecords((prev) => [newRecord, ...prev]);
      }
    } catch {
      const localFeed: FeedRecord = {
        id: `feed-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...data,
      };
      setFeedRecords((prev) => [localFeed, ...prev]);
    }
  };

  const handleSaveSampling = async (data: any) => {
    try {
      const res = await fetch('/api/growth-sampling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newRecord = await res.json();
        setSamplingRecords((prev) => [newRecord, ...prev]);
        const pondsRes = await fetch('/api/ponds');
        if (pondsRes.ok) setPonds(await pondsRes.json());
      }
    } catch {
      const sampleSize = Number(data.sample_size_count) || 100;
      const totalWeight = Number(data.total_sample_weight_g) || 1500;
      const abw = Number((totalWeight / sampleSize).toFixed(2));
      const localSamp: SamplingRecord = {
        id: `samp-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        abw_g: abw,
        count_per_kg: Math.round(1000 / abw),
        weekly_gain_g: 3.0,
        growth_rate_g_day: 0.43,
        ...data,
      };
      setSamplingRecords((prev) => [localSamp, ...prev]);
    }
  };

  const handleSavePrice = async (data: { count_per_kg: number; price_inr: number; region?: string }) => {
    try {
      const res = await fetch('/api/market-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const priceRes = await fetch('/api/market-prices');
        if (priceRes.ok) setMarketPrices(await priceRes.json());
      }
    } catch {
      const localPrice: MarketPriceRecord = {
        id: `mp-${data.count_per_kg}`,
        date: new Date().toISOString().split('T')[0],
        count_per_kg: data.count_per_kg,
        price_inr: data.price_inr,
        region: data.region || 'Bhimavaram Gate',
      };
      setMarketPrices((prev) => {
        const filtered = prev.filter((p) => p.count_per_kg !== data.count_per_kg);
        return [...filtered, localPrice].sort((a, b) => a.count_per_kg - b.count_per_kg);
      });
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}/ack`, { method: 'PATCH' });
    } catch (e) {
      console.log(e);
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const unreadAlerts = alerts.filter(
    (a) => !a.acknowledged && (selectedPondId === 'all' || a.pond_id === selectedPondId)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500/20 selection:text-emerald-700">
      {/* Top Navigation Bar with Green Accent */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedPondId={selectedPondId}
        setSelectedPondId={setSelectedPondId}
        ponds={ponds}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onOpenAddPond={handleOpenNewPondTrigger}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        unreadAlertCount={unreadAlerts.length}
        onNavigateToAlerts={() => setCurrentView('water')}
      />

      {/* Main Layout: Desktop Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          unreadAlertCount={unreadAlerts.length}
        />

        {/* Primary Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <OverviewDashboard
              ponds={ponds}
              selectedPondId={selectedPondId}
              waterRecords={waterRecords}
              feedRecords={feedRecords}
              samplingRecords={samplingRecords}
              alerts={alerts}
              marketPrices={marketPrices}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onNavigate={(view) => setCurrentView(view)}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onOpenAddPond={handleOpenNewPondTrigger}
              onEditPond={handleEditPondTrigger}
            />
          )}

          {currentView === 'ponds' && (
            <PondsView
              ponds={ponds}
              selectedPondId={selectedPondId}
              setSelectedPondId={setSelectedPondId}
              onNavigate={(view) => setCurrentView(view)}
              onOpenAddPond={handleOpenNewPondTrigger}
              onEditPond={handleEditPondTrigger}
              onDeletePond={handleDeletePond}
            />
          )}

          {currentView === 'water' && (
            <WaterQualityView
              ponds={ponds}
              selectedPondId={selectedPondId}
              waterRecords={waterRecords}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
            />
          )}

          {currentView === 'feed' && (
            <FeedManagementView
              ponds={ponds}
              selectedPondId={selectedPondId}
              feedRecords={feedRecords}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
            />
          )}

          {currentView === 'growth' && (
            <GrowthSamplingView
              ponds={ponds}
              selectedPondId={selectedPondId}
              samplingRecords={samplingRecords}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
            />
          )}

          {currentView === 'scanner' && (
            <ShrimpHealthScanner
              ponds={ponds}
              selectedPondId={selectedPondId}
            />
          )}

          {currentView === 'assistant' && (
            <AiAssistantView
              ponds={ponds}
              selectedPondId={selectedPondId}
            />
          )}

          {currentView === 'harvest' && (
            <HarvestSimulatorView
              ponds={ponds}
              selectedPondId={selectedPondId}
              marketPrices={marketPrices}
            />
          )}

          {currentView === 'prices' && (
            <MarketPriceTracker
              marketPrices={marketPrices}
              onSavePrice={handleSavePrice}
              ponds={ponds}
            />
          )}
          {currentView === 'weather' && (
            <WeatherRiskView ponds={ponds} selectedPondId={selectedPondId} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
      />

      {/* Floating 24/7 AI Doubt Solver Assistant */}
      <FloatingAiWidget
        ponds={ponds}
        selectedPondId={selectedPondId}
      />

      {/* Fast Data Logging Modal */}
      <FastLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        ponds={ponds}
        selectedPondId={selectedPondId}
        onSaveWater={handleSaveWater}
        onSaveFeed={handleSaveFeed}
        onSaveSampling={handleSaveSampling}
      />

      {/* Farmer Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Add / Edit Pond Details Modal */}
      <AddPondModal
        isOpen={isAddPondOpen}
        onClose={() => setIsAddPondOpen(false)}
        onSavePond={handleSavePond}
        editingPond={editingPond}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
