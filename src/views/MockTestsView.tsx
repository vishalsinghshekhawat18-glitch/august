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
  CheckSquare,
  Sparkles,
  Camera,
  UploadCloud,
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { MockTest, MistakeEntry, Commitment, Subject, Topic, ErrorType, SubjectMockScore, CoachDispatch } from '../types';
import { dbService } from '../services/db';
import { getTodayDateString } from '../services/dateUtils';
import { AnalyzeMockModal } from '../components/AnalyzeMockModal';
import { LiveMockFeedbackModal } from '../components/LiveMockFeedbackModal';
import { coachService } from '../services/coachService';
import { parseScorecardText, recognizeScorecardImage } from '../services/scorecardParser';
import seedMockTests from '../data/mockTests.json';

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
  const [mockAnalysisCompleted, setMockAnalysisCompleted] = useState<boolean>(false);
  const [mockAnalysisMinutes, setMockAnalysisMinutes] = useState<number>(45);
  const [analyzingMock, setAnalyzingMock] = useState<MockTest | null>(null);
  const [activeMockReview, setActiveMockReview] = useState<CoachDispatch | null>(null);

  // Mistake Form State
  const [mistakeExamId, setMistakeExamId] = useState<string>('comm_ibps_rrb_po');
  const [mistakeSubjectId, setMistakeSubjectId] = useState<string>('');
  const [mistakeTopicId, setMistakeTopicId] = useState<string>('');
  const [questionSnippet, setQuestionSnippet] = useState<string>('');
  const [errorType, setErrorType] = useState<ErrorType>('conceptual');
  const [solutionNotes, setSolutionNotes] = useState<string>('');

  // Smart Scorecard Auto-Fill State
  const [pastedScorecardText, setPastedScorecardText] = useState<string>('');
  const [scorecardImagePreview, setScorecardImagePreview] = useState<string | null>(null);
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);
  const [isSmartAutoFillOpen, setIsSmartAutoFillOpen] = useState<boolean>(true);
  const [isOcrScanning, setIsOcrScanning] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatus, setOcrStatus] = useState<string>('');

  const applyParsedScorecard = (parsed: ReturnType<typeof parseScorecardText>) => {
    if (!parsed) return;
    if (parsed.examId) setExamId(parsed.examId);
    if (parsed.testName) setTestName(parsed.testName);
    if (parsed.totalScore !== undefined && !isNaN(parsed.totalScore)) setTotalScore(parsed.totalScore);
    if (parsed.maxScore && !isNaN(parsed.maxScore)) setMaxScore(parsed.maxScore);
    if (parsed.timeTakenMinutes && !isNaN(parsed.timeTakenMinutes)) setTimeTakenMinutes(parsed.timeTakenMinutes);
    if (parsed.attemptedCount !== undefined && !isNaN(parsed.attemptedCount)) setAttemptedCount(parsed.attemptedCount);
    if (parsed.correctCount !== undefined && !isNaN(parsed.correctCount)) setCorrectCount(parsed.correctCount);
    if (parsed.incorrectCount !== undefined && !isNaN(parsed.incorrectCount)) setIncorrectCount(parsed.incorrectCount);
    if (parsed.skippedCount !== undefined && !isNaN(parsed.skippedCount)) setSkippedCount(parsed.skippedCount);
    if (parsed.notes) setNotes(parsed.notes);
    setAutoFillNotice(`✓ Auto-filled ${parsed.platform || 'Scorecard'}: ${parsed.totalScore}/${parsed.maxScore} (${parsed.accuracyPercent}% acc)!`);
  };

  const handleAutoFillFromText = (raw: string) => {
    setPastedScorecardText(raw);
    const parsed = parseScorecardText(raw);
    if (parsed) {
      applyParsedScorecard(parsed);
    }
  };

  const processImageWithOcr = async (file: File | Blob) => {
    try {
      setIsOcrScanning(true);
      setOcrProgress(10);
      setOcrStatus('Initializing OCR engine...');

      const { parsed, rawText } = await recognizeScorecardImage(file, (pct, status) => {
        setOcrProgress(pct);
        setOcrStatus(status);
      });

      if (rawText) {
        setPastedScorecardText(rawText);
      }

      if (parsed && (parsed.totalScore > 0 || parsed.attemptedCount > 0)) {
        applyParsedScorecard(parsed);
      } else {
        setAutoFillNotice('OCR scanned image. Review and verify the detected numbers in the form.');
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setAutoFillNotice('OCR scan encountered an issue. You can paste the text directly from the portal.');
    } finally {
      setIsOcrScanning(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setScorecardImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    await processImageWithOcr(file);
  };

  const handleFillLatestSmartkeeda = () => {
    setExamId('comm_ibps_rrb_po');
    setTestName('Smartkeeda Full Length RRB PO Pre #01');
    setTestDate(getTodayDateString());
    setTotalScore(35.25);
    setMaxScore(80);
    setTimeTakenMinutes(45);
    setAttemptedCount(44);
    setCorrectCount(37);
    setIncorrectCount(7);
    setSkippedCount(36);
    setNotes(
      'Smartkeeda Full Length RRB PO Pre • Rank: #88397/153003 (Percentile: 41.91%) • Cutoff: 52/80 (Deficit: -16.75) • Reasoning: 28/40 (70% score, 76.81%ile, 25m) • Quant: 7.25/40 (18% score, 33.84%ile, 20m, 29 unattempted - missed cutoff 8.00 by 0.75m)'
    );
    setAutoFillNotice('✓ Auto-filled from Smartkeeda Scorecard: 35.25/80 (44 att, 37 correct, 7 incorrect, 45m)!');
  };

  const handleFillLatestOliveboard = () => {
    setExamId('comm_ibps_rrb_po');
    setTestName('Oliveboard IBPS RRB PO Prelims Mock #02');
    setTestDate(getTodayDateString());
    setTotalScore(36.25);
    setMaxScore(80);
    setTimeTakenMinutes(45);
    setAttemptedCount(40);
    setCorrectCount(37);
    setIncorrectCount(3);
    setSkippedCount(40);
    setNotes(
      'Oliveboard IBPS RRB PO Prelims Mock • Score: 36.25/80 • Accuracy: 93.0% (37 Correct, 3 Incorrect, 40 Skipped) • Time Taken: 44m 58s'
    );
    setAutoFillNotice('✓ Auto-filled Oliveboard Scorecard: 36.25/80 (40 att, 37 correct, 3 incorrect, 45m)!');
  };

  const handleDirectSaveFromAutoFill = async () => {
    const finalTestName = testName.trim() || 'Oliveboard IBPS RRB PO Prelims Mock';
    const computedAccuracy = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(1)) : 0;

    const newMock: MockTest = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      examId,
      testName: finalTestName,
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
      analysisCompleted: mockAnalysisCompleted,
      analysisMinutes: mockAnalysisCompleted ? Number(mockAnalysisMinutes) : undefined,
      analysisDate: mockAnalysisCompleted ? testDate : undefined,
    };

    await dbService.put<MockTest>('mockTests', newMock);

    // Auto-log focused study time
    if (newMock.timeTakenMinutes && newMock.timeTakenMinutes > 0) {
      const mockLog = {
        id: `log_mock_${newMock.id}`,
        date: testDate,
        timestamp: new Date().toISOString(),
        examId,
        subjectId: '',
        durationMinutes: Number(timeTakenMinutes),
        activityType: 'mock_test' as const,
        notes: `Mock Test: ${newMock.testName} — Score: ${totalScore}/${maxScore} (${computedAccuracy}% acc)` + (notes.trim() ? ` • ${notes.trim()}` : ''),
        createdAt: new Date().toISOString(),
      };
      await dbService.put('studyLogs', mockLog);
    }

    // Coach review
    const examName = examMap.get(examId) || 'IBPS RRB PO (Officer Scale I)';
    const coachReview = coachService.generateMockReview(newMock, mockTests, examName);
    await coachService.saveDispatch(coachReview);
    setActiveMockReview(coachReview);

    setIsAddMockOpen(false);
    await loadData();
  };

  const handleModalPaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text && text.trim()) {
      handleAutoFillFromText(text);
      return;
    }
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setScorecardImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
          await processImageWithOcr(file);
        }
        break;
      }
    }
  };

  const loadData = async () => {
    try {
      const [mList, mistList, cList, sList, tList] = await Promise.all([
        dbService.getAll<MockTest>('mockTests'),
        dbService.getAll<MistakeEntry>('mistakes'),
        dbService.getAll<Commitment>('commitments'),
        dbService.getAll<Subject>('subjects'),
        dbService.getAll<Topic>('topics'),
      ]);

      let effectiveMocks = mList;
      if (Array.isArray(seedMockTests) && seedMockTests.length > 0) {
        const existingIds = new Set(mList.map((m) => m.id));
        let addedAny = false;
        for (const seed of seedMockTests as MockTest[]) {
          if (!existingIds.has(seed.id)) {
            await dbService.put<MockTest>('mockTests', seed);
            const mockLog = {
              id: `log_mock_${seed.id}`,
              date: seed.date,
              timestamp: seed.createdAt || new Date().toISOString(),
              examId: seed.examId,
              subjectId: '',
              durationMinutes: Number(seed.timeTakenMinutes || 45),
              activityType: 'mock_test' as const,
              notes: `Mock Test: ${seed.testName} — Score: ${seed.totalScore}/${seed.maxScore} (${seed.accuracyPercent}% acc)` + (seed.notes ? ` • ${seed.notes}` : ''),
              createdAt: seed.createdAt || new Date().toISOString(),
            };
            await dbService.put('studyLogs', mockLog);
            addedAny = true;
          }
        }
        if (addedAny) {
          effectiveMocks = await dbService.getAll<MockTest>('mockTests');
        }
      }

      setMockTests(effectiveMocks.sort((a, b) => b.date.localeCompare(a.date)));
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
        analysisCompleted: mockAnalysisCompleted,
        analysisMinutes: mockAnalysisCompleted ? Number(mockAnalysisMinutes) : undefined,
        analysisDate: mockAnalysisCompleted ? testDate : undefined,
      };

      await dbService.put<MockTest>('mockTests', newMock);

      // Automatically log focused study log so time taken reflects across Dashboard, Weekly Hours, and Streak
      if (newMock.timeTakenMinutes && newMock.timeTakenMinutes > 0) {
        const mockLog = {
          id: `log_mock_${newMock.id}`,
          date: testDate,
          timestamp: new Date().toISOString(),
          examId,
          subjectId: '',
          durationMinutes: Number(timeTakenMinutes),
          activityType: 'mock_test' as const,
          notes: `Mock Test: ${testName.trim()} — Score: ${totalScore}/${maxScore} (${computedAccuracy}% acc)` + (notes.trim() ? ` • ${notes.trim()}` : ''),
          createdAt: new Date().toISOString(),
        };
        await dbService.put('studyLogs', mockLog);
      }

      // If candidate also completed analysis, automatically log analysis time into studyLogs!
      if (mockAnalysisCompleted && Number(mockAnalysisMinutes) > 0) {
        const analysisLog = {
          id: `log_analysis_${newMock.id}`,
          date: testDate,
          timestamp: new Date().toISOString(),
          examId,
          subjectId: '',
          durationMinutes: Number(mockAnalysisMinutes),
          activityType: 'mistake_analysis' as const,
          notes: `Mock Analysis: ${testName.trim()} (${mockAnalysisMinutes}m)`,
          createdAt: new Date().toISOString(),
        };
        await dbService.put('studyLogs', analysisLog);
      }

      // Generate immediate Live Mentor Coach Review
      const examName = examMap.get(examId) || 'IBPS RRB PO (Officer Scale I)';
      const coachReview = coachService.generateMockReview(newMock, mockTests, examName);
      await coachService.saveDispatch(coachReview);
      setActiveMockReview(coachReview);

      setIsAddMockOpen(false);
      setTestName('');
      setNotes('');
      setMockAnalysisCompleted(false);
      setMockAnalysisMinutes(45);
      loadData();
    } catch (err) {
      console.error('Failed to save mock test:', err);
    }
  };

  // Delete Mock Test
  const handleDeleteMock = async (mockId: string) => {
    if (!confirm('Are you sure you want to delete this mock test record?')) return;
    try {
      await dbService.delete('mockTests', mockId);
      await dbService.delete('studyLogs', `log_mock_${mockId}`);
      await dbService.delete('studyLogs', `log_analysis_${mockId}`);
      loadData();
    } catch (err) {
      console.error('Failed to delete mock test:', err);
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
            onClick={() => {
              setIsAddMockOpen(true);
              setIsSmartAutoFillOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Smart Auto-Fill from Scorecard</span>
          </button>

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
        <div
          onPaste={handleModalPaste}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay overflow-y-auto"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Record Full Mock Test</h3>
              <button
                type="button"
                onClick={() => setIsAddMockOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Smart Scorecard Auto-Fill Engine */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-sky-50/80 to-purple-50/90 border border-indigo-200/90 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Smart Scorecard Auto-Fill (Zero Typing)</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Smartkeeda • Testbook • Oliveboard
                </span>
              </div>

              {/* Upload or Paste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Upload Image Dropzone */}
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white/90 rounded-lg p-2.5 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {scorecardImagePreview ? (
                    <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
                      <img
                        src={scorecardImagePreview}
                        alt="Scorecard Preview"
                        className="w-8 h-8 rounded object-cover border border-slate-300"
                      />
                      <span className="text-emerald-700 font-bold">Screenshot Loaded</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-indigo-500 mb-1 group-hover:scale-110 transition" />
                      <span className="font-semibold text-slate-800 text-[11px]">Upload Scorecard Screenshot</span>
                      <span className="text-[10px] text-slate-400">or paste screenshot (Ctrl+V)</span>
                    </>
                  )}
                </label>

                {/* Paste Text / Smart Table Text */}
                <div>
                  <textarea
                    rows={2}
                    placeholder="Or paste result text from Oliveboard / Testbook / Smartkeeda..."
                    value={pastedScorecardText}
                    onChange={(e) => handleAutoFillFromText(e.target.value)}
                    className="w-full text-[11px] p-2 border border-indigo-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* OCR Scanning Progress Banner */}
              {isOcrScanning && (
                <div className="bg-white/95 rounded-lg border border-indigo-200 p-2.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      <span>{ocrStatus || 'Scanning image with OCR...'}</span>
                    </span>
                    <span className="font-mono text-indigo-700">{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Fill Actions & Feedback */}
              <div className="space-y-2 pt-1 border-t border-indigo-100/80">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleFillLatestOliveboard}
                      className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 flex items-center gap-1 cursor-pointer transition hover:bg-sky-100"
                    >
                      <Sparkles className="w-3 h-3 text-sky-600" />
                      <span>Oliveboard (36.25/80)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFillLatestSmartkeeda}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 flex items-center gap-1 cursor-pointer transition hover:bg-indigo-100"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Smartkeeda (35.25/80)</span>
                    </button>
                  </div>

                  {autoFillNotice && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      {autoFillNotice}
                    </span>
                  )}
                </div>

                {/* Direct One-Click Save to Table Button */}
                {totalScore > 0 && (
                  <button
                    type="button"
                    onClick={handleDirectSaveFromAutoFill}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>⚡ Save &amp; Add Directly to Mock Tests Table ({totalScore}/{maxScore})</span>
                  </button>
                )}
              </div>
            </div>

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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

              {/* Mock Analysis Section */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mockAnalysisCompleted}
                    onChange={(e) => setMockAnalysisCompleted(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-emerald-950">
                    I also analyzed this mock test (Review incorrect &amp; skipped questions)
                  </span>
                </label>

                {mockAnalysisCompleted && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-emerald-900">Analysis Duration</label>
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
                        className="w-20 text-xs px-2.5 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold text-emerald-950"
                      />
                      <span className="text-xs text-emerald-700">minutes of post-test review added to dashboard</span>
                    </div>
                  </div>
                )}
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

                      {/* Analysis Status */}
                      <div className="mt-2 flex items-center gap-2">
                        {mock.analysisCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Analysis Done ({mock.analysisMinutes || 45}m)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAnalyzingMock(mock)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200 transition-colors cursor-pointer shadow-xs"
                          >
                            <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                            Mark Analysis Complete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
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

                      <button
                        onClick={() => handleDeleteMock(mock.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete mock test record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Analyze Mock Modal */}
      {analyzingMock && (
        <AnalyzeMockModal
          isOpen={!!analyzingMock}
          mock={analyzingMock}
          onClose={() => setAnalyzingMock(null)}
          onSaved={loadData}
        />
      )}

      {/* Immediate Live Mock Feedback Modal */}
      {activeMockReview && (
        <LiveMockFeedbackModal
          isOpen={!!activeMockReview}
          dispatch={activeMockReview}
          onClose={() => setActiveMockReview(null)}
        />
      )}
    </div>
  );
};
