import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  Zap,
  Sun,
  Moon,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle2,
  HelpCircle,
  RotateCw,
  Clock,
  History,
  CheckSquare,
  Flame,
} from 'lucide-react';
import { CoachDispatch, CoachDispatchType, MockTest, WeeklyTask } from '../types';
import { coachService } from '../services/coachService';

interface MentorCoachCornerProps {
  todayFocusedMinutes: number;
  streak: number;
  weeklyActualMinutes: number;
  weeklyTargetHours: number;
  dueRevisionsCount: number;
  recentMocks: MockTest[];
  currentPlanTasks: WeeklyTask[];
  onDispatchUpdated?: () => void;
}

export const MentorCoachCorner: React.FC<MentorCoachCornerProps> = ({
  todayFocusedMinutes,
  streak,
  weeklyActualMinutes,
  weeklyTargetHours,
  dueRevisionsCount,
  recentMocks,
  currentPlanTasks,
  onDispatchUpdated,
}) => {
  const [dispatches, setDispatches] = useState<CoachDispatch[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(new Set());

  const loadDispatches = async () => {
    const list = await coachService.getAllDispatches();
    setDispatches(list);
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const handleRunLiveAudit = async () => {
    setIsAuditing(true);
    try {
      const newDispatch = coachService.generateProgressReview({
        todayFocusedMinutes,
        streak,
        weeklyActualMinutes,
        weeklyTargetHours,
        dueRevisionsCount,
        recentMocks,
        currentPlanTasks,
      });

      await coachService.saveDispatch(newDispatch);
      await loadDispatches();
      if (onDispatchUpdated) onDispatchUpdated();
    } catch (err) {
      console.error('Failed to run live progress audit:', err);
    } finally {
      setTimeout(() => setIsAuditing(false), 500);
    }
  };

  const toggleAction = (actionId: string) => {
    setCompletedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  const latest = dispatches[0];

  const getTypeBadge = (type: CoachDispatchType) => {
    switch (type) {
      case 'mock_review':
        return {
          icon: <Award className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Mock Test Debrief',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      case 'morning_kickoff':
        return {
          icon: <Sun className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Morning Kickoff',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'midday_check':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Midday Momentum',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
        };
      case 'evening_debrief':
        return {
          icon: <Moon className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Evening Debrief',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'strategic_alert':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Strategic Alert',
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Coach Dispatch',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-2xl border border-indigo-100/90 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center text-amber-300 shadow-inner">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">AI Mentor Coach</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Monitor • RRB PO Sprint
              </span>
            </div>
            <p className="text-[11px] text-indigo-200">
              Live mock score evaluation &amp; multi-time daily progress guidance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunLiveAudit}
            disabled={isAuditing}
            className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg border border-white/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Evaluate today's hours, streak, tasks, and mocks right now"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? 'Auditing...' : 'Evaluate Now'}</span>
          </button>

          {dispatches.length > 1 && (
            <button
              type="button"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="px-2.5 py-1.5 text-xs text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>{isHistoryOpen ? 'Hide' : `Logs (${dispatches.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Latest Dispatch Area */}
      {latest ? (
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(() => {
                const b = getTypeBadge(latest.type);
                return (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${b.bg}`}
                  >
                    {b.icon}
                    <span>{b.label}</span>
                  </span>
                );
              })()}

              <span className="text-xs text-slate-400">• {latest.date} at {latest.timeStr}</span>
              <span className="text-[10px] text-slate-500 font-medium">({latest.author})</span>
            </div>

            {latest.rating && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  latest.rating === 'exceptional'
                    ? 'bg-emerald-100 text-emerald-800'
                    : latest.rating === 'on_track'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Status: {latest.rating.replace('_', ' ')}
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">{latest.title}</h4>
            <p className="text-xs text-slate-600 mt-1 font-medium bg-white/70 p-2.5 rounded-xl border border-indigo-100/60 leading-relaxed">
              <strong>BLUF:</strong> {latest.summary}
            </p>
          </div>

          {/* Metric Chips if present */}
          {latest.metrics && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {latest.metrics.score !== undefined && (
                <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200/80 font-semibold">
                  Score: {latest.metrics.score} / {latest.metrics.maxScore || 80}
                </span>
              )}
              {latest.metrics.accuracyPercent !== undefined && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 font-semibold">
                  Acc: {latest.metrics.accuracyPercent}%
                </span>
              )}
              {latest.metrics.negativePenalty !== undefined && latest.metrics.negativePenalty > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200/80 font-semibold">
                  Penalty: -{latest.metrics.negativePenalty} marks
                </span>
              )}
              {latest.metrics.focusHoursToday !== undefined && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200/80 font-semibold">
                  Today: {latest.metrics.focusHoursToday}h
                </span>
              )}
              {latest.metrics.streakDays !== undefined && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  {latest.metrics.streakDays}d Streak
                </span>
              )}
            </div>
          )}

          {/* Commentary prose */}
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
            {latest.commentary}
          </div>

          {/* Prescribed Action Directives */}
          {latest.actionItems && latest.actionItems.length > 0 && (
            <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wider">
                Coach Focus Directives
              </span>
              <div className="space-y-1.5">
                {latest.actionItems.map((item) => {
                  const isDone = completedActionIds.has(item.id);
                  return (
                    <label
                      key={item.id}
                      onClick={() => toggleAction(item.id)}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border select-none ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50/50 border-slate-200/70 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5 shrink-0"
                      />
                      <span className={`text-xs ${isDone ? 'line-through text-slate-400' : 'font-medium'}`}>
                        {item.title}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Socratic Question */}
          {latest.socraticQuestion && (
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wide block">
                  Socratic Reflection
                </span>
                <p className="italic mt-0.5">&ldquo;{latest.socraticQuestion}&rdquo;</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-400">
          No coach dispatches loaded yet. Click &quot;Evaluate Now&quot; to generate your first live briefing.
        </div>
      )}

      {/* History Accordion */}
      {isHistoryOpen && dispatches.length > 1 && (
        <div className="border-t border-slate-200 bg-slate-50/80 p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Past Coach Commentary &amp; Reviews ({dispatches.length - 1})</span>
          </h4>

          <div className="space-y-2.5">
            {dispatches.slice(1).map((d) => {
              const b = getTypeBadge(d.type);
              return (
                <div key={d.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.bg}`}>
                      {b.icon}
                      <span>{b.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{d.date} • {d.timeStr}</span>
                  </div>
                  <h5 className="font-bold text-slate-900">{d.title}</h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{d.summary}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
