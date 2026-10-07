import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ActivityCard } from '@/components/ActivityCard';
import { TripMap } from '@/components/TripMap';
import { TripBudgetChart } from '@/components/TripBudgetChart';
import { TripPackingWeather } from '@/components/TripPackingWeather';
import { TripLogisticsHub } from '@/components/TripLogisticsHub';
import { TripWeatherForecast } from '@/components/TripWeatherForecast';
import { TripOfflineDossier } from '@/components/TripOfflineDossier';
import { TripCollaboratorsHub } from '@/components/TripCollaboratorsHub';
import { TripCultureGuide } from '@/components/TripCultureGuide';
import { TripJournalHub } from '@/components/TripJournalHub';
import { TripEcoEstimator } from '@/components/TripEcoEstimator';
import { TripAudioGuide } from '@/components/TripAudioGuide';
import { TripJetlagOptimizer } from '@/components/TripJetlagOptimizer';
import { TripLuggageOptimizer } from '@/components/TripLuggageOptimizer';
import { EditTripDialog } from '@/components/EditTripDialog';
import { AddActivityDialog } from '@/components/AddActivityDialog';
import { TripAiConcierge } from '@/components/TripAiConcierge';
import { useToast } from '@/context/ToastContext';
import { exportTripToIcs } from '@/lib/exportCalendar';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import {
  MapPin,
  Calendar,
  Wallet,
  Sparkles,
  ArrowLeft,
  Share2,
  Printer,
  CheckCircle,
  Loader2,
  Compass,
  AlertCircle,
  RefreshCw,
  Trash2,
  Map as MapIcon,
  ListFilter,
  Columns,
  Luggage,
  CalendarDays,
  Plus,
  Plane,
  Sun,
  Users,
  BookOpen,
  Heart,
  Zap,
  Leaf,
  Headphones,
  Clock,
  Edit3,
  Scale,
} from 'lucide-react';

type ViewMode =
  | 'timeline'
  | 'split'
  | 'map'
  | 'logistics'
  | 'weather'
  | 'budget'
  | 'packing'
  | 'luggage'
  | 'collaborators'
  | 'culture'
  | 'journal'
  | 'eco'
  | 'audio'
  | 'jetlag'
  | 'dossier';





const DEFAULT_IMAGES: Record<string, string> = {
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1200&auto=format&fit=crop',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
};

function getHeroImage(destination: string, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  const lower = (destination || '').toLowerCase();
  for (const key of Object.keys(DEFAULT_IMAGES)) {
    if (lower.includes(key)) return DEFAULT_IMAGES[key];
  }
  return DEFAULT_IMAGES.default;
}

export default function TripDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [selectedActivityId, setSelectedActivityId] = useState<string | undefined>();
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [optimizingDayId, setOptimizingDayId] = useState<string | null>(null);


  const [isLoading, setIsLoading] = useState(true);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrip = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.trips.get(id);
      setTrip(res.trip);
      if (res.trip.days && res.trip.days.length > 0) {
        setSelectedDayNumber(1);
      }
    } catch (err: any) {
      console.error('Error fetching trip:', err);
      setError(err.message || 'Trip not found or access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const handleToggleActivity = async (activityId?: string) => {
    if (!trip || !activityId) return;

    // Optimistic UI update
    setTrip((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map((day) => ({
          ...day,
          activities: day.activities.map((act) =>
            act.id === activityId ? { ...act, isCompleted: !act.isCompleted } : act
          ),
        })),
      };
    });

    try {
      await api.trips.toggleActivity(trip.id, activityId);
    } catch (err: any) {
      toast.error('Update failed', err.message);
      fetchTrip();
    }
  };

  const handleAddCustomActivity = async (
    dayId: string,
    activityData: {
      time: string;
      title: string;
      description: string;
      location: string;
      category: string;
    }
  ) => {
    if (!trip) return;
    try {
      const res = await api.trips.addActivity(trip.id, dayId, activityData);
      toast.success('Activity Added', `Added "${activityData.title}" to schedule.`);
      // Update local state
      setTrip((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((day) =>
            day.id === dayId
              ? { ...day, activities: [...day.activities, res.activity] }
              : day
          ),
        };
      });
    } catch (err: any) {
      toast.error('Could not add activity', err.message);
      throw err;
    }
  };

  const handleDeleteActivity = async (activityId?: string) => {
    if (!trip || !activityId) return;
    if (!window.confirm('Remove this activity from your itinerary?')) return;

    try {
      await api.trips.deleteActivity(trip.id, activityId);
      toast.info('Activity Removed', 'The item was deleted from your day plan.');
      setTrip((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          days: prev.days.map((day) => ({
            ...day,
            activities: day.activities.filter((a) => a.id !== activityId),
          })),
        };
      });
    } catch (err: any) {
      toast.error('Failed to remove activity', err.message);
    }
  };

  const handleReorderActivity = async (activityId?: string, direction?: 'up' | 'down') => {
    if (!trip || !activityId || !direction) return;
    try {
      await api.trips.reorderActivity(trip.id, activityId, direction);
      fetchTrip();
    } catch (err: any) {
      toast.error('Reorder Failed', err.message);
    }
  };

  const handleOptimizeDay = async (dayId: string) => {
    if (!trip) return;
    try {
      setOptimizingDayId(dayId);
      const res = await api.trips.optimizeDay(trip.id, dayId);
      toast.success('Schedule Optimized', res.message || 'Activities have been re-timed and re-balanced!');
      fetchTrip();
    } catch (err: any) {
      toast.error('Optimization Failed', err.message || 'Could not optimize schedule.');
    } finally {
      setOptimizingDayId(null);
    }
  };

  const handleRegenerate = async () => {

    if (!trip) return;
    if (!window.confirm('Regenerate itinerary? This will replace current days and activities with a fresh AI schedule.')) {
      return;
    }

    setIsRegenerating(true);
    try {
      const res = await api.trips.generate(trip.id);
      setTrip(res.trip);
      if (res.trip.days && res.trip.days.length > 0) {
        setSelectedDayNumber(1);
      }
      toast.success('Itinerary Regenerated', 'Your fresh travel schedule is ready!');
    } catch (err: any) {
      console.error('Failed to regenerate:', err);
      toast.error('Regeneration error', err.message || 'Could not generate new schedule.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShare = () => {
    if (!trip) return;
    const publicUrl = `${window.location.origin}/share/${trip.id}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success('Public Share Link Copied!', 'Anyone with this link can view your itinerary.');
  };

  const handleExportCalendar = () => {
    if (!trip) return;
    exportTripToIcs(trip);
    toast.success('Calendar Exported', 'Downloaded .ics file. Ready to import into Google or Apple Calendar!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!trip || !window.confirm('Are you sure you want to permanently delete this trip?')) return;
    try {
      await api.trips.delete(trip.id);
      toast.info('Trip Deleted', 'The trip was removed from your account.');
      navigate('/my-trips');
    } catch (err: any) {
      toast.error('Failed to delete trip', err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading your itinerary...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Itinerary Not Found</h2>
        <p className="text-slate-500">{error || 'This trip could not be loaded.'}</p>
        <Link to="/my-trips">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Trips
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate statistics
  const totalActivities = trip.days.reduce((acc, d) => acc + (d.activities?.length || 0), 0);
  const completedActivities = trip.days.reduce(
    (acc, d) => acc + (d.activities?.filter((a) => a.isCompleted).length || 0),
    0
  );
  const completionPercentage =
    totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const daysToRender =
    selectedDayNumber === 'all'
      ? trip.days
      : trip.days.filter((d) => d.dayNumber === selectedDayNumber);

  // Activities to show on map (current active day or all days)
  const mapActivities = daysToRender.flatMap((d) => d.activities);

  const heroImage = getHeroImage(trip.destination, trip.coverImageUrl);

  // Active day object for adding activities
  const activeDay =
    selectedDayNumber === 'all'
      ? trip.days[0]
      : trip.days.find((d) => d.dayNumber === selectedDayNumber) || trip.days[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Action controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/my-trips"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to My Trips
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCalendar}
            className="text-xs h-9 rounded-xl border-slate-200"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
            Export Calendar (.ics)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditTripOpen(true)}
            className="text-xs h-9 rounded-xl border-slate-200 flex items-center gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
          >
            <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
            Edit Trip
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="text-xs h-9 rounded-xl border-slate-200"
          >

            <Share2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Share
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="text-xs h-9 rounded-xl border-slate-200 hidden sm:inline-flex"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Print
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            className="text-xs h-9 rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-200 border-slate-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] sm:min-h-[340px] shadow-xl">
        <img
          src={heroImage}
          alt={trip.destination}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-900/10" />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[300px] sm:min-h-[340px] text-white space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white w-max">
            <MapPin className="h-3.5 w-3.5 text-rose-400" />
            <span>{trip.destination}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white drop-shadow-md">
            {trip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 pt-1">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-indigo-400" />
              {trip.durationDays} Days Itinerary
            </span>
            <span className="flex items-center capitalize">
              <Wallet className="h-4 w-4 mr-1.5 text-emerald-400" />
              {trip.budgetLevel} Budget
            </span>
            {trip.interests && (
              <span className="flex items-center">
                <Compass className="h-4 w-4 mr-1.5 text-amber-400" />
                {trip.interests}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress & Quick Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-500" /> Itinerary Progress
            </span>
            <span>
              {completedActivities} / {totalActivities} Completed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddActivityOpen(true)}
            className="rounded-xl h-10 text-xs font-semibold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5 text-primary" /> Add Activity
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="rounded-xl h-10 text-xs font-semibold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
            />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
      </div>

      {/* Main View Mode Selector Pills */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'timeline'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" /> Timeline
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all hidden md:flex ${
              viewMode === 'split'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Columns className="w-3.5 h-3.5" /> Split (Map + List)
          </button>

          <button
            onClick={() => setViewMode('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'map'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Interactive Map
          </button>

          <button
            onClick={() => setViewMode('logistics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'logistics'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plane className="w-3.5 h-3.5" /> Flights & Stays
          </button>

          <button
            onClick={() => setViewMode('weather')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'weather'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Live Weather
          </button>

          <button
            onClick={() => setViewMode('budget')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'budget'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Budget & Expenses
          </button>

          <button
            onClick={() => setViewMode('packing')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'packing'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Luggage className="w-3.5 h-3.5" /> Packing & Climate
          </button>

          <button
            onClick={() => setViewMode('luggage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'luggage'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" /> Luggage Weight
          </button>

          <button
            onClick={() => setViewMode('collaborators')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'collaborators'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Companions
          </button>


          <button
            onClick={() => setViewMode('culture')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'culture'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Culture Guide
          </button>

          <button
            onClick={() => setViewMode('journal')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'journal'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Memories & Journal
          </button>

          <button
            onClick={() => setViewMode('eco')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'eco'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-500" /> Eco & Carbon
          </button>

          <button
            onClick={() => setViewMode('audio')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'audio'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-purple-400" /> Audio Tour
          </button>

          <button
            onClick={() => setViewMode('jetlag')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'jetlag'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Jetlag & Timezone
          </button>

          <button
            onClick={() => setViewMode('dossier')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'dossier'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-3.5 h-3.5" /> Print Dossier
          </button>
        </div>
      </div>

      {/* VIEW: COMPANIONS & COLLABORATION */}
      {viewMode === 'collaborators' && (
        <TripCollaboratorsHub
          tripId={trip.id}
          owner={trip.user}
          initialCollaborators={trip.collaborators || []}
          totalBudget={trip.durationDays * (trip.budgetLevel === 'luxury' ? 650 : trip.budgetLevel === 'budget' ? 85 : 230)}
          onUpdated={fetchTrip}
        />
      )}

      {/* VIEW: MEMORIES & JOURNAL */}
      {viewMode === 'journal' && (
        <TripJournalHub
          trip={trip}
          onTripUpdated={fetchTrip}
        />
      )}

      {/* VIEW: ECO & CARBON FOOTPRINT */}
      {viewMode === 'eco' && (
        <TripEcoEstimator trip={trip} />
      )}

      {/* VIEW: AUDIO TOUR GUIDE */}
      {viewMode === 'audio' && (
        <TripAudioGuide tripId={trip.id} destination={trip.destination} />
      )}

      {/* VIEW: JETLAG & TIMEZONE */}
      {viewMode === 'jetlag' && (
        <TripJetlagOptimizer trip={trip} />
      )}




      {/* VIEW: DESTINATION CULTURE & INSIDER GUIDE */}
      {viewMode === 'culture' && (
        <TripCultureGuide
          tripId={trip.id}
          destination={trip.destination}
        />
      )}

      {/* VIEW: LOGISTICS (FLIGHTS & STAYS) */}
      {viewMode === 'logistics' && (
        <TripLogisticsHub
          tripId={trip.id}
          initialBookings={trip.bookings || []}
          onBookingsUpdated={fetchTrip}
        />
      )}

      {/* VIEW: LIVE SATELLITE WEATHER */}
      {viewMode === 'weather' && (
        <TripWeatherForecast
          tripId={trip.id}
          destination={trip.destination}
        />
      )}

      {/* VIEW: PRINT / OFFLINE DOSSIER */}
      {viewMode === 'dossier' && (
        <TripOfflineDossier trip={trip} />
      )}

      {/* VIEW 1: BUDGET & ANALYTICS */}
      {viewMode === 'budget' && (
        <TripBudgetChart
          tripId={trip.id}
          budgetLevel={trip.budgetLevel}
          durationDays={trip.durationDays}
          destination={trip.destination}
        />
      )}

      {/* VIEW 2: PACKING & CLIMATE */}
      {viewMode === 'packing' && (
        <TripPackingWeather
          tripId={trip.id}
          destination={trip.destination}
          durationDays={trip.durationDays}
        />
      )}

      {/* VIEW: LUGGAGE WEIGHT & AIRLINE ALLOWANCE */}
      {viewMode === 'luggage' && (
        <TripLuggageOptimizer trip={trip} />
      )}


      {/* VIEW 3: FULL MAP */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          {/* Day selection tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDayNumber('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDayNumber === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Days ({trip.days.length})
            </button>
            {trip.days.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDayNumber(day.dayNumber)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDayNumber === day.dayNumber
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>

          <div className="h-[600px] w-full">
            <TripMap
              activities={mapActivities}
              destination={trip.destination}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
            />
          </div>
        </div>
      )}

      {/* VIEW 4: SPLIT VIEW (TIMELINE + MAP SIDE-BY-SIDE) */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDayNumber('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDayNumber === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Days
              </button>
              {trip.days.map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDayNumber === day.dayNumber
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Day {day.dayNumber}
                </button>
              ))}
            </div>

            <div className="space-y-8 max-h-[680px] overflow-y-auto pr-2">
              {daysToRender.map((day) => (
                <div key={day.id || day.dayNumber} className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      Day {day.dayNumber}: {day.summary || 'Daily Schedule'}
                    </h3>
                    <button
                      onClick={() => handleOptimizeDay(day.id)}
                      disabled={optimizingDayId === day.id}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50"
                      title="AI Optimize Schedule: Re-balance activities with realistic timing buffers"
                    >
                      <Zap className={`w-3 h-3 ${optimizingDayId === day.id ? 'animate-spin' : ''}`} />
                      {optimizingDayId === day.id ? 'Optimizing...' : 'AI Optimize'}
                    </button>
                  </div>
                  <div className="space-y-3">

                    {day.activities.map((activity, actIdx) => (
                      <ActivityCard
                        key={activity.id}
                        id={activity.id}
                        time={activity.time}
                        title={activity.title}
                        description={activity.description}
                        location={activity.location}
                        category={activity.category}
                        latitude={activity.latitude}
                        longitude={activity.longitude}
                        isCompleted={activity.isCompleted}
                        canMoveUp={actIdx > 0}
                        canMoveDown={actIdx < day.activities.length - 1}
                        onMoveUp={(id) => handleReorderActivity(id, 'up')}
                        onMoveDown={(id) => handleReorderActivity(id, 'down')}
                        onToggleComplete={handleToggleActivity}
                        onDeleteActivity={handleDeleteActivity}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Map */}
          <div className="lg:sticky lg:top-24 h-[650px] w-full">
            <TripMap
              activities={mapActivities}
              destination={trip.destination}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
            />
          </div>
        </div>
      )}

      {/* VIEW 5: TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="space-y-8">
          {/* Day selection tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedDayNumber('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                selectedDayNumber === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Days ({trip.days.length})
            </button>
            {trip.days.map((day) => (
              <button
                key={day.dayNumber}
                onClick={() => setSelectedDayNumber(day.dayNumber)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedDayNumber === day.dayNumber
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Days content */}
          {trip.days.length > 0 ? (
            <div className="space-y-12">
              {daysToRender.map((day) => (
                <div key={day.id || day.dayNumber} className="space-y-4">
                  <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Day {day.dayNumber}
                      </h2>
                      {day.summary && (
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                          {day.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOptimizeDay(day.id)}
                        disabled={optimizingDayId === day.id}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                        title="AI Optimize Schedule: Re-balance activities with realistic timing buffers"
                      >
                        <Zap className={`w-3.5 h-3.5 ${optimizingDayId === day.id ? 'animate-spin' : ''}`} />
                        {optimizingDayId === day.id ? 'Optimizing...' : 'AI Optimize Schedule'}
                      </button>
                      <span className="text-xs text-slate-400">
                        {day.activities.length} activities planned
                      </span>
                    </div>
                  </div>


                  <div className="space-y-3.5">
                    {day.activities.map((activity, actIdx) => (
                      <ActivityCard
                        key={activity.id}
                        id={activity.id}
                        time={activity.time}
                        title={activity.title}
                        description={activity.description}
                        location={activity.location}
                        category={activity.category}
                        latitude={activity.latitude}
                        longitude={activity.longitude}
                        isCompleted={activity.isCompleted}
                        canMoveUp={actIdx > 0}
                        canMoveDown={actIdx < day.activities.length - 1}
                        onMoveUp={(id) => handleReorderActivity(id, 'up')}
                        onMoveDown={(id) => handleReorderActivity(id, 'down')}
                        onToggleComplete={handleToggleActivity}
                        onDeleteActivity={handleDeleteActivity}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-4">
              <Sparkles className="w-10 h-10 text-primary mx-auto animate-pulse" />
              <h3 className="text-xl font-bold text-slate-900">No Itinerary Generated Yet</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Click the button below to generate your custom AI travel activities for this trip.
              </p>
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="rounded-xl shadow-md"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isRegenerating ? 'Generating...' : 'Generate Itinerary Now'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Custom Activity Modal */}
      <AddActivityDialog
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        days={trip.days}
        selectedDayId={activeDay?.id}
        onAddActivity={handleAddCustomActivity}
      />

      {/* Floating AI Travel Concierge Copilot */}
      <TripAiConcierge tripId={trip.id} destination={trip.destination} />

      {/* Edit Trip Information Dialog */}
      <EditTripDialog
        isOpen={isEditTripOpen}
        onClose={() => setIsEditTripOpen(false)}
        trip={trip}
        onTripUpdated={fetchTrip}
      />
    </div>
  );
}

