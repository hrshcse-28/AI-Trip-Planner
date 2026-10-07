export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  dayId: string;
  sortOrder: number;
  time: string;
  title: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  category?: string | null;
  isCompleted: boolean;
}

export interface Day {
  id: string;
  tripId: string;
  dayNumber: number;
  date?: string | null;
  summary?: string | null;
  activities: Activity[];
}

export interface Booking {
  id: string;
  tripId: string;
  type: 'flight' | 'hotel' | 'train' | 'car' | 'activity' | 'other';
  title: string;
  confirmationNo?: string | null;
  provider?: string | null;
  dateTime?: string | null;
  location?: string | null;
  cost?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  uvIndex: number;
  condition: string;
  icon: string;
  advice: string;
}

export interface Collaborator {
  id: string;
  tripId: string;
  name: string;
  email: string;
  role: 'editor' | 'viewer';
  avatarUrl?: string | null;
  createdAt: string;
}

export interface CultureGuide {
  customs: string[];
  etiquette: { rule: string; explanation: string }[];
  phrases: { phrase: string; translation: string; pronunciation: string }[];
  scamsToAvoid: string[];
  diningTips: string[];
}

export interface JournalEntry {
  id: string;
  tripId: string;
  title: string;
  content: string;
  dayNumber?: number | null;
  photoUrl?: string | null;
  rating?: number | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AudioGuideChapter {
  id: string;
  title: string;
  location: string;
  category: 'history' | 'architecture' | 'mythology' | 'culinary' | 'nature';
  durationMin: number;
  triviaFact: string;
  narrativeScript: string;
  photoUrl: string;
}


export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  budgetLevel: string;
  interests?: string | null;
  durationDays: number;
  startDate?: string | null;
  endDate?: string | null;
  coverImageUrl?: string | null;
  status: string;
  days: Day[];
  bookings?: Booking[];
  collaborators?: Collaborator[];
  journalEntries?: JournalEntry[];
  user?: {
    name: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

