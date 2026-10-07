import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TripCardProps {
  id: string;
  title: string;
  destination: string;
  dateRange?: string;
  durationDays?: number;
  imageUrl?: string | null;
  status?: string;
  onDelete?: (id: string) => void;
}

const DEFAULT_IMAGES: Record<string, string> = {
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=800&auto=format&fit=crop',
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=800&auto=format&fit=crop',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop',
};

function getTripImage(destination: string, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  const lower = destination.toLowerCase();
  for (const key of Object.keys(DEFAULT_IMAGES)) {
    if (lower.includes(key)) return DEFAULT_IMAGES[key];
  }
  return DEFAULT_IMAGES.default;
}

export function TripCard({
  id,
  title,
  destination,
  dateRange,
  durationDays,
  imageUrl,
  status = 'generated',
  onDelete,
}: TripCardProps) {
  const displayImage = getTripImage(destination, imageUrl);

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
          <img
            src={displayImage}
            alt={destination}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
                status === 'generated'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}
            >
              {status === 'generated' ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Ready
                </>
              ) : (
                'Draft'
              )}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(id);
                }}
                className="p-1.5 rounded-full bg-slate-900/60 text-white/80 hover:text-rose-400 hover:bg-slate-900/90 backdrop-blur-md transition-colors"
                title="Delete Trip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h3 className="font-bold text-lg sm:text-xl line-clamp-1 drop-shadow-sm">
              {title}
            </h3>
          </div>
        </div>

        <CardContent className="p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center text-slate-600 text-sm font-medium">
            <MapPin className="h-4 w-4 mr-2 text-rose-500 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
          <div className="flex items-center text-slate-500 text-xs">
            <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400 shrink-0" />
            <span>
              {dateRange || (durationDays ? `${durationDays} Days Itinerary` : 'Flexible Dates')}
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-4 sm:p-5 pt-0">
        <Link to={`/trip/${id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-200 justify-between font-medium"
          >
            <span>View Itinerary</span>
            <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
