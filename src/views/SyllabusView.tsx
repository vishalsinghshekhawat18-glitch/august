import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Archive,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  Commitment,
  Subject,
  Topic,
  Subtopic,
  TopicProgress,
  LearningStatus,
  PracticeStatus,
  RevisionProgressStatus,
} from '../types';
import { dbService } from '../services/db';
import { SmartPacingModal } from '../components/SmartPacingModal';

export const SyllabusView: React.FC = () => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('comm_ibps_rrb_po');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, TopicProgress>>(new Map());

  // UI state
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Modals / forms
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState<boolean>(false);
  const [activeSubjectIdForTopic, setActiveSubjectIdForTopic] = useState<string>('');

  // Form fields
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [newSubjectDesc, setNewSubjectDesc] = useState<string>('');
  const [newSubjectExamIds, setNewSubjectExamIds] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [newTopicNotes, setNewTopicNotes] = useState<string>('');
  const [pacingSubject, setPacingSubject] = useState<Subject | null>(null);

  const loadData = async () => {
    try {
      const [comms, subs, tops, subtops, progList] = await Promise.all([
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
        dbService.getAll<Subtopic>('subtopics'),
        dbService.getAll<TopicProgress>('topicProgress'),
      ]);

      const sortedComms = comms.sort((a, b) => a.priority - b.priority);
      setCommitments(sortedComms);
      if (!sortedComms.some((c) => c.id === selectedExamId) && sortedComms.length > 0) {
        setSelectedExamId(sortedComms[0].id);
      }

      setSubjects(subs.sort((a, b) => a.order - b.order));
      setTopics(tops.sort((a, b) => a.order - b.order));
      setSubtopics(subtops);

      const pMap = new Map<string, TopicProgress>();
      for (const p of progList) {
        pMap.set(`${p.examId}_${p.topicId}`, p);
      }
      setProgressMap(pMap);

      // Expand all subjects by default for clear view
      setExpandedSubjects(new Set(subs.map((s) => s.id)));
    } catch (err) {
      console.error('Error loading syllabus data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleSubjectExpand = (subId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  // Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const targetExamIds = newSubjectExamIds.length > 0 ? newSubjectExamIds : [selectedExamId];
      const newSub: Subject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newSubjectName.trim(),
        description: newSubjectDesc.trim() || undefined,
        examIds: targetExamIds,
        order: subjects.length + 1,
      };
      await dbService.put<Subject>('subjects', newSub);
      setNewSubjectName('');
      setNewSubjectDesc('');
      setNewSubjectExamIds([]);
      setIsAddSubjectOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to add subject:', err);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (sub: Subject) => {
    if (!confirm(`Are you sure you want to remove subject "${sub.name}"? Topics under this subject will also be removed.`)) return;
    try {
      // If shared across multiple exams, only unlink from current exam unless it's only in this exam
      if (sub.examIds.length > 1) {
        const updated = {
          ...sub,
          examIds: sub.examIds.filter((id) => id !== selectedExamId),
        };
        await dbService.put<Subject>('subjects', updated);
      } else {
        await dbService.delete('subjects', sub.id);
        const subjectTopics = topics.filter((t) => t.subjectId === sub.id);
        for (const t of subjectTopics) {
          await dbService.delete('topics', t.id);
        }
      }
      loadData();
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  // Add Topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !activeSubjectIdForTopic) return;

    try {
      const newTop: Topic = {
        id: `top_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: activeSubjectIdForTopic,
        name: newTopicName.trim(),
        notes: newTopicNotes.trim() || undefined,
        order: topics.filter((t) => t.subjectId === activeSubjectIdForTopic).length + 1,
        archived: false,
      };
      await dbService.put<Topic>('topics', newTop);
      setNewTopicName('');
      setNewTopicNotes('');
      setIsAddTopicOpen(false);

      // Initialize TopicProgress for the selected exam
      const newProgress: TopicProgress = {
        id: `${selectedExamId}_${newTop.id}`,
        examId: selectedExamId,
        topicId: newTop.id,
        learningStatus: 'not_started',
        practiceStatus: 'not_started',
        revisionStatus: 'not_started',
        manualCompletionPercentage: 0,
        updatedAt: new Date().toISOString(),
      };
      await dbService.put<TopicProgress>('topicProgress', newProgress);

      setNewTopicName('');
      setIsAddTopicOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to add topic:', err);
    }
  };

  // Delete Topic
  const handleDeleteTopic = async (topicId: string, topicNameStr: string) => {
    if (!confirm(`Are you sure you want to delete topic "${topicNameStr}"?`)) return;
    try {
      await dbService.delete('topics', topicId);
      loadData();
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  // Update Progress dimension for this specific exam
  const handleUpdateProgress = async (
    topicId: string,
    field: 'learningStatus' | 'practiceStatus' | 'revisionStatus' | 'manualCompletionPercentage',
    val: unknown
  ) => {
    try {
      const key = `${selectedExamId}_${topicId}`;
      const existing = progressMap.get(key) || {
        id: key,
        examId: selectedExamId,
        topicId,
        learningStatus: 'not_started',
        practiceStatus: 'not_started',
        revisionStatus: 'not_started',
        manualCompletionPercentage: 0,
        updatedAt: new Date().toISOString(),
      };

      const updated = {
        ...existing,
        [field]: val,
        updatedAt: new Date().toISOString(),
      };

      await dbService.put<TopicProgress>('topicProgress', updated);
      setProgressMap((prev) => new Map(prev).set(key, updated));
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  // Archive Topic (Preserves history & study logs)
  const handleToggleArchiveTopic = async (topic: Topic) => {
    try {
      const updated = { ...topic, archived: !topic.archived };
      await dbService.put<Topic>('topics', updated);
      loadData();
    } catch (err) {
      console.error('Failed to archive topic:', err);
    }
  };

  // Filter subjects that belong to the selected exam
  const filteredSubjects = subjects.filter((s) => s.examIds.includes(selectedExamId));

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Examination Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Syllabus &amp; Multi-Dimension Progress</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build your syllabus gradually • Exam-specific progress tracking • Fully customizable &amp; removable
          </p>
        </div>

        {/* Exam Tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {commitments.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedExamId(c.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedExamId === c.id
                  ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.code || c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Explanatory Note regarding 3 Independent Dimensions */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block mb-0.5">3 Independent Progress Dimensions</span>
          <span>
            Hours spent do not equate to topic readiness. You control <strong>Learning</strong> (conceptual grasp),{' '}
            <strong>Practice</strong> (question sets &amp; speed), and <strong>Revision</strong> (retention cycle) separately.
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewSubjectExamIds([selectedExamId]);
              setIsAddSubjectOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subject</span>
          </button>

          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show archived topics</span>
          </label>
        </div>

        <span className="text-xs text-slate-400">
          {filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} in view
        </span>
      </div>

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add Subject to Current Exam</h3>
            <form onSubmit={handleAddSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Economics, Reasoning Ability"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Online Notes URL / Resource <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://.../reader.html?book=economics"
                  value={newSubjectDesc}
                  onChange={(e) => setNewSubjectDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Relevant Examinations</label>
                <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                  {commitments.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSubjectExamIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSubjectExamIds((prev) => [...prev, c.id]);
                          } else {
                            if (newSubjectExamIds.length > 1) {
                              setNewSubjectExamIds((prev) => prev.filter((id) => id !== c.id));
                            }
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{c.name} {c.priority === 1 ? '★ [Priority 1]' : `(Priority ${c.priority})`}</span>
                    </label>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Subject &amp; chapter progress will be synchronized across all checked exams</span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isAddTopicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Topic</h3>
            <form onSubmit={handleAddTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Topic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Monetary Policy, Fiscal Deficit, National Income"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Online Material URL / Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://.../reader.html?book=economics or Chapter 3 notes"
                  value={newTopicNotes}
                  onChange={(e) => setNewTopicNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTopicOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects & Topics Tree */}
      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No subjects configured for this examination</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your first subject (e.g. Reasoning, Quant, Economics) to start building your progressive syllabus.
            </p>
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm"
            >
              + Add First Subject
            </button>
          </div>
        ) : (
          filteredSubjects.map((subject) => {
            const isExpanded = expandedSubjects.has(subject.id);
            const subjectTopics = topics.filter(
              (t) => t.subjectId === subject.id && (showArchived || !t.archived)
            );

            // Calculate overall subject completion
            let subjectCompletionAvg = 0;
            if (subjectTopics.length > 0) {
              const sum = subjectTopics.reduce((acc, t) => {
                const prog = progressMap.get(`${selectedExamId}_${t.id}`);
                return acc + (prog?.manualCompletionPercentage || 0);
              }, 0);
              subjectCompletionAvg = Math.round(sum / subjectTopics.length);
            }

            return (
              <div
                key={subject.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Subject Header */}
                <div className="px-5 py-4 bg-white flex items-center justify-between border-b border-slate-100">
                  <div
                    onClick={() => toggleSubjectExpand(subject.id)}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <button className="text-slate-400 hover:text-slate-600 p-0.5">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{subject.name}</h3>
                        {subject.description && (
                          subject.description.startsWith('http') ? (
                            <a
                              href={subject.description}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg font-medium transition"
                              title={subject.description}
                            >
                              <span>Read Notes</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {subject.description}
                            </span>
                          )
                        )}
                        {subject.examIds.length > 1 && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium px-1.5 py-0.2 rounded">
                            Shared across {subject.examIds.length} exams
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {subjectTopics.length} topic{subjectTopics.length !== 1 ? 's' : ''} • Avg. {subjectCompletionAvg}% complete
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPacingSubject(subject)}
                      className="px-2.5 py-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 shadow-2xs"
                      title="Smart pacing calculator & schedule remaining chapters"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Pacing &amp; Schedule</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveSubjectIdForTopic(subject.id);
                        setIsAddTopicOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg border border-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Topic</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSubject(subject)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      title="Remove this subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Topics List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {subjectTopics.length === 0 ? (
                      <div className="p-5 text-center text-xs text-slate-400">
                        No topics added to {subject.name} yet. Click &quot;Add Topic&quot; to begin.
                      </div>
                    ) : (
                      subjectTopics.map((topic) => {
                        const progress = progressMap.get(`${selectedExamId}_${topic.id}`) || {
                          id: `${selectedExamId}_${topic.id}`,
                          examId: selectedExamId,
                          topicId: topic.id,
                          learningStatus: 'not_started',
                          practiceStatus: 'not_started',
                          revisionStatus: 'not_started',
                          manualCompletionPercentage: 0,
                          updatedAt: new Date().toISOString(),
                        };

                        return (
                          <div
                            key={topic.id}
                            className={`p-4 transition-colors ${
                              topic.archived ? 'bg-slate-50 opacity-60' : 'bg-white hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              {/* Topic Name & Status */}
                              <div className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-semibold text-slate-800">{topic.name}</h4>
                                    {topic.notes && (
                                      topic.notes.startsWith('http') ? (
                                        <a
                                          href={topic.notes}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg font-medium transition"
                                          title={topic.notes}
                                        >
                                          <span>Read Notes</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ) : (
                                        <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                          {topic.notes}
                                        </span>
                                      )
                                    )}
                                    {topic.archived && (
                                      <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-medium">
                                        Archived
                                      </span>
                                    )}
                                  </div>
                                  {progress.lastStudiedAt && (
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      Last studied: {progress.lastStudiedAt}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 3 Dimension Controls */}
                              <div className="flex flex-wrap items-center gap-3">
                                {/* 1. Learning Status */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400">Learning:</span>
                                  <select
                                    value={progress.learningStatus}
                                    onChange={(e) =>
                                      handleUpdateProgress(topic.id, 'learningStatus', e.target.value as LearningStatus)
                                    }
                                    className={`text-[11px] px-2 py-1 rounded-md border font-medium focus:outline-none ${
                                      progress.learningStatus === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : progress.learningStatus === 'in_progress'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : progress.learningStatus === 'needs_restudy'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <option value="not_started">Not Started</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="needs_restudy">Needs Re-Study</option>
                                  </select>
                                </div>

                                {/* 2. Practice Status */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400">Practice:</span>
                                  <select
                                    value={progress.practiceStatus}
                                    onChange={(e) =>
                                      handleUpdateProgress(topic.id, 'practiceStatus', e.target.value as PracticeStatus)
                                    }
                                    className={`text-[11px] px-2 py-1 rounded-md border font-medium focus:outline-none ${
                                      progress.practiceStatus === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : progress.practiceStatus === 'in_progress'
                                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <option value="not_started">Unpracticed</option>
                                    <option value="in_progress">Practicing</option>
                                    <option value="completed">Practiced</option>
                                  </select>
                                </div>

                                {/* 3. Revision Status */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400">Revision:</span>
                                  <select
                                    value={progress.revisionStatus}
                                    onChange={(e) =>
                                      handleUpdateProgress(
                                        topic.id,
                                        'revisionStatus',
                                        e.target.value as RevisionProgressStatus
                                      )
                                    }
                                    className={`text-[11px] px-2 py-1 rounded-md border font-medium focus:outline-none ${
                                      progress.revisionStatus === 'completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : progress.revisionStatus === 'in_progress'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <option value="not_started">Not Revised</option>
                                    <option value="in_progress">Scheduled</option>
                                    <option value="completed">Revised</option>
                                  </select>
                                </div>

                                {/* Manual Completion Slider */}
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={progress.manualCompletionPercentage || 0}
                                    onChange={(e) =>
                                      handleUpdateProgress(
                                        topic.id,
                                        'manualCompletionPercentage',
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                    className="w-16 h-1.5 accent-indigo-600 cursor-pointer"
                                    title="Manual preparation percentage"
                                  />
                                  <span className="text-[11px] font-mono font-medium text-slate-600 w-8 text-right">
                                    {progress.manualCompletionPercentage || 0}%
                                  </span>
                                </div>

                                {/* Actions: Archive & Delete */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleArchiveTopic(topic)}
                                    className="text-slate-400 hover:text-slate-600 p-1"
                                    title={topic.archived ? 'Unarchive Topic' : 'Archive Topic'}
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteTopic(topic.id, topic.name)}
                                    className="text-slate-300 hover:text-rose-600 p-1"
                                    title="Delete topic"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* Smart Pacing Modal */}
      {pacingSubject && (
        <SmartPacingModal
          isOpen={!!pacingSubject}
          onClose={() => setPacingSubject(null)}
          subject={pacingSubject}
          topics={topics}
          progressMap={progressMap}
          commitments={commitments}
          onPlanApplied={() => loadData()}
        />
      )}
    </div>
  );
};
