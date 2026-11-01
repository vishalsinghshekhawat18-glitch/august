import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, CheckCircle2, Calendar, Tag, AlertCircle } from 'lucide-react';
import { StudyLog, ActivityType, Commitment, Subject, Topic } from '../types';
import { dbService } from '../services/db';

interface EditStudyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyLog: StudyLog | null;
  onSaved: () => void;
  onDeleted?: () => void;
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

export const EditStudyLogModal: React.FC<EditStudyLogModalProps> = ({
  isOpen,
  onClose,
  studyLog,
  onSaved,
  onDeleted,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [date, setDate] = useState<string>('');
  const [activityType, setActivityType] = useState<ActivityType>('learning');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [examName, setExamName] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [topicName, setTopicName] = useState<string>('');

  useEffect(() => {
    if (!studyLog) return;
    setDurationMinutes(studyLog.durationMinutes || 30);
    setDate(studyLog.date || '');
    setActivityType(studyLog.activityType || 'learning');
    setNotes(studyLog.notes || '');

    // Resolve human-readable labels
    async function resolveNames() {
      if (!studyLog) return;
      try {
        if (studyLog.examId) {
          const exam = await dbService.get<Commitment>('commitments', studyLog.examId);
          if (exam) setExamName(exam.name);
        }
        if (studyLog.subjectId) {
          const sub = await dbService.get<Subject>('subjects', studyLog.subjectId);
          if (sub) setSubjectName(sub.name);
        }
        if (studyLog.topicId) {
          const top = await dbService.get<Topic>('topics', studyLog.topicId);
          if (top) setTopicName(top.name);
        }
      } catch (err) {
        console.error('Error resolving names for study log:', err);
      }
    }
    resolveNames();
  }, [studyLog]);

  if (!isOpen || !studyLog) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (durationMinutes <= 0) return;

    try {
      setIsSaving(true);
      const updatedLog: StudyLog = {
        ...studyLog,
        durationMinutes: Math.max(1, Number(durationMinutes)),
        date: date || studyLog.date,
        activityType,
        notes: notes.trim() || undefined,
      };

      await dbService.put<StudyLog>('studyLogs', updatedLog);
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to update study log:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this study session record? This will adjust your total study time accordingly.')) {
      return;
    }

    try {
      setIsDeleting(true);
      await dbService.delete('studyLogs', studyLog.id);
      if (onDeleted) onDeleted();
      else onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to delete study log:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Study Session</h3>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">
                {topicName || subjectName || examName || 'Logged Session'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Target Info Badge */}
          {(examName || subjectName || topicName) && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span>{examName || 'Examination'}</span>
                {subjectName && <span>› {subjectName}</span>}
              </div>
              {topicName && (
                <div className="text-[11px] text-indigo-700 font-medium">
                  Topic: {topicName}
                </div>
              )}
            </div>
          )}

          {/* Focused Duration Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800">
                Focused Duration (Minutes)
              </label>
              <span className="text-[11px] font-bold text-indigo-700">
                ~{(durationMinutes / 60).toFixed(1)} hrs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-28 text-sm font-bold text-slate-900 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
                autoFocus
              />
              <span className="text-slate-500 font-medium">minutes</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex gap-1.5 flex-wrap mt-2">
              {[15, 20, 30, 35, 45, 60, 90].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDurationMinutes(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                    durationMinutes === preset
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset}m
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              required
            />
          </div>

          {/* Activity Type Dropdown */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Session Notes / Slice Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Read Cards 1–5, solved chapter questions, etc."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Log'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
