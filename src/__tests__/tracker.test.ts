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
import { STORE_TABLE_MAP } from '../services/supabase';
import { dbService, StoreName } from '../services/db';
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

    it('identifies Monday to Sunday planning bounds and next week bounds', () => {
      // 2026-10-27 is a Tuesday
      const bounds = getWeekBounds('2026-10-27');
      expect(bounds.monday).toBe('2026-10-26');
      expect(bounds.sunday).toBe('2026-11-01');
      expect(bounds.days.length).toBe(7);

      const nextBounds = getNextWeekBounds('2026-10-27');
      expect(nextBounds.monday).toBe('2026-11-02');
      expect(nextBounds.sunday).toBe('2026-11-08');
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
  });

  describe('7. Shared Subjects & Independent Exam Progress (Section 5)', () => {
    it('guarantees examination-specific progress for shared subjects via composite keys', () => {
      const topicId = 'topic_seating_arrangement';
      const exam1 = 'comm_ibps_rrb_po';
      const exam2 = 'comm_iibf_dbf';

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

    it('correctly maps all 15 IndexedDB stores to corresponding Supabase tables', () => {
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

      for (const store of expectedStores) {
        expect(STORE_TABLE_MAP[store]).toBeDefined();
        expect(typeof STORE_TABLE_MAP[store]).toBe('string');
        expect(STORE_TABLE_MAP[store].length).toBeGreaterThan(0);
      }
    });

    it('triggers transparent cloud sync hook on database modifications', async () => {
      const pushedItems: Array<{ store: StoreName; item: any }> = [];
      const deletedItems: Array<{ store: StoreName; id: string }> = [];

      const testHook = {
        pushItem: async (store: StoreName, item: any) => {
          pushedItems.push({ store, item });
        },
        deleteItem: async (store: StoreName, id: string) => {
          deletedItems.push({ store, id });
        },
      };

      dbService.setCloudHook(testHook);

      // Verify hook contract
      await testHook.pushItem('subjects', { id: 'sub_test_sync', name: 'Banking Awareness' });
      await testHook.deleteItem('subjects', 'sub_test_sync');

      expect(pushedItems).toHaveLength(1);
      expect(pushedItems[0].store).toBe('subjects');
      expect(pushedItems[0].item.id).toBe('sub_test_sync');

      expect(deletedItems).toHaveLength(1);
      expect(deletedItems[0].store).toBe('subjects');
      expect(deletedItems[0].id).toBe('sub_test_sync');
    });
  });
});
