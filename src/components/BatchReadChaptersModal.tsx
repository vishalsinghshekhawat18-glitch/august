import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, BookOpen, Clock, Calendar, Sparkles, RotateCw, ArrowRight, ChevronDown } from 'lucide-react';
import { Subject, Topic, TopicProgress, Commitment } from '../types';
import { markBatchChaptersRead, markBatchChaptersRevised } from '../services/octoberLibrary';
import { getTodayDateString, addDays } from '../services/dateUtils';

interface BatchReadChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  allSubjects?: Subject[];
  topics: Topic[];
  progressMap: Map<string, TopicProgress>;
  commitments: Commitment[];
  initialMode?: 'learning' | 'revision';
  onSaved: () => void;
}

export const BatchReadChaptersModal: React.FC<BatchReadChaptersModalProps> = ({
  isOpen,
  onClose,
  subject,
  allSubjects,
  topics,
  progressMap,
  commitments,
  initialMode = 'learning',
  onSaved,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = addDays(todayStr, -1);

  const [mode, setMode] = useState<'learning' | 'revision'>(initialMode);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subject.id);
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(mode === 'revision' ? 60 : 90);
  const [autoRevision, setAutoRevision] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync mode and subject when prop changes
  useEffect(() => {
    setMode(initialMode);
    setSelectedSubjectId(subject.id);
    setSelectedDate(yesterdayStr);
    setSelectedTopicIds([]);
    setSuccessMessage(null);
  }, [isOpen, initialMode, subject.id]);

  if (!isOpen) return null;

  const currentSubject = (allSubjects || [subject]).find((s) => s.id === selectedSubjectId) || subject;

  const subjectTopics = topics
    .filter((t) => t.subjectId === currentSubject.id && !t.archived)
    .sort((a, b) => a.order - b.order);

  // Check which topics are already completed in learning vs revision
  const completedLearningIds = new Set<string>();
  const completedRevisionIds = new Set<string>();

  for (const t of subjectTopics) {
    for (const examId of currentSubject.examIds) {
      const p = progressMap.get(`${examId}_${t.id}`);
      if (p && (p.learningStatus === 'completed' || p.manualCompletionPercentage >= 100)) {
        completedLearningIds.add(t.id);
      }
      if (p && p.revisionStatus === 'completed') {
        completedRevisionIds.add(t.id);
      }
    }
  }

  // Pre-select options
  const uncompletedTopics = subjectTopics.filter((t) => !completedLearningIds.has(t.id));

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectCount = (count: number) => {
    if (mode === 'learning') {
      const nextIds = uncompletedTopics.slice(0, count).map((t) => t.id);
      setSelectedTopicIds(nextIds);
      setDurationMinutes(count * 45);
    } else {
      // In revision mode: select first count topics or next un-revised
      const candidateList = subjectTopics.filter((t) => !completedRevisionIds.has(t.id));
      const pool = candidateList.length >= count ? candidateList : subjectTopics;
      const nextIds = pool.slice(0, count).map((t) => t.id);
      setSelectedTopicIds(nextIds);
      setDurationMinutes(count * 30);
    }
  };

  const selectFirstTwo = () => {
    const nextIds = subjectTopics.slice(0, 2).map((t) => t.id);
    setSelectedTopicIds(nextIds);
    setDurationMinutes(mode === 'revision' ? 60 : 90);
  };

  const selectAllCompleted = () => {
    setSelectedTopicIds(Array.from(completedLearningIds));
    setDurationMinutes(completedLearningIds.size * 30);
  };

  // Calculations for learning mode
  const currentCompletedCount = completedLearningIds.size;
  const willBeCompletedCount =
    currentCompletedCount + selectedTopicIds.filter((id) => !completedLearningIds.has(id)).length;
  const currentPercentage =
    subjectTopics.length > 0 ? ((currentCompletedCount / subjectTopics.length) * 100).toFixed(1) : '0';
  const newPercentage =
    subjectTopics.length > 0 ? ((willBeCompletedCount / subjectTopics.length) * 100).toFixed(1) : '0';
  const remainingAfter = Math.max(0, subjectTopics.length - willBeCompletedCount);

  // Pace estimation at 2 chapters/day
  const daysToFinishAtPace2 = Math.ceil(remainingAfter / 2);
  const finishDateAtPace2 = addDays(todayStr, daysToFinishAtPace2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopicIds.length === 0) return;

    setIsSubmitting(true);
    try {
      if (mode === 'revision') {
        const result = await markBatchChaptersRevised({
          subject: currentSubject,
          chapterTopicIds: selectedTopicIds,
          date: selectedDate,
          minutesSpent: Number(durationMinutes),
          autoScheduleNextCycle: autoRevision,
        });

        const nextStr =
          result.nextScheduledDates.length > 0
            ? `Next revisions auto-scheduled: ${result.nextScheduledDates.slice(0, 3).join(', ')}`
            : '';

        setSuccessMessage(
          `Recorded revision of ${result.revisedTopicsCount} chapter(s) for ${selectedDate}! Logged ${durationMinutes}m revision session. ${nextStr}`
        );
      } else {
        const result = await markBatchChaptersRead({
          subject: currentSubject,
          chapterTopicIds: selectedTopicIds,
          date: selectedDate,
          minutesSpent: Number(durationMinutes),
          autoScheduleRevision: autoRevision,
        });

        setSuccessMessage(
          `Marked ${result.updatedTopicsCount} chapters completed! Progress: ${result.completionPercentage}% (${subjectTopics.length - result.remainingChapters} of ${result.totalChapters} chapters). Remaining: ${result.remainingChapters} chapters.`
        );
      }

      setTimeout(() => {
        onSaved();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to log batch chapters:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                mode === 'revision'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  : 'bg-indigo-50 border border-indigo-100 text-indigo-600'
              }`}
            >
              {mode === 'revision' ? (
                <RotateCw className="w-5 h-5 text-emerald-600" />
              ) : (
                <BookOpen className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {mode === 'revision' ? 'Mark Chapters Revised' : 'Log Chapters Read'}
                </h2>
                {allSubjects && allSubjects.length > 1 ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicIds([]);
                    }}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-slate-700"
                  >
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs font-bold text-slate-600">• {currentSubject.name}</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {mode === 'revision'
                  ? 'Record chapters revised yesterday or today, complete due revisions, and schedule next retention cycle'
                  : 'Mark chapters completed, log hours, and auto-schedule revisions'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 rounded-xl mx-6 mt-4 gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('learning');
              setDurationMinutes(90);
              setSelectedTopicIds([]);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'learning'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Core Learning / Read Chapters</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('revision');
              setDurationMinutes(60);
              setSelectedTopicIds([]);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'revision'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Mark Revision Done (e.g. Yesterday)</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {mode === 'revision' ? 'When did you revise them?' : 'When did you read them?'}
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition ${
                  selectedDate === yesterdayStr
                    ? mode === 'revision'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Yesterday ({yesterdayStr})
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition ${
                  selectedDate === todayStr
                    ? mode === 'revision'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Today ({todayStr})
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                {mode === 'revision' ? 'Select Chapters Revised:' : 'Select Chapters Read:'}
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={selectFirstTwo}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-semibold border border-emerald-200"
                >
                  First 2 Chapters
                </button>
                <button
                  type="button"
                  onClick={() => selectCount(2)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Next 2 Chapters
                </button>
                {mode === 'revision' && completedLearningIds.size > 0 && (
                  <button
                    type="button"
                    onClick={selectAllCompleted}
                    className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold"
                  >
                    All Learned ({completedLearningIds.size})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTopicIds([])}
                  className="px-2 py-0.5 text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Scrollable Chapters List */}
            <div className="space-y-1 max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {subjectTopics.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No chapters found. Please import the 47 chapters first.
                </div>
              ) : (
                subjectTopics.map((topic) => {
                  const isLearningDone = completedLearningIds.has(topic.id);
                  const isRevisionDone = completedRevisionIds.has(topic.id);
                  const isSelected = selectedTopicIds.includes(topic.id);

                  if (mode === 'revision') {
                    return (
                      <label
                        key={topic.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTopic(topic.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isRevisionDone && (
                            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                              Revised
                            </span>
                          )}
                          {isLearningDone && (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                              Learned
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  }

                  return (
                    <label
                      key={topic.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium'
                          : isLearningDone
                          ? 'bg-emerald-50/50 text-slate-400 line-through opacity-75'
                          : 'bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected || isLearningDone}
                          disabled={isLearningDone}
                          onChange={() => toggleTopic(topic.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">{topic.name}</span>
                      </div>
                      {isLearningDone && (
                        <span className="text-[10px] text-emerald-600 font-semibold no-underline">Completed</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Time Spent */}
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                {mode === 'revision' ? 'How long did you spend revising?' : 'Focused Reading Time:'}
              </label>
              <span className="text-[11px] font-bold text-slate-600">
                {durationMinutes} min (~{(durationMinutes / 60).toFixed(1)} hrs)
              </span>
            </div>

            {/* Quick Time Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 45, 60, 90, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    durationMinutes === m
                      ? mode === 'revision'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-500 text-xs">Custom:</span>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <span className="text-slate-500 text-xs">
                minutes
                {selectedTopicIds.length > 0 &&
                  ` • ~${Math.round(durationMinutes / selectedTopicIds.length)}m per chapter`}
              </span>
            </div>
          </div>

          {/* Revision Mode Context Card or Learning Mode Pace Card */}
          {mode === 'revision' ? (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <RotateCw className="w-4 h-4 text-emerald-600" />
                  <span>Revision Impact &amp; Spaced Schedule</span>
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  {selectedTopicIds.length} chapter(s) selected
                </span>
              </div>
              <p className="text-[11px] text-emerald-900">
                Marking these chapters as revised on <strong>{selectedDate}</strong> updates their retention status, completes any past due revision tasks, and logs a revision study session.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Live Syllabus Impact</span>
                </span>
                <span className="text-xs font-bold text-indigo-700">
                  {currentPercentage}% &rarr; {newPercentage}% Complete
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Number(newPercentage))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-indigo-900">
                <div>
                  Chapters Completed: <strong>{willBeCompletedCount} of {subjectTopics.length}</strong>
                </div>
                <div>
                  Remaining: <strong>{remainingAfter} chapters</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-100 text-[11px] text-indigo-950">
                ⚡ <strong>Pace Projection:</strong> At your pace of <strong>2 chapters/day</strong>, you will finish all remaining {remainingAfter} chapters in <strong>{daysToFinishAtPace2} days</strong> (Target finish: <strong>{finishDateAtPace2}</strong>)!
              </div>
            </div>
          )}

          {/* Auto Revisions Toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={autoRevision}
                onChange={(e) => setAutoRevision(e.target.checked)}
                className={`rounded border-slate-300 focus:ring-indigo-500 ${
                  mode === 'revision' ? 'text-emerald-600' : 'text-indigo-600'
                }`}
              />
              <span className="flex items-center gap-1">
                <RotateCw
                  className={`w-3.5 h-3.5 ${mode === 'revision' ? 'text-emerald-600' : 'text-indigo-600'}`}
                />
                <span>
                  {mode === 'revision'
                    ? 'Auto-schedule Next Retention Cycle (+3d, +7d, +21d)'
                    : 'Auto-schedule Spaced Revision Cycle (+1d, +3d, +7d, +21d)'}
                </span>
              </span>
            </label>
            <p className="text-[10px] text-slate-500 pl-5">
              Calculates spaced intervals starting from {selectedDate} so upcoming revisions appear automatically on your schedule.
            </p>
          </div>

          {/* Success Alert */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedTopicIds.length === 0}
              className={`px-5 py-2.5 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 ${
                mode === 'revision'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? (
                <span>Saving Progress...</span>
              ) : mode === 'revision' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Mark {selectedTopicIds.length} Chapter{selectedTopicIds.length !== 1 ? 's' : ''} Revised &amp; Log Hours
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Mark {selectedTopicIds.length} Chapter{selectedTopicIds.length !== 1 ? 's' : ''} Read &amp; Log Hours
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};