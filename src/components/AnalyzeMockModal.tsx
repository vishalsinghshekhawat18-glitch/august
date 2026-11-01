import React, { useState } from 'react';
import { X, CheckCircle2, Clock, CheckSquare } from 'lucide-react';
import { MockTest, StudyLog } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString, formatMinutes } from '../services/dateUtils';

interface AnalyzeMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  mock: MockTest;
  onSaved: () => void;
}

export const AnalyzeMockModal: React.FC<AnalyzeMockModalProps> = ({ isOpen, onClose, mock, onSaved }) => {
  const [analysisDate, setAnalysisDate] = useState<string>(mock.analysisDate || getTodayDateString());
  const [analysisMinutes, setAnalysisMinutes] = useState<number>(mock.analysisMinutes || 45);
  const [analysisNotes, setAnalysisNotes] = useState<string>(mock.analysisNotes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (analysisMinutes <= 0) return;

    setIsSubmitting(true);
    try {
      // 1. Update Mock Test record
      const updatedMock: MockTest = {
        ...mock,
        analysisCompleted: true,
        analysisMinutes: Number(analysisMinutes),
        analysisDate,
        analysisNotes: analysisNotes.trim() || undefined,
      };
      await dbService.put<MockTest>('mockTests', updatedMock);

      // 2. Put corresponding StudyLog for mistake analysis so time adds directly to Dashboard study hours
      const analysisLog: StudyLog = {
        id: `log_analysis_${mock.id}`,
        date: analysisDate,
        timestamp: new Date().toISOString(),
        examId: mock.examId,
        subjectId: '',
        durationMinutes: Number(analysisMinutes),
        activityType: 'mistake_analysis',
        notes: `Mock Analysis: ${mock.testName} (${analysisMinutes}m)` + (analysisNotes.trim() ? ` — ${analysisNotes.trim()}` : ''),
        createdAt: new Date().toISOString(),
      };
      await dbService.put<StudyLog>('studyLogs', analysisLog);

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save mock analysis:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-semibold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mark Mock Analysis Complete</h3>
              <p className="text-xs text-slate-500">Record analysis duration &amp; add to study hours</p>
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

        {/* Mock Summary Snapshot */}
        <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-950 truncate">{mock.testName}</span>
            <span className="font-semibold text-purple-800 shrink-0">
              {mock.totalScore} / {mock.maxScore}
            </span>
          </div>
          <div className="text-[11px] text-purple-700 flex items-center gap-2">
            <span>Accuracy: <strong>{mock.accuracyPercent}%</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">✓ {mock.correctCount}</span>
            <span className="text-rose-700 font-semibold">✗ {mock.incorrectCount}</span>
            <span>•</span>
            <span>{mock.skippedCount} skipped</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Analysis Date</label>
            <input
              type="date"
              value={analysisDate}
              onChange={(e) => setAnalysisDate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Time Taken to Analyze (Minutes)</label>
              <span className="text-xs font-bold text-emerald-700">{formatMinutes(analysisMinutes)}</span>
            </div>
            <input
              type="number"
              min="5"
              max="360"
              step="5"
              value={analysisMinutes}
              onChange={(e) => setAnalysisMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-bold"
              required
            />
            {/* Quick Minute Presets */}
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[20, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAnalysisMinutes(mins)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md border transition-colors ${
                    analysisMinutes === mins
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Key Diagnostic Learnings &amp; Mistakes (Optional)</label>
            <textarea
              rows={3}
              value={analysisNotes}
              onChange={(e) => setAnalysisNotes(e.target.value)}
              placeholder="e.g. Reviewed 6 wrong questions: 4 calculation blunders in arithmetic, 2 misread puzzle conditions. Need 10 puzzle drill tomorrow."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white placeholder:text-slate-400"
            />
          </div>

          {/* Time Total Preview */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Adds to Study Dashboard:</span>
            </span>
            <span className="font-bold text-xs">+{formatMinutes(analysisMinutes)} focused time</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Analysis & Update Hours'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
