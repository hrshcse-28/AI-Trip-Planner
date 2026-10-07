import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { WeatherForecastDay } from '@/types';
import {
  Sun,
  CloudSun,
  CloudRain,
  Snowflake,
  CloudLightning,
  Cloud,
  Umbrella,
  ShieldAlert,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface TripWeatherForecastProps {
  tripId: string;
  destination: string;
}

export function TripWeatherForecast({ tripId, destination }: TripWeatherForecastProps) {
  const [forecast, setForecast] = useState<WeatherForecastDay[]>([]);
  const [source, setSource] = useState<string>('live');
  const [isLoading, setIsLoading] = useState(true);
  const [isCelsius, setIsCelsius] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.trips.getWeather(tripId);
      setForecast(res.forecast || []);
      setSource(res.source || 'live');
    } catch (err: any) {
      console.warn('Weather fetch error:', err);
      setError('Could not fetch real-time satellite weather. Showing seasonal estimates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [tripId]);

  const toTemp = (celsius: number) => {
    if (isCelsius) return `${celsius}°C`;
    return `${Math.round((celsius * 9) / 5 + 32)}°F`;
  };

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="w-8 h-8 text-amber-500 animate-pulse" />;
      case 'cloud-sun':
        return <CloudSun className="w-8 h-8 text-amber-400" />;
      case 'cloud-rain':
        return <CloudRain className="w-8 h-8 text-sky-500" />;
      case 'snowflake':
        return <Snowflake className="w-8 h-8 text-cyan-400" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-8 h-8 text-purple-500" />;
      default:
        return <Cloud className="w-8 h-8 text-slate-400" />;
    }
  };

  const getUvBadge = (uv: number) => {
    if (uv <= 2) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">UV {uv} (Low)</span>;
    if (uv <= 5) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">UV {uv} (Mod)</span>;
    if (uv <= 8) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">UV {uv} (High)</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">UV {uv} (Extreme)</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-sky-200">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Satellite & Climate Radar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {destination} Weather Intelligence
          </h2>
          <p className="text-slate-300 text-sm max-w-lg">
            Real-time multi-day meteorological forecast to help you dress comfortably, pack smartly, and time your outdoor activities.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* C / F Unit Toggle */}
          <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setIsCelsius(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isCelsius ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setIsCelsius(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isCelsius ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              °F
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchWeather}
            disabled={isLoading}
            className="rounded-xl h-10 border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error / Fallback Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl p-5 border-slate-200 animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-10 bg-slate-200 rounded w-16" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </Card>
          ))}
        </div>
      ) : forecast.length === 0 ? (
        <Card className="rounded-2xl p-8 text-center text-slate-500 text-xs">
          No forecast data available at this time.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {forecast.map((day, idx) => (
            <Card
              key={day.date || idx}
              className="rounded-2xl border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      Day {idx + 1}
                    </span>
                    <CardTitle className="text-sm font-bold text-slate-900 mt-0.5">
                      {day.dayName}
                    </CardTitle>
                  </div>
                  {getUvBadge(day.uvIndex)}
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(day.icon)}
                    <div>
                      <div className="text-xl font-black text-slate-900">
                        {toTemp(day.tempMax)}
                      </div>
                      <div className="text-xs text-slate-400 font-medium">
                        Low: {toTemp(day.tempMin)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {day.condition}
                    </span>
                    <span className="text-[11px] text-sky-600 flex items-center justify-end gap-1 mt-0.5 font-medium">
                      <Umbrella className="w-3 h-3" /> {day.rainChance}% rain
                    </span>
                  </div>
                </div>

                {/* Intelligent Activity Advisory */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{day.advice}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meteorological Data Source Indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>
          Data source: {source === 'live' ? '🛰️ Open-Meteo High-Resolution Satellite & ECMWF Global Model' : '📅 Historical Seasonal Climate Model'}
        </span>
        <span>Updated real-time</span>
      </div>
    </div>
  );
}
