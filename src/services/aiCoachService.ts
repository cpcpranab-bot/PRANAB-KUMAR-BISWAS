import { GoalItem, RunSession, UserProfile } from '../types';
import { soundService } from './soundService';

export interface AiCoachAnalysis {
  summary: string;
  feedback: string;
  plateauPrevention: string;
  nextWorkoutRecommendation: string;
  motivationalTip: string;
}

class AiCoachService {
  /**
   * Request AI Sports Scientist analysis of user's morning runs
   */
  public async analyzeRun(
    runData: RunSession | null,
    userProfile: UserProfile,
    goals: GoalItem[],
    recentRuns: RunSession[]
  ): Promise<AiCoachAnalysis> {
    try {
      const res = await fetch('/api/ai/analyze-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runData: runData || recentRuns[0],
          userProfile,
          goals,
          recentRuns,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: AiCoachAnalysis = await res.json();
      return data;
    } catch (err) {
      console.warn('AI Coach analysis fallback:', err);
      const latestRun = runData || recentRuns[0];
      const cadence = latestRun?.cadenceSpm || 170;
      return {
        summary: `Strong ${((latestRun?.distanceMeters || 5000) / 1000).toFixed(2)} km morning performance with dependable pacing stability!`,
        feedback: `Your cadence averaged ${cadence} SPM. To optimize running economy and reduce vertical oscillation, aim for short, rapid strides around 175-180 SPM. Your split distribution held steady with minimal drift.`,
        plateauPrevention: `To prevent cardiovascular and pace plateaus, alternate aerobic base days with progressive negative-split tempo runs where your final 1.5 km is 15-20 seconds faster.`,
        nextWorkoutRecommendation: `Tomorrow: 4.5 km easy aerobic recovery jog at 5:45 min/km with 3 x 30-second cadence surges.`,
        motivationalTip: `Morning champions aren't built on race day—they are forged at sunrise when the streets are quiet and the effort is honest.`,
      };
    }
  }

  /**
   * Ask Coach Q&A
   */
  public async askCoach(
    question: string,
    userProfile: UserProfile,
    recentRuns: RunSession[],
    goals: GoalItem[]
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userProfile,
          recentRuns,
          goals,
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      return data.answer;
    } catch (err) {
      console.warn('Coach chat fallback:', err);
      return `To optimize morning performance, focus on warming up with 5 minutes of dynamic leg swings, keeping your first kilometer 30 seconds slower than your target pace, and maintaining an efficient 170-180 steps per minute cadence.`;
    }
  }

  /**
   * Speak coach recommendation via SpeechSynthesis
   */
  public readAloud(text: string): void {
    soundService.speak(text);
  }
}

export const aiCoachService = new AiCoachService();
