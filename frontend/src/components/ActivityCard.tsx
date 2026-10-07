import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Utensils,
  Camera,
  Compass,
  Bus,
  ShoppingBag,
  Palmtree,
  Moon,
  ExternalLink,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ActivityCardProps {
  id?: string;
  time: string;
  title: string;
  description: string;
  location: string;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isCompleted?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: (id?: string) => void;
  onMoveDown?: (id?: string) => void;
  onToggleComplete?: (id?: string) => void;
  onDeleteActivity?: (id?: string) => void;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string }
> = {
  food: {
    label: 'Food & Dining',
    icon: Utensils,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  sightseeing: {
    label: 'Sightseeing',
    icon: Camera,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  culture: {
    label: 'Culture & Arts',
    icon: Compass,
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-200',
  },
  transport: {
    label: 'Transit',
    icon: Bus,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    color: 'text-pink-600',
    bg: 'bg-pink-50 border-pink-200',
  },
  nature: {
    label: 'Nature & Outdoor',
    icon: Palmtree,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
  },
  nightlife: {
    label: 'Nightlife',
    icon: Moon,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
};

export function ActivityCard({
  id,
  time,
  title,
  description,
  location,
  category,
  latitude,
  longitude,
  isCompleted = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggleComplete,
  onDeleteActivity,
}: ActivityCardProps) {
  const catKey = (category || 'sightseeing').toLowerCase();
  const config = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.sightseeing;
  const CategoryIcon = config.icon;

  const mapsUrl =
    latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <Card
      className={`group relative overflow-hidden transition-all duration-200 rounded-xl border ${
        isCompleted
          ? 'bg-slate-50/70 border-slate-200 opacity-75'
          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${
          isCompleted ? 'bg-slate-300' : 'bg-primary'
        }`}
      />

      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
        {/* Time column & Checkbox button */}
        <div className="flex sm:flex-col items-center sm:items-start justify-between w-full sm:w-28 shrink-0 gap-2">
          <div className="flex items-center text-slate-700 text-xs sm:text-sm font-semibold tracking-wide">
            <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400 shrink-0" />
            <span>{time}</span>
          </div>

          {onToggleComplete && (
            <button
              type="button"
              onClick={() => onToggleComplete(id)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Circle className="h-3.5 w-3.5 text-slate-400" />
                  <span>Mark Done</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Main Details column */}
        <div className="flex-grow space-y-2 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4
              className={`text-base sm:text-lg font-bold transition-all ${
                isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}
            >
              {title}
            </h4>

            <div className="flex items-center gap-2">
              {category && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.color}`}
                >
                  <CategoryIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </span>
              )}

              {onMoveUp && canMoveUp && (
                <button
                  type="button"
                  onClick={() => onMoveUp(id)}
                  title="Move Up"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary rounded-lg transition-all"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}

              {onMoveDown && canMoveDown && (
                <button
                  type="button"
                  onClick={() => onMoveDown(id)}
                  title="Move Down"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary rounded-lg transition-all"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {onDeleteActivity && (
                <button
                  type="button"
                  onClick={() => onDeleteActivity(id)}
                  title="Remove activity"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">{description}</p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-slate-500 hover:text-primary text-xs font-medium transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 mr-1 text-rose-500 shrink-0" />
              <span className="underline decoration-slate-300 hover:decoration-primary">
                {location}
              </span>
              <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
