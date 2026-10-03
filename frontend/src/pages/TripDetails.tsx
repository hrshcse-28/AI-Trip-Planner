import { Button } from '@/components/ui/button';
import { ActivityCard } from '@/components/ActivityCard';
import { MapPin, Calendar, Users, Share2, Download, Pencil } from 'lucide-react';

export default function TripDetails() {
  const itinerary = [
    {
      time: "09:00 AM",
      title: "Breakfast at Café de Flore",
      description: "Enjoy a classic Parisian breakfast at one of the oldest coffeehouses in Paris. Known for its famous clientele in the past.",
      location: "172 Bd Saint-Germain, 75006 Paris",
      isCompleted: true
    },
    {
      time: "10:30 AM",
      title: "Louvre Museum Tour",
      description: "Guided tour of the world's largest art museum. See the Mona Lisa, Venus de Milo, and Winged Victory.",
      location: "Rue de Rivoli, 75001 Paris",
      isCompleted: false
    },
    {
      time: "01:30 PM",
      title: "Lunch near Tuileries Garden",
      description: "Quick lunch break at a local brasserie before strolling through the beautiful gardens.",
      location: "Tuileries Garden, 75001 Paris",
      isCompleted: false
    },
    {
      time: "04:00 PM",
      title: "Eiffel Tower Visit",
      description: "Take the elevator to the summit for breathtaking panoramic views of the city.",
      location: "Champ de Mars, 5 Av. Anatole France",
      isCompleted: false
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header section */}
      <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 mb-8">
        <img 
          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop" 
          alt="Paris" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-3">
                <MapPin className="h-4 w-4 mr-2" /> Paris, France
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">Summer in Paris</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm md:text-base">
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-2" /> Jul 10 - Jul 18, 2026</span>
                <span className="flex items-center"><Users className="h-4 w-4 mr-2" /> 2 Travelers</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Day 1 Itinerary</h2>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" /> Edit Day
        </Button>
      </div>

      <div className="space-y-4">
        {itinerary.map((item, index) => (
          <ActivityCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
