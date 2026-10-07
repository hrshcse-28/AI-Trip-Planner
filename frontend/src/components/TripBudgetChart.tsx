import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  TrendingUp,
  ArrowRightLeft,
  Receipt,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';

interface TripBudgetChartProps {
  tripId?: string;
  budgetLevel: string;
  durationDays: number;
  destination?: string;
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

const BUDGET_MULTIPLIERS_INR: Record<string, { dailyMin: number; dailyMax: number; label: string }> = {
  budget: { dailyMin: 1800, dailyMax: 3200, label: 'Budget-Friendly' },
  moderate: { dailyMin: 4500, dailyMax: 8500, label: 'Moderate Comfort' },
  luxury: { dailyMin: 14000, dailyMax: 28000, label: 'Luxury Experience' },
};

const BUDGET_MULTIPLIERS_USD: Record<string, { dailyMin: number; dailyMax: number; label: string }> = {
  budget: { dailyMin: 65, dailyMax: 110, label: 'Budget-Friendly' },
  moderate: { dailyMin: 180, dailyMax: 290, label: 'Moderate Comfort' },
  luxury: { dailyMin: 500, dailyMax: 850, label: 'Luxury Experience' },
};

const CATEGORIES = [
  { name: 'Lodging & Stays', percentage: 0.38, color: '#4f46e5' },
  { name: 'Food & Dining', percentage: 0.28, color: '#f59e0b' },
  { name: 'Tours & Tickets', percentage: 0.18, color: '#10b981' },
  { name: 'Local Transport', percentage: 0.10, color: '#0ea5e9' },
  { name: 'Shopping & Misc', percentage: 0.06, color: '#ec4899' },
];

const CURRENCY_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  INR: { rate: 1.0, symbol: '₹', name: 'Indian Rupee' },
  USD: { rate: 0.0119, symbol: '$', name: 'US Dollar' },
  EUR: { rate: 0.011, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.0094, symbol: '£', name: 'British Pound' },
  AED: { rate: 0.0436, symbol: 'AED', name: 'UAE Dirham' },
  SGD: { rate: 0.016, symbol: 'S$', name: 'Singapore Dollar' },
  AUD: { rate: 0.018, symbol: 'A$', name: 'Australian Dollar' },
  CAD: { rate: 0.016, symbol: 'CA$', name: 'Canadian Dollar' },
  JPY: { rate: 1.83, symbol: '¥', name: 'Japanese Yen' },
};

export function TripBudgetChart({ tripId = 'default', budgetLevel, durationDays, destination }: TripBudgetChartProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'INR' | 'USD'>('INR');
  const isINR = selectedCurrency === 'INR';
  const currencySymbol = isINR ? '₹' : '$';

  const tier = isINR
    ? (BUDGET_MULTIPLIERS_INR[budgetLevel.toLowerCase()] || BUDGET_MULTIPLIERS_INR.moderate)
    : (BUDGET_MULTIPLIERS_USD[budgetLevel.toLowerCase()] || BUDGET_MULTIPLIERS_USD.moderate);

  const avgDaily = Math.round((tier.dailyMin + tier.dailyMax) / 2);
  const totalEstMin = tier.dailyMin * durationDays;
  const totalEstMax = tier.dailyMax * durationDays;
  const totalAvg = avgDaily * durationDays;

  // AI Budget reduction state
  const [reductionAmount, setReductionAmount] = useState<number>(5000);
  const [reductionLoading, setReductionLoading] = useState(false);
  const [reductionResult, setReductionResult] = useState<{
    targetReductionINR: number;
    totalPotentialSavingsINR: number;
    suggestions: { category: string; savingINR: number; title: string; detail: string }[];
  } | null>(null);

  // Currency converter state
  const [convAmount, setConvAmount] = useState('5000');
  const [fromCurrency, setFromCurrency] = useState('INR');
  const [toCurrency, setToCurrency] = useState('USD');

  // Expense tracker state (persisted locally)
  const expenseStorageKey = `trip_expenses_${tripId}`;
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    try {
      const saved = localStorage.getItem(expenseStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food & Dining');

  useEffect(() => {
    try {
      localStorage.setItem(expenseStorageKey, JSON.stringify(expenses));
    } catch {
      // ignore
    }
  }, [expenses, expenseStorageKey]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amt) || amt <= 0) return;

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: expDesc.trim(),
      amount: Math.round(amt * 100) / 100,
      category: expCategory,
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };

    setExpenses((prev) => [newExp, ...prev]);
    setExpDesc('');
    setExpAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = Math.max(0, totalAvg - totalSpent);
  const spentPercent = Math.min(100, Math.round((totalSpent / (totalAvg || 1)) * 100));

  // Compute conversion
  const fromRate = CURRENCY_RATES[fromCurrency]?.rate || 1.0;
  const toRate = CURRENCY_RATES[toCurrency]?.rate || 1.0;
  const numericConv = parseFloat(convAmount) || 0;
  const convertedValue = ((numericConv / fromRate) * toRate).toFixed(2);

  const data = CATEGORIES.map((cat) => ({
    name: cat.name,
    value: Math.round(totalAvg * cat.percentage),
    color: cat.color,
    percentage: Math.round(cat.percentage * 100),
  }));

  const handleReduceBudget = async (amount: number = reductionAmount) => {
    if (!tripId || tripId === 'default') return;
    setReductionLoading(true);
    try {
      const res = await api.trips.reduceBudget(tripId, amount);
      setReductionResult(res);
    } catch (err) {
      console.error('Failed to calculate budget reductions:', err);
    } finally {
      setReductionLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-0.5 border border-slate-700">
          <p className="font-bold">{item.name}</p>
          <p className="text-slate-300">
            Est. {currencySymbol}{item.value.toLocaleString()} ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* 1. Main Budget Breakdown Card */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden transition-colors">
        <CardHeader className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 dark:text-white">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Budget Breakdown & Estimates {destination ? `· ${destination}` : ''}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Projected expenses for {durationDays} days based on {tier.label} tier
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Currency Toggle */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('INR')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    isINR
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('USD')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    !isINR
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  $ USD
                </button>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 capitalize">
                {budgetLevel}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Estimated Range Highlights */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estimated Range</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {currencySymbol}{totalEstMin.toLocaleString()} - {currencySymbol}{totalEstMax.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">Total projected for trip</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Target</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ~{currencySymbol}{avgDaily.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">Per person / day</div>
            </div>
          </div>

          {/* Donut Chart & Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                <TrendingUp className="w-4 h-4 text-slate-400 mb-0.5" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {currencySymbol}{totalAvg.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">avg total</span>
              </div>
            </div>

            <div className="space-y-2">
              {data.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                    {currencySymbol}{item.value.toLocaleString()}{' '}
                    <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Smart Budget Reducer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      AI Cost Optimizer · Smart Budget Reduction
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Need to lower costs without sacrificing experience? Let AI suggest targeted savings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReductionAmount(5000);
                      handleReduceBudget(5000);
                    }}
                    disabled={reductionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                  >
                    {reductionLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    Make Trip ₹5,000 Cheaper
                  </button>
                </div>
              </div>

              {/* Custom Reduction Bar */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Custom Target:</span>
                <div className="relative w-32">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={reductionAmount}
                    onChange={(e) => setReductionAmount(Number(e.target.value) || 1000)}
                    className="w-full pl-6 pr-2 py-1 text-xs font-semibold rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleReduceBudget(reductionAmount)}
                  disabled={reductionLoading}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-800/40 text-amber-900 dark:text-amber-200 transition-colors"
                >
                  Recalculate
                </button>
              </div>

              {/* Optimization Suggestions Display */}
              {reductionResult && (
                <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/30 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                    <span>Target Savings: ₹{reductionResult.targetReductionINR.toLocaleString()}</span>
                    <span className="text-emerald-700 dark:text-emerald-400">
                      Total Potential: ₹{reductionResult.totalPotentialSavingsINR.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {reductionResult.suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-100 dark:border-slate-800 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {sug.title}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                            -₹{sug.savingINR.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5 leading-relaxed">
                          {sug.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Side-by-Side: Currency Converter + Actual Expense Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Currency Converter */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <CardHeader className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 pb-4">
              <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                Travel Currency Converter
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Quick real-time rate calculator for expenses on the go
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount to Convert</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">
                    {CURRENCY_RATES[fromCurrency]?.symbol || '₹'}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={convAmount}
                    onChange={(e) => setConvAmount(e.target.value)}
                    className="h-10 pl-8 text-sm font-semibold rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">From</label>
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input dark:border-slate-700 bg-background dark:bg-slate-800 px-3 text-xs font-semibold dark:text-white"
                  >
                    {Object.keys(CURRENCY_RATES).map((code) => (
                      <option key={code} value={code}>
                        {code} ({CURRENCY_RATES[code].name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">To</label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input dark:border-slate-700 bg-background dark:bg-slate-800 px-3 text-xs font-semibold dark:text-white"
                  >
                    {Object.keys(CURRENCY_RATES).map((code) => (
                      <option key={code} value={code}>
                        {code} ({CURRENCY_RATES[code].name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-indigo-50/50 dark:from-primary/10 dark:to-indigo-950/20 border border-primary/20 text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400">Converted Amount</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {CURRENCY_RATES[toCurrency]?.symbol} {convertedValue}{' '}
                  <span className="text-xs font-semibold text-slate-400">{toCurrency}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  1 {fromCurrency} = {(toRate / fromRate).toFixed(4)} {toCurrency}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Live Trip Expense Tracker */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between transition-colors">
          <div>
            <CardHeader className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                    <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Trip Expense Logger
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                    Track actual expenses vs. projected budget
                  </CardDescription>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  {currencySymbol}{totalSpent.toLocaleString()} spent
                </span>
              </div>

              {/* Budget Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>Spent: {currencySymbol}{totalSpent.toLocaleString()}</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Remaining: {currencySymbol}{remainingBudget.toLocaleString()}
                  </span>
                  <span>Est: {currencySymbol}{totalAvg.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      spentPercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${spentPercent}%` }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Expense (e.g. Kashmiri Wazwan Dinner)..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="h-9 text-xs rounded-lg flex-1 min-w-[120px] dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="h-9 rounded-lg border border-input dark:border-slate-700 bg-background dark:bg-slate-800 px-2 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Lodging & Stays">Lodging & Stays</option>
                  <option value="Tours & Tickets">Tours & Tickets</option>
                  <option value="Local Transport">Local Transport</option>
                  <option value="Shopping & Misc">Shopping & Misc</option>
                </select>
                <div className="relative w-24">
                  <span className="absolute left-2 top-2 text-slate-400 text-xs">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="h-9 pl-6 text-xs rounded-lg w-full dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <Button type="submit" size="sm" className="h-9 px-3 rounded-lg text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log
                </Button>
              </form>

              {/* Expenses List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {expenses.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No expenses logged yet. Add your dining, tickets, or transport above!
                  </div>
                ) : (
                  expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs group"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{exp.description}</div>
                        <div className="text-[10px] text-slate-400">
                          {exp.date} · {exp.category}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {currencySymbol}{exp.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
