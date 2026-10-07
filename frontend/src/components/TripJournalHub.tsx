import React, { useState } from 'react';
import {
  BookOpen,
  Camera,
  Star,
  Plus,
  Trash2,
  MapPin,
  Calendar,
  Sparkles,
  Heart,
  Image as ImageIcon,
  X,
  Filter
} from 'lucide-react';
import { Trip, JournalEntry } from '../types';
import { api } from '../lib/api';

interface TripJournalHubProps {
  trip: Trip;
  onTripUpdated?: () => void;
  isReadOnly?: boolean;
}

const PRESET_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
];

export const TripJournalHub: React.FC<TripJournalHubProps> = ({
  trip,
  onTripUpdated,
  isReadOnly = false,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [location, setLocation] = useState(trip.destination);
  const [rating, setRating] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState('');

  const entries: JournalEntry[] = trip.journalEntries || [];

  const filteredEntries = entries.filter((entry) => {
    if (selectedDay === 'all') return true;
    return entry.dayNumber === selectedDay;
  });

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setIsSubmitting(true);
      await api.journal.create(trip.id, {
        title: title.trim(),
        content: content.trim(),
        dayNumber: Number(dayNumber),
        location: location.trim() || trip.destination,
        rating: Number(rating),
        photoUrl: photoUrl.trim() || undefined,
      });

      // Reset form
      setTitle('');
      setContent('');
      setPhotoUrl('');
      setRating(5);
      setIsModalOpen(false);

      if (onTripUpdated) {
        onTripUpdated();
      }
    } catch (err) {
      console.error('Failed to create journal entry:', err);
      alert('Failed to save journal memory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Delete this memory from your trip journal?')) return;
    try {
      setDeletingId(id);
      await api.journal.delete(trip.id, id);
      if (onTripUpdated) {
        onTripUpdated();
      }
    } catch (err) {
      console.error('Failed to delete journal entry:', err);
      alert('Failed to remove memory.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900/40 via-amber-900/30 to-purple-900/40 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <BookOpen className="w-3.5 h-3.5" />
                Travel Memoir & Logbook
              </span>
              <span className="text-xs text-slate-400">
                {entries.length} {entries.length === 1 ? 'memory' : 'memories'} captured
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Trip Journal & Memories
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Chronicle your highlights, culinary discoveries, serendipitous encounters, and reflections across {trip.destination}.
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-sm shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" />
              Write New Memory
            </button>
          )}
        </div>

        {/* Day Filter Bar */}
        {trip.days && trip.days.length > 0 && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Filter Day:
            </span>
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedDay === 'all'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All Days ({entries.length})
            </button>
            {trip.days.map((day) => {
              const dayEntriesCount = entries.filter((e) => e.dayNumber === day.dayNumber).length;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.dayNumber)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedDay === day.dayNumber
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Day {day.dayNumber} {dayEntriesCount > 0 ? `(${dayEntriesCount})` : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Memories Grid */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30 backdrop-blur-sm">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No Memories Recorded Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">
            {selectedDay === 'all'
              ? 'Start documenting your unforgettable experiences, local flavors, and scenic vistas.'
              : `No memories added yet for Day ${selectedDay}. Capture your experience now!`}
          </p>
          {!isReadOnly && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-sm font-medium border border-rose-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Memory
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="group bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg backdrop-blur-sm"
            >
              {/* Optional Photo Header */}
              {entry.photoUrl && (
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={entry.photoUrl}
                    alt={entry.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                  {entry.dayNumber && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      Day {entry.dayNumber}
                    </span>
                  )}
                  {entry.rating && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 text-amber-300 backdrop-blur-md border border-white/10 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {entry.rating}/5
                    </div>
                  )}
                </div>
              )}

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      {!entry.photoUrl && (
                        <div className="flex items-center gap-2 mb-1.5">
                          {entry.dayNumber && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              Day {entry.dayNumber}
                            </span>
                          )}
                          {entry.rating && (
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: entry.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <h4 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                        {entry.title}
                      </h4>
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors opacity-80 group-hover:opacity-100"
                        title="Delete memory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                    {entry.content}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-auto">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate max-w-[180px]">{entry.location || trip.destination}</span>
                  </div>
                  <span>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Write New Memory */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Record Travel Memory</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Memory Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sunrise over Fushimi Inari torii gates"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Itinerary Day
                  </label>
                  <select
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-rose-500"
                  >
                    {trip.days && trip.days.length > 0 ? (
                      trip.days.map((d) => (
                        <option key={d.id} value={d.dayNumber}>
                          Day {d.dayNumber}
                        </option>
                      ))
                    ) : (
                      <option value={1}>Day 1</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Rating (1 - 5)
                  </label>
                  <div className="flex items-center gap-1 py-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Location / Venue
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Kyoto Imperial Palace"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Journal Reflections & Story *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the moments, atmosphere, smells, tastes, and thoughts you want to remember..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Photo URL (Optional)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Sample shots:</span>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {PRESET_SAMPLE_PHOTOS.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setPhotoUrl(url)}
                        className="w-7 h-7 rounded-md overflow-hidden border border-slate-700 hover:border-rose-500 hover:scale-105 transition-all shrink-0"
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-sm font-medium shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save Memory
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
