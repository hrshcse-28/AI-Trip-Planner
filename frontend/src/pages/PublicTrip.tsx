import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ActivityCard } from '@/components/ActivityCard';
import { TripMap } from '@/components/TripMap';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { exportTripToIcs } from '@/lib/exportCalendar';
import { api } from '@/lib/api';
import { Trip } from '@/types';
import {
  MapPin,
  Calendar,
  Wallet,
  Sparkles,
  Share2,
  Copy,
  CalendarDays,
  Loader2,
  AlertCircle,
  Compass,
  ArrowRight,
  Plane,
} from 'lucide-react';

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

export default function PublicTrip() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');
  const [isLoading, setIsLoading] = useState(true);
  const [isForking, setIsForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    api.trips
      .getPublic(id)
      .then((res) => {
        setTrip(res.trip);
        if (res.trip.days && res.trip.days.length > 0) {
          setSelectedDayNumber(1);
        }
      })
      .catch((err) => {
        setError(err.message || 'Shared trip not found.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleForkTrip = async () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/share/' + id);
      return;
    }
    if (!trip) return;

    setIsForking(true);
    try {
      const res = await api.trips.fork(trip.id);
      toast.success('Trip Cloned!', 'Saved a personal copy into your account.');
      navigate(`/trip/${res.trip.id}`);
    } catch (err: any) {
      toast.error('Could not clone trip', err.message);
    } finally {
      setIsForking(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link Copied!', 'Public itinerary link copied to clipboard.');
  };

  const handleExportCalendar = () => {
    if (!trip) return;
    exportTripToIcs(trip);
    toast.success('Calendar Exported', 'Downloaded .ics file for calendar apps.');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading shared itinerary...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Shared Trip Not Found</h2>
        <p className="text-slate-500">{error || 'This link may have expired or been removed.'}</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            Explore AI Trip Planner
          </Button>
        </Link>
      </div>
    );
  }

  const daysToRender =
    selectedDayNumber === 'all'
      ? trip.days
      : trip.days.filter((d: any) => d.dayNumber === selectedDayNumber);

  const heroImage = getHeroImage(trip.destination, trip.coverImageUrl);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Public Banner */}
      <div className="bg-indigo-50 border border-indigo-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-indigo-950 font-medium">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Shared Itinerary created by{' '}
            <strong className="font-bold">{trip.user?.name || 'A traveler'}</strong> on AI Trip Planner
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleForkTrip}
            disabled={isForking}
            className="rounded-xl h-9 text-xs font-semibold shadow-sm"
          >
            {isForking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            Clone to My Trips
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            className="rounded-xl h-9 text-xs"
          >
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden min-h-[300px] shadow-xl">
        <img
          src={heroImage}
          alt={trip.destination}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-900/10" />

        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[300px] text-white space-y-3">
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

      {/* Bookings / Logistics Preview if present */}
      {trip.bookings && trip.bookings.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-600" />
              Confirmed Stays & Travel Logistics
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {trip.bookings.length} reservations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {trip.bookings.map((booking: any) => (
              <div
                key={booking.id}
                className="bg-white border border-slate-200/60 rounded-xl p-3.5 flex items-start gap-3 shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Plane className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {booking.title}
                    </span>
                    {booking.confirmationNo && (
                      <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {booking.confirmationNo}
                      </span>
                    )}
                  </div>
                  {booking.dateTime && (
                    <div className="text-[11px] text-slate-500 mt-0.5">{booking.dateTime}</div>
                  )}
                  {booking.location && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {booking.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDayNumber('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDayNumber === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Days ({trip.days.length})
          </button>
          {trip.days.map((day: any) => (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDayNumber(day.dayNumber)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDayNumber === day.dayNumber
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'timeline' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Map Route
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCalendar}
            className="text-xs rounded-xl hidden sm:inline-flex"
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            Export (.ics)
          </Button>
        </div>
      </div>

      {/* Content: Map or Timeline */}
      {viewMode === 'map' ? (
        <div className="h-[550px] w-full rounded-2xl overflow-hidden shadow-sm">
          <TripMap
            destination={trip.destination}
            activities={daysToRender.flatMap((d) => d.activities)}
          />
        </div>
      ) : (
        /* Days & Activities */
        <div className="space-y-10">
        {daysToRender.map((day: any) => (
          <div key={day.id || day.dayNumber} className="space-y-4">
            <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
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
              <span className="text-xs text-slate-400">
                {day.activities.length} activities planned
              </span>
            </div>

            <div className="space-y-3.5">
              {day.activities.map((activity: any) => (
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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Bottom CTA for public viewers */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-center space-y-4">
        <Sparkles className="w-8 h-8 text-primary mx-auto" />
        <h3 className="text-2xl font-bold">Want to plan your own dream adventure?</h3>
        <p className="text-slate-300 text-sm max-w-md mx-auto">
          AI Trip Planner designs bespoke, day-by-day itineraries tailored to any destination, budget, and travel passion in seconds.
        </p>
        <Link to="/register">
          <Button size="lg" className="rounded-2xl px-6 font-semibold shadow-lg">
            Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
