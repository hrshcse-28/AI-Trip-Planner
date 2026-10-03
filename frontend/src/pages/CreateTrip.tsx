import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MapPin, CalendarDays, Wallet } from 'lucide-react';

export default function CreateTrip() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    // Mock API call
    setTimeout(() => {
      setIsGenerating(false);
      navigate('/trip/new-mock-id');
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Plan a New Adventure</h1>
        <p className="text-slate-500 mt-2">Fill in the details below and let AI craft your perfect itinerary.</p>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b pb-6">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> 
            Trip Details
          </CardTitle>
          <CardDescription>Tell us about your dream vacation.</CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerate}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" /> Destination
              </Label>
              <Input id="destination" placeholder="e.g. Rome, Italy or Tokyo, Japan" required className="h-11" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" /> Duration (Days)
                </Label>
                <Input id="duration" type="number" min="1" max="30" placeholder="e.g. 5" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-500" /> Budget Level
                </Label>
                <select 
                  id="budget" 
                  className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select budget</option>
                  <option value="budget">Budget-Friendly</option>
                  <option value="moderate">Moderate</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests & Preferences (Optional)</Label>
              <Input id="interests" placeholder="e.g. Museums, Food, Hiking, Relaxing" className="h-11" />
            </div>
          </CardContent>
          <div className="p-6 pt-0 bg-slate-50/50 rounded-b-xl border-t mt-6 flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-pulse" /> Generating Itinerary...
                </>
              ) : (
                'Generate Itinerary'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
