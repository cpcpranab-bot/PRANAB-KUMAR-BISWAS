import React, { useState } from 'react';
import { AlarmItem, DistanceUnit, GoalItem, RunSession, UserProfile } from '../../types';
import { Play, Bell, Flame, Clock, Trophy, TrendingUp, Calendar, Zap, ChevronRight, Award, Footprints } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { AiRunningCoach } from './AiRunningCoach';

interface DashboardProps {
  runs: RunSession[];
  alarms: AlarmItem[];
  userProfile: UserProfile;
  goals: GoalItem[];
  onToggleAlarm: (id: string) => void;
  onStartRun: () => void;
  onViewAlarms: () => void;
  onViewAnalytics: () => void;
  onSelectRunDetail: (run: RunSession) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  runs,
  alarms,
  userProfile,
  goals,
  onToggleAlarm,
  onStartRun,
  onViewAlarms,
  onViewAnalytics,
  onSelectRunDetail,
}) => {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');

  // Next upcoming enabled alarm
  const nextAlarm = alarms.find((a) => a.enabled) || alarms[0];

  // Aggregated metrics
  const now = Date.now();
  const oneWeekAgo = now - 7 * 86400000;
  const oneMonthAgo = now - 30 * 86400000;

  const weeklyRuns = runs.filter((r) => r.timestamp >= oneWeekAgo);
  const monthlyRuns = runs.filter((r) => r.timestamp >= oneMonthAgo);

  const totalWeeklyMeters = weeklyRuns.reduce((acc, r) => acc + r.distanceMeters, 0);
  const totalWeeklyDuration = weeklyRuns.reduce((acc, r) => acc + r.durationSeconds, 0);
  const totalWeeklyCalories = weeklyRuns.reduce((acc, r) => acc + r.caloriesBurned, 0);

  const avgWeeklyPaceSec =
    totalWeeklyMeters > 0
      ? Math.round(totalWeeklyDuration / (totalWeeklyMeters / 1000))
      : 325;

  const formatPace = (secPerKm: number) => {
    const min = Math.floor(secPerKm / 60);
    const sec = secPerKm % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Personal Records computation
  const longestRun = runs.length > 0 ? Math.max(...runs.map((r) => r.distanceMeters)) : 0;
  const fastestPace = runs.length > 0 ? Math.min(...runs.map((r) => r.averagePaceSecPerKm)) : 0;
  const totalWorkouts = runs.length;

  // 7-day chart data preparation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayRuns = runs.filter((r) => r.dateString === dateStr);
    const distanceKm = dayRuns.reduce((sum, r) => sum + r.distanceMeters / 1000, 0);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
    return { dateStr, dayLabel, distanceKm: Number(distanceKm.toFixed(1)) };
  });

  const maxChartDistance = Math.max(...last7Days.map((d) => d.distanceKm), 10);

  return (
    <div className="space-y-6">
      {/* Morning Sunrise Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Dawn Sunrise · Optimal Running Weather</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-balance">
              Rise and Stride, {userProfile.name}
            </h1>
            <p className="text-blue-100 text-sm mt-2 leading-relaxed">
              Check local morning conditions below, review your cadence & pace insights, and head out for a high-clarity morning stride.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <button
              type="button"
              onClick={onStartRun}
              className="py-4 px-7 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Start Morning Run</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle backdrop elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real-time Local Weather & Running Conditions Widget */}
      <WeatherWidget onStartRun={onStartRun} />

      {/* Quick Alarm Banner Card */}
      {nextAlarm && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Morning Wake-Up Alarm
                </span>
                <span className="text-xs font-mono-numbers font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                  {nextAlarm.time} AM
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {nextAlarm.label} · {nextAlarm.snoozeTask === 'steps_10' ? '10 Steps Mission' : 'Awakening Mission'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              type="button"
              onClick={() => onToggleAlarm(nextAlarm.id)}
              className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                nextAlarm.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle alarm on/off"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                  nextAlarm.enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <button
              type="button"
              onClick={onViewAlarms}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              Manage Alarms
            </button>
          </div>
        </div>
      )}

      {/* 4 Core KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Distance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Mileage</span>
            <Footprints className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {(totalWeeklyMeters / 1000).toFixed(1)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            km covered this week
          </p>
        </div>

        {/* Total Time */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Time on Feet</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {formatTime(totalWeeklyDuration)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active morning runs
          </p>
        </div>

        {/* Average Pace */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Pace</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {formatPace(avgWeeklyPaceSec)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            min / kilometer
          </p>
        </div>

        {/* Calories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Morning Energy</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
            {totalWeeklyCalories.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            kcal burned
          </p>
        </div>
      </div>

      {/* AI Running Assistant & Sports Scientist Analysis */}
      <AiRunningCoach runs={runs} userProfile={userProfile} goals={goals} />

      {/* 7-Day Interactive Distance Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              7-Day Distance Progression
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Daily morning kilometers logged against daily target (5.0 km)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-3 bg-blue-600 rounded-sm" />
              Completed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3 h-0.5 bg-blue-300 dark:bg-blue-800" />
              Target (5 km)
            </span>
          </div>
        </div>

        {/* SVG/Bar Chart */}
        <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
          {last7Days.map((item, idx) => {
            const heightPct = Math.min(100, (item.distanceKm / maxChartDistance) * 100);
            const isToday = idx === last7Days.length - 1;

            return (
              <div key={item.dateStr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono-numbers opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.distanceKm > 0 ? `${item.distanceKm}k` : '-'}
                </span>
                <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-full flex items-end overflow-hidden relative">
                  {/* Target line guideline */}
                  <div
                    className="absolute w-full border-t border-dashed border-blue-300 dark:border-blue-700/60 z-10"
                    style={{ bottom: `${(5 / maxChartDistance) * 100}%` }}
                  />
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isToday
                        ? 'bg-blue-600 shadow-md shadow-blue-600/30'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className={`text-xs font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'}`}>
                  {item.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Records & Recent Activities 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Records (PR) Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Personal Records
            </h3>
            <span className="text-xs text-slate-400">All-time</span>
          </div>

          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Longest Distance</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  {(longestRun / 1000).toFixed(2)} km
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-xs">
                PR
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Fastest 1K Average</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  {formatPace(fastestPace)} /km
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Highest Weekly Mileage</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  34.2 km
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-xs">
                🏅
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Early Dawn Streak</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  5 Days
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xs">
                ☀️
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts List (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Recent Morning Workouts
            </h3>
            <button
              type="button"
              onClick={onViewAnalytics}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Full History
            </button>
          </div>

          <div className="space-y-3">
            {runs.slice(0, 4).map((run) => (
              <div
                key={run.id}
                onClick={() => onSelectRunDetail(run)}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {run.feeling === 'beast' ? '🔥' : run.feeling === 'great' ? '⚡' : '☀️'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {run.routeName || 'Morning Fitness Run'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {run.dateString} · {run.startTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-base font-black text-slate-900 dark:text-white font-mono-numbers">
                      {(run.distanceMeters / 1000).toFixed(2)} km
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-numbers">
                      {formatTime(run.durationSeconds)} · {formatPace(run.averagePaceSecPerKm)}/km
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
