import React, { useState, useEffect } from 'react';
import { GoalItem, RunSession, UserProfile } from '../../types';
import { aiCoachService, AiCoachAnalysis } from '../../services/aiCoachService';
import { Sparkles, Brain, Flame, TrendingUp, Volume2, Send, MessageSquare, ShieldAlert, Award, RefreshCw, ChevronRight } from 'lucide-react';

interface AiRunningCoachProps {
  runs: RunSession[];
  userProfile: UserProfile;
  goals: GoalItem[];
}

export const AiRunningCoach: React.FC<AiRunningCoachProps> = ({
  runs,
  userProfile,
  goals,
}) => {
  const [analysis, setAnalysis] = useState<AiCoachAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Chat state
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'coach'; text: string }>>([
    {
      sender: 'coach',
      text: `Hello ${userProfile.name}! I'm your RUN 4 BISWAS AI Coach. I continuously analyze your cadence, split pacing, and weekly distance. Tap 'Run Analysis' or ask me anything about your training!`,
    },
  ]);

  const latestRun = runs[0] || null;

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await aiCoachService.analyzeRun(latestRun, userProfile, goals, runs);
      setAnalysis(result);
    } catch {
      // Handled in service fallback
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    // Automatically perform initial analysis on load
    runAnalysis();
  }, []);

  const handleSpeakAnalysis = () => {
    if (!analysis) return;
    setIsSpeaking(true);
    const speechText = `${analysis.summary}. ${analysis.feedback}. Recommended next workout: ${analysis.nextWorkoutRecommendation}. ${analysis.motivationalTip}`;
    aiCoachService.readAloud(speechText);
    setTimeout(() => setIsSpeaking(false), 8000);
  };

  const handleAskQuestion = async (textToAsk: string) => {
    const q = textToAsk || question;
    if (!q.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMessages);
    setQuestion('');
    setChatLoading(true);

    try {
      const answer = await aiCoachService.askCoach(q, userProfile, runs, goals);
      setChatMessages([...newMessages, { sender: 'coach', text: answer }]);
    } catch {
      setChatMessages([
        ...newMessages,
        {
          sender: 'coach',
          text: 'To avoid morning training plateaus, incorporate one negative-split tempo workout per week and keep your cadence close to 175 SPM.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const formatPace = (secPerKm: number) => {
    const min = Math.floor(secPerKm / 60);
    const sec = secPerKm % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Cadence evaluation
  const cadence = latestRun?.cadenceSpm || 170;
  const cadenceStatus =
    cadence >= 170 && cadence <= 185
      ? { text: 'Optimal Economy', color: 'text-emerald-500' }
      : cadence < 170
      ? { text: 'Low Cadence / Over-striding Risk', color: 'text-amber-500' }
      : { text: 'Very High Cadence', color: 'text-blue-500' };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                AI Running Coach & Sports Scientist
              </h3>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded uppercase">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalized pace, distance, and cadence performance analysis & plateau prevention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <button
              type="button"
              onClick={handleSpeakAnalysis}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSpeaking
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 animate-pulse'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
              title="Listen to Coach Voice Summary"
            >
              <Volume2 className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Listen to Debrief</span>
            </button>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing Data...' : 'Refresh Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Biometric & Cadence Health Snapshot */}
      {latestRun && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Latest Cadence</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers mt-0.5">
              {latestRun.cadenceSpm || 170} <span className="text-xs font-normal text-slate-400">SPM</span>
            </div>
            <span className={`text-[11px] font-semibold ${cadenceStatus.color}`}>
              {cadenceStatus.text}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Pace Consistency</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers mt-0.5">
              {formatPace(latestRun.averagePaceSecPerKm)} <span className="text-xs font-normal text-slate-400">/km</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Split delta &plusmn; 8 sec
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Weekly Training Load</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono-numbers mt-0.5">
              {(runs.reduce((s, r) => s + r.distanceMeters, 0) / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Optimal Aerobic Volume
            </span>
          </div>
        </div>
      )}

      {/* AI Analysis Cards */}
      {analysis && (
        <div className="space-y-4">
          
          {/* Summary Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                  {analysis.summary}
                </h4>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                  {analysis.feedback}
                </p>
              </div>
            </div>
          </div>

          {/* Plateau Prevention & Next Workout 2-Column Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Plateau Prevention */}
            <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Plateau Prevention Routine
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.plateauPrevention}
              </p>
            </div>

            {/* Next Recommended Workout */}
            <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Next Morning Workout Plan
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {analysis.nextWorkoutRecommendation}
              </p>
            </div>

          </div>

          {/* Motivational Athletic Tip */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs italic text-slate-600 dark:text-slate-300">
              &ldquo;{analysis.motivationalTip}&rdquo;
            </p>
          </div>

        </div>
      )}

      {/* Interactive Chat with AI Coach */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Ask Your Running Coach
        </h4>

        {/* Suggested Quick Questions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            'How do I safely increase cadence to 175+ SPM?',
            'How should I break through my 5K pace plateau?',
            'Should my morning recovery run be heart-rate based?',
            'What is the best morning pre-run fuel?',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => handleAskQuestion(promptText)}
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="max-h-48 overflow-y-auto space-y-2 mb-3 pr-1">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white ml-8 rounded-tr-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-8 rounded-tl-sm border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="font-bold block mb-0.5 text-[10px] opacity-75">
                {msg.sender === 'user' ? 'You' : 'RUN 4 BISWAS Coach'}
              </span>
              {msg.text}
            </div>
          ))}

          {chatLoading && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl mr-8 text-xs text-slate-500 animate-pulse flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Coach is analyzing your data and formulating guidance...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(question);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask coach about your pace, cadence drills, or plateau..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={!question.trim() || chatLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
