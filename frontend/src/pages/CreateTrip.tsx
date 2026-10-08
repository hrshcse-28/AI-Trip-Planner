import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import {
  Sparkles,
  MapPin,
  CalendarDays,
  AlertCircle,
  Compass,
  CheckCircle2,
  Loader2,
  Calendar as CalendarIcon,
  IndianRupee,
  Wand2,
} from 'lucide-react';

const SUGGESTED_INTERESTS = [
  '🏛️ Culture & Heritage',
  '🍛 Regional Food & Thalis',
  '🕉️ Spiritual & Sacred Temples',
  '🏖️ Tropical Beaches & Coastal',
  '🏔️ Mountain Trekking & Snow',
  '🐅 Wildlife Sanctuaries & Tigers',
  '☕ Hill Station Tea Gardens',
  '🛍️ Local Bazaars & Silk Weaving',
  '📸 Photography & Architecture',
  '🍸 Nightlife & Cafes',
];

const POPULAR_DESTINATIONS = [
  { name: 'Jaipur, Rajasthan', emoji: '🌸', duration: '4', budget: 'moderate' as const, interests: ['🏛️ Culture & Heritage', '🍛 Regional Food & Thalis', '🛍️ Local Bazaars & Silk Weaving'] },
  { name: 'Alleppey & Munnar, Kerala', emoji: '🌴', duration: '5', budget: 'moderate' as const, interests: ['🏖️ Tropical Beaches & Coastal', '☕ Hill Station Tea Gardens', '🍛 Regional Food & Thalis'] },
  { name: 'Goa Coastal', emoji: '🏖️', duration: '4', budget: 'budget' as const, interests: ['🏖️ Tropical Beaches & Coastal', '🍸 Nightlife & Cafes'] },
  { name: 'Varanasi, Uttar Pradesh', emoji: '🕉️', duration: '3', budget: 'budget' as const, interests: ['🕉️ Spiritual & Sacred Temples', '🏛️ Culture & Heritage', '🍛 Regional Food & Thalis'] },
  { name: 'Manali & Solang, Himachal', emoji: '🏔️', duration: '5', budget: 'budget' as const, interests: ['🏔️ Mountain Trekking & Snow', '📸 Photography & Architecture'] },
  { name: 'Udaipur, Rajasthan', emoji: '👑', duration: '3', budget: 'luxury' as const, interests: ['🏛️ Culture & Heritage', '📸 Photography & Architecture'] },
];

const SURPRISE_DESTINATIONS = [
  { name: 'Ziro Valley, Arunachal Pradesh', duration: '4', budget: 'moderate' as const, interests: ['☕ Hill Station Tea Gardens', '📸 Photography & Architecture'] },
  { name: 'Chitrakote Falls, Bastar, Chhattisgarh', duration: '3', budget: 'budget' as const, interests: ['🏛️ Culture & Heritage', '📸 Photography & Architecture'] },
  { name: 'Hampi & Vijayanagara, Karnataka', duration: '3', budget: 'budget' as const, interests: ['🏛️ Culture & Heritage', '📸 Photography & Architecture'] },
  { name: 'Dzukou Valley, Nagaland', duration: '4', budget: 'moderate' as const, interests: ['🏔️ Mountain Trekking & Snow', '☕ Hill Station Tea Gardens'] },
  { name: 'Agatti Coral Atolls, Lakshadweep', duration: '5', budget: 'luxury' as const, interests: ['🏖️ Tropical Beaches & Coastal'] },
];

const GENERATION_STEPS = [
  'Analyzing Indian destination geography and local travel gems...',
  'Curating daily itineraries matching your INR budget...',
  'Optimizing transit buffers, opening hours, and map locations...',
  'Polishing culinary and cultural recommendations...',
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const location = useLocation();

  const [nlpInput, setNlpInput] = useState('');
  const [isNlpParsing, setIsNlpParsing] = useState(false);

  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState('4');
  const [budgetLevel, setBudgetLevel] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [startDate, setStartDate] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read URL search params (e.g. ?nlp=... or ?destination=...&duration=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nlpParam = params.get('nlp');
    const destParam = params.get('destination');
    const durParam = params.get('duration');

    if (destParam) {
      setDestination(destParam);
    }
    if (durParam) {
      setDurationDays(durParam);
    }

    if (nlpParam) {
      setNlpInput(nlpParam);
      handleParseNlp(nlpParam);
    }
  }, [location.search]);

  // Handle NLP prompt parse
  const handleParseNlp = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsNlpParsing(true);
    setErrorMessage(null);

    try {
      const res = await api.trips.nlpCreate(promptText.trim(), false);
      const plan = res.parsedPlan;
      if (plan) {
        setDestination(plan.destination);
        setDurationDays(String(plan.durationDays));
        setBudgetLevel(plan.budgetLevel);
        if (plan.interests) {
          const matched = SUGGESTED_INTERESTS.filter((i) =>
            plan.interests.toLowerCase().includes(i.replace(/^[\p{Emoji}\s]+/u, '').toLowerCase())
          );
          if (matched.length > 0) {
            setSelectedInterests(matched);
          }
        }
      }
    } catch (err: any) {
      console.warn('NLP parsing error:', err);
    } finally {
      setIsNlpParsing(false);
    }
  };

  // Rotate generation step indicator during generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % GENERATION_STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSurpriseMe = () => {
    const random = SURPRISE_DESTINATIONS[Math.floor(Math.random() * SURPRISE_DESTINATIONS.length)];
    setDestination(random.name);
    setDurationDays(random.duration);
    setBudgetLevel(random.budget);
    setSelectedInterests(random.interests);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!destination.trim()) {
      setErrorMessage('Please enter a destination.');
      return;
    }

    const duration = parseInt(durationDays, 10);
    if (isNaN(duration) || duration < 1 || duration > 30) {
      setErrorMessage('Duration must be between 1 and 30 days.');
      return;
    }

    setIsGenerating(true);
    setActiveStepIndex(0);

    // Combine pills and custom interest
    const allInterests = [
      ...selectedInterests.map((i) => i.replace(/^[\p{Emoji}\s]+/u, '')),
      ...(customInterest.trim() ? [customInterest.trim()] : []),
    ].join(', ');

    try {
      // 1. Create trip record in database
      const createRes = await api.trips.create({
        destination: destination.trim(),
        durationDays: duration,
        budgetLevel,
        interests: allInterests || undefined,
        title: `Adventure in ${destination.trim()}`,
      });

      const tripId = createRes.trip.id;

      // 2. Call AI service to generate itinerary
      try {
        await api.trips.generate(tripId);
      } catch (genErr: any) {
        console.warn('AI generation notice:', genErr);
      }

      // 3. Navigate to Trip Details page
      navigate(`/trip/${tripId}`);
    } catch (err: any) {
      console.error('Trip creation failed:', err);
      setErrorMessage(
        err.message || 'Failed to create and generate trip. Please try again.'
      );
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> AI Powered India Travel Planning
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Plan Your Next Adventure
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Share your dream destination, budget in INR, and style. Our AI will craft an unforgettable day-by-day itinerary.
        </p>
      </div>

      {/* ── Natural Language Prompt Bar ───────────────────────────────── */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-primary/10 border border-amber-500/30">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
          <Wand2 className="h-4 w-4" /> Natural Language Trip Builder
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder='e.g. "Plan a 5 day trip to Rajasthan under ₹25,000" or "Romantic Goa weekend"'
            value={nlpInput}
            onChange={(e) => setNlpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleParseNlp(nlpInput);
              }
            }}
            className="bg-white dark:bg-slate-900 rounded-xl text-sm"
          />
          <Button
            type="button"
            disabled={isNlpParsing || !nlpInput.trim()}
            onClick={() => handleParseNlp(nlpInput)}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shrink-0 h-10 px-4"
          >
            {isNlpParsing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Parsing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Auto-Fill Form
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Popular Destination Quick-Picks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Popular India Destinations
          </span>
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <Compass className="h-3.5 w-3.5" /> Surprise Me
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_DESTINATIONS.map((pop) => (
            <button
              key={pop.name}
              type="button"
              onClick={() => {
                setDestination(pop.name);
                setDurationDays(pop.duration);
                setBudgetLevel(pop.budget);
                setSelectedInterests(pop.interests);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                destination === pop.name
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary/50'
              }`}
            >
              <span className="mr-1">{pop.emoji}</span>
              {pop.name}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-md rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Trip Preferences</CardTitle>
          <CardDescription>
            Tell the AI planner about your destination, dates, and what you love to do.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate trip</p>
                <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Destination */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" /> Destination
              </Label>
              <Input
                id="destination"
                placeholder="e.g. Jaipur, Rajasthan, Kerala, Goa, Manali, Varanasi..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isGenerating}
                required
                className="h-11 rounded-xl"
              />
            </div>

            {/* Duration and Start Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-semibold flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-primary" /> Duration (Days)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  disabled={isGenerating}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="startDate" className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Start Date (Optional)
                  </Label>

                  {/* Quick Date Presets Dropdown */}
                  <select
                    onChange={(e) => {
                      const choice = e.target.value;
                      if (!choice) return;
                      const today = new Date();
                      let targetDate = new Date();

                      if (choice === 'today') {
                        targetDate = today;
                      } else if (choice === 'tomorrow') {
                        targetDate.setDate(today.getDate() + 1);
                      } else if (choice === 'weekend') {
                        const dayOfWeek = today.getDay();
                        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
                        targetDate.setDate(today.getDate() + daysUntilSaturday);
                      } else if (choice === '2weeks') {
                        targetDate.setDate(today.getDate() + 14);
                      } else if (choice === 'nextmonth') {
                        targetDate.setMonth(today.getMonth() + 1);
                      }

                      setStartDate(targetDate.toISOString().split('T')[0]);
                      e.target.value = '';
                    }}
                    className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2.5 py-1 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-none"
                  >
                    <option value="">⚡ Quick Date Presets...</option>
                    <option value="today">📅 Today</option>
                    <option value="tomorrow">🌅 Tomorrow</option>
                    <option value="weekend">🗓️ Next Weekend (Sat)</option>
                    <option value="2weeks">✈️ In 2 Weeks</option>
                    <option value="nextmonth">🏖️ Next Month</option>
                  </select>
                </div>

                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    disabled={isGenerating}
                    className="h-11 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Budget Level (INR focused) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4 text-primary" /> Budget Level (INR)
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'budget',
                    title: 'Budget',
                    range: '~₹1.5k–₹2.5k / day',
                    desc: 'Hostels, local thalis, trains & rickshaws',
                  },
                  {
                    id: 'moderate',
                    title: 'Moderate',
                    range: '~₹2.5k–₹5k / day',
                    desc: '3-4★ stays, AC cabs, boutique dining',
                  },
                  {
                    id: 'luxury',
                    title: 'Luxury',
                    range: '₹5k+ / day',
                    desc: '5★ heritage palaces, private chauffeur',
                  },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setBudgetLevel(tier.id as any)}
                    disabled={isGenerating}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      budgetLevel === tier.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-sm capitalize">{tier.title}</div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{tier.range}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-snug">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interests & Themes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">What do you want to experience?</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTED_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={isGenerating}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {/* Custom interest */}
              <div className="pt-2">
                <Input
                  placeholder="Or type a custom interest (e.g. scuba diving, temple architecture)..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  disabled={isGenerating}
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full text-base font-semibold h-12 rounded-xl shadow-md transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Itinerary...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" /> Generate AI Itinerary
                </>
              )}
            </Button>
          </form>

          {/* Step Indicator when Generating */}
          {isGenerating && (
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  Crafting your personalized trip to {destination}...
                </span>
              </div>

              <div className="space-y-2">
                {GENERATION_STEPS.map((step, idx) => {
                  const isDone = idx < activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs transition-opacity ${
                        isDone
                          ? 'text-primary font-medium'
                          : isCurrent
                          ? 'text-slate-900 dark:text-slate-100 font-semibold'
                          : 'text-slate-400 opacity-60'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : isCurrent ? (
                        <div className="h-2 w-2 rounded-full bg-primary animate-ping shrink-0 ml-1 mr-1" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0 ml-1 mr-1" />
                      )}
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
