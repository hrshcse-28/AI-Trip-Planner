import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  MapPin,
  Sparkles,
  IndianRupee,
  ShieldCheck,
  Utensils,
  Award,
  X,
  Eye,
  Info,
  Scale,
  Calendar,
  Star,
  Clock,
  Compass,
  Gem,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface Attraction {
  name: string;
  type: string;
  highlight: string;
}

interface FoodSpecialty {
  name: string;
  isVeg: boolean;
  isJainFriendly?: boolean;
  description: string;
}

interface Destination {
  id: string;
  name: string;
  state: string;
  unionTerritory?: string | null;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  category: string;
  subcategories: string;
  bestTimeToVisit: string;
  idealDuration: string;
  budgetLevel: string;
  estimatedDailyCost: number;
  popularActivities: string[];
  attractions: Attraction[];
  foodSpecialties: FoodSpecialty[];
  localLanguages: string;
  culture: string;
  safetyInformation: string;
  transportation: string;
  nearbyDestinations: string;
  hiddenGem: boolean;
  familyFriendly: boolean;
  honeymoonFriendly: boolean;
  backpackerFriendly: boolean;
  soloFriendly: boolean;
  adventureFriendly: boolean;
  spiritual: boolean;
  heritage: boolean;
  nature: boolean;
  beach: boolean;
  wildlife: boolean;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  popularityScore: number;
}

interface StateSummary {
  name: string;
  isUnionTerritory: boolean;
  count: number;
  sampleImage: string;
  categories: string[];
  sampleDestinations: string[];
}

interface Festival {
  id: string;
  name: string;
  state: string;
  celebrationMonth: string;
  significance: string;
  traditions: string;
  famousPlaces: string;
  imageUrl?: string | null;
}

const CATEGORIES = [
  { label: 'All Destinations', value: 'All', emoji: '🇮🇳' },
  { label: 'Spiritual & Temples', value: 'Spiritual', emoji: '🕉️' },
  { label: 'Heritage & Forts', value: 'Heritage', emoji: '🏛️' },
  { label: 'Hill Stations', value: 'Hill Stations', emoji: '☕' },
  { label: 'Tropical Beaches', value: 'Beaches', emoji: '🏖️' },
  { label: 'High Mountains', value: 'Mountains', emoji: '🏔️' },
  { label: 'Wildlife & Safaris', value: 'Wildlife', emoji: '🐅' },
  { label: 'Nature & Waterfalls', value: 'Nature', emoji: '🌿' },
  { label: 'Culture & Arts', value: 'Culture', emoji: '🎨' },
];

export default function ExploreIndia() {
  const navigate = useNavigate();

  // Data states
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [statesSummary, setStatesSummary] = useState<StateSummary[]>([]);
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'budget' | 'moderate' | 'luxury'>('all');
  const [showHiddenGemsOnly, setShowHiddenGemsOnly] = useState(false);
  const [stateTypeTab, setStateTypeTab] = useState<'all' | 'states' | 'uts'>('all');

  // Comparison drawer state
  const [comparedDestinations, setComparedDestinations] = useState<Destination[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Detail Modal state
  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);

  // Feature Modals
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showFestivalModal, setShowFestivalModal] = useState(false);

  // Semantic search results
  const [semanticMode, setSemanticMode] = useState(false);
  const [semanticResults, setSemanticResults] = useState<{ destination: Destination; score: number; matchReasons: string[] }[]>([]);
  const [isSemanticLoading, setIsSemanticLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [destRes, statesRes, festRes] = await Promise.all([
          api.destinations.list({ limit: '60' }),
          api.destinations.getStates(),
          api.destinations.getFestivals(),
        ]);
        setDestinations(destRes.destinations);
        setStatesSummary(statesRes.states);
        setFestivals(festRes.festivals);
      } catch (err) {
        console.error('Failed to load India destinations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle semantic search
  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSemanticLoading(true);
    setSemanticMode(true);
    try {
      const res = await api.destinations.semanticSearch(searchQuery.trim());
      setSemanticResults(res.results);
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setIsSemanticLoading(false);
    }
  };

  const clearSemanticSearch = () => {
    setSemanticMode(false);
    setSearchQuery('');
    setSemanticResults([]);
  };

  // Filtered destinations
  const filteredDestinations = useMemo(() => {
    if (semanticMode) {
      return semanticResults.map((r) => r.destination);
    }

    return destinations.filter((d) => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesState = d.state.toLowerCase().includes(q);
        const matchesCity = d.city.toLowerCase().includes(q);
        const matchesDesc = d.description.toLowerCase().includes(q);
        const matchesCategory = d.category.toLowerCase().includes(q);
        if (!matchesName && !matchesState && !matchesCity && !matchesDesc && !matchesCategory) {
          return false;
        }
      }

      // State / UT filter
      if (selectedState !== 'All') {
        const isMatch = d.state.toLowerCase() === selectedState.toLowerCase() ||
          (d.unionTerritory && d.unionTerritory.toLowerCase() === selectedState.toLowerCase());
        if (!isMatch) return false;
      }

      // Category filter
      if (selectedCategory !== 'All') {
        const matchesPrimary = d.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSub = d.subcategories.toLowerCase().includes(selectedCategory.toLowerCase());
        if (!matchesPrimary && !matchesSub) return false;
      }

      // Budget filter
      if (budgetFilter !== 'all' && d.budgetLevel !== budgetFilter) {
        return false;
      }

      // Hidden gem filter
      if (showHiddenGemsOnly && !d.hiddenGem) {
        return false;
      }

      return true;
    });
  }, [destinations, searchQuery, selectedState, selectedCategory, budgetFilter, showHiddenGemsOnly, semanticMode, semanticResults]);

  // States filtered by State vs UT tab
  const filteredStatesList = useMemo(() => {
    if (stateTypeTab === 'states') {
      return statesSummary.filter((s) => !s.isUnionTerritory);
    }
    if (stateTypeTab === 'uts') {
      return statesSummary.filter((s) => s.isUnionTerritory);
    }
    return statesSummary;
  }, [statesSummary, stateTypeTab]);

  // Toggle comparison item
  const toggleCompare = (dest: Destination) => {
    if (comparedDestinations.some((c) => c.id === dest.id)) {
      setComparedDestinations((prev) => prev.filter((c) => c.id !== dest.id));
    } else {
      if (comparedDestinations.length >= 4) {
        alert('You can compare up to 4 destinations simultaneously.');
        return;
      }
      setComparedDestinations((prev) => [...prev, dest]);
    }
  };

  const handlePlanTrip = (destName: string, days?: string) => {
    const duration = days || '4';
    navigate(`/create-trip?destination=${encodeURIComponent(destName)}&duration=${duration}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="relative py-16 lg:py-24 bg-gradient-to-b from-slate-950 via-indigo-950/90 to-slate-900 text-white overflow-hidden border-b border-indigo-900/40">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop"
            alt="Taj Mahal background"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold mb-4 border border-amber-500/30 backdrop-blur-md">
            <Sparkles className="h-4 w-4" /> Comprehensive India Discovery Engine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">Incredible India</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-8 font-normal leading-relaxed">
            All 28 States. All 8 Union Territories. Ancient UNESCO forts, tranquil Himalayan peaks, backwater houseboats, and sacred temple ghats.
          </p>

          {/* Natural Language & Search Bar */}
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSemanticSearch} className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl">
              <Search className="h-5 w-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                placeholder='Search destinations, e.g. "peaceful places near mountains", "Goa", "Rajasthan", "Varanasi"...'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (semanticMode) setSemanticMode(false);
                }}
                className="w-full px-4 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSemanticSearch}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button
                type="submit"
                disabled={isSemanticLoading}
                className="mr-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl px-5 h-10 shadow-lg text-xs sm:text-sm shrink-0"
              >
                {isSemanticLoading ? 'Thinking...' : 'AI Search'}
              </Button>
            </form>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-300">
              <span className="text-slate-400">Try searches:</span>
              {[
                'peaceful places near mountains',
                'cheap places for students',
                'romantic beaches in Goa',
                'spiritual ghats of Varanasi',
                'monsoon waterfalls',
              ].map((queryText) => (
                <button
                  key={queryText}
                  type="button"
                  onClick={() => {
                    setSearchQuery(queryText);
                    setSemanticMode(true);
                    api.destinations.semanticSearch(queryText).then((res) => setSemanticResults(res.results));
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-slate-200"
                >
                  {queryText}
                </button>
              ))}
            </div>

            {/* Secondary Action Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFestivalModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                <Calendar className="h-4 w-4 mr-1.5 text-amber-400" />
                Festival Calendar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSafetyModal(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-400" />
                India Safety Center (112)
              </Button>

              {comparedDestinations.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => setShowCompareModal(true)}
                  className="bg-primary text-white hover:bg-primary/90 rounded-xl font-semibold animate-pulse"
                >
                  <Scale className="h-4 w-4 mr-1.5" />
                  Compare ({comparedDestinations.length}/4)
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Filter & Navigation Bar ───────────────────────────────────── */}
      <section className="sticky top-16 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Categories horizontal scroll */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  setSelectedCategory(cat.value);
                  if (semanticMode) setSemanticMode(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.value
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Quick toggles */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowHiddenGemsOnly(!showHiddenGemsOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                showHiddenGemsOnly
                  ? 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Gem className="h-3.5 w-3.5 text-amber-500" />
              <span>Hidden Gems</span>
            </button>

            {/* Budget dropdown */}
            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value as any)}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Any Budget</option>
              <option value="budget">Budget (Under ₹2,000)</option>
              <option value="moderate">Moderate (₹2k - ₹4k)</option>
              <option value="luxury">Luxury (₹4k+)</option>
            </select>

            {selectedState !== 'All' && (
              <button
                onClick={() => setSelectedState('All')}
                className="px-2.5 py-1.5 bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <span>{selectedState}</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── 3. State & UT Quick Selector ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" /> Explore by State & Union Territory
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Select any region to filter all authentic destinations, local foods, and attractions
            </p>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStateTypeTab('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${stateTypeTab === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All (36)
            </button>
            <button
              onClick={() => setStateTypeTab('states')}
              className={`px-3 py-1 rounded-lg transition-colors ${stateTypeTab === 'states' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-400'}`}
            >
              28 States
            </button>
            <button
              onClick={() => setStateTypeTab('uts')}
              className={`px-3 py-1 rounded-lg transition-colors ${stateTypeTab === 'uts' ? 'bg-white dark:bg-slate-900 shadow-sm text-primary' : 'text-slate-600 dark:text-slate-400'}`}
            >
              8 UTs
            </button>
          </div>
        </div>

        {/* State badges grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
          {filteredStatesList.map((state) => (
            <button
              key={state.name}
              onClick={() => {
                setSelectedState(selectedState === state.name ? 'All' : state.name);
                if (semanticMode) setSemanticMode(false);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                selectedState === state.name
                  ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                {state.name}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between mt-1">
                <span>{state.isUnionTerritory ? 'UT' : 'State'}</span>
                <span className="font-bold text-primary">{state.count} place{state.count > 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Destinations List Grid ────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">
              {semanticMode ? `AI Search Results (${filteredDestinations.length})` : `Featured Destinations (${filteredDestinations.length})`}
            </h3>
            {semanticMode && (
              <button
                onClick={clearSemanticSearch}
                className="text-xs text-primary underline ml-2"
              >
                Clear AI search
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500">
            Click on any card to explore attractions, food & 1-click AI itineraries
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredDestinations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Compass className="h-12 w-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">No destinations found</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Try adjusting your category, budget filter, or search term to discover other Indian destinations.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedState('All');
                setSelectedCategory('All');
                setBudgetFilter('all');
                setShowHiddenGemsOnly(false);
                setSearchQuery('');
                setSemanticMode(false);
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => {
              const isCompared = comparedDestinations.some((c) => c.id === dest.id);

              return (
                <Card
                  key={dest.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* Photo with Badges */}
                  <div className="relative h-52 overflow-hidden cursor-pointer" onClick={() => setActiveDestination(dest)}>
                    <img
                      src={dest.imageUrl}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Top badging */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                        {dest.category}
                      </span>
                      {dest.hiddenGem && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                          <Gem className="h-3 w-3" /> Offbeat
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-300" />
                        {dest.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Location overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="text-xl font-bold tracking-tight drop-shadow-md truncate">
                        {dest.name}
                      </h4>
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-amber-400" />
                        {dest.state} {dest.unionTerritory ? `(${dest.unionTerritory})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {dest.description}
                      </p>

                      {/* Key Attributes Bar */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 mb-3">
                        <div className="flex items-center gap-1.5">
                          <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                          <span>~₹{dest.estimatedDailyCost.toLocaleString('en-IN')}/day</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          <span>{dest.idealDuration}</span>
                        </div>
                      </div>

                      {/* Top Attractions Tags */}
                      {dest.attractions && dest.attractions.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Key Attractions:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {dest.attractions.slice(0, 3).map((a, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[150px]"
                              >
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handlePlanTrip(dest.name, dest.idealDuration.split(' ')[0])}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold text-xs h-9 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Plan AI Trip
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveDestination(dest)}
                        className="rounded-xl px-2.5 h-9"
                        title="View Full Guide"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant={isCompared ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleCompare(dest)}
                        className={`rounded-xl px-2.5 h-9 ${isCompared ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                        title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                      >
                        <Scale className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. Destination Deep-Dive Modal ──────────────────────────────── */}
      {activeDestination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
            {/* Header Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={activeDestination.imageUrl}
                alt={activeDestination.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <button
                onClick={() => setActiveDestination(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">
                    {activeDestination.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-300" />
                    {activeDestination.rating.toFixed(1)} ({activeDestination.reviewsCount} reviews)
                  </span>
                </div>
                <h3 className="text-2xl sm:text-4xl font-black">{activeDestination.name}</h3>
                <p className="text-sm text-slate-200 mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  {activeDestination.city}, {activeDestination.state}
                </p>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Quick Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Est. Daily Budget</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{activeDestination.estimatedDailyCost.toLocaleString('en-IN')} / person
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Ideal Stay</span>
                  <span className="text-sm font-bold">{activeDestination.idealDuration}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Best Season</span>
                  <span className="text-sm font-bold">{activeDestination.bestTimeToVisit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Languages Spoken</span>
                  <span className="text-sm font-bold">{activeDestination.localLanguages}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Overview</h4>
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  {activeDestination.description}
                </p>
              </div>

              {/* Attractions */}
              {activeDestination.attractions && activeDestination.attractions.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" /> Key Attractions & Monuments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDestination.attractions.map((att, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{att.name}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {att.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{att.highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eat Local Food Guide */}
              {activeDestination.foodSpecialties && activeDestination.foodSpecialties.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-orange-500" /> "Eat Local" Culinary Specialties
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeDestination.foodSpecialties.map((food, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{food.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${food.isVeg ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {food.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                          {food.isJainFriendly && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                              Jain-friendly
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{food.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Culture & Safety Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/50">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <Info className="h-4 w-4" /> Cultural Etiquette & Customs
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeDestination.culture}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/50">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <ShieldCheck className="h-4 w-4" /> Safety & Helpline Contacts
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeDestination.safetyInformation}
                  </p>
                </div>
              </div>

              {/* 1-Click Generate Itinerary Presets */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-indigo-500/10 to-amber-500/10 border border-primary/20">
                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Generate AI Itinerary for {activeDestination.name}
                </h5>
                <p className="text-xs text-slate-500 mb-4">
                  Select your desired stay length. The AI travel copilot will build an optimized schedule with opening hours and map pins.
                </p>

                <div className="flex flex-wrap gap-3">
                  {['3', '5', '7'].map((days) => (
                    <Button
                      key={days}
                      onClick={() => handlePlanTrip(activeDestination.name, days)}
                      className="bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-semibold px-4 h-9"
                    >
                      Generate {days}-Day Trip
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => handlePlanTrip(activeDestination.name)}
                    className="rounded-xl text-xs font-semibold px-4 h-9"
                  >
                    Custom Duration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. Side-by-Side Destination Comparison Drawer ───────────────── */}
      {showCompareModal && comparedDestinations.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Scale className="h-6 w-6 text-primary" /> Destination Side-by-Side Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Comparing {comparedDestinations.length} destination{comparedDestinations.length > 1 ? 's' : ''} on cost, duration, best season, and travel difficulty
                </p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {comparedDestinations.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={d.imageUrl}
                      alt={d.name}
                      className="w-full h-32 object-cover rounded-xl mb-3"
                    />
                    <h4 className="font-bold text-base truncate">{d.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{d.state}</p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-semibold">{d.category}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Daily Cost:</span>
                        <span className="font-bold text-emerald-600">₹{d.estimatedDailyCost.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Ideal Stay:</span>
                        <span className="font-semibold">{d.idealDuration}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Best Season:</span>
                        <span className="font-semibold text-right">{d.bestTimeToVisit}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-slate-400">Rating:</span>
                        <span className="font-bold text-amber-500">★ {d.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowCompareModal(false);
                        handlePlanTrip(d.name);
                      }}
                      className="w-full text-xs font-semibold rounded-xl h-8"
                    >
                      Plan Trip Here
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 7. India Travel Safety Center Modal ──────────────────────────── */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">India Travel Safety Center</h3>
                  <p className="text-xs text-slate-500">Official emergency helplines & safety guidelines</p>
                </div>
              </div>
              <button onClick={() => setShowSafetyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Emergency Hotline Directory */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { number: '112', title: 'National Emergency', desc: 'All-in-one helpline' },
                { number: '100', title: 'Police Control', desc: 'Direct state police' },
                { number: '108', title: 'Ambulance', desc: 'Medical emergency' },
                { number: '1091', title: 'Women Helpline', desc: '24/7 dedicated support' },
              ].map((h) => (
                <div key={h.number} className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 block">{h.number}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{h.title}</span>
                  <span className="text-[10px] text-slate-500">{h.desc}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Women Solo Travel Tips
                </h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Prefer app-based cabs (Uber/Ola) with live GPS sharing turned on. Choose verified boutique heritage homestays or 3+ star hotels with 24/7 front desk security. Dress modestly covering shoulders and knees when visiting religious shrines.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Scam & Overcharging Awareness
                </h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Always book ASI monument entry tickets directly through the official government portal (asi.payumoney.com). Avoid touts claiming monuments are closed or offering commission silk/gem shops. Pre-fix auto fares or insist on meter/app bookings.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-1.5">
                  <IndianRupee className="h-4 w-4 text-blue-500" /> Cashless Digital Payments (UPI)
                </h5>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  India is virtually 100% UPI cashless. Foreign tourists can obtain UPI One World / prepaid digital wallets at major international airports for instant scanning at street vendors, taxis, and restaurants.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. India Festival Travel Calendar Modal ─────────────────────── */}
      {showFestivalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8 p-6 sm:p-8">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">India Festival Travel Calendar</h3>
                  <p className="text-xs text-slate-500">Plan your journeys around legendary cultural festivals</p>
                </div>
              </div>
              <button onClick={() => setShowFestivalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {festivals.map((fest) => (
                <div
                  key={fest.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col justify-between"
                >
                  <div>
                    {fest.imageUrl && (
                      <img
                        src={fest.imageUrl}
                        alt={fest.name}
                        className="w-full h-32 object-cover rounded-xl mb-3"
                      />
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-base">{fest.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        {fest.celebrationMonth}
                      </span>
                    </div>
                    <p className="text-xs text-primary font-semibold mb-2">{fest.state}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                      {fest.significance}
                    </p>
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Best places:</span> {fest.famousPlaces}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowFestivalModal(false);
                        const firstCity = fest.famousPlaces.split(',')[0].trim();
                        handlePlanTrip(firstCity);
                      }}
                      className="w-full text-xs font-semibold rounded-xl h-8"
                    >
                      Plan Trip to {fest.name.split(' ')[0]}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
