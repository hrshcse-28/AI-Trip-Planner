import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  User as UserIcon,
  LogOut,
  Save,
  CheckCircle2,
  Calendar,
  Compass,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [tripCount, setTripCount] = useState<number | null>(null);
  const [totalDays, setTotalDays] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state if user loads late
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
    }
  }, [user]);

  // Load user's trips to display summary stats
  useEffect(() => {
    api.trips
      .list()
      .then((res) => {
        const trips = res.trips || [];
        setTripCount(trips.length);
        const days = trips.reduce((acc: number, t: any) => acc + (t.durationDays || 0), 0);
        setTotalDays(days);
      })
      .catch((err) => {
        console.warn('Failed to load trips count for profile stats:', err);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.users.updateProfile({ name: name.trim(), bio: bio.trim() });
      if (refreshUser) {
        await refreshUser();
      }
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Profile
        </h1>
        <p className="text-slate-500 mt-1">
          Manage your personal details, travel bio, and account settings
        </p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center mb-4 shadow-md font-bold text-2xl">
                  {name ? name.charAt(0).toUpperCase() : <UserIcon className="h-10 w-10" />}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{name || 'Traveler'}</h2>
                <p className="text-slate-500 text-xs mt-0.5">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  Explorer Member
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center text-primary mb-1">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {tripCount !== null ? tripCount : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Trips</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-center text-indigo-500 mb-1">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {totalDays !== null ? totalDays : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Days Planned</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-medium"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/60 border-b border-slate-100 pb-5">
              <CardTitle className="text-lg font-bold text-slate-900">
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500">
                Update your display name and travel preferences
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="h-11 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email cannot be changed directly for security purposes.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                    Travel Bio & Interests
                  </Label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us what you love (e.g. food markets, historic ruins, mountain climbing, scenic train journeys)..."
                    className="flex w-full rounded-xl border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </CardContent>

              <div className="p-6 bg-slate-50/60 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl px-6 font-semibold shadow-sm flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
