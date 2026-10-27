import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  XCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { RevisionRecord, Commitment, Subject, Topic, RevisionInterval, RevisionStatus } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString, addDays, daysBetween } from '../services/dateUtils';

export const RevisionsView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'due' | 'overdue' | 'completed' | 'all'>('due');

  // Schedule modal
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [schedExamId, setSchedExamId] = useState<string>('comm_ibps_rrb_po');
  const [schedSubjectId, setSchedSubjectId] = useState<string>('');
  const [schedTopicId, setSchedTopicId] = useState<string>('');
  const [basisDate, setBasisDate] = useState<string>(getTodayDateString());
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>([1, 3, 7]);

  // Reschedule modal
  const [reschedulingRev, setReschedulingRev] = useState<RevisionRecord | null>(null);
  const [newSchedDate, setNewSchedDate] = useState<string>('');

  const loadData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);

      const [rList, cList, sList, tList] = await Promise.all([
        dbService.getAll<RevisionRecord>('revisions'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
      ]);

      setRevisions(rList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
      setCommitments(cList);
      setSubjects(sList);
      setTopics(tList);

      if (sList.length > 0 && !schedSubjectId) {
        setSchedSubjectId(sList[0].id);
      }
    } catch (err) {
      console.error('Error loading revisions:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter topics based on selected subject in modal
  const availableTopics = topics.filter((t) => t.subjectId === schedSubjectId && !t.archived);

  // Toggle spaced interval
  const toggleInterval = (intVal: number) => {
    setSelectedIntervals((prev) =>
      prev.includes(intVal) ? prev.filter((i) => i !== intVal) : [...prev, intVal].sort((a, b) => a - b)
    );
  };

  // Schedule new revisions
  const handleScheduleRevisions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedExamId || !schedSubjectId || !schedTopicId || selectedIntervals.length === 0) {
      alert('Please select an examination, subject, topic, and at least one interval.');
      return;
    }

    try {
      const newRecords: RevisionRecord[] = selectedIntervals.map((interval) => ({
        id: `rev_${Date.now()}_${interval}_${Math.random().toString(36).substring(2, 6)}`,
        examId: schedExamId,
        subjectId: schedSubjectId,
        topicId: schedTopicId,
        basisDate,
        intervalDays: interval,
        scheduledDate: addDays(basisDate, interval),
        status: 'due',
        createdAt: new Date().toISOString(),
      }));

      await dbService.putMany<RevisionRecord>('revisions', newRecords);
      setIsScheduleOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to schedule revisions:', err);
    }
  };

  // Mark Completed
  const handleMarkComplete = async (rev: RevisionRecord) => {
    try {
      const updated: RevisionRecord = {
        ...rev,
        status: 'completed',
        completedAt: todayStr,
      };
      await dbService.put<RevisionRecord>('revisions', updated);
      loadData();
    } catch (err) {
      console.error('Failed to complete revision:', err);
    }
  };

  // Skip Revision
  const handleSkip = async (rev: RevisionRecord) => {
    try {
      const updated: RevisionRecord = {
        ...rev,
        status: 'skipped',
      };
      await dbService.put<RevisionRecord>('revisions', updated);
      loadData();
    } catch (err) {
      console.error('Failed to skip revision:', err);
    }
  };

  // Confirm Reschedule
  const handleReschedule = async () => {
    if (!reschedulingRev || !newSchedDate) return;
    try {
      const updated: RevisionRecord = {
        ...reschedulingRev,
        status: 'rescheduled',
        scheduledDate: newSchedDate,
        rescheduledTo: newSchedDate,
      };
      await dbService.put<RevisionRecord>('revisions', updated);
      setReschedulingRev(null);
      loadData();
    } catch (err) {
      console.error('Failed to reschedule revision:', err);
    }
  };

  // Filter list
  const dueList = revisions.filter(
    (r) => (r.status === 'due' || r.status === 'rescheduled') && r.scheduledDate === todayStr
  );
  const overdueList = revisions.filter(
    (r) => (r.status === 'due' || r.status === 'rescheduled') && r.scheduledDate < todayStr
  );
  const completedList = revisions.filter((r) => r.status === 'completed');

  const displayedList =
    activeTab === 'due'
      ? dueList
      : activeTab === 'overdue'
      ? overdueList
      : activeTab === 'completed'
      ? completedList
      : revisions;

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Spaced Revision System</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manual intervals (+1, +3, +7, +14, +30 days) • No automatic future rolling • Retention tracking
          </p>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Revision Cycle</span>
        </button>
      </div>

      {/* Overview Stat Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('due')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'due' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500">Due Today</span>
          <div className="text-2xl font-bold text-amber-700 mt-0.5">{dueList.length}</div>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'overdue' ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500">Overdue (Require Action)</span>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">{overdueList.length}</div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500">Completed Revisions</span>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{completedList.length}</div>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            activeTab === 'all' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-500">All Scheduled</span>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{revisions.length}</div>
        </button>
      </div>

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Schedule Spaced Revision</h3>
            <form onSubmit={handleScheduleRevisions} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Examination</label>
                <select
                  value={schedExamId}
                  onChange={(e) => setSchedExamId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {commitments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <select
                    value={schedSubjectId}
                    onChange={(e) => setSchedSubjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Topic</label>
                  <select
                    value={schedTopicId}
                    onChange={(e) => setSchedTopicId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  >
                    <option value="">-- Choose Topic --</option>
                    {availableTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Basis Date (When Learned)</label>
                <input
                  type="date"
                  value={basisDate}
                  onChange={(e) => setBasisDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Spaced Intervals to Generate
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 3, 7, 14, 30].map((intVal) => (
                    <button
                      key={intVal}
                      type="button"
                      onClick={() => toggleInterval(intVal)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        selectedIntervals.includes(intVal)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      +{intVal} days ({addDays(basisDate, intVal).slice(5)})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
                >
                  Schedule ({selectedIntervals.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingRev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reschedule Revision</h3>
            <p className="text-xs text-slate-500">
              Pick a realistic new revision date. Overdue revisions are never automatically forced into the future.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Revision Date</label>
              <input
                type="date"
                min={todayStr}
                value={newSchedDate}
                onChange={(e) => setNewSchedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReschedulingRev(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
              >
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {displayedList.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RotateCw className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No revision records in this tab.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedList.map((rev) => {
              const examName = examMap.get(rev.examId) || rev.examId;
              const subjectName = subjectMap.get(rev.subjectId) || rev.subjectId;
              const topicName = topicMap.get(rev.topicId) || rev.topicId;
              const isOverdue =
                (rev.status === 'due' || rev.status === 'rescheduled') && rev.scheduledDate < todayStr;
              const isDueToday =
                (rev.status === 'due' || rev.status === 'rescheduled') && rev.scheduledDate === todayStr;

              return (
                <div
                  key={rev.id}
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOverdue ? 'bg-rose-50/30' : isDueToday ? 'bg-amber-50/30' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        rev.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : isOverdue
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      }`}
                    >
                      +{rev.intervalDays}d
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-slate-900">{topicName}</h4>
                        <span className="text-[10px] text-slate-400">({subjectName})</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            rev.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : isDueToday
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rev.status === 'completed'
                            ? 'Completed'
                            : isOverdue
                            ? 'Overdue'
                            : isDueToday
                            ? 'Due Today'
                            : 'Upcoming'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600">{examName}</span>
                        <span>•</span>
                        <span>Scheduled: {rev.scheduledDate}</span>
                        <span>•</span>
                        <span>Learned basis: {rev.basisDate}</span>
                        {rev.completedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700">Completed on {rev.completedAt}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for due / overdue */}
                  {rev.status !== 'completed' && rev.status !== 'skipped' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleMarkComplete(rev)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>

                      <button
                        onClick={() => {
                          setReschedulingRev(rev);
                          setNewSchedDate(addDays(todayStr, 2));
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => handleSkip(rev)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                        title="Skip this revision"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
