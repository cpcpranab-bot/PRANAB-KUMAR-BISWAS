import React, { useState } from 'react';
import { RunSession } from '../../types';
import { RunMap } from '../tracker/RunMap';
import { Calendar, Download, Filter, MapPin, Gauge, Flame, Clock, ChevronRight, X, Heart } from 'lucide-react';

interface AnalyticsViewProps {
  runs: RunSession[];
  selectedRunDetail: RunSession | null;
  onSelectRunDetail: (run: RunSession | null) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  runs,
  selectedRunDetail,
  onSelectRunDetail,
}) => {
  const [filterType, setFilterType] = useState<'all' | '5k' | '10k' | 'great'>('all');

  const filteredRuns = runs.filter((r) => {
    if (filterType === '5k') return r.distanceMeters >= 5000;
    if (filterType === '10k') return r.distanceMeters >= 10000;
    if (filterType === 'great') return r.feeling === 'great' || r.feeling === 'beast';
    return true;
  });

  const formatPace = (secPerKm: number) => {
    const min = Math.floor(secPerKm / 60);
    const sec = secPerKm % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  // Export run as JSON or GPX
  const exportRunData = (run: RunSession) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `run4biswas-run-${run.dateString}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Workout History & Route Analytics
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete archive of morning sessions with GPS route maps, elevation, and kilometer splits.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {[
            { id: 'all', label: 'All Runs' },
            { id: '5k', label: '5K+' },
            { id: '10k', label: '10K+' },
            { id: 'great', label: 'High Energy' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === f.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table / Cards List */}
      <div className="space-y-3">
        {filteredRuns.map((run) => (
          <div
            key={run.id}
            onClick={() => onSelectRunDetail(run)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 rounded-2xl p-5 shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shrink-0">
                {run.feeling === 'beast' ? '🔥' : run.feeling === 'great' ? '⚡' : '☀️'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {run.routeName || 'Morning Fitness Run'}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {run.startTime}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {run.dateString} {run.notes && `· "${run.notes}"`}
                </p>
              </div>
            </div>

            {/* Metrics strip */}
            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Distance</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono-numbers">
                  {(run.distanceMeters / 1000).toFixed(2)} km
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono-numbers">
                  {formatTime(run.durationSeconds)}
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Avg Pace</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono-numbers">
                  {formatPace(run.averagePaceSecPerKm)} /km
                </div>
              </div>

              <div className="text-center sm:text-right hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400">Calories</span>
                <div className="text-lg font-black text-amber-500 font-mono-numbers">
                  {run.caloriesBurned} kcal
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Run Modal */}
      {selectedRunDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  Workout Detail · {selectedRunDetail.dateString} {selectedRunDetail.startTime}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedRunDetail.routeName || 'Morning Fitness Run'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectRunDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* GPS Route Map View */}
            <div className="mb-6">
              <RunMap
                path={selectedRunDetail.path}
                currentPoint={selectedRunDetail.path[selectedRunDetail.path.length - 1] || null}
                isTracking={false}
                className="h-64 w-full"
              />
            </div>

            {/* 4 Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Distance</span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers">
                  {(selectedRunDetail.distanceMeters / 1000).toFixed(2)} km
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers">
                  {formatTime(selectedRunDetail.durationSeconds)}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pace</span>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers">
                  {formatPace(selectedRunDetail.averagePaceSecPerKm)} /km
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Calories</span>
                <div className="text-xl font-black text-amber-500 font-mono-numbers">
                  {selectedRunDetail.caloriesBurned} kcal
                </div>
              </div>
            </div>

            {/* Splits list */}
            {selectedRunDetail.splits && selectedRunDetail.splits.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                  Split Kilometers Performance
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedRunDetail.splits.map((s) => (
                    <div
                      key={s.km}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs"
                    >
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        Kilometer {s.km}
                      </span>
                      <span className="font-mono-numbers text-slate-500">
                        {formatTime(s.timeSec)}
                      </span>
                      <span className="font-mono-numbers font-semibold text-slate-900 dark:text-white">
                        {formatPace(s.paceSecPerKm)} /km
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => exportRunData(selectedRunDetail)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Run JSON</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRunDetail(null)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
