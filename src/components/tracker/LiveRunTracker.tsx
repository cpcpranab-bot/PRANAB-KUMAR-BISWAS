import React, { useState, useEffect, useRef } from 'react';
import { GpsPoint, MusicTrack, RunSession, SplitRecord, UserProfile } from '../../types';
import { RunMap } from './RunMap';
import { soundService } from '../../services/soundService';
import { YouTubeMusicPlayer } from '../audio/YouTubeMusicPlayer';
import { Play, Pause, Square, MapPin, Gauge, Flame, Clock, Heart, Volume2, Sparkles, CheckCircle2, ChevronRight, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveRunTrackerProps {
  userProfile: UserProfile;
  currentTrack: MusicTrack;
  onTrackChange: (track: MusicTrack) => void;
  onSaveRun: (run: RunSession) => void;
  onCancelRun: () => void;
  isRunActive: boolean;
  setIsRunActive: (active: boolean) => void;
}

export const LiveRunTracker: React.FC<LiveRunTrackerProps> = ({
  userProfile,
  currentTrack,
  onTrackChange,
  onSaveRun,
  onCancelRun,
  isRunActive,
  setIsRunActive,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [path, setPath] = useState<GpsPoint[]>([]);
  const [currentPoint, setCurrentPoint] = useState<GpsPoint | null>(null);
  const [splits, setSplits] = useState<SplitRecord[]>([]);
  const [showMetersUnit, setShowMetersUnit] = useState(false);
  const [useSimulator, setUseSimulator] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [feeling, setFeeling] = useState<RunSession['feeling']>('great');
  const [runTitle, setRunTitle] = useState('Morning Sunrise Stride');
  const [runNotes, setRunNotes] = useState('');
  const [completedSession, setCompletedSession] = useState<RunSession | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const simStepRef = useRef<number>(0);
  const lastSplitKmRef = useRef<number>(0);

  // Initial GPS positioning
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const pt: GpsPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now(),
            altitude: pos.coords.altitude || 12,
            speed: pos.coords.speed || 0,
            accuracy: pos.coords.accuracy,
          };
          setCurrentPoint(pt);
        },
        () => {
          // Fallback to default scenic city park coordinates
          setCurrentPoint({
            lat: 37.7749,
            lng: -122.4194,
            timestamp: Date.now(),
            altitude: 15,
            speed: 0,
          });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Main Run Timer and Tracking Loop
  useEffect(() => {
    if (isRunActive && !isPaused) {
      // Start 1-second ticker
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);

        // If in Simulator Mode, calculate realistic forward movement along loop
        if (useSimulator) {
          simulateNextStep();
        }
      }, 1000);

      // Start Real GPS watchPosition if not simulator
      if (!useSimulator && 'geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newPt: GpsPoint = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              timestamp: Date.now(),
              altitude: pos.coords.altitude || undefined,
              speed: pos.coords.speed || 0,
              accuracy: pos.coords.accuracy,
            };

            processNewGpsPoint(newPt);
          },
          (err) => {
            console.warn('Geolocation error:', err);
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isRunActive, isPaused, useSimulator]);

  // Haversine distance calculator between GPS points
  const calculateDistance = (p1: GpsPoint, p2: GpsPoint): number => {
    const R = 6371e3; // metres
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const processNewGpsPoint = (newPt: GpsPoint) => {
    setCurrentPoint(newPt);
    setPath((prev) => {
      if (prev.length === 0) return [newPt];
      const last = prev[prev.length - 1];
      const stepDist = calculateDistance(last, newPt);

      // Filter out GPS jump anomalies (< 0.5m or > 40m per second)
      if (stepDist >= 0.5 && stepDist <= 40) {
        const newTotalDist = distanceMeters + stepDist;
        setDistanceMeters(newTotalDist);

        const speedKmh = Number(((stepDist / 1) * 3.6).toFixed(1));
        setCurrentSpeedKmh(speedKmh);

        // Check 1-km split
        checkSplitMilestone(newTotalDist);
        return [...prev, newPt];
      }
      return prev;
    });
  };

  // Simulator step for testing / indoors
  const simulateNextStep = () => {
    simStepRef.current += 1;
    const step = simStepRef.current;
    const centerLat = currentPoint ? currentPoint.lat : 37.7749;
    const centerLng = currentPoint ? currentPoint.lng : -122.4194;

    // Smooth waterfront loop curve (~3 m/s = 10.8 km/h pace)
    const angle = (step * 0.02) % (2 * Math.PI);
    const radius = 0.006 + 0.002 * Math.sin(angle * 3);
    const lat = centerLat + radius * Math.cos(angle);
    const lng = centerLng + (radius * 1.3) * Math.sin(angle);

    const newPt: GpsPoint = {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      timestamp: Date.now(),
      speed: 3.1 + Math.sin(step / 5) * 0.3,
      altitude: 18 + Math.cos(step / 8) * 4,
    };

    setCurrentPoint(newPt);
    setPath((prev) => [...prev, newPt]);
    
    // Add realistic 3 meters per second
    const stepMeters = 3.05 + Math.random() * 0.4;
    setDistanceMeters((prev) => {
      const updated = prev + stepMeters;
      checkSplitMilestone(updated);
      return updated;
    });

    const speed = (stepMeters * 3.6);
    setCurrentSpeedKmh(Number(speed.toFixed(1)));
  };

  // Split announcer
  const checkSplitMilestone = (totalDistMeters: number) => {
    const currentKm = Math.floor(totalDistMeters / 1000);
    if (currentKm > lastSplitKmRef.current && currentKm >= 1) {
      lastSplitKmRef.current = currentKm;
      const splitTimeSec = elapsedSeconds;
      const paceForSplit = Math.round(splitTimeSec / currentKm);

      const newSplit: SplitRecord = {
        km: currentKm,
        timeSec: splitTimeSec,
        paceSecPerKm: paceForSplit,
      };

      setSplits((prev) => [...prev, newSplit]);

      // Audio coach speech cue
      if (userProfile.audioCoachEnabled) {
        const paceMin = Math.floor(paceForSplit / 60);
        const paceSec = paceForSplit % 60;
        soundService.speak(
          `${currentKm} kilometer completed. Split pace ${paceMin} minutes ${paceSec} seconds. Looking strong!`
        );
      }
    }
  };

  // Pace calculations (seconds per km)
  const currentPaceSecPerKm = distanceMeters > 50
    ? Math.round(elapsedSeconds / (distanceMeters / 1000))
    : 0;

  const formatPace = (secPerKm: number) => {
    if (secPerKm <= 0 || !isFinite(secPerKm)) return "--'--\"";
    const min = Math.floor(secPerKm / 60);
    const sec = secPerKm % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calorie expenditure calculation via MET (Metabolic Equivalent of Task)
  // Walking/Jogging MET scales with speed (approx 8.5 to 11.5 for 9-12 km/h)
  const avgSpeed = elapsedSeconds > 0 ? (distanceMeters / 1000) / (elapsedSeconds / 3600) : 0;
  const met = avgSpeed >= 12 ? 11.5 : avgSpeed >= 10 ? 9.8 : avgSpeed >= 8 ? 8.3 : 7.0;
  const estimatedCalories = Math.round(met * userProfile.weightKg * (elapsedSeconds / 3600));

  // Run Controls
  const handleStartRun = () => {
    setIsRunActive(true);
    setIsPaused(false);
    setElapsedSeconds(0);
    setDistanceMeters(0);
    setPath([]);
    setSplits([]);
    lastSplitKmRef.current = 0;
    simStepRef.current = 0;
    soundService.speak('Starting morning run. GPS tracking active.');
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      soundService.speak('Resuming morning run.');
    } else {
      setIsPaused(true);
      soundService.speak('Run paused.');
    }
  };

  const handleFinishRun = () => {
    setIsRunActive(false);
    setIsPaused(true);

    const session: RunSession = {
      id: `run-${Date.now()}`,
      timestamp: Date.now(),
      dateString: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: Math.max(elapsedSeconds, 1),
      distanceMeters: Math.round(distanceMeters),
      averagePaceSecPerKm: currentPaceSecPerKm || 320,
      caloriesBurned: Math.max(estimatedCalories, 15),
      avgSpeedKmh: Number(avgSpeed.toFixed(1)) || 10.5,
      maxSpeedKmh: Number((avgSpeed * 1.25).toFixed(1)) || 12.8,
      path: path.length > 0 ? path : (currentPoint ? [currentPoint] : []),
      splits: splits.length > 0 ? splits : [
        { km: 1, timeSec: elapsedSeconds, paceSecPerKm: currentPaceSecPerKm || 320 }
      ],
      routeName: runTitle,
      feeling: 'great',
      cadenceSpm: 172,
      notes: '',
    };

    setCompletedSession(session);
    setFinishModalOpen(true);

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // Confetti fallback
    }

    soundService.speak(`Run finished! You completed ${(distanceMeters / 1000).toFixed(2)} kilometers! Fantastic job!`);
  };

  const handleSaveCompletedSession = () => {
    if (completedSession) {
      const finalSession: RunSession = {
        ...completedSession,
        routeName: runTitle,
        feeling,
        notes: runNotes,
      };
      onSaveRun(finalSession);
      setFinishModalOpen(false);
      setCompletedSession(null);
    }
  };

  const distanceDisplay = showMetersUnit
    ? `${distanceMeters.toLocaleString(undefined, { maximumFractionDigits: 0 })} m`
    : `${(distanceMeters / 1000).toFixed(2)} km`;

  return (
    <div className="space-y-4">
      {/* Active Run Sunlight-Optimized Top Banner */}
      {isRunActive && (
        <div className="bg-blue-600 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-600/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            <span className="font-bold text-sm tracking-tight">Active Morning Run In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseSimulator(!useSimulator)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                useSimulator ? 'bg-white text-blue-700' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'
              }`}
            >
              {useSimulator ? 'Simulator Active' : 'Enable Simulator'}
            </button>
          </div>
        </div>
      )}

      {/* Main Tracking Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        
        {/* Big High-Contrast Sunlight LCD Display */}
        <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border border-slate-100 dark:border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setShowMetersUnit(!showMetersUnit)}
            className="group inline-flex flex-col items-center cursor-pointer"
            title="Click to toggle km / meters"
          >
            <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
              Distance Covered (Tap to switch unit)
            </span>
            <div className="text-6xl sm:text-7xl font-extrabold text-blue-600 dark:text-blue-400 font-mono-numbers tracking-tight group-hover:scale-105 transition-transform">
              {showMetersUnit
                ? distanceMeters.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : (distanceMeters / 1000).toFixed(2)}
            </div>
            <span className="text-base font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-1">
              {showMetersUnit ? 'Meters' : 'Kilometers'}
            </span>
          </button>
        </div>

        {/* Secondary Metrics 4-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Time Elapsed */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Time</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
              {formatTime(elapsedSeconds)}
            </div>
            <span className="text-[10px] text-slate-400">HH:MM:SS</span>
          </div>

          {/* Real-time Pace */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Pace</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
              {formatPace(currentPaceSecPerKm)}
            </div>
            <span className="text-[10px] text-slate-400">/km</span>
          </div>

          {/* Current Speed */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Speed</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
              {currentSpeedKmh.toFixed(1)}
            </div>
            <span className="text-[10px] text-slate-400">km/h</span>
          </div>

          {/* Calories Burned */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1 text-slate-400 dark:text-slate-500 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Calories</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono-numbers">
              {estimatedCalories}
            </div>
            <span className="text-[10px] text-slate-400">kcal</span>
          </div>
        </div>

        {/* Live Interactive Map View */}
        <div className="mb-6">
          <RunMap
            path={path}
            currentPoint={currentPoint}
            isTracking={isRunActive && !isPaused}
            className="h-64 sm:h-72 w-full"
          />
        </div>

        {/* Big Large Easy-To-Tap Touch Buttons (Thumb Friendly) */}
        <div className="flex items-center justify-center gap-4">
          {!isRunActive ? (
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleStartRun}
                className="flex-1 min-h-[58px] py-4 px-8 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>Start Morning Run</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseSimulator(true);
                  handleStartRun();
                }}
                className="min-h-[58px] py-4 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Simulate Run (Indoors/Demo)</span>
              </button>
            </div>
          ) : (
            <div className="w-full grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handlePauseResume}
                className={`min-h-[58px] py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                }`}
              >
                {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                <span>{isPaused ? 'Resume Run' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinishRun}
                className="min-h-[58px] py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span>Finish Run</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Integrated YouTube Running Music Player Overlay */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-blue-600" />
            Active Running Audio / YouTube Cadence
          </span>
          <span className="text-[11px] text-slate-400">Background playback enabled</span>
        </div>
        <YouTubeMusicPlayer
          currentTrack={currentTrack}
          onTrackChange={onTrackChange}
        />
      </div>

      {/* Kilometer Splits List during active run */}
      {splits.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
            Kilometer Splits Breakdown
          </h4>
          <div className="space-y-2">
            {splits.map((s) => (
              <div
                key={s.km}
                className="flex items-center justify-between py-1.5 px-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs"
              >
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  KM {s.km}
                </span>
                <span className="font-mono-numbers text-slate-600 dark:text-slate-300">
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

      {/* Finish Run Summary Modal */}
      {finishModalOpen && completedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Morning Workout Complete!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Outstanding effort! Here is your morning run summary.
              </p>
            </div>

            {/* Run Title */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Workout Title
              </label>
              <input
                type="text"
                value={runTitle}
                onChange={(e) => setRunTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Big 3 Highlights */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Distance</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  {(completedSession.distanceMeters / 1000).toFixed(2)}
                </div>
                <span className="text-[10px] text-slate-500">km</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Time</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  {formatTime(completedSession.durationSeconds)}
                </div>
                <span className="text-[10px] text-slate-500">duration</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Avg Pace</span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono-numbers">
                  {formatPace(completedSession.averagePaceSecPerKm)}
                </div>
                <span className="text-[10px] text-slate-500">/km</span>
              </div>
            </div>

            {/* Feeling Picker */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-2">
                How did this morning run feel?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'great', label: 'Great', emoji: '⚡' },
                  { id: 'beast', label: 'Beast', emoji: '🔥' },
                  { id: 'good', label: 'Steady', emoji: '☀️' },
                  { id: 'tired', label: 'Tired', emoji: '☕' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFeeling(f.id as RunSession['feeling'])}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      feeling === f.id
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base mr-1">{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Workout Notes (Optional)
              </label>
              <textarea
                value={runNotes}
                onChange={(e) => setRunNotes(e.target.value)}
                placeholder="Morning breeze, shoe feels, target heart rate..."
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
              />
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFinishModalOpen(false)}
                className="px-4 py-3 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveCompletedSession}
                className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                Save Run to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
