import React, { useState } from 'react';
import {
  Leaf,
  Globe,
  Trees,
  Award,
  ShieldCheck,
  Footprints,
  Compass,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import { Trip } from '../types';

interface TripEcoEstimatorProps {
  trip: Trip;
}

export const TripEcoEstimator: React.FC<TripEcoEstimatorProps> = ({ trip }) => {
  const [isOffsetPledged, setIsOffsetPledged] = useState(false);

  // Approximate calculations
  // Estimate travel distance: rough proxy based on destination character hash or baseline 3500km
  const flightKm = 3200;
  const flightCo2 = Math.round(flightKm * 0.18); // ~0.18 kg CO2e per passenger-km

  const hotelDays = trip.durationDays || 3;
  const hotelCo2 = Math.round(hotelDays * (trip.budgetLevel === 'luxury' ? 38 : trip.budgetLevel === 'budget' ? 14 : 22)); // kg CO2 per room-night

  const localTransitCo2 = Math.round(hotelDays * 6); // local buses, walking, trains

  const totalCo2 = flightCo2 + hotelCo2 + localTransitCo2;
  const treesToOffset = Math.max(1, Math.ceil(totalCo2 / 21)); // 1 mature tree absorbs ~21kg CO2/year

  // Calculate Eco Grade
  let ecoGrade = 'A';
  let gradeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  if (totalCo2 > 900) {
    ecoGrade = 'C';
    gradeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  } else if (totalCo2 > 600) {
    ecoGrade = 'B';
    gradeColor = 'text-teal-400 bg-teal-500/10 border-teal-500/30';
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900/60 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-6 -bottom-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Eco-Travel & Carbon Assessment
              </span>
              <span className="text-xs text-slate-400">Green Journey Tracker</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Carbon Footprint & Eco-Pact
              <Trees className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Understand the environmental footprint of your visit to {trip.destination} and discover verified practices to tread lightly.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 shrink-0 shadow-lg">
            <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center font-black ${gradeColor}`}>
              <span className="text-2xl leading-none">{ecoGrade}</span>
              <span className="text-[9px] uppercase font-bold tracking-widest mt-0.5">Rating</span>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Estimated Emissions</div>
              <div className="text-xl font-bold text-white">{totalCo2} <span className="text-sm font-normal text-slate-400">kg CO₂e</span></div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <Trees className="w-3.5 h-3.5" />
                {treesToOffset} trees to offset
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Flights */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transit & Flights</span>
            <span className="text-xs font-bold text-emerald-400">{flightCo2} kg</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ~{flightKm.toLocaleString()} <span className="text-sm font-normal text-slate-400">km roundtrip</span>
          </div>
          <p className="text-xs text-slate-400">
            Estimated air travel emissions per passenger. Direct flights reduce fuel burn during takeoff/landing cycles.
          </p>
        </div>

        {/* Accommodation */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accommodations</span>
            <span className="text-xs font-bold text-emerald-400">{hotelCo2} kg</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {hotelDays} <span className="text-sm font-normal text-slate-400">nights stay</span>
          </div>
          <p className="text-xs text-slate-400">
            Average energy and laundry load for {trip.budgetLevel} accommodations. Declining daily linen changes saves ~15% energy.
          </p>
        </div>

        {/* Local Transport */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Local Mobility</span>
            <span className="text-xs font-bold text-emerald-400">{localTransitCo2} kg</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            Public & Walking
          </div>
          <p className="text-xs text-slate-400">
            Using local subways, electric trams, and walking between sites emits 78% less carbon than private taxi fleets.
          </p>
        </div>
      </div>

      {/* Sustainable Travel Recommendations for the Destination */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          Destination-Specific Eco Guidelines for {trip.destination}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Footprints className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Prioritize High-Speed Rail & Metro</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Avoid domestic flights. Rail networks in regions like Japan, Europe, and Northeast Asia generate 85% less carbon per traveler.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Eat Local & Seasonal</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Dine at neighborhood izakayas, trattorias, and markets. Local food systems drastically reduce food transport emissions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Carry a Reusable Bottle & Bag</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Refill at designated clean water fountains. Single-use plastic wrappers and bottles create massive landfill strain in historic cities.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Respect Local Sanctuaries & Wildlife</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Stay on designated trails in nature reserves and temple groves. Never patronize exploitative animal entertainment venues.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Offset Pledge Card */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              Carbon Neutral Traveler Pledge
              {isOffsetPledged && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pledged
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Planting {treesToOffset} trees offsets 100% of this trip's estimated {totalCo2} kg CO₂ emissions over the coming year.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOffsetPledged(!isOffsetPledged)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            isOffsetPledged
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isOffsetPledged ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Pledged Carbon Neutral
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Take Eco-Pledge (~{treesToOffset} Trees)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
