import { Trip } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Printer,
  MapPin,
  Calendar,
  Wallet,
  PhoneCall,
  CheckSquare,
  Plane,
  Clock,
  Compass,
  FileText,
} from 'lucide-react';

interface TripOfflineDossierProps {
  trip: Trip;
}

const EMERGENCY_DIRECTORIES: Record<
  string,
  {
    police: string;
    ambulance: string;
    fire: string;
    dialCode: string;
    currency: string;
    voltage: string;
    tipping: string;
    transitCard: string;
  }
> = {
  japan: {
    police: '110',
    ambulance: '119',
    fire: '119',
    dialCode: '+81',
    currency: 'JPY (¥)',
    voltage: '100V / Type A, B',
    tipping: 'No tipping customary (often refused)',
    transitCard: 'Suica / Pasmo / ICOCA IC Card',
  },
  france: {
    police: '17 (or 112 EU)',
    ambulance: '15',
    fire: '18',
    dialCode: '+33',
    currency: 'EUR (€)',
    voltage: '230V / Type C, E',
    tipping: 'Service compris (round up 5-10% for great service)',
    transitCard: 'Navigo Easy / Île-de-France Mobilités',
  },
  italy: {
    police: '112 / 113',
    ambulance: '118',
    fire: '115',
    dialCode: '+39',
    currency: 'EUR (€)',
    voltage: '230V / Type C, F, L',
    tipping: 'Coperto usually included; round up 1-2€ at cafes',
    transitCard: 'Metrebus Card / Contactless Tap',
  },
  uk: {
    police: '999 (or 112)',
    ambulance: '999',
    fire: '999',
    dialCode: '+44',
    currency: 'GBP (£)',
    voltage: '230V / Type G',
    tipping: '10-12.5% optional service charge often added',
    transitCard: 'Oyster / Contactless Bank Card',
  },
  spain: {
    police: '112 / 091',
    ambulance: '061',
    fire: '080',
    dialCode: '+34',
    currency: 'EUR (€)',
    voltage: '230V / Type C, F',
    tipping: 'Small change (5-10%) appreciated but not required',
    transitCard: 'T-Mobilitat / Multi Card',
  },
  default: {
    police: '112 (Universal) or 911',
    ambulance: '112 / 911',
    fire: '112 / 911',
    dialCode: 'Check destination prefix',
    currency: 'Local Currency / USD / EUR',
    voltage: 'Universal travel adapter recommended',
    tipping: 'Standard 10-15% where customary',
    transitCard: 'Check local transit kiosks',
  },
};

export function TripOfflineDossier({ trip }: TripOfflineDossierProps) {
  const normDest = (trip.destination || '').toLowerCase();
  let emergency = EMERGENCY_DIRECTORIES.default;
  for (const [key, val] of Object.entries(EMERGENCY_DIRECTORIES)) {
    if (normDest.includes(key)) {
      emergency = val;
      break;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Screen Control Bar (Hidden when printed) */}
      <div className="print:hidden bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-400" />
            Offline Travel Kit & Print Dossier
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Designed for travel dead zones, low battery, and paper backup. Click below to print or save as PDF.
          </p>
        </div>

        <Button
          onClick={handlePrint}
          className="rounded-xl px-5 h-10 font-bold bg-white text-slate-950 hover:bg-slate-100 shrink-0 shadow"
        >
          <Printer className="w-4 h-4 mr-2 text-primary" />
          Print / Save as PDF
        </Button>
      </div>

      {/* PRINTABLE DOSSIER CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 text-slate-900 space-y-8 shadow-sm print:border-none print:p-0 print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              CONFIDENTIAL TRAVEL ITINERARY & EMERGENCY DOSSIER
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950 mt-1">
              {trip.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {trip.destination}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                {trip.durationDays} Days Duration
              </span>
              <span className="flex items-center gap-1 capitalize">
                <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                {trip.budgetLevel} Tier
              </span>
              {trip.interests && (
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  {trip.interests}
                </span>
              )}
            </div>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Issued via</span>
            <span className="text-sm font-black text-primary">AI TRIP PLANNER</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Ref: {trip.id.slice(0, 10).toUpperCase()}
            </span>
          </div>
        </div>

        {/* SECTION 1: EMERGENCY & DESTINATION ESSENTIALS */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            1. Emergency Numbers & Essential Local Facts
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Police</span>
              <span className="text-base font-black text-rose-600">{emergency.police}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Ambulance / Med</span>
              <span className="text-base font-black text-emerald-600">{emergency.ambulance}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Fire Brigade</span>
              <span className="text-base font-black text-amber-600">{emergency.fire}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Country Dial Code</span>
              <span className="text-base font-black text-slate-900">{emergency.dialCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Currency & Payment</span>
              <span className="font-bold text-slate-800">{emergency.currency}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Electricity & Plugs</span>
              <span className="font-bold text-slate-800">{emergency.voltage}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Transit & IC Card</span>
              <span className="font-bold text-slate-800">{emergency.transitCard}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: BOOKINGS & RESERVATIONS LOG */}
        {trip.bookings && trip.bookings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
              <Plane className="w-3.5 h-3.5 text-sky-600" />
              2. Confirmed Reservations & Logistics
            </h2>

            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Reservation / Title</th>
                    <th className="p-3">Confirmation / PNR</th>
                    <th className="p-3">Schedule / Time</th>
                    <th className="p-3">Location / Terminal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trip.bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold uppercase text-[10px] text-primary">
                        {b.type}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {b.title}
                        {b.provider && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {b.provider}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {b.confirmationNo || '—'}
                      </td>
                      <td className="p-3 text-slate-600">{b.dateTime || '—'}</td>
                      <td className="p-3 text-slate-600">{b.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: DAY-BY-DAY ITINERARY CHECKLIST */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            3. Daily Schedule & Activity Checklist
          </h2>

          <div className="space-y-6">
            {trip.days.map((day) => (
              <div key={day.id || day.dayNumber} className="space-y-2.5 break-inside-avoid">
                <div className="bg-slate-100 p-2.5 rounded-xl flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Day {day.dayNumber}: {day.summary || 'Schedule'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {day.activities.length} stops
                  </span>
                </div>

                <div className="space-y-2 pl-1">
                  {day.activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-start gap-3 text-xs"
                    >
                      <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-slate-900">{act.title}</span>
                          <span className="text-[11px] font-semibold text-indigo-600 shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {act.time}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{act.description}</p>
                        {act.location && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-rose-400" />
                            <span>{act.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: TRAVELER NOTES & WRITTEN LOG */}
        <div className="space-y-3 pt-4 border-t border-slate-200 break-inside-avoid">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            4. Traveler Notes & Local Contact Details
          </h2>
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
              <div>
                <span className="font-bold block">Personal Emergency Contact:</span>
                <span className="text-slate-400">Name: ______________________ Phone: ______________________</span>
              </div>
              <div>
                <span className="font-bold block">Hotel Front Desk / Host:</span>
                <span className="text-slate-400">Name: ______________________ Phone: ______________________</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400">
              <span className="font-bold text-slate-600 block mb-1">Handwritten Notes:</span>
              <div className="h-16 border-b border-dashed border-slate-300 w-full" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>AI Trip Planner · Offline Dossier</span>
          <span>Printed on {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
