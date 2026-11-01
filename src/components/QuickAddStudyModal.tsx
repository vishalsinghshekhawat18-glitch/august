import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Sparkles, RotateCw, Award } from 'lucide-react';
import { Commitment, Subject, Topic, Subtopic, ActivityType, StudyLog, AppSettings, TopicProgress, LearningStatus, MockTest } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString } from '../services/dateUtils';
import { scheduleSpacedRevisionCycle, syncTopicProgressAcrossExams } from '../services/smartPacing';

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

  // Mock Test Breakdown States (when activityType === 'mock_test')
  const [mockTestName, setMockTestName] = useState<string>('');
  const [mockScore, setMockScore] = useState<number>(54.5);
  const [mockMaxScore, setMockMaxScore] = useState<number>(80);
  const [mockAttempted, setMockAttempted] = useState<number>(62);
  const [mockCorrect, setMockCorrect] = useState<number>(56);
  const [mockIncorrect, setMockIncorrect] = useState<number>(6);
  const [mockAnalysisCompleted, setMockAnalysisCompleted] = useState<boolean>(false);
  const [mockAnalysisMinutes, setMockAnalysisMinutes] = useState<number>(45);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Smart Sync & Revision Automation
  const [autoScheduleRevision, setAutoScheduleRevision] = useState<boolean>(true);
  const [syncAcrossAllExams, setSyncAcrossAllExams] = useState<boolean>(true);
  const [markTopicCompleted, setMarkTopicCompleted] = useState<boolean>(false);

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
      let logNotes = notes.trim();

      // If logging full mock test, also create formal MockTest record in mockTests store
      if (activityType === 'mock_test') {
        const accuracy = mockAttempted > 0 ? Number(((mockCorrect / mockAttempted) * 100).toFixed(1)) : 0;
        const selectedExam = commitments.find((c) => c.id === examId);
        const finalTitle = mockTestName.trim() || `${selectedExam?.name || 'IBPS RRB PO'} Prelims Mock`;

        const newMock: MockTest = {
          id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          examId,
          testName: finalTitle,
          date,
          totalScore: Number(mockScore),
          maxScore: Number(mockMaxScore),
          accuracyPercent: accuracy,
          correctCount: Number(mockCorrect),
          incorrectCount: Number(mockIncorrect),
          skippedCount: Math.max(0, Number(mockMaxScore) - Number(mockAttempted)),
          attemptedCount: Number(mockAttempted),
          timeTakenMinutes: Number(durationMinutes),
          notes: notes.trim() || undefined,
          createdAt: new Date().toISOString(),
          analysisCompleted: mockAnalysisCompleted,
          analysisMinutes: mockAnalysisCompleted ? Number(mockAnalysisMinutes) : undefined,
          analysisDate: mockAnalysisCompleted ? date : undefined,
        };

        await dbService.put<MockTest>('mockTests', newMock);

        // If analysis was also performed, automatically create mistake analysis study log
        if (mockAnalysisCompleted && Number(mockAnalysisMinutes) > 0) {
          const analysisLog: StudyLog = {
            id: `log_analysis_${newMock.id}`,
            date,
            timestamp: new Date().toISOString(),
            examId,
            subjectId: '',
            durationMinutes: Number(mockAnalysisMinutes),
            activityType: 'mistake_analysis',
            notes: `Mock Analysis: ${finalTitle} (${mockAnalysisMinutes}m)`,
            createdAt: new Date().toISOString(),
          };
          await dbService.put<StudyLog>('studyLogs', analysisLog);
        }

        logNotes = `Mock Test: ${finalTitle} — Score: ${mockScore}/${mockMaxScore} (${accuracy}% acc)` + (notes.trim() ? ` • ${notes.trim()}` : '');
      }

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
        notes: logNotes || undefined,
        createdAt: new Date().toISOString(),
      };

      // 1. Save Study Log
      await dbService.put<StudyLog>('studyLogs', newLog);

      // 2. Update Topic Progress (Smart Cross-Exam Sync)
      if (topicId) {
        const curSubject = subjects.find((s) => s.id === subjectId);
        const targetStatus: LearningStatus = markTopicCompleted ? 'completed' : 'in_progress';
        const targetPct = markTopicCompleted ? 100 : 50;

        if (syncAcrossAllExams && curSubject && curSubject.examIds && curSubject.examIds.length > 0) {
          // Sync across ALL examinations sharing this subject
          await syncTopicProgressAcrossExams(curSubject, topicId, targetStatus, targetPct, date);
        } else {
          // Sync single exam
          const progressId = `${examId}_${topicId}`;
          const existingProg = await dbService.get<TopicProgress>('topicProgress', progressId);
          const updatedProg: TopicProgress = existingProg || {
            id: progressId,
            examId,
            topicId,
            learningStatus: targetStatus,
            practiceStatus: 'not_started',
            revisionStatus: 'not_started',
            manualCompletionPercentage: targetPct,
            updatedAt: new Date().toISOString(),
          };

          updatedProg.lastStudiedAt = date;
          updatedProg.updatedAt = new Date().toISOString();
          updatedProg.learningStatus = targetStatus;
          updatedProg.manualCompletionPercentage = Math.max(updatedProg.manualCompletionPercentage || 0, targetPct);
          await dbService.put<TopicProgress>('topicProgress', updatedProg);
        }

        // 3. Auto-Schedule Spaced Revision Cycle (+1d, +3d, +7d, +21d)
        if (autoScheduleRevision) {
          await scheduleSpacedRevisionCycle(examId, subjectId, topicId, date);
        }
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

          {/* Dedicated Mock Test Breakdown Form (when activityType === 'mock_test') */}
          {activityType === 'mock_test' && (
            <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-semibold text-xs">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Mock Test Diagnostic Breakdown</span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-1">Test Title / Series</label>
                <input
                  type="text"
                  placeholder="e.g. Testbook IBPS RRB PO Prelims Mock #1"
                  value={mockTestName}
                  onChange={(e) => setMockTestName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Total Score</label>
                  <input
                    type="number"
                    step="0.25"
                    value={mockScore}
                    onChange={(e) => setMockScore(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-1.5 border border-purple-200 rounded-lg bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">Maximum Score</label>
                  <input
                    type="number"
                    value={mockMaxScore}
                    onChange={(e) => setMockMaxScore(parseFloat(e.target.value) || 80)}
                    className="w-full text-xs px-3 py-1.5 border border-purple-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-medium">Attempted</label>
                  <input
                    type="number"
                    value={mockAttempted}
                    onChange={(e) => setMockAttempted(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-emerald-700 font-semibold">Correct</label>
                  <input
                    type="number"
                    value={mockCorrect}
                    onChange={(e) => setMockCorrect(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-700 font-semibold">Incorrect</label>
                  <input
                    type="number"
                    value={mockIncorrect}
                    onChange={(e) => setMockIncorrect(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-2 py-1.5 border border-purple-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-purple-900 font-medium pt-0.5">
                <span>Accuracy: <strong>{mockAttempted > 0 ? ((mockCorrect / mockAttempted) * 100).toFixed(1) : 0}%</strong></span>
                <span>Score %: <strong>{Math.round((mockScore / (mockMaxScore || 1)) * 100)}%</strong></span>
              </div>

              {/* Analysis Checkbox & Minutes */}
              <div className="pt-2 border-t border-purple-200/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mockAnalysisCompleted}
                    onChange={(e) => setMockAnalysisCompleted(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Also record analysis time for this mock test
                  </span>
                </label>

                {mockAnalysisCompleted && (
                  <div className="p-2.5 bg-emerald-50/80 rounded-lg border border-emerald-200 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-emerald-900">Analysis Duration</span>
                      <div className="flex gap-1">
                        {[20, 30, 45, 60, 90].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setMockAnalysisMinutes(mins)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              mockAnalysisMinutes === mins
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={mockAnalysisMinutes}
                        onChange={(e) => setMockAnalysisMinutes(parseInt(e.target.value, 10) || 0)}
                        className="w-20 text-xs px-2 py-1 border border-emerald-300 rounded bg-white font-bold text-emerald-950"
                      />
                      <span className="text-xs text-emerald-700">minutes added to study dashboard</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Smart Syllabus & Revision Automation */}
          {topicId && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
              {(() => {
                const curSub = subjects.find((s) => s.id === subjectId);
                const linked = curSub ? commitments.filter((c) => curSub.examIds.includes(c.id)) : [];
                if (linked.length <= 1) return null;
                return (
                  <div className="flex items-start gap-2 text-indigo-900 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-semibold block text-[11px]">Cross-Exam Syllabus Mapping</span>
                      <span className="text-[11px] text-indigo-800">
                        This subject applies to <strong>{linked.map((e) => e.name).join(', ')}</strong>. Progress will update across all {linked.length} exams.
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-1.5 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoScheduleRevision}
                    onChange={(e) => setAutoScheduleRevision(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-indigo-600" />
                    <span>Auto-schedule Spaced Revision Cycle (+1d, +3d, +7d, +21d)</span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={syncAcrossAllExams}
                    onChange={(e) => setSyncAcrossAllExams(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Synchronize progress across all linked examinations</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={markTopicCompleted}
                    onChange={(e) => setMarkTopicCompleted(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mark this chapter as <strong>100% Completed</strong> (conceptual grasp)</span>
                </label>
              </div>
            </div>
          )}

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
