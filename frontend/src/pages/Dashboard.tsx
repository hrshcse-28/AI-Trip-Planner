import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TripCard } from '@/components/TripCard';
import { Plus, Compass, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Trip } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await api.trips.list();
        setTrips(data.trips || []);
      } catch (err) {
        console.error('Failed to fetch trips:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const totalDays = trips.reduce((acc, t) => acc + (t.durationDays || 0), 0);
  const completedActivities = trips.reduce(
    (acc, t) =>
      acc +
      (t.days?.reduce(
        (dayAcc, d) => dayAcc + (d.activities?.filter((a) => a.isCompleted).length || 0),
        0
      ) || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Explorer Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Traveler'}!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg">
            Where to next? Ready to generate another dream itinerary or continue exploring your upcoming journeys?
          </p>
        </div>

        <div className="relative z-10">
          <Link to="/create-trip">
            <Button size="lg" className="rounded-2xl px-6 font-semibold shadow-lg shadow-primary/30 flex items-center gap-2">
              <Plus className="h-5 w-5" /> Plan New Trip
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{trips.length}</div>
            <div className="text-xs font-medium text-slate-500">Planned Itineraries</div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalDays}</div>
            <div className="text-xs font-medium text-slate-500">Total Travel Days</div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{completedActivities}</div>
            <div className="text-xs font-medium text-slate-500">Activities Checked Off</div>
          </div>
        </div>
      </div>

      {/* Recent Trips Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Recent Trips</h2>
          {trips.length > 0 && (
            <Link
              to="/my-trips"
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
            >
              View all ({trips.length}) <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-44 bg-slate-200 rounded-xl" />
                <div className="space-y-2 py-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-9 bg-slate-200 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.slice(0, 3).map((trip) => (
              <TripCard
                key={trip.id}
                id={trip.id}
                title={trip.title}
                destination={trip.destination}
                durationDays={trip.durationDays}
                status={trip.status}
                imageUrl={trip.coverImageUrl}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
            <Compass className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No trips yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              You haven't planned any trips yet. Generate your first AI-crafted adventure in under a minute!
            </p>
            <Link to="/create-trip">
              <Button className="rounded-xl shadow-md">
                <Plus className="mr-2 h-4 w-4" /> Plan a Trip Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
