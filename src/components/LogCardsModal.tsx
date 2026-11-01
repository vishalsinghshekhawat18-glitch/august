import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Calendar, Sparkles, RotateCw, BookOpen, Edit2 } from 'lucide-react';
import { Subject, Topic, TopicProgress } from '../types';
import { logTopicCardProgress, updateTopicTotalCards } from '../services/octoberLibrary';
import { getTodayDateString, addDays } from '../services/dateUtils';

interface LogCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  subject: Subject;
  topic: Topic;
  totalCards: number;
  cardLabel?: string;
  currentProgress?: TopicProgress;
  onSaved: () => void;
  initialCardsCount?: number;
  initialDurationMinutes?: number;
}

export const LogCardsModal: React.FC<LogCardsModalProps> = ({
  isOpen,
  onClose,
  examId,
  subject,
  topic,
  totalCards,
  cardLabel = 'cards',
  currentProgress,
  onSaved,
  initialCardsCount,
  initialDurationMinutes,
}) => {
  const todayStr = getTodayDateString();
  const yesterdayStr = addDays(todayStr, -1);

  const [activeTotalCards, setActiveTotalCards] = useState<number>(totalCards);
  const [isEditingTotal, setIsEditingTotal] = useState<boolean>(false);
  const [editTotalInput, setEditTotalInput] = useState<number>(totalCards);

  const initialCompleted = currentProgress?.completedCards || 0;
  const remainingCards = Math.max(0, activeTotalCards - initialCompleted);

  const defaultAdd =
    initialCardsCount && initialCardsCount > 0
      ? Math.min(initialCardsCount, activeTotalCards)
      : Math.min(10, remainingCards > 0 ? remainingCards : activeTotalCards);

  const [cardsCount, setCardsCount] = useState<number>(defaultAdd);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialDurationMinutes || (defaultAdd <= 5 ? 30 : 40)
  );
  const [autoScheduleRevision, setAutoScheduleRevision] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveTotalCount = async () => {
    if (editTotalInput <= 0) return;
    await updateTopicTotalCards(topic.id, editTotalInput, cardLabel);
    setActiveTotalCards(editTotalInput);
    setIsEditingTotal(false);
    onSaved();
  };

  const projectedCompleted = Math.min(activeTotalCards, initialCompleted + cardsCount);
  const currentPercent = Math.round((initialCompleted / activeTotalCards) * 100);
  const projectedPercent = Math.round((projectedCompleted / activeTotalCards) * 100);

  const cardSlice =
    initialCompleted === 0
      ? `Cards 1–${projectedCompleted}`
      : `Cards ${initialCompleted + 1}–${projectedCompleted}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardsCount <= 0) return;

    try {
      setIsSubmitting(true);
      await logTopicCardProgress({
        examId,
        subject,
        topic,
        cardsReadCount: cardsCount,
        totalCards: activeTotalCards,
        date: selectedDate,
        durationMinutes,
        autoScheduleRevision,
        isRelativeIncrement: true,
      });

      setSuccessMessage(
        `Successfully logged ${cardsCount} ${cardLabel}! Spaced revision scheduled for ${cardSlice}.`
      );

      setTimeout(() => {
        onSaved();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to log cards read:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Log Card Reading</span>
                {isEditingTotal ? (
                  <div className="flex items-center gap-1 bg-white border border-indigo-300 rounded-full px-2 py-0.5 shadow-xs">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={editTotalInput}
                      onChange={(e) => setEditTotalInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-14 text-xs font-bold text-slate-800 focus:outline-none"
                      autoFocus
                    />
                    <span className="text-[10px] text-slate-500 font-medium">{cardLabel}</span>
                    <button
                      type="button"
                      onClick={handleSaveTotalCount}
                      className="px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-bold rounded hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTotal(false)}
                      className="px-1 py-0.2 text-slate-400 hover:text-slate-600 text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditTotalInput(activeTotalCards);
                      setIsEditingTotal(true);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1 transition cursor-pointer group"
                    title="Click to edit total cards count for this topic"
                  >
                    <span>{activeTotalCards} {cardLabel} total</span>
                    <Edit2 className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 text-indigo-500" />
                  </button>
                )}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-sm">
                {topic.name}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Progress & Projection */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-indigo-950">
                Progress: {initialCompleted} / {activeTotalCards} {cardLabel} ({currentPercent}%)
              </span>
              <span className="font-bold text-indigo-700">
                → Projected: {projectedCompleted} / {activeTotalCards} ({projectedPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-indigo-100/70 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${currentPercent}%` }}
                title={`Already completed: ${initialCompleted} cards`}
              />
              <div
                className="bg-indigo-600 h-full transition-all duration-300 opacity-90"
                style={{ width: `${Math.max(0, projectedPercent - currentPercent)}%` }}
                title={`Reading now: +${cardsCount} cards`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-indigo-800 pt-0.5 font-medium">
              <span>Slice: <strong className="font-bold">{cardSlice}</strong></span>
              <span>{Math.max(0, activeTotalCards - projectedCompleted)} {cardLabel} remaining</span>
            </div>
          </div>

          {/* Cards Read Count Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-800">
                How many {cardLabel} did you read?
              </label>
              <div className="flex gap-1">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCardsCount(num);
                      setDurationMinutes(num * 3);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                      cardsCount === num
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
                {remainingCards > 0 && remainingCards !== 5 && remainingCards !== 10 && remainingCards !== 15 && remainingCards !== 20 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCardsCount(remainingCards);
                      setDurationMinutes(remainingCards * 3);
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  >
                    Finish All (+{remainingCards})
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={activeTotalCards}
                value={cardsCount}
                onChange={(e) => setCardsCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 text-sm font-bold text-slate-800 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-slate-500 font-medium">
                {cardLabel} in this session
              </span>
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              When did you read them?
            </label>
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
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Time Spent */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-800">
                Focused Reading Time:
              </label>
              <span className="text-[11px] font-bold text-slate-600">
                {durationMinutes} min (~{(durationMinutes / 60).toFixed(1)} hrs)
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 20, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    durationMinutes === mins
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {mins}m
                </button>
              ))}
              <input
                type="number"
                min="5"
                max="600"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 text-center font-bold"
              />
            </div>
          </div>

          {/* Automatic Spaced Revision Checkbox */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScheduleRevision}
                onChange={(e) => setAutoScheduleRevision(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Automatically add {cardSlice} to Spaced Revision cycle
                </span>
                <span className="text-[11px] text-slate-600 block leading-relaxed mt-0.5">
                  Schedules Revision 1 for tomorrow (+1d), followed by +3d, +7d, +21d retention intervals.
                  In your Revisions view, it will clearly state <strong>&quot;{cardSlice}&quot;</strong> so you know exactly which portion to revise!
                </span>
              </div>
            </label>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cardsCount <= 0}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Log {cardsCount} {cardLabel} &amp; Schedule Revision</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
