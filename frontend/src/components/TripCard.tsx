import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  dateRange: string;
  imageUrl: string;
}

export function TripCard({ id, title, destination, dateRange, imageUrl }: TripCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow border-slate-200">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={destination} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl">{title}</h3>
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center text-slate-500 text-sm">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{destination}</span>
        </div>
        <div className="flex items-center text-slate-500 text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{dateRange}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/trip/${id}`} className="w-full">
          <Button variant="outline" className="w-full font-medium">View Itinerary</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
