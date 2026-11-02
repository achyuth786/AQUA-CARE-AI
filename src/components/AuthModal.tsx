import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { X, UserCheck, ShieldCheck, Phone, Lock, User, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';

export interface UserProfile {
  name: string;
  phone: string;
  farm_name: string;
  district: string;
  isLoggedIn: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const { language, t } = useTranslation();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('9848022338');
  const [loginPassword, setLoginPassword] = useState('vannamei2026');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regFarmName, setRegFarmName] = useState('');
  const [regDistrict, setRegDistrict] = useState('West Godavari');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      name: 'Farmer User',
      phone: loginPhone,
      farm_name: 'My Aqua Farm',
      district: 'Coastal Region, AP',
      isLoggedIn: true,
    });
    onClose();
  };

  const handleDemoLogin = () => {
    onLogin({
      name: 'Farmer User',
      phone: '9848012345',
      farm_name: 'My Aqua Farm',
      district: 'Coastal Region, AP',
      isLoggedIn: true,
    });
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) return;
    onLogin({
      name: regName,
      phone: regPhone,
      farm_name: regFarmName || `${regName}'s Aqua Farm`,
      district: regDistrict,
      isLoggedIn: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden transition-all">
        {/* Header with Fresh Green Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/40 text-emerald-100 border border-emerald-400/30">
              Vannamei Farmer Portal
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {currentUser.isLoggedIn
              ? language === 'te' ? 'రైతు ప్రొఫైల్' : 'Farmer Profile'
              : tab === 'login'
              ? language === 'te' ? 'రైతు లాగిన్' : 'Farmer Sign In'
              : language === 'te' ? 'కొత్త ఫార్మ్ నమోదు' : 'Register New Farm'}
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1">
            {language === 'te'
              ? 'మీ వ్యక్తిగత చెరువుల సమాచారం మరియు రోజువారీ నిర్వహణ'
              : 'Secure access to your private pond records & AI advisors'}
          </p>
        </div>

        {/* If already logged in */}
        {currentUser.isLoggedIn ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h4>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {currentUser.district}
                </div>
                <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                  {currentUser.farm_name}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                {language === 'te' ? 'డాష్‌బోర్డ్‌కు వెళ్ళండి' : 'Go to Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                {language === 'te' ? 'లాగౌట్' : 'Sign Out'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Tabs */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'te' ? 'లాగిన్' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setTab('register')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {language === 'te' ? 'కొత్త రిజిస్ట్రేషన్' : 'Register Farm'}
              </button>
            </div>

            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number / ఫోన్ నెంబర్
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="e.g. 9848022338"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password / పాస్‌వర్డ్
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  {language === 'te' ? 'ఖాతాలోకి ప్రవేశించండి' : 'Sign In to Farm'}
                </button>

                {/* 1-Click Demo Login */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {language === 'te'
                        ? 'డెమో రైతు లాగిన్ (1-క్లిక్ ఎంట్రీ)'
                        : 'Quick 1-Click Demo Login (Farmer)'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Farmer Name / రైతు పేరు
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. K. Subba Rao"
                    required
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number / ఫోన్ నెంబర్
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 9848123456"
                    required
                    className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Farm Name / ఫార్మ్ పేరు
                  </label>
                  <input
                    type="text"
                    value={regFarmName}
                    onChange={(e) => setRegFarmName(e.target.value)}
                    placeholder="e.g. Sri Krishna Aqua Farms"
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    District / జిల్లా
                  </label>
                  <select
                    value={regDistrict}
                    onChange={(e) => setRegDistrict(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="West Godavari">West Godavari (పశ్చిమ గోదావరి)</option>
                    <option value="East Godavari">East Godavari (తూర్పు గోదావరి / కోనసీమ)</option>
                    <option value="Krishna">Krishna (కృష్ణా జిల్లా)</option>
                    <option value="Bapatla">Bapatla (బాపట్ల)</option>
                    <option value="Nellore">Nellore (నెల్లూరు)</option>
                    <option value="Other">Other Aquaculture District</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
                >
                  {language === 'te' ? 'ఫార్మ్‌ను నమోదు చేసి ప్రారంభించండి' : 'Register Farm & Start'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
