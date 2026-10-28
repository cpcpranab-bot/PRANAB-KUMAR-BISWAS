import React, { useState } from 'react';
import { AlarmItem } from '../../types';
import { soundService } from '../../services/soundService';
import { Plus, Bell, Volume2, Footprints, Brain, RotateCcw, Play, Check, Trash2, X } from 'lucide-react';

interface AlarmManagerProps {
  alarms: AlarmItem[];
  onUpdateAlarms: (alarms: AlarmItem[]) => void;
  onTriggerAlarmTest: (alarm: AlarmItem) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AlarmManager: React.FC<AlarmManagerProps> = ({
  alarms,
  onUpdateAlarms,
  onTriggerAlarmTest,
}) => {
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [playingPreviewTone, setPlayingPreviewTone] = useState<string | null>(null);

  const toggleAlarm = (id: string) => {
    const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    onUpdateAlarms(updated);
  };

  const deleteAlarm = (id: string) => {
    const updated = alarms.filter((a) => a.id !== id);
    onUpdateAlarms(updated);
  };

  const handleSaveAlarm = (alarmToSave: AlarmItem) => {
    if (isCreating) {
      onUpdateAlarms([...alarms, alarmToSave]);
    } else {
      onUpdateAlarms(alarms.map((a) => (a.id === alarmToSave.id ? alarmToSave : a)));
    }
    setEditingAlarm(null);
    setIsCreating(false);
    stopPreview();
  };

  const handlePreviewTone = (tone: string) => {
    if (playingPreviewTone === tone) {
      stopPreview();
    } else {
      soundService.startAlarm(tone, 0);
      setPlayingPreviewTone(tone);
    }
  };

  const stopPreview = () => {
    soundService.stopAlarm();
    setPlayingPreviewTone(null);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setEditingAlarm({
      id: `alarm-${Date.now()}`,
      time: '06:00',
      label: 'Early Morning Run',
      enabled: true,
      days: [1, 2, 3, 4, 5],
      tone: 'sunrise_birds',
      volumeFadeInSec: 30,
      snoozeTask: 'steps_10',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Smart Morning Alarms
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Wake up reliably with volume fade-in and movement-based snooze missions.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Morning Alarm</span>
        </button>
      </div>

      {/* Alarms list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alarms.map((alarm) => {
          const daysText =
            alarm.days.length === 7
              ? 'Every day'
              : alarm.days.length === 5 && !alarm.days.includes(0) && !alarm.days.includes(6)
              ? 'Weekdays (Mon-Fri)'
              : alarm.days.length === 2 && alarm.days.includes(0) && alarm.days.includes(6)
              ? 'Weekends'
              : alarm.days.map((d) => DAY_LABELS[d]).join(', ');

          return (
            <div
              key={alarm.id}
              className={`p-5 rounded-2xl border transition-all ${
                alarm.enabled
                  ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/50 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono-numbers tracking-tight">
                      {alarm.time}
                    </span>
                    <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                      AM
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {alarm.label}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{daysText}</p>
                </div>

                {/* Quick Toggle On/Off Switch */}
                <button
                  type="button"
                  onClick={() => toggleAlarm(alarm.id)}
                  aria-label={`Toggle alarm ${alarm.label}`}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                    alarm.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      alarm.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Badges / Details */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-blue-500" />
                    Fade: {alarm.volumeFadeInSec}s
                  </span>
                  <span className="flex items-center gap-1">
                    {alarm.snoozeTask === 'steps_10' && <Footprints className="w-3.5 h-3.5 text-emerald-500" />}
                    {alarm.snoozeTask === 'math_puzzle' && <Brain className="w-3.5 h-3.5 text-indigo-500" />}
                    {alarm.snoozeTask === 'stand_shake' && <RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
                    {alarm.snoozeTask === 'squats_5' && <Play className="w-3.5 h-3.5 text-pink-500" />}
                    {alarm.snoozeTask === 'steps_10' ? '10 Steps' : alarm.snoozeTask === 'math_puzzle' ? 'Math' : alarm.snoozeTask === 'stand_shake' ? 'Shake' : '5 Squats'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Test Alarm Mission Button */}
                  <button
                    type="button"
                    onClick={() => onTriggerAlarmTest(alarm)}
                    className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Test Mission
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingAlarm(alarm);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAlarm(alarm.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    aria-label="Delete alarm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {editingAlarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isCreating ? 'Set New Morning Alarm' : 'Edit Morning Alarm'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingAlarm(null);
                  stopPreview();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Time Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Wake-Up Time
                </label>
                <input
                  type="time"
                  value={editingAlarm.time}
                  onChange={(e) => setEditingAlarm({ ...editingAlarm, time: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Alarm Label
                </label>
                <input
                  type="text"
                  value={editingAlarm.label}
                  onChange={(e) => setEditingAlarm({ ...editingAlarm, label: e.target.value })}
                  placeholder="e.g. Dawn 5K Run"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Days of week */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Repeat Days
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_LABELS.map((dayName, idx) => {
                    const isSelected = editingAlarm.days.includes(idx);
                    return (
                      <button
                        key={dayName}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? editingAlarm.days.filter((d) => d !== idx)
                            : [...editingAlarm.days, idx].sort();
                          setEditingAlarm({ ...editingAlarm, days: newDays });
                        }}
                        className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {dayName.slice(0, 2)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Tone Selector with Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Wake-Up Tone
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'sunrise_birds', label: 'Sunrise Birds & Chirp' },
                    { id: 'energetic_pulse', label: 'Energetic Morning Synth' },
                    { id: 'gentle_chimes', label: 'Gentle Zen Chimes' },
                    { id: 'marathon_beat', label: '170 BPM Marathon Beat' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        editingAlarm.tone === t.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setEditingAlarm({ ...editingAlarm, tone: t.id as AlarmItem['tone'] })}
                    >
                      <span className="text-xs font-medium">{t.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewTone(t.id);
                        }}
                        className="p-1 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        title="Preview audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Fade-In */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Volume Fade-In Option
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { sec: 0, label: 'Instant' },
                    { sec: 15, label: '15 sec' },
                    { sec: 30, label: '30 sec' },
                    { sec: 60, label: '60 sec' },
                  ].map((opt) => (
                    <button
                      key={opt.sec}
                      type="button"
                      onClick={() => setEditingAlarm({ ...editingAlarm, volumeFadeInSec: opt.sec })}
                      className={`py-2 px-1 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer ${
                        editingAlarm.volumeFadeInSec === opt.sec
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Snooze with Task Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  Snooze With Task (Wake-up Mission)
                </label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'steps_10',
                      title: 'Log 10 Steps / Movement',
                      desc: 'Force yourself out of bed to silence the alarm',
                      icon: Footprints,
                    },
                    {
                      id: 'stand_shake',
                      title: 'Stand Up & Shake',
                      desc: 'Shake phone energetically to activate motor reflex',
                      icon: RotateCcw,
                    },
                    {
                      id: 'math_puzzle',
                      title: 'Quick Awakening Math',
                      desc: 'Solve simple addition to clear morning brain fog',
                      icon: Brain,
                    },
                    {
                      id: 'squats_5',
                      title: '5 Morning Squats',
                      desc: 'Jumpstart leg circulation before your morning run',
                      icon: Play,
                    },
                  ].map((task) => {
                    const Icon = task.icon;
                    const isSelected = editingAlarm.snoozeTask === task.id;
                    return (
                      <div
                        key={task.id}
                        onClick={() =>
                          setEditingAlarm({ ...editingAlarm, snoozeTask: task.id as AlarmItem['snoozeTask'] })
                        }
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {task.desc}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingAlarm(null);
                  stopPreview();
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveAlarm(editingAlarm)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
              >
                Save Alarm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
