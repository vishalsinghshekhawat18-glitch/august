import React, { useState } from 'react';
import { X, CheckCircle2, BookOpen, Clock, Calendar, Sparkles, RotateCw, ArrowRight } from 'lucide-react';
import { Subject, Topic, TopicProgress, Commitment } from '../types';
import { markBatchChaptersRead } from '../services/octoberLibrary';
import { getTodayDateString, addDays } from '../services/dateUtils';

interface BatchReadChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  topics: Topic[];
  progressMap: Map<string, TopicProgress>;
  commitments: Commitment[];
  onSaved: () => void;
}

export const BatchReadChaptersModal: React.FC<BatchReadChaptersModalProps> = ({
  isOpen,
  onClose,
  subject,
  topics,
  progressMap,
  commitments,
  onSaved,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = addDays(todayStr, -1);

  const [selectedDate, setSelectedDate] = useState<string>(yesterdayStr);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [autoRevision, setAutoRevision] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subjectTopics = topics
    .filter((t) => t.subjectId === subject.id && !t.archived)
    .sort((a, b) => a.order - b.order);

  // Check which topics are already completed
  const completedIds = new Set<string>();
  for (const t of subjectTopics) {
    for (const examId of subject.examIds) {
      const p = progressMap.get(`${examId}_${t.id}`);
      if (p && (p.learningStatus === 'completed' || p.manualCompletionPercentage >= 100)) {
        completedIds.add(t.id);
        break;
      }
    }
  }

  // Pre-select first 2 uncompleted chapters if none selected
  const uncompletedTopics = subjectTopics.filter((t) => !completedIds.has(t.id));

  const toggleTopic = (id: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectNextCount = (count: number) => {
    const nextIds = uncompletedTopics.slice(0, count).map((t) => t.id);
    setSelectedTopicIds(nextIds);
    setDurationMinutes(count * 45);
  };

  // Calculations
  const currentCompletedCount = completedIds.size;
  const willBeCompletedCount = currentCompletedCount + selectedTopicIds.filter((id) => !completedIds.has(id)).length;
  const currentPercentage = subjectTopics.length > 0 ? ((currentCompletedCount / subjectTopics.length) * 100).toFixed(1) : '0';
  const newPercentage = subjectTopics.length > 0 ? ((willBeCompletedCount / subjectTopics.length) * 100).toFixed(1) : '0';
  const remainingAfter = Math.max(0, subjectTopics.length - willBeCompletedCount);

  // Pace estimation at 2 chapters/day
  const daysToFinishAtPace2 = Math.ceil(remainingAfter / 2);
  const finishDateAtPace2 = addDays(todayStr, daysToFinishAtPace2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTopicIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await markBatchChaptersRead({
        subject,
        chapterTopicIds: selectedTopicIds,
        date: selectedDate,
        minutesSpent: Number(durationMinutes),
        autoScheduleRevision: autoRevision,
      });

      setSuccessMessage(
        `Marked ${result.updatedTopicsCount} chapters completed! Progress: ${result.completionPercentage}% (${subjectTopics.length - result.remainingChapters} of ${result.totalChapters} chapters). Remaining: ${result.remainingChapters} chapters.`
      );
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1400);
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
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Log Chapters Read • {subject.name}
              </h2>
              <p className="text-xs text-slate-500">
                Mark chapters completed, log hours, and auto-schedule revisions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">When did you read them?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition ${
                  selectedDate === yesterdayStr
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
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
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
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
              <label className="font-semibold text-slate-700">Select Chapters Read:</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => selectNextCount(1)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Next 1 Chapter
                </button>
                <button
                  type="button"
                  onClick={() => selectNextCount(2)}
                  className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold"
                >
                  Next 2 Chapters
                </button>
                <button
                  type="button"
                  onClick={() => selectNextCount(3)}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium"
                >
                  Next 3 Chapters
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
                  const isDone = completedIds.has(topic.id);
                  const isSelected = selectedTopicIds.includes(topic.id);

                  return (
                    <label
                      key={topic.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-medium'
                          : isDone
                          ? 'bg-emerald-50/50 text-slate-400 line-through opacity-75'
                          : 'bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected || isDone}
                          disabled={isDone}
                          onChange={() => toggleTopic(topic.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">{topic.name}</span>
                      </div>
                      {isDone && (
                        <span className="text-[10px] text-emerald-600 font-semibold no-underline">Completed</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Focused Reading Time (Minutes)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={15}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <span className="text-slate-500 text-xs">minutes (~{(durationMinutes / 60).toFixed(1)} hours)</span>
            </div>
          </div>

          {/* Live Progress & Pace Estimation Card */}
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

          {/* Auto Revisions Toggle */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={autoRevision}
                onChange={(e) => setAutoRevision(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Auto-schedule Spaced Revision Cycle (+1d, +3d, +7d, +21d)</span>
              </span>
            </label>
            <p className="text-[10px] text-slate-500 pl-5">
              Calculates spaced intervals starting from {selectedDate} so revisions appear on your schedule automatically.
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving Progress...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark {selectedTopicIds.length} Chapter(s) Read &amp; Log Hours</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
