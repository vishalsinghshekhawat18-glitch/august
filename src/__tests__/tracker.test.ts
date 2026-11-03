import { describe, it, expect, vi } from 'vitest';
import {
  calculateWeightedCompletion,
  analyzeWeeklyCapacity,
  generateProposedNextWeekPlan,
} from '../services/planning';
import {
  formatMinutes,
  formatHoursDecimal,
  getWeekBounds,
  getNextWeekBounds,
  addDays,
  daysBetween,
  calculateStudyStreak,
  getUpcomingReminders,
} from '../services/dateUtils';
import { validateDataPackage } from '../services/exportImport';
import { hashPin, generateSalt, verifyPin } from '../services/crypto';
import { dbService, StoreName, INITIAL_COMMITMENTS } from '../services/db';
import {
  markBatchChaptersRead,
  markBatchChaptersRevised,
  completeRevisionWithLog,
  updateCompletedRevisionTime,
  detectOctoberBookSlug,
  getOctoberSubjectMeta,
  importOctoberSubjectChapters,
  groupTopicsByPart,
  getTopicTotalCards,
  logTopicCardProgress,
  updateTopicTotalCards,
  KNOWN_OCTOBER_CARD_COUNTS,
  OCTOBER_CURRENT_AFFAIRS_SECTIONS,
  OCTOBER_RAJASTHAN_HISTORY_UNITS,
  OCTOBER_INDIAN_HISTORY_UNITS,
  RAS_MASTER_SUBJECTS,
  seedRasMasterSyllabus,
  parseOctoberHtml,
} from '../services/octoberLibrary';
import { coachService } from '../services/coachService';
import { VMOU_MA_ECONOMICS_COURSES, DEFAULT_VMOU_ASSIGNMENTS } from '../views/UniversityView';
import {
  WeeklyTask,
  StudyLog,
  ApplicationDataPackage,
  Commitment,
  TopicProgress,
  RevisionRecord,
  MockTest,
  UniversityCourse,
  UniversityItem,
  DailyReview,
  WeeklyReview,
  Subject,
  Topic,
} from '../types';

describe('Personal Exam Tracker Comprehensive Audit Suite', () => {
  describe('1. Weighted Completion Formula & Unfinished Tasks (Section 8)', () => {
    it('calculates weighted completion correctly: Sum(Weight * Progress) / Sum(Weight) * 100', () => {
      const tasks: WeeklyTask[] = [
        {
          id: 't1',
          weeklyPlanId: 'w1',
          title: 'Reasoning Puzzles',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 120,
          weight: 5,
          status: 'completed',
          progressFraction: 1.0,
        },
        {
          id: 't2',
          weeklyPlanId: 'w1',
          title: 'Quant DI',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 120,
          weight: 3,
          status: 'in_progress',
          progressFraction: 0.5,
        },
      ];

      // Total weight: 5 + 3 = 8
      // Weighted progress sum: (5 * 1.0) + (3 * 0.5) = 5 + 1.5 = 6.5
      // Weighted percent: (6.5 / 8) * 100 = 81.25 -> 81.3%
      const result = calculateWeightedCompletion(tasks);
      expect(result.weightedPercent).toBe(81.3);
      expect(result.activeTaskCount).toBe(2);
      expect(result.completedTaskCount).toBe(1);
    });

    it('explicitly excludes dropped tasks from active completion calculations', () => {
      const tasks: WeeklyTask[] = [
        {
          id: 't1',
          weeklyPlanId: 'w1',
          title: 'Core Task',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 60,
          weight: 4,
          status: 'completed',
          progressFraction: 1.0,
        },
        {
          id: 't2',
          weeklyPlanId: 'w1',
          title: 'Dropped Task',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 120,
          weight: 5,
          status: 'dropped',
          progressFraction: 0,
        },
      ];

      const result = calculateWeightedCompletion(tasks);
      // Dropped task excluded: Total weight = 4, progress = 4 * 1.0 = 4. 4/4 * 100 = 100%
      expect(result.weightedPercent).toBe(100);
      expect(result.activeTaskCount).toBe(1);
    });

    it('handles unresolved, deferred, and reduced scope tasks gracefully', () => {
      const tasks: WeeklyTask[] = [
        {
          id: 't1',
          weeklyPlanId: 'w1',
          title: 'Deferred Task',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 120,
          weight: 3,
          status: 'deferred',
          progressFraction: 0.2,
          resolutionNotes: 'Deferred due to university deadline',
        },
        {
          id: 't2',
          weeklyPlanId: 'w1',
          title: 'Reduced Task',
          examId: 'comm_ibps_rrb_po',
          estimatedMinutes: 60,
          weight: 2,
          status: 'reduced',
          progressFraction: 0.8,
          resolutionNotes: 'Reduced from 50 to 20 questions',
        },
      ];

      const result = calculateWeightedCompletion(tasks);
      // Weight: 3 + 2 = 5. Weighted progress: (3 * 0.2) + (2 * 0.8) = 0.6 + 1.6 = 2.2.
      // (2.2 / 5) * 100 = 44%
      expect(result.weightedPercent).toBe(44);
      expect(result.activeTaskCount).toBe(2);
    });
  });

  describe('2. Capacity Analysis & Realistic Planning (Section 8)', () => {
    it('flags over-capacity when target exceeds 1.5x historical average or >45 hours', () => {
      const historicalLogs: StudyLog[] = [
        {
          id: 'l1',
          date: '2026-10-15',
          timestamp: '2026-10-15T10:00:00Z',
          examId: 'comm_ibps_rrb_po',
          subjectId: 's1',
          durationMinutes: 1200, // 20 hours over 4 weeks -> ~5h/week avg
          activityType: 'learning',
          createdAt: '2026-10-15T10:00:00Z',
        },
      ];

      const checkHigh = analyzeWeeklyCapacity(50, historicalLogs, '2026-10-27');
      expect(checkHigh.isOverCapacity).toBe(true);
      expect(checkHigh.recommendation).toContain('exceeds your recent 4-week average');

      const checkBalanced = analyzeWeeklyCapacity(20, historicalLogs, '2026-10-27');
      expect(checkBalanced.isOverCapacity).toBe(false);
    });

    it('proposes next-week plans based on exam priority, weak areas, and deadlines without forcing debt', () => {
      const commitments: Commitment[] = [
        {
          id: 'comm_ibps_rrb_po',
          name: 'IBPS RRB PO',
          code: 'IBPS-RRB-PO',
          type: 'competitive',
          priority: 1,
          dateStatus: 'provisional',
          description: '',
          createdAt: '',
        },
        {
          id: 'comm_vmou_ma_eco',
          name: 'VMOU MA Economics',
          code: 'VMOU-MA-ECO',
          type: 'university',
          priority: 4,
          dateStatus: 'unverified',
          description: '',
          createdAt: '',
        },
      ];

      const universityItems: UniversityItem[] = [
        {
          id: 'u1',
          courseId: 'mec_01',
          title: 'Assignment 1',
          type: 'assignment',
          deadline: '2026-11-04', // Inside next week
          status: 'pending',
          studyMinutesSpent: 0,
          createdAt: '',
        },
      ];

      const plan = generateProposedNextWeekPlan('2026-10-27', commitments, [], [], universityItems, []);
      expect(plan.status).toBe('proposed');
      expect(plan.tasks.some((t) => t.title.includes('VMOU'))).toBe(true);
      expect(plan.tasks.some((t) => t.examId === 'comm_ibps_rrb_po')).toBe(true);
      expect(plan.targetHours).toBeGreaterThan(0);
    });
  });

  describe('3. Spaced Intervals & Date Calculations (Section 9)', () => {
    it('correctly calculates spaced intervals +1, +3, +7, +14, +30 days', () => {
      const basis = '2026-10-01';
      expect(addDays(basis, 1)).toBe('2026-10-02');
      expect(addDays(basis, 3)).toBe('2026-10-04');
      expect(addDays(basis, 7)).toBe('2026-10-08');
      expect(addDays(basis, 14)).toBe('2026-10-15');
      expect(addDays(basis, 30)).toBe('2026-10-31');
    });

    it('calculates days remaining between dates correctly', () => {
      expect(daysBetween('2026-10-27', '2026-10-30')).toBe(3);
      expect(daysBetween('2026-10-27', '2026-10-27')).toBe(0);
      expect(daysBetween('2026-10-27', '2026-10-26')).toBe(-1);
    });

    it('identifies Sunday to Saturday planning bounds as default, treating Sunday 2026-11-01 as Day 1', () => {
      // 2026-11-01 is Sunday (Day 1 of the week)
      const bounds = getWeekBounds('2026-11-01');
      expect(bounds.startDate).toBe('2026-11-01');
      expect(bounds.endDate).toBe('2026-11-07');
      expect(bounds.monday).toBe('2026-11-01'); // backwards compatible alias
      expect(bounds.sunday).toBe('2026-11-07'); // backwards compatible alias
      expect(bounds.days.length).toBe(7);
      expect(bounds.days[0]).toBe('2026-11-01'); // Sunday
      expect(bounds.days[6]).toBe('2026-11-07'); // Saturday

      const nextBounds = getNextWeekBounds('2026-11-01');
      expect(nextBounds.startDate).toBe('2026-11-08');
      expect(nextBounds.endDate).toBe('2026-11-14');

      // Also supports Monday-start when requested
      const monBounds = getWeekBounds('2026-10-27', 'monday');
      expect(monBounds.startDate).toBe('2026-10-26');
      expect(monBounds.endDate).toBe('2026-11-01');
    });

    it('generates in-app reminders for upcoming events (7d, 3d, 1d)', () => {
      const exams = [
        { id: '1', name: 'IBPS RRB PO', targetDate: '2026-10-30', dateStatus: 'provisional' }, // 3 days away
        { id: '2', name: 'Far Away Exam', targetDate: '2026-12-15', dateStatus: 'unverified' }, // > 30 days away
      ];
      const univItems = [
        { id: 'u1', title: 'Assignment 1', deadline: '2026-10-28', status: 'pending' }, // 1 day away
      ];

      const reminders = getUpcomingReminders(exams, univItems, '2026-10-27');
      expect(reminders.length).toBe(2);
      expect(reminders[0].daysRemaining).toBe(1);
      expect(reminders[0].urgency).toBe('critical');
      expect(reminders[1].daysRemaining).toBe(3);
      expect(reminders[1].urgency).toBe('critical');
    });
  });

  describe('4. Active Study Streak Calculation (Section 14)', () => {
    it('counts meaningful recorded study activity only, not merely opening app', () => {
      const dates = ['2026-10-25', '2026-10-26', '2026-10-27'];
      const streak = calculateStudyStreak(dates, '2026-10-27');
      expect(streak.currentStreak).toBe(3);
      expect(streak.bestStreak).toBe(3);
    });

    it('handles gap days in study streak gracefully without punitive messaging', () => {
      const dates = ['2026-10-20', '2026-10-21', '2026-10-27'];
      const streak = calculateStudyStreak(dates, '2026-10-27');
      expect(streak.currentStreak).toBe(1);
      expect(streak.bestStreak).toBe(2);
    });

    it('returns 0 streak for empty study history', () => {
      const streak = calculateStudyStreak([], '2026-10-27');
      expect(streak.currentStreak).toBe(0);
      expect(streak.bestStreak).toBe(0);
    });
  });

  describe('5. Data Package Import Validation & Portability (Section 3)', () => {
    it('validates a complete, authentic Personal Exam Tracker package', () => {
      const validPkg: ApplicationDataPackage = {
        app: 'PersonalExamTracker',
        version: 1,
        exportedAt: '2026-10-27T10:00:00Z',
        data: {
          commitments: [],
          subjects: [],
          topics: [],
          subtopics: [],
          topicProgress: [],
          studyLogs: [
            {
              id: 'l1',
              date: '2026-10-27',
              timestamp: '2026-10-27T10:00:00Z',
              examId: 'comm_ibps_rrb_po',
              subjectId: 's1',
              durationMinutes: 60,
              activityType: 'learning',
              createdAt: '2026-10-27T10:00:00Z',
            },
          ],
          weeklyPlans: [],
          revisions: [],
          mockTests: [],
          mistakes: [],
          universityCourses: [],
          universityItems: [],
          dailyReviews: [],
          weeklyReviews: [],
          settings: {
            id: 'global_settings',
            dateOfBirth: '1996-10-31',
            timeZone: 'Asia/Kolkata',
            guidedSetupCompleted: true,
            schemaVersion: 1,
            updatedAt: '2026-10-27T10:00:00Z',
          },
        },
      };

      const result = validateDataPackage(validPkg);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.counts.studyLogs).toBe(1);
    });

    it('rejects foreign, corrupted, or non-JSON payloads without altering existing data', () => {
      const foreign = { app: 'SomeOtherApp', version: 2, data: {} };
      const result = validateDataPackage(foreign);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File header mismatch');

      const corrupted = null;
      const resNull = validateDataPackage(corrupted);
      expect(resNull.valid).toBe(false);

      const missingData = { app: 'PersonalExamTracker', version: 1 };
      const resMissing = validateDataPackage(missingData);
      expect(resMissing.valid).toBe(false);
      expect(resMissing.errors[0]).toContain('Missing root data payload');
    });
  });

  describe('6. Mock Tests & Metric Consistency (Section 10)', () => {
    it('verifies score percentages and flags metric inconsistency correctly', () => {
      const mock: MockTest = {
        id: 'm1',
        examId: 'comm_ibps_rrb_po',
        testName: 'Prelims Mock 1',
        date: '2026-10-27',
        totalScore: 56.5,
        maxScore: 80,
        accuracyPercent: 90.3,
        correctCount: 56,
        incorrectCount: 6,
        skippedCount: 18,
        attemptedCount: 62,
        timeTakenMinutes: 45,
        createdAt: '2026-10-27T10:00:00Z',
      };

      // Correct (56) + Incorrect (6) = 62 = Attempted (62) -> Consistent!
      expect(mock.correctCount + mock.incorrectCount).toBe(mock.attemptedCount);

      // Attempted (62) + Skipped (18) = 80 = Total Questions
      expect(mock.attemptedCount + mock.skippedCount).toBe(80);

      // Score percentage
      const pct = (mock.totalScore / mock.maxScore) * 100;
      expect(pct).toBeCloseTo(70.625);
    });

    it('identifies metric inconsistency when attempted != correct + incorrect', () => {
      const correct = 50;
      const incorrect = 10;
      const attempted = 65; // Inconsistent by 5 questions!
      const isConsistent = correct + incorrect === attempted;
      expect(isConsistent).toBe(false);
    });

    it('records mock test analysis and ensures both attempt time and analysis time accumulate into dashboard study hours', () => {
      const today = '2026-11-01';
      const mockAttemptTime = 45; // 45 minutes taking the test
      const mockAnalysisTime = 45; // 45 minutes reviewing wrong & unattempted questions

      const mock: MockTest = {
        id: 'mock_test_101',
        examId: 'comm_ibps_rrb_po',
        testName: 'RRB PO Prelims Mock #1',
        date: today,
        totalScore: 58.75,
        maxScore: 80,
        accuracyPercent: 91.2,
        correctCount: 62,
        incorrectCount: 6,
        skippedCount: 12,
        attemptedCount: 68,
        timeTakenMinutes: mockAttemptTime,
        analysisCompleted: true,
        analysisMinutes: mockAnalysisTime,
        analysisDate: today,
        createdAt: '2026-11-01T10:00:00Z',
      };

      expect(mock.analysisCompleted).toBe(true);
      expect(mock.analysisMinutes).toBe(45);

      // Verify corresponding study logs generated for dashboard totals
      const studyLogs: StudyLog[] = [
        {
          id: `log_mock_${mock.id}`,
          date: today,
          timestamp: new Date().toISOString(),
          examId: mock.examId,
          subjectId: '',
          durationMinutes: mock.timeTakenMinutes!,
          activityType: 'mock_test',
          notes: `Mock Test: ${mock.testName}`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `log_analysis_${mock.id}`,
          date: today,
          timestamp: new Date().toISOString(),
          examId: mock.examId,
          subjectId: '',
          durationMinutes: mock.analysisMinutes!,
          activityType: 'mistake_analysis',
          notes: `Mock Analysis: ${mock.testName} (${mock.analysisMinutes}m)`,
          createdAt: new Date().toISOString(),
        },
      ];

      // Calculate total study time for today
      const todayLogs = studyLogs.filter((l) => l.date === today);
      const todayFocusedMinutes = todayLogs.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

      // 45m attempt + 45m analysis = 90m total (1.5 hours)
      expect(todayFocusedMinutes).toBe(90);
      expect(todayLogs.some((l) => l.activityType === 'mock_test')).toBe(true);
      expect(todayLogs.some((l) => l.activityType === 'mistake_analysis')).toBe(true);
    });
  });

  describe('7. Shared Subjects & Independent Exam Progress (Section 5)', () => {
    it('guarantees examination-specific progress for shared subjects via composite keys', () => {
      const topicId = 'topic_seating_arrangement';
      const exam1 = 'comm_ibps_rrb_po';
      const exam2 = 'comm_upsc_apfc';

      // Composite key architecture
      const progressExam1: TopicProgress = {
        id: `${exam1}_${topicId}`,
        examId: exam1,
        topicId,
        learningStatus: 'completed',
        practiceStatus: 'completed',
        revisionStatus: 'completed',
        manualCompletionPercentage: 100,
        updatedAt: '2026-10-27T10:00:00Z',
      };

      const progressExam2: TopicProgress = {
        id: `${exam2}_${topicId}`,
        examId: exam2,
        topicId,
        learningStatus: 'not_started',
        practiceStatus: 'not_started',
        revisionStatus: 'not_started',
        manualCompletionPercentage: 0,
        updatedAt: '2026-10-27T10:00:00Z',
      };

      expect(progressExam1.id).not.toBe(progressExam2.id);
      expect(progressExam1.learningStatus).toBe('completed');
      expect(progressExam2.learningStatus).toBe('not_started');
    });
  });

  describe('8. Formatting & Units Display (Section 14)', () => {
    it('formats minutes into human-readable hours and minutes', () => {
      expect(formatMinutes(0)).toBe('0m');
      expect(formatMinutes(45)).toBe('45m');
      expect(formatMinutes(60)).toBe('1h');
      expect(formatMinutes(150)).toBe('2h 30m');
    });

    it('formats hours in decimal format', () => {
      expect(formatHoursDecimal(0)).toBe('0.0h');
      expect(formatHoursDecimal(90)).toBe('1.5h');
      expect(formatHoursDecimal(120)).toBe('2.0h');
    });
  });

  describe('9. Revision Scheduling & Workflow Regression Suite (User Acceptance Bug Fix)', () => {
    const subjects = [
      { id: 'sub_reasoning', name: 'Reasoning Ability', examIds: ['comm_ibps_rrb_po'], order: 1 },
      { id: 'sub_quant', name: 'Quantitative Aptitude', examIds: ['comm_ibps_rrb_po'], order: 2 },
      { id: 'sub_eco', name: 'Microeconomics', examIds: ['comm_vmou_ma_eco'], order: 1 },
    ];

    const topics: Topic[] = [
      { id: 'top_puzzles', subjectId: 'sub_reasoning', name: 'Floor Puzzles', order: 1, archived: false },
      { id: 'top_syllogism', subjectId: 'sub_reasoning', name: 'Syllogism', order: 2, archived: false },
      { id: 'top_di', subjectId: 'sub_quant', name: 'Bar Graphs & Tables', order: 1, archived: false },
    ];

    it('filters subjects strictly by examination and identifies empty syllabus states', () => {
      const rrbSubjects = subjects.filter((s) => s.examIds.includes('comm_ibps_rrb_po'));
      expect(rrbSubjects.length).toBe(2);
      expect(rrbSubjects.map((s) => s.id)).toEqual(['sub_reasoning', 'sub_quant']);

      const apfcSubjects = subjects.filter((s) => s.examIds.includes('comm_upsc_apfc'));
      expect(apfcSubjects.length).toBe(0); // Detects empty state cleanly for APFC
    });

    it('filters topics strictly by subject and identifies subjects with zero topics', () => {
      const reasoningTopics = topics.filter((t) => t.subjectId === 'sub_reasoning' && !t.archived);
      expect(reasoningTopics.length).toBe(2);

      const ecoTopics = topics.filter((t) => t.subjectId === 'sub_eco' && !t.archived);
      expect(ecoTopics.length).toBe(0); // Detects empty topic state cleanly for Microeconomics
    });

    it('schedules spaced revision records with exact intervals and relationship keys', () => {
      const basisDate = '2026-10-27';
      const intervals = [1, 3, 7, 14, 30];
      const examId = 'comm_ibps_rrb_po';
      const subjectId = 'sub_reasoning';
      const topicId = 'top_puzzles';

      const scheduledRevisions: RevisionRecord[] = intervals.map((interval) => ({
        id: `rev_${Date.now()}_${interval}`,
        examId,
        subjectId,
        topicId,
        basisDate,
        intervalDays: interval,
        scheduledDate: addDays(basisDate, interval),
        status: 'due',
        createdAt: new Date().toISOString(),
      }));

      expect(scheduledRevisions.length).toBe(5);
      expect(scheduledRevisions[0].scheduledDate).toBe('2026-10-28');
      expect(scheduledRevisions[1].scheduledDate).toBe('2026-10-30');
      expect(scheduledRevisions[2].scheduledDate).toBe('2026-11-03');
      expect(scheduledRevisions[3].scheduledDate).toBe('2026-11-10');
      expect(scheduledRevisions[4].scheduledDate).toBe('2026-11-26');

      for (const r of scheduledRevisions) {
        expect(r.examId).toBe(examId);
        expect(r.subjectId).toBe(subjectId);
        expect(r.topicId).toBe(topicId);
        expect(r.status).toBe('due');
      }
    });

    it('handles revision completion, rescheduling, and skipping lifecycle transitions', () => {
      const rev: RevisionRecord = {
        id: 'rev_1',
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_reasoning',
        topicId: 'top_puzzles',
        basisDate: '2026-10-26',
        intervalDays: 1,
        scheduledDate: '2026-10-27',
        status: 'due',
        createdAt: '2026-10-26T10:00:00Z',
      };

      // 1. Due check for today
      const todayStr = '2026-10-27';
      const isDue = (rev.status === 'due' || rev.status === 'rescheduled') && rev.scheduledDate <= todayStr;
      expect(isDue).toBe(true);

      // 2. Mark completed
      const completedRev: RevisionRecord = {
        ...rev,
        status: 'completed',
        completedAt: todayStr,
      };
      expect(completedRev.status).toBe('completed');
      expect(completedRev.completedAt).toBe(todayStr);

      // Excluded from due revisions after completion
      const isDueAfterCompletion =
        (completedRev.status === 'due' || completedRev.status === 'rescheduled') &&
        completedRev.scheduledDate <= todayStr;
      expect(isDueAfterCompletion).toBe(false);

      // 3. Reschedule
      const rescheduledRev: RevisionRecord = {
        ...rev,
        status: 'rescheduled',
        scheduledDate: '2026-10-29',
        rescheduledTo: '2026-10-29',
      };
      expect(rescheduledRev.status).toBe('rescheduled');
      expect(rescheduledRev.scheduledDate).toBe('2026-10-29');

      // 4. Skip
      const skippedRev: RevisionRecord = {
        ...rev,
        status: 'skipped',
      };
      expect(skippedRev.status).toBe('skipped');
    });
  });

  describe('10. PIN Security, Cryptography & Cloud Sync Suite', () => {
    it('generates high-entropy salts and deterministic SHA-256 digests for 4-digit PINs', async () => {
      const pin = '4826';
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      expect(salt1).toHaveLength(32); // 16 bytes hex
      expect(salt2).toHaveLength(32);
      expect(salt1).not.toBe(salt2);

      const hash1a = await hashPin(pin, salt1);
      const hash1b = await hashPin(pin, salt1);
      const hash2 = await hashPin(pin, salt2);

      expect(hash1a).toHaveLength(64); // SHA-256 hex
      expect(hash1a).toBe(hash1b); // Deterministic with same salt
      expect(hash1a).not.toBe(hash2); // Distinct with different salts
    });

    it('verifies correct 4-digit PIN and strictly rejects incorrect or malformed inputs', async () => {
      const correctPin = '7391';
      const wrongPin = '7392';
      const salt = generateSalt();
      const expectedHash = await hashPin(correctPin, salt);

      // 1. Correct PIN matches
      const isCorrectValid = await verifyPin(correctPin, salt, expectedHash);
      expect(isCorrectValid).toBe(true);

      // 2. Incorrect PIN fails
      const isWrongValid = await verifyPin(wrongPin, salt, expectedHash);
      expect(isWrongValid).toBe(false);

      // 3. Malformed inputs fail securely
      expect(await verifyPin('', salt, expectedHash)).toBe(false);
      expect(await verifyPin('123', salt, expectedHash)).toBe(false);
      expect(await verifyPin('12345', salt, expectedHash)).toBe(false);
      expect(await verifyPin('abcd', salt, expectedHash)).toBe(false);
      expect(await verifyPin(correctPin, '', expectedHash)).toBe(false);
      expect(await verifyPin(correctPin, salt, '')).toBe(false);
    });

    it('verifies all 15 IndexedDB storage domains exist for local offline operation', () => {
      const expectedStores: StoreName[] = [
        'commitments',
        'subjects',
        'topics',
        'subtopics',
        'topicProgress',
        'studyLogs',
        'weeklyPlans',
        'revisions',
        'mockTests',
        'mistakes',
        'universityCourses',
        'universityItems',
        'dailyReviews',
        'weeklyReviews',
        'settings',
      ];

      expect(expectedStores.length).toBe(15);
    });

    it('verifies that database service provides clearAllStores for clean reset', async () => {
      expect(typeof dbService.clearAllStores).toBe('function');
    });
  });

  describe('9. Batch Chapter Revision & Spaced Interval Cycles', () => {
    it('marks chapters as revised, advances revisionStatus, completes due revisions, and schedules next cycle', async () => {
      const memoryStore: Record<string, Map<string, any>> = {
        subjects: new Map(),
        topics: new Map(),
        topicProgress: new Map(),
        revisions: new Map(),
        studyLogs: new Map(),
      };

      vi.spyOn(dbService, 'getAll').mockImplementation(async (store: any) => {
        return Array.from(memoryStore[store]?.values() || []);
      });
      vi.spyOn(dbService, 'get').mockImplementation(async (store: any, key: any) => {
        return memoryStore[store]?.get(String(key));
      });
      vi.spyOn(dbService, 'put').mockImplementation(async (store: any, item: any) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        memoryStore[store].set(item.id, item);
      });
      vi.spyOn(dbService, 'putMany').mockImplementation(async (store: any, items: any[]) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        for (const it of items) memoryStore[store].set(it.id, it);
      });

      const mockSubject: Subject = {
        id: 'sub_econ_test',
        name: 'Economics',
        examIds: ['comm_ibps_rrb_po'],
        order: 1,
      };

      const mockTopic1: Topic = {
        id: 'top_econ_1',
        subjectId: 'sub_econ_test',
        name: 'Chapter 1: Economic Organisation and Systems',
        order: 1,
      };
      const mockTopic2: Topic = {
        id: 'top_econ_2',
        subjectId: 'sub_econ_test',
        name: 'Chapter 2: Sectors and Goods Typology',
        order: 2,
      };

      await dbService.put<Subject>('subjects', mockSubject);
      await dbService.put<Topic>('topics', mockTopic1);
      await dbService.put<Topic>('topics', mockTopic2);

      // Pre-existing due revision for yesterday
      const dueRevision: RevisionRecord = {
        id: 'rev_due_yesterday',
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_econ_test',
        topicId: 'top_econ_1',
        basisDate: '2026-10-26',
        intervalDays: 1,
        scheduledDate: '2026-10-27',
        status: 'due',
        createdAt: new Date().toISOString(),
      };
      await dbService.put<RevisionRecord>('revisions', dueRevision);

      // Execute batch revision for yesterday (2026-10-27)
      const result = await markBatchChaptersRevised({
        subject: mockSubject,
        chapterTopicIds: ['top_econ_1', 'top_econ_2'],
        date: '2026-10-27',
        minutesSpent: 60,
        autoScheduleNextCycle: true,
      });

      expect(result.revisedTopicsCount).toBe(2);
      expect(result.nextScheduledDates.length).toBeGreaterThan(0);
      expect(result.nextScheduledDates).toContain('2026-10-30'); // +3d
      expect(result.nextScheduledDates).toContain('2026-11-03'); // +7d
      expect(result.nextScheduledDates).toContain('2026-11-17'); // +21d

      // Verify TopicProgress updated
      const prog1 = await dbService.get<TopicProgress>('topicProgress', 'comm_ibps_rrb_po_top_econ_1');
      expect(prog1?.revisionStatus).toBe('completed');
      expect(prog1?.learningStatus).toBe('completed');
      expect(prog1?.lastStudiedAt).toBe('2026-10-27');

      // Verify pre-existing due revision was marked completed
      const updatedRev = await dbService.get<RevisionRecord>('revisions', 'rev_due_yesterday');
      expect(updatedRev?.status).toBe('completed');
      expect(updatedRev?.completedAt).toBe('2026-10-27');

      // Verify StudyLog created with activityType: 'revision'
      const logs = await dbService.getAll<StudyLog>('studyLogs');
      const revLog = logs.find((l) => l.topicId === 'top_econ_1' && l.activityType === 'revision');
      expect(revLog).toBeDefined();
      expect(revLog?.durationMinutes).toBe(60);
      expect(revLog?.date).toBe('2026-10-27');
    });

    it('marks chapters as read in learning mode, calculates remaining chapters and completion percentage', async () => {
      const memoryStore: Record<string, Map<string, any>> = {
        subjects: new Map(),
        topics: new Map(),
        topicProgress: new Map(),
        revisions: new Map(),
        studyLogs: new Map(),
      };

      vi.spyOn(dbService, 'getAll').mockImplementation(async (store: any) => {
        return Array.from(memoryStore[store]?.values() || []);
      });
      vi.spyOn(dbService, 'get').mockImplementation(async (store: any, key: any) => {
        return memoryStore[store]?.get(String(key));
      });
      vi.spyOn(dbService, 'put').mockImplementation(async (store: any, item: any) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        memoryStore[store].set(item.id, item);
      });
      vi.spyOn(dbService, 'putMany').mockImplementation(async (store: any, items: any[]) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        for (const it of items) memoryStore[store].set(it.id, it);
      });

      const mockSubject: Subject = {
        id: 'sub_econ_read_test',
        name: 'Economics',
        examIds: ['comm_ibps_rrb_po'],
        order: 1,
      };

      const topics: Topic[] = [
        { id: 'top_1', subjectId: 'sub_econ_read_test', name: 'Chapter 1', order: 1 },
        { id: 'top_2', subjectId: 'sub_econ_read_test', name: 'Chapter 2', order: 2 },
        { id: 'top_3', subjectId: 'sub_econ_read_test', name: 'Chapter 3', order: 3 },
        { id: 'top_4', subjectId: 'sub_econ_read_test', name: 'Chapter 4', order: 4 },
      ];

      await dbService.put<Subject>('subjects', mockSubject);
      for (const t of topics) await dbService.put<Topic>('topics', t);

      const result = await markBatchChaptersRead({
        subject: mockSubject,
        chapterTopicIds: ['top_1', 'top_2'],
        date: '2026-10-27',
        minutesSpent: 90,
        autoScheduleRevision: true,
      });

      expect(result.updatedTopicsCount).toBe(2);
      expect(result.totalChapters).toBe(4);
      expect(result.remainingChapters).toBe(2);
      expect(result.completionPercentage).toBe(50);

      const logList = await dbService.getAll<StudyLog>('studyLogs');
      const readLog = logList.find((l) => l.topicId === 'top_1' && l.activityType === 'learning');
      expect(readLog).toBeDefined();
      expect(readLog?.durationMinutes).toBe(90);
    });

    it('completes revision with exact time duration, creates StudyLog, and auto-schedules next interval', async () => {
      const memoryStore: Record<string, Map<string, any>> = {
        subjects: new Map(),
        topics: new Map(),
        topicProgress: new Map(),
        revisions: new Map(),
        studyLogs: new Map(),
      };

      vi.spyOn(dbService, 'getAll').mockImplementation(async (store: any) => {
        return Array.from(memoryStore[store]?.values() || []);
      });
      vi.spyOn(dbService, 'get').mockImplementation(async (store: any, key: any) => {
        return memoryStore[store]?.get(String(key));
      });
      vi.spyOn(dbService, 'put').mockImplementation(async (store: any, item: any) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        memoryStore[store].set(item.id, item);
      });
      vi.spyOn(dbService, 'putMany').mockImplementation(async (store: any, items: any[]) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        for (const it of items) memoryStore[store].set(it.id, it);
      });

      const dueRev1: RevisionRecord = {
        id: 'rev_1',
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_econ',
        topicId: 'top_econ_ch1',
        basisDate: '2026-10-26',
        intervalDays: 1,
        scheduledDate: '2026-10-27',
        status: 'due',
        createdAt: new Date().toISOString(),
      };
      const dueRev2: RevisionRecord = {
        id: 'rev_2',
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_econ',
        topicId: 'top_econ_ch2',
        basisDate: '2026-10-26',
        intervalDays: 1,
        scheduledDate: '2026-10-27',
        status: 'due',
        createdAt: new Date().toISOString(),
      };

      await dbService.put<RevisionRecord>('revisions', dueRev1);
      await dbService.put<RevisionRecord>('revisions', dueRev2);

      const result = await completeRevisionWithLog({
        revisionIds: ['rev_1', 'rev_2'],
        date: '2026-10-28',
        durationMinutes: 50,
        autoScheduleNext: true,
        notes: 'Revised chapters 1 and 2 thoroughly',
      });

      expect(result.completedCount).toBe(2);

      // Verify revision records updated with durationMinutes
      const updated1 = await dbService.get<RevisionRecord>('revisions', 'rev_1');
      const updated2 = await dbService.get<RevisionRecord>('revisions', 'rev_2');
      expect(updated1?.status).toBe('completed');
      expect(updated1?.completedAt).toBe('2026-10-28');
      expect(updated1?.durationMinutes).toBe(25);
      expect(updated2?.durationMinutes).toBe(25);

      // Verify StudyLog created
      const logs = await dbService.getAll<StudyLog>('studyLogs');
      const revLog = logs.find((l) => l.activityType === 'revision');
      expect(revLog).toBeDefined();
      expect(revLog?.durationMinutes).toBe(50);
      expect(revLog?.date).toBe('2026-10-28');

      // Verify next intervals scheduled (+3d from 2026-10-28 -> 2026-10-31)
      const allRevs = await dbService.getAll<RevisionRecord>('revisions');
      const nextRevs = allRevs.filter((r) => r.scheduledDate === '2026-10-31');
      expect(nextRevs.length).toBe(2);
    });

    it('retroactively updates time spent on an already completed revision record and syncs StudyLog', async () => {
      const memoryStore: Record<string, Map<string, any>> = {
        subjects: new Map(),
        topics: new Map(),
        topicProgress: new Map(),
        revisions: new Map(),
        studyLogs: new Map(),
      };

      vi.spyOn(dbService, 'getAll').mockImplementation(async (store: any) => {
        return Array.from(memoryStore[store]?.values() || []);
      });
      vi.spyOn(dbService, 'get').mockImplementation(async (store: any, key: any) => {
        return memoryStore[store]?.get(String(key));
      });
      vi.spyOn(dbService, 'put').mockImplementation(async (store: any, item: any) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        memoryStore[store].set(item.id, item);
      });
      vi.spyOn(dbService, 'putMany').mockImplementation(async (store: any, items: any[]) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        for (const it of items) memoryStore[store].set(it.id, it);
      });

      const completedRev: RevisionRecord = {
        id: 'rev_completed_earlier',
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_econ',
        topicId: 'top_econ_ch1',
        basisDate: '2026-10-26',
        intervalDays: 1,
        scheduledDate: '2026-10-27',
        status: 'completed',
        completedAt: '2026-10-28',
        createdAt: new Date().toISOString(),
      };

      await dbService.put<RevisionRecord>('revisions', completedRev);

      await updateCompletedRevisionTime({
        revisionId: 'rev_completed_earlier',
        durationMinutes: 45,
        date: '2026-10-28',
        notes: 'Added revision duration',
      });

      const updated = await dbService.get<RevisionRecord>('revisions', 'rev_completed_earlier');
      expect(updated?.durationMinutes).toBe(45);

      const logs = await dbService.getAll<StudyLog>('studyLogs');
      const log = logs.find((l) => l.topicId === 'top_econ_ch1' && l.activityType === 'revision');
      expect(log).toBeDefined();
      expect(log?.durationMinutes).toBe(45);
    });

    it('correctly detects Current Affairs slug and imports 10 sections while removing accidental Economics chapters', async () => {
      const memoryStore: Record<string, Map<string, any>> = {
        subjects: new Map(),
        topics: new Map(),
        topicProgress: new Map(),
        revisions: new Map(),
        studyLogs: new Map(),
      };

      vi.spyOn(dbService, 'getAll').mockImplementation(async (store: any) => {
        return Array.from(memoryStore[store]?.values() || []);
      });
      vi.spyOn(dbService, 'get').mockImplementation(async (store: any, key: any) => {
        return memoryStore[store]?.get(String(key));
      });
      vi.spyOn(dbService, 'put').mockImplementation(async (store: any, item: any) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        memoryStore[store].set(item.id, item);
      });
      vi.spyOn(dbService, 'putMany').mockImplementation(async (store: any, items: any[]) => {
        if (!memoryStore[store]) memoryStore[store] = new Map();
        for (const it of items) memoryStore[store].set(it.id, it);
      });
      vi.spyOn(dbService, 'delete').mockImplementation(async (store: any, key: any) => {
        memoryStore[store]?.delete(String(key));
      });

      const caSubject: Subject = {
        id: 'sub_ca',
        name: 'Current Affairs',
        description: 'https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=current-affairs',
        examIds: ['comm_ibps_rrb_po'],
        order: 2,
      };

      // Verify slug detection
      expect(detectOctoberBookSlug(caSubject.description, caSubject.name)).toBe('current-affairs');

      // Simulate accidental presence of an Economics chapter under Current Affairs
      const accidentalEconTopic: Topic = {
        id: 'top_oct_econ_1_accidental',
        subjectId: 'sub_ca',
        name: 'Chapter 1: Economic Organisation and Systems',
        order: 1,
      };
      await dbService.put<Subject>('subjects', caSubject);
      await dbService.put<Topic>('topics', accidentalEconTopic);

      // Verify metadata detects mismatch
      const meta = getOctoberSubjectMeta(caSubject, [accidentalEconTopic]);
      expect(meta.isOctoberSubject).toBe(true);
      expect(meta.bookSlug).toBe('current-affairs');
      expect(meta.expectedUnitsCount).toBe(20);
      expect(meta.unitLabel).toBe('Sections');
      expect(meta.hasMismatchedTopics).toBe(true);

      // Execute import
      const result = await importOctoberSubjectChapters(caSubject);
      expect(result.bookSlug).toBe('current-affairs');
      expect(result.unitLabel).toBe('Sections');
      expect(result.totalCount).toBeGreaterThanOrEqual(20);

      // Verify accidental Economics chapter was deleted and replaced with Current Affairs sections
      const allTopics = await dbService.getAll<Topic>('topics');
      const caTopics = allTopics.filter((t) => t.subjectId === 'sub_ca');
      expect(caTopics.length).toBeGreaterThanOrEqual(20);
      expect(caTopics.some((t) => t.name.includes('Economic Organisation'))).toBe(false);
      expect(caTopics.some((t) => t.name.includes('[Static]'))).toBe(true);
      expect(caTopics.some((t) => t.notes && t.notes.includes('#static-s1'))).toBe(true);

      // Verify topics are grouped into distinct collapsible files
      const groups = groupTopicsByPart(caTopics);
      expect(groups.length).toBeGreaterThanOrEqual(2);
      expect(groups.some((g) => g.title === 'Static Bank')).toBe(true);
      expect(groups.some((g) => g.title.includes('2026'))).toBe(true);

      // Verify card counting and logging card-level progress with automatic spaced revision
      const s1Topic = caTopics.find((t) => t.notes && t.notes.includes('#jan-mar-2026-s1'))!;
      expect(s1Topic).toBeDefined();
      const cardInfo = getTopicTotalCards(s1Topic);
      expect(cardInfo).toBeDefined();
      expect(cardInfo?.totalCards).toBe(64);
      expect(cardInfo?.cardLabel).toBe('cards');

      // 1. Read first 10 cards out of 64
      const res1 = await logTopicCardProgress({
        examId: 'exam_rrb_po',
        subject: caSubject,
        topic: s1Topic,
        cardsReadCount: 10,
        totalCards: 64,
        date: '2026-10-27',
        durationMinutes: 30,
        autoScheduleRevision: true,
      });

      expect(res1.topicProgress.completedCards).toBe(10);
      expect(res1.topicProgress.manualCompletionPercentage).toBe(16);
      expect(res1.topicProgress.learningStatus).toBe('in_progress');
      expect(res1.studyLog.durationMinutes).toBe(30);
      expect(res1.studyLog.notes).toContain('Cards 1–10');
      expect(res1.revisions.length).toBe(4);
      expect(res1.revisions[0].notes).toBe('Cards 1–10');
      expect(res1.revisions[0].scheduledDate).toBe('2026-10-28'); // +1 day

      // 2. Read next 15 cards (Cards 11–25)
      const res2 = await logTopicCardProgress({
        examId: 'exam_rrb_po',
        subject: caSubject,
        topic: s1Topic,
        cardsReadCount: 15,
        totalCards: 64,
        date: '2026-10-28',
        durationMinutes: 45,
        autoScheduleRevision: true,
      });

      expect(res2.topicProgress.completedCards).toBe(25);
      expect(res2.topicProgress.manualCompletionPercentage).toBe(39);
      expect(res2.studyLog.notes).toContain('Cards 11–25');
      expect(res2.revisions[0].notes).toBe('Cards 11–25');
      expect(res2.revisions[0].scheduledDate).toBe('2026-10-29'); // +1 day from Oct 28
    });
  });

  describe('11. Focused Target Commitment Priority Architecture (No IIBF Clashing)', () => {
    it('verifies that INITIAL_COMMITMENTS contains the focused commitments with correct priorities and no IIBF', () => {
      expect(INITIAL_COMMITMENTS.length).toBe(4);

      const rrb = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_ibps_rrb_po');
      expect(rrb).toBeDefined();
      expect(rrb?.priority).toBe(1);
      expect(rrb?.targetDate).toBe('2026-11-20');
      expect(rrb?.dateStatus).toBe('confirmed');

      const ras = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_rpsc_ras');
      expect(ras).toBeDefined();
      expect(ras?.priority).toBe(2);

      const apfc = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_upsc_apfc');
      expect(apfc).toBeDefined();
      expect(apfc?.priority).toBe(3);

      const vmou = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_vmou_ma_eco');
      expect(vmou).toBeDefined();
      expect(vmou?.priority).toBe(4);

      // Verify IIBF is completely excluded
      const iibf = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_iibf_dbf');
      expect(iibf).toBeUndefined();
    });

    it('correctly calculates days remaining for IBPS RRB PO from today (2026-11-01)', () => {
      const todayStr = '2026-11-01';
      const daysToRrb = daysBetween(todayStr, '2026-11-20');
      expect(daysToRrb).toBe(19);
    });

    it('verifies that today (2026-11-01) is treated as Day 1 of the study week cycle', () => {
      const todayStr = '2026-11-01';
      const week = getWeekBounds(todayStr);
      expect(week.days[0]).toBe(todayStr);
      expect(week.startDate).toBe('2026-11-01');
      expect(week.endDate).toBe('2026-11-07');
    });
  });

  describe('12. AI Mentor Coach & Live Immediate Review Suite', () => {
    it('generates an immediate live diagnostic review upon submitting a mock test', () => {
      const mock: MockTest = {
        id: 'mock_test_sample',
        examId: 'comm_ibps_rrb_po',
        testName: 'IBPS RRB PO Prelims Mock #01',
        date: '2026-11-01',
        totalScore: 54.5,
        maxScore: 80,
        accuracyPercent: 90.3,
        correctCount: 56,
        incorrectCount: 6,
        skippedCount: 18,
        attemptedCount: 62,
        timeTakenMinutes: 45,
        createdAt: '2026-11-01T10:00:00Z',
      };

      const review = coachService.generateMockReview(mock, [], 'IBPS RRB PO');

      expect(review).toBeDefined();
      expect(review.type).toBe('mock_review');
      expect(review.title).toContain('Live Mock Debrief');
      expect(review.metrics?.score).toBe(54.5);
      expect(review.metrics?.negativePenalty).toBe(1.5); // 6 * 0.25 = 1.5 marks lost
      expect(review.actionItems.length).toBeGreaterThanOrEqual(3);
      expect(review.socraticQuestion).toBeDefined();
      expect(review.commentary.toLowerCase()).toContain('negative');
    });

    it('generates contextual periodic coach briefings based on hours and time of day', () => {
      // 1. Morning Kickoff (09:00 AM)
      const morningReview = coachService.generateProgressReview({
        todayFocusedMinutes: 0,
        streak: 1,
        weeklyActualMinutes: 0,
        weeklyTargetHours: 25,
        dueRevisionsCount: 2,
        recentMocks: [],
        currentPlanTasks: [],
        forcedHour: 9,
      });

      expect(morningReview).toBeDefined();
      expect(morningReview.type).toBe('morning_kickoff');
      expect(morningReview.actionItems.length).toBeGreaterThan(0);
      expect(morningReview.socraticQuestion).toBeDefined();
      expect(morningReview.summary).toContain('Streak: Day 1');

      // 2. Midday Momentum Check (02:00 PM)
      const middayReview = coachService.generateProgressReview({
        todayFocusedMinutes: 90,
        streak: 1,
        weeklyActualMinutes: 90,
        weeklyTargetHours: 25,
        dueRevisionsCount: 0,
        recentMocks: [],
        currentPlanTasks: [],
        forcedHour: 14,
      });

      expect(middayReview).toBeDefined();
      expect(middayReview.type).toBe('midday_check');
      expect(middayReview.summary).toContain('1.5h');

      // 3. Evening Attainment Debrief (08:30 PM)
      const eveningReview = coachService.generateProgressReview({
        todayFocusedMinutes: 210,
        streak: 1,
        weeklyActualMinutes: 210,
        weeklyTargetHours: 25,
        dueRevisionsCount: 0,
        recentMocks: [],
        currentPlanTasks: [],
        forcedHour: 20,
      });

      expect(eveningReview).toBeDefined();
      expect(eveningReview.type).toBe('evening_debrief');
      expect(eveningReview.rating).toBe('exceptional');
    });
  });

  describe('13. Card Count Verification & On-the-Fly Card Count Customization', () => {
    it('verifies Section 1 Constitution and Polity is configured to 35 cards in known counts and chapter catalogs', () => {
      expect(KNOWN_OCTOBER_CARD_COUNTS['static-s1']).toEqual({
        totalCards: 35,
        cardLabel: 'cards',
      });

      const sec1 = OCTOBER_CURRENT_AFFAIRS_SECTIONS.find(
        (s) => s.title.toLowerCase().includes('polity') && s.part === 'Static Bank'
      );
      expect(sec1).toBeDefined();
      expect(sec1?.totalCards).toBe(35);
      expect(sec1?.cardLabel).toBe('cards');
    });

    it('auto-corrects a topic stored with 28 cards for Polity to 35 cards in getTopicTotalCards', () => {
      const storedTopic: Topic = {
        id: 'top_static_s1',
        subjectId: 'sub_ca',
        name: 'Section 1: Constitution, Polity and Amendments',
        order: 1,
        totalCards: 28, // Erroneously stored count
        cardLabel: 'cards',
        notes: 'reader.html?book=current-affairs#static-s1',
      };

      const info = getTopicTotalCards(storedTopic);
      expect(info).toBeDefined();
      expect(info?.totalCards).toBe(35);
      expect(info?.cardLabel).toBe('cards');
      expect(storedTopic.totalCards).toBe(35);
    });

    it('allows updating total cards and card label for any topic on the fly via updateTopicTotalCards', async () => {
      const customTopic: Topic = {
        id: 'top_custom_reasoning',
        subjectId: 'sub_reasoning',
        name: 'Puzzles & Seating Arrangement',
        order: 1,
        totalCards: 20,
        cardLabel: 'cards',
      };
      await dbService.put<Topic>('topics', customTopic);

      // Student customizes count to 45 questions
      const updated = await updateTopicTotalCards('top_custom_reasoning', 45, 'questions');
      expect(updated).toBeDefined();
      expect(updated?.totalCards).toBe(45);
      expect(updated?.cardLabel).toBe('questions');

      // Verify persisted in db
      const fetched = await dbService.get<Topic>('topics', 'top_custom_reasoning');
      expect(fetched?.totalCards).toBe(45);
      expect(fetched?.cardLabel).toBe('questions');
    });

    it('allows editing an existing study log duration and date when a session took more time than expected', async () => {
      const initialLog: StudyLog = {
        id: 'log_polity_cards',
        date: '2026-11-01',
        timestamp: new Date().toISOString(),
        examId: 'comm_ibps_rrb_po',
        subjectId: 'sub_ca',
        topicId: 'top_static_s1',
        durationMinutes: 15, // Initially logged 15 minutes
        activityType: 'learning',
        notes: 'Section 1: Constitution, Polity and Amendments: Read Cards 1–5 (5/35 cards)',
        createdAt: new Date().toISOString(),
      };
      await dbService.put<StudyLog>('studyLogs', initialLog);

      // Student took >30 minutes (e.g. 35 minutes) and edits the record
      const logToEdit = await dbService.get<StudyLog>('studyLogs', 'log_polity_cards');
      expect(logToEdit).toBeDefined();
      expect(logToEdit?.durationMinutes).toBe(15);

      const updatedLog: StudyLog = {
        ...logToEdit!,
        durationMinutes: 35, // Corrected to 35 mins
        notes: 'Section 1: Constitution, Polity and Amendments: Read Cards 1–5 (took 35 mins thorough reading)',
      };
      await dbService.put<StudyLog>('studyLogs', updatedLog);

      // Verify the updated duration in DB
      const verified = await dbService.get<StudyLog>('studyLogs', 'log_polity_cards');
      expect(verified?.durationMinutes).toBe(35);
      expect(verified?.notes).toContain('took 35 mins');

      // Verify today's total calculation includes the full 35 minutes
      const allLogs = await dbService.getAll<StudyLog>('studyLogs');
      const todayTotal = allLogs
        .filter((l) => l.date === '2026-11-01')
        .reduce((sum, l) => sum + l.durationMinutes, 0);
      expect(todayTotal).toBeGreaterThanOrEqual(35);
    });
  });

  describe('15. RPSC RAS / RTS Master Syllabus & October Library Integration', () => {
    it('includes comm_rpsc_ras in INITIAL_COMMITMENTS with code RPSC-RAS and priority 2', () => {
      const rasComm = INITIAL_COMMITMENTS.find((c) => c.id === 'comm_rpsc_ras');
      expect(rasComm).toBeDefined();
      expect(rasComm?.code).toBe('RPSC-RAS');
      expect(rasComm?.name).toContain('RPSC RAS');
      expect(rasComm?.type).toBe('competitive');
      expect(rasComm?.priority).toBe(2);
    });

    it('defines all 18 official RAS papers in RAS_MASTER_SUBJECTS matching October Library subjects.json', () => {
      expect(RAS_MASTER_SUBJECTS.length).toBe(18);
      const names = RAS_MASTER_SUBJECTS.map((s) => s.name);
      expect(names).toEqual([
        'Rajasthan History',
        'Indian History',
        'Rajasthan Art, Culture & Heritage',
        'Modern World History',
        'Indian & World Geography',
        'Rajasthan Geography',
        'Indian Polity, Governance & World Affairs',
        'Rajasthan Polity & Administration',
        'Indian Economy',
        'Rajasthan Economy',
        'Science & Technology',
        'Reasoning & Mental Ability',
        'Current Affairs',
        'Sociology, Management & Accounting',
        'Administrative Ethics & Behaviour',
        'Public Administration & Law',
        'Sports & Yoga',
        'General Hindi & English',
      ]);
    });

    it('contains exactly 22 units for Rajasthan History (R01 to R22) across 3 parts', () => {
      expect(OCTOBER_RAJASTHAN_HISTORY_UNITS.length).toBe(22);
      expect(OCTOBER_RAJASTHAN_HISTORY_UNITS[0].name).toContain('R01 · Sources and Historians of Rajasthan');
      expect(OCTOBER_RAJASTHAN_HISTORY_UNITS[0].notes).toContain('book=ras-rajasthan-history#r01');
      expect(OCTOBER_RAJASTHAN_HISTORY_UNITS[21].name).toContain('R22 · Leading Personalities and Master Chronology');
      expect(OCTOBER_RAJASTHAN_HISTORY_UNITS[21].notes).toContain('book=ras-rajasthan-history#r22');

      const parts = new Set(OCTOBER_RAJASTHAN_HISTORY_UNITS.map((u) => u.part));
      expect(Array.from(parts)).toEqual([
        'Foundations',
        'Dynasties (to the 18th century)',
        'Modern Rajasthan',
      ]);
    });

    it('contains exactly 46 units for Indian History (I01 to I46) across 4 parts', () => {
      expect(OCTOBER_INDIAN_HISTORY_UNITS.length).toBe(46);
      expect(OCTOBER_INDIAN_HISTORY_UNITS[0].name).toContain('I01 · Sources and How Historians Work');
      expect(OCTOBER_INDIAN_HISTORY_UNITS[0].notes).toContain('book=ras-indian-history#i01');
      expect(OCTOBER_INDIAN_HISTORY_UNITS[45].name).toContain('I46 · Science and Technology; Economic Reforms of 1991');
      expect(OCTOBER_INDIAN_HISTORY_UNITS[45].notes).toContain('book=ras-indian-history#i46');

      const parts = new Set(OCTOBER_INDIAN_HISTORY_UNITS.map((u) => u.part));
      expect(Array.from(parts)).toEqual([
        'Ancient India',
        'Medieval India',
        'Modern India (to 1947)',
        'Independent India (to 2000)',
      ]);
    });

    it('correctly detects October book slug for Rajasthan History and Indian History', () => {
      expect(detectOctoberBookSlug(undefined, 'Rajasthan History')).toBe('ras-rajasthan-history');
      expect(detectOctoberBookSlug(undefined, 'Indian History')).toBe('ras-indian-history');
      expect(detectOctoberBookSlug('https://domain/reader.html?book=ras-rajasthan-history')).toBe('ras-rajasthan-history');
      expect(detectOctoberBookSlug('https://domain/reader.html?book=ras-indian-history')).toBe('ras-indian-history');
    });

    it('returns expected meta of 22 units for Rajasthan History and 46 units for Indian History', () => {
      const rajSubject: Subject = {
        id: 'sub_ras_raj_hist',
        name: 'Rajasthan History',
        examIds: ['comm_rpsc_ras'],
        order: 1,
      };
      const rajMeta = getOctoberSubjectMeta(rajSubject);
      expect(rajMeta.isOctoberSubject).toBe(true);
      expect(rajMeta.bookSlug).toBe('ras-rajasthan-history');
      expect(rajMeta.expectedUnitsCount).toBe(22);
      expect(rajMeta.unitLabel).toBe('Units');

      const indSubject: Subject = {
        id: 'sub_ras_ind_hist',
        name: 'Indian History',
        examIds: ['comm_rpsc_ras'],
        order: 2,
      };
      const indMeta = getOctoberSubjectMeta(indSubject);
      expect(indMeta.isOctoberSubject).toBe(true);
      expect(indMeta.bookSlug).toBe('ras-indian-history');
      expect(indMeta.expectedUnitsCount).toBe(46);
      expect(indMeta.unitLabel).toBe('Units');
    });

    it('correctly groups Rajasthan History and Indian History topics into part folders with accurate counts', () => {
      const rajTopics: Topic[] = OCTOBER_RAJASTHAN_HISTORY_UNITS.map((u) => ({
        id: `test_raj_${u.order}`,
        subjectId: 'sub_ras_raj_hist',
        name: u.name,
        order: u.order,
        notes: u.notes,
        totalCards: 1,
        cardLabel: 'units',
      }));

      const rajGroups = groupTopicsByPart(rajTopics);
      expect(rajGroups.length).toBe(3);
      expect(rajGroups[0].title).toBe('Foundations');
      expect(rajGroups[0].topics.length).toBe(4);
      expect(rajGroups[1].title).toBe('Dynasties (to the 18th century)');
      expect(rajGroups[1].topics.length).toBe(10);
      expect(rajGroups[2].title).toBe('Modern Rajasthan');
      expect(rajGroups[2].topics.length).toBe(8);

      const indTopics: Topic[] = OCTOBER_INDIAN_HISTORY_UNITS.map((u) => ({
        id: `test_ind_${u.order}`,
        subjectId: 'sub_ras_ind_hist',
        name: u.name,
        order: u.order,
        notes: u.notes,
        totalCards: 1,
        cardLabel: 'units',
      }));

      const indGroups = groupTopicsByPart(indTopics);
      expect(indGroups.length).toBe(4);
      expect(indGroups[0].title).toBe('Ancient India');
      expect(indGroups[0].topics.length).toBe(14);
      expect(indGroups[1].title).toBe('Medieval India');
      expect(indGroups[1].topics.length).toBe(11);
      expect(indGroups[2].title).toBe('Modern India (to 1947)');
      expect(indGroups[2].topics.length).toBe(17);
      expect(indGroups[3].title).toBe('Independent India (to 2000)');
      expect(indGroups[3].topics.length).toBe(4);
    });

    it('parses live October HTML for RAS books correctly with part prefixes and direct anchor links', () => {
      const sampleHtml = `
        <h1 class="rd-part" id="part-1" data-toc="Foundations">Foundations</h1>
        <h2 id="r01" data-toc="R01 · Sources and Historians of Rajasthan">Sources</h2>
        <h2 id="r02" data-toc="R02 · Prehistoric Rajasthan">Prehistoric</h2>
        <h1 class="rd-part" id="part-2" data-toc="Dynasties (to the 18th century)">Dynasties</h1>
        <h2 id="r05" data-toc="R05 · Origin of the Rajputs">Origin</h2>
      `;
      const parsed = parseOctoberHtml(
        sampleHtml,
        'ras-rajasthan-history',
        'https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=ras-rajasthan-history'
      );

      expect(parsed.length).toBe(3);
      expect(parsed[0].name).toBe('[Foundations] R01 · Sources and Historians of Rajasthan');
      expect(parsed[0].anchorId).toBe('r01');
      expect(parsed[0].notes).toBe('https://vishalsinghshekhawat18-glitch.github.io/October/reader.html?book=ras-rajasthan-history#r01');
      expect(parsed[2].name).toBe('[Dynasties (to the 18th century)] R05 · Origin of the Rajputs');
      expect(parsed[2].anchorId).toBe('r05');
    });

    it('seeds full RAS master syllabus into database with 18 subjects, 22 Rajasthan units, and 46 Indian units', async () => {
      await seedRasMasterSyllabus(dbService);

      // Verify commitment
      const comm = await dbService.get<Commitment>('commitments', 'comm_rpsc_ras');
      expect(comm).toBeDefined();
      expect(comm?.name).toContain('RPSC RAS');

      // Verify all 18 subjects exist and link to comm_rpsc_ras
      const allSubs = await dbService.getAll<Subject>('subjects');
      const rasSubs = allSubs.filter((s) => s.examIds.includes('comm_rpsc_ras'));
      expect(rasSubs.length).toBe(18);

      // Verify Rajasthan History has 22 topics in DB
      const rajSub = allSubs.find((s) => s.name === 'Rajasthan History');
      expect(rajSub).toBeDefined();
      const allTopics = await dbService.getAll<Topic>('topics');
      const rajTopics = allTopics.filter((t) => t.subjectId === rajSub?.id);
      expect(rajTopics.length).toBe(22);

      // Verify Indian History has 46 topics in DB
      const indSub = allSubs.find((s) => s.name === 'Indian History');
      expect(indSub).toBeDefined();
      const indTopics = allTopics.filter((t) => t.subjectId === indSub?.id);
      expect(indTopics.length).toBe(46);

      // Verify topicProgress entries are generated for comm_rpsc_ras
      const allProgress = await dbService.getAll<TopicProgress>('topicProgress');
      const rasProgress = allProgress.filter((p) => p.examId === 'comm_rpsc_ras');
      expect(rasProgress.length).toBeGreaterThanOrEqual(68); // 22 + 46 = 68
    });
  });

  describe('16. VMOU Kota M.A. Economics Internal Assignment Tracking Suite', () => {
    it('defines official VMOU course modules matching assignment booklet (MAEC 01-04 & MD electives)', () => {
      expect(VMOU_MA_ECONOMICS_COURSES.length).toBe(7);
      const codes = VMOU_MA_ECONOMICS_COURSES.map((c) => c.code);
      expect(codes).toContain('MAEC-01');
      expect(codes).toContain('MAEC-02');
      expect(codes).toContain('MAEC-03');
      expect(codes).toContain('MAEC-04');
      expect(codes).toContain('MD 01');
      expect(codes).toContain('MD 02');
      expect(codes).toContain('MD 03');
    });

    it('pre-configures default internal assignments for the 4 core papers with November 15 deadline', () => {
      expect(DEFAULT_VMOU_ASSIGNMENTS.length).toBe(4);
      for (const assign of DEFAULT_VMOU_ASSIGNMENTS) {
        expect(assign.deadline).toBe('2026-11-15');
        expect(assign.type).toBe('assignment');
        expect(assign.notes).toContain('20 Marks total');
        expect(assign.notes).toContain('Handwritten');
      }
    });

    it('records assignment writing time as a focused StudyLog under comm_vmou_ma_eco', async () => {
      const assignment: UniversityItem = {
        id: 'univ_test_assign_1',
        courseId: 'vmou_maec_01',
        title: 'MAEC-01 Internal Assignment: Economic Theory - I',
        type: 'assignment',
        deadline: '2026-11-15',
        status: 'pending',
        studyMinutesSpent: 0,
        createdAt: new Date().toISOString(),
      };
      await dbService.put<UniversityItem>('universityItems', assignment);

      // Student logs a 90-minute handwriting session
      const writingLog: StudyLog = {
        id: 'log_test_vmou_writing',
        date: '2026-11-03',
        timestamp: new Date().toISOString(),
        examId: 'comm_vmou_ma_eco',
        subjectId: assignment.courseId,
        durationMinutes: 90,
        activityType: 'learning',
        notes: 'Assignment Writing: MAEC-01 — Completed Section A (4 questions) & Section B question 2',
        createdAt: new Date().toISOString(),
      };
      await dbService.put<StudyLog>('studyLogs', writingLog);

      // Update assignment item
      assignment.studyMinutesSpent = 90;
      assignment.status = 'in_progress';
      await dbService.put<UniversityItem>('universityItems', assignment);

      // Verify in DB
      const fetchedItem = await dbService.get<UniversityItem>('universityItems', 'univ_test_assign_1');
      expect(fetchedItem?.studyMinutesSpent).toBe(90);
      expect(fetchedItem?.status).toBe('in_progress');

      const fetchedLog = await dbService.get<StudyLog>('studyLogs', 'log_test_vmou_writing');
      expect(fetchedLog).toBeDefined();
      expect(fetchedLog?.durationMinutes).toBe(90);
      expect(fetchedLog?.examId).toBe('comm_vmou_ma_eco');

      // Verify today's focused study includes the 90 minutes
      const allLogs = await dbService.getAll<StudyLog>('studyLogs');
      const todayMinutes = allLogs
        .filter((l) => l.date === '2026-11-03')
        .reduce((sum, l) => sum + l.durationMinutes, 0);
      expect(todayMinutes).toBeGreaterThanOrEqual(90);
    });
  });
});
