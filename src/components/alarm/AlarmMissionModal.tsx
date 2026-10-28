import React, { useState, useEffect, useRef } from 'react';
import { AlarmItem } from '../../types';
import { soundService } from '../../services/soundService';
import { Bell, Flame, CheckCircle, Volume2, Footprints, Brain, RotateCcw, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AlarmMissionModalProps {
  alarm: AlarmItem;
  isOpen: boolean;
  onDismiss: () => void;
  onStartRunNow: () => void;
}

export const AlarmMissionModal: React.FC<AlarmMissionModalProps> = ({
  alarm,
  isOpen,
  onDismiss,
  onStartRunNow,
}) => {
  // Steps task state
  const [stepCount, setStepCount] = useState(0);
  const targetSteps = 10;

  // Stand & Shake task state
  const [shakeProgress, setShakeProgress] = useState(0);
  const targetShake = 100;

  // Math task state
  const [mathProblem, setMathProblem] = useState({ q: '27 + 38', ans: 65 });
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  // Squats task state
  const [squatCount, setSquatCount] = useState(0);
  const targetSquats = 5;

  const [isCompleted, setIsCompleted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(20);
  const volumeTimerRef = useRef<number | null>(null);

  // Initialize mission when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsCompleted(false);
      setStepCount(0);
      setShakeProgress(0);
      setSquatCount(0);
      setUserMathAnswer('');
      setMathError(false);

      // Generate random awakening math
      const n1 = Math.floor(Math.random() * 40) + 15;
      const n2 = Math.floor(Math.random() * 40) + 15;
      setMathProblem({ q: `${n1} + ${n2}`, ans: n1 + n2 });

      // Start the alarm tone
      soundService.startAlarm(alarm.tone, alarm.volumeFadeInSec);

      // Visual volume ramp animation indicator
      setVolumeLevel(25);
      const startTime = Date.now();
      const fadeDurationMs = Math.max(alarm.volumeFadeInSec, 1) * 1000;
      volumeTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round(25 + (elapsed / fadeDurationMs) * 75));
        setVolumeLevel(pct);
        if (pct >= 100 && volumeTimerRef.current) {
          clearInterval(volumeTimerRef.current);
        }
      }, 500);

      // Accelerometer support if user is on mobile
      const handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
          const delta = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
          if (delta > 14) {
            handleStepOrShake();
          }
        }
      };

      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', handleMotion);
      }

      return () => {
        if (volumeTimerRef.current) clearInterval(volumeTimerRef.current);
        if (window.DeviceMotionEvent) {
          window.removeEventListener('devicemotion', handleMotion);
        }
      };
    } else {
      soundService.stopAlarm();
    }
  }, [isOpen, alarm]);

  const handleStepOrShake = () => {
    soundService.playStepChime();
    if (alarm.snoozeTask === 'steps_10') {
      setStepCount((prev) => {
        const next = prev + 1;
        if (next >= targetSteps) {
          triggerSuccess();
        }
        return Math.min(targetSteps, next);
      });
    } else if (alarm.snoozeTask === 'stand_shake') {
      setShakeProgress((prev) => {
        const next = prev + 20;
        if (next >= targetShake) {
          triggerSuccess();
        }
        return Math.min(targetShake, next);
      });
    } else if (alarm.snoozeTask === 'squats_5') {
      setSquatCount((prev) => {
        const next = prev + 1;
        if (next >= targetSquats) {
          triggerSuccess();
        }
        return Math.min(targetSquats, next);
      });
    }
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userMathAnswer.trim(), 10) === mathProblem.ans) {
      soundService.playStepChime();
      triggerSuccess();
    } else {
      setMathError(true);
      setUserMathAnswer('');
      setTimeout(() => setMathError(false), 1200);
    }
  };

  const triggerSuccess = () => {
    setIsCompleted(true);
    soundService.stopAlarm();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0052FF', '#00C853', '#FFFFFF', '#60A5FA'],
      });
    } catch {
      // Confetti fallback
    }
    soundService.speak("Mission complete! You're awake. Let's conquer this morning run!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 overflow-hidden text-center">
        
        {/* Top Alarm Pulse Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-blue-600/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            {!isCompleted && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
              </span>
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isCompleted ? 'Morning Mission Accomplished!' : 'Rise & Stride! Wake-Up Alarm'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {alarm.label} ({alarm.time})
          </p>

          {/* Volume Fade In Indicator */}
          {!isCompleted && alarm.volumeFadeInSec > 0 && (
            <div className="flex items-center gap-2 mt-3 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Volume fade-in: {volumeLevel}%</span>
            </div>
          )}
        </div>

        {/* Mission Content */}
        {!isCompleted ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">
                {alarm.snoozeTask === 'steps_10' && 'Task: Log 10 Morning Steps'}
                {alarm.snoozeTask === 'stand_shake' && 'Task: Stand Up & Shake Phone'}
                {alarm.snoozeTask === 'math_puzzle' && 'Task: Quick Awakening Math'}
                {alarm.snoozeTask === 'squats_5' && 'Task: 5 Morning Squats'}
              </span>
            </div>

            {/* Task 1: 10 Steps */}
            {alarm.snoozeTask === 'steps_10' && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Stand up out of bed! Walk or tap below 10 times to silence the alarm.
                </p>
                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono-numbers mb-4">
                  {stepCount} / {targetSteps}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-5">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${(stepCount / targetSteps) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStepOrShake}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Footprints className="w-5 h-5" />
                  <span>Log Step / Movement</span>
                </button>
              </div>
            )}

            {/* Task 2: Stand & Shake */}
            {alarm.snoozeTask === 'stand_shake' && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Get on your feet! Vigorously shake your phone to energize your body.
                </p>
                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono-numbers mb-4">
                  {shakeProgress}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-5">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${shakeProgress}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStepOrShake}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  <span>Shake / Tap Energy Surge</span>
                </button>
              </div>
            )}

            {/* Task 3: Awakening Math */}
            {alarm.snoozeTask === 'math_puzzle' && (
              <form onSubmit={handleMathSubmit}>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Solve this quick equation to prove your brain is booted:
                </p>
                <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono-numbers mb-4">
                  {mathProblem.q} = ?
                </div>
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={userMathAnswer}
                  onChange={(e) => setUserMathAnswer(e.target.value)}
                  placeholder="Enter answer"
                  autoFocus
                  className={`w-full text-center text-2xl font-bold py-3 px-4 rounded-xl border ${
                    mathError
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  } mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600`}
                />
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Brain className="w-5 h-5" />
                  <span>Submit Answer & Wake Up</span>
                </button>
              </form>
            )}

            {/* Task 4: 5 Squats */}
            {alarm.snoozeTask === 'squats_5' && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Wake up your legs! Perform 5 squats to warm up for your morning run.
                </p>
                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono-numbers mb-4">
                  {squatCount} / {targetSquats}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-5">
                  <div
                    className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${(squatCount / targetSquats) * 100}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleStepOrShake}
                  className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-base rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Count 1 Squat</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <p className="text-base text-slate-700 dark:text-slate-200 font-medium mb-1">
              Alarm successfully turned off!
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The morning air is fresh and optimal for running.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isCompleted ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  onStartRunNow();
                }}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Morning Run Now</span>
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-full py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Dismiss to Dashboard
              </button>
            </>
          ) : (
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Complete the wake-up task to silence the alarm.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
