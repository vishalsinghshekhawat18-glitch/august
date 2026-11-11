import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  Calendar,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  BookOpen,
  Target,
  RotateCw,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Building,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  CheckSquare,
  ClipboardList,
} from 'lucide-react';
import {
  Commitment,
  DateVerificationStatus,
  StudyLog,
  WeeklyPlan,
  WeeklyTask,
  RevisionRecord,
  MockTest,
  UniversityItem,
  Subject,
  Topic,
  TopicProgress,
  CoachDispatch,
} from '../types';
import { dbService } from '../services/db';
import {
  getTodayDateString,
  getWeekBounds,
  formatMinutes,
  formatHoursDecimal,
  calculateStudyStreak,
  daysBetween,
} from '../services/dateUtils';
import { calculateWeightedCompletion } from '../services/planning';
import { CompleteRevisionModal } from '../components/CompleteRevisionModal';
import { AnalyzeMockModal } from '../components/AnalyzeMockModal';
import { LiveMockFeedbackModal } from '../components/LiveMockFeedbackModal';
import { EditStudyLogModal } from '../components/EditStudyLogModal';
import { coachService } from '../services/coachService';

interface DashboardViewProps {
  onOpenQuickAdd: () => void;
  onNavigate: (viewId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenQuickAdd, onNavigate }) => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [currentWeekPlan, setCurrentWeekPlan] = useState<WeeklyPlan | null>(null);
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [universityItems, setUniversityItems] = useState<UniversityItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allPlans, setAllPlans] = useState<WeeklyPlan[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit Milestone Modal
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [targetDateInput, setTargetDateInput] = useState<string>('');
  const [dateStatusInput, setDateStatusInput] = useState<DateVerificationStatus>('confirmed');
  const [dateSourceUrlInput, setDateSourceUrlInput] = useState<string>('');

  // Complete Revision Modal
  const [completingRevision, setCompletingRevision] = useState<RevisionRecord | null>(null);
  const [editingStudyLog, setEditingStudyLog] = useState<StudyLog | null>(null);

  // Dedicated Log Mock Test Modal on Dashboard
  const [isAddMockOpen, setIsAddMockOpen] = useState<boolean>(false);
  const [mockExamId, setMockExamId] = useState<string>('comm_ibps_rrb_po');
  const [mockTestName, setMockTestName] = useState<string>('');
  const [mockDate, setMockDate] = useState<string>(getTodayDateString());
  const [mockScore, setMockScore] = useState<number>(54.5);
  const [mockMaxScore, setMockMaxScore] = useState<number>(80);
  const [mockTimeMinutes, setMockTimeMinutes] = useState<number>(45);
  const [mockAttempted, setMockAttempted] = useState<number>(62);
  const [mockCorrect, setMockCorrect] = useState<number>(56);
  const [mockIncorrect, setMockIncorrect] = useState<number>(6);
  const [mockNotes, setMockNotes] = useState<string>('');
  const [mockAnalysisCompleted, setMockAnalysisCompleted] = useState<boolean>(false);
  const [mockAnalysisMinutes, setMockAnalysisMinutes] = useState<number>(45);
  const [analyzingMock, setAnalyzingMock] = useState<MockTest | null>(null);
  const [activeMockReview, setActiveMockReview] = useState<CoachDispatch | null>(null);

  // Multi-paper schedule expanded accordion
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());

  const toggleSchedule = (commId: string) => {
    setExpandedSchedules((prev) => {
      const next = new Set(prev);
      if (next.has(commId)) next.delete(commId);
      else next.add(commId);
      return next;
    });
  };

  const handleOpenEditMilestone = (c: Commitment) => {
    setEditingCommitment(c);
    setTargetDateInput(c.targetDate || '');
    setDateStatusInput(c.dateStatus || 'confirmed');
    setDateSourceUrlInput(c.dateSourceUrl || '');
  };

  const handleSaveMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommitment) return;
    const updated: Commitment = {
      ...editingCommitment,
      targetDate: targetDateInput || undefined,
      dateStatus: dateStatusInput,
      dateSourceUrl: dateSourceUrlInput || undefined,
      dateVerificationDate: todayStr,
    };
    await dbService.put<Commitment>('commitments', updated);
    setCommitments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingCommitment(null);
  };

  // Save Mock Test directly from Dashboard
  const handleSaveMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTestName.trim()) return;

    try {
      const accuracy = mockAttempted > 0 ? Number(((mockCorrect / mockAttempted) * 100).toFixed(1)) : 0;
      const newMock: MockTest = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        examId: mockExamId,
        testName: mockTestName.trim(),
        date: mockDate,
        totalScore: Number(mockScore),
        maxScore: Number(mockMaxScore),
        accuracyPercent: accuracy,
        correctCount: Number(mockCorrect),
        incorrectCount: Number(mockIncorrect),
        skippedCount: Math.max(0, Number(mockMaxScore) - Number(mockAttempted)),
        attemptedCount: Number(mockAttempted),
        timeTakenMinutes: Number(mockTimeMinutes),
        notes: mockNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
        analysisCompleted: mockAnalysisCompleted,
        analysisMinutes: mockAnalysisCompleted ? Number(mockAnalysisMinutes) : undefined,
        analysisDate: mockAnalysisCompleted ? mockDate : undefined,
      };

      await dbService.put<MockTest>('mockTests', newMock);

      // Automatically create corresponding StudyLog so time reflects in Today's Focus, Weekly hours, and Streak!
      if (Number(mockTimeMinutes) > 0) {
        const mockLog: StudyLog = {
          id: `log_mock_${newMock.id}`,
          date: mockDate,
          timestamp: new Date().toISOString(),
          examId: mockExamId,
          subjectId: '',
          durationMinutes: Number(mockTimeMinutes),
          activityType: 'mock_test',
          notes: `Mock Test: ${newMock.testName} — Score: ${newMock.totalScore}/${newMock.maxScore} (${newMock.accuracyPercent}% acc)` + (mockNotes.trim() ? ` • ${mockNotes.trim()}` : ''),
          createdAt: new Date().toISOString(),
        };
        await dbService.put<StudyLog>('studyLogs', mockLog);
      }

      // If user also completed analysis, automatically log analysis time toward study hours!
      if (mockAnalysisCompleted && Number(mockAnalysisMinutes) > 0) {
        const analysisLog: StudyLog = {
          id: `log_analysis_${newMock.id}`,
          date: mockDate,
          timestamp: new Date().toISOString(),
          examId: mockExamId,
          subjectId: '',
          durationMinutes: Number(mockAnalysisMinutes),
          activityType: 'mistake_analysis',
          notes: `Mock Analysis: ${newMock.testName} (${mockAnalysisMinutes}m)`,
          createdAt: new Date().toISOString(),
        };
        await dbService.put<StudyLog>('studyLogs', analysisLog);
      }

      // Generate Live Mentor Coach Review & open instant feedback
      const examName = examMap.get(mockExamId) || 'IBPS RRB PO (Officer Scale I)';
      const coachReview = coachService.generateMockReview(newMock, mockTests, examName);
      await coachService.saveDispatch(coachReview);
      setActiveMockReview(coachReview);

      setIsAddMockOpen(false);
      setMockTestName('');
      setMockNotes('');
      setMockAnalysisCompleted(false);
      setMockAnalysisMinutes(45);
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to save mock test from dashboard:', err);
    }
  };

  // Load all dashboard metrics
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const today = getTodayDateString();
      setTodayStr(today);
      const weekBounds = getWeekBounds(today);

      const [logs, comms, plans, revs, mocks, uItems, subs, tops] = await Promise.all([
        dbService.getAll<StudyLog>('studyLogs'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<WeeklyPlan>('weeklyPlans'),
        dbService.getAll<RevisionRecord>('revisions'),
        dbService.getAll<MockTest>('mockTests'),
        dbService.getAll<UniversityItem>('universityItems'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
      ]);

      // Auto-sync: Ensure all recorded mockTests have a corresponding studyLog so focused minutes are never omitted
      for (const m of mocks) {
        const mockLogId = `log_mock_${m.id}`;
        const hasLog = logs.some(
          (l) => l.id === mockLogId || (l.activityType === 'mock_test' && l.date === m.date && l.durationMinutes === m.timeTakenMinutes)
        );
        if (!hasLog && m.timeTakenMinutes && m.timeTakenMinutes > 0) {
          const autoLog: StudyLog = {
            id: mockLogId,
            date: m.date,
            timestamp: m.createdAt || new Date().toISOString(),
            examId: m.examId,
            subjectId: '',
            durationMinutes: Number(m.timeTakenMinutes),
            activityType: 'mock_test',
            notes: `Mock Test: ${m.testName} — Score: ${m.totalScore}/${m.maxScore} (${m.accuracyPercent}% acc)` + (m.notes ? ` • ${m.notes}` : ''),
            createdAt: m.createdAt || new Date().toISOString(),
          };
          await dbService.put<StudyLog>('studyLogs', autoLog);
          logs.push(autoLog);
        }
      }

      setStudyLogs(logs);
      setCommitments(comms.sort((a, b) => a.priority - b.priority));
      setAllPlans(plans);

      // Find plan for current week
      const currentPlan = plans.find((p) => p.weekStartDate === weekBounds.monday) || null;
      setCurrentWeekPlan(currentPlan);

      setRevisions(revs);
      setMockTests(mocks.sort((a, b) => b.date.localeCompare(a.date)));
      setUniversityItems(uItems);
      setSubjects(subs);
      setTopics(tops);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 1. Today's focused minutes & logs
  const todayLogs = studyLogs.filter((l) => l.date === todayStr);
  const todayFocusedMinutes = todayLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // 2. Weekly actual focused minutes
  const weekBounds = getWeekBounds(todayStr);
  const weeklyLogs = studyLogs.filter((l) => l.date >= weekBounds.monday && l.date <= weekBounds.sunday);
  const weeklyActualMinutes = weeklyLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);
  const weeklyTargetHours = currentWeekPlan?.targetHours || 25;
  const weeklyTargetMinutes = weeklyTargetHours * 60;
  const weeklyProgressPercent = Math.min(100, Math.round((weeklyActualMinutes / (weeklyTargetMinutes || 1)) * 100));

  // 3. Weekly Task Weighted Completion
  const weeklyTasks = currentWeekPlan?.tasks || [];
  const { weightedPercent, activeTaskCount, completedTaskCount } = calculateWeightedCompletion(weeklyTasks);

  // 4. Today's Tasks
  const todayTasks = weeklyTasks.filter((t) => !t.dueDate || t.dueDate === todayStr || t.status === 'in_progress');

  // 5. Revisions Due & Overdue
  const dueRevisions = revisions.filter(
    (r) => (r.status === 'due' || r.status === 'rescheduled') && r.scheduledDate <= todayStr
  );
  const overdueRevisions = revisions.filter(
    (r) => (r.status === 'due' || r.status === 'rescheduled') && r.scheduledDate < todayStr
  );

  // 6. Streak calculation based on actual recorded days
  const studyDates = studyLogs.map((l) => l.date);
  const { currentStreak, bestStreak } = calculateStudyStreak(studyDates, todayStr);

  // 7. Backlog items requiring decisions (unfinished tasks from past weeks)
  const backlogTasks: { plan: WeeklyPlan; task: WeeklyTask }[] = [];
  for (const p of allPlans) {
    if (p.weekStartDate < weekBounds.monday) {
      for (const t of p.tasks) {
        if (t.status === 'planned' || t.status === 'in_progress') {
          backlogTasks.push({ plan: p, task: t });
        }
      }
    }
  }

  // 8. Upcoming University Deadlines (VMOU Kota)
  const upcomingUnivItems = universityItems
    .filter((u) => u.deadline && u.deadline >= todayStr && u.status !== 'completed' && u.status !== 'submitted')
    .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));

  // Quick Action to complete revision
  const handleMarkRevisionComplete = async (rev: RevisionRecord) => {
    try {
      const updated: RevisionRecord = {
        ...rev,
        status: 'completed',
        completedAt: todayStr,
      };
      await dbService.put<RevisionRecord>('revisions', updated);
      loadDashboardData();
    } catch (err) {
      console.error('Failed to complete revision:', err);
    }
  };

  // Quick Action to toggle weekly task
  const handleToggleTaskStatus = async (task: WeeklyTask) => {
    if (!currentWeekPlan) return;
    try {
      const isDone = task.status === 'completed';
      const updatedTasks = currentWeekPlan.tasks.map((t) => {
        if (t.id === task.id) {
          return {
            ...t,
            status: (isDone ? 'in_progress' : 'completed') as WeeklyTask['status'],
            progressFraction: isDone ? 0.5 : 1.0,
          };
        }
        return t;
      });

      const updatedPlan = { ...currentWeekPlan, tasks: updatedTasks };
      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentWeekPlan(updatedPlan);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const examMap = new Map(commitments.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Today&apos;s Focus &amp; Performance</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              {todayStr}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Midnight-to-midnight study tracking • Primary focus: <strong>IBPS RRB PO</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setMockExamId('comm_ibps_rrb_po');
              setMockMaxScore(80);
              setMockTimeMinutes(45);
              setIsAddMockOpen(true);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
          >
            <Award className="w-4 h-4 text-purple-600" />
            <span>Log Mock Test</span>
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Log Study</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Focused Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Today&apos;s Focused Study</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatMinutes(todayFocusedMinutes)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {todayLogs.length} session{todayLogs.length !== 1 ? 's' : ''} logged today
          </div>
        </div>

        {/* Weekly Hours: Target vs Actual */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Weekly Attainment</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatHoursDecimal(weeklyActualMinutes)}
            </span>
            <span className="text-xs text-slate-400">/ {weeklyTargetHours}h target</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${weeklyProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Weighted Task Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Task Completion</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{weightedPercent}%</span>
            <span className="text-xs text-slate-400">weighted</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {completedTaskCount} of {activeTaskCount} active tasks completed
          </div>
        </div>

        {/* Consistency Streak */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Active Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{currentStreak}</span>
            <span className="text-xs text-slate-500">days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Best record: {bestStreak} days • Meaningful study only
          </div>
        </div>
      </div>


      {/* Official Form & Exam Status Tracking Hub Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-sky-50/40 border border-sky-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Exam Status &amp; Official Forms Tracker
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                4 Active Nov Exams
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 hidden md:inline">
                Synced from Desktop/FORM
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              NICL AO (Nov 17) • SCI JCA (Nov 20) • IBPS RRB Scale-I (Nov 21–22) • RVUNL JE (Nov 29–30). Credentials, dates &amp; official syllabuses.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('exam-status')}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
        >
          <span>Open Exam Status Hub</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* SECTION 1: TODAY'S TASKS (FIRST PER REQUIREMENT #7) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Planned Tasks</h2>
            <span className="text-xs text-slate-400">({todayTasks.length})</span>
          </div>
          <button
            onClick={() => onNavigate('planning')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>Open Week Plan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 divide-y divide-slate-100">
          {todayTasks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500">No specific tasks scheduled for today.</p>
              <button
                onClick={() => onNavigate('planning')}
                className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
              >
                + Add or assign tasks to this week
              </button>
            </div>
          ) : (
            todayTasks.map((t) => {
              const isCompleted = t.status === 'completed';
              return (
                <div key={t.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggleTaskStatus(t)}
                      className={`mt-0.5 rounded-full p-0.5 transition-colors ${
                        isCompleted
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-300 hover:text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <div>
                      <p
                        className={`text-xs font-medium leading-snug ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {t.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>Weight: {t.weight}★</span>
                        <span>•</span>
                        <span>Est: {t.estimatedMinutes}m</span>
                        {t.dueDate && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600">Due: {t.dueDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION: TODAY'S RECORDED SESSIONS & MOCKS */}
      {todayLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Completed Study &amp; Mock Sessions</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                {formatMinutes(todayFocusedMinutes)} total
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {todayLogs.length} session{todayLogs.length !== 1 ? 's' : ''} logged
            </span>
          </div>

          <div className="p-4 space-y-2.5">
            {todayLogs.map((log) => {
              const examName = examMap.get(log.examId) || log.examId;
              const isMock = log.activityType === 'mock_test';
              const isAnalysis = log.activityType === 'mistake_analysis';
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                    isMock
                      ? 'bg-purple-50/50 border-purple-200 shadow-xs'
                      : isAnalysis
                      ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isMock
                          ? 'bg-purple-100 text-purple-700'
                          : isAnalysis
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isMock ? (
                        <Award className="w-4 h-4" />
                      ) : isAnalysis ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{examName}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isMock
                              ? 'bg-purple-100 text-purple-800'
                              : isAnalysis
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {isMock ? 'Full Mock Test' : isAnalysis ? 'Mock Analysis' : log.activityType.replace('_', ' ')}
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-xs text-slate-700 font-medium mt-1 leading-snug">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {formatMinutes(log.durationMinutes)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingStudyLog(log)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-white transition cursor-pointer"
                      title="Edit study session duration, date, or notes"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this study session record?')) {
                          await dbService.delete('studyLogs', log.id);
                          await loadDashboardData();
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-white transition cursor-pointer"
                      title="Delete study session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2-Column Grid: Revisions Due & Examination Countdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revisions Due & Overdue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900">Revisions Due &amp; Overdue</h3>
                {overdueRevisions.length > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">
                    {overdueRevisions.length} overdue
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('revisions')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all
              </button>
            </div>

            <div className="p-4 space-y-2.5">
              {dueRevisions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No pending revisions due today.
                </div>
              ) : (
                dueRevisions.slice(0, 4).map((r) => {
                  const isOverdue = r.scheduledDate < todayStr;
                  const topicName = topicMap.get(r.topicId) || 'Topic';
                  const subjectName = subjectMap.get(r.subjectId) || 'Subject';
                  return (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isOverdue ? 'Overdue' : 'Due Today'}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">{subjectName}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 mt-0.5">{topicName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Interval: +{r.intervalDays} days</p>
                      </div>

                      <button
                        onClick={() => setCompletingRevision(r)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 text-xs font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1 shrink-0"
                        title="Complete revision and log time spent"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Done</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={() => onNavigate('revisions')}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium"
            >
              Manage Spaced Revisions (+1, +3, +7, +14, +30d) →
            </button>
          </div>
        </div>

        {/* Examination Countdowns with Verification Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-slate-900">Examination Milestones</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Source-Verified Dates</span>
            </div>

            <div className="p-4 space-y-2.5">
              {commitments.map((c) => {
                const hasDate = Boolean(c.targetDate);
                const days = hasDate ? daysBetween(todayStr, c.targetDate!) : null;
                const hasPapers = Boolean(c.papers && c.papers.length > 0);
                const isExpanded = expandedSchedules.has(c.id);

                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">{c.name}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              c.dateStatus === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.dateStatus === 'provisional'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {c.dateStatus}
                          </span>

                          {hasPapers && (
                            <button
                              type="button"
                              onClick={() => toggleSchedule(c.id)}
                              className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors"
                            >
                              <span>{c.papers!.length} Papers Scheduled</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{hasPapers ? `Next Paper: ${c.targetDate}` : (c.targetDate || 'Date to be announced')}</span>
                          {c.dateSourceUrl && (
                            <a
                              href={c.dateSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-0.5 text-[10px]"
                            >
                              <span>Official Source</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          {days !== null ? (
                            <div>
                              {days > 0 ? (
                                <>
                                  <span className="text-lg font-bold text-indigo-600">{days}</span>
                                  <span className="text-[10px] text-slate-400 block -mt-1">days left</span>
                                </>
                              ) : days === 0 ? (
                                <>
                                  <span className="text-base font-bold text-emerald-600">Today</span>
                                  <span className="text-[10px] text-emerald-600 block -mt-1">Exam day</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-sm font-semibold text-slate-400">{Math.abs(days)}d ago</span>
                                  <span className="text-[10px] text-slate-400 block -mt-1">Passed</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Unscheduled</span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenEditMilestone(c)}
                          className="text-slate-300 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-50 transition"
                          title="Edit examination date and verification status"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Paper-Wise Schedule Breakdown */}
                    {hasPapers && isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Venue Code: <strong className="text-slate-900">{c.papers![0]?.venueCode || '303012'}</strong></span>
                          </span>
                          <span className="text-[10px] text-slate-400">Medium: English • Official Admit Schedule</span>
                        </div>

                        <div className="space-y-1.5">
                          {c.papers!.map((p, pIdx) => {
                            const pDays = daysBetween(todayStr, p.date);
                            const isNext = pDays >= 0 && (pIdx === 0 || daysBetween(todayStr, c.papers![pIdx - 1].date) < 0);
                            return (
                              <div
                                key={p.paperCode || pIdx}
                                className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border transition-all ${
                                  isNext
                                    ? 'bg-amber-50/70 border-amber-200 shadow-xs'
                                    : pDays < 0
                                    ? 'bg-slate-50 border-slate-100 opacity-60'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-900 text-xs">{p.paperCode}:</span>
                                    <span className="text-slate-700 font-semibold truncate">{p.paperName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                                    <span className="font-semibold text-slate-800">📅 {p.date}</span>
                                    {p.examTime && <span>• ⏰ Exam: {p.examTime} (Rep: {p.reportingTime})</span>}
                                    {p.venueCode && <span>• Venue: {p.venueCode}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {pDays > 0 ? (
                                    <span
                                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        isNext
                                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {pDays} days left
                                    </span>
                                  ) : pDays === 0 ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      Today Exam!
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Completed</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Eligibility DOB: 31 October 1996 • Verified against official notifications
          </div>
        </div>
      </div>

      {/* 2-Column Grid: University Deadlines & Backlog / Mocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming VMOU Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold text-slate-900">VMOU Kota Deadlines</h3>
            </div>
            <button
              onClick={() => onNavigate('university')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Open VMOU Hub
            </button>
          </div>

          <div className="p-4 space-y-2">
            {upcomingUnivItems.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No active VMOU assignment or lecture deadlines.
              </div>
            ) : (
              upcomingUnivItems.slice(0, 3).map((item) => {
                const days = item.deadline ? daysBetween(todayStr, item.deadline) : 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Deadline: {item.deadline}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700">{days}d left</span>
                      <span className="text-[10px] text-slate-400 block">{item.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Mock Performance & Backlog Decisions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent Mock Tests</h3>
              </div>
              <button
                onClick={() => onNavigate('mocks')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Log New Mock
              </button>
            </div>

            <div className="p-4 space-y-2.5">
              {mockTests.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No mock test records saved yet.
                </div>
              ) : (
                mockTests.slice(0, 3).map((m) => {
                  const examName = examMap.get(m.examId) || m.examId;
                  const pct = Math.round((m.totalScore / (m.maxScore || 1)) * 100);
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-indigo-700">{examName}</span>
                          <span className="text-[10px] text-slate-400">• {m.date}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 mt-0.5">{m.testName}</h4>
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Acc: {m.accuracyPercent}%</span>
                          <span>•</span>
                          <span>✓ {m.correctCount}</span>
                          <span>✗ {m.incorrectCount}</span>
                        </div>
                        {/* Analysis Status */}
                        <div className="mt-1.5">
                          {m.analysisCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Analyzed ({m.analysisMinutes || 45}m)
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnalyzingMock(m);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
                            >
                              <CheckSquare className="w-3 h-3 text-purple-600" />
                              + Mark Analysis
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">
                          {m.totalScore} <span className="text-[10px] font-normal text-slate-400">/ {m.maxScore}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {backlogTasks.length > 0 && (
            <div className="p-3.5 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>{backlogTasks.length}</strong> unfinished tasks from previous weeks require resolution.
                </span>
              </div>
              <button
                onClick={() => onNavigate('planning')}
                className="text-xs font-semibold text-amber-900 underline shrink-0"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Edit Milestone Modal */}
      {editingCommitment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Edit Examination Milestone</h3>
              <button
                type="button"
                onClick={() => setEditingCommitment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Examination Name</label>
                <input
                  type="text"
                  value={editingCommitment.name}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Target Exam Date</label>
                <input
                  type="date"
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {editingCommitment.papers && editingCommitment.papers.length > 0 ? (
                    <>
                      {editingCommitment.papers.map((p, idx) => (
                        <button
                          key={p.paperCode || idx}
                          type="button"
                          onClick={() => setTargetDateInput(p.date)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold"
                        >
                          {p.paperCode}: {p.date}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setTargetDateInput('2026-11-20')}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold"
                      >
                        IBPS RRB PO: 20 Nov 2026
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetDateInput('2026-11-21')}
                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-semibold"
                      >
                        Set 21 Nov 2026
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Multi-paper breakdown in edit modal */}
              {editingCommitment.papers && editingCommitment.papers.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                    <span>Configured Papers Schedule ({editingCommitment.papers.length} Papers)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Venue: 303012</span>
                  </div>
                  <div className="space-y-1">
                    {editingCommitment.papers.map((p, idx) => (
                      <div key={idx} className="p-1.5 bg-white rounded border border-slate-200 text-[11px] flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{p.paperCode}: <span className="font-normal text-slate-600">{p.paperName}</span></span>
                        <span className="font-mono text-indigo-600 font-semibold">{p.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Verification Status</label>
                <select
                  value={dateStatusInput}
                  onChange={(e) => setDateStatusInput(e.target.value as DateVerificationStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="provisional">Provisional</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Official Notification URL</label>
                <input
                  type="url"
                  placeholder="https://www.ibps.in"
                  value={dateSourceUrlInput}
                  onChange={(e) => setDateSourceUrlInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCommitment(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold shadow-sm"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Revision Modal with Time Logging */}
      {completingRevision && (
        <CompleteRevisionModal
          isOpen={!!completingRevision}
          onClose={() => setCompletingRevision(null)}
          revision={completingRevision}
          topicName={topics.find((t) => t.id === completingRevision.topicId)?.name || 'Chapter'}
          subjectName={subjects.find((s) => s.id === completingRevision.subjectId)?.name || 'Subject'}
          allDueRevisions={dueRevisions}
          allTopics={topics}
          onSaved={() => loadDashboardData()}
        />
      )}

      {/* Log Mock Test Modal on Dashboard */}
      {isAddMockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-semibold">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Log Full Mock Test</h3>
                  <p className="text-xs text-slate-500">Record score &amp; automatically count test time toward study hours</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMockOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMock} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Examination</label>
                  <select
                    value={mockExamId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setMockExamId(newId);
                      if (newId === 'comm_ibps_rrb_po') {
                        setMockMaxScore(80);
                        setMockTimeMinutes(45);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    required
                  >
                    {commitments.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.priority === 1 ? '★ [Priority 1]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Test Date</label>
                  <input
                    type="date"
                    value={mockDate}
                    onChange={(e) => setMockDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Test Title / Mock Series</label>
                <input
                  type="text"
                  placeholder="e.g. Testbook IBPS RRB PO Prelims Mock #01"
                  value={mockTestName}
                  onChange={(e) => setMockTestName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Score</label>
                  <input
                    type="number"
                    step="0.25"
                    value={mockScore}
                    onChange={(e) => setMockScore(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Score</label>
                  <input
                    type="number"
                    value={mockMaxScore}
                    onChange={(e) => setMockMaxScore(parseFloat(e.target.value) || 80)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time Taken (min)</label>
                  <input
                    type="number"
                    value={mockTimeMinutes}
                    onChange={(e) => setMockTimeMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    required
                  />
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-2">
                <span className="text-[11px] font-bold text-purple-900 block">Question Breakdown</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium">Attempted</label>
                    <input
                      type="number"
                      value={mockAttempted}
                      onChange={(e) => setMockAttempted(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-700 font-semibold">Correct</label>
                    <input
                      type="number"
                      value={mockCorrect}
                      onChange={(e) => setMockCorrect(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-rose-700 font-semibold">Incorrect</label>
                    <input
                      type="number"
                      value={mockIncorrect}
                      onChange={(e) => setMockIncorrect(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-900 font-medium pt-1">
                  <span>Accuracy: <strong>{mockAttempted > 0 ? ((mockCorrect / mockAttempted) * 100).toFixed(1) : 0}%</strong></span>
                  <span>Percentage: <strong>{Math.round((mockScore / (mockMaxScore || 1)) * 100)}%</strong></span>
                </div>
              </div>

              {/* Mock Analysis Section */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mockAnalysisCompleted}
                    onChange={(e) => setMockAnalysisCompleted(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-emerald-950">
                    I also analyzed this mock test (Review incorrect &amp; skipped questions)
                  </span>
                </label>

                {mockAnalysisCompleted && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-emerald-900">Analysis Duration</label>
                      <div className="flex gap-1">
                        {[20, 30, 45, 60, 90].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setMockAnalysisMinutes(mins)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              mockAnalysisMinutes === mins
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={mockAnalysisMinutes}
                        onChange={(e) => setMockAnalysisMinutes(parseInt(e.target.value, 10) || 0)}
                        className="w-20 text-xs px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold text-emerald-950"
                      />
                      <span className="text-xs text-emerald-700">minutes of post-test review added to dashboard</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Diagnostic Observations (Optional)</label>
                <textarea
                  rows={2}
                  value={mockNotes}
                  onChange={(e) => setMockNotes(e.target.value)}
                  placeholder="e.g. Reasoning completed in 21 mins, Quant arithmetic was calculation heavy."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMockOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Mock &amp; Update Hours</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analyze Existing Mock Modal */}
      {analyzingMock && (
        <AnalyzeMockModal
          isOpen={!!analyzingMock}
          mock={analyzingMock}
          onClose={() => setAnalyzingMock(null)}
          onSaved={loadDashboardData}
        />
      )}

      {/* Immediate Live Mock Feedback Modal */}
      {activeMockReview && (
        <LiveMockFeedbackModal
          isOpen={!!activeMockReview}
          dispatch={activeMockReview}
          onClose={() => setActiveMockReview(null)}
        />
      )}

      {/* Edit Study Log Modal */}
      {editingStudyLog && (
        <EditStudyLogModal
          isOpen={!!editingStudyLog}
          onClose={() => setEditingStudyLog(null)}
          studyLog={editingStudyLog}
          onSaved={loadDashboardData}
          onDeleted={loadDashboardData}
        />
      )}
    </div>
  );
};
