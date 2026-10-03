import { TripCard } from '@/components/TripCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyTrips() {
  const allTrips = [
    {
      id: "1",
      title: "Summer in Paris",
      destination: "Paris, France",
      dateRange: "Jul 10 - Jul 18, 2026",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop"
    },
    {
      id: "2",
      title: "Tokyo Tech Tour",
      destination: "Tokyo, Japan",
      dateRange: "Sep 05 - Sep 15, 2026",
      imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1974&auto=format&fit=crop"
    },
    {
      id: "3",
      title: "Swiss Alps Retreat",
      destination: "Zermatt, Switzerland",
      dateRange: "Dec 20 - Dec 28, 2026",
      imageUrl: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Trips</h1>
          <p className="text-slate-500 mt-1">Manage and view all your planned adventures</p>
        </div>
        <Link to="/create-trip">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTrips.map(trip => (
          <TripCard key={trip.id} {...trip} />
        ))}
      </div>
    </div>
  );
}
