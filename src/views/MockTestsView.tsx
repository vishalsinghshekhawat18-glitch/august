import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  AlertCircle,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { MockTest, MistakeEntry, Commitment, Subject, Topic, ErrorType, SubjectMockScore } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString } from '../services/dateUtils';

export const MockTestsView: React.FC = () => {
  const [todayStr, setTodayStr] = useState<string>(getTodayDateString());
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  // Modals
  const [isAddMockOpen, setIsAddMockOpen] = useState<boolean>(false);
  const [isAddMistakeOpen, setIsAddMistakeOpen] = useState<boolean>(false);

  // Mock Form State
  const [examId, setExamId] = useState<string>('comm_ibps_rrb_po');
  const [testName, setTestName] = useState<string>('');
  const [testDate, setTestDate] = useState<string>(getTodayDateString());
  const [totalScore, setTotalScore] = useState<number>(54.5);
  const [maxScore, setMaxScore] = useState<number>(80);
  const [timeTakenMinutes, setTimeTakenMinutes] = useState<number>(45);
  const [correctCount, setCorrectCount] = useState<number>(56);
  const [incorrectCount, setIncorrectCount] = useState<number>(6);
  const [skippedCount, setSkippedCount] = useState<number>(18);
  const [attemptedCount, setAttemptedCount] = useState<number>(62);
  const [notes, setNotes] = useState<string>('');

  // Mistake Form State
  const [mistakeExamId, setMistakeExamId] = useState<string>('comm_ibps_rrb_po');
  const [mistakeSubjectId, setMistakeSubjectId] = useState<string>('');
  const [mistakeTopicId, setMistakeTopicId] = useState<string>('');
  const [questionSnippet, setQuestionSnippet] = useState<string>('');
  const [errorType, setErrorType] = useState<ErrorType>('conceptual');
  const [solutionNotes, setSolutionNotes] = useState<string>('');

  const loadData = async () => {
    try {
      const [mList, mistList, cList, sList, tList] = await Promise.all([
        dbService.getAll<MockTest>('mockTests'),
        dbService.getAll<MistakeEntry>('mistakes'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
      ]);

      setMockTests(mList.sort((a, b) => b.date.localeCompare(a.date)));
      setMistakes(mistList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setCommitments(cList);
      setSubjects(sList);
      setTopics(tList);
    } catch (err) {
      console.error('Error loading mock tests data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Consistency validation: Check if correct + incorrect == attempted
  const isMetricsConsistent = correctCount + incorrectCount === attemptedCount;
  const computedAccuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(1)) : 0;

  // Add Mock Test
  const handleSaveMock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    try {
      const newMock: MockTest = {
        id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        examId,
        testName: testName.trim(),
        date: testDate,
        totalScore: Number(totalScore),
        maxScore: Number(maxScore),
        accuracyPercent: computedAccuracy,
        correctCount: Number(correctCount),
        incorrectCount: Number(incorrectCount),
        skippedCount: Number(skippedCount),
        attemptedCount: Number(attemptedCount),
        timeTakenMinutes: Number(timeTakenMinutes),
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await dbService.put<MockTest>('mockTests', newMock);
      setIsAddMockOpen(false);
      setTestName('');
      loadData();
    } catch (err) {
      console.error('Failed to save mock test:', err);
    }
  };

  // Add Mistake Entry
  const handleSaveMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionSnippet.trim()) return;

    try {
      const newMistake: MistakeEntry = {
        id: `mistake_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        examId: mistakeExamId,
        subjectId: mistakeSubjectId || undefined,
        topicId: mistakeTopicId || undefined,
        questionSnippet: questionSnippet.trim(),
        errorType,
        solutionNotes: solutionNotes.trim(),
        resolved: false,
        createdAt: new Date().toISOString(),
      };

      await dbService.put<MistakeEntry>('mistakes', newMistake);
      setIsAddMistakeOpen(false);
      setQuestionSnippet('');
      setSolutionNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to save mistake entry:', err);
    }
  };

  // Toggle Mistake Resolved
  const handleToggleMistakeResolved = async (m: MistakeEntry) => {
    try {
      const updated = { ...m, resolved: !m.resolved };
      await dbService.put<MistakeEntry>('mistakes', updated);
      loadData();
    } catch (err) {
      console.error('Failed to update mistake status:', err);
    }
  };

  const examMap = new Map(commitments.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mock Tests &amp; Mistake Diagnostics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Score tracking • Question metrics consistency • Recurring mistake analysis • Previous score comparisons
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMistakeOpen(true)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-100 transition-colors flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Log Mistake</span>
          </button>

          <button
            onClick={() => setIsAddMockOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Mock Test</span>
          </button>
        </div>
      </div>

      {/* Add Mock Modal */}
      {isAddMockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Record Full Mock Test</h3>
            <form onSubmit={handleSaveMock} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Examination</label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {commitments.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Test Title / Series</label>
                <input
                  type="text"
                  placeholder="e.g. Testbook IBPS RRB PO Prelims Mock #04"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total Score</label>
                  <input
                    type="number"
                    step="0.25"
                    value={totalScore}
                    onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Maximum Score</label>
                  <input
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Time Taken (min)</label>
                  <input
                    type="number"
                    value={timeTakenMinutes}
                    onChange={(e) => setTimeTakenMinutes(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>

              {/* Question Breakdown */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-800 block">Question Breakdown</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Attempted</label>
                    <input
                      type="number"
                      value={attemptedCount}
                      onChange={(e) => setAttemptedCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 text-emerald-700 font-semibold">Correct</label>
                    <input
                      type="number"
                      value={correctCount}
                      onChange={(e) => setCorrectCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 text-rose-700 font-semibold">Incorrect</label>
                    <input
                      type="number"
                      value={incorrectCount}
                      onChange={(e) => setIncorrectCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Skipped</label>
                    <input
                      type="number"
                      value={skippedCount}
                      onChange={(e) => setSkippedCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                {!isMetricsConsistent && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Inconsistency flagged: Correct ({correctCount}) + Incorrect ({incorrectCount}) ≠ Attempted ({attemptedCount})</span>
                  </p>
                )}

                <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                  <span>Computed Accuracy: <strong>{computedAccuracy}%</strong></span>
                  <span>Percentage: <strong>{Math.round((totalScore / (maxScore || 1)) * 100)}%</strong></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Diagnostic Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key observations (e.g. ran out of time on quadratic equations; reasoning accuracy high)."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMockOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shadow-sm"
                >
                  Save Mock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mistake Modal */}
      {isAddMistakeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Log Diagnostic Mistake / Weak Area</h3>
            <form onSubmit={handleSaveMistake} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Examination</label>
                  <select
                    value={mistakeExamId}
                    onChange={(e) => setMistakeExamId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    {commitments.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Error Root Cause</label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value as ErrorType)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="conceptual">Conceptual Gap</option>
                    <option value="calculation">Calculation Error</option>
                    <option value="time_pressure">Time Pressure Rush</option>
                    <option value="misread">Misread Question / Trap</option>
                    <option value="guesswork">Negative Guesswork</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Question Description / Topic</label>
                <textarea
                  rows={2}
                  value={questionSnippet}
                  onChange={(e) => setQuestionSnippet(e.target.value)}
                  placeholder="e.g. Syllogism 'Only a few A are B' conclusion interpretation failure."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Correct Approach &amp; Takeaway</label>
                <textarea
                  rows={2}
                  value={solutionNotes}
                  onChange={(e) => setSolutionNotes(e.target.value)}
                  placeholder="e.g. Draw Venn diagram with subset arrow; 'only a few' implies both 'some are' and 'some are not'."
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddMistakeOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-700 rounded-lg font-medium shadow-sm"
                >
                  Save Mistake Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mock Tests List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recorded Mock Tests ({mockTests.length})</h3>
          <span className="text-xs text-slate-400">Score &amp; Metric Verification</span>
        </div>

        <div className="divide-y divide-slate-100">
          {mockTests.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No mock tests recorded yet. Click &quot;Record Mock Test&quot; after your next full-length drill.
            </div>
          ) : (
            mockTests.map((mock, idx) => {
              const examName = examMap.get(mock.examId) || mock.examId;
              const pct = Math.round((mock.totalScore / (mock.maxScore || 1)) * 100);

              // Comparison with previous mock for same exam
              const previousMockSameExam = mockTests.slice(idx + 1).find((m) => m.examId === mock.examId);
              let diffScore: number | null = null;
              if (previousMockSameExam) {
                diffScore = Number((mock.totalScore - previousMockSameExam.totalScore).toFixed(2));
              }

              return (
                <div key={mock.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{mock.testName}</span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {examName}
                        </span>
                        <span className="text-[11px] text-slate-400">• {mock.date}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>Time: {mock.timeTakenMinutes}m</span>
                        <span>•</span>
                        <span>Accuracy: <strong>{mock.accuracyPercent}%</strong></span>
                        <span>•</span>
                        <span className="text-emerald-700">✓ {mock.correctCount} Correct</span>
                        <span>•</span>
                        <span className="text-rose-700">✗ {mock.incorrectCount} Incorrect</span>
                        <span>•</span>
                        <span>{mock.skippedCount} Skipped</span>
                      </div>

                      {mock.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {mock.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-slate-900">
                        {mock.totalScore} <span className="text-xs font-normal text-slate-400">/ {mock.maxScore}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-xs font-semibold">
                        <span className="text-indigo-600">{pct}%</span>
                        {diffScore !== null && (
                          <span
                            className={`text-[10px] px-1 py-0.2 rounded ${
                              diffScore >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {diffScore >= 0 ? `+${diffScore}` : diffScore} vs prior
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mistakes & Weak Areas Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">Mistakes &amp; Weak Area Diagnostics ({mistakes.length})</h3>
          </div>
          <span className="text-xs text-slate-400">
            {mistakes.filter((m) => !m.resolved).length} active weak spots
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {mistakes.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No mistakes logged yet. Flag error patterns here to build targeted practice tasks.
            </div>
          ) : (
            mistakes.map((m) => {
              const examName = examMap.get(m.examId) || m.examId;
              return (
                <div
                  key={m.id}
                  className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                    m.resolved ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          m.errorType === 'conceptual'
                            ? 'bg-rose-100 text-rose-800'
                            : m.errorType === 'calculation'
                            ? 'bg-amber-100 text-amber-800'
                            : m.errorType === 'time_pressure'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.errorType.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">{examName}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900">{m.questionSnippet}</h4>
                    <p className="text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100/60">
                      <strong>Takeaway:</strong> {m.solutionNotes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleMistakeResolved(m)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors shrink-0 ${
                      m.resolved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {m.resolved ? '✓ Resolved' : 'Mark Fixed'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
