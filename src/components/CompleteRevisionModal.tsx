import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Calendar, RotateCw, Sparkles, Layers } from 'lucide-react';
import { RevisionRecord, Topic } from '../types';
import { completeRevisionWithLog, updateCompletedRevisionTime } from '../services/octoberLibrary';
import { getTodayDateString, addDays } from '../services/dateUtils';

interface CompleteRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  revision: RevisionRecord;
  topicName: string;
  subjectName: string;
  allDueRevisions?: RevisionRecord[];
  allTopics?: Topic[];
  isEditing?: boolean;
  onSaved: () => void;
}

export const CompleteRevisionModal: React.FC<CompleteRevisionModalProps> = ({
  isOpen,
  onClose,
  revision,
  topicName,
  subjectName,
  allDueRevisions = [],
  allTopics = [],
  isEditing = false,
  onSaved,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = addDays(todayStr, -1);

  // Initialize date: if revision was completed previously, use that; if scheduled yesterday, default yesterday
  const defaultDate = revision.completedAt
    ? revision.completedAt
    : revision.scheduledDate < todayStr
    ? yesterdayStr
    : todayStr;

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [durationMinutes, setDurationMinutes] = useState<number>(revision.durationMinutes || 45);
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<string[]>([revision.id]);
  const [autoScheduleNext, setAutoScheduleNext] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>(revision.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(
      revision.completedAt
        ? revision.completedAt
        : revision.scheduledDate < todayStr
        ? yesterdayStr
        : todayStr
    );
    setDurationMinutes(revision.durationMinutes || 45);
    setSelectedRevisionIds([revision.id]);
    setNotes(revision.notes || '');
    setSuccessMessage(null);
  }, [revision, isOpen, todayStr, yesterdayStr]);

  if (!isOpen) return null;

  // Other due revisions for the same subject (excluding current)
  const siblingDueRevisions = !isEditing
    ? allDueRevisions.filter((r) => r.id !== revision.id && r.subjectId === revision.subjectId)
    : [];

  const toggleSibling = (revId: string) => {
    setSelectedRevisionIds((prev) => {
      const isSelected = prev.includes(revId);
      const nextList = isSelected ? prev.filter((id) => id !== revId) : [...prev, revId];
      // Automatically adjust duration suggestion (e.g. 30m per chapter)
      if (!isSelected) {
        setDurationMinutes((m) => Math.max(m, nextList.length * 30));
      }
      return nextList;
    });
  };

  const quickMinutes = [15, 30, 45, 60, 90, 120];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateCompletedRevisionTime({
          revisionId: revision.id,
          durationMinutes: Number(durationMinutes),
          date: selectedDate,
          notes: notes.trim() || undefined,
        });
        setSuccessMessage(`Updated revision time to ${durationMinutes} minutes on ${selectedDate}!`);
      } else {
        const result = await completeRevisionWithLog({
          revisionIds: selectedRevisionIds,
          date: selectedDate,
          durationMinutes: Number(durationMinutes),
          autoScheduleNext,
          notes: notes.trim() || undefined,
        });
        setSuccessMessage(
          `Completed ${result.completedCount} chapter revision(s)! Logged ${durationMinutes}m focused study time on ${selectedDate}.`
        );
      }

      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to complete revision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedRevisionIds.length;
  const minutesPerItem = Math.round(durationMinutes / Math.max(1, selectedCount));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <RotateCw className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {isEditing ? 'Edit Revision Time' : 'Complete Revision & Log Time'}
              </h2>
              <p className="text-xs text-slate-500">
                {subjectName} • +{revision.intervalDays}d retention cycle
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Chapter Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Primary Chapter
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">{topicName}</span>
          </div>

          {/* Sibling Due Chapters Multi-Select */}
          {siblingDueRevisions.length > 0 && !isEditing && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Also revise other due chapters in {subjectName}?</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700">
                  {selectedCount} chapter(s) selected
                </span>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
                {siblingDueRevisions.map((sib) => {
                  const sibTopic = allTopics.find((t) => t.id === sib.topicId);
                  const isChecked = selectedRevisionIds.includes(sib.id);
                  return (
                    <label
                      key={sib.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border text-xs ${
                        isChecked
                          ? 'bg-white border-emerald-300 font-semibold text-emerald-950 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSibling(sib.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{sibTopic?.name || `Topic ${sib.topicId}`}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">+{sib.intervalDays}d</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              When did you revise?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-3 py-1.5 rounded-xl border font-semibold text-xs transition ${
                  selectedDate === yesterdayStr
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
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
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Today ({todayStr})
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Time Taken - Prominent Quick Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              How much time did you spend revising?
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickMinutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                    durationMinutes === m
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-24 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                required
              />
              <span className="text-slate-500 text-xs">
                minutes (~{(durationMinutes / 60).toFixed(1)} hrs)
                {selectedCount > 1 && ` • ~${minutesPerItem}m per chapter`}
              </span>
            </div>
          </div>

          {/* Auto Next Cycle Toggle */}
          {!isEditing && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={autoScheduleNext}
                  onChange={(e) => setAutoScheduleNext(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-schedule next spaced interval (+3d, +7d, +21d)</span>
                </span>
              </label>
              <p className="text-[10px] text-slate-500 pl-5">
                Calculates spaced retention milestones starting from {selectedDate} so you stay on track.
              </p>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Retention Observation <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Reviewed formulas and October Library diagrams"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
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
              disabled={isSubmitting || durationMinutes <= 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {isEditing
                      ? `Save Revision Time (${durationMinutes}m)`
                      : `Log ${selectedCount} Chapter Revision(s) • ${durationMinutes}m`}
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