import React, { useState } from 'react';
import {
  Luggage,
  Scale,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

import { Trip } from '../types';

interface TripLuggageOptimizerProps {
  trip: Trip;
}

interface PackedItem {
  id: string;
  name: string;
  category: 'clothing' | 'electronics' | 'toiletries' | 'gear' | 'souvenirs';
  weightKg: number;
}

const DEFAULT_LUGGAGE_ITEMS: PackedItem[] = [
  { id: '1', name: 'Winter/Rain Jacket', category: 'clothing', weightKg: 1.2 },
  { id: '2', name: 'Jeans & Trousers (2 pairs)', category: 'clothing', weightKg: 1.1 },
  { id: '3', name: 'T-Shirts & Tops (4 shirts)', category: 'clothing', weightKg: 0.6 },
  { id: '4', name: 'Walking Shoes / Sneakers', category: 'clothing', weightKg: 0.85 },
  { id: '5', name: 'Laptop & Charger', category: 'electronics', weightKg: 1.6 },
  { id: '6', name: 'Universal Travel Adapter & Cables', category: 'electronics', weightKg: 0.35 },
  { id: '7', name: 'Toiletry Bag & Liquids (<100ml)', category: 'toiletries', weightKg: 0.75 },
  { id: '8', name: 'Medications & First Aid', category: 'gear', weightKg: 0.25 },
  { id: '9', name: 'Souvenir & Shopping Reserve Space', category: 'souvenirs', weightKg: 1.5 },
];

export const TripLuggageOptimizer: React.FC<TripLuggageOptimizerProps> = ({ trip }) => {
  const [items, setItems] = useState<PackedItem[]>(DEFAULT_LUGGAGE_ITEMS);
  const [bagType, setBagType] = useState<'carryon' | 'checked'>('carryon');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWeight, setNewItemWeight] = useState('0.5');
  const [newItemCategory, setNewItemCategory] = useState<PackedItem['category']>('clothing');

  const weightLimit = bagType === 'carryon' ? 7.0 : 23.0; // kg

  const totalWeight = Math.round(items.reduce((sum, item) => sum + item.weightKg, 0) * 10) / 10;
  const remainingWeight = Math.round((weightLimit - totalWeight) * 10) / 10;
  const percentage = Math.min(100, Math.round((totalWeight / weightLimit) * 100));

  const isOverweight = totalWeight > weightLimit;
  const isNearLimit = totalWeight >= weightLimit * 0.85 && !isOverweight;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const w = parseFloat(newItemWeight);
    if (isNaN(w) || w <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newItemName.trim(),
        category: newItemCategory,
        weightKg: w,
      },
    ]);

    setNewItemName('');
    setNewItemWeight('0.5');
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Category sums
  const clothingWeight = items
    .filter((i) => i.category === 'clothing')
    .reduce((s, i) => s + i.weightKg, 0);
  const electronicsWeight = items
    .filter((i) => i.category === 'electronics')
    .reduce((s, i) => s + i.weightKg, 0);
  const toiletriesWeight = items
    .filter((i) => i.category === 'toiletries')
    .reduce((s, i) => s + i.weightKg, 0);
  const otherWeight = totalWeight - (clothingWeight + electronicsWeight + toiletriesWeight);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-orange-950/40 to-slate-900/60 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Airline Baggage Weight Optimizer
              </span>
              <span className="text-xs text-slate-400">
                Avoid Airport Counter Fees
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Luggage Weight & Airline Allowance Planner
              <Luggage className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track packed weight against international airline limits for your trip to {trip.destination}. Never get charged unexpected $75+ overweight baggage penalties.
            </p>
          </div>

          {/* Bag Type Selector */}
          <div className="flex items-center bg-slate-900/90 border border-amber-500/30 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setBagType('carryon')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bagType === 'carryon'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Carry-On Bag (7 kg)
            </button>
            <button
              onClick={() => setBagType('checked')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                bagType === 'checked'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Checked Suitcase (23 kg)
            </button>
          </div>
        </div>
      </div>

      {/* Weight Gauge Meter */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              Total Packed Weight:
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white">{totalWeight} kg</span>
              <span className="text-sm text-slate-400 font-medium">
                (~{(totalWeight * 2.20462).toFixed(1)} lbs) of {weightLimit} kg allowance
              </span>
            </div>
          </div>

          <div className="text-right">
            {isOverweight ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Overweight by {Math.abs(remainingWeight)} kg! (~$75 fee risk)
              </span>
            ) : isNearLimit ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Near Limit: {remainingWeight} kg buffer left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Well Under Limit: {remainingWeight} kg free capacity
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverweight
                ? 'bg-rose-500'
                : isNearLimit
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${percentage}%` }}
          />

        </div>

        {/* Category Weight Breakdown Chips */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            Clothing: <strong>{clothingWeight.toFixed(1)} kg</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Electronics: <strong>{electronicsWeight.toFixed(1)} kg</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Toiletries: <strong>{toiletriesWeight.toFixed(1)} kg</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            Other & Souvenirs: <strong>{otherWeight.toFixed(1)} kg</strong>
          </span>
        </div>
      </div>

      {/* Item Checklist & Quick Add Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Luggage className="w-4 h-4 text-amber-400" />
              Packed Luggage Items ({items.length})
            </h3>
            <span className="text-xs text-slate-400">Click trash to remove</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-white truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {item.weightKg} kg
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Item Form (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-400" />
            Add Packed Item
          </h3>

          <form onSubmit={handleAddItem} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hairdryer, Drone, Hiking boots"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Est. Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.05"
                  required
                  value={newItemWeight}
                  onChange={(e) => setNewItemWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="clothing">Clothing</option>
                  <option value="electronics">Electronics</option>
                  <option value="toiletries">Toiletries</option>
                  <option value="gear">Gear</option>
                  <option value="souvenirs">Souvenirs</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md transition-all mt-2"
            >
              Add to Luggage
            </button>
          </form>

          {/* Quick Pro-Tip */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
            <span className="font-bold flex items-center gap-1 text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Smart Packing Tip:
            </span>
            <p>
              Wear your heaviest jacket and footwear on travel day to save up to 2.2 kg of luggage allowance!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
