import { useState, useEffect, useMemo } from 'react';
import { TripCard } from '@/components/TripCard';
import { Button } from '@/components/ui/button';
import { Plus, Compass, AlertCircle, Search, MapPin } from 'lucide-react';

import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Trip } from '@/types';

export default function MyTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.trips.list();
      setTrips(res.trips || []);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      setError(err.message || 'Failed to load your trips.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to delete this trip itinerary?')) {
      return;
    }

    try {
      await api.trips.delete(tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch (err: any) {
      console.error('Failed to delete trip:', err);
      alert(err.message || 'Could not delete trip.');
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.interests && t.interests.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trips, searchQuery, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Trips</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Explore, manage, and revisit all your personalized AI travel plans
          </p>
        </div>
        <Link to="/create-trip">
          <Button className="flex items-center gap-2 shadow-sm rounded-xl px-5">
            <Plus className="h-4 w-4" /> Plan New Trip
          </Button>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      {trips.length > 0 && (
        <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by destination or trip name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              {(['all', 'published', 'draft'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-semibold ml-2">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTrips} className="border-rose-300">
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
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
      ) : trips.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No trips planned yet</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">
            Ready to discover something extraordinary? Pick a destination and let AI build your custom day-by-day plan.
          </p>
          <Link to="/create-trip">
            <Button size="lg" className="rounded-xl shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Create Your First Trip
            </Button>
          </Link>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-200">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No matching trips found</h3>
          <p className="text-xs text-slate-500 mt-1">Try searching for a different keyword or reset filters.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-3 text-xs"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              id={trip.id}
              title={trip.title}
              destination={trip.destination}
              durationDays={trip.durationDays}
              status={trip.status}
              imageUrl={trip.coverImageUrl}
              onDelete={handleDeleteTrip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
