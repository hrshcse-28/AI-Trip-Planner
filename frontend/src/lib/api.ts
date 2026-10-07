const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // for httpOnly cookie (refresh token)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    refresh: () =>
      request<{ user: any; accessToken: string }>('/api/auth/refresh', {
        method: 'POST',
      }),
    logout: () =>
      request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
    me: () => request<{ user: any }>('/api/auth/me'),
  },

  // ── Trips ───────────────────────────────────────────────────────────────

  trips: {
    create: (data: {
      destination: string;
      durationDays: number;
      budgetLevel: string;
      interests?: string;
      title?: string;
    }) =>
      request<{ trip: any }>('/api/trips', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: () => request<{ trips: any[] }>('/api/trips'),
    get: (id: string) => request<{ trip: any }>(`/api/trips/${id}`),
    update: (id: string, data: any) =>
      request<{ trip: any }>(`/api/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/trips/${id}`, { method: 'DELETE' }),
    generate: (id: string) =>
      request<{ trip: any }>(`/api/trips/${id}/generate`, { method: 'POST' }),
    toggleActivity: (tripId: string, activityId: string) =>
      request<{ activity: any }>(
        `/api/trips/${tripId}/activities/${activityId}/complete`,
        { method: 'PATCH' }
      ),
    addActivity: (tripId: string, dayId: string, data: {
      time: string;
      title: string;
      description?: string;
      location: string;
      category?: string;
      latitude?: number | null;
      longitude?: number | null;
    }) =>
      request<{ activity: any }>(`/api/trips/${tripId}/days/${dayId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteActivity: (tripId: string, activityId: string) =>
      request<{ message: string }>(`/api/trips/${tripId}/activities/${activityId}`, {
        method: 'DELETE',
      }),
    getPublic: (id: string) => request<{ trip: any }>(`/api/trips/public/${id}`),
    fork: (id: string) =>
      request<{ trip: any }>(`/api/trips/${id}/fork`, { method: 'POST' }),
    chat: (id: string, message: string, history?: { role: string; content: string }[]) =>
      request<{ reply: string; suggestions: string[] }>(`/api/trips/${id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, history }),
      }),
    getWeather: (id: string) =>
      request<{ forecast: any[]; source: string }>(`/api/trips/${id}/weather`),
    reorderActivity: (tripId: string, activityId: string, direction: 'up' | 'down') =>
      request<{ message: string }>(`/api/trips/${tripId}/activities/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ activityId, direction }),
      }),
    getCulture: (id: string) =>
      request<{ destination: string; guide: any }>(`/api/trips/${id}/culture`),
    optimizeDay: (tripId: string, dayId: string) =>
      request<{ message: string; day: any }>(`/api/trips/${tripId}/days/${dayId}/optimize`, {
        method: 'POST',
      }),
    getAudioGuide: (id: string) =>
      request<{ destination: string; totalChapters: number; chapters: any[] }>(
        `/api/trips/${id}/audio-guide`
      ),
    nlpCreate: (prompt: string, autoCreate?: boolean) =>
      request<{ parsedPlan: any; trip?: any }>('/api/trips/nlp-create', {
        method: 'POST',
        body: JSON.stringify({ prompt, autoCreate }),
      }),
    reduceBudget: (id: string, targetReductionINR: number) =>
      request<{
        tripId: string;
        targetReductionINR: number;
        totalPotentialSavingsINR: number;
        suggestions: { category: string; savingINR: number; title: string; detail: string }[];
      }>(`/api/trips/${id}/budget-reduce`, {
        method: 'POST',
        body: JSON.stringify({ targetReductionINR }),
      }),
  },

  // ── Destinations (India Travel Discovery) ─────────────────────────────────

  destinations: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{
        destinations: any[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
      }>(`/api/destinations${qs}`);
    },
    get: (id: string) => request<{ destination: any }>(`/api/destinations/${id}`),
    getTrending: () => request<{ destinations: any[] }>('/api/destinations/trending'),
    getHiddenGems: () => request<{ destinations: any[] }>('/api/destinations/hidden-gems'),
    getStates: () => request<{ states: any[] }>('/api/destinations/states'),
    getFestivals: () => request<{ festivals: any[] }>('/api/destinations/festivals'),
    compare: (data: { destinationIds?: string[]; destinationNames?: string[] }) =>
      request<{ comparison: any[] }>('/api/destinations/compare', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    semanticSearch: (query: string) =>
      request<{ query: string; count: number; results: { destination: any; score: number; matchReasons: string[] }[] }>(
        '/api/destinations/semantic-search',
        {
          method: 'POST',
          body: JSON.stringify({ query }),
        }
      ),
  },


  // ── Bookings ────────────────────────────────────────────────────────────

  bookings: {
    create: (tripId: string, data: {
      type: string;
      title: string;
      confirmationNo?: string;
      provider?: string;
      dateTime?: string;
      location?: string;
      cost?: number;
      notes?: string;
    }) =>
      request<{ booking: any }>(`/api/trips/${tripId}/bookings`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string, bookingId: string) =>
      request<{ message: string }>(`/api/trips/${tripId}/bookings/${bookingId}`, {
        method: 'DELETE',
      }),
  },

  // ── Collaborators ───────────────────────────────────────────────────────

  collaborators: {
    create: (tripId: string, data: { name: string; email: string; role?: string }) =>
      request<{ collaborator: any }>(`/api/trips/${tripId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string, collaboratorId: string) =>
      request<{ message: string }>(`/api/trips/${tripId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      }),
  },

  // ── Journal & Memories ──────────────────────────────────────────────────

  journal: {
    create: (tripId: string, data: {
      title: string;
      content: string;
      dayNumber?: number;
      photoUrl?: string;
      rating?: number;
      location?: string;
    }) =>
      request<{ journalEntry: any }>(`/api/trips/${tripId}/journal`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (tripId: string, journalId: string) =>
      request<{ message: string }>(`/api/trips/${tripId}/journal/${journalId}`, {
        method: 'DELETE',
      }),
  },

  // ── Users ───────────────────────────────────────────────────────────────

  users: {
    updateProfile: (data: { name?: string; bio?: string }) =>
      request<{ user: any }>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};

