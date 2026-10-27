import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Calendar,
  Award,
  CheckCircle2,
  BarChart2,
  Flame,
  Target,
  Layers,
} from 'lucide-react';
import { StudyLog, Commitment, Subject, TopicProgress, MockTest, RevisionRecord, WeeklyPlan } from '../types';
import { dbService } from '../services/db';
import {
  formatMinutes,
  formatHoursDecimal,
  getTodayDateString,
  getWeekBounds,
  calculateStudyStreak,
  addDays,
} from '../services/dateUtils';
import { calculateWeightedCompletion } from '../services/planning';

export const AnalyticsView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressList, setProgressList] = useState<TopicProgress[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);

  const loadData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);

      const [lList, cList, sList, pList, mList, rList, wPlans] = await Promise.all([
        dbService.getAll<StudyLog>('studyLogs'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<TopicProgress>('topicProgress'),
        dbService.getAll<MockTest>('mockTests'),
        dbService.getAll<RevisionRecord>('revisions'),
        dbService.getAll<WeeklyPlan>('weeklyPlans'),
      ]);

      setStudyLogs(lList);
      setCommitments(cList);
      setSubjects(sList);
      setProgressList(pList);
      setMockTests(mList.sort((a, b) => a.date.localeCompare(b.date)));
      setRevisions(rList);
      setPlans(wPlans);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Last 7 Days Daily Breakdown
  const last7Days: { date: string; label: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dStr = addDays(todayStr, -i);
    const dayLogs = studyLogs.filter((l) => l.date === dStr);
    const dayMins = dayLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
    const dayName = new Date(dStr + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
    last7Days.push({ date: dStr, label: dayName, minutes: dayMins });
  }

  const maxDailyMinutes = Math.max(...last7Days.map((d) => d.minutes), 60);

  // 2. Study Time Distribution by Examination
  const examMinutesMap = new Map<string, number>();
  for (const l of studyLogs) {
    examMinutesMap.set(l.examId, (examMinutesMap.get(l.examId) || 0) + (l.durationMinutes || 0));
  }
  const totalAllMinutes = studyLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // 3. Spaced Revision Adherence
  const completedRevs = revisions.filter((r) => r.status === 'completed').length;
  const totalRevs = revisions.length;
  const revisionAdherenceRate = totalRevs > 0 ? Math.round((completedRevs / totalRevs) * 100) : 100;

  // 4. Streak
  const { currentStreak, bestStreak } = calculateStudyStreak(
    studyLogs.map((l) => l.date),
    todayStr
  );

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Performance &amp; Time Analytics</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical trends • Pure focused study metrics • Non-punitive consistency • Zero fabricated data
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Study Recorded</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatHoursDecimal(totalAllMinutes)}</div>
          <span className="text-[11px] text-slate-400">{studyLogs.length} total sessions logged</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Revision Adherence</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{revisionAdherenceRate}%</div>
          <span className="text-[11px] text-slate-400">
            {completedRevs} of {totalRevs} revisions done
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{currentStreak} days</div>
          <span className="text-[11px] text-slate-400">Best: {bestStreak} days (meaningful study)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Mock Tests Taken</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{mockTests.length}</div>
          <span className="text-[11px] text-slate-400">Evaluated with question metrics</span>
        </div>
      </div>

      {/* 2-Column: 7-Day Bar Chart & Examination Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 7-Day Focused Study Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Last 7 Days Study Volume</h3>
            <span className="text-xs text-slate-400">Minutes per Day</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6">
            {last7Days.map((d) => {
              const heightPct = Math.round((d.minutes / maxDailyMinutes) * 100);
              const isToday = d.date === todayStr;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-[10px] font-mono text-slate-500">
                    {d.minutes > 0 ? `${d.minutes}m` : '-'}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isToday ? 'bg-indigo-600' : 'bg-indigo-300 hover:bg-indigo-400'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-medium ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Examination Study Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Study Allocation Across Commitments</h3>

          <div className="space-y-3">
            {commitments.map((c) => {
              const mins = examMinutesMap.get(c.id) || 0;
              const pct = totalAllMinutes > 0 ? Math.round((mins / totalAllMinutes) * 100) : 0;
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-500 font-mono">
                      {formatHoursDecimal(mins)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.priority === 1
                          ? 'bg-indigo-600'
                          : c.priority === 2
                          ? 'bg-blue-500'
                          : c.priority === 3
                          ? 'bg-purple-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mock Test Score Trajectory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Mock Test Scores Over Time</h3>
        {mockTests.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No mock tests available to chart.</p>
        ) : (
          <div className="space-y-2">
            {mockTests.map((m) => {
              const pct = Math.round((m.totalScore / (m.maxScore || 1)) * 100);
              const examName = examMap.get(m.examId) || m.examId;
              return (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{m.testName}</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                        {examName}
                      </span>
                      <span className="text-[10px] text-slate-400">• {m.date}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Accuracy: {m.accuracyPercent}% • Time: {m.timeTakenMinutes}m
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900">
                      {m.totalScore} / {m.maxScore}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 block">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
