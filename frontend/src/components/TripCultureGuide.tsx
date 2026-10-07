import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { CultureGuide } from '@/types';
import {
  Compass,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  UtensilsCrossed,
  Copy,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
} from 'lucide-react';

interface TripCultureGuideProps {
  tripId: string;
  destination: string;
}

export function TripCultureGuide({ tripId, destination }: TripCultureGuideProps) {
  const { toast } = useToast();
  const [guide, setGuide] = useState<CultureGuide | null>(null);
  const [activeTab, setActiveTab] = useState<'etiquette' | 'phrases' | 'dining' | 'scams'>('etiquette');
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  useEffect(() => {
    api.trips
      .getCulture(tripId)
      .then((res) => {
        setGuide(res.guide);
      })
      .catch((err) => {
        console.warn('Failed to load culture guide:', err);
      });
  }, [tripId]);

  const handleCopyPhrase = (phrase: string) => {
    navigator.clipboard.writeText(phrase);
    setCopiedPhrase(phrase);
    toast.success('Phrase Copied', `"${phrase}" copied to clipboard!`);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  const handleSpeakPhrase = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      toast.info('Pronunciation', text);
    }
  };

  if (!guide) {
    return (
      <Card className="rounded-2xl p-10 text-center text-slate-400 text-xs animate-pulse">
        Loading destination cultural guide & local customs...
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-amber-200">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Cultural Intelligence & Local Wisdom</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {destination} Insider Cultural Guide
          </h2>
          <p className="text-slate-300 text-sm max-w-lg">
            Essential etiquette, dining customs, useful phrases, and scam warnings to travel with confidence and deep respect for local culture.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('etiquette')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'etiquette'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Etiquette & Customs
          </button>
          <button
            onClick={() => setActiveTab('phrases')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'phrases'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> Local Phrasebook
          </button>
          <button
            onClick={() => setActiveTab('dining')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dining'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" /> Dining & Tipping
          </button>
          <button
            onClick={() => setActiveTab('scams')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'scams'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Scams to Avoid
          </button>
        </div>
      </div>

      {/* TAB 1: ETIQUETTE & CUSTOMS */}
      {activeTab === 'etiquette' && (
        <div className="space-y-6">
          {/* Key Customs Highlights */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              General Customs & Everyday Habits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.customs.map((custom, idx) => (
                <Card
                  key={idx}
                  className="rounded-2xl border-slate-200/80 p-4 bg-slate-50/50 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{custom}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Golden Rules */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Cultural Rules & Why They Matter
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guide.etiquette.map((item, idx) => (
                <Card key={idx} className="rounded-2xl border-slate-200/80 p-5 space-y-1.5 shadow-xs">
                  <span className="text-xs font-bold text-slate-900 block">{item.rule}</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.explanation}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCAL PHRASEBOOK */}
      {activeTab === 'phrases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Essential Travel Phrases</h3>
              <p className="text-xs text-slate-500">
                Click any phrase to hear pronunciation or copy for text messaging.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guide.phrases.map((phraseItem, idx) => (
              <Card
                key={idx}
                className="rounded-2xl border-slate-200/80 p-4 space-y-2 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      {phraseItem.phrase}
                    </span>
                    <button
                      onClick={() => handleSpeakPhrase(phraseItem.phrase)}
                      className="text-slate-400 hover:text-primary p-1 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Listen"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-primary">{phraseItem.translation}</div>
                  {phraseItem.pronunciation && phraseItem.pronunciation !== '—' && (
                    <div className="text-[11px] text-slate-400 italic">
                      Pronounced: "{phraseItem.pronunciation}"
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyPhrase(phraseItem.phrase)}
                  className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl h-8 mt-2"
                >
                  <Copy className="w-3 h-3 mr-1.5" />
                  {copiedPhrase === phraseItem.phrase ? 'Copied!' : 'Copy Phrase'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DINING & TIPPING */}
      {activeTab === 'dining' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            Culinary Culture & Restaurant Norms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guide.diningTips.map((tip, idx) => (
              <Card
                key={idx}
                className="rounded-2xl border-slate-200/80 p-5 bg-gradient-to-br from-emerald-50/40 to-transparent flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{tip}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SCAMS TO AVOID */}
      {activeTab === 'scams' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Common Tourist Traps & Safety Warnings
          </h3>
          <div className="space-y-3">
            {guide.scamsToAvoid.map((scam, idx) => (
              <Card
                key={idx}
                className="rounded-2xl border-rose-200 bg-rose-50/30 p-4 flex items-start gap-3"
              >
                <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-950 font-medium leading-relaxed">{scam}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
