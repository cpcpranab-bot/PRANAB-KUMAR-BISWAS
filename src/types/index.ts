export type DistanceUnit = 'km' | 'mi';

export interface AlarmItem {
  id: string;
  time: string; // "HH:MM" 24hr format
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  tone: 'sunrise_birds' | 'energetic_pulse' | 'gentle_chimes' | 'marathon_beat' | 'radar_boost';
  volumeFadeInSec: number; // 0, 15, 30, 60
  snoozeTask: 'steps_10' | 'stand_shake' | 'math_puzzle' | 'squats_5';
  lastTriggered?: string;
}

export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
  altitude?: number;
  speed?: number; // m/s
  accuracy?: number;
}

export interface SplitRecord {
  km: number;
  timeSec: number;
  paceSecPerKm: number;
  elevationChangeMeters?: number;
}

export interface RunSession {
  id: string;
  timestamp: number; // epoch ms
  dateString: string; // YYYY-MM-DD
  startTime: string; // "06:15 AM"
  durationSeconds: number;
  distanceMeters: number;
  averagePaceSecPerKm: number;
  caloriesBurned: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  path: GpsPoint[];
  splits: SplitRecord[];
  notes?: string;
  feeling?: 'great' | 'good' | 'tired' | 'beast';
  routeName?: string;
  cadenceSpm?: number;
}

export interface UserProfile {
  name: string;
  avatarSeed: string;
  age: number;
  weightKg: number;
  heightCm: number;
  gender: 'male' | 'female' | 'other';
  unit: DistanceUnit;
  audioCoachEnabled: boolean;
  audioCoachIntervalKm: number; // e.g. 1.0 km
  autoPauseEnabled: boolean;
  themeMode: 'light' | 'dark';
}

export interface GoalItem {
  id: string;
  title: string;
  type: 'daily_distance' | 'weekly_distance' | 'monthly_distance' | 'weekly_runs' | 'morning_streak';
  target: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  category: 'distance' | 'streak' | 'pace' | 'early_bird';
  requirement: string;
  unlockedAt?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  youtubeId: string;
  bpm: number;
  category: 'Morning EDM' | 'Sunrise Chill' | 'High Energy Cardio' | '170-180 BPM Cadence' | 'Lo-Fi Jog';
  thumbnailUrl: string;
}
