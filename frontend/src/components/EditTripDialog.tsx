import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  Wallet,
  Compass,
  Image as ImageIcon,
  Loader2,
  Check,
} from 'lucide-react';
import { Trip } from '../types';
import { api } from '../lib/api';

interface EditTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onTripUpdated: () => void;
}

const PRESET_COVERS = [
  { name: 'Kyoto Torii', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Tokyo Neon', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Parisian Sunset', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Rome Colosseum', url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop' },
  { name: 'London Bridge', url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Tropical Paradise', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop' },
];

export const EditTripDialog: React.FC<EditTripDialogProps> = ({
  isOpen,
  onClose,
  trip,
  onTripUpdated,
}) => {
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [budgetLevel, setBudgetLevel] = useState(trip.budgetLevel);
  const [interests, setInterests] = useState(trip.interests || '');
  const [coverImageUrl, setCoverImageUrl] = useState(trip.coverImageUrl || '');
  const [startDate, setStartDate] = useState(
    trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim()) {
      setError('Title and Destination are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await api.trips.update(trip.id, {
        title: title.trim(),
        destination: destination.trim(),
        budgetLevel,
        interests: interests.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || null,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });

      onTripUpdated();
      onClose();
    } catch (err: any) {
      console.error('Failed to update trip:', err);
      setError(err.message || 'Could not update trip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Edit Trip Information</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Trip Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 5 Days Exploring Kyoto, Japan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Destination *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Kyoto, Japan"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Budget Level
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <select
                  value={budgetLevel}
                  onChange={(e) => setBudgetLevel(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="budget">Budget (Backpacker / Value)</option>
                  <option value="moderate">Moderate (Standard / Comfort)</option>
                  <option value="luxury">Luxury (High-end / Premium)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                End Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Interests & Passion Tags
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. History, Street Food, Tea Ceremony, Photography"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Custom Hero Cover Image URL
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Presets */}
            <div className="mt-2.5">
              <span className="text-[11px] text-slate-400">Or select a scenic aesthetic preset:</span>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {PRESET_COVERS.map((preset) => {
                  const isSelected = coverImageUrl === preset.url;
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => setCoverImageUrl(preset.url)}
                      className={`relative h-14 rounded-lg overflow-hidden border transition-all ${
                        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1 text-center">
                        <span className="text-[10px] font-bold text-white leading-tight">
                          {preset.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
