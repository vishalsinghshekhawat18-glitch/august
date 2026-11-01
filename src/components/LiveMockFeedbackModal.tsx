import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  Award,
  Clock,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { CoachDispatch } from '../types';

interface LiveMockFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: CoachDispatch;
}

export const LiveMockFeedbackModal: React.FC<LiveMockFeedbackModalProps> = ({
  isOpen,
  onClose,
  dispatch,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !dispatch) return null;

  const m = dispatch.metrics || {};
  const isHighAccuracy = (m.accuracyPercent || 0) >= 90;
  const hasNegativePenalty = (m.negativePenalty || 0) > 0;

  const handleCopyFeedback = () => {
    const text = `[Antigravity Live Mentor Feedback]
Title: ${dispatch.title}
Summary: ${dispatch.summary}
Score: ${m.score}/${m.maxScore} (${m.accuracyPercent}% Accuracy)
Negative Penalty: -${m.negativePenalty} marks
Commentary:
${dispatch.commentary}

Prescribed Actions:
${dispatch.actionItems.map((a, i) => `${i + 1}. ${a.title}`).join('\n')}

Socratic Reflection:
${dispatch.socraticQuestion || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Live Coach Diagnostic
                </span>
                <span className="text-[11px] text-slate-400">• {dispatch.timeStr}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                {dispatch.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-medium block">Total Score</span>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {m.score} <span className="text-xs font-normal text-slate-400">/ {m.maxScore}</span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600">
              {Math.round(((m.score || 0) / (m.maxScore || 80)) * 100)}% of total
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] text-emerald-800 font-medium block">Accuracy Rate</span>
            <div className="text-lg font-bold text-emerald-900 mt-0.5">
              {m.accuracyPercent}%
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">
              {isHighAccuracy ? '✓ Elite precision' : 'Needs attention'}
            </span>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80">
            <span className="text-[10px] text-rose-800 font-medium block">Negative Penalty</span>
            <div className="text-lg font-bold text-rose-900 mt-0.5">
              -{m.negativePenalty} <span className="text-xs font-normal text-rose-600">marks</span>
            </div>
            <span className="text-[10px] font-semibold text-rose-700">
              Potential: {(Number(m.score || 0) + Number(m.negativePenalty || 0)).toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80">
            <span className="text-[10px] text-purple-800 font-medium block">Decision Speed</span>
            <div className="text-lg font-bold text-purple-900 mt-0.5">
              {m.timePerQuestionSeconds || 45}s
            </div>
            <span className="text-[10px] font-semibold text-purple-700">
              per question attempt
            </span>
          </div>
        </div>

        {/* BLUF Summary Banner */}
        <div className="p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-xs text-indigo-950 font-medium flex items-start gap-2">
          <Target className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-indigo-900 text-[11px] uppercase tracking-wide">
              Bottom Line Up Front (BLUF)
            </span>
            <p className="mt-0.5 leading-relaxed">{dispatch.summary}</p>
          </div>
        </div>

        {/* Mentor Commentary */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Mentor Diagnostic Analysis</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal">
            {dispatch.commentary}
          </p>
        </div>

        {/* Prescribed Immediate Action Items */}
        {dispatch.actionItems && dispatch.actionItems.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 block">
              Immediate Coaching Directives (Next 24 Hours)
            </span>
            <div className="space-y-1.5">
              {dispatch.actionItems.map((action, idx) => (
                <div
                  key={action.id || idx}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-start gap-2.5 text-xs text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold block">{action.title}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5 inline-block">
                      {action.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socratic Question */}
        {dispatch.socraticQuestion && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-950 uppercase tracking-wide">
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Socratic Reflection Prompt</span>
            </div>
            <p className="italic text-amber-900 font-medium">&ldquo;{dispatch.socraticQuestion}&rdquo;</p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopyFeedback}
            className="w-full sm:w-auto px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Diagnostic Report!' : 'Copy Feedback'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pin to Mentor Coach Hub &amp; Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
