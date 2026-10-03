import { Button } from '@/components/ui/button';
import { TripCard } from '@/components/TripCard';
import { DestinationCard } from '@/components/DestinationCard';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const upcomingTrips = [
    {
      id: "1",
      title: "Summer in Paris",
      destination: "Paris, France",
      dateRange: "Jul 10 - Jul 18, 2026",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop"
    }
  ];

  const popularDestinations = [
    {
      name: "Kyoto",
      country: "Japan",
      imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop"
    },
    {
      name: "Santorini",
      country: "Greece",
      imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "Machu Picchu",
      country: "Peru",
      imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2076&auto=format&fit=crop"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Traveler!</h1>
          <p className="text-slate-500 mt-1">Ready for your next adventure?</p>
        </div>
        <Link to="/create-trip">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Your Upcoming Trips</h2>
          <Link to="/my-trips" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        
        {upcomingTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.map(trip => (
              <TripCard key={trip.id} {...trip} />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-500 mb-4">You have no upcoming trips.</p>
            <Link to="/create-trip">
              <Button variant="outline">Plan a Trip Now</Button>
            </Link>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Inspiration for your next trip</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDestinations.map(dest => (
            <DestinationCard key={dest.name} {...dest} />
          ))}
        </div>
      </div>
    </div>
  );
}
