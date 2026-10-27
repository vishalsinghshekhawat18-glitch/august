import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { DailyReview, WeeklyReview, StudyLog, WeeklyPlan, RevisionRecord, MockTest, UniversityItem } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString, getWeekBounds, formatMinutes, formatHoursDecimal } from '../services/dateUtils';
import { calculateWeightedCompletion } from '../services/planning';

export const ReviewsView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Daily form
  const [dailyCompleted, setDailyCompleted] = useState<string>('');
  const [dailyBlockers, setDailyBlockers] = useState<string>('');
  const [p1, setP1] = useState<string>('');
  const [p2, setP2] = useState<string>('');
  const [p3, setP3] = useState<string>('');

  // Weekly form
  const [weeklyReflection, setWeeklyReflection] = useState<string>('');
  const [weeklyStrengths, setWeeklyStrengths] = useState<string>('');
  const [weeklyWeaknesses, setWeeklyWeaknesses] = useState<string>('');

  // History
  const [dailyHistory, setDailyHistory] = useState<DailyReview[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyReview[]>([]);

  // Analytics Context
  const [todayMinutes, setTodayMinutes] = useState<number>(0);
  const [weeklyActualMinutes, setWeeklyActualMinutes] = useState<number>(0);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  const loadData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);
      const weekBounds = getWeekBounds(today);

      const [dReviews, wReviews, logs, plans] = await Promise.all([
        dbService.getAll<DailyReview>('dailyReviews'),
        dbService.getAll<WeeklyReview>('weeklyReviews'),
        dbService.getAll<StudyLog>('studyLogs'),
        dbService.getAll<WeeklyPlan>('weeklyPlans'),
      ]);

      setDailyHistory(dReviews.sort((a, b) => b.date.localeCompare(a.date)));
      setWeeklyHistory(wReviews.sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate)));

      // Compute actuals
      const tLogs = logs.filter((l) => l.date === today);
      setTodayMinutes(tLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0));

      const wLogs = logs.filter((l) => l.date >= weekBounds.monday && l.date <= weekBounds.sunday);
      setWeeklyActualMinutes(wLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0));

      const curPlan = plans.find((p) => p.weekStartDate === weekBounds.monday) || null;
      setWeeklyPlan(curPlan);
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Daily Review
  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const review: DailyReview = {
        id: `daily_${todayStr}`,
        date: todayStr,
        completedSummary: dailyCompleted.trim(),
        actualMinutes: todayMinutes,
        blockers: dailyBlockers.trim() || undefined,
        tomorrowPriorities: [p1, p2, p3].filter((p) => p.trim()),
        createdAt: new Date().toISOString(),
      };

      await dbService.put<DailyReview>('dailyReviews', review);
      alert('Daily review saved to local history!');
      setDailyCompleted('');
      setDailyBlockers('');
      setP1('');
      setP2('');
      setP3('');
      loadData();
    } catch (err) {
      console.error('Failed to save daily review:', err);
    }
  };

  // Save Weekly Review
  const handleSaveWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    const weekBounds = getWeekBounds(todayStr);
    const { weightedPercent } = calculateWeightedCompletion(weeklyPlan?.tasks || []);

    try {
      const review: WeeklyReview = {
        id: `weekly_${weekBounds.monday}`,
        weekStartDate: weekBounds.monday,
        reflection: weeklyReflection.trim(),
        plannedHours: weeklyPlan?.targetHours || 25,
        actualHours: Number((weeklyActualMinutes / 60).toFixed(1)),
        weightedCompletionPercent: weightedPercent,
        strengths: weeklyStrengths.trim(),
        weaknesses: weeklyWeaknesses.trim(),
        createdAt: new Date().toISOString(),
      };

      await dbService.put<WeeklyReview>('weeklyReviews', review);
      alert('Weekly review saved and recorded in local history!');
      setWeeklyReflection('');
      setWeeklyStrengths('');
      setWeeklyWeaknesses('');
      loadData();
    } catch (err) {
      console.error('Failed to save weekly review:', err);
    }
  };

  const weekBounds = getWeekBounds(todayStr);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Structured Reviews</h1>
          <p className="text-xs text-slate-500 mt-1">
            End-of-day alignment • Weekly post-mortem • Next-week plan approval &amp; retrospective
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'daily' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Daily Review
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'weekly' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
            }`}
          >
            Weekly Review
          </button>
        </div>
      </div>

      {activeTab === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today&apos;s Review ({todayStr})</h3>
                <span className="text-xs text-slate-400">
                  Actual Focused Study Today: <strong>{formatMinutes(todayMinutes)}</strong> (
                  {formatHoursDecimal(todayMinutes)})
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveDaily} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  1. What did you accomplish today?
                </label>
                <textarea
                  rows={2}
                  value={dailyCompleted}
                  onChange={(e) => setDailyCompleted(e.target.value)}
                  placeholder="e.g. Mastered circular seating puzzles; solved 40 questions in quant; revised banking awareness."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  2. Any blockers, fatigue, or unfinished tasks?
                </label>
                <textarea
                  rows={2}
                  value={dailyBlockers}
                  onChange={(e) => setDailyBlockers(e.target.value)}
                  placeholder="e.g. Slow on approximation; got stuck on quadratic equations calculation speed."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  3. Tomorrow&apos;s Top 3 Priorities
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Priority #1 (e.g. Full-length RRB PO prelims mock test)"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Priority #2 (e.g. Mistake diagnosis on reasoning)"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Priority #3 (e.g. VMOU MEC-01 Chapter 2 reading)"
                    value={p3}
                    onChange={(e) => setP3(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                >
                  Save Daily Review
                </button>
              </div>
            </form>
          </div>

          {/* Daily History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Daily Reviews</h3>
            {dailyHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No past daily reviews logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {dailyHistory.map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>{rev.date}</span>
                      <span className="text-indigo-600 font-mono">{formatMinutes(rev.actualMinutes)}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{rev.completedSummary}</p>
                    {rev.tomorrowPriorities.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        Priorities: {rev.tomorrowPriorities.join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly Retrospective ({weekBounds.monday} to {weekBounds.sunday})
                </h3>
                <span className="text-xs text-slate-400">
                  Target: {weeklyPlan?.targetHours || 25}h • Actual:{' '}
                  <strong>{formatHoursDecimal(weeklyActualMinutes)}</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveWeekly} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weekly Reflection &amp; Reality Check</label>
                <textarea
                  rows={3}
                  value={weeklyReflection}
                  onChange={(e) => setWeeklyReflection(e.target.value)}
                  placeholder="How did this week's study plan go? Were study hours focused? What caused any deviations?"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Key Strengths Demonstrated</label>
                  <textarea
                    rows={2}
                    value={weeklyStrengths}
                    onChange={(e) => setWeeklyStrengths(e.target.value)}
                    placeholder="e.g. Consistent 4 hours daily; high puzzle accuracy."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Weaknesses to Fix Next Week</label>
                  <textarea
                    rows={2}
                    value={weeklyWeaknesses}
                    onChange={(e) => setWeeklyWeaknesses(e.target.value)}
                    placeholder="e.g. Neglected VMOU assignment deadline; missed 2 revisions."
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                >
                  Save Weekly Retrospective
                </button>
              </div>
            </form>
          </div>

          {/* Weekly History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Weekly Review Archive</h3>
            {weeklyHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No past weekly reviews logged yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {weeklyHistory.map((rev) => (
                  <div key={rev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span>Week of {rev.weekStartDate}</span>
                      <span className="text-indigo-600 font-mono">
                        {rev.actualHours}h / {rev.plannedHours}h
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{rev.reflection}</p>
                    <div className="text-[10px] text-slate-400">
                      Weighted Task Completion: {rev.weightedCompletionPercent}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
