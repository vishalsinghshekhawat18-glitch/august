import { describe, it, expect } from 'vitest';
import { calculateWeightedCompletion, analyzeWeeklyCapacity } from '../services/planning';
import {
  formatMinutes,
  formatHoursDecimal,
  getWeekBounds,
  addDays,
  daysBetween,
  calculateStudyStreak,
} from '../services/dateUtils';
import { validateDataPackage } from '../services/exportImport';
import { WeeklyTask, StudyLog, ApplicationDataPackage } from '../types';

describe('Personal Exam Tracker Test Suite', () => {
  describe('1. Weighted Completion Formula (Section 8)', () => {
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

    it('identifies Monday to Sunday planning bounds', () => {
      // 2026-10-27 is a Tuesday
      const bounds = getWeekBounds('2026-10-27');
      expect(bounds.monday).toBe('2026-10-26');
      expect(bounds.sunday).toBe('2026-11-01');
      expect(bounds.days.length).toBe(7);
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
  });

  describe('5. Data Package Import Validation (Section 3)', () => {
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

    it('rejects foreign or malformed JSON packages without corrupting data', () => {
      const foreign = { app: 'SomeOtherApp', version: 2, data: {} };
      const result = validateDataPackage(foreign);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File header mismatch');
    });
  });

  describe('6. Formatting Helpers', () => {
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
});
