import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { Pond } from '../types/aquaculture.ts';
import { BotMessageSquare, X, Send, Sparkles, User, RefreshCw, MessageCircle } from 'lucide-react';

interface FloatingAiWidgetProps {
  ponds: Pond[];
  selectedPondId: string;
}

export const FloatingAiWidget: React.FC<FloatingAiWidgetProps> = ({
  ponds,
  selectedPondId,
}) => {
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text:
        language === 'te'
          ? 'నమస్కారం! నేను మీ ఆక్వాకేర్ AI రొయ్యల సాగు నిపుణుడిని. వనామి రొయ్యల చెరువులు మరియు సాగుకు సంబంధించిన ఏ సందేహమైనా అడగండి — సీడ్ ఎంపిక, హేచరీ టెస్టులు, చెరువు తయారీ, దాణా ట్రేలు, మినరల్స్, వ్యాధులు లేదా మార్కెట్ ధరలు.'
          : 'Hello! I am your 24/7 AquaCare AI Advisor. Ask ANY doubt related to Vannamei shrimp ponds and cultures — seed quality selection, pond prep & bleaching, feed trays, minerals & molting, low DO, or disease prevention.',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (customText?: string) => {
    const text = (customText || inputMsg).trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInputMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          pond_id: selectedPondId,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            language === 'te'
              ? 'క్షమించండి, సర్వర్ కనెక్ట్ అవ్వలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.'
              : 'Could not connect to AI advisor. Please retry.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer font-bold text-xs"
          aria-label="Open AI Farm Advisor"
        >
          <BotMessageSquare className="w-5 h-5" />
          <span>{language === 'te' ? 'AI సలహాదారుని అడగండి' : 'Ask AI Doubt Solver'}</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <BotMessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">
                  {language === 'te' ? 'ఆక్వాకేర్ AI సలహాదారు' : 'AquaCare AI Farm Advisor'}
                </h4>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Live Assistant (Gemini 3.8 Flash)
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-700 text-white'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <BotMessageSquare className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick doubts chips */}
          <div className="px-3 py-2 bg-emerald-50/70 dark:bg-emerald-950/30 border-t border-emerald-100 dark:border-emerald-900/40 flex gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'నాణ్యమైన వనామి సీడ్ (PL) ఎలా ఎంపిక చేసుకోవాలి మరియు హేచరీలో ఏ టెస్టులు చేయించాలి?' : 'How to select high-quality Vannamei seed (PL) and what hatchery tests to check?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 whitespace-nowrap cursor-pointer hover:bg-emerald-100 font-medium shrink-0"
            >
              {language === 'te' ? '🌱 సీడ్ ఎంపిక' : '🌱 Seed Selection'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'చెరువు తయారీలో ఎండబెట్టడం, దుక్కి, బ్లీచింగ్ మరియు సున్నం మోతాదులు ఎంత?' : 'What are the exact bleaching and liming doses for pond preparation?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 whitespace-nowrap cursor-pointer hover:bg-emerald-100 font-medium shrink-0"
            >
              {language === 'te' ? '🚜 చెరువు తయారీ' : '🚜 Pond Prep'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'ఈరోజు చెరువులో ఎంత ఫీడ్ వేయాలి?' : 'How much feed should I give today?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 shrink-0"
            >
              {language === 'te' ? '🥣 దాణా ఎంత వేయాలి?' : '🥣 Feed Ration'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'కుబుసం (మోల్టింగ్) సమయంలో మెగ్నీషియం, కాల్షియం, పొటాషియం సమతుల్యత ఎలా?' : 'How to balance magnesium, calcium, and potassium before lunar molting?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 shrink-0"
            >
              {language === 'te' ? '🧪 మినరల్స్' : '🧪 Minerals'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'ఆక్సిజన్ పడిపోతే ఏం చేయాలి?' : 'What to do if DO drops below 4.0 ppm?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 shrink-0"
            >
              {language === 'te' ? '💨 ఆక్సిజన్ సమస్య' : '💨 Low DO'}
            </button>
            <button
              type="button"
              onClick={() => handleSend(language === 'te' ? 'వైట్ గట్, ఈహెచ్‌పీ (EHP) మరియు వైట్ స్పాట్ నివారణ చర్యలు ఏమిటి?' : 'How to prevent White Gut, EHP slow growth, and White Spot disease?')}
              className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 shrink-0"
            >
              {language === 'te' ? '🛡️ వ్యాధుల నివారణ' : '🛡️ Disease Care'}
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={language === 'te' ? 'ఏదైనా సందేహం అడగండి...' : 'Ask any aquaculture doubt...'}
              className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isLoading}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
