import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowRight,
  Compass,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Headphones,
  Map,
  Sun,
  Printer,
  ChevronDown,
  Star,
  Search,
  Gem,
} from 'lucide-react';

const TRENDING_INDIA_DESTINATIONS = [
  {
    name: 'Jaipur & Amer',
    state: 'Rajasthan',
    image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=800&auto=format&fit=crop',
    tag: 'Royal Palaces & Forts',
    days: '4 Days',
    budget: '₹2,600/day',
    rating: 4.8,
  },
  {
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=800&auto=format&fit=crop',
    tag: 'Sacred Ganges Ghats',
    days: '3 Days',
    budget: '₹1,600/day',
    rating: 4.8,
  },
  {
    name: 'Goa Coastal',
    state: 'Goa',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
    tag: 'Beaches & Shacks',
    days: '5 Days',
    budget: '₹2,800/day',
    rating: 4.8,
  },
  {
    name: 'Munnar & Alleppey',
    state: 'Kerala',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=800&auto=format&fit=crop',
    tag: 'Backwaters & Tea Hills',
    days: '5 Days',
    budget: '₹2,600/day',
    rating: 4.9,
  },
  {
    name: 'Manali & Rohtang',
    state: 'Himachal Pradesh',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
    tag: 'Himalayan Snow Peaks',
    days: '6 Days',
    budget: '₹2,000/day',
    rating: 4.8,
  },
  {
    name: 'Amritsar',
    state: 'Punjab',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=800&auto=format&fit=crop',
    tag: 'Golden Temple & Food',
    days: '3 Days',
    budget: '₹1,800/day',
    rating: 4.9,
  },
];

const HIDDEN_GEMS = [
  {
    name: 'Ziro Valley & Apatani Pine Groves',
    state: 'Arunachal Pradesh',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=800&auto=format&fit=crop',
    tag: 'Untouched Valley',
    cost: '₹2,400/day',
  },
  {
    name: 'Chitrakote Horseshoe Falls',
    state: 'Chhattisgarh',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop',
    tag: 'Niagara of India',
    cost: '₹1,500/day',
  },
  {
    name: 'Dzukou Valley Rolling Meadows',
    state: 'Nagaland',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    tag: 'Rare Pink Lilies',
    cost: '₹2,300/day',
  },
  {
    name: 'Agatti & Bangaram Coral Atolls',
    state: 'Lakshadweep',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
    tag: 'Turquoise Lagoons',
    cost: '₹4,500/day',
  },
];

const FAQS = [
  {
    q: 'How does the AI itinerary generation work?',
    a: 'Our intelligence engine uses Google Gemini 2.0 Flash to synthesize geographic clustering, opening hours, local dining hotspots (veg/non-veg/Jain), and transit buffers into day-by-day itineraries tailored to your style and budget in Indian Rupees (₹).',
  },
  {
    q: 'Can I search trips using natural language prompts?',
    a: 'Yes! Simply type prompts like "5 days in Kerala under ₹30,000" or "Romantic weekend in Goa" or "Spiritual journey in Uttar Pradesh". Our NLP engine extracts the destination, duration, budget tier, and travel style automatically.',
  },
  {
    q: 'Does AI Trip Planner cover all Indian states and Union Territories?',
    a: 'Yes. Our platform includes curated, authentic destination profiles for all 28 States and all 8 Union Territories with verified attractions, food specialties, and official 112 emergency helpline contacts.',
  },
  {
    q: 'Can I customize, reorder, and reduce budget on my trip?',
    a: 'Absolutely! You can drag to reorder activities, add custom venues, run the 1-click AI Day Schedule Optimizer, and ask our smart budget planner to "Make this trip ₹5,000 cheaper".',
  },
  {
    q: 'Is my itinerary accessible offline during my journey?',
    a: 'Yes. The Print-Ready Offline Dossier tab lets you save or print a clean PDF containing your day-wise schedules, hotel PNR bookings, emergency helplines, and daily travel notes.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleNaturalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalPrompt.trim()) {
      navigate('/explore-india');
      return;
    }
    navigate(`/create-trip?nlp=${encodeURIComponent(naturalPrompt.trim())}`);
  };

  const handleSurpriseMe = () => {
    const surpriseList = [
      'Udaipur, Rajasthan',
      'Munnar, Kerala',
      'Rishikesh, Uttarakhand',
      'Hampi, Karnataka',
      'Leh, Ladakh',
      'Shillong, Meghalaya',
    ];
    const picked = surpriseList[Math.floor(Math.random() * surpriseList.length)];
    navigate(`/create-trip?destination=${encodeURIComponent(picked)}&duration=4`);
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop"
            alt="Incredible India background"
            className="w-full h-full object-cover opacity-25 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-semibold mb-6 border border-amber-500/30 backdrop-blur-md">
            <Sparkles className="h-4 w-4" /> AI Trip Planner — India Travel Discovery Platform
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4">
            Where will AI <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400">
              take you?
            </span>
          </h1>

          <p className="mt-2 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Turn your travel desires into realistic, day-by-day itineraries across all 28 States and 8 Union Territories.
          </p>

          {/* Natural Language Prompt Search Bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <form onSubmit={handleNaturalSubmit} className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-xl">
              <Search className="h-5 w-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Describe your dream trip, e.g. 5 days in Kerala under ₹30,000..."
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                className="w-full px-4 py-4 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium"
              />
              <Button
                type="submit"
                className="mr-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl px-5 h-11 shadow-lg text-xs sm:text-sm shrink-0"
              >
                Plan My Trip
              </Button>
            </form>

            {/* Natural language chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-300">
              <span className="text-slate-400">Try prompts:</span>
              {[
                '5 days in Kerala under ₹30,000',
                'Weekend trip from Delhi to Himachal',
                'Spiritual journey through Uttar Pradesh',
                'Romantic 4 day Goa trip',
              ].map((pText) => (
                <button
                  key={pText}
                  type="button"
                  onClick={() => setNaturalPrompt(pText)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
                >
                  "{pText}"
                </button>
              ))}
            </div>
          </div>

          {/* Core Action CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center items-center mt-6">
            <Link to={isAuthenticated ? '/create-trip' : '/register'}>
              <Button size="lg" className="text-base px-8 h-12 rounded-2xl shadow-xl shadow-primary/30 font-semibold">
                Plan My Trip <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            <Link to="/explore-india">
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 h-12 rounded-2xl bg-white/10 border-white/20 hover:bg-white/20 text-white font-medium backdrop-blur-md"
              >
                <Compass className="mr-2 h-5 w-5 text-amber-400" /> Explore India (36 Regions)
              </Button>
            </Link>

            <Button
              size="lg"
              variant="outline"
              onClick={handleSurpriseMe}
              className="text-base px-6 h-12 rounded-2xl bg-amber-500/20 border-amber-400/30 hover:bg-amber-500/30 text-amber-300 font-semibold backdrop-blur-md"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Surprise Me!
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. Trending Destinations in India ────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">
              Trending Right Now
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Popular India Destinations
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mt-1">
              Top curated places travelers are exploring this week across heritage, spirituality, and beaches.
            </p>
          </div>

          <Link to="/explore-india">
            <Button variant="outline" size="sm" className="rounded-xl font-semibold">
              View All 36 Regions <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRENDING_INDIA_DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                    {dest.tag}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-300" />
                    {dest.rating}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-xl font-bold truncate">{dest.name}</h4>
                  <p className="text-xs text-slate-200 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-amber-400" /> {dest.state}
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-400 block">Est. Cost:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{dest.budget}</span>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate(`/create-trip?destination=${encodeURIComponent(dest.name)}&duration=${dest.days.split(' ')[0]}`)}
                  className="rounded-xl font-semibold text-xs h-8"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Plan Trip
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Hidden Gems Spotlight ─────────────────────────────────────── */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Gem className="h-4 w-4" /> Off The Beaten Path
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                Curated Hidden Gems of India
              </h2>
            </div>

            <Link to="/explore-india">
              <Button variant="ghost" size="sm" className="text-primary font-semibold">
                Explore More Gems →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HIDDEN_GEMS.map((gem) => (
              <div
                key={gem.name}
                className="group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={gem.image}
                    alt={gem.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{gem.tag}</span>
                    <h5 className="font-bold text-sm truncate">{gem.name}</h5>
                    <p className="text-[11px] text-slate-300">{gem.state}</p>
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{gem.cost}</span>
                  <button
                    onClick={() => navigate(`/create-trip?destination=${encodeURIComponent(gem.name)}&duration=4`)}
                    className="font-bold text-primary hover:underline"
                  >
                    Build Plan →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. 6 Powerhouse Intelligence Tools ──────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">
            Integrated Travel Operating System
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Engineered for Modern Indian Travel
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            From smart INR budget management and Indian railway/auto-rickshaw logistics to live satellite weather and voice audio guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Map className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">Interactive Route Maps</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Day-by-day numbered pins with sequential travel polylines. Never backtrack across town unnecessarily.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
              <IndianRupee className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">Smart INR Budget Planner</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Track daily expenses in Rupees, get 1-click suggestions to "Make this trip ₹5,000 cheaper", and split bills with co-travelers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4">
              <Headphones className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">AI Landmark Audio Tours</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Listen to hands-free voice narration with animated audio waveforms and trivia chapters as you walk historical monuments.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-4">
              <Sun className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">Weather Intelligence Radar</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Live Open-Meteo satellite weather radar, UV index forecasts, and dynamic advisories for monsoons and heat waves.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">Travel Safety & 112 Center</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Emergency contacts directory, solo female safety tips, scam alerts, and hospital references across all regions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base mb-1.5">Printable Offline Travel Dossier</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Paper-optimized offline travel dossier ready for flights or remote valleys with zero cell coverage.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. FAQs ──────────────────────────────────────────────────────── */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold">Frequently Asked Questions</h3>
          <p className="text-xs text-slate-500 mt-1">Everything you need to know about planning trips with our AI platform</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left font-semibold text-sm flex items-center justify-between text-slate-900 dark:text-slate-100"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
