import React, { useState } from 'react';
import { X, Sparkles, Calendar, BookOpen, Clock, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Subject, Topic, TopicProgress, Commitment } from '../types';
import { calculateSubjectPacing, applyPacingToWeeklyPlans, SubjectPacingPlan } from '../services/smartPacing';

interface SmartPacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  topics: Topic[];
  progressMap: Map<string, TopicProgress>;
  commitments: Commitment[];
  onPlanApplied?: () => void;
}

export const SmartPacingModal: React.FC<SmartPacingModalProps> = ({
  isOpen,
  onClose,
  subject,
  topics,
  progressMap,
  commitments,
  onPlanApplied,
}) => {
  const [chaptersPerWeek, setChaptersPerWeek] = useState<number>(2);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const pacingPlan: SubjectPacingPlan = calculateSubjectPacing(
    subject,
    topics,
    progressMap,
    commitments,
    chaptersPerWeek
  );

  const primaryExam = pacingPlan.linkedExams[0] || { id: 'comm_ibps_rrb_po', name: 'Primary Exam', priority: 1 };

  const handleApply = async () => {
    setIsApplying(true);
    setAppliedSuccess(null);
    try {
      const result = await applyPacingToWeeklyPlans(pacingPlan, primaryExam.id);
      setAppliedSuccess(`Successfully scheduled ${result.tasksCreated} remaining chapters across your upcoming weekly plans without disturbing higher priorities!`);
      if (onPlanApplied) onPlanApplied();
    } catch (err) {
      console.error('Failed to apply pacing plan:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Smart Pacing &amp; Chapter Scheduler
              </h2>
              <p className="text-xs text-slate-500">
                Paces {subject.name} comfortably without overloading Priority 1 studies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Linked Exams Breakdown */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3.5 space-y-2">
            <span className="font-semibold text-indigo-950 block">Cross-Examination Syllabus Coverage:</span>
            <div className="flex flex-wrap gap-1.5">
              {pacingPlan.linkedExams.map((exam) => (
                <span
                  key={exam.id}
                  className="bg-white border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg font-medium text-[11px] shadow-2xs"
                >
                  {exam.name} {exam.priority === 1 ? '★ [Priority 1]' : `(Priority ${exam.priority})`}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-indigo-800/80">
              When you read and mark any chapter in {subject.name}, readiness is synchronized across all {pacingPlan.linkedExams.length} examinations automatically.
            </p>
          </div>

          {/* Chapters Progress Summary */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">Total Chapters</span>
              <span className="text-base font-bold text-slate-900">{pacingPlan.totalTopics}</span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-600 block font-medium">Completed</span>
              <span className="text-base font-bold text-emerald-700">{pacingPlan.completedTopics}</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-600 block font-medium">Remaining to Read</span>
              <span className="text-base font-bold text-amber-700">{pacingPlan.remainingTopics.length}</span>
            </div>
          </div>

          {pacingPlan.remainingTopics.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">All Chapters Completed!</div>
              <p className="text-xs text-slate-500">Every topic in {subject.name} has been completed. Keep up with your scheduled revisions!</p>
            </div>
          ) : (
            <>
              {/* Pace Selector */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-800 block">
                  Select Comfortable Reading Pace:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 1, label: 'Gentle', desc: '1 chapter / week (~30m/day)' },
                    { count: 2, label: 'Steady (Recommended)', desc: '2 chapters / week (~45m/day)' },
                    { count: 3, label: 'Accelerated', desc: '3 chapters / week (~60m/day)' },
                  ].map((p) => (
                    <button
                      key={p.count}
                      type="button"
                      onClick={() => setChaptersPerWeek(p.count)}
                      className={`p-3 rounded-xl border text-left transition ${
                        chaptersPerWeek === p.count
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-600 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority & Capacity Protection Safeguard */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 block">Priority Protection Safeguard</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    At <strong>{chaptersPerWeek} chapters/week</strong>, {subject.name} requires approximately <strong>{pacingPlan.estimatedDailyMinutes} minutes/day</strong> (or ~{chaptersPerWeek * 1.2}h/week).
                    This preserves <strong>85%+ of your focused study capacity</strong> for your Priority 1 commitments (e.g. Reasoning, Quantitative Aptitude) without cognitive fatigue.
                  </p>
                  <p className="text-[11px] text-indigo-700 font-medium pt-1">
                    Estimated completion of all remaining {pacingPlan.remainingTopics.length} chapters: <strong>{pacingPlan.targetCompletionDate}</strong> (~{pacingPlan.estimatedWeeksToComplete} weeks).
                  </p>
                </div>
              </div>

              {/* Weekly Schedule Preview */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-800 block">Schedule Distribution:</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {pacingPlan.weeklySchedule.map((wk) => (
                    <div
                      key={wk.weekIndex}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">
                          Week {wk.weekIndex} (Starting {wk.weekStartDate})
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {wk.chapters.map((c) => c.name).join(', ')}
                        </span>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {wk.chapters.length} chapter{wk.chapters.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Notification */}
              {appliedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{appliedSuccess}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Close
          </button>

          {pacingPlan.remainingTopics.length > 0 && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplying ? 'Scheduling Tasks...' : 'Auto-Schedule into Weekly Plan'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
