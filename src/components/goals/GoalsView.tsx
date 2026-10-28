import React, { useState } from 'react';
import { BadgeItem, GoalItem, RunSession } from '../../types';
import { Target, Award, Plus, Flame, Trophy, Sun, Zap, CheckCircle, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalsViewProps {
  goals: GoalItem[];
  badges: BadgeItem[];
  runs: RunSession[];
  onUpdateGoals: (goals: GoalItem[]) => void;
  onUpdateBadges: (badges: BadgeItem[]) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  badges,
  runs,
  onUpdateGoals,
  onUpdateBadges,
}) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<GoalItem>>({
    title: 'Morning 30K Week',
    type: 'weekly_distance',
    target: 30,
    unit: 'km',
    period: 'weekly',
  });
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // Calculate current progress for goals based on actual runs
  const calculateGoalProgress = (goal: GoalItem): { current: number; percentage: number } => {
    const now = Date.now();
    let relevantRuns: RunSession[] = [];

    if (goal.period === 'daily') {
      const todayStr = new Date().toISOString().split('T')[0];
      relevantRuns = runs.filter((r) => r.dateString === todayStr);
    } else if (goal.period === 'weekly') {
      const oneWeekAgo = now - 7 * 86400000;
      relevantRuns = runs.filter((r) => r.timestamp >= oneWeekAgo);
    } else if (goal.period === 'monthly') {
      const oneMonthAgo = now - 30 * 86400000;
      relevantRuns = runs.filter((r) => r.timestamp >= oneMonthAgo);
    }

    let current = 0;
    if (goal.type === 'weekly_runs') {
      current = relevantRuns.length;
    } else if (goal.type === 'morning_streak') {
      current = 5; // e.g. 5 days consecutive
    } else {
      const meters = relevantRuns.reduce((sum, r) => sum + r.distanceMeters, 0);
      current = Number((meters / 1000).toFixed(1));
    }

    const percentage = Math.min(100, Math.round((current / goal.target) * 100));
    return { current, percentage };
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target) return;

    const created: GoalItem = {
      id: `goal-${Date.now()}`,
      title: newGoal.title,
      type: newGoal.type || 'weekly_distance',
      target: Number(newGoal.target),
      unit: newGoal.unit || 'km',
      period: newGoal.period || 'weekly',
      startDate: new Date().toISOString(),
    };

    onUpdateGoals([...goals, created]);
    setCreateModalOpen(false);
  };

  const handleDeleteGoal = (id: string) => {
    onUpdateGoals(goals.filter((g) => g.id !== id));
  };

  const handleBadgeClick = (badge: BadgeItem) => {
    setSelectedBadge(badge);
    if (badge.unlockedAt) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0052FF', '#F59E0B', '#10B981'],
        });
      } catch {
        // Confetti fallback
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Goals & Milestone Achievements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay accountable with daily, weekly, and monthly targets and earn performance badges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Running Goal</span>
        </button>
      </div>

      {/* Active Goals Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 px-1">
          Active Targets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const { current, percentage } = calculateGoalProgress(goal);
            const isCompleted = percentage >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      {goal.period}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {goal.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-slate-400 hover:text-red-500 text-xs p-1"
                    title="Remove goal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar & Numbers */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                      {current} <span className="text-xs text-slate-400 font-normal">{goal.unit}</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono-numbers">
                      Target: {goal.target} {goal.unit} ({percentage}%)
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Target Completed! Fantastic running!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Badges & Rewards */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Milestone Badges ({badges.filter((b) => b.unlockedAt).length} / {badges.length} Unlocked)
          </h3>
          <span className="text-xs text-slate-400">Tap badge to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge) => {
            const isUnlocked = !!badge.unlockedAt;

            return (
              <div
                key={badge.id}
                onClick={() => handleBadgeClick(badge)}
                className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                  isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/40 shadow-sm hover:scale-105'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                    isUnlocked
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 shadow-md shadow-amber-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {badge.iconName === 'Sun' && <Sun className="w-7 h-7" />}
                  {badge.iconName === 'Award' && <Award className="w-7 h-7" />}
                  {badge.iconName === 'Zap' && <Zap className="w-7 h-7" />}
                  {badge.iconName === 'Flame' && <Flame className="w-7 h-7" />}
                  {badge.iconName === 'Trophy' && <Trophy className="w-7 h-7" />}
                  {badge.iconName === 'Gauge' && <ShieldCheck className="w-7 h-7" />}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Inspection Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-2xl">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4 ${
                selectedBadge.unlockedAt
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 shadow-xl shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Trophy className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {selectedBadge.title}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {selectedBadge.description}
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Criteria: </span>
              <span className="text-slate-500">{selectedBadge.requirement}</span>
              {selectedBadge.unlockedAt && (
                <div className="mt-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Achieved on {selectedBadge.unlockedAt}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateGoal}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Set Running Target
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. 25km Morning Challenge"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Period
                  </label>
                  <select
                    value={newGoal.period}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, period: e.target.value as GoalItem['period'] })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Target Metric
                  </label>
                  <select
                    value={newGoal.type}
                    onChange={(e) =>
                      setNewGoal({
                        ...newGoal,
                        type: e.target.value as GoalItem['type'],
                        unit: e.target.value === 'weekly_runs' ? 'runs' : 'km',
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="weekly_distance">Distance (km)</option>
                    <option value="weekly_runs">Frequency (runs)</option>
                    <option value="morning_streak">Morning Streak (days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono-numbers focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
