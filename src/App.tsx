/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AlarmItem, BadgeItem, GoalItem, MusicTrack, RunSession, UserProfile } from './types';
import {
  storageService,
  DEFAULT_ALARMS,
  DEFAULT_RUNS,
  DEFAULT_GOALS,
  DEFAULT_BADGES,
  DEFAULT_PROFILE,
  CURATED_TRACKS,
} from './services/storageService';
import { soundService } from './services/soundService';

import { Dashboard } from './components/dashboard/Dashboard';
import { AlarmManager } from './components/alarm/AlarmManager';
import { AlarmMissionModal } from './components/alarm/AlarmMissionModal';
import { LiveRunTracker } from './components/tracker/LiveRunTracker';
import { GoalsView } from './components/goals/GoalsView';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { AiRunningCoach } from './components/dashboard/AiRunningCoach';
import { DownloadApkModal } from './components/common/DownloadApkModal';

import {
  Bell,
  Play,
  Activity,
  Target,
  BarChart2,
  User,
  Pause,
  Clock,
  Compass,
  Brain,
  Smartphone,
  Download,
} from 'lucide-react';

export default function App() {
  // Navigation tabs
  type TabType = 'dashboard' | 'alarms' | 'tracker' | 'coach' | 'analytics' | 'goals' | 'profile';
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Application State
  const [profile, setProfile] = useState<UserProfile>(storageService.getProfile());
  const [alarms, setAlarms] = useState<AlarmItem[]>(storageService.getAlarms());
  const [runs, setRuns] = useState<RunSession[]>(storageService.getRuns());
  const [goals, setGoals] = useState<GoalItem[]>(storageService.getGoals());
  const [badges, setBadges] = useState<BadgeItem[]>(storageService.getBadges());
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(storageService.getCurrentTrack());

  // Active run state
  const [isRunActive, setIsRunActive] = useState(false);
  const [apkModalOpen, setApkModalOpen] = useState(false);

  // Triggered Alarm state
  const [activeAlarmModal, setActiveAlarmModal] = useState<AlarmItem | null>(null);
  const [selectedRunDetail, setSelectedRunDetail] = useState<RunSession | null>(null);

  // Real-time alarm scheduler (checks every second for alarm time match)
  useEffect(() => {
    const alarmInterval = setInterval(() => {
      if (activeAlarmModal) return; // already ringing

      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${currentHours}:${currentMinutes}`;
      const currentDay = now.getDay();
      const currentSeconds = now.getSeconds();

      // Only check on 0th second of each minute
      if (currentSeconds === 0) {
        const matchingAlarm = alarms.find(
          (a) => a.enabled && a.time === currentTimeString && a.days.includes(currentDay)
        );

        if (matchingAlarm) {
          setActiveAlarmModal(matchingAlarm);
        }
      }
    }, 1000);

    return () => clearInterval(alarmInterval);
  }, [alarms, activeAlarmModal]);

  // Persist handlers
  const handleUpdateAlarms = (newAlarms: AlarmItem[]) => {
    setAlarms(newAlarms);
    storageService.saveAlarms(newAlarms);
  };

  const handleToggleAlarm = (id: string) => {
    const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    handleUpdateAlarms(updated);
  };

  const handleSaveRun = (newRun: RunSession) => {
    const updatedRuns = [newRun, ...runs];
    setRuns(updatedRuns);
    storageService.saveRuns(updatedRuns);

    // Evaluate badges unlock
    evaluateBadgeUnlocks(newRun, updatedRuns);
    setIsRunActive(false);
    setActiveTab('analytics');
    setSelectedRunDetail(newRun);
  };

  const evaluateBadgeUnlocks = (newRun: RunSession, allRuns: RunSession[]) => {
    const totalDistMeters = allRuns.reduce((sum, r) => sum + r.distanceMeters, 0);
    const updatedBadges = badges.map((badge) => {
      if (badge.unlockedAt) return badge;

      let shouldUnlock = false;
      const todayDate = new Date().toISOString().split('T')[0];

      if (badge.id === 'badge-5k' && newRun.distanceMeters >= 5000) shouldUnlock = true;
      if (badge.id === 'badge-10k' && newRun.distanceMeters >= 10000) shouldUnlock = true;
      if (badge.id === 'badge-speed' && newRun.averagePaceSecPerKm <= 300) shouldUnlock = true;
      if (badge.id === 'badge-century' && totalDistMeters >= 100000) shouldUnlock = true;
      if (badge.id === 'badge-dawn') shouldUnlock = true;

      return shouldUnlock ? { ...badge, unlockedAt: todayDate } : badge;
    });

    setBadges(updatedBadges);
    storageService.saveBadges(updatedBadges);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    storageService.saveProfile(newProfile);
  };

  const handleUpdateGoals = (newGoals: GoalItem[]) => {
    setGoals(newGoals);
    storageService.saveGoals(newGoals);
  };

  const handleUpdateBadges = (newBadges: BadgeItem[]) => {
    setBadges(newBadges);
    storageService.saveBadges(newBadges);
  };

  const handleTrackChange = (track: MusicTrack) => {
    setCurrentTrack(track);
    storageService.saveCurrentTrack(track);
  };

  const handleResetData = () => {
    storageService.resetToDefaults();
    setProfile(DEFAULT_PROFILE);
    setAlarms(DEFAULT_ALARMS);
    setRuns(DEFAULT_RUNS);
    setGoals(DEFAULT_GOALS);
    setBadges(DEFAULT_BADGES);
    setCurrentTrack(CURATED_TRACKS[0]);
    setIsRunActive(false);
  };

  const triggerAlarmTest = (alarm: AlarmItem) => {
    setActiveAlarmModal(alarm);
  };

  return (
    <div className={`min-h-screen ${profile.themeMode === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. Universal Top Bar Contract (Wordmark, Links, 1 Primary Action) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5">
          
          {/* Zone 1: Single element wordmark */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-md shadow-blue-600/30">
              R4B
            </div>
            <span className="text-xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
              RUN 4 BISWAS
            </span>
          </div>

          {/* Zone 2: Single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('alarms')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'alarms' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Morning Alarms
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'tracker' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Live Run
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('coach')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'coach' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              AI Coach
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('goals')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'goals' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Goals & Badges
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
              }`}
            >
              Settings
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + APK Install */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setApkModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Download APK / Install on Android"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install APK</span>
            </button>

            {isRunActive ? (
              <button
                type="button"
                onClick={() => setActiveTab('tracker')}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Return to Active Run</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tracker');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Run</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Persistent Background Run Notification Banner (if running and on other tab) */}
      {isRunActive && activeTab !== 'tracker' && (
        <div className="sticky top-[58px] z-30 bg-blue-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>Morning Run in Progress (GPS Active)</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className="px-3 py-1 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              View Active Screen
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <Dashboard
            runs={runs}
            alarms={alarms}
            userProfile={profile}
            goals={goals}
            onToggleAlarm={handleToggleAlarm}
            onStartRun={() => setActiveTab('tracker')}
            onViewAlarms={() => setActiveTab('alarms')}
            onViewAnalytics={() => setActiveTab('analytics')}
            onSelectRunDetail={(run) => {
              setSelectedRunDetail(run);
              setActiveTab('analytics');
            }}
          />
        )}

        {activeTab === 'coach' && (
          <div className="space-y-6">
            <AiRunningCoach runs={runs} userProfile={profile} goals={goals} />
          </div>
        )}

        {activeTab === 'alarms' && (
          <AlarmManager
            alarms={alarms}
            onUpdateAlarms={handleUpdateAlarms}
            onTriggerAlarmTest={triggerAlarmTest}
          />
        )}

        {activeTab === 'tracker' && (
          <LiveRunTracker
            userProfile={profile}
            currentTrack={currentTrack}
            onTrackChange={handleTrackChange}
            onSaveRun={handleSaveRun}
            onCancelRun={() => setIsRunActive(false)}
            isRunActive={isRunActive}
            setIsRunActive={setIsRunActive}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            runs={runs}
            selectedRunDetail={selectedRunDetail}
            onSelectRunDetail={setSelectedRunDetail}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            badges={badges}
            runs={runs}
            onUpdateGoals={handleUpdateGoals}
            onUpdateBadges={handleUpdateBadges}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            userProfile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetData={handleResetData}
            onOpenApkModal={() => setApkModalOpen(true)}
          />
        )}
      </main>

      {/* Smart Alarm Mission Modal */}
      {activeAlarmModal && (
        <AlarmMissionModal
          alarm={activeAlarmModal}
          isOpen={true}
          onDismiss={() => {
            soundService.stopAlarm();
            setActiveAlarmModal(null);
          }}
          onStartRunNow={() => {
            setActiveAlarmModal(null);
            setActiveTab('tracker');
          }}
        />
      )}

      {/* Download APK & Android Install Modal */}
      <DownloadApkModal
        isOpen={apkModalOpen}
        onClose={() => setApkModalOpen(false)}
      />

      {/* 2. Mobile Bottom Tab Bar (Thumb Zone Ergonomics, 44px+ hitboxes) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 items-center h-14">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alarms')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'alarms' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Alarms</span>
          </button>

          {/* Center Run Trigger */}
          <button
            type="button"
            onClick={() => setActiveTab('tracker')}
            className="min-h-[48px] flex flex-col items-center justify-center relative cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              isRunActive ? 'bg-red-600 shadow-red-600/30' : 'bg-blue-600 shadow-blue-600/30'
            }`}>
              {isRunActive ? <Activity className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </div>
            <span className={`text-[10px] mt-1 font-bold ${activeTab === 'tracker' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
              Run
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">History</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('goals')}
            className={`min-h-[44px] flex flex-col items-center justify-center transition-colors cursor-pointer ${
              activeTab === 'goals' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Goals</span>
          </button>
        </div>
      </div>

    </div>
  );
}
