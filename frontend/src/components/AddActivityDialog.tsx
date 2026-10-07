import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Clock, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Day } from '@/types';

interface AddActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  days: Day[];
  selectedDayId?: string;
  onAddActivity: (dayId: string, activityData: {
    time: string;
    title: string;
    description: string;
    location: string;
    category: string;
  }) => Promise<void>;
}

export function AddActivityDialog({
  isOpen,
  onClose,
  days,
  selectedDayId,
  onAddActivity,
}: AddActivityDialogProps) {
  const [dayId, setDayId] = useState(selectedDayId || (days[0]?.id || ''));
  const [time, setTime] = useState('11:00 AM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('sightseeing');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if selectedDayId changes
  React.useEffect(() => {
    if (selectedDayId) {
      setDayId(selectedDayId);
    } else if (days.length > 0 && !dayId) {
      setDayId(days[0].id);
    }
  }, [selectedDayId, days]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setError('Title and location are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddActivity(dayId, {
        time,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setLocation('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add activity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Add Custom Activity</h3>
              <p className="text-xs text-slate-500">Insert your own spot into your travel schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="daySelect" className="text-xs font-semibold text-slate-700">
                Target Day
              </Label>
              <select
                id="daySelect"
                value={dayId}
                onChange={(e) => setDayId(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                required
              >
                {days.map((d) => (
                  <option key={d.id} value={d.id}>
                    Day {d.dayNumber} {d.summary ? `— ${d.summary.slice(0, 20)}...` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time
              </Label>
              <Input
                id="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:30 AM"
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-slate-700">
              Activity Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Coffee & Pastries at Local Roastery"
              required
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Location / Address
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 12 Market Street"
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs capitalize"
              >
                <option value="sightseeing">Sightseeing</option>
                <option value="food">Food & Dining</option>
                <option value="culture">Culture & Arts</option>
                <option value="nature">Nature & Outdoors</option>
                <option value="shopping">Shopping</option>
                <option value="nightlife">Nightlife</option>
                <option value="transport">Transit</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Notes & Description (Optional)
            </Label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What to see or taste here, reservation notes, ticket reminders..."
              className="w-full rounded-xl border border-input p-3 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl h-10 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl h-10 px-5 text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add to Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
