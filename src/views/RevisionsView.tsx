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
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { RevisionRecord, Commitment, Subject, Topic, RevisionInterval, RevisionStatus, TopicProgress } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString, addDays, daysBetween } from '../services/dateUtils';
import { BatchReadChaptersModal } from '../components/BatchReadChaptersModal';
import { CompleteRevisionModal } from '../components/CompleteRevisionModal';

interface RevisionsViewProps {
  onNavigate?: (viewId: string) => void;
}

export const RevisionsView: React.FC<RevisionsViewProps> = ({ onNavigate }) => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, TopicProgress>>(new Map());
  const [isBatchRevOpen, setIsBatchRevOpen] = useState<boolean>(false);

  // Filter tab
  const [activeTab, setActiveTab] = useState<'due' | 'overdue' | 'completed' | 'all'>('due');

  // Schedule modal state
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);
  const [schedExamId, setSchedExamId] = useState<string>('comm_ibps_rrb_po');
  const [schedSubjectId, setSchedSubjectId] = useState<string>('');
  const [schedTopicId, setSchedTopicId] = useState<string>('');
  const [basisDate, setBasisDate] = useState<string>(getTodayDateString());
  const [selectedIntervals, setSelectedIntervals] = useState<number[]>([1, 3, 7]);
  const [modalError, setModalError] = useState<string | null>(null);

  // Inline subject / topic creation toggles within modal
  const [isInlineAddingSubject, setIsInlineAddingSubject] = useState<boolean>(false);
  const [inlineSubjectName, setInlineSubjectName] = useState<string>('');
  const [isInlineAddingTopic, setIsInlineAddingTopic] = useState<boolean>(false);
  const [inlineTopicName, setInlineTopicName] = useState<string>('');

  // Reschedule modal
  const [reschedulingRev, setReschedulingRev] = useState<RevisionRecord | null>(null);
  const [newSchedDate, setNewSchedDate] = useState<string>('');

  // Complete / Edit revision time modal
  const [completingRevision, setCompletingRevision] = useState<RevisionRecord | null>(null);
  const [isEditingRevisionTime, setIsEditingRevisionTime] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const today = getTodayDateString();
      setTodayStr(today);

      const [rList, cList, sList, tList, progList] = await Promise.all([
        dbService.getAll<RevisionRecord>('revisions'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
        dbService.getAll<TopicProgress>('topicProgress'),
      ]);

      setRevisions(rList.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)));
      setCommitments(cList.sort((a, b) => a.priority - b.priority));
      setSubjects(sList);
      setTopics(tList);

      const pMap = new Map<string, TopicProgress>();
      for (const p of progList) {
        pMap.set(`${p.examId}_${p.topicId}`, p);
      }
      setProgressMap(pMap);

      if (cList.length > 0 && !schedExamId) {
        setSchedExamId(cList[0].id);
      }
    } catch (err) {
      console.error('Error loading revisions:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When opening schedule modal, refresh all data to pick up any syllabus additions
  useEffect(() => {
    if (isScheduleOpen) {
      loadData();
      setModalError(null);
      setIsInlineAddingSubject(false);
      setIsInlineAddingTopic(false);
    }
  }, [isScheduleOpen]);

  // Available subjects for the selected examination
  const availableSubjects = subjects.filter((s) => s.examIds.includes(schedExamId));

  // Synchronize schedSubjectId whenever schedExamId or subjects change
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!availableSubjects.some((s) => s.id === schedSubjectId)) {
        setSchedSubjectId(availableSubjects[0].id);
      }
    } else {
      setSchedSubjectId('');
    }
  }, [schedExamId, subjects]);

  // Available topics for the selected subject
  const availableTopics = topics.filter((t) => t.subjectId === schedSubjectId && !t.archived);

  // Synchronize schedTopicId whenever schedSubjectId or topics change
  useEffect(() => {
    if (availableTopics.length > 0) {
      if (!availableTopics.some((t) => t.id === schedTopicId)) {
        setSchedTopicId(availableTopics[0].id);
      }
    } else {
      setSchedTopicId('');
    }
  }, [schedSubjectId, topics]);

  // Toggle spaced interval
  const toggleInterval = (intVal: number) => {
    setSelectedIntervals((prev) =>
      prev.includes(intVal) ? prev.filter((i) => i !== intVal) : [...prev, intVal].sort((a, b) => a - b)
    );
  };

  // Inline Quick-Add Subject
  const handleInlineAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineSubjectName.trim()) return;

    try {
      const newSub: Subject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: inlineSubjectName.trim(),
        examIds: [schedExamId],
        order: subjects.length + 1,
      };

      await dbService.put<Subject>('subjects', newSub);
      setSubjects((prev) => [...prev, newSub]);
      setSchedSubjectId(newSub.id);
      setInlineSubjectName('');
      setIsInlineAddingSubject(false);
      setModalError(null);
    } catch (err) {
      console.error('Failed to quick-add subject:', err);
    }
  };

  // Inline Quick-Add Topic
  const handleInlineAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTopicName.trim() || !schedSubjectId) return;

    try {
      const newTop: Topic = {
        id: `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: schedSubjectId,
        name: inlineTopicName.trim(),
        order: topics.filter((t) => t.subjectId === schedSubjectId).length + 1,
        archived: false,
      };

      await dbService.put<Topic>('topics', newTop);
      setTopics((prev) => [...prev, newTop]);
      setSchedTopicId(newTop.id);
      setInlineTopicName('');
      setIsInlineAddingTopic(false);
      setModalError(null);
    } catch (err) {
      console.error('Failed to quick-add topic:', err);
    }
  };

  // Schedule new revisions
  const handleScheduleRevisions = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!schedExamId) {
      setModalError('Please select an examination commitment.');
      return;
    }
    if (!schedSubjectId) {
      setModalError('Please select or create a subject under this examination.');
      return;
    }
    if (!schedTopicId) {
      setModalError('Please select or create a topic under this subject.');
      return;
    }
    if (selectedIntervals.length === 0) {
      setModalError('Please select at least one revision interval (e.g. +1, +3, +7 days).');
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
      setModalError('Failed to save revisions to browser storage.');
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
  const selectedExam = commitments.find((c) => c.id === schedExamId);
  const selectedSubject = subjects.find((s) => s.id === schedSubjectId);

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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBatchRevOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            title="Mark chapters revised yesterday or today, complete due revisions, and schedule next cycle"
          >
            <RotateCw className="w-4 h-4" />
            <span>Mark Chapters Revised</span>
          </button>

          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Revision Cycle</span>
          </button>
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Schedule Spaced Revision</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a topic from your syllabus to generate revision milestones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleRevisions} className="space-y-4">
              {/* Examination Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Examination</label>
                <select
                  value={schedExamId}
                  onChange={(e) => setSchedExamId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {commitments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.priority === 1 ? '★ [Priority 1]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector or Missing Subject Alert */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">Subject</label>
                  {!isInlineAddingSubject && (
                    <button
                      type="button"
                      onClick={() => setIsInlineAddingSubject(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Quick-Add Subject</span>
                    </button>
                  )}
                </div>

                {isInlineAddingSubject ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <span className="text-xs font-semibold text-slate-800">Add Subject to {selectedExam?.name}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Reasoning Ability"
                        value={inlineSubjectName}
                        onChange={(e) => setInlineSubjectName(e.target.value)}
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded bg-white"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleInlineAddSubject}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInlineAddingSubject(false)}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : availableSubjects.length === 0 ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No subjects found for {selectedExam?.name || 'this examination'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      To schedule a revision, you must first add at least one subject and topic under this examination in your syllabus.
                    </p>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsInlineAddingSubject(true)}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium text-xs shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Quick-Add Subject Here</span>
                      </button>

                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsScheduleOpen(false);
                            onNavigate('syllabus');
                          }}
                          className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-medium text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Open Syllabus</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <select
                    value={schedSubjectId}
                    onChange={(e) => setSchedSubjectId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Topic Selector or Missing Topic Alert */}
              {availableSubjects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">Topic</label>
                    {schedSubjectId && !isInlineAddingTopic && (
                      <button
                        type="button"
                        onClick={() => setIsInlineAddingTopic(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Quick-Add Topic</span>
                      </button>
                    )}
                  </div>

                  {isInlineAddingTopic ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <span className="text-xs font-semibold text-slate-800">Add Topic to {selectedSubject?.name}</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Syllogism Drill"
                          value={inlineTopicName}
                          onChange={(e) => setInlineTopicName(e.target.value)}
                          className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleInlineAddTopic}
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsInlineAddingTopic(false)}
                          className="px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : availableTopics.length === 0 ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>No topics found under {selectedSubject?.name || 'this subject'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        Please add at least one topic under this subject before scheduling revisions.
                      </p>
                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setIsInlineAddingTopic(true)}
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium text-xs shadow-sm transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Quick-Add Topic Here</span>
                        </button>

                        {onNavigate && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsScheduleOpen(false);
                              onNavigate('syllabus');
                            }}
                            className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-medium text-xs transition-colors flex items-center gap-1"
                          >
                            <span>Open Syllabus</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <select
                      value={schedTopicId}
                      onChange={(e) => setSchedTopicId(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Choose Topic --</option>
                      {availableTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Basis Date */}
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

              {/* Spaced Intervals */}
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

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableSubjects.length === 0 || availableTopics.length === 0}
                  className="px-4 py-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium shadow-sm transition-colors"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-slate-900">{topicName}</h4>
                        {rev.notes && (
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md shadow-2xs">
                            {rev.notes}
                          </span>
                        )}
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
                            <span className="text-emerald-700 font-medium">Completed on {rev.completedAt}</span>
                          </>
                        )}
                        {rev.durationMinutes ? (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{rev.durationMinutes} min</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions for due / overdue */}
                  {rev.status !== 'completed' && rev.status !== 'skipped' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setCompletingRevision(rev);
                          setIsEditingRevisionTime(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                        title="Mark complete and log the time you spent revising"
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

                  {/* Actions for already completed revisions (Log / Edit Time) */}
                  {rev.status === 'completed' && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {rev.durationMinutes ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{rev.durationMinutes} min</span>
                        </span>
                      ) : null}
                      <button
                        onClick={() => {
                          setCompletingRevision(rev);
                          setIsEditingRevisionTime(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        title="Edit or log the minutes spent on this revision"
                      >
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{rev.durationMinutes ? 'Edit Time' : 'Log Time'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Mark Chapters Revised Modal */}
      {isBatchRevOpen && subjects.length > 0 && (
        <BatchReadChaptersModal
          isOpen={isBatchRevOpen}
          onClose={() => setIsBatchRevOpen(false)}
          subject={subjects.find((s) => s.name.toLowerCase().includes('econ')) || subjects[0]}
          allSubjects={subjects}
          topics={topics}
          progressMap={progressMap}
          commitments={commitments}
          initialMode="revision"
          onSaved={() => loadData()}
        />
      )}

      {/* Complete or Edit Revision Time Modal */}
      {completingRevision && (
        <CompleteRevisionModal
          isOpen={!!completingRevision}
          onClose={() => setCompletingRevision(null)}
          revision={completingRevision}
          topicName={topicMap.get(completingRevision.topicId) || 'Chapter'}
          subjectName={subjectMap.get(completingRevision.subjectId) || 'Subject'}
          allDueRevisions={dueList}
          allTopics={topics}
          isEditing={isEditingRevisionTime}
          onSaved={() => loadData()}
        />
      )}
    </div>
  );
};
