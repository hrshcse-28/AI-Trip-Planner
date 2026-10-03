import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActivityCardProps {
  time: string;
  title: string;
  description: string;
  location: string;
  isCompleted?: boolean;
}

export function ActivityCard({ time, title, description, location, isCompleted = false }: ActivityCardProps) {
  return (
    <Card className={`relative overflow-hidden transition-colors ${isCompleted ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-primary/50'}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-slate-300' : 'bg-primary'}`} />
      <CardContent className="p-5 flex flex-col sm:flex-row gap-4">
        <div className="flex-shrink-0 flex items-start sm:items-center sm:justify-center w-24 text-slate-500 font-medium">
          <Clock className="h-4 w-4 mr-2" />
          {time}
        </div>
        <div className="flex-grow space-y-2">
          <div className="flex justify-between items-start">
            <h4 className={`text-lg font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{title}</h4>
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          </div>
          <p className="text-slate-600 text-sm">{description}</p>
          <div className="flex items-center text-slate-500 text-xs font-medium">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center">
          {!isCompleted && <Button variant="outline" size="sm">Details</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
