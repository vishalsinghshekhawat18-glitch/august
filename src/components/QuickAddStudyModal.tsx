import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Commitment, Subject, Topic, Subtopic, ActivityType, StudyLog, AppSettings, TopicProgress } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString } from '../services/dateUtils';

interface QuickAddStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogSaved: (log: StudyLog) => void;
}

const ACTIVITY_OPTIONS: { type: ActivityType; label: string }[] = [
  { type: 'learning', label: 'Core Learning' },
  { type: 'question_practice', label: 'Speed / Question Practice' },
  { type: 'revision', label: 'Scheduled Revision' },
  { type: 'mock_test', label: 'Full Mock Test' },
  { type: 'mistake_analysis', label: 'Mistake Analysis' },
  { type: 'university_coursework', label: 'VMOU Academic Study' },
  { type: 'other', label: 'Other Focused Study' },
];

export const QuickAddStudyModal: React.FC<QuickAddStudyModalProps> = ({ isOpen, onClose, onLogSaved }) => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

  const [examId, setExamId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [subtopicId, setSubtopicId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [activityType, setActivityType] = useState<ActivityType>('learning');
  const [notes, setNotes] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load data & remember last-used defaults
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      try {
        const [cList, sList, tList, stList, settingsList] = await Promise.all([
          dbService.getAll<Commitment>('commitments'),
          dbService.getAll<Subject>('subjects'),
          dbService.getAll<Topic>('topics'),
          dbService.getAll<Subtopic>('subtopics'),
          dbService.getAll<AppSettings>('settings'),
        ]);

        setCommitments(cList.sort((a, b) => a.priority - b.priority));
        setSubjects(sList);
        setTopics(tList);
        setSubtopics(stList);

        const settings = settingsList[0];
        if (settings) {
          if (settings.lastUsedExamId && cList.some((c) => c.id === settings.lastUsedExamId)) {
            setExamId(settings.lastUsedExamId);
          } else if (cList.length > 0) {
            setExamId(cList[0].id);
          }

          if (settings.lastUsedActivityType) {
            setActivityType(settings.lastUsedActivityType);
          }
        } else if (cList.length > 0) {
          setExamId(cList[0].id);
        }

        setDate(getTodayDateString(settings?.timeZone || 'Asia/Kolkata'));
      } catch (err) {
        console.error('Error loading quick-add modal data:', err);
      }
    }

    loadData();
  }, [isOpen]);

  // Filter subjects for the selected exam
  const filteredSubjects = subjects.filter((s) => s.examIds.includes(examId));

  // Auto-select first subject if current subjectId is not in filtered subjects
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some((s) => s.id === subjectId)) {
        setSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSubjectId('');
    }
  }, [examId, subjects]);

  // Filter topics for the selected subject
  const filteredTopics = topics.filter((t) => t.subjectId === subjectId && !t.archived);

  useEffect(() => {
    if (filteredTopics.length > 0) {
      if (!filteredTopics.some((t) => t.id === topicId)) {
        setTopicId(filteredTopics[0].id);
      }
    } else {
      setTopicId('');
    }
  }, [subjectId, topics]);

  // Filter subtopics for selected topic
  const filteredSubtopics = subtopics.filter((st) => st.topicId === topicId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!examId) {
      setErrorMsg('Please select an examination commitment.');
      return;
    }
    if (durationMinutes <= 0 || isNaN(durationMinutes)) {
      setErrorMsg('Please enter a valid focused duration in minutes (greater than 0).');
      return;
    }
    if (durationMinutes > 600) {
      setErrorMsg('Duration exceeds 10 hours. Please record study time in realistic focused blocks.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newLog: StudyLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date,
        timestamp: new Date().toISOString(),
        examId,
        subjectId,
        topicId: topicId || undefined,
        subtopicId: subtopicId || undefined,
        durationMinutes: Number(durationMinutes),
        activityType,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      // 1. Save Study Log
      await dbService.put<StudyLog>('studyLogs', newLog);

      // 2. Update Topic Progress if topicId exists
      if (topicId) {
        const progressId = `${examId}_${topicId}`;
        const existingProg = await dbService.get<TopicProgress>('topicProgress', progressId);
        const updatedProg: TopicProgress = existingProg || {
          id: progressId,
          examId,
          topicId,
          learningStatus: 'in_progress',
          practiceStatus: 'not_started',
          revisionStatus: 'not_started',
          manualCompletionPercentage: 25,
          updatedAt: new Date().toISOString(),
        };

        updatedProg.lastStudiedAt = date;
        updatedProg.updatedAt = new Date().toISOString();
        if (updatedProg.learningStatus === 'not_started') {
          updatedProg.learningStatus = 'in_progress';
        }
        await dbService.put<TopicProgress>('topicProgress', updatedProg);
      }

      // 3. Update last-used settings
      const settingsList = await dbService.getAll<AppSettings>('settings');
      const curSettings = settingsList[0];
      if (curSettings) {
        await dbService.put<AppSettings>('settings', {
          ...curSettings,
          lastUsedExamId: examId,
          lastUsedSubjectId: subjectId,
          lastUsedActivityType: activityType,
          updatedAt: new Date().toISOString(),
        });
      }

      onLogSaved(newLog);
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save study log:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save study log to local storage.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">Log Focused Study</h2>
              <p className="text-xs text-slate-500">Pure focused time • Midnight-to-midnight (Asia/Kolkata)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Study Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Focused Minutes</label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="600"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">
                  ({(durationMinutes / 60).toFixed(1)}h)
                </span>
              </div>
            </div>
          </div>

          {/* Preset Minute Buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {[25, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                  durationMinutes === mins
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* Examination */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Examination / Commitment</label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            >
              {commitments.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.priority === 1 ? '★ [Priority 1]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject & Topic */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- General / Untagged --</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Topic (Optional)</label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                disabled={!subjectId}
              >
                <option value="">-- None / General --</option>
                {filteredTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activity Type Chips */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Activity Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setActivityType(opt.type)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border text-left truncate transition-colors ${
                    activityType === opt.type
                      ? 'bg-indigo-600 border-indigo-600 text-white font-medium shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outcome / Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Key Outcome, Notes or Reading URL</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Read Chapter 2 on October Library (https://.../reader.html?book=economics), 85% quiz accuracy..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Study Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
