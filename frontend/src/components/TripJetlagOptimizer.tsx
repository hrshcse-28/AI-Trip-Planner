import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Plane,
  Eye,
  Activity,
  Calendar,
} from 'lucide-react';
import { Trip } from '../types';

interface TripJetlagOptimizerProps {
  trip: Trip;
}

interface CityTimezone {
  name: string;
  tz: string;
  offset: number; // UTC offset in hours
}

const COMMON_ORIGINS: CityTimezone[] = [
  { name: 'New York (EDT, UTC-4)', tz: 'America/New_York', offset: -4 },
  { name: 'London (BST, UTC+1)', tz: 'Europe/London', offset: 1 },
  { name: 'San Francisco (PDT, UTC-7)', tz: 'America/Los_Angeles', offset: -7 },
  { name: 'Delhi / India (IST, UTC+5:30)', tz: 'Asia/Kolkata', offset: 5.5 },
  { name: 'Sydney (AEST, UTC+10)', tz: 'Australia/Sydney', offset: 10 },
  { name: 'Dubai (GST, UTC+4)', tz: 'Asia/Dubai', offset: 4 },
  { name: 'Singapore (SGT, UTC+8)', tz: 'Asia/Singapore', offset: 8 },
  { name: 'Paris / Berlin (CEST, UTC+2)', tz: 'Europe/Paris', offset: 2 },
];

function getDestinationOffset(destination: string): { name: string; offset: number; tz: string } {
  const lower = (destination || '').toLowerCase();
  if (lower.includes('japan') || lower.includes('tokyo') || lower.includes('kyoto') || lower.includes('osaka')) {
    return { name: 'Japan Standard Time (JST, UTC+9)', offset: 9, tz: 'Asia/Tokyo' };
  }
  if (lower.includes('paris') || lower.includes('france') || lower.includes('rome') || lower.includes('italy')) {
    return { name: 'Central European Time (CEST, UTC+2)', offset: 2, tz: 'Europe/Paris' };
  }
  if (lower.includes('london') || lower.includes('uk')) {
    return { name: 'British Summer Time (BST, UTC+1)', offset: 1, tz: 'Europe/London' };
  }
  if (lower.includes('bali') || lower.includes('indonesia')) {
    return { name: 'Central Indonesia Time (WITA, UTC+8)', offset: 8, tz: 'Asia/Makassar' };
  }
  if (lower.includes('new york') || lower.includes('nyc')) {
    return { name: 'Eastern Daylight Time (EDT, UTC-4)', offset: -4, tz: 'America/New_York' };
  }
  return { name: `${destination} Local Time (UTC+9)`, offset: 9, tz: 'Asia/Tokyo' };
}

export const TripJetlagOptimizer: React.FC<TripJetlagOptimizerProps> = ({ trip }) => {
  const [selectedOrigin, setSelectedOrigin] = useState<CityTimezone>(COMMON_ORIGINS[0]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const destTz = getDestinationOffset(trip.destination);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleTimeString();
    }
  };

  const formatDay = (tz: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(currentTime);
    } catch {
      return currentTime.toLocaleDateString();
    }
  };

  const isDaytime = (tz: string) => {
    try {
      const hour = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: 'numeric',
          hour12: false,
        }).format(currentTime),
        10
      );
      return hour >= 6 && hour < 19;
    } catch {
      return true;
    }
  };

  const hourDelta = destTz.offset - selectedOrigin.offset;
  const isEastward = hourDelta > 0;
  const absDelta = Math.abs(hourDelta);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-slate-900/60 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Circadian & Jetlag Synchronizer
              </span>
              <span className="text-xs text-slate-400">
                {absDelta === 0 ? 'Same Timezone' : `${absDelta} hours ${isEastward ? 'ahead' : 'behind'}`}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Timezone Sync & Sleep Recovery
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Scientifically proven chronotherapy routines to beat jetlag, align your internal body clock, and feel fully energized from Day 1 in {trip.destination}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium shrink-0">Your Departure City:</span>
            <select
              value={selectedOrigin.name}
              onChange={(e) => {
                const found = COMMON_ORIGINS.find((c) => c.name === e.target.value);
                if (found) setSelectedOrigin(found);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400 shadow-sm"
            >
              {COMMON_ORIGINS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live Dual Clocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin Clock */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Home Origin</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                {selectedOrigin.name.split('(')[0].trim()}
              </span>
            </div>
            {isDaytime(selectedOrigin.tz) ? (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Sun className="w-4 h-4" /> Daytime
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                <Moon className="w-4 h-4" /> Nighttime
              </span>
            )}
          </div>
          <div className="text-4xl font-black text-white font-mono tracking-tight">
            {formatClock(selectedOrigin.tz)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {formatDay(selectedOrigin.tz)} • {selectedOrigin.name}
          </div>
        </div>

        {/* Destination Clock */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Destination</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {trip.destination}
              </span>
            </div>
            {isDaytime(destTz.tz) ? (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Sun className="w-4 h-4" /> Daytime
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-indigo-400 font-semibold">
                <Moon className="w-4 h-4" /> Nighttime
              </span>
            )}
          </div>
          <div className="text-4xl font-black text-cyan-300 font-mono tracking-tight">
            {formatClock(destTz.tz)}
          </div>
          <div className="text-xs text-slate-300 mt-1 font-medium flex items-center gap-2">
            <span>{formatDay(destTz.tz)}</span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">
              {hourDelta === 0
                ? 'Same timezone'
                : `${Math.abs(hourDelta)} hours ${isEastward ? 'ahead' : 'behind'}`}
            </span>
          </div>
        </div>
      </div>

      {/* Chronotherapy 3-Phase Plan */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Scientifically Optimized Chrono-Plan ({isEastward ? 'Eastward Phase Advance' : 'Westward Phase Delay'})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Phase 1 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Phase 1: Pre-Departure
              </span>
              <span className="text-[11px] text-slate-400">Days -2 & -1</span>
            </div>
            <h4 className="text-sm font-bold text-white">Gradual Sleep Shifting</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEastward
                ? 'Shift bedtime and wake-up time 1 hour earlier each night. Eat dinner 1 hour earlier and avoid bright screens after 9:30 PM.'
                : 'Delay sleep time by 1 to 2 hours each evening. Seek evening artificial light to delay your melatonin production.'}
            </p>
            <div className="pt-2 border-t border-slate-700/50 text-[11px] text-cyan-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Blue-light filter glasses after sunset</span>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Phase 2: In-Flight
              </span>
              <span className="text-[11px] text-slate-400">Transit Day</span>
            </div>
            <h4 className="text-sm font-bold text-white">Cabin Circadian Reset</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Set your watch to {trip.destination} time as soon as you board. If it is nighttime at your destination, sleep with an eye mask and earplugs immediately.
            </p>
            <div className="pt-2 border-t border-slate-700/50 text-[11px] text-indigo-300 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5" />
              <span>Drink 250ml water every 2 flying hours</span>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 3: Arrival Anchor
              </span>
              <span className="text-[11px] text-slate-400">Days 1 - 3</span>
            </div>
            <h4 className="text-sm font-bold text-white">Natural Sunlight & Meal Timing</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Spend at least 45 minutes outdoors in natural sunlight before 11:00 AM in {trip.destination}. Never nap longer than 20 minutes before 4:00 PM.
            </p>
            <div className="pt-2 border-t border-slate-700/50 text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" />
              <span>Cut off caffeine strictly by 02:00 PM local time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Chrono-Tips */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Full Recovery Window: ~{Math.ceil(absDelta / 1.5)} Days</div>
            <div className="text-[11px] text-slate-400">
              Human circadian rhythms adjust at approximately 1.5 hours per day when aided by natural morning light.
            </div>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300">
          Day 1 Morning Activity: Outdoor Walking Tour
        </div>
      </div>
    </div>
  );
};
