import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Trash2,
  HelpCircle,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  WeeklyPlan,
  WeeklyTask,
  Commitment,
  StudyLog,
  TopicProgress,
  MistakeEntry,
  UniversityItem,
  TaskStatus,
} from '../types';
import { dbService } from '../services/db';
import { getTodayDateString, getWeekBounds, getNextWeekBounds, formatHoursDecimal } from '../services/dateUtils';
import {
  calculateWeightedCompletion,
  analyzeWeeklyCapacity,
  generateProposedNextWeekPlan,
} from '../services/planning';

export const PlanningView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [historicalLogs, setHistoricalLogs] = useState<StudyLog[]>([]);
  const [allPlans, setAllPlans] = useState<WeeklyPlan[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [universityItems, setUniversityItems] = useState<UniversityItem[]>([]);

  // Task creation modal
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskExamId, setNewTaskExamId] = useState<string>('comm_ibps_rrb_po');
  const [newTaskEstMinutes, setNewTaskEstMinutes] = useState<number>(120);
  const [newTaskWeight, setNewTaskWeight] = useState<number>(3);
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  // Unfinished task resolution modal
  const [resolvingTask, setResolvingTask] = useState<WeeklyTask | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'reschedule' | 'defer' | 'reduce' | 'drop'>('reschedule');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [rescheduleDate, setRescheduleDate] = useState<string>('');

  const loadPlanningData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);
      const weekBounds = getWeekBounds(today);

      const [plans, comms, logs, prog, mist, uItems] = await Promise.all([
        dbService.getAll<WeeklyPlan>('weeklyPlans'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<StudyLog>('studyLogs'),
        dbService.getAll<TopicProgress>('topicProgress'),
        dbService.getAll<MistakeEntry>('mistakes'),
        dbService.getAll<UniversityItem>('universityItems'),
      ]);

      setAllPlans(plans);
      setCommitments(comms);
      setHistoricalLogs(logs);
      setTopicProgress(prog);
      setMistakes(mist);
      setUniversityItems(uItems);

      // Current week plan
      let plan = plans.find((p) => p.weekStartDate === weekBounds.monday) || null;
      if (!plan) {
        // Initialize clean default plan for the current week with empty tasks
        plan = {
          id: `week_${weekBounds.monday}`,
          weekStartDate: weekBounds.monday,
          weekEndDate: weekBounds.sunday,
          targetHours: 25,
          status: 'approved',
          approvedAt: new Date().toISOString(),
          notes: 'Standard focused target for competitive preparation.',
          tasks: [],
        };
        await dbService.put<WeeklyPlan>('weeklyPlans', plan);
      }
      setCurrentPlan(plan);
    } catch (err) {
      console.error('Error loading planning view data:', err);
    }
  };

  useEffect(() => {
    loadPlanningData();
  }, []);

  // Capacity calculation
  const capacityAnalysis = analyzeWeeklyCapacity(currentPlan?.targetHours || 25, historicalLogs, todayStr);

  // Actual study minutes in the current week
  const weekBounds = getWeekBounds(todayStr);
  const weekLogs = historicalLogs.filter((l) => l.date >= weekBounds.monday && l.date <= weekBounds.sunday);
  const weekActualMinutes = weekLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

  // Weighted Completion
  const { weightedPercent, activeTaskCount, completedTaskCount } = calculateWeightedCompletion(
    currentPlan?.tasks || []
  );

  // Add Task Handler
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan || !newTaskTitle.trim()) return;

    try {
      const task: WeeklyTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        weeklyPlanId: currentPlan.id,
        title: newTaskTitle.trim(),
        examId: newTaskExamId,
        estimatedMinutes: Number(newTaskEstMinutes),
        weight: Number(newTaskWeight),
        status: 'planned',
        progressFraction: 0,
        dueDate: newTaskDueDate || undefined,
      };

      const updatedPlan: WeeklyPlan = {
        ...currentPlan,
        tasks: [...currentPlan.tasks, task],
      };

      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentPlan(updatedPlan);
      setNewTaskTitle('');
      setIsAddTaskOpen(false);
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  // Update Task Status / Progress
  const handleUpdateTask = async (
    taskId: string,
    updates: Partial<WeeklyTask>
  ) => {
    if (!currentPlan) return;
    try {
      const updatedTasks = currentPlan.tasks.map((t) => {
        if (t.id === taskId) {
          const next = { ...t, ...updates };
          if (next.status === 'completed') {
            next.progressFraction = 1.0;
          }
          return next;
        }
        return t;
      });

      const updatedPlan = { ...currentPlan, tasks: updatedTasks };
      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentPlan(updatedPlan);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  // Submit Unfinished Task Resolution
  const handleResolveTask = async () => {
    if (!currentPlan || !resolvingTask) return;

    try {
      let nextStatus: TaskStatus = resolvingTask.status;
      if (resolutionAction === 'defer') nextStatus = 'deferred';
      else if (resolutionAction === 'reduce') nextStatus = 'reduced';
      else if (resolutionAction === 'drop') nextStatus = 'dropped';
      else if (resolutionAction === 'reschedule') nextStatus = 'planned';

      const updatedTasks = currentPlan.tasks.map((t) => {
        if (t.id === resolvingTask.id) {
          return {
            ...t,
            status: nextStatus,
            dueDate: resolutionAction === 'reschedule' && rescheduleDate ? rescheduleDate : t.dueDate,
            resolutionNotes: resolutionNotes || `Resolved as ${resolutionAction}`,
          };
        }
        return t;
      });

      const updatedPlan = { ...currentPlan, tasks: updatedTasks };
      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentPlan(updatedPlan);
      setResolvingTask(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to resolve task:', err);
    }
  };

  // Generate Proposed Next-Week Plan
  const handleGenerateNextWeekProposal = async () => {
    try {
      const nextPlan = generateProposedNextWeekPlan(
        todayStr,
        commitments,
        topicProgress,
        mistakes,
        universityItems,
        historicalLogs
      );
      await dbService.put<WeeklyPlan>('weeklyPlans', nextPlan);
      alert(
        `Next week plan (${nextPlan.weekStartDate} to ${nextPlan.weekEndDate}) proposed successfully with ${nextPlan.tasks.length} recommended tasks! You can review and approve it anytime.`
      );
      loadPlanningData();
    } catch (err) {
      console.error('Failed to propose next-week plan:', err);
    }
  };

  // Update Target Hours
  const handleUpdateTargetHours = async (hours: number) => {
    if (!currentPlan) return;
    try {
      const updatedPlan = { ...currentPlan, targetHours: hours };
      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentPlan(updatedPlan);
    } catch (err) {
      console.error('Failed to update target hours:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!currentPlan) return;
    if (!confirm('Are you sure you want to remove this weekly task?')) return;
    try {
      const updatedTasks = currentPlan.tasks.filter((t) => t.id !== taskId);
      const updatedPlan = { ...currentPlan, tasks: updatedTasks };
      await dbService.put<WeeklyPlan>('weeklyPlans', updatedPlan);
      setCurrentPlan(updatedPlan);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Weekly Planning &amp; Targets</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
              Mon–Sun Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Current Week: {weekBounds.monday} to {weekBounds.sunday} • Realistic capacity • No hour debt roll-forward
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateNextWeekProposal}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Propose Next Week Plan</span>
          </button>

          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* KPI & Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weekly Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Target vs Actual Study Hours</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{formatHoursDecimal(weekActualMinutes)}</span>
            <span className="text-xs text-slate-400">/ {currentPlan?.targetHours || 25}h target</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <label className="text-[11px] text-slate-500">Edit Target:</label>
            <input
              type="number"
              min="5"
              max="70"
              step="5"
              value={currentPlan?.targetHours || 25}
              onChange={(e) => handleUpdateTargetHours(parseInt(e.target.value, 10) || 25)}
              className="w-16 px-2 py-0.5 border border-slate-200 rounded text-xs text-slate-700 font-bold"
            />
            <span className="text-[11px] text-slate-400">hrs</span>
          </div>
        </div>

        {/* Weighted Task Completion */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Weighted Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{weightedPercent}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Formula: Σ(Weight × Progress) / Σ(Weight) × 100
          </p>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {completedTaskCount} completed out of {activeTaskCount} active tasks
          </div>
        </div>

        {/* Capacity Advisor */}
        <div
          className={`p-4 rounded-xl border shadow-sm ${
            capacityAnalysis.isOverCapacity
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold mb-1">
            <AlertCircle className={`w-4 h-4 ${capacityAnalysis.isOverCapacity ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Capacity &amp; Trade-off Advisor</span>
          </div>
          <p className="text-xs leading-relaxed">{capacityAnalysis.recommendation}</p>
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Weekly Study Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Syllogism 100 Questions Drill"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Examination</label>
                  <select
                    value={newTaskExamId}
                    onChange={(e) => setNewTaskExamId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {commitments.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Weight (1 to 5)</label>
                  <select
                    value={newTaskWeight}
                    onChange={(e) => setNewTaskWeight(parseInt(e.target.value, 10))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={5}>5 ★ (Critical Milestone)</option>
                    <option value={4}>4 ★ (High Priority)</option>
                    <option value={3}>3 ★ (Standard Focus)</option>
                    <option value={2}>2 ★ (Practice / Support)</option>
                    <option value={1}>1 ★ (Minor / Quick Task)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Est. Minutes</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={newTaskEstMinutes}
                    onChange={(e) => setNewTaskEstMinutes(parseInt(e.target.value, 10) || 60)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unfinished Task Resolution Modal (Section 8: Reschedule, Defer, Reduce scope, Drop) */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Unfinished Task Resolution
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{resolvingTask.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every unfinished task must be explicitly resolved. Missed hours never roll forward as debt.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700">Choose Resolution Action:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'reschedule', label: 'Reschedule', desc: 'Set a new target date' },
                  { id: 'defer', label: 'Defer', desc: 'Postpone without penalty' },
                  { id: 'reduce', label: 'Reduce Scope', desc: 'Lower target requirement' },
                  { id: 'drop', label: 'Drop', desc: 'Archive without debt' },
                ].map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setResolutionAction(act.id as typeof resolutionAction)}
                    className={`p-2.5 rounded-lg border text-left transition-colors ${
                      resolutionAction === act.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{act.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{act.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {resolutionAction === 'reschedule' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Target Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Resolution Note</label>
              <input
                type="text"
                placeholder="Reason (e.g. prioritized mock test analysis; university submission completed first)"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingTask(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveTask}
                className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Weekly Target Tasks ({currentPlan?.tasks.length || 0})</h3>
          <span className="text-xs text-slate-400">Status: {currentPlan?.status}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {!currentPlan || currentPlan.tasks.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No tasks added for this week yet. Click &quot;Add Task&quot; or &quot;Propose Next Week Plan&quot;.
            </div>
          ) : (
            currentPlan.tasks.map((task) => {
              const examName = examMap.get(task.examId) || task.examId;
              const isDropped = task.status === 'dropped';
              const isCompleted = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 transition-colors ${
                    isDropped
                      ? 'bg-slate-50 opacity-50'
                      : isCompleted
                      ? 'bg-emerald-50/20'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() =>
                          handleUpdateTask(task.id, {
                            status: isCompleted ? 'in_progress' : 'completed',
                            progressFraction: isCompleted ? 0.5 : 1.0,
                          })
                        }
                        className={`mt-0.5 rounded-full p-0.5 transition-colors ${
                          isCompleted ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-xs font-semibold ${
                              isCompleted || isDropped ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.resolutionNotes && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {task.resolutionNotes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="font-medium text-slate-600">{examName}</span>
                          <span>•</span>
                          <span>Est: {task.estimatedMinutes}m</span>
                          <span>•</span>
                          <span>Weight: {task.weight}★</span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-600 font-medium">Due: {task.dueDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress Slider & Status Controls */}
                    <div className="flex items-center gap-3">
                      {/* Weight Selector */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Weight:</span>
                        <select
                          value={task.weight}
                          onChange={(e) =>
                            handleUpdateTask(task.id, { weight: parseInt(e.target.value, 10) })
                          }
                          className="px-1.5 py-0.5 border border-slate-200 rounded text-xs text-slate-700 font-semibold"
                        >
                          {[1, 2, 3, 4, 5].map((w) => (
                            <option key={w} value={w}>
                              {w}★
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Progress Fraction */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={task.progressFraction || 0}
                          onChange={(e) =>
                            handleUpdateTask(task.id, {
                              progressFraction: parseFloat(e.target.value),
                              status: parseFloat(e.target.value) >= 1.0 ? 'completed' : 'in_progress',
                            })
                          }
                          className="w-16 h-1.5 accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-[11px] font-mono text-slate-600 w-8 text-right">
                          {Math.round((task.progressFraction || 0) * 100)}%
                        </span>
                      </div>

                      {/* Status Badge / Selector */}
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                        className={`text-[11px] px-2 py-1 rounded-md border font-medium focus:outline-none ${
                          task.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : task.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : task.status === 'deferred'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : task.status === 'dropped'
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="planned">Planned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="deferred">Deferred</option>
                        <option value="reduced">Reduced</option>
                        <option value="dropped">Dropped</option>
                      </select>

                      {/* Unfinished Resolution Button */}
                      {task.status !== 'completed' && task.status !== 'dropped' && (
                        <button
                          onClick={() => setResolvingTask(task)}
                          className="text-[11px] px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md border border-amber-200 transition-colors"
                          title="Resolve unfinished task"
                        >
                          Resolve
                        </button>
                      )}

                      {/* Delete Task */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
