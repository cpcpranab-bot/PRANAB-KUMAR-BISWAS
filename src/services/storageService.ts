import { AlarmItem, BadgeItem, GoalItem, MusicTrack, RunSession, UserProfile } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'stridex_profile_v1',
  ALARMS: 'stridex_alarms_v1',
  RUNS: 'stridex_runs_v1',
  GOALS: 'stridex_goals_v1',
  BADGES: 'stridex_badges_v1',
  CURRENT_TRACK: 'stridex_current_track_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Biswas',
  avatarSeed: 'runner_biswas',
  age: 28,
  weightKg: 68,
  heightCm: 176,
  gender: 'male',
  unit: 'km',
  audioCoachEnabled: true,
  audioCoachIntervalKm: 1.0,
  autoPauseEnabled: true,
  themeMode: 'light',
};

export const DEFAULT_ALARMS: AlarmItem[] = [
  {
    id: 'alarm-1',
    time: '06:00',
    label: 'Dawn Sunrise Run',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Mon - Fri
    tone: 'sunrise_birds',
    volumeFadeInSec: 30,
    snoozeTask: 'steps_10',
  },
  {
    id: 'alarm-2',
    time: '06:45',
    label: 'Weekend Long Distance',
    enabled: true,
    days: [0, 6], // Sat - Sun
    tone: 'energetic_pulse',
    volumeFadeInSec: 15,
    snoozeTask: 'stand_shake',
  },
  {
    id: 'alarm-3',
    time: '07:15',
    label: 'Easy Recovery Jog',
    enabled: false,
    days: [2, 4],
    tone: 'gentle_chimes',
    volumeFadeInSec: 0,
    snoozeTask: 'math_puzzle',
  },
];

// Sample realistic GPS trail in scenic waterfront park loop
function generateSamplePath(centerLat = 37.7749, centerLng = -122.4194, count = 25) {
  const points = [];
  const startMs = Date.now() - 86400000;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI;
    const radius = 0.008 + 0.003 * Math.sin(angle * 2);
    points.push({
      lat: Number((centerLat + radius * Math.cos(angle)).toFixed(6)),
      lng: Number((centerLng + (radius * 1.3) * Math.sin(angle)).toFixed(6)),
      timestamp: startMs + i * 65000,
      speed: 2.8 + Math.random() * 0.4,
      altitude: 15 + Math.sin(i / 3) * 6,
    });
  }
  return points;
}

export const DEFAULT_RUNS: RunSession[] = [
  {
    id: 'run-001',
    timestamp: Date.now() - 86400000 * 1, // Yesterday
    dateString: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    startTime: '06:12 AM',
    durationSeconds: 1680, // 28m 00s
    distanceMeters: 5320, // 5.32 km
    averagePaceSecPerKm: 316, // 5:16 /km
    caloriesBurned: 395,
    avgSpeedKmh: 11.4,
    maxSpeedKmh: 13.8,
    routeName: 'Morning Bay Waterfront Loop',
    feeling: 'great',
    cadenceSpm: 168,
    notes: 'Crisp morning air, felt steady throughout km 3-4.',
    path: generateSamplePath(37.7749, -122.4194, 28),
    splits: [
      { km: 1, timeSec: 325, paceSecPerKm: 325 },
      { km: 2, timeSec: 318, paceSecPerKm: 318 },
      { km: 3, timeSec: 310, paceSecPerKm: 310 },
      { km: 4, timeSec: 314, paceSecPerKm: 314 },
      { km: 5, timeSec: 308, paceSecPerKm: 308 },
    ],
  },
  {
    id: 'run-002',
    timestamp: Date.now() - 86400000 * 3, // 3 days ago
    dateString: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    startTime: '06:30 AM',
    durationSeconds: 2420, // 40m 20s
    distanceMeters: 7450, // 7.45 km
    averagePaceSecPerKm: 325, // 5:25 /km
    caloriesBurned: 540,
    avgSpeedKmh: 11.1,
    maxSpeedKmh: 14.1,
    routeName: 'Pine Creek Trail Run',
    feeling: 'beast',
    cadenceSpm: 172,
    notes: 'Pushed the uphill sprint on final kilometer.',
    path: generateSamplePath(37.7780, -122.4150, 32),
    splits: [
      { km: 1, timeSec: 330, paceSecPerKm: 330 },
      { km: 2, timeSec: 324, paceSecPerKm: 324 },
      { km: 3, timeSec: 328, paceSecPerKm: 328 },
      { km: 4, timeSec: 320, paceSecPerKm: 320 },
      { km: 5, timeSec: 322, paceSecPerKm: 322 },
      { km: 6, timeSec: 315, paceSecPerKm: 315 },
      { km: 7, timeSec: 310, paceSecPerKm: 310 },
    ],
  },
  {
    id: 'run-003',
    timestamp: Date.now() - 86400000 * 5, // 5 days ago
    dateString: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    startTime: '06:05 AM',
    durationSeconds: 1250, // 20m 50s
    distanceMeters: 4100, // 4.10 km
    averagePaceSecPerKm: 305, // 5:05 /km
    caloriesBurned: 305,
    avgSpeedKmh: 11.8,
    maxSpeedKmh: 14.6,
    routeName: 'Dawn Fast Tempo Run',
    feeling: 'good',
    cadenceSpm: 175,
    notes: 'Fast paced intervals before work.',
    path: generateSamplePath(37.7720, -122.4220, 20),
    splits: [
      { km: 1, timeSec: 310, paceSecPerKm: 310 },
      { km: 2, timeSec: 305, paceSecPerKm: 305 },
      { km: 3, timeSec: 302, paceSecPerKm: 302 },
      { km: 4, timeSec: 300, paceSecPerKm: 300 },
    ],
  },
  {
    id: 'run-004',
    timestamp: Date.now() - 86400000 * 7, // 7 days ago
    dateString: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    startTime: '06:50 AM',
    durationSeconds: 3240, // 54m 00s
    distanceMeters: 10120, // 10.12 km
    averagePaceSecPerKm: 320, // 5:20 /km
    caloriesBurned: 760,
    avgSpeedKmh: 11.2,
    maxSpeedKmh: 13.9,
    routeName: 'Sunday Morning 10K Milestone',
    feeling: 'great',
    cadenceSpm: 170,
    notes: 'First 10K of the month! Beautiful sunrise over the harbor.',
    path: generateSamplePath(37.7810, -122.4100, 40),
    splits: [
      { km: 1, timeSec: 328, paceSecPerKm: 328 },
      { km: 2, timeSec: 322, paceSecPerKm: 322 },
      { km: 3, timeSec: 319, paceSecPerKm: 319 },
      { km: 4, timeSec: 318, paceSecPerKm: 318 },
      { km: 5, timeSec: 320, paceSecPerKm: 320 },
      { km: 6, timeSec: 317, paceSecPerKm: 317 },
      { km: 7, timeSec: 315, paceSecPerKm: 315 },
      { km: 8, timeSec: 321, paceSecPerKm: 321 },
      { km: 9, timeSec: 319, paceSecPerKm: 319 },
      { km: 10, timeSec: 308, paceSecPerKm: 308 },
    ],
  },
];

export const DEFAULT_GOALS: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'Weekly Distance Target',
    type: 'weekly_distance',
    target: 25,
    unit: 'km',
    period: 'weekly',
    startDate: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    title: 'Morning Runs Frequency',
    type: 'weekly_runs',
    target: 4,
    unit: 'runs',
    period: 'weekly',
    startDate: new Date().toISOString(),
  },
  {
    id: 'goal-3',
    title: 'Monthly Mileage Challenge',
    type: 'monthly_distance',
    target: 100,
    unit: 'km',
    period: 'monthly',
    startDate: new Date().toISOString(),
  },
  {
    id: 'goal-4',
    title: 'Early Bird Wake Streak',
    type: 'morning_streak',
    target: 7,
    unit: 'days',
    period: 'weekly',
    startDate: new Date().toISOString(),
  },
];

export const DEFAULT_BADGES: BadgeItem[] = [
  {
    id: 'badge-dawn',
    title: 'Dawn Patrol',
    description: 'Completed a run before 7:00 AM',
    iconName: 'Sun',
    category: 'early_bird',
    requirement: 'Start run before 07:00',
    unlockedAt: '2026-10-20',
  },
  {
    id: 'badge-5k',
    title: '5K Champion',
    description: 'Finished a 5K morning distance',
    iconName: 'Award',
    category: 'distance',
    requirement: 'Distance >= 5.0 km',
    unlockedAt: '2026-10-22',
  },
  {
    id: 'badge-10k',
    title: '10K Crusher',
    description: 'Completed your first 10K running session',
    iconName: 'Zap',
    category: 'distance',
    requirement: 'Distance >= 10.0 km',
    unlockedAt: '2026-10-25',
  },
  {
    id: 'badge-streak',
    title: 'Early Bird Streak',
    description: 'Logged 7 consecutive days of morning runs',
    iconName: 'Flame',
    category: 'streak',
    requirement: '7 consecutive days',
  },
  {
    id: 'badge-speed',
    title: 'Speed Demon',
    description: 'Achieve an average pace under 5:00 min/km',
    iconName: 'Gauge',
    category: 'pace',
    requirement: 'Pace < 5:00 /km',
  },
  {
    id: 'badge-century',
    title: 'Century Runner',
    description: 'Accumulate 100 total kilometers in morning runs',
    iconName: 'Trophy',
    category: 'distance',
    requirement: '100 km cumulative',
  },
];

export const CURATED_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: '175 BPM High Cadence Running Rhythm',
    artist: 'Cardio Beats Club',
    duration: '3:45',
    youtubeId: 'jfKfPfyJRdk',
    bpm: 175,
    category: '170-180 BPM Cadence',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=60',
  },
  {
    id: 'track-2',
    title: 'Morning Sunrise Chill House',
    artist: 'Horizon Sounds',
    duration: '4:12',
    youtubeId: '2Vv-BfVoq4g',
    bpm: 128,
    category: 'Sunrise Chill',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=160&auto=format&fit=crop&q=60',
  },
  {
    id: 'track-3',
    title: 'Neon Sunrise Sprint (Synthwave)',
    artist: 'RetroRunner',
    duration: '3:50',
    youtubeId: '4xDzrJKXOOY',
    bpm: 165,
    category: 'Morning EDM',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=160&auto=format&fit=crop&q=60',
  },
  {
    id: 'track-4',
    title: 'Early Dawn Lo-Fi Jog Rhythm',
    artist: 'Chillstep Beats',
    duration: '3:20',
    youtubeId: '5qap5aO4i9A',
    bpm: 140,
    category: 'Lo-Fi Jog',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&auto=format&fit=crop&q=60',
  },
  {
    id: 'track-5',
    title: 'High Octane Marathon Fuel',
    artist: 'Aero Dynamics',
    duration: '4:30',
    youtubeId: 'DWcJFNfaw90',
    bpm: 170,
    category: 'High Energy Cardio',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=160&auto=format&fit=crop&q=60',
  },
];

class StorageService {
  public getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  public getAlarms(): AlarmItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALARMS);
      return data ? JSON.parse(data) : DEFAULT_ALARMS;
    } catch {
      return DEFAULT_ALARMS;
    }
  }

  public saveAlarms(alarms: AlarmItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
  }

  public getRuns(): RunSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RUNS);
      return data ? JSON.parse(data) : DEFAULT_RUNS;
    } catch {
      return DEFAULT_RUNS;
    }
  }

  public saveRuns(runs: RunSession[]): void {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs));
  }

  public addRun(run: RunSession): void {
    const runs = this.getRuns();
    runs.unshift(run);
    this.saveRuns(runs);
  }

  public getGoals(): GoalItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  }

  public saveGoals(goals: GoalItem[]): void {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  }

  public getBadges(): BadgeItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BADGES);
      return data ? JSON.parse(data) : DEFAULT_BADGES;
    } catch {
      return DEFAULT_BADGES;
    }
  }

  public saveBadges(badges: BadgeItem[]): void {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
  }

  public getCurrentTrack(): MusicTrack {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_TRACK);
      return data ? JSON.parse(data) : CURATED_TRACKS[0];
    } catch {
      return CURATED_TRACKS[0];
    }
  }

  public saveCurrentTrack(track: MusicTrack): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_TRACK, JSON.stringify(track));
  }

  public resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.ALARMS);
    localStorage.removeItem(STORAGE_KEYS.RUNS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.BADGES);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TRACK);
  }
}

export const storageService = new StorageService();
