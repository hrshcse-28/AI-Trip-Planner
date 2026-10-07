import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sun,
  CheckSquare,
  Square,
  Plus,
  Luggage,
  Thermometer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

interface TripPackingWeatherProps {
  tripId: string;
  destination: string;
  durationDays: number;
}

interface PackingItem {
  id: string;
  category: string;
  text: string;
  isPacked: boolean;
}

const DEFAULT_PACKING_ITEMS: Omit<PackingItem, 'id' | 'isPacked'>[] = [
  { category: 'Essentials', text: 'Passport / ID & Visa documents' },
  { category: 'Essentials', text: 'Hotel reservations & boarding passes' },
  { category: 'Essentials', text: 'Credit cards & local emergency cash' },
  { category: 'Clothing', text: 'Comfortable walking sneakers' },
  { category: 'Clothing', text: 'Breathable weather-appropriate layers' },
  { category: 'Clothing', text: 'Light rain jacket or windbreaker' },
  { category: 'Electronics', text: 'Universal power adapter' },
  { category: 'Electronics', text: 'High-capacity portable power bank' },
  { category: 'Electronics', text: 'Camera / Phone charger cables' },
  { category: 'Health & Toiletries', text: 'Sunscreen & lip balm SPF' },
  { category: 'Health & Toiletries', text: 'Mini travel first-aid & band-aids' },
  { category: 'Health & Toiletries', text: 'Refillable insulated water bottle' },
];

export function TripPackingWeather({
  tripId,
  destination,
  durationDays,
}: TripPackingWeatherProps) {
  const storageKey = `packing_list_${tripId}`;

  const [items, setItems] = useState<PackingItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PACKING_ITEMS.map((item, idx) => ({
      ...item,
      id: `item-${idx}`,
      isPacked: false,
    }));
  });

  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Essentials');

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, storageKey]);

  const togglePacked = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPacked: !item.isPacked } : item))
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: PackingItem = {
      id: `custom-${Date.now()}`,
      category: selectedCategory,
      text: newItemText.trim(),
      isPacked: false,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const packedCount = items.filter((i) => i.isPacked).length;
  const packedPercent = items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  // Determine destination weather flavor
  const destLower = destination.toLowerCase();
  let tempC = 21;
  let condition = 'Mild & Sunny';
  let advice = 'Great sightseeing weather. Comfortable shoes recommended.';

  if (destLower.includes('paris') || destLower.includes('london')) {
    tempC = 19;
    condition = 'Partly Cloudy & Breezy';
    advice = 'Carry a compact umbrella and light layers for pleasant evening walks.';
  } else if (destLower.includes('tokyo') || destLower.includes('kyoto')) {
    tempC = 22;
    condition = 'Clear Skies & Pleasant';
    advice = 'Ideal weather for garden walks and temple visits.';
  } else if (destLower.includes('rome') || destLower.includes('barcelona')) {
    tempC = 26;
    condition = 'Sunny & Warm';
    advice = 'Stay hydrated and protect against sun during midday plaza tours.';
  } else if (destLower.includes('bali')) {
    tempC = 29;
    condition = 'Tropical & Warm';
    advice = 'Light breathable cottons and swimwear recommended.';
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Weather Snapshot */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden md:col-span-1">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-amber-500" />
            Destination Weather
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 truncate">
            Typical climate in {destination}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60">
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{tempC}°C</div>
              <div className="text-xs font-semibold text-amber-800 mt-0.5">{condition}</div>
            </div>
            <Sun className="w-10 h-10 text-amber-500 animate-spin" style={{ animationDuration: '30s' }} />
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-800">Travel Advice:</span> {advice}
            </p>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pack according to {durationDays}-day forecast</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Packing Checklist */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm overflow-hidden md:col-span-2">
        <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Luggage className="w-4 h-4 text-primary" />
                Smart Packing Checklist
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tailored for {durationDays} days in {destination}
              </CardDescription>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
              {packedCount}/{items.length} Packed ({packedPercent}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${packedPercent}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Add custom item form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 text-xs rounded-lg border border-input bg-background px-2 font-medium"
            >
              <option value="Essentials">Essentials</option>
              <option value="Clothing">Clothing</option>
              <option value="Electronics">Electronics</option>
              <option value="Health & Toiletries">Health</option>
            </select>
            <Input
              placeholder="Add item (e.g. Swimwear, Sunglasses)..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="h-9 text-xs rounded-lg flex-1"
            />
            <Button type="submit" size="sm" className="h-9 rounded-lg px-3">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>

          {/* Checklist Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => togglePacked(item.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                  item.isPacked
                    ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                    : 'bg-white border-slate-200 hover:border-primary/50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.isPacked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{item.text}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-1 transition-opacity text-slate-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
