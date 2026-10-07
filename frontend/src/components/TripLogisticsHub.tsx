import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { Booking } from '@/types';
import {
  Plane,
  Building,
  Train,
  Car,
  Ticket,
  Plus,
  Trash2,
  Copy,
  Calendar,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  Bus,
  ShieldAlert,
} from 'lucide-react';

interface TripLogisticsHubProps {
  tripId: string;
  initialBookings?: Booking[];
  onBookingsUpdated?: () => void;
}

const TYPE_CONFIG = {
  flight: { label: 'Flight', icon: Plane, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800' },
  hotel: { label: 'Hotel / Resort', icon: Building, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' },
  train: { label: 'Train / IRCTC', icon: Train, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  bus: { label: 'Bus / Coach', icon: Bus, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  car: { label: 'Cab / Rental', icon: Car, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800' },
  activity: { label: 'Entry Ticket', icon: Ticket, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800' },
  other: { label: 'Other', icon: FileText, color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
};

export function TripLogisticsHub({
  tripId,
  initialBookings = [],
  onBookingsUpdated,
}: TripLogisticsHubProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState<'flight' | 'hotel' | 'train' | 'bus' | 'car' | 'activity' | 'other'>('flight');
  const [title, setTitle] = useState('');
  const [confirmationNo, setConfirmationNo] = useState('');
  const [provider, setProvider] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Confirmation Copied', `Code ${code} copied to clipboard!`);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Missing Title', 'Please enter a booking title or flight/hotel name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.bookings.create(tripId, {
        type,
        title: title.trim(),
        confirmationNo: confirmationNo.trim() || undefined,
        provider: provider.trim() || undefined,
        dateTime: dateTime.trim() || undefined,
        location: location.trim() || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes.trim() || undefined,
      });

      setBookings((prev) => [...prev, res.booking]);
      toast.success('Reservation Added', `Added ${title} to your travel hub.`);

      // Reset form
      setTitle('');
      setConfirmationNo('');
      setProvider('');
      setDateTime('');
      setLocation('');
      setCost('');
      setNotes('');
      setShowAddForm(false);

      if (onBookingsUpdated) onBookingsUpdated();
    } catch (err: any) {
      toast.error('Failed to Add Booking', err.message || 'Could not save reservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!window.confirm('Delete this reservation?')) return;
    try {
      await api.bookings.delete(tripId, bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.info('Reservation Removed', 'Booking has been deleted.');
      if (onBookingsUpdated) onBookingsUpdated();
    } catch (err: any) {
      toast.error('Delete Failed', err.message);
    }
  };

  const totalLogisticsCost = bookings.reduce((sum, b) => sum + (b.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-indigo-200">
            <Plane className="w-3.5 h-3.5" />
            <span>Travel Operations Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Flights, Stays & Logistics
          </h2>
          <p className="text-slate-300 text-sm max-w-lg">
            Keep all your boarding passes, hotel check-in dates, confirmation codes, and rental car reservations in one centralized command center.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right min-w-[180px]">
            <span className="text-xs text-slate-300 font-medium">Logged Reservations</span>
            <div className="text-2xl font-black text-white mt-0.5">
              {bookings.length} Bookings
            </div>
            {totalLogisticsCost > 0 && (
              <div className="text-xs text-emerald-400 font-semibold mt-1">
                ${totalLogisticsCost.toFixed(2)} Total
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-xl h-11 px-5 font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-primary" />
            {showAddForm ? 'Cancel Form' : 'Add New Booking'}
          </Button>
        </div>
      </div>

      {/* Add Booking Modal / Expandable Form */}
      {showAddForm && (
        <Card className="rounded-2xl border-primary/30 shadow-lg bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add Travel Reservation
            </CardTitle>
            <CardDescription className="text-xs">
              Save your flight numbers, hotel addresses, and confirmation codes for instant offline access.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              {/* Type Select Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Reservation Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((key) => {
                    const cfg = TYPE_CONFIG[key];
                    const Icon = cfg.icon;
                    const isSelected = type === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Title / Name *</label>
                  <Input
                    placeholder="e.g. Vande Bharat Express, IndiGo 6E-543, or Taj Palace"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirmation / PNR / Ticket #</label>
                  <Input
                    placeholder="e.g. IRCTC PNR 245-8910123 or 6E-P87KQ"
                    value={confirmationNo}
                    onChange={(e) => setConfirmationNo(e.target.value)}
                    className="h-10 text-xs rounded-xl font-mono uppercase dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Provider / Operator / Airline</label>
                  <Input
                    placeholder="e.g. IRCTC, IndiGo, Air India, RedBus, Uber, Booking.com"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date & Time / Schedule</label>
                  <Input
                    placeholder="e.g. 06:00 AM (Departure) or Check-in 12:00 PM"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Station / Platform / Gate / Terminal</label>
                  <Input
                    placeholder="e.g. New Delhi Rly Station (Plat 1) or IGI T3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Total Cost (INR / USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="h-10 pl-7 text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Data transparency disclaimer */}
              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Travel Reference Storage:</strong> PNR codes and booking identifiers are safely stored in your offline-ready itinerary dossier. Official live seat charts or dynamic IRCTC charting requires verified railway portal verification.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Important Notes & Instructions</label>
                <Input
                  placeholder="e.g. Baggage allowance: 2 bags 23kg each. Breakfast included. Early check-in requested."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-semibold px-5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Saving...
                    </>
                  ) : (
                    'Save Reservation'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Bookings List Display */}
      {bookings.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-slate-200 p-10 text-center space-y-3">
          <Plane className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Reservations Logged Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Store your flight itineraries, hotel check-in confirmations, car rentals, and museum passes here for seamless offline access while traveling.
          </p>
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="rounded-xl text-xs font-semibold mt-2"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Your First Booking
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => {
            const cfg = TYPE_CONFIG[booking.type] || TYPE_CONFIG.other;
            const Icon = cfg.icon;

            return (
              <Card
                key={booking.id}
                className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${cfg.color} shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {cfg.label} {booking.provider ? `· ${booking.provider}` : ''}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {booking.title}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                      title="Delete booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Confirmation Code Banner */}
                  {booking.confirmationNo && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-slate-500 font-medium">Confirmation:</span>
                        <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                          {booking.confirmationNo}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyCode(booking.confirmationNo!)}
                        className="h-7 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy
                      </Button>
                    </div>
                  )}

                  {/* Details Badges */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {booking.dateTime && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{booking.dateTime}</span>
                      </div>
                    )}
                    {booking.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{booking.location}</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/40 text-[11px] text-amber-900 mt-2">
                        {booking.notes}
                      </div>
                    )}
                  </div>
                </div>

                {booking.cost != null && booking.cost > 0 && (
                  <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Cost</span>
                    <span className="font-bold text-slate-900">${booking.cost.toFixed(2)}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
