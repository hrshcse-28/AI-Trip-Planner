import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface DestinationCardProps {
  name: string;
  country: string;
  imageUrl: string;
}

export function DestinationCard({ name, country, imageUrl }: DestinationCardProps) {
  return (
    <Card className="relative overflow-hidden group h-64 border-0">
      <img 
        src={imageUrl} 
        alt={name} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="text-white font-bold text-2xl mb-1">{name}</h3>
        <p className="text-slate-300 text-sm mb-4">{country}</p>
        <Link to="/create-trip">
          <Button size="sm" variant="secondary" className="w-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            Plan Trip Here
          </Button>
        </Link>
      </div>
    </Card>
  );
}
