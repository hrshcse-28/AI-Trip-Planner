import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { Collaborator, User as UserType } from '@/types';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Crown,
  Loader2,
  Calculator,
  Share2,
} from 'lucide-react';

interface TripCollaboratorsHubProps {
  tripId: string;
  owner?: UserType | { name: string; email?: string } | null;
  initialCollaborators?: Collaborator[];
  totalBudget?: number;
  totalSpent?: number;
  onUpdated?: () => void;
}

export function TripCollaboratorsHub({
  tripId,
  owner,
  initialCollaborators = [],
  totalBudget = 0,
  totalSpent = 0,
  onUpdated,
}: TripCollaboratorsHubProps) {
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initialCollaborators);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Missing Information', 'Please provide both name and email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.collaborators.create(tripId, {
        name: name.trim(),
        email: email.trim(),
        role,
      });

      setCollaborators((prev) => [...prev, res.collaborator]);
      toast.success('Invitation Sent', `${name} has been added to this trip as an ${role}!`);

      setName('');
      setEmail('');
      setRole('editor');
      setShowInviteModal(false);

      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error('Invite Failed', err.message || 'Could not add collaborator.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (collabId: string, collabName: string) => {
    if (!window.confirm(`Remove ${collabName} from this trip?`)) return;
    try {
      await api.collaborators.delete(tripId, collabId);
      setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
      toast.info('Collaborator Removed', `${collabName} no longer has access.`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      toast.error('Removal Failed', err.message);
    }
  };

  const totalTravelers = 1 + collaborators.length; // Owner + collaborators
  const estPerPerson = totalBudget > 0 ? Math.round(totalBudget / totalTravelers) : 0;
  const spentPerPerson = totalSpent > 0 ? (totalSpent / totalTravelers).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold uppercase tracking-wider text-violet-200">
            <Users className="w-3.5 h-3.5 text-violet-400" />
            <span>Multi-Traveler Sync</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Travel Companions & Collaboration
          </h2>
          <p className="text-slate-300 text-sm max-w-lg">
            Plan your adventure together. Invite friends, family, or partners to collaborate on schedules, manage reservations, and split group costs.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-right min-w-[190px]">
            <span className="text-xs text-slate-300 font-medium">Party Size</span>
            <div className="text-2xl font-black text-white mt-0.5">
              {totalTravelers} {totalTravelers === 1 ? 'Traveler' : 'Travelers'}
            </div>
            {totalBudget > 0 && (
              <div className="text-xs text-emerald-400 font-semibold mt-1">
                ~${estPerPerson} / person
              </div>
            )}
          </div>

          <Button
            onClick={() => setShowInviteModal(!showInviteModal)}
            className="rounded-xl h-11 px-5 font-semibold bg-white text-slate-900 hover:bg-slate-100 shadow-md flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-primary" />
            {showInviteModal ? 'Cancel' : 'Invite Companion'}
          </Button>
        </div>
      </div>

      {/* Invite Companion Form Card */}
      {showInviteModal && (
        <Card className="rounded-2xl border-primary/30 shadow-lg bg-gradient-to-b from-primary/5 to-transparent">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Invite Co-Traveler
            </CardTitle>
            <CardDescription className="text-xs">
              Collaborators can view the live itinerary, check off packing items, and add shared bookings.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <Input
                    placeholder="e.g. Jordan Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="e.g. jordan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Permission Level</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    <option value="editor">Editor (Can edit & add activities)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Sending Invite...
                    </>
                  ) : (
                    'Add Companion'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Group Cost Splitting Breakdown Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl p-4 border-slate-200/80 bg-slate-50/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-100 text-violet-700">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Projected Split
            </div>
            <div className="text-lg font-black text-slate-900">
              ~${estPerPerson} <span className="text-xs font-normal text-slate-500">/ person</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 border-slate-200/80 bg-slate-50/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Spent Split
            </div>
            <div className="text-lg font-black text-slate-900">
              ${spentPerPerson} <span className="text-xs font-normal text-slate-500">/ person</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl p-4 border-slate-200/80 bg-slate-50/60 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Travel Roster
            </div>
            <div className="text-lg font-black text-slate-900">
              {totalTravelers} Confirmed
            </div>
          </div>
        </Card>
      </div>

      {/* Travelers List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Party Members</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Trip Owner Card */}
          <Card className="rounded-2xl border-slate-200/80 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-primary text-white font-bold flex items-center justify-center text-sm shadow-sm">
                {(owner?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900">
                    {owner?.name || 'Trip Leader'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Crown className="w-3 h-3 text-amber-600" /> Host
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />
                  <span>{owner?.email || 'Trip creator'}</span>
                </div>
              </div>
            </div>

            <span className="text-xs text-slate-400 font-medium">Owner</span>
          </Card>

          {/* Invited Collaborators */}
          {collaborators.map((c) => (
            <Card
              key={c.id}
              className="rounded-2xl border-slate-200/80 p-4 flex items-center justify-between hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{c.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.role === 'editor'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {c.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    <span>{c.email}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRemove(c.id, c.name)}
                className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors rounded-lg hover:bg-rose-50"
                title="Remove collaborator"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
